'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { api } from '@/lib/api';
import { Plus, Pencil, Trash2, Ruler } from 'lucide-react';
import type { Unit } from '@/lib/types';

const empty = { name: '', short_name: '' };

export default function UnitsPage() {
  const { data: units, mutate } = useSWR<Unit[]>(
    '/api/units/'
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Unit | null>(null);
  const [form, setForm] = useState<{ name: string; short_name: string }>(empty);

  const openAdd = () => { setEditing(null); setForm(empty); setModalOpen(true); };
  const openEdit = (u: Unit) => { setEditing(u); setForm({ name: u.name, short_name: u.short_name }); setModalOpen(true); };

  const save = async () => {
    if (!form.name.trim() || !form.short_name.trim()) return;
    if (editing) await api.updateUnit(editing.id, form);
    else await api.createUnit(form);
    setModalOpen(false);
    mutate();
  };

  const remove = async (id: number) => {
    if (!confirm('Delete this unit? Items linked to it will be unlinked.')) return;
    await api.deleteUnit(id);
    mutate();
  };

  const set = (field: string, value: string) => setForm((p) => ({ ...p, [field]: value }));

  const DEFAULT_UNITS = [
    { name: 'Pieces', short_name: 'PCS' },
    { name: 'Kilograms', short_name: 'KG' },
    { name: 'Litres', short_name: 'LTR' },
    { name: 'Metres', short_name: 'MTR' },
    { name: 'Box', short_name: 'BOX' },
    { name: 'Set', short_name: 'SET' },
    { name: 'Numbers', short_name: 'NOS' },
    { name: 'Pair', short_name: 'PAIR' },
    { name: 'Roll', short_name: 'ROLL' },
    { name: 'Bag', short_name: 'BAG' },
  ];

  const seedDefaults = async () => {
    if (!confirm('Add all default units (PCS, KG, LTR, etc.)?')) return;
    const existing = new Set((units || []).map((u) => u.short_name));
    for (const u of DEFAULT_UNITS) {
      if (!existing.has(u.short_name)) await api.createUnit(u);
    }
    mutate();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-800">Units of Measurement</h1>
          <p className="text-sm text-slate-500">Define units like Pieces, Kilograms, Boxes, Litres, etc.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={seedDefaults}>Load Defaults</Button>
          <Button onClick={openAdd}><Plus size={16} className="inline mr-1" /> Add Unit</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <div className="text-xs text-slate-500">Total Units</div>
          <div className="text-lg font-bold text-slate-800">{units?.length || 0}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <div className="text-xs text-slate-500">In Use</div>
          <div className="text-lg font-bold text-slate-800">
            {(units || []).filter((u) => u.item_count > 0).length}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr className="text-left text-xs text-slate-500">
              <th className="px-4 py-3 font-medium">Short Name</th>
              <th className="px-4 py-3 font-medium">Full Name</th>
              <th className="px-4 py-3 text-center font-medium">Items Using</th>
              <th className="px-4 py-3 text-center font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(!units || units.length === 0) && (
              <tr>
                <td colSpan={4} className="py-12 text-center text-slate-400">
                  <Ruler size={24} className="mx-auto mb-2 opacity-50" />
                  No units yet. Click &quot;Load Defaults&quot; or &quot;Add Unit&quot;.
                </td>
              </tr>
            )}
            {(units || []).map((unit) => (
              <tr key={unit.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-2.5">
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-sm font-semibold text-slate-700">
                    {unit.short_name}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-slate-700">{unit.name}</td>
                <td className="px-4 py-2.5 text-center">
                  <span className="rounded-full bg-vyapar-50 px-2 py-0.5 text-xs font-medium text-vyapar-700">
                    {unit.item_count}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex justify-center gap-2">
                    <button onClick={() => openEdit(unit)} className="text-slate-400 hover:text-vyapar-600">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => remove(unit.id)} className="text-slate-400 hover:text-red-500">
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
        title={editing ? 'Edit Unit' : 'Add Unit'}
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={save}>Save</Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input
            label="Short Name *"
            value={form.short_name}
            onChange={(e) => set('short_name', e.target.value.toUpperCase())}
            placeholder="e.g. PCS"
          />
          <Input
            label="Full Name *"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="e.g. Pieces"
          />
        </div>
      </Modal>
    </div>
  );
}
