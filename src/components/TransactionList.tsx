'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR, { mutate as globalMutate } from 'swr';
import useSWRImmutable from 'swr/immutable';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatDate } from '@/utils/format';
import { printTransaction, downloadTransactionPDF } from '@/utils/pdf';
import { api } from '@/lib/api';
import { API_BASE } from '@/lib/config';
import { Plus, Search, Printer, Download, Trash2, FileText, Eye } from 'lucide-react';
import type { TxnType, Transaction, BusinessProfile } from '@/lib/types';

interface Props {
  txnType: TxnType;
  title: string;
  createPath?: string;
  editPathBase?: string;
}

export function TransactionList({ txnType, title, createPath, editPathBase }: Props) {
  const router = useRouter();
  const { data: business } = useSWRImmutable(`${API_BASE}/business/`, (url: string) => fetch(url).then((r) => r.json()).then((a: any[]) => a?.[0]));
  const { data: transactions, mutate } = useSWR<Transaction[]>(
    `${API_BASE}/transactions/?type=${txnType}`,
    (url: string) => fetch(url).then((r) => r.json())
  );
  const [search, setSearch] = useState('');

  const cur = (business as BusinessProfile | undefined)?.currency || 'रू';

  const filtered = (transactions || []).filter((t) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return t.invoice_no.toLowerCase().includes(q) || t.party_name.toLowerCase().includes(q);
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalAmount = filtered.reduce((s, t) => s + Number(t.total_amount), 0);
  const totalBalance = filtered.reduce((s, t) => s + Number(t.balance_amount), 0);
  const totalPaid = filtered.reduce((s, t) => s + Number(t.paid_amount), 0);

  const remove = async (id: number) => {
    if (!confirm('Delete this transaction?')) return;
    await api.deleteTransaction(id);
    mutate();
    globalMutate(`${API_BASE}/transactions/`);
    globalMutate(`${API_BASE}/dashboard/`);
    globalMutate(`${API_BASE}/items/`);
    globalMutate(`${API_BASE}/party-balances/`);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-slate-200 bg-white p-3"><div className="text-xs text-slate-500">Total Amount</div><div className="text-lg font-bold text-slate-800">{formatCurrency(totalAmount, cur, 0)}</div></div>
        <div className="rounded-lg border border-slate-200 bg-white p-3"><div className="text-xs text-slate-500">Total Received/Paid</div><div className="text-lg font-bold text-emerald-600">{formatCurrency(totalPaid, cur, 0)}</div></div>
        <div className="rounded-lg border border-slate-200 bg-white p-3"><div className="text-xs text-slate-500">Total Balance</div><div className="text-lg font-bold text-red-500">{formatCurrency(totalBalance, cur, 0)}</div></div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center rounded-lg border border-slate-200 bg-white px-3 py-2">
          <Search size={16} className="text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search invoice/party..." className="ml-2 w-52 bg-transparent text-sm outline-none" />
        </div>
        {createPath && <Button onClick={() => router.push(createPath)}><Plus size={16} className="inline mr-1" /> Add {title.replace(/s$/, '')}</Button>}
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr className="text-left text-xs text-slate-500">
              <th className="px-4 py-3 font-medium">Invoice No</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Party</th>
              <th className="px-4 py-3 text-right font-medium">Total</th>
              <th className="px-4 py-3 text-right font-medium">Paid</th>
              <th className="px-4 py-3 text-right font-medium">Balance</th>
              <th className="px-4 py-3 text-center font-medium">Status</th>
              <th className="px-4 py-3 text-center font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="py-12 text-center text-slate-400"><FileText size={24} className="mx-auto mb-2 opacity-50" />No {title.toLowerCase()} found.</td></tr>
            )}
            {filtered.map((t) => (
              <tr key={t.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-2.5 font-medium text-vyapar-700">{t.invoice_no}</td>
                <td className="px-4 py-2.5 text-slate-500">{formatDate(t.date)}</td>
                <td className="px-4 py-2.5 text-slate-700">{t.party_name}</td>
                <td className="px-4 py-2.5 text-right font-medium text-slate-700">{formatCurrency(Number(t.total_amount), cur, 0)}</td>
                <td className="px-4 py-2.5 text-right text-emerald-600">{formatCurrency(Number(t.paid_amount), cur, 0)}</td>
                <td className="px-4 py-2.5 text-right">{Number(t.balance_amount) > 0 ? <span className="font-medium text-red-500">{formatCurrency(Number(t.balance_amount), cur, 0)}</span> : <span className="text-slate-300">-</span>}</td>
                <td className="px-4 py-2.5 text-center">{Number(t.balance_amount) > 0 ? <span className="rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-600">Unpaid</span> : <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-600">Paid</span>}</td>
                <td className="px-4 py-2.5">
                  <div className="flex justify-center gap-2">
                    {editPathBase && <button onClick={() => router.push(`${editPathBase}/${t.id}/edit`)} className="text-slate-400 hover:text-vyapar-600" title="Edit"><Eye size={15} /></button>}
                    {business && <button onClick={() => printTransaction(t, business)} className="text-slate-400 hover:text-vyapar-600" title="Print"><Printer size={15} /></button>}
                    {business && <button onClick={() => downloadTransactionPDF(t, business)} className="text-slate-400 hover:text-vyapar-600" title="Download"><Download size={15} /></button>}
                    <button onClick={() => remove(t.id)} className="text-slate-400 hover:text-red-500" title="Delete"><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
