'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Input } from '@/components/ui/Input';
import { formatCurrency, formatDate } from '@/utils/format';
import { Card } from '@/components/ui/Card';
import { FileText, ShoppingBag, BookOpen, TrendingUp, FileBarChart, Package, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { API_BASE } from '@/lib/config';

type ReportType = 'sale' | 'purchase' | 'all' | 'pl' | 'gstr1' | 'gstr3b' | 'stock';

const reportTabs: { key: ReportType; label: string; icon: React.ReactNode }[] = [
  { key: 'sale', label: 'Sale Report', icon: <FileText size={15} /> },
  { key: 'purchase', label: 'Purchase Report', icon: <ShoppingBag size={15} /> },
  { key: 'all', label: 'All Transactions', icon: <BookOpen size={15} /> },
  { key: 'pl', label: 'Profit & Loss', icon: <TrendingUp size={15} /> },
  { key: 'gstr1', label: 'GSTR-1', icon: <FileBarChart size={15} /> },
  { key: 'gstr3b', label: 'GSTR-3B', icon: <FileBarChart size={15} /> },
  { key: 'stock', label: 'Stock Summary', icon: <Package size={15} /> },
];

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportType>('sale');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const query = `?type=${activeTab}${fromDate ? '&from_date=' + fromDate : ''}${toDate ? '&to_date=' + toDate : ''}`;
  const { data, error } = useSWR(`${API_BASE}/reports/${query}`, (url: string) => fetch(url).then((r) => r.json()));

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-3">
          <Input label="From Date" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          <Input label="To Date" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          <button onClick={() => { setFromDate(''); setToDate(''); }} className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Clear</button>
        </div>
      </Card>

      <div className="flex flex-wrap gap-2">
        {reportTabs.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${activeTab === tab.key ? 'bg-vyapar-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>

      <Card className="p-4">
        {error && <div className="py-8 text-center text-red-400">Error loading report.</div>}
        {!data && <div className="py-8 text-center text-slate-400">Loading report...</div>}
        {data && activeTab === 'sale' && (
          <>
            <div className="mb-3 grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-emerald-50 p-3"><div className="text-xs text-emerald-600">Total Sales</div><div className="text-lg font-bold text-emerald-700">{formatCurrency(data.total || 0, 'रू', 0)}</div></div>
              <div className="rounded-lg bg-slate-50 p-3"><div className="text-xs text-slate-500">Received</div><div className="text-lg font-bold text-slate-700">{formatCurrency((data.total || 0) - (data.balance || 0), 'रू', 0)}</div></div>
              <div className="rounded-lg bg-red-50 p-3"><div className="text-xs text-red-600">Outstanding</div><div className="text-lg font-bold text-red-600">{formatCurrency(data.balance || 0, 'रू', 0)}</div></div>
            </div>
            <ReportTable headers={['Invoice', 'Date', 'Party', 'Total', 'Paid', 'Balance', 'Status']} rows={(data.rows || []).map((t: any) => [t.invoice_no, formatDate(t.date), t.party_name, formatCurrency(t.total_amount, 'रू', 0), formatCurrency(t.paid_amount, 'रू', 0), formatCurrency(t.balance_amount, 'रू', 0), t.balance_amount > 0 ? 'Unpaid' : 'Paid'])} />
          </>
        )}
        {data && activeTab === 'purchase' && (
          <>
            <div className="mb-3 grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-amber-50 p-3"><div className="text-xs text-amber-600">Total Purchases</div><div className="text-lg font-bold text-amber-700">{formatCurrency(data.total || 0, 'रू', 0)}</div></div>
              <div className="rounded-lg bg-slate-50 p-3"><div className="text-xs text-slate-500">Paid</div><div className="text-lg font-bold text-slate-700">{formatCurrency((data.total || 0) - (data.balance || 0), 'रू', 0)}</div></div>
              <div className="rounded-lg bg-red-50 p-3"><div className="text-xs text-red-600">Payable</div><div className="text-lg font-bold text-red-600">{formatCurrency(data.balance || 0, 'रू', 0)}</div></div>
            </div>
            <ReportTable headers={['Bill No', 'Date', 'Party', 'Total', 'Paid', 'Balance']} rows={(data.rows || []).map((t: any) => [t.invoice_no, formatDate(t.date), t.party_name, formatCurrency(t.total_amount, 'रू', 0), formatCurrency(t.paid_amount, 'रू', 0), formatCurrency(t.balance_amount, 'रू', 0)])} />
          </>
        )}
        {data && activeTab === 'all' && (
          <ReportTable headers={['Date', 'Type', 'Invoice', 'Party', 'Amount', 'Balance']} rows={(data.rows || []).map((t: any) => [formatDate(t.date), t.type, t.invoice_no, t.party_name, formatCurrency(t.total_amount, 'रू', 0), formatCurrency(t.balance_amount, 'रू', 0)])} />
        )}
        {data && activeTab === 'pl' && (
          <div className="mx-auto max-w-xl">
            <div className="space-y-2 text-sm">
              <PLRow label="Sales Revenue" value={data.sales_revenue || 0} positive currency="रू" />
              <PLRow label="Cost of Purchases" value={-(data.purchase_cost || 0)} positive={false} currency="रू" />
              <div className="border-t border-slate-200 py-2" />
              <PLRow label="Gross Profit" value={data.gross_profit || 0} positive={(data.gross_profit || 0) >= 0} bold currency="रू" />
              <PLRow label="Total Expenses" value={-(data.expense_total || 0)} positive={false} currency="रू" />
              <PLRow label="Other Income" value={data.income_total || 0} positive currency="रू" />
              <div className="border-t-2 border-slate-300 py-2" />
              <PLRow label="Net Profit / Loss" value={data.net_profit || 0} positive={(data.net_profit || 0) >= 0} bold currency="रू" />
            </div>
            <div className="mt-6">
              <h4 className="mb-2 text-sm font-semibold text-slate-700">Breakdown</h4>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={[
                  { name: 'Revenue', value: Math.round(data.sales_revenue || 0) },
                  { name: 'Purchases', value: Math.round(data.purchase_cost || 0) },
                  { name: 'Expenses', value: Math.round(data.expense_total || 0) },
                  { name: 'Net Profit', value: Math.round(data.net_profit || 0) },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip formatter={(v: number) => formatCurrency(v, 'रू')} />
                  <Bar dataKey="value" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
        {data && activeTab === 'gstr1' && (
          <>
            <h3 className="mb-1 text-sm font-semibold text-slate-700">VAT/PAN - Outward Supplies (HSN-wise)</h3>
            <p className="mb-3 text-xs text-slate-400">Summary of all sales for the selected period</p>
            <ReportTable headers={['HSN/SAC', 'Taxable Value', 'VAT (13%)', 'SGST', 'IGST', 'Total Tax', 'Invoice Value']}
              rows={(data.rows || []).map((r: any) => [r.hsn, formatCurrency(r.taxable_value, 'रू', 0), formatCurrency(r.cgst, 'रू', 0), formatCurrency(r.sgst, 'रू', 0), formatCurrency(r.igst, 'रू', 0), formatCurrency(r.cgst + r.sgst + r.igst, 'रू', 0), formatCurrency(r.total, 'रू', 0)])} />
          </>
        )}
        {data && activeTab === 'gstr3b' && (
          <div className="mx-auto max-w-lg space-y-3">
            <h3 className="text-sm font-semibold text-slate-700">VAT Summary</h3>
            <div className="rounded-lg border border-slate-200 p-3"><div className="text-xs font-medium text-slate-500">Outward Supplies (Taxable Value)</div><div className="text-lg font-bold text-slate-800">{formatCurrency(data.outward_taxable || 0, 'रू', 0)}</div><div className="text-xs text-slate-400">Output Tax: {formatCurrency(data.outward_tax || 0, 'रू', 0)}</div></div>
            <div className="rounded-lg border border-slate-200 p-3"><div className="text-xs font-medium text-slate-500">Inward Supplies (Taxable Value)</div><div className="text-lg font-bold text-slate-800">{formatCurrency(data.inward_taxable || 0, 'रू', 0)}</div><div className="text-xs text-slate-400">Input Tax: {formatCurrency(data.inward_tax || 0, 'रू', 0)}</div></div>
            <div className="rounded-lg border-2 border-vyapar-600 bg-vyapar-50 p-3"><div className="text-xs font-medium text-vyapar-700">Net Tax Payable (Output - Input)</div><div className="text-2xl font-bold text-vyapar-700">{formatCurrency(data.net_tax_payable || 0, 'रू', 0)}</div></div>
          </div>
        )}
        {data && activeTab === 'stock' && (
          <ReportTable headers={['Item', 'HSN', 'Stock', 'Unit', 'Stock Value', 'Min Stock', 'Status']}
            rows={(data.rows || []).map((s: any) => [s.name, s.hsn || '-', String(s.stock), s.unit, formatCurrency(s.value, 'रू', 0), String(s.min_stock), s.low ? <span className="text-red-500 font-medium">Low Stock</span> : <span className="text-emerald-500">OK</span>])} />
        )}
      </Card>
    </div>
  );
}

function ReportTable({ headers, rows }: { headers: string[]; rows: (string | React.ReactNode)[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50"><tr className="text-left text-xs text-slate-500">
          {headers.map((h, i) => <th key={i} className={`px-3 py-2.5 font-medium ${i > 2 ? 'text-right' : ''}`}>{h}</th>)}
        </tr></thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan={headers.length} className="py-8 text-center text-slate-400">No data for selected period.</td></tr>}
          {rows.map((row, i) => (<tr key={i} className="border-t border-slate-100 hover:bg-slate-50">
            {row.map((cell, j) => <td key={j} className={`px-3 py-2 ${j > 2 ? 'text-right' : 'text-slate-700'} ${j > 2 ? 'font-medium' : ''}`}>{cell}</td>)}
          </tr>))}
        </tbody>
      </table>
    </div>
  );
}

function PLRow({ label, value, positive, bold, currency }: { label: string; value: number; positive: boolean; bold?: boolean; currency: string }) {
  return (
    <div className="flex justify-between">
      <span className={bold ? 'font-bold text-slate-800' : 'text-slate-600'}>{label}</span>
      <span className={`${bold ? 'font-bold' : 'font-medium'} ${positive ? 'text-emerald-600' : 'text-red-500'}`}>{value < 0 ? '-' : ''}{formatCurrency(Math.abs(value), currency, 0)}</span>
    </div>
  );
}
