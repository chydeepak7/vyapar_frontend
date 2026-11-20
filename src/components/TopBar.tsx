'use client';

import { Search, Bell, Plus } from 'lucide-react';
import Link from 'next/link';
import useSWR from 'swr';

export function TopBar({ title }: { title: string }) {
  const { data: business } = useSWR('/api/business/', (url: string) =>
    fetch(url).then((r) => r.json()).then((arr: any[]) => arr?.[0])
  );

  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4">
      <h1 className="text-lg font-semibold text-slate-800">{title}</h1>
      <div className="flex items-center gap-3">
        <div className="hidden items-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 md:flex">
          <Search size={15} className="text-slate-400" />
          <input placeholder="Search..." className="ml-2 w-40 bg-transparent text-sm outline-none" />
        </div>
        <Link
          href="/sale-invoices/new"
          className="flex items-center gap-1.5 rounded-lg bg-vyapar-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-vyapar-700"
        >
          <Plus size={16} />
          New Invoice
        </Link>
        <button className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100">
          <Bell size={18} />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
        </button>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-vyapar-100 text-sm font-bold text-vyapar-700">
            {(business?.name || 'B').charAt(0).toUpperCase()}
          </div>
          <div className="hidden md:block">
            <div className="text-xs font-semibold text-slate-700">{business?.name}</div>
            <div className="text-[10px] text-slate-400">{business?.gstin || 'PAN Billing'}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
