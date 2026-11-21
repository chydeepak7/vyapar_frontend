'use client';

import { useState, useEffect } from 'react';
import useSWR, { mutate as globalMutate } from 'swr';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input, Select, TextArea } from '@/components/ui/Input';
import { formatCurrency, formatDate, todayISO, nextInvoiceNo, extractInvoiceNo } from '@/utils/format';
import { printTransaction } from '@/utils/pdf';
import { api, firstRecord } from '@/lib/api';
import { authHeaders } from '@/lib/auth';
import { Plus, Search, Printer, Trash2, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import type { TxnType, PaymentType, PaymentLine, Party, Transaction, BusinessProfile, Settings } from '@/lib/types';
import { PaymentBreakdown } from '@/components/ui/PaymentBreakdown';
import { API_BASE } from '@/lib/config';

interface Props {
  txnType: 'PaymentIn' | 'PaymentOut';
}

export function Payments({ txnType }: Props) {
  const isIn = txnType === 'PaymentIn';
  const { data: businessList } = useSWR(`${API_BASE}/business/`);
  const { data: settingsList } = useSWR(`${API_BASE}/settings/`);
  const business = firstRecord<BusinessProfile>(businessList);
  const settings = firstRecord<Settings>(settingsList);
  const { data: parties } = useSWR<Party[]>(`${API_BASE}/parties/`, (url: string) => fetch(url, { headers: { ...authHeaders() } }).then((r) => r.json()));
  const { data: transactions, mutate } = useSWR<Transaction[]>(
    `${API_BASE}/transactions/?type=${txnType}`,
    (url: string) => fetch(url, { headers: { ...authHeaders() } }).then((r) => r.json())
  );
  const { data: allTxns } = useSWR<Transaction[]>(`${API_BASE}/transactions/`, (url: string) => fetch(url, { headers: { ...authHeaders() } }).then((r) => r.json()));

  const cur = business?.currency || 'रू';
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    partyId: 0, date: todayISO(),
    note: '', invoiceNo: '', linkedInvoiceId: 0,
  });
  const [paymentLines, setPaymentLines] = useState<PaymentLine[]>([
    { payment_type: 'Cash', amount: 0 },
  ]);

  useEffect(() => {
    if (modalOpen && settings) {
      const prefix = isIn ? settings.payment_in_prefix : settings.payment_out_prefix;
      const same = (allTxns || []).filter((t) => t.type === txnType);
      const maxNum = same.reduce((max, t) => Math.max(max, extractInvoiceNo(t.invoice_no)), 0);
      setForm((f) => ({ ...f, invoiceNo: nextInvoiceNo(prefix, maxNum) }));
    }
  }, [modalOpen, settings, isIn, allTxns, txnType]);

  const payments = (transactions || []).filter((t) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return t.invoice_no.toLowerCase().includes(q) || t.party_name.toLowerCase().includes(q);
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const total = payments.reduce((s, t) => s + Number(t.paid_amount), 0);

  const total = paymentLines.reduce((s, pl) => s + (Number(pl.amount) || 0), 0);

  const openAdd = () => {
    setForm({ partyId: 0, date: todayISO(), note: '', invoiceNo: '', linkedInvoiceId: 0 });
    setPaymentLines([{ payment_type: 'Cash', amount: 0 }]);
    setModalOpen(true);
  };

  const save = async () => {
    if (!form.partyId || total <= 0) { alert('Please select a party and enter an amount.'); return; }
    const party = parties?.find((p) => p.id === form.partyId);
    if (!party) return;
    const validLines = paymentLines.filter((pl) => Number(pl.amount) > 0);
    await api.createTransaction({
      type: txnType, invoice_no: form.invoiceNo, party: form.partyId,
      party_name: party.name, date: form.date, lines: [],
      sub_total: 0, discount_amount: 0, additional_charges: 0, round_off: 0,
      cgst: 0, sgst: 0, igst: 0, cess: 0,
      total_amount: total, paid_amount: total, balance_amount: 0,
      payment_type: validLines.length > 0 ? validLines[0].payment_type : 'Cash',
      payment_lines: validLines.map((pl) => ({
        payment_type: pl.payment_type,
        amount: pl.amount,
        reference_no: pl.reference_no || '',
        bank_account: pl.bank_account || null,
        date: pl.date || null,
      })),
      notes: form.note, is_gst: false,
    } as any);

    if (form.linkedInvoiceId) {
      const inv = allTxns?.find((t) => t.id === form.linkedInvoiceId);
      if (inv) {
        const newPaid = Number(inv.paid_amount) + total;
        const newBalance = Math.max(0, Number(inv.total_amount) - newPaid);
        await api.updateTransaction(inv.id, { paid_amount: newPaid, balance_amount: newBalance });
      }
    }

    setModalOpen(false);
    mutate();
    globalMutate(`${API_BASE}/transactions/`);
    globalMutate(`${API_BASE}/dashboard/`);
    globalMutate(`${API_BASE}/party-balances/`);
  };

  const remove = async (id: number) => {
    if (!confirm('Delete this payment?')) return;
    await api.deleteTransaction(id);
    mutate();
  };

  const unpaidInvoices = (allTxns || []).filter((t) =>
    isIn ? t.type === 'SaleInvoice' && Number(t.balance_amount) > 0 : t.type === 'PurchaseBill' && Number(t.balance_amount) > 0
  );

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-2">
          {isIn ? <ArrowDownToLine className="text-emerald-500" size={20} /> : <ArrowUpFromLine className="text-red-500" size={20} />}
          <span className="text-sm text-slate-500">Total {isIn ? 'Received' : 'Paid'}</span>
          <span className="ml-auto text-xl font-bold text-slate-800">{formatCurrency(total, cur, 0)}</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center rounded-lg border border-slate-200 bg-white px-3 py-2">
          <Search size={16} className="text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="ml-2 w-52 bg-transparent text-sm outline-none" />
        </div>
        <Button onClick={openAdd}><Plus size={16} className="inline mr-1" /> Add {isIn ? 'Payment-In' : 'Payment-Out'}</Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr className="text-left text-xs text-slate-500">
              <th className="px-4 py-3 font-medium">No.</th><th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Party</th><th className="px-4 py-3 font-medium">Payment Type</th>
              <th className="px-4 py-3 text-right font-medium">Amount</th><th className="px-4 py-3 text-center font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 && <tr><td colSpan={6} className="py-12 text-center text-slate-400">No {isIn ? 'payments received' : 'payments made'} yet.</td></tr>}
            {payments.map((t) => (
              <tr key={t.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-2.5 font-medium text-vyapar-700">{t.invoice_no}</td>
                <td className="px-4 py-2.5 text-slate-500">{formatDate(t.date)}</td>
                <td className="px-4 py-2.5 text-slate-700">{t.party_name}</td>
                <td className="px-4 py-2.5 text-slate-500">{t.payment_type}</td>
                <td className="px-4 py-2.5 text-right font-medium text-slate-700">{formatCurrency(Number(t.paid_amount), cur, 0)}</td>
                <td className="px-4 py-2.5">
                  <div className="flex justify-center gap-2">
                    {business && <button onClick={() => printTransaction(t, business)} className="text-slate-400 hover:text-vyapar-600"><Printer size={15} /></button>}
                    <button onClick={() => remove(t.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={`New ${isIn ? 'Payment-In' : 'Payment-Out'}`}
        footer={<><Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button><Button onClick={save}>Save</Button></>}>
        <div className="space-y-3">
          <Select label="Party *" value={form.partyId} onChange={(e) => setForm({ ...form, partyId: +e.target.value })}>
            <option value={0}>Select party...</option>
            {parties?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Total Amount" type="number" value={total} readOnly className="bg-slate-50" />
            <Input label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <PaymentBreakdown paymentLines={paymentLines} onChange={setPaymentLines} />
          {unpaidInvoices.length > 0 && (
            <Select label="Link to Invoice (Optional)" value={form.linkedInvoiceId} onChange={(e) => setForm({ ...form, linkedInvoiceId: +e.target.value })}>
              <option value={0}>None</option>
              {unpaidInvoices.map((inv) => <option key={inv.id} value={inv.id}>{inv.invoice_no} - {inv.party_name} (Bal: {formatCurrency(Number(inv.balance_amount), cur, 0)})</option>)}
            </Select>
          )}
          <TextArea label="Note" rows={2} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
        </div>
      </Modal>
    </div>
  );
}
