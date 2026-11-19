'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input, Select } from '@/components/ui/Input';
import { formatCurrency } from '@/utils/format';
import { api } from '@/lib/api';
import { Plus, Trash2, Wallet, Building2, Landmark, Pencil } from 'lucide-react';
import type { BankAccount, AccountType } from '@/lib/types';

const emptyAccount: Omit<BankAccount, 'id' | 'created_at'> = {
  name: '', type: 'Bank', bank_name: '', account_number: '', ifsc: '', branch: '', opening_balance: 0,
};

const typeIcons: Record<AccountType, React.ReactNode> = {
  Bank: <Building2 size={16} className="text-vyapar-600" />,
  Cash: <Wallet size={16} className="text-emerald-600" />,
  Wallet: <Wallet size={16} className="text-amber-600" />,
  Loan: <Landmark size={16} className="text-red-600" />,
};

export default function CashBankPage() {
  const { data: accounts, mutate } = useSWR<BankAccount[]>('/api/bank-accounts/', (url: string) => fetch(url).then((r) => r.json()));
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<BankAccount | null>(null);
  const [form, setForm] = useState<any>(emptyAccount);

  const totalBalance = (accounts || []).reduce((s, a) => s + Number(a.opening_balance), 0);

  const openAdd = () => { setEditing(null); setForm(emptyAccount); setModalOpen(true); };
  const openEdit = (acc: BankAccount) => { setEditing(acc); setForm({ ...acc }); setModalOpen(true); };

  const save = async () => {
    if (!form.name.trim()) return;
    if (editing) await api.updateBankAccount(editing.id, form);
    else await api.createBankAccount(form);
    setModalOpen(false);
    mutate();
  };

  const remove = async (id: number) => { if (!confirm('Delete this account?')) return; await api.deleteBankAccount(id); mutate(); };
  const set = (field: string, value: string | number) => setForm((p: any) => ({ ...p, [field]: value }));

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-gradient-to-r from-vyapar-600 to-vyapar-700 p-4 text-white">
        <div className="text-sm text-vyapar-100">Total Balance (All Accounts)</div>
        <div className="text-3xl font-bold">{formatCurrency(totalBalance, '₹', 0)}</div>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">Accounts</h3>
        <Button onClick={openAdd}><Plus size={16} className="inline mr-1" /> Add Account</Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(accounts || []).length === 0 && <div className="col-span-full py-12 text-center text-slate-400">No accounts added yet.</div>}
        {(accounts || []).map((a) => (
          <div key={a.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-slate-100 p-2">{typeIcons[a.type]}</div>
                <div>
                  <div className="font-semibold text-slate-800">{a.name}</div>
                  <div className="text-xs text-slate-400">{a.type}{a.bank_name ? ` • ${a.bank_name}` : ''}</div>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(a)} className="text-slate-400 hover:text-vyapar-600"><Pencil size={14} /></button>
                <button onClick={() => remove(a.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>
              </div>
            </div>
            <div className="mt-4 border-t border-slate-100 pt-3">
              <div className="text-xs text-slate-400">Opening Balance</div>
              <div className="text-xl font-bold text-slate-800">{formatCurrency(Number(a.opening_balance), '₹')}</div>
            </div>
            {a.account_number && <div className="mt-2 text-xs text-slate-400">A/C: {a.account_number}{a.ifsc ? ` • IFSC: ${a.ifsc}` : ''}</div>}
          </div>
        ))}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Account' : 'Add Account'}
        footer={<><Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button><Button onClick={save}>Save</Button></>}>
        <div className="space-y-3">
          <Input label="Account Name *" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. HDFC Bank" />
          <Select label="Account Type" value={form.type} onChange={(e) => set('type', e.target.value)}>
            <option value="Bank">Bank</option><option value="Cash">Cash</option><option value="Wallet">Wallet</option><option value="Loan">Loan</option>
          </Select>
          {form.type === 'Bank' && (<>
            <Input label="Bank Name" value={form.bank_name} onChange={(e) => set('bank_name', e.target.value)} />
            <Input label="Account Number" value={form.account_number} onChange={(e) => set('account_number', e.target.value)} />
            <div className="grid grid-cols-2 gap-3"><Input label="IFSC" value={form.ifsc} onChange={(e) => set('ifsc', e.target.value)} /><Input label="Branch" value={form.branch} onChange={(e) => set('branch', e.target.value)} /></div>
          </>)}
          <Input label="Opening Balance" type="number" value={form.opening_balance} onChange={(e) => set('opening_balance', +e.target.value)} />
        </div>
      </Modal>
    </div>
  );
}
