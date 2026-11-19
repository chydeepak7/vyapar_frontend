'use client';

import useSWR from 'swr';
import { Card, StatCard } from '@/components/ui/Card';
import { formatCurrency, formatDate } from '@/utils/format';
import {
  Wallet, Package, ArrowDownCircle, ArrowUpCircle, TrendingUp, TrendingDown, Receipt,
} from 'lucide-react';
import Link from 'next/link';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend,
  AreaChart, Area,
} from 'recharts';
import type { DashboardData, TxnType } from '@/lib/types';

const txnTypeLabel = (t: TxnType) => {
  const map: Record<string, string> = {
    SaleInvoice: 'Sale', PurchaseBill: 'Purchase', PaymentIn: 'Payment In',
    PaymentOut: 'Payment Out', SaleReturn: 'Sale Return', PurchaseReturn: 'Purchase Return',
    Estimate: 'Estimate', DeliveryChallan: 'Challan', SaleOrder: 'Sale Order', PurchaseOrder: 'Purchase Order',
  };
  return map[t] || t;
};

const CustomTooltip = ({ active, payload, label, currency }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-lg text-xs">
        <p className="mb-1 font-semibold text-slate-700">{payload[0]?.payload?.month_year || label}</p>
        {payload.map((p: any) => (
          <p key={p.dataKey} style={{ color: p.color }} className="font-medium">
            {p.name}: {formatCurrency(p.value, currency)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const { data, error } = useSWR<DashboardData>('/api/dashboard/');

  if (error) return <div className="text-center text-red-400 py-10">Error loading dashboard. Is the backend running?</div>;
  if (!data) return <div className="text-center text-slate-400 py-10">Loading dashboard...</div>;

  const cur = data.currency;

  return (
    <div className="space-y-4">
      {/* Top stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard title="Total Sales (Month)" value={formatCurrency(data.stats.this_month_sales, cur, 0)} icon={<TrendingUp size={16} />} color="green" />
        <StatCard title="Total Purchase (Month)" value={formatCurrency(data.stats.this_month_purchases, cur, 0)} icon={<TrendingDown size={16} />} color="amber" />
        <StatCard title="Cash in Hand" value={formatCurrency(data.stats.cash_in_hand, cur, 0)} icon={<Wallet size={16} />} color="vyapar" />
        <StatCard title="Stock Value" value={formatCurrency(data.stats.stock_value, cur, 0)} icon={<Package size={16} />} color="purple" />
        <StatCard title="Receivable" value={formatCurrency(data.stats.total_receivable, cur, 0)} icon={<ArrowDownCircle size={16} />} color="vyapar" />
        <StatCard title="Payable" value={formatCurrency(data.stats.total_payable, cur, 0)} icon={<ArrowUpCircle size={16} />} color="red" />
      </div>

      {/* Receivable / Payable highlight row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex items-center gap-4 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <ArrowDownCircle size={22} />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-emerald-600">Total Receivable</p>
            <p className="mt-0.5 text-2xl font-bold text-emerald-700">{formatCurrency(data.stats.total_receivable, cur, 0)}</p>
            <p className="mt-0.5 text-xs text-emerald-500">Amount customers owe you</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-red-200 bg-red-50 px-5 py-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 text-red-500">
            <ArrowUpCircle size={22} />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-red-500">Total Payable</p>
            <p className="mt-0.5 text-2xl font-bold text-red-600">{formatCurrency(data.stats.total_payable, cur, 0)}</p>
            <p className="mt-0.5 text-xs text-red-400">Amount you owe suppliers</p>
          </div>
        </div>
      </div>

      {/* Total Sales per Month — 12-month area chart */}
      <Card className="p-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-700">Total Sales — Monthly Trend</h3>
            <p className="mt-0.5 text-xs text-slate-400">Last 12 months</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={data.monthly} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.18} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} />
            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} width={70} tickFormatter={(v) => formatCurrency(v, cur, 0)} />
            <Tooltip content={<CustomTooltip currency={cur} />} />
            <Area
              type="monotone"
              dataKey="sales"
              name="Sales"
              stroke="#2563eb"
              strokeWidth={2.5}
              fill="url(#salesGradient)"
              dot={{ r: 3, fill: '#2563eb', strokeWidth: 0 }}
              activeDot={{ r: 5, fill: '#2563eb' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* Bar chart + Pie chart row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-4 lg:col-span-2">
          <h3 className="mb-4 text-sm font-semibold text-slate-700">Sales vs Purchase (12 months)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.monthly} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip content={<CustomTooltip currency={cur} />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="sales" name="Sales" fill="#2563eb" radius={[4, 4, 0, 0]} />
              <Bar dataKey="purchases" name="Purchases" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-4">
          <h3 className="mb-4 text-sm font-semibold text-slate-700">Sales by Category</h3>
          {data.category_data.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={data.category_data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={45}>
                  {data.category_data.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v, cur)} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[260px] items-center justify-center text-sm text-slate-400">No data yet</div>
          )}
        </Card>
      </div>

      {/* Recent transactions */}
      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700">Recent Transactions</h3>
          <Link href="/reports" className="text-xs font-medium text-vyapar-600 hover:underline">View All</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                <th className="py-2 pr-3 font-medium">Type</th>
                <th className="py-2 pr-3 font-medium">Invoice</th>
                <th className="py-2 pr-3 font-medium">Party</th>
                <th className="py-2 pr-3 font-medium">Date</th>
                <th className="py-2 pr-3 text-right font-medium">Amount</th>
                <th className="py-2 pr-3 text-right font-medium">Balance</th>
              </tr>
            </thead>
            <tbody>
              {data.recent.length === 0 && (
                <tr><td colSpan={6} className="py-6 text-center text-slate-400"><Receipt size={20} className="mx-auto mb-1 opacity-50" />No transactions yet</td></tr>
              )}
              {data.recent.map((t) => (
                <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-2.5 pr-3">
                    <span className="rounded-md bg-vyapar-50 px-2 py-0.5 text-xs font-medium text-vyapar-700">{txnTypeLabel(t.type)}</span>
                  </td>
                  <td className="py-2.5 pr-3 font-medium text-slate-700">{t.invoice_no}</td>
                  <td className="py-2.5 pr-3 text-slate-600">{t.party_name}</td>
                  <td className="py-2.5 pr-3 text-slate-500">{formatDate(t.date)}</td>
                  <td className="py-2.5 pr-3 text-right font-medium text-slate-700">{formatCurrency(t.total_amount, cur, 0)}</td>
                  <td className="py-2.5 pr-3 text-right">
                    {t.balance_amount > 0
                      ? <span className="text-red-500 font-medium">{formatCurrency(t.balance_amount, cur, 0)}</span>
                      : <span className="text-emerald-500 text-xs">Paid</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
