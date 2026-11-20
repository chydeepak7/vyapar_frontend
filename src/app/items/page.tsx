'use client';

import { useState } from 'react';
import useSWR, { mutate as globalMutate } from 'swr';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input, Select, TextArea } from '@/components/ui/Input';
import { formatCurrency } from '@/utils/format';
import { api } from '@/lib/api';
import { API_BASE } from '@/lib/config';
import { Plus, Search, Pencil, Trash2, Package, AlertTriangle, X } from 'lucide-react';
import type { Item, Category, Unit, ItemUnitConversion } from '@/lib/types';

const emptyItem = {
  name: '', category: null as number | null, category_name: '',
  hsn: '', unit: null as number | null, unit_name: '',
  sale_price: 0, purchase_price: 0, gst_rate: 0,
  stock: 0, min_stock: 0, barcode: '', description: '', mrp: 0,
  unit_conversions: [] as ItemUnitConversion[],
};

const emptyConversion: ItemUnitConversion = {
  unit_name: '', conversion_factor: 1, purchase_price: 0, sale_price: 0,
};

export default function ItemsPage() {
  const { data: items, mutate } = useSWR<Item[]>(`${API_BASE}/items/`);
  const { data: categories } = useSWR<Category[]>(`${API_BASE}/categories/`);
  const { data: units } = useSWR<Unit[]>(`${API_BASE}/units/`);

  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const [form, setForm] = useState<typeof emptyItem>(emptyItem);

  const filtered = (items || []).filter((i) => {
    const q = search.toLowerCase();
    return (
      i.name.toLowerCase().includes(q) ||
      i.category_name.toLowerCase().includes(q) ||
      i.hsn.includes(q) ||
      (i.barcode || '').includes(q)
    );
  });

  const lowStock = (items || []).filter((i) => i.stock <= i.min_stock);
  const uniqueCategories = new Set((items || []).map((i) => i.category).filter(Boolean)).size;

  const openAdd = () => { setEditing(null); setForm(emptyItem); setModalOpen(true); };
  const openEdit = (item: Item) => {
    setEditing(item);
    setForm({
      name: item.name,
      category: item.category,
      category_name: item.category_name,
      hsn: item.hsn,
      unit: item.unit,
      unit_name: item.unit_name,
      sale_price: item.sale_price,
      purchase_price: item.purchase_price,
      gst_rate: item.gst_rate,
      stock: item.stock,
      min_stock: item.min_stock,
      barcode: item.barcode || '',
      description: item.description || '',
      mrp: item.mrp,
      unit_conversions: (item.unit_conversions || []).map((c) => ({ ...c })),
    });
    setModalOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) return;
    if (editing) await api.updateItem(editing.id, form as any);
    else await api.createItem(form as any);
    setModalOpen(false);
    mutate();
    globalMutate(`${API_BASE}/dashboard/`);
  };

  const remove = async (id: number) => {
    if (!confirm('Delete this item?')) return;
    await api.deleteItem(id);
    mutate();
  };

  const set = (field: string, value: string | number | null) =>
    setForm((p) => ({ ...p, [field]: value }));

  const handleCategoryChange = (val: string) => {
    const id = val ? Number(val) : null;
    const cat = (categories || []).find((c) => c.id === id);
    setForm((p) => ({ ...p, category: id, category_name: cat?.name || '' }));
  };

  const handleUnitChange = (val: string) => {
    const id = val ? Number(val) : null;
    const u = (units || []).find((u) => u.id === id);
    setForm((p) => ({ ...p, unit: id, unit_name: u?.short_name || '' }));
  };

  // ── Unit conversion helpers ──────────────────────────────────────────────

  const addConversion = () =>
    setForm((p) => ({ ...p, unit_conversions: [...p.unit_conversions, { ...emptyConversion }] }));

  const removeConversion = (idx: number) =>
    setForm((p) => ({ ...p, unit_conversions: p.unit_conversions.filter((_, i) => i !== idx) }));

  const updateConversion = (idx: number, field: keyof ItemUnitConversion, value: string | number) =>
    setForm((p) => {
      const updated = [...p.unit_conversions];
      updated[idx] = { ...updated[idx], [field]: value };

      // Auto-calculate purchase/sale price when conversion_factor changes
      if (field === 'conversion_factor') {
        const f = Number(value);
        if (f > 0) {
          if (p.purchase_price > 0 && updated[idx].purchase_price === 0)
            updated[idx].purchase_price = +(p.purchase_price * f).toFixed(2);
          if (p.sale_price > 0 && updated[idx].sale_price === 0)
            updated[idx].sale_price = +(p.sale_price * f).toFixed(2);
        }
      }
      return { ...p, unit_conversions: updated };
    });

  // Auto-fill conversion prices when base price changes
  const handlePriceChange = (field: 'purchase_price' | 'sale_price', value: number) => {
    setForm((p) => ({
      ...p,
      [field]: value,
      unit_conversions: p.unit_conversions.map((c) => {
        const autoPrice = +(value * c.conversion_factor).toFixed(2);
        return {
          ...c,
          // Only auto-fill if the conversion price is still 0 (untouched)
          [field]: c[field] === 0 ? autoPrice : c[field],
        };
      }),
    }));
  };

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <div className="text-xs text-slate-500">Total Items</div>
          <div className="text-lg font-bold text-slate-800">{items?.length || 0}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <div className="text-xs text-slate-500">Stock Value</div>
          <div className="text-lg font-bold text-slate-800">
            {formatCurrency((items || []).reduce((s, i) => s + i.stock * i.purchase_price, 0), 'रू', 0)}
          </div>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
          <div className="flex items-center gap-1 text-xs text-amber-600">
            <AlertTriangle size={12} /> Low Stock
          </div>
          <div className="text-lg font-bold text-amber-700">{lowStock.length}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <div className="text-xs text-slate-500">Categories</div>
          <div className="text-lg font-bold text-slate-800">{uniqueCategories}</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center rounded-lg border border-slate-200 bg-white px-3 py-2">
          <Search size={16} className="text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items..."
            className="ml-2 w-56 bg-transparent text-sm outline-none"
          />
        </div>
        <Button onClick={openAdd}><Plus size={16} className="inline mr-1" /> Add Item</Button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr className="text-left text-xs text-slate-500">
              <th className="px-4 py-3 font-medium">Item Name</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">HSN</th>
              <th className="px-4 py-3 font-medium">Base Unit</th>
              <th className="px-4 py-3 font-medium">Alt Units</th>
              <th className="px-4 py-3 text-right font-medium">Sale Price</th>
              <th className="px-4 py-3 text-right font-medium">Purchase</th>
              <th className="px-4 py-3 text-right font-medium">GST%</th>
              <th className="px-4 py-3 text-right font-medium">Stock</th>
              <th className="px-4 py-3 text-center font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={10} className="py-12 text-center text-slate-400">
                  <Package size={24} className="mx-auto mb-2 opacity-50" />
                  No items found. Click &quot;Add Item&quot; to create one.
                </td>
              </tr>
            )}
            {filtered.map((item) => (
              <tr key={item.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-2.5 font-medium text-slate-700">{item.name}</td>
                <td className="px-4 py-2.5 text-slate-500">{item.category_name || '—'}</td>
                <td className="px-4 py-2.5 text-slate-500">{item.hsn || '—'}</td>
                <td className="px-4 py-2.5 text-slate-500">{item.unit_name || '—'}</td>
                <td className="px-4 py-2.5">
                  {(item.unit_conversions || []).length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {(item.unit_conversions || []).map((c, i) => (
                        <span key={i} className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-600">
                          {c.unit_name} ×{c.conversion_factor}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-300 text-xs">—</span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-right text-slate-700">{formatCurrency(item.sale_price)}</td>
                <td className="px-4 py-2.5 text-right text-slate-500">{formatCurrency(item.purchase_price)}</td>
                <td className="px-4 py-2.5 text-right text-slate-500">{item.gst_rate}%</td>
                <td className="px-4 py-2.5 text-right">
                  <span className={item.stock <= item.min_stock ? 'font-semibold text-red-500' : 'text-slate-700'}>
                    {item.stock}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex justify-center gap-2">
                    <button onClick={() => openEdit(item)} className="text-slate-400 hover:text-vyapar-600">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => remove(item.id)} className="text-slate-400 hover:text-red-500">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Item' : 'Add New Item'}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={save}>Save Item</Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Input label="Item Name *" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Cement Bag 50kg" />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Category</label>
            <select
              value={form.category ?? ''}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-vyapar-400 focus:ring-1 focus:ring-vyapar-200"
            >
              <option value="">Select category...</option>
              {(categories || []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <Input label="HSN/SAC Code" value={form.hsn} onChange={(e) => set('hsn', e.target.value)} placeholder="e.g. 2523" />

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Base Unit</label>
            <select
              value={form.unit ?? ''}
              onChange={(e) => handleUnitChange(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-vyapar-400 focus:ring-1 focus:ring-vyapar-200"
            >
              <option value="">Select unit...</option>
              {(units || []).map((u) => <option key={u.id} value={u.id}>{u.short_name} – {u.name}</option>)}
            </select>
          </div>

          <Input label="GST Rate (%)" type="number" value={form.gst_rate} onChange={(e) => set('gst_rate', +e.target.value)} />
          <Input
            label="Sale Price (per base unit)"
            type="number" value={form.sale_price}
            onChange={(e) => handlePriceChange('sale_price', +e.target.value)}
          />
          <Input
            label="Purchase Price (per base unit)"
            type="number" value={form.purchase_price}
            onChange={(e) => handlePriceChange('purchase_price', +e.target.value)}
          />
          <Input label="MRP" type="number" value={form.mrp} onChange={(e) => set('mrp', +e.target.value)} />
          <Input label="Opening Stock" type="number" value={form.stock} onChange={(e) => set('stock', +e.target.value)} />
          <Input label="Minimum Stock" type="number" value={form.min_stock} onChange={(e) => set('min_stock', +e.target.value)} />
          <Input label="Barcode" value={form.barcode} onChange={(e) => set('barcode', e.target.value)} />
          <div className="col-span-2">
            <TextArea label="Description" rows={2} value={form.description} onChange={(e) => set('description', e.target.value)} />
          </div>

          {/* ── Alternate Unit Conversions ─────────────────────────── */}
          <div className="col-span-2 rounded-xl border border-blue-100 bg-blue-50 p-3">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-700">
                <span>📦</span> Alternate Unit Conversions
                <span className="font-normal text-blue-500">(optional — e.g. Carton, Box, Dozen)</span>
              </div>
              <button
                type="button"
                onClick={addConversion}
                className="flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-blue-700"
              >
                <Plus size={12} /> Add Unit
              </button>
            </div>

            {form.unit_conversions.length === 0 && (
              <p className="text-center text-xs text-blue-400 py-2">
                No alternate units. Click &quot;Add Unit&quot; to define e.g. 1 Carton = 12 {form.unit_name || 'pcs'}.
              </p>
            )}

            {form.unit_conversions.map((conv, idx) => (
              <div key={idx} className="mb-2 grid grid-cols-12 gap-2 items-end rounded-lg bg-white border border-blue-100 p-2">
                {/* Unit name */}
                <div className="col-span-3">
                  <label className="mb-0.5 block text-[10px] font-medium text-slate-500">Unit Name</label>
                  <input
                    value={conv.unit_name}
                    onChange={(e) => updateConversion(idx, 'unit_name', e.target.value)}
                    placeholder="e.g. Carton"
                    className="w-full rounded border border-slate-200 px-2 py-1 text-sm outline-none focus:border-blue-400"
                  />
                </div>
                {/* Conversion factor */}
                <div className="col-span-2">
                  <label className="mb-0.5 block text-[10px] font-medium text-slate-500">
                    = ? {form.unit_name || 'pcs'}
                  </label>
                  <input
                    type="number" min={0.0001} step="any"
                    value={conv.conversion_factor}
                    onChange={(e) => updateConversion(idx, 'conversion_factor', +e.target.value)}
                    className="w-full rounded border border-slate-200 px-2 py-1 text-sm text-right outline-none focus:border-blue-400"
                  />
                </div>
                {/* Purchase price */}
                <div className="col-span-3">
                  <label className="mb-0.5 block text-[10px] font-medium text-slate-500">Purchase Price / {conv.unit_name || 'unit'}</label>
                  <input
                    type="number" min={0} step="any"
                    value={conv.purchase_price}
                    onChange={(e) => updateConversion(idx, 'purchase_price', +e.target.value)}
                    className="w-full rounded border border-slate-200 px-2 py-1 text-sm text-right outline-none focus:border-blue-400"
                  />
                </div>
                {/* Sale price */}
                <div className="col-span-3">
                  <label className="mb-0.5 block text-[10px] font-medium text-slate-500">Sale Price / {conv.unit_name || 'unit'}</label>
                  <input
                    type="number" min={0} step="any"
                    value={conv.sale_price}
                    onChange={(e) => updateConversion(idx, 'sale_price', +e.target.value)}
                    className="w-full rounded border border-slate-200 px-2 py-1 text-sm text-right outline-none focus:border-blue-400"
                  />
                </div>
                {/* Remove */}
                <div className="col-span-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeConversion(idx)}
                    className="rounded p-1 text-slate-300 hover:bg-red-50 hover:text-red-500"
                  >
                    <X size={14} />
                  </button>
                </div>
                {/* Hint row */}
                {conv.unit_name && conv.conversion_factor > 0 && (
                  <div className="col-span-12 text-[10px] text-blue-500">
                    1 {conv.unit_name} = {conv.conversion_factor} {form.unit_name || 'pcs'}
                    {conv.purchase_price > 0 && ` · Buy: रू${conv.purchase_price}/${conv.unit_name}`}
                    {conv.sale_price > 0 && ` · Sell: रू${conv.sale_price}/${conv.unit_name}`}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}
