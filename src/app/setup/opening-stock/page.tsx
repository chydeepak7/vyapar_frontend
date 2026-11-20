'use client';

import { useState } from 'react';
import useSWR, { mutate as globalMutate } from 'swr';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input, Select, TextArea } from '@/components/ui/Input';
import { formatCurrency } from '@/utils/format';
import { api } from '@/lib/api';
import { API_BASE } from '@/lib/config';
import { Plus, Pencil, Trash2, Archive, Search } from 'lucide-react';
import type { OpeningStock, Item, Warehouse } from '@/lib/types';

const today = new Date().toISOString().split('T')[0];

const empty = {
  item: 0,
  warehouse: null as number | null,
  quantity: 0,
  rate: 0,
  date: today,
  notes: '',
};

export default function OpeningStockPage() {
  const { data: stocks, mutate } = useSWR<OpeningStock[]>(
    `${API_BASE}/opening-stocks/`,
    (url: string) => fetch(url).then((r) => r.json()),
  );
  const { data: items } = useSWR<Item[]>(
    `${API_BASE}/items/`,
    (url: string) => fetch(url).then((r) => r.json()),
  );
  const { data: warehouses } = useSWR<Warehouse[]>(
    `${API_BASE}/warehouses/`,
    (url: string) => fetch(url).then((r) => r.json()),
  );

  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<OpeningStock | null>(null);
  const [form, setForm] = useState<typeof empty>(empty);

  const filtered = (stocks || []).filter((s) =>
    s.item_name.toLowerCase().includes(search.toLowerCase()),
  );

  const totalValue = (stocks || []).reduce((sum, s) => sum + s.quantity * s.rate, 0);

  const openAdd = () => { setEditing(null); setForm(empty); setModalOpen(true); };
  const openEdit = (s: OpeningStock) => {
    setEditing(s);
    setForm({
      item: s.item,
      warehouse: s.warehouse,
      quantity: s.quantity,
      rate: s.rate,
      date: s.date,
      notes: s.notes,
    });
    setModalOpen(true);
  };

  const save = async () => {
    if (!form.item) return;
    if (editing) {
      await api.updateOpeningStock(editing.id, form);
    } else {
      await api.createOpeningStock(form);
    }
    setModalOpen(false);
    mutate();
    globalMutate(`${API_BASE}/items/`);
  };

  const remove = async (id: number) => {
    if (!confirm('Delete this opening stock entry? This will reduce item stock.')) return;
    await api.deleteOpeningStock(id);
    mutate();
    globalMutate(`${API_BASE}/items/`);
  };

  const setF = (field: string, value: string | number | null) =>
    setForm((p) => ({ ...p, [field]: value }));

  // When item is selected, pre-fill purchase price as rate
  const handleItemChange = (itemId: number) => {
    const item = (items || []).find((i) => i.id === itemId);
    setForm((p) => ({ ...p, item: itemId, rate: item ? item.purchase_price : 0 }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-800">Opening Stock</h1>
          <p className="text-sm text-slate-500">Enter initial stock quantities and values for your products.</p>
        </div>
        <Button onClick={openAdd}><Plus size={16} className="inline mr-1" /> Add Entry</Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <div className="text-xs text-slate-500">Total Entries</div>
          <div className="text-lg font-bold text-slate-800">{stocks?.length || 0}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <div className="text-xs text-slate-500">Total Value</div>
          <div className="text-lg font-bold text-slate-800">{formatCurrency(totalValue, 'रू', 0)}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <div className="text-xs text-slate-500">Products Covered</div>
          <div className="text-lg font-bold text-slate-800">
            {new Set((stocks || []).map((s) => s.item)).size}
          </div>
        </div>
      </div>

      <div className="flex items-center rounded-lg border border-slate-200 bg-white px-3 py-2 w-fit">
        <Search size={16} className="text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by item..."
          className="ml-2 w-56 bg-transparent text-sm outline-none"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr className="text-left text-xs text-slate-500">
              <th className="px-4 py-3 font-medium">Item</th>
              <th className="px-4 py-3 font-medium">Warehouse</th>
              <th className="px-4 py-3 text-right font-medium">Qty</th>
              <th className="px-4 py-3 text-right font-medium">Rate</th>
              <th className="px-4 py-3 text-right font-medium">Value</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Notes</th>
              <th className="px-4 py-3 text-center font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  <Archive size={24} className="mx-auto mb-2 opacity-50" />
                  No opening stock entries yet.
                </td>
              </tr>
            )}
            {filtered.map((s) => (
              <tr key={s.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-2.5 font-medium text-slate-700">{s.item_name}</td>
                <td className="px-4 py-2.5 text-slate-500">{s.warehouse_name || '—'}</td>
                <td className="px-4 py-2.5 text-right text-slate-700">{s.quantity}</td>
                <td className="px-4 py-2.5 text-right text-slate-500">{formatCurrency(s.rate)}</td>
                <td className="px-4 py-2.5 text-right font-medium text-slate-700">
                  {formatCurrency(s.quantity * s.rate, 'रू', 0)}
                </td>
                <td className="px-4 py-2.5 text-slate-500">{s.date}</td>
                <td className="px-4 py-2.5 text-slate-400 max-w-[160px] truncate">{s.notes || '—'}</td>
                <td className="px-4 py-2.5">
                  <div className="flex justify-center gap-2">
                    <button onClick={() => openEdit(s)} className="text-slate-400 hover:text-vyapar-600">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => remove(s.id)} className="text-slate-400 hover:text-red-500">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Opening Stock' : 'Add Opening Stock'}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={save}>Save</Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Select
              label="Product *"
              value={form.item || ''}
              onChange={(e) => handleItemChange(Number(e.target.value))}
            >
              <option value="">Select a product...</option>
              {(items || []).map((i) => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
            </Select>
          </div>
          <Select
            label="Warehouse"
            value={form.warehouse ?? ''}
            onChange={(e) => setF('warehouse', e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">No specific warehouse</option>
            {(warehouses || []).map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </Select>
          <Input
            label="Date"
            type="date"
            value={form.date}
            onChange={(e) => setF('date', e.target.value)}
          />
          <Input
            label="Quantity *"
            type="number"
            value={form.quantity}
            onChange={(e) => setF('quantity', +e.target.value)}
          />
          <Input
            label="Rate (Cost Price)"
            type="number"
            value={form.rate}
            onChange={(e) => setF('rate', +e.target.value)}
          />
          {form.quantity > 0 && form.rate > 0 && (
            <div className="col-span-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
              Total Value:{' '}
              <span className="font-semibold text-slate-800">
                {formatCurrency(form.quantity * form.rate, 'रू', 2)}
              </span>
            </div>
          )}
          <div className="col-span-2">
            <TextArea
              label="Notes"
              rows={2}
              value={form.notes}
              onChange={(e) => setF('notes', e.target.value)}
              placeholder="Optional remarks"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
