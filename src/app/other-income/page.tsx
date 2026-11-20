'use client';

import { useState } from 'react';
import useSWR, { mutate as globalMutate } from 'swr';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input, Select, TextArea } from '@/components/ui/Input';
import { formatCurrency, formatDate, todayISO } from '@/utils/format';
import { api } from '@/lib/api';
import { API_BASE } from '@/lib/config';
import { Plus, Search, Trash2, Pencil, TrendingUp } from 'lucide-react';
import type { OtherIncome as OtherIncomeType, PaymentType } from '@/lib/types';

const emptyIncome: Omit<OtherIncomeType, 'id' | 'created_at'> = {
  category: '', amount: 0, date: todayISO(), payment_type: 'Cash', note: '',
};

export default function OtherIncomePage() {
  const { data: incomes, mutate } = useSWR<OtherIncomeType[]>(`${API_BASE}/other-incomes/`, (url: string) => fetch(url).then((r) => r.json()));
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<OtherIncomeType | null>(null);
  const [form, setForm] = useState<any>(emptyIncome);

  const filtered = (incomes || []).filter((i) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return i.category.toLowerCase().includes(q) || i.note.toLowerCase().includes(q);
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const total = filtered.reduce((s, i) => s + Number(i.amount), 0);
  const byCategory: Record<string, number> = {};
  (incomes || []).forEach((i) => { byCategory[i.category] = (byCategory[i.category] || 0) + Number(i.amount); });

  const openAdd = () => { setEditing(null); setForm(emptyIncome); setModalOpen(true); };
  const openEdit = (inc: OtherIncomeType) => { setEditing(inc); setForm({ ...inc }); setModalOpen(true); };

  const save = async () => {
    if (!form.category.trim() || Number(form.amount) <= 0) { alert('Please enter category and amount.'); return; }
    if (editing) await api.updateOtherIncome(editing.id, form);
    else await api.createOtherIncome(form);
    setModalOpen(false);
    mutate();
    globalMutate(`${API_BASE}/dashboard/`);
  };

  const remove = async (id: number) => { if (!confirm('Delete this income record?')) return; await api.deleteOtherIncome(id); mutate(); };
  const set = (field: string, value: string | number | boolean) => setForm((p: any) => ({ ...p, [field]: value }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3"><div className="flex items-center gap-1 text-xs text-emerald-600"><TrendingUp size={12} /> Total Other Income</div><div className="text-lg font-bold text-emerald-600">{formatCurrency(total, 'रू', 0)}</div></div>
        <div className="rounded-lg border border-slate-200 bg-white p-3"><div className="text-xs text-slate-500">Total Entries</div><div className="text-lg font-bold text-slate-800">{incomes?.length || 0}</div></div>
        <div className="rounded-lg border border-slate-200 bg-white p-3"><div className="text-xs text-slate-500">Categories</div><div className="text-lg font-bold text-slate-800">{Object.keys(byCategory).length}</div></div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center rounded-lg border border-slate-200 bg-white px-3 py-2"><Search size={16} className="text-slate-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search income..." className="ml-2 w-52 bg-transparent text-sm outline-none" /></div>
        <Button onClick={openAdd}><Plus size={16} className="inline mr-1" /> Add Income</Button>
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
            {filtered.length === 0 && <tr><td colSpan={6} className="py-12 text-center text-slate-400">No other income recorded.</td></tr>}
            {filtered.map((i) => (
              <tr key={i.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-2.5 text-slate-500">{formatDate(i.date)}</td>
                <td className="px-4 py-2.5 font-medium text-slate-700">{i.category}</td>
                <td className="px-4 py-2.5 text-slate-500">{i.note || '-'}</td>
                <td className="px-4 py-2.5 text-slate-500">{i.payment_type}</td>
                <td className="px-4 py-2.5 text-right font-medium text-emerald-600">{formatCurrency(Number(i.amount), 'रू', 0)}</td>
                <td className="px-4 py-2.5"><div className="flex justify-center gap-2"><button onClick={() => openEdit(i)} className="text-slate-400 hover:text-vyapar-600"><Pencil size={15} /></button><button onClick={() => remove(i.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={15} /></button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Income' : 'Add Other Income'}
        footer={<><Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button><Button onClick={save}>Save</Button></>}>
        <div className="space-y-3">
          <Input label="Category *" value={form.category} onChange={(e) => set('category', e.target.value)} placeholder="e.g. Interest, Commission" />
          <div className="grid grid-cols-2 gap-3"><Input label="Amount *" type="number" value={form.amount} onChange={(e) => set('amount', +e.target.value)} /><Input label="Date" type="date" value={form.date} onChange={(e) => set('date', e.target.value)} /></div>
          <Select label="Payment Type" value={form.payment_type} onChange={(e) => set('payment_type', e.target.value as PaymentType)}><option value="Cash">Cash</option><option value="Cheque">Cheque</option><option value="UPI">UPI</option><option value="Bank Transfer">Bank Transfer</option></Select>
          <TextArea label="Note" rows={2} value={form.note} onChange={(e) => set('note', e.target.value)} />
        </div>
      </Modal>
    </div>
  );
}
