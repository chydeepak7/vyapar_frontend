'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { useAuth } from '@/lib/auth';
import { getAuthToken } from '@/lib/auth';

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
  '/admin': 'User Management',
};

function getTitle(pathname: string): string {
  if (pathname.includes('/new')) return 'New Transaction';
  if (pathname.includes('/edit')) return 'Edit Transaction';
  // Strip trailing slash for lookup
  const key = pathname.endsWith('/') && pathname !== '/' ? pathname.slice(0, -1) : pathname;
  return pageTitles[key] || 'Vyapar';
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useAuth();

  // Handle trailing slash: /login and /login/ are both the login page
  const isLoginPage = pathname === '/login' || pathname === '/login/';

  useEffect(() => {
    if (isLoading) return;
    const hasToken = !!getAuthToken();
    if (isLoginPage && user) {
      router.replace('/');
    } else if (!isLoginPage && !user && !hasToken) {
      router.replace('/login');
    }
  }, [isLoading, user, isLoginPage, router]);

  // Login page — always render the login form, no shell
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Auth is still being checked
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-vyapar-600" />
          <p className="text-sm text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  // No user, no token — wait for useEffect to redirect
  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-vyapar-600" />
          <p className="text-sm text-slate-400">Redirecting...</p>
        </div>
      </div>
    );
  }

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
