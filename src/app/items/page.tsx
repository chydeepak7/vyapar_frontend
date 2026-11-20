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
import type { Item, Category, Unit } from '@/lib/types';
import { largestConversion, splitByFactor, stockPair, stockPairLabel, trimQty, type ConvRow } from '@/utils/stockUnits';

const emptyItem = {
  name: '', category: null as number | null, category_name: '',
  hsn: '', unit: null as number | null, unit_name: '',
  sale_price: 0, purchase_price: 0, gst_rate: 0,
  stock: 0, min_stock: 0, barcode: '', description: '', mrp: 0,
  unit_conversions: [] as ConvRow[],
};

const emptyConversion: ConvRow = {
  unit_id: null, unit_name: '', conversion_factor: 1,
};

function matchUnit(units: Unit[] | undefined, name: string) {
  const key = name.trim().toLowerCase();
  return (units || []).find(
    (u) => u.short_name.toLowerCase() === key || u.name.toLowerCase() === key,
  );
}

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
    const convs = item.unit_conversions || [];
    const primary = largestConversion(convs);
    if (!primary) {
      setForm({
        name: item.name,
        category: item.category,
        category_name: item.category_name,
        hsn: item.hsn,
        unit: item.unit,
        unit_name: item.unit_name,
        sale_price: Number(item.sale_price) || 0,
        purchase_price: Number(item.purchase_price) || 0,
        gst_rate: item.gst_rate,
        stock: Number(item.stock) || 0,
        min_stock: Number(item.min_stock) || 0,
        barcode: item.barcode || '',
        description: item.description || '',
        mrp: item.mrp,
        unit_conversions: [],
      });
    } else {
      const purchase = matchUnit(units, primary.unit_name);
      const primaryFactor = Number(primary.conversion_factor) || 1;
      const otherRows: ConvRow[] = convs
        .filter((c) => c !== primary)
        .map((c) => {
          const linked = matchUnit(units, c.unit_name);
          const perThis = Number(c.conversion_factor) || 1;
          return {
            unit_id: linked?.id ?? null,
            unit_name: c.unit_name,
            conversion_factor: primaryFactor / perThis,
          };
        });
      setForm({
        name: item.name,
        category: item.category,
        category_name: item.category_name,
        hsn: item.hsn,
        unit: purchase?.id ?? null,
        unit_name: primary.unit_name,
        sale_price: Number(primary.sale_price) || Number(item.sale_price) * primaryFactor,
        purchase_price: Number(primary.purchase_price) || Number(item.purchase_price) * primaryFactor,
        gst_rate: item.gst_rate,
        stock: Number(item.stock) || 0,
        min_stock: Number(item.min_stock) || 0,
        barcode: item.barcode || '',
        description: item.description || '',
        mrp: item.mrp,
        unit_conversions: [
          {
            unit_id: item.unit,
            unit_name: item.unit_name,
            conversion_factor: primaryFactor,
          },
          ...otherRows,
        ],
      });
    }
    setModalOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) return;
    if (form.unit_conversions.some((r) => !r.unit_name)) {
      alert('Select an existing unit on each conversion row.');
      return;
    }
    const rows = form.unit_conversions.filter((r) => r.unit_name && r.conversion_factor > 0);
    const payload: Record<string, unknown> = { ...form };
    if (rows.length === 0) {
      payload.unit_conversions = [];
    } else {
      if (!form.unit_name) {
        alert('Select the unit you buy in first, for example Darzon.');
        return;
      }
      const stockUnit = rows[0];
      const factor = Number(stockUnit.conversion_factor);
      payload.unit = stockUnit.unit_id;
      payload.unit_name = stockUnit.unit_name;
      payload.sale_price = factor ? Number(form.sale_price) / factor : form.sale_price;
      payload.purchase_price = factor ? Number(form.purchase_price) / factor : form.purchase_price;
      payload.unit_conversions = [
        {
          unit_name: form.unit_name,
          conversion_factor: factor,
          sale_price: form.sale_price,
          purchase_price: form.purchase_price,
        },
        ...rows.slice(1).map((r) => {
          const perPurchase = Number(r.conversion_factor);
          const piecesEach = perPurchase ? factor / perPurchase : factor;
          return {
            unit_name: r.unit_name,
            conversion_factor: piecesEach,
            sale_price: perPurchase ? Number(form.sale_price) / perPurchase : 0,
            purchase_price: perPurchase ? Number(form.purchase_price) / perPurchase : 0,
          };
        }),
      ];
    }
    if (editing) await api.updateItem(editing.id, payload as Partial<Item>);
    else await api.createItem(payload as Partial<Item>);
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
    setForm((p) => {
      const row = p.unit_conversions[idx];
      const next = p.unit_conversions.filter((_, i) => i !== idx);
      if (idx === 0 && p.unit_conversions.length === 1 && row.conversion_factor > 0) {
        return {
          ...p,
          stock: p.stock / row.conversion_factor,
          min_stock: p.min_stock / row.conversion_factor,
          unit_conversions: next,
        };
      }
      return { ...p, unit_conversions: next };
    });

  const updateConversion = (idx: number, patch: Partial<ConvRow>) =>
    setForm((p) => {
      const updated = [...p.unit_conversions];
      updated[idx] = { ...updated[idx], ...patch };
      return { ...p, unit_conversions: updated };
    });

  const handlePriceChange = (field: 'purchase_price' | 'sale_price', value: number) => {
    setForm((p) => ({ ...p, [field]: value }));
  };

  const stockUnitName = form.unit_conversions[0]?.unit_name || '';
  const stockFactor = Number(form.unit_conversions[0]?.conversion_factor) || 0;
  const formPair = stockUnitName && stockFactor > 0
    ? splitByFactor(Number(form.stock) || 0, stockFactor)
    : null;

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
                <td className="px-4 py-2.5 text-slate-500">
                  {stockPair(item)?.wholeUnit || item.unit_name || '—'}
                </td>
                <td className="px-4 py-2.5">
                  {(item.unit_conversions || []).length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {(item.unit_conversions || []).map((c, i) => (
                        <span key={i} className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-600">
                          1 {c.unit_name} = {trimQty(Number(c.conversion_factor))} {item.unit_name || 'pcs'}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-300 text-xs">—</span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-right text-slate-700">
                  {formatCurrency(
                    largestConversion(item.unit_conversions)
                      ? Number(largestConversion(item.unit_conversions)?.sale_price) || Number(item.sale_price) * Number(largestConversion(item.unit_conversions)?.conversion_factor)
                      : item.sale_price,
                  )}
                </td>
                <td className="px-4 py-2.5 text-right text-slate-500">
                  {formatCurrency(
                    largestConversion(item.unit_conversions)
                      ? Number(largestConversion(item.unit_conversions)?.purchase_price) || Number(item.purchase_price) * Number(largestConversion(item.unit_conversions)?.conversion_factor)
                      : item.purchase_price,
                  )}
                </td>
                <td className="px-4 py-2.5 text-right text-slate-500">{item.gst_rate}%</td>
                <td className="px-4 py-2.5 text-right">
                  <span className={item.stock <= item.min_stock ? 'font-semibold text-red-500' : 'text-slate-700'}>
                    {stockPairLabel(item) || trimQty(Number(item.stock))}
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
            <label className="mb-1 block text-xs font-medium text-slate-600">Unit you buy in</label>
            <select
              value={form.unit ?? ''}
              onChange={(e) => handleUnitChange(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-vyapar-400 focus:ring-1 focus:ring-vyapar-200"
            >
              <option value="">Select unit...</option>
              {(units || []).map((u) => <option key={u.id} value={u.id}>{u.short_name} – {u.name}</option>)}
              {form.unit_name && !(units || []).some((u) => u.id === form.unit) && (
                <option value={form.unit ?? ''}>{form.unit_name}</option>
              )}
            </select>
          </div>

          <Input label="GST Rate (%)" type="number" value={form.gst_rate} onChange={(e) => set('gst_rate', +e.target.value)} />
          <Input
            label={`Sale Price (per ${form.unit_name || 'unit'})`}
            type="number" value={form.sale_price}
            onChange={(e) => handlePriceChange('sale_price', +e.target.value)}
          />
          <Input
            label={`Purchase Price (per ${form.unit_name || 'unit'})`}
            type="number" value={form.purchase_price}
            onChange={(e) => handlePriceChange('purchase_price', +e.target.value)}
          />
          <Input label="MRP" type="number" value={form.mrp} onChange={(e) => set('mrp', +e.target.value)} />
          <Input
            label={stockUnitName ? `Stock in ${stockUnitName}` : `Opening Stock${form.unit_name ? ` (${form.unit_name})` : ''}`}
            type="number" value={form.stock} onChange={(e) => set('stock', +e.target.value)}
          />
          <Input
            label={stockUnitName ? `Minimum Stock in ${stockUnitName}` : 'Minimum Stock'}
            type="number" value={form.min_stock} onChange={(e) => set('min_stock', +e.target.value)}
          />
          <Input label="Barcode" value={form.barcode} onChange={(e) => set('barcode', e.target.value)} />
          <div className="col-span-2">
            <TextArea label="Description" rows={2} value={form.description} onChange={(e) => set('description', e.target.value)} />
          </div>

          <div className="col-span-2 rounded-xl border border-blue-100 bg-blue-50 p-3">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-xs font-semibold text-blue-700">
                Convert {form.unit_name || 'this unit'} into an existing unit
              </div>
              <button
                type="button"
                onClick={addConversion}
                className="flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-blue-700"
              >
                <Plus size={12} /> Add conversion
              </button>
            </div>

            {form.unit_conversions.length === 0 && (
              <p className="py-2 text-center text-xs text-blue-400">
                Example: unit is Darzon, then set 1 Darzon = 12 Piece. Piece must already exist under Setup → Units.
              </p>
            )}

            {form.unit_conversions.map((conv, idx) => (
              <div key={idx} className="mb-2 flex flex-wrap items-end gap-2 rounded-lg border border-blue-100 bg-white p-2">
                <div className="pb-1 text-xs font-medium text-slate-600">
                  1 {form.unit_name || 'unit'} =
                </div>
                <div>
                  <label className="mb-0.5 block text-[10px] font-medium text-slate-500">How many</label>
                  <input
                    type="number" min={0.0001} step="any"
                    value={conv.conversion_factor}
                    onChange={(e) => updateConversion(idx, { conversion_factor: +e.target.value })}
                    className="w-24 rounded border border-slate-200 px-2 py-1 text-right text-sm outline-none focus:border-blue-400"
                  />
                </div>
                <div className="min-w-[160px] flex-1">
                  <label className="mb-0.5 block text-[10px] font-medium text-slate-500">Existing unit</label>
                  <select
                    value={conv.unit_id ?? ''}
                    onChange={(e) => {
                      const id = e.target.value ? Number(e.target.value) : null;
                      const u = (units || []).find((x) => x.id === id);
                      updateConversion(idx, { unit_id: id, unit_name: u?.short_name || '' });
                    }}
                    className="w-full rounded border border-slate-200 px-2 py-1 text-sm outline-none focus:border-blue-400"
                  >
                    <option value="">Select unit...</option>
                    {(units || [])
                      .filter((u) => u.id !== form.unit && !form.unit_conversions.some((row, i) => i !== idx && row.unit_id === u.id))
                      .map((u) => <option key={u.id} value={u.id}>{u.short_name} – {u.name}</option>)}
                    {conv.unit_name && !(units || []).some((u) => u.id === conv.unit_id) && (
                      <option value={conv.unit_id ?? ''}>{conv.unit_name}</option>
                    )}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => removeConversion(idx)}
                  className="rounded p-1 text-slate-300 hover:bg-red-50 hover:text-red-500"
                >
                  <X size={14} />
                </button>
                {idx === 0 && conv.unit_name && (
                  <div className="w-full text-[10px] text-blue-500">
                    Stock is counted in {conv.unit_name}. Buying 1 {form.unit_name || 'unit'} adds {conv.conversion_factor || 0} {conv.unit_name}.
                  </div>
                )}
              </div>
            ))}

            {formPair && stockUnitName && (
              <div className="mt-1 rounded-lg bg-white px-3 py-2 text-xs text-slate-600">
                {trimQty(Number(form.stock) || 0)} {stockUnitName} shows as{' '}
                <span className="font-semibold text-slate-800">
                  {trimQty(formPair.whole)} {form.unit_name || 'unit'} and {trimQty(formPair.remainder)} {stockUnitName}
                </span>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
