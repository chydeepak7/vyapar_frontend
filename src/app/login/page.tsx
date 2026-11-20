'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Receipt, Lock, User as UserIcon, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      router.replace('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-vyapar-600 text-white shadow-lg">
            <Receipt size={28} />
          </div>
          <h1 className="text-xl font-bold text-slate-800">Vyapar</h1>
          <p className="text-sm text-slate-500">GST Billing &amp; Accounting</p>
        </div>

        {/* Login card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-slate-700">Sign In</h2>

          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">Username</label>
              <div className="flex items-center rounded-lg border border-slate-300 px-3 focus-within:border-vyapar-500 focus-within:ring-1 focus-within:ring-vyapar-500">
                <UserIcon size={16} className="text-slate-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="ml-2 w-full bg-transparent py-2 text-sm outline-none"
                  placeholder="Enter username"
                  autoFocus
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">Password</label>
              <div className="flex items-center rounded-lg border border-slate-300 px-3 focus-within:border-vyapar-500 focus-within:ring-1 focus-within:ring-vyapar-500">
                <Lock size={16} className="text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="ml-2 w-full bg-transparent py-2 text-sm outline-none"
                  placeholder="Enter password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-vyapar-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-vyapar-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
