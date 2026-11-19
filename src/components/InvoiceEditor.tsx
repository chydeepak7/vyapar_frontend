'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import useSWR, { mutate as globalMutate } from 'swr';
import { Button } from '@/components/ui/Button';
import { Input, Select, TextArea } from '@/components/ui/Input';
import { formatCurrency, todayISO, addDays, extractInvoiceNo, nextInvoiceNo, formatDate } from '@/utils/format';
import { calcLine, calcTxnTotals, isIntraState } from '@/utils/gst';
import { printTransaction, downloadTransactionPDF } from '@/utils/pdf';
import { api } from '@/lib/api';
import { Plus, Trash2, Save, Printer, Download, ArrowLeft, Package } from 'lucide-react';
import type { Transaction, TransactionLine, TxnType, PaymentType, Item, Party } from '@/lib/types';

const txnTypeLabel: Record<TxnType, string> = {
  SaleInvoice: 'Sale Invoice', PurchaseBill: 'Purchase Bill',
  PaymentIn: 'Payment In', PaymentOut: 'Payment Out',
  SaleReturn: 'Sale Return (Credit Note)', PurchaseReturn: 'Purchase Return (Debit Note)',
  Estimate: 'Estimate / Quotation', DeliveryChallan: 'Delivery Challan',
  SaleOrder: 'Sale Order', PurchaseOrder: 'Purchase Order',
};

const prefixMap: Record<TxnType, string> = {
  SaleInvoice: 'invoicePrefix', PurchaseBill: 'purchasePrefix',
  Estimate: 'estimatePrefix', PaymentIn: 'paymentInPrefix',
  PaymentOut: 'paymentOutPrefix', SaleReturn: 'creditNotePrefix',
  PurchaseReturn: 'debitNotePrefix', DeliveryChallan: 'invoicePrefix',
  SaleOrder: 'invoicePrefix', PurchaseOrder: 'purchasePrefix',
};

interface Props {
  txnType: TxnType;
  txnId?: number;
}

export function InvoiceEditor({ txnType, txnId }: Props) {
  const router = useRouter();
  const { data: business } = useSWR('/api/business/', (url: string) => fetch(url).then((r) => r.json()).then((a: any[]) => a?.[0]));
  const { data: settings } = useSWR('/api/settings/', (url: string) => fetch(url).then((r) => r.json()).then((a: any[]) => a?.[0]));
  const { data: parties } = useSWR<Party[]>('/api/parties/', (url: string) => fetch(url).then((r) => r.json()));
  const { data: items } = useSWR<Item[]>('/api/items/', (url: string) => fetch(url).then((r) => r.json()));
  const { data: allTxns } = useSWR<Transaction[]>('/api/transactions/', (url: string) => fetch(url).then((r) => r.json()));

  const cur = business?.currency || '₹';
  const [lines, setLines] = useState<TransactionLine[]>([]);
  const [partyId, setPartyId] = useState<number>(0);
  const [date, setDate] = useState(todayISO());
  const [dueDate, setDueDate] = useState(addDays(todayISO(), 30));
  const [invoiceNo, setInvoiceNo] = useState('');
  const [paymentType, setPaymentType] = useState<PaymentType>('Credit');
  const [txnDiscount, setTxnDiscount] = useState(0);
  const [additionalCharges, setAdditionalCharges] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState('Payment due within 30 days');
  const [stateOfSupply, setStateOfSupply] = useState(business?.state || '');
  const [reverseCharge, setReverseCharge] = useState(false);
  const [isGst, setIsGst] = useState(true);

  // Load existing for edit
  useEffect(() => {
    if (txnId && allTxns) {
      const txn = allTxns.find((t) => t.id === txnId);
      if (txn) {
        setLines(txn.lines.map((l) => ({ ...l })));
        setPartyId(txn.party || 0);
        setDate(txn.date);
        setDueDate(txn.due_date || addDays(todayISO(), 30));
        setInvoiceNo(txn.invoice_no);
        setPaymentType(txn.payment_type);
        setTxnDiscount(Number(txn.discount_amount));
        setAdditionalCharges(Number(txn.additional_charges));
        setPaidAmount(Number(txn.paid_amount));
        setNotes(txn.notes || '');
        setTerms(txn.terms || '');
        setStateOfSupply(txn.state_of_supply || business?.state || '');
        setReverseCharge(txn.reverse_charge);
        setIsGst(txn.is_gst);
      }
    }
  }, [txnId, allTxns, business]);

  // Generate next invoice number
  useEffect(() => {
    if (!invoiceNo && settings && allTxns) {
      const prefixKey = prefixMap[txnType];
      const prefix = (settings as any)[prefixKey] || 'INV';
      const sameType = allTxns.filter((t) => t.type === txnType);
      const maxNum = sameType.reduce((max, t) => Math.max(max, extractInvoiceNo(t.invoice_no)), 0);
      setInvoiceNo(nextInvoiceNo(prefix, maxNum));
    }
  }, [settings, allTxns, txnType, invoiceNo]);

  const selectedParty = parties?.find((p) => p.id === partyId);

  const interState = useMemo(() => {
    if (!business || !selectedParty) return false;
    const partyState = selectedParty.billing_address?.split(',').pop()?.trim() || '';
    return !isIntraState(business.state, partyState);
  }, [business, selectedParty]);

  const totals = useMemo(() => {
    return calcTxnTotals(lines, interState, txnDiscount, additionalCharges, settings?.round_off ?? true);
  }, [lines, interState, txnDiscount, additionalCharges, settings]);

  const balanceAmount = Math.max(0, (isGst ? totals.totalAmount : totals.subTotal + totals.additionalCharges) - paidAmount);

  const addLine = () => {
    const newItem = items?.[0];
    if (!newItem) return;
    const rate = txnType === 'PurchaseBill' ? newItem.purchase_price : newItem.sale_price;
    setLines((prev) => [...prev, {
      item: newItem.id, item_name: newItem.name, hsn: newItem.hsn,
      qty: 1, free_qty: 0, unit: newItem.unit, rate,
      discount_percent: 0, gst_rate: isGst ? newItem.gst_rate : 0, amount: rate,
    }]);
  };

  const updateLine = (index: number, field: keyof TransactionLine, value: string | number) => {
    setLines((prev) => {
      const updated = [...prev];
      const line: TransactionLine = { ...updated[index], [field]: value };
      line.amount = calcLine(line).amount;
      updated[index] = line;
      return updated;
    });
  };

  const onItemChange = (index: number, itemId: number) => {
    const item = items?.find((i) => i.id === Number(itemId));
    if (!item) return;
    setLines((prev) => {
      const updated = [...prev];
      const rate = txnType === 'PurchaseBill' ? item.purchase_price : item.sale_price;
      const line: TransactionLine = {
        ...updated[index], item: item.id, item_name: item.name,
        hsn: item.hsn, unit: item.unit, rate, gst_rate: isGst ? item.gst_rate : 0,
      };
      line.amount = calcLine(line).amount;
      updated[index] = line;
      return updated;
    });
  };

  const removeLine = (index: number) => setLines((prev) => prev.filter((_, i) => i !== index));

  const save = async (thenPrint: boolean) => {
    if (!selectedParty || lines.length === 0) {
      alert('Please select a party and add at least one item.');
      return;
    }
    const totalAmount = isGst ? totals.totalAmount : totals.subTotal + totals.additionalCharges;
    const payload: any = {
      type: txnType, invoice_no: invoiceNo, party: selectedParty.id,
      party_name: selectedParty.name, date, due_date: dueDate || null,
      lines: lines.map((l) => ({
        item: l.item, item_name: l.item_name, hsn: l.hsn, qty: l.qty,
        free_qty: l.free_qty, unit: l.unit, rate: l.rate,
        discount_percent: l.discount_percent, gst_rate: l.gst_rate, amount: l.amount,
      })),
      sub_total: totals.subTotal, discount_amount: totals.discountAmount,
      additional_charges: totals.additionalCharges, round_off: totals.roundOff,
      cgst: isGst ? totals.cgst : 0, sgst: isGst ? totals.sgst : 0,
      igst: isGst ? totals.igst : 0, cess: 0,
      total_amount: totalAmount, paid_amount: paidAmount,
      balance_amount: balanceAmount, payment_type: paymentType,
      notes, terms, state_of_supply: stateOfSupply,
      reverse_charge: reverseCharge, is_gst: isGst,
    };

    let saved: Transaction;
    if (txnId) {
      saved = await api.updateTransaction(txnId, payload);
    } else {
      saved = await api.createTransaction(payload);
    }

    globalMutate('/api/transactions/');
    globalMutate('/api/dashboard/');
    globalMutate('/api/items/');
    globalMutate('/api/party-balances/');

    if (thenPrint && business) {
      printTransaction(saved, business);
    }
    router.back();
  };

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><ArrowLeft size={20} /></button>
          <h2 className="text-lg font-semibold text-slate-800">{txnId ? 'Edit' : 'New'} {txnTypeLabel[txnType]}</h2>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => save(false)}><Save size={15} className="mr-1" /> Save</Button>
          <Button variant="outline" size="sm" onClick={() => save(true)}><Printer size={15} className="mr-1" /> Save &amp; Print</Button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Input label="Invoice No" value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} />
          <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          {(txnType === 'SaleInvoice' || txnType === 'PurchaseBill') && (
            <Input label="Due Date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          )}
          <Select label="Payment Type" value={paymentType} onChange={(e) => setPaymentType(e.target.value as PaymentType)}>
            <option value="Credit">Credit</option><option value="Cash">Cash</option><option value="Cheque">Cheque</option><option value="UPI">UPI</option><option value="Bank Transfer">Bank Transfer</option>
          </Select>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Select label="Party *" value={partyId} onChange={(e) => setPartyId(+e.target.value)}>
            <option value={0}>Select party...</option>
            {parties?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
          {selectedParty && (
            <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
              <div className="font-medium text-slate-700">{selectedParty.name}</div>
              <div>{selectedParty.phone}</div>
              {selectedParty.gstin && <div>GSTIN: {selectedParty.gstin}</div>}
              <div>{selectedParty.billing_address}</div>
            </div>
          )}
          <Select label="State of Supply" value={stateOfSupply} onChange={(e) => setStateOfSupply(e.target.value)}>
            {['Karnataka', 'Maharashtra', 'Tamil Nadu', 'Delhi', 'Gujarat', 'Telangana', 'West Bengal', 'Uttar Pradesh', 'Rajasthan', 'Kerala', 'Other'].map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
        </div>
        <div className="mt-3 flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={isGst} onChange={(e) => setIsGst(e.target.checked)} className="rounded" /> GST Applicable</label>
          <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={reverseCharge} onChange={(e) => setReverseCharge(e.target.checked)} className="rounded" /> Reverse Charge</label>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h3 className="text-sm font-semibold text-slate-700">Items</h3>
          <Button size="sm" variant="secondary" onClick={addLine}><Plus size={14} className="mr-1" /> Add Item</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs text-slate-500">
                <th className="px-3 py-2 font-medium">Item</th><th className="px-3 py-2 font-medium">HSN</th>
                <th className="px-3 py-2 text-right font-medium">Qty</th><th className="px-3 py-2 font-medium">Unit</th>
                <th className="px-3 py-2 text-right font-medium">Rate</th><th className="px-3 py-2 text-right font-medium">Disc%</th>
                <th className="px-3 py-2 text-right font-medium">GST%</th><th className="px-3 py-2 text-right font-medium">Amount</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {lines.length === 0 && (
                <tr><td colSpan={9} className="py-8 text-center text-slate-400"><Package size={20} className="mx-auto mb-1 opacity-50" />No items added. Click &quot;Add Item&quot; to start.</td></tr>
              )}
              {lines.map((line, idx) => (
                <tr key={idx} className="border-t border-slate-100">
                  <td className="px-3 py-1.5">
                    <select value={line.item || ''} onChange={(e) => onItemChange(idx, +e.target.value)} className="w-40 rounded border border-slate-200 px-2 py-1 text-sm outline-none focus:border-vyapar-500">
                      {items?.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-1.5"><input value={line.hsn} onChange={(e) => updateLine(idx, 'hsn', e.target.value)} className="w-20 rounded border border-slate-200 px-2 py-1 text-sm outline-none focus:border-vyapar-500" /></td>
                  <td className="px-3 py-1.5"><input type="number" value={line.qty} onChange={(e) => updateLine(idx, 'qty', +e.target.value)} className="w-16 rounded border border-slate-200 px-2 py-1 text-right text-sm outline-none focus:border-vyapar-500" /></td>
                  <td className="px-3 py-1.5 text-slate-500">{line.unit}</td>
                  <td className="px-3 py-1.5"><input type="number" value={line.rate} onChange={(e) => updateLine(idx, 'rate', +e.target.value)} className="w-20 rounded border border-slate-200 px-2 py-1 text-right text-sm outline-none focus:border-vyapar-500" /></td>
                  <td className="px-3 py-1.5"><input type="number" value={line.discount_percent} onChange={(e) => updateLine(idx, 'discount_percent', +e.target.value)} className="w-16 rounded border border-slate-200 px-2 py-1 text-right text-sm outline-none focus:border-vyapar-500" /></td>
                  <td className="px-3 py-1.5"><input type="number" value={line.gst_rate} onChange={(e) => updateLine(idx, 'gst_rate', +e.target.value)} disabled={!isGst} className="w-16 rounded border border-slate-200 px-2 py-1 text-right text-sm outline-none focus:border-vyapar-500 disabled:bg-slate-50" /></td>
                  <td className="px-3 py-1.5 text-right font-medium text-slate-700">{formatCurrency(line.amount, cur)}</td>
                  <td className="px-3 py-1.5"><button onClick={() => removeLine(idx)} className="text-slate-300 hover:text-red-500"><Trash2 size={15} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end border-t border-slate-100 p-4">
          <div className="w-72 space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span className="font-medium text-slate-700">{formatCurrency(totals.subTotal, cur)}</span></div>
            <div className="flex items-center justify-between"><span className="text-slate-500">Transaction Discount</span><input type="number" value={txnDiscount} onChange={(e) => setTxnDiscount(+e.target.value)} className="w-20 rounded border border-slate-200 px-2 py-1 text-right text-sm outline-none focus:border-vyapar-500" /></div>
            <div className="flex items-center justify-between"><span className="text-slate-500">Additional Charges</span><input type="number" value={additionalCharges} onChange={(e) => setAdditionalCharges(+e.target.value)} className="w-20 rounded border border-slate-200 px-2 py-1 text-right text-sm outline-none focus:border-vyapar-500" /></div>
            {isGst && (interState ? (
              <div className="flex justify-between"><span className="text-slate-500">IGST</span><span className="font-medium text-slate-700">{formatCurrency(totals.igst, cur)}</span></div>
            ) : (<>
              <div className="flex justify-between"><span className="text-slate-500">CGST</span><span className="font-medium text-slate-700">{formatCurrency(totals.cgst, cur)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">SGST</span><span className="font-medium text-slate-700">{formatCurrency(totals.sgst, cur)}</span></div>
            </>))}
            {totals.roundOff !== 0 && <div className="flex justify-between"><span className="text-slate-500">Round Off</span><span className="font-medium text-slate-700">{formatCurrency(totals.roundOff, cur)}</span></div>}
            <div className="flex justify-between border-t border-slate-200 pt-1.5"><span className="font-semibold text-slate-800">Total Amount</span><span className="text-lg font-bold text-vyapar-700">{formatCurrency(isGst ? totals.totalAmount : totals.subTotal + totals.additionalCharges, cur)}</span></div>
            <div className="flex items-center justify-between pt-1"><span className="text-slate-500">Paid Amount</span><input type="number" value={paidAmount} onChange={(e) => setPaidAmount(+e.target.value)} className="w-20 rounded border border-slate-200 px-2 py-1 text-right text-sm outline-none focus:border-vyapar-500" /></div>
            <div className="flex justify-between"><span className="text-slate-500">Balance</span><span className={`font-medium ${balanceAmount > 0 ? 'text-red-500' : 'text-emerald-600'}`}>{formatCurrency(balanceAmount, cur)}</span></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><TextArea label="Notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Additional notes..." /></div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><TextArea label="Terms & Conditions" rows={3} value={terms} onChange={(e) => setTerms(e.target.value)} /></div>
      </div>
    </div>
  );
}
