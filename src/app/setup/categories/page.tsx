'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input, TextArea } from '@/components/ui/Input';
import { api } from '@/lib/api';
import { Plus, Pencil, Trash2, Tag } from 'lucide-react';
import type { Category } from '@/lib/types';

const empty = { name: '', description: '' };

export default function CategoriesPage() {
  const { data: categories, mutate } = useSWR<Category[]>(
    '/api/categories/',
    (url: string) => fetch(url).then((r) => r.json()),
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<{ name: string; description: string }>(empty);

  const openAdd = () => { setEditing(null); setForm(empty); setModalOpen(true); };
  const openEdit = (c: Category) => { setEditing(c); setForm({ name: c.name, description: c.description }); setModalOpen(true); };

  const save = async () => {
    if (!form.name.trim()) return;
    if (editing) await api.updateCategory(editing.id, form);
    else await api.createCategory(form);
    setModalOpen(false);
    mutate();
  };

  const remove = async (id: number) => {
    if (!confirm('Delete this category? Items linked to it will be unlinked.')) return;
    await api.deleteCategory(id);
    mutate();
  };

  const set = (field: string, value: string) => setForm((p) => ({ ...p, [field]: value }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-800">Product Categories</h1>
          <p className="text-sm text-slate-500">Organise your products into groups for easier management.</p>
        </div>
        <Button onClick={openAdd}><Plus size={16} className="inline mr-1" /> Add Category</Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <div className="text-xs text-slate-500">Total Categories</div>
          <div className="text-lg font-bold text-slate-800">{categories?.length || 0}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <div className="text-xs text-slate-500">With Items</div>
          <div className="text-lg font-bold text-slate-800">
            {(categories || []).filter((c) => c.item_count > 0).length}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr className="text-left text-xs text-slate-500">
              <th className="px-4 py-3 font-medium">Category Name</th>
              <th className="px-4 py-3 font-medium">Description</th>
              <th className="px-4 py-3 text-center font-medium">Items</th>
              <th className="px-4 py-3 text-center font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(!categories || categories.length === 0) && (
              <tr>
                <td colSpan={4} className="py-12 text-center text-slate-400">
                  <Tag size={24} className="mx-auto mb-2 opacity-50" />
                  No categories yet. Click &quot;Add Category&quot; to create one.
                </td>
              </tr>
            )}
            {(categories || []).map((cat) => (
              <tr key={cat.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-2.5 font-medium text-slate-700">{cat.name}</td>
                <td className="px-4 py-2.5 text-slate-500">{cat.description || '-'}</td>
                <td className="px-4 py-2.5 text-center">
                  <span className="rounded-full bg-vyapar-50 px-2 py-0.5 text-xs font-medium text-vyapar-700">
                    {cat.item_count}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex justify-center gap-2">
                    <button onClick={() => openEdit(cat)} className="text-slate-400 hover:text-vyapar-600">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => remove(cat.id)} className="text-slate-400 hover:text-red-500">
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
        title={editing ? 'Edit Category' : 'Add Category'}
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={save}>Save</Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input label="Category Name *" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Electronics" />
          <TextArea label="Description" rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Optional description" />
        </div>
      </Modal>
    </div>
  );
}
