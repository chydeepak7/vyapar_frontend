'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, FileText, ShoppingBag, TrendingDown, TrendingUp,
  Wallet, Users, Package, Settings as SettingsIcon, Receipt,
  ArrowDownToLine, ArrowUpFromLine, Undo2, Truck,
  ClipboardList, BarChart3, Tag, Ruler, Warehouse, Archive, UserCheck, Building2,
  ShieldCheck,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/lib/auth';

interface NavChild { label: string; path: string; icon: React.ReactNode }
interface NavSection {
  label: string; icon: React.ReactNode; path?: string; children?: NavChild[];
}

const navSections: NavSection[] = [
  { label: 'Dashboard', icon: <LayoutDashboard size={18} />, path: '/' },
  { label: 'Reports', icon: <BarChart3 size={18} />, path: '/reports' },
  {
    label: 'Sale', icon: <FileText size={18} />,
    children: [
      { label: 'Sale Invoices', path: '/sale-invoices', icon: <FileText size={15} /> },
      { label: 'Payment-In', path: '/payment-in', icon: <ArrowDownToLine size={15} /> },
      { label: 'Sale Return', path: '/sale-return', icon: <Undo2 size={15} /> },
      { label: 'Estimate/Quotation', path: '/estimates', icon: <FileText size={15} /> },
      { label: 'Delivery Challan', path: '/delivery-challan', icon: <Truck size={15} /> },
      { label: 'Sale Order', path: '/sale-orders', icon: <ClipboardList size={15} /> },
    ],
  },
  {
    label: 'Purchase', icon: <ShoppingBag size={18} />,
    children: [
      { label: 'Purchase Bills', path: '/purchase-bills', icon: <ShoppingBag size={15} /> },
      { label: 'Payment-Out', path: '/payment-out', icon: <ArrowUpFromLine size={15} /> },
      { label: 'Purchase Return', path: '/purchase-return', icon: <Undo2 size={15} /> },
      { label: 'Purchase Order', path: '/purchase-orders', icon: <ClipboardList size={15} /> },
    ],
  },
  { label: 'Expense', icon: <TrendingDown size={18} />, path: '/expenses' },
  { label: 'Other Income', icon: <TrendingUp size={18} />, path: '/other-income' },
  { label: 'Cash & Bank', icon: <Wallet size={18} />, path: '/cash-bank' },
  { label: 'Parties', icon: <Users size={18} />, path: '/parties' },
  { label: 'Customers', icon: <UserCheck size={18} />, path: '/customers' },
  { label: 'Suppliers', icon: <Building2 size={18} />, path: '/suppliers' },
  { label: 'Items', icon: <Package size={18} />, path: '/items' },
  {
    label: 'Setup', icon: <SettingsIcon size={18} />,
    children: [
      { label: 'Product Categories', path: '/setup/categories', icon: <Tag size={15} /> },
      { label: 'Units of Measurement', path: '/setup/units', icon: <Ruler size={15} /> },
      { label: 'Warehouses', path: '/setup/warehouses', icon: <Warehouse size={15} /> },
      { label: 'Opening Stock', path: '/setup/opening-stock', icon: <Archive size={15} /> },
    ],
  },
  { label: 'Settings', icon: <SettingsIcon size={18} />, path: '/settings' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [expanded, setExpanded] = useState<string | null>('Sale');

  const sections = user?.is_superuser
    ? [...navSections, { label: 'User Management', icon: <ShieldCheck size={18} />, path: '/admin' }]
    : navSections;

  return (
    <aside className="flex h-full w-60 flex-col border-r border-slate-200 bg-white">
      <Link href="/" className="bg-vyapar-600 p-4 text-white">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20">
            <Receipt size={20} />
          </div>
          <div>
            <div className="text-sm font-bold leading-tight">Vyapar</div>
            <div className="text-[10px] text-vyapar-100">GST Billing App</div>
          </div>
        </div>
      </Link>

      <nav className="flex-1 overflow-y-auto py-2">
        {sections.map((section) => {
          if (section.path && !section.children) {
            const active = pathname === section.path;
            return (
              <Link
                key={section.label}
                href={section.path}
                className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors ${
                  active ? 'bg-vyapar-50 text-vyapar-700 border-r-2 border-vyapar-600' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {section.icon}
                {section.label}
              </Link>
            );
          }

          const isExpanded = expanded === section.label;
          const childActive = section.children?.some((c) => pathname.startsWith(c.path));
          return (
            <div key={section.label}>
              <button
                onClick={() => setExpanded(isExpanded ? null : section.label)}
                className={`flex w-full items-center justify-between px-4 py-2.5 text-sm font-medium hover:bg-slate-50 ${childActive ? 'text-vyapar-700' : 'text-slate-600'}`}
              >
                <span className="flex items-center gap-3">{section.icon}{section.label}</span>
                <span className={`text-xs transition-transform ${isExpanded ? 'rotate-90' : ''}`}>▶</span>
              </button>
              {isExpanded && (
                <div className="pb-1">
                  {section.children?.map((child) => {
                    const active = pathname.startsWith(child.path);
                    return (
                      <Link
                        key={child.path}
                        href={child.path}
                        className={`flex items-center gap-2.5 py-2 pl-10 pr-4 text-[13px] transition-colors ${
                          active ? 'bg-vyapar-50 text-vyapar-700 border-r-2 border-vyapar-600' : 'text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        {child.icon}
                        {child.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
