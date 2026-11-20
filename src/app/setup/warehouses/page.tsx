'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input, TextArea } from '@/components/ui/Input';
import { api } from '@/lib/api';
import { Plus, Pencil, Trash2, Warehouse as WarehouseIcon, MapPin, Phone, Star } from 'lucide-react';
import type { Warehouse } from '@/lib/types';

const empty: Omit<Warehouse, 'id' | 'created_at'> = {
  name: '', address: '', contact_person: '', phone: '', is_default: false,
};

export default function WarehousesPage() {
  const { data: warehouses, mutate } = useSWR<Warehouse[]>(
    '/api/warehouses/'
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Warehouse | null>(null);
  const [form, setForm] = useState<Omit<Warehouse, 'id' | 'created_at'>>(empty);

  const openAdd = () => { setEditing(null); setForm(empty); setModalOpen(true); };
  const openEdit = (w: Warehouse) => {
    setEditing(w);
    setForm({ name: w.name, address: w.address, contact_person: w.contact_person, phone: w.phone, is_default: w.is_default });
    setModalOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) return;
    if (editing) await api.updateWarehouse(editing.id, form);
    else await api.createWarehouse(form);
    setModalOpen(false);
    mutate();
  };

  const remove = async (id: number) => {
    if (!confirm('Delete this warehouse?')) return;
    await api.deleteWarehouse(id);
    mutate();
  };

  const set = (field: string, value: string | boolean) =>
    setForm((p) => ({ ...p, [field]: value }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-800">Warehouses</h1>
          <p className="text-sm text-slate-500">Configure storage locations for your inventory.</p>
        </div>
        <Button onClick={openAdd}><Plus size={16} className="inline mr-1" /> Add Warehouse</Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <div className="text-xs text-slate-500">Total Warehouses</div>
          <div className="text-lg font-bold text-slate-800">{warehouses?.length || 0}</div>
        </div>
        <div className="rounded-lg border border-vyapar-200 bg-vyapar-50 p-3">
          <div className="text-xs text-vyapar-600">Default</div>
          <div className="text-sm font-semibold text-vyapar-700 truncate">
            {(warehouses || []).find((w) => w.is_default)?.name || '—'}
          </div>
        </div>
      </div>

      {/* Card grid for warehouses */}
      {(!warehouses || warehouses.length === 0) ? (
        <div className="rounded-xl border border-slate-200 bg-white py-16 text-center text-slate-400">
          <WarehouseIcon size={32} className="mx-auto mb-2 opacity-40" />
          <p>No warehouses configured. Click &quot;Add Warehouse&quot; to create one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(warehouses || []).map((w) => (
            <div key={w.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm relative">
              {w.is_default && (
                <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                  <Star size={10} /> Default
                </span>
              )}
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-vyapar-50">
                  <WarehouseIcon size={18} className="text-vyapar-600" />
                </div>
                <div className="font-semibold text-slate-800">{w.name}</div>
              </div>
              {w.address && (
                <div className="mb-1 flex items-start gap-1.5 text-xs text-slate-500">
                  <MapPin size={12} className="mt-0.5 shrink-0" />
                  <span>{w.address}</span>
                </div>
              )}
              {w.contact_person && (
                <div className="mb-1 text-xs text-slate-500">Contact: {w.contact_person}</div>
              )}
              {w.phone && (
                <div className="mb-3 flex items-center gap-1.5 text-xs text-slate-500">
                  <Phone size={12} />
                  <span>{w.phone}</span>
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => openEdit(w)}
                  className="flex items-center gap-1 rounded-md border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
                >
                  <Pencil size={12} /> Edit
                </button>
                <button
                  onClick={() => remove(w.id)}
                  className="flex items-center gap-1 rounded-md border border-red-100 px-3 py-1.5 text-xs text-red-500 hover:bg-red-50"
                >
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Warehouse' : 'Add Warehouse'}
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={save}>Save</Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input label="Warehouse Name *" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Main Godown" />
          <TextArea label="Address" rows={2} value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="Full address" />
          <Input label="Contact Person" value={form.contact_person} onChange={(e) => set('contact_person', e.target.value)} />
          <Input label="Phone" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_default}
              onChange={(e) => set('is_default', e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 accent-vyapar-600"
            />
            Set as default warehouse
          </label>
        </div>
      </Modal>
    </div>
  );
}
