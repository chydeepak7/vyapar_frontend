'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { API_BASE } from '@/lib/config';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { UserPlus, Shield, User as UserIcon } from 'lucide-react';
import type { User } from '@/lib/types';

export default function AdminPage() {
  const { user: currentUser } = useAuth();
  const { data: users, mutate, error } = useSWR<User[]>(`${API_BASE}/auth/users/`);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ username: '', email: '', password: '', is_superuser: false });
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');

  const handleCreate = async () => {
    setFormError('');
    if (!form.username || !form.password) {
      setFormError('Username and password are required');
      return;
    }
    setCreating(true);
    try {
      await api.createUser({
        username: form.username,
        email: form.email || undefined,
        password: form.password,
        is_superuser: form.is_superuser,
      });
      mutate();
      setModalOpen(false);
      setForm({ username: '', email: '', password: '', is_superuser: false });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  if (error) return <div className="text-center text-red-400 py-10">Error loading users. {error.message}</div>;
  if (!users) return <div className="text-center text-slate-400 py-10">Loading users...</div>;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">User Management</h2>
        <Button onClick={() => setModalOpen(true)}>
          <UserPlus size={16} className="mr-1" /> Create User
        </Button>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs text-slate-500">
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-vyapar-100 text-sm font-bold text-vyapar-700">
                      {u.username.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium text-slate-700">{u.username}</span>
                    {u.id === currentUser?.id && (
                      <span className="rounded bg-vyapar-50 px-1.5 py-0.5 text-[10px] font-medium text-vyapar-600">You</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-600">{u.email || '—'}</td>
                <td className="px-4 py-3">
                  {u.is_superuser ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-600">
                      <Shield size={12} /> Superadmin
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                      <UserIcon size={12} /> User
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {u.is_active ? (
                    <span className="text-xs font-medium text-emerald-600">Active</span>
                  ) : (
                    <span className="text-xs font-medium text-slate-400">Inactive</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Create user modal */}
      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setFormError(''); }}
        title="Create New User"
        footer={
          <>
            <Button variant="outline" onClick={() => { setModalOpen(false); setFormError(''); }}>Cancel</Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? 'Creating...' : 'Create User'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {formError && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{formError}</div>
          )}
          <Input
            label="Username"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            placeholder="Enter username"
          />
          <Input
            label="Email (optional)"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="user@example.com"
          />
          <Input
            label="Password"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="Set a password"
          />
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={form.is_superuser}
              onChange={(e) => setForm({ ...form, is_superuser: e.target.checked })}
              className="rounded"
            />
            Grant superadmin privileges (can manage users)
          </label>
        </div>
      </Modal>
    </div>
  );
}
