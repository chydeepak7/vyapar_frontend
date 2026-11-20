'use client';

import { useState } from 'react';
import useSWR, { mutate as globalMutate } from 'swr';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input, Select } from '@/components/ui/Input';
import { formatCurrency } from '@/utils/format';
import { api } from '@/lib/api';
import { API_BASE } from '@/lib/config';
import { Plus, Search, Pencil, Trash2, Building2, ArrowUpCircle } from 'lucide-react';
import type { Party, PartyBalance } from '@/lib/types';

const emptySupplier: Omit<Party, 'id' | 'created_at'> = {
  name: '', type: 'Supplier', phone: '', email: '', gstin: '',
  billing_address: '', shipping_address: '', opening_balance: 0,
  balance_type: 'To Pay', group: '', credit_limit: 0, payment_terms: '',
};

export default function SuppliersPage() {
  const { data: parties } = useSWR<Party[]>(
    `${API_BASE}/parties/`
  );
  const { data: balances, mutate } = useSWR<PartyBalance[]>(
    `${API_BASE}/party-balances/`
  );

  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Party | null>(null);
  const [form, setForm] = useState<Omit<Party, 'id' | 'created_at'>>(emptySupplier);

  // Only suppliers (type Supplier or Both)
  const supplierBalances = (balances || []).filter(
    (b) => b.type === 'Supplier' || b.type === 'Both',
  );

  const filtered = supplierBalances.filter(
    (b) =>
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.phone.includes(search) ||
      b.gstin.toLowerCase().includes(search.toLowerCase()),
  );

  const totalPayable = supplierBalances.reduce((s, b) => s + b.payable, 0);

  const openAdd = () => { setEditing(null); setForm(emptySupplier); setModalOpen(true); };
  const openEdit = (party: Party) => {
    setEditing(party);
    setForm({ ...party });
    setModalOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) return;
    if (editing) await api.updateParty(editing.id, form);
    else await api.createParty(form);
    setModalOpen(false);
    mutate();
    globalMutate(`${API_BASE}/party-balances/`);
  };

  const remove = async (id: number) => {
    if (!confirm('Delete this supplier?')) return;
    await api.deleteParty(id);
    mutate();
  };

  const set = (field: string, value: string | number) =>
    setForm((p) => ({ ...p, [field]: value }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-800">Suppliers</h1>
          <p className="text-sm text-slate-500">Manage your suppliers and their payment terms.</p>
        </div>
        <Button onClick={openAdd}><Plus size={16} className="inline mr-1" /> Add Supplier</Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <Building2 size={12} /> Total Suppliers
          </div>
          <div className="text-lg font-bold text-slate-800">{supplierBalances.length}</div>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <div className="flex items-center gap-1 text-xs text-red-600">
            <ArrowUpCircle size={12} /> Total Payable
          </div>
          <div className="text-lg font-bold text-red-600">{formatCurrency(totalPayable, 'रू', 0)}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <div className="text-xs text-slate-500">With Outstanding</div>
          <div className="text-lg font-bold text-slate-800">
            {supplierBalances.filter((b) => b.payable > 0).length}
          </div>
        </div>
      </div>

      <div className="flex items-center rounded-lg border border-slate-200 bg-white px-3 py-2 w-fit">
        <Search size={16} className="text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search suppliers..."
          className="ml-2 w-56 bg-transparent text-sm outline-none"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr className="text-left text-xs text-slate-500">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">GSTIN</th>
              <th className="px-4 py-3 font-medium">Group</th>
              <th className="px-4 py-3 font-medium">Payment Terms</th>
              <th className="px-4 py-3 text-right font-medium">Payable</th>
              <th className="px-4 py-3 text-center font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  <Building2 size={24} className="mx-auto mb-2 opacity-50" />
                  No suppliers found.
                </td>
              </tr>
            )}
            {filtered.map((b) => {
              const party = (parties || []).find((p) => p.id === b.id);
              return (
                <tr key={b.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-2.5 font-medium text-slate-700">{b.name}</td>
                  <td className="px-4 py-2.5 text-slate-500">{b.phone || '—'}</td>
                  <td className="px-4 py-2.5 text-slate-500">{b.gstin || '—'}</td>
                  <td className="px-4 py-2.5 text-slate-500">{b.group || '—'}</td>
                  <td className="px-4 py-2.5 text-slate-500">{party?.payment_terms || '—'}</td>
                  <td className="px-4 py-2.5 text-right">
                    {b.payable > 0
                      ? <span className="font-medium text-red-500">{formatCurrency(b.payable, 'रू', 0)}</span>
                      : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex justify-center gap-2">
                      {party && (
                        <button onClick={() => openEdit(party)} className="text-slate-400 hover:text-vyapar-600">
                          <Pencil size={15} />
                        </button>
                      )}
                      <button onClick={() => remove(b.id)} className="text-slate-400 hover:text-red-500">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Supplier' : 'Add Supplier'}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={save}>Save Supplier</Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Input label="Supplier Name *" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Shree Enterprises" />
          </div>
          <Select label="Type" value={form.type} onChange={(e) => set('type', e.target.value)}>
            <option value="Supplier">Supplier</option>
            <option value="Both">Supplier & Customer</option>
          </Select>
          <Input label="Phone" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
          <Input label="Email" value={form.email} onChange={(e) => set('email', e.target.value)} />
          <Input label="GSTIN" value={form.gstin} onChange={(e) => set('gstin', e.target.value)} />
          <Input label="Group" value={form.group || ''} onChange={(e) => set('group', e.target.value)} placeholder="e.g. Raw Materials" />
          <Input label="Payment Terms" value={form.payment_terms} onChange={(e) => set('payment_terms', e.target.value)} placeholder="e.g. Net 30, Advance" />
          <Input label="Opening Balance" type="number" value={form.opening_balance} onChange={(e) => set('opening_balance', +e.target.value)} />
          <Select label="Balance Type" value={form.balance_type} onChange={(e) => set('balance_type', e.target.value)}>
            <option value="To Pay">To Pay</option>
            <option value="To Receive">To Receive</option>
          </Select>
          <Input label="Billing Address" value={form.billing_address} onChange={(e) => set('billing_address', e.target.value)} />
          <Input label="Shipping Address" value={form.shipping_address} onChange={(e) => set('shipping_address', e.target.value)} />
        </div>
      </Modal>
    </div>
  );
}
