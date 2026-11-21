'use client';

import { useState } from 'react';
import useSWR, { mutate as globalMutate } from 'swr';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input, Select, TextArea } from '@/components/ui/Input';
import { formatCurrency, formatDate, todayISO } from '@/utils/format';
import { api } from '@/lib/api';
import { API_BASE } from '@/lib/config';
import { Plus, Search, Trash2, Pencil, TrendingDown } from 'lucide-react';
import type { Expense, PaymentLine } from '@/lib/types';
import { PaymentBreakdown } from '@/components/ui/PaymentBreakdown';

const emptyExpense: Omit<Expense, 'id' | 'created_at'> = {
  category: '', amount: 0, date: todayISO(), payment_type: 'Cash',
  note: '', gst_amount: 0, is_gst: false,
};

export default function ExpensesPage() {
  const { data: expenses, mutate } = useSWR<Expense[]>(`${API_BASE}/expenses/`);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [form, setForm] = useState<any>(emptyExpense);
  const [paymentLines, setPaymentLines] = useState<PaymentLine[]>([{ payment_type: 'Cash', amount: 0 }]);

  const filtered = (expenses || []).filter((e) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return e.category.toLowerCase().includes(q) || e.note.toLowerCase().includes(q);
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const total = filtered.reduce((s, e) => s + Number(e.amount), 0);
  const byCategory: Record<string, number> = {};
  (expenses || []).forEach((e) => { byCategory[e.category] = (byCategory[e.category] || 0) + Number(e.amount); });

  const openAdd = () => { setEditing(null); setForm(emptyExpense); setPaymentLines([{ payment_type: 'Cash', amount: 0 }]); setModalOpen(true); };
  const openEdit = (exp: Expense) => {
    setEditing(exp);
    setForm({ ...exp });
    setPaymentLines(
      (exp.payment_lines && exp.payment_lines.length > 0)
        ? exp.payment_lines.map((pl) => ({ ...pl, amount: Number(pl.amount) }))
        : [{ payment_type: exp.payment_type, amount: Number(exp.amount) }],
    );
    setModalOpen(true);
  };

  const save = async () => {
    if (!form.category.trim() || Number(form.amount) <= 0) { alert('Please enter category and amount.'); return; }
    const validLines = paymentLines.filter((pl) => Number(pl.amount) > 0);
    const payload = {
      ...form,
      payment_type: validLines.length > 0 ? validLines[0].payment_type : 'Cash',
      payment_lines: validLines.map((pl) => ({
        payment_type: pl.payment_type, amount: pl.amount,
        reference_no: pl.reference_no || '', bank_account: pl.bank_account || null,
        date: pl.date || null,
      })),
    };
    if (editing) await api.updateExpense(editing.id, payload);
    else await api.createExpense(payload);
    setModalOpen(false);
    mutate();
    globalMutate(`${API_BASE}/dashboard/`);
  };

  const remove = async (id: number) => { if (!confirm('Delete this expense?')) return; await api.deleteExpense(id); mutate(); };
  const set = (field: string, value: string | number | boolean) => setForm((p: any) => ({ ...p, [field]: value }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-red-200 bg-red-50 p-3"><div className="flex items-center gap-1 text-xs text-red-600"><TrendingDown size={12} /> Total Expenses</div><div className="text-lg font-bold text-red-600">{formatCurrency(total, 'रू', 0)}</div></div>
        <div className="rounded-lg border border-slate-200 bg-white p-3"><div className="text-xs text-slate-500">Total Entries</div><div className="text-lg font-bold text-slate-800">{expenses?.length || 0}</div></div>
        <div className="rounded-lg border border-slate-200 bg-white p-3"><div className="text-xs text-slate-500">Categories</div><div className="text-lg font-bold text-slate-800">{Object.keys(byCategory).length}</div></div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center rounded-lg border border-slate-200 bg-white px-3 py-2"><Search size={16} className="text-slate-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search expenses..." className="ml-2 w-52 bg-transparent text-sm outline-none" /></div>
        <Button onClick={openAdd}><Plus size={16} className="inline mr-1" /> Add Expense</Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr className="text-left text-xs text-slate-500">
              <th className="px-4 py-3 font-medium">Date</th><th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Note</th><th className="px-4 py-3 font-medium">Payment Type</th>
              <th className="px-4 py-3 text-right font-medium">Amount</th><th className="px-4 py-3 text-center font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={6} className="py-12 text-center text-slate-400">No expenses recorded.</td></tr>}
            {filtered.map((e) => (
              <tr key={e.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-2.5 text-slate-500">{formatDate(e.date)}</td>
                <td className="px-4 py-2.5 font-medium text-slate-700">{e.category}</td>
                <td className="px-4 py-2.5 text-slate-500">{e.note || '-'}</td>
                <td className="px-4 py-2.5 text-slate-500">{e.payment_type}</td>
                <td className="px-4 py-2.5 text-right font-medium text-red-500">{formatCurrency(Number(e.amount), 'रू', 0)}</td>
                <td className="px-4 py-2.5"><div className="flex justify-center gap-2"><button onClick={() => openEdit(e)} className="text-slate-400 hover:text-vyapar-600"><Pencil size={15} /></button><button onClick={() => remove(e.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={15} /></button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Expense' : 'Add Expense'}
        footer={<><Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button><Button onClick={save}>Save</Button></>}>
        <div className="space-y-3">
          <Input label="Category *" value={form.category} onChange={(e) => set('category', e.target.value)} placeholder="e.g. Office Rent" />
          <div className="grid grid-cols-2 gap-3"><Input label="Amount *" type="number" value={form.amount} onChange={(e) => set('amount', +e.target.value)} /><Input label="Date" type="date" value={form.date} onChange={(e) => set('date', e.target.value)} /></div>
          <PaymentBreakdown paymentLines={paymentLines} onChange={setPaymentLines} />
          <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={form.is_gst} onChange={(e) => set('is_gst', e.target.checked)} className="rounded" /> GST Applicable</label>
          {form.is_gst && <Input label="GST Amount" type="number" value={form.gst_amount} onChange={(e) => set('gst_amount', +e.target.value)} />}
          <TextArea label="Note" rows={2} value={form.note} onChange={(e) => set('note', e.target.value)} />
        </div>
      </Modal>
    </div>
  );
}
