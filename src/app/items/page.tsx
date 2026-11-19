'use client';

import { useState } from 'react';
import useSWR, { mutate as globalMutate } from 'swr';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input, Select, TextArea } from '@/components/ui/Input';
import { formatCurrency } from '@/utils/format';
import { api } from '@/lib/api';
import { Plus, Search, Pencil, Trash2, Package, AlertTriangle } from 'lucide-react';
import type { Item, ItemUnit } from '@/lib/types';

const UNITS: ItemUnit[] = ['PCS', 'KG', 'LTR', 'MTR', 'BOX', 'SET', 'NOS', 'PAIR', 'ROLL', 'BAG'];

const emptyItem: Omit<Item, 'id' | 'created_at'> = {
  name: '', category: '', hsn: '', unit: 'PCS',
  sale_price: 0, purchase_price: 0, gst_rate: 0,
  stock: 0, min_stock: 0, barcode: '', description: '', mrp: 0,
};

export default function ItemsPage() {
  const { data: items, mutate } = useSWR<Item[]>('/api/items/', (url: string) => fetch(url).then((r) => r.json()));
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const [form, setForm] = useState<any>(emptyItem);

  const filtered = (items || []).filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.category.toLowerCase().includes(search.toLowerCase()) ||
    i.hsn.includes(search) || (i.barcode || '').includes(search)
  );

  const lowStock = (items || []).filter((i) => i.stock <= i.min_stock);

  const openAdd = () => { setEditing(null); setForm(emptyItem); setModalOpen(true); };
  const openEdit = (item: Item) => { setEditing(item); setForm({ ...item }); setModalOpen(true); };

  const save = async () => {
    if (!form.name.trim()) return;
    if (editing) await api.updateItem(editing.id, form);
    else await api.createItem(form);
    setModalOpen(false);
    mutate();
    globalMutate('/api/dashboard/');
  };

  const remove = async (id: number) => {
    if (!confirm('Delete this item?')) return;
    await api.deleteItem(id);
    mutate();
  };

  const set = (field: string, value: string | number) => setForm((p: any) => ({ ...p, [field]: value }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-3"><div className="text-xs text-slate-500">Total Items</div><div className="text-lg font-bold text-slate-800">{items?.length || 0}</div></div>
        <div className="rounded-lg border border-slate-200 bg-white p-3"><div className="text-xs text-slate-500">Stock Value</div><div className="text-lg font-bold text-slate-800">{formatCurrency((items || []).reduce((s, i) => s + i.stock * i.purchase_price, 0), '₹', 0)}</div></div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3"><div className="flex items-center gap-1 text-xs text-amber-600"><AlertTriangle size={12} /> Low Stock</div><div className="text-lg font-bold text-amber-700">{lowStock.length}</div></div>
        <div className="rounded-lg border border-slate-200 bg-white p-3"><div className="text-xs text-slate-500">Categories</div><div className="text-lg font-bold text-slate-800">{new Set((items || []).map((i) => i.category)).size}</div></div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center rounded-lg border border-slate-200 bg-white px-3 py-2">
          <Search size={16} className="text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search items..." className="ml-2 w-56 bg-transparent text-sm outline-none" />
        </div>
        <Button onClick={openAdd}><Plus size={16} className="inline mr-1" /> Add Item</Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr className="text-left text-xs text-slate-500">
              <th className="px-4 py-3 font-medium">Item Name</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">HSN</th>
              <th className="px-4 py-3 font-medium">Unit</th>
              <th className="px-4 py-3 text-right font-medium">Sale Price</th>
              <th className="px-4 py-3 text-right font-medium">Purchase</th>
              <th className="px-4 py-3 text-right font-medium">GST%</th>
              <th className="px-4 py-3 text-right font-medium">Stock</th>
              <th className="px-4 py-3 text-center font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={9} className="py-12 text-center text-slate-400"><Package size={24} className="mx-auto mb-2 opacity-50" />No items found. Click &quot;Add Item&quot; to create one.</td></tr>
            )}
            {filtered.map((item) => (
              <tr key={item.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-2.5 font-medium text-slate-700">{item.name}</td>
                <td className="px-4 py-2.5 text-slate-500">{item.category || '-'}</td>
                <td className="px-4 py-2.5 text-slate-500">{item.hsn || '-'}</td>
                <td className="px-4 py-2.5 text-slate-500">{item.unit}</td>
                <td className="px-4 py-2.5 text-right text-slate-700">{formatCurrency(item.sale_price)}</td>
                <td className="px-4 py-2.5 text-right text-slate-500">{formatCurrency(item.purchase_price)}</td>
                <td className="px-4 py-2.5 text-right text-slate-500">{item.gst_rate}%</td>
                <td className="px-4 py-2.5 text-right">
                  <span className={item.stock <= item.min_stock ? 'font-semibold text-red-500' : 'text-slate-700'}>{item.stock}</span>
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex justify-center gap-2">
                    <button onClick={() => openEdit(item)} className="text-slate-400 hover:text-vyapar-600"><Pencil size={15} /></button>
                    <button onClick={() => remove(item.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Item' : 'Add New Item'} size="lg"
        footer={<><Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button><Button onClick={save}>Save Item</Button></>}>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><Input label="Item Name *" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Cement Bag 50kg" /></div>
          <Input label="Category" value={form.category} onChange={(e) => set('category', e.target.value)} placeholder="e.g. Construction" />
          <Input label="HSN/SAC Code" value={form.hsn} onChange={(e) => set('hsn', e.target.value)} placeholder="e.g. 2523" />
          <Select label="Unit" value={form.unit} onChange={(e) => set('unit', e.target.value)}>{UNITS.map((u) => <option key={u} value={u}>{u}</option>)}</Select>
          <Input label="GST Rate (%)" type="number" value={form.gst_rate} onChange={(e) => set('gst_rate', +e.target.value)} />
          <Input label="Sale Price" type="number" value={form.sale_price} onChange={(e) => set('sale_price', +e.target.value)} />
          <Input label="Purchase Price" type="number" value={form.purchase_price} onChange={(e) => set('purchase_price', +e.target.value)} />
          <Input label="MRP" type="number" value={form.mrp} onChange={(e) => set('mrp', +e.target.value)} />
          <Input label="Opening Stock" type="number" value={form.stock} onChange={(e) => set('stock', +e.target.value)} />
          <Input label="Minimum Stock" type="number" value={form.min_stock} onChange={(e) => set('min_stock', +e.target.value)} />
          <Input label="Barcode" value={form.barcode} onChange={(e) => set('barcode', e.target.value)} />
          <div className="col-span-2"><TextArea label="Description" rows={2} value={form.description} onChange={(e) => set('description', e.target.value)} /></div>
        </div>
      </Modal>
    </div>
  );
}
