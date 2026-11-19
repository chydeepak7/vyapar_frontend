'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

const pageTitles: Record<string, string> = {
  '/': 'Business Dashboard',
  '/reports': 'Reports',
  '/sale-invoices': 'Sale Invoices',
  '/payment-in': 'Payment-In',
  '/payment-out': 'Payment-Out',
  '/sale-return': 'Sale Return',
  '/estimates': 'Estimate / Quotation',
  '/delivery-challan': 'Delivery Challan',
  '/sale-orders': 'Sale Orders',
  '/purchase-bills': 'Purchase Bills',
  '/purchase-return': 'Purchase Return',
  '/purchase-orders': 'Purchase Orders',
  '/expenses': 'Expense',
  '/other-income': 'Other Income',
  '/cash-bank': 'Cash & Bank',
  '/parties': 'Parties',
  '/items': 'Items',
  '/settings': 'Settings',
};

function getTitle(pathname: string): string {
  if (pathname.includes('/new')) return 'New Transaction';
  if (pathname.includes('/edit')) return 'Edit Transaction';
  return pageTitles[pathname] || 'Vyapar';
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar title={getTitle(pathname)} />
        <main className="flex-1 overflow-y-auto p-4">{children}</main>
      </div>
    </div>
  );
}
