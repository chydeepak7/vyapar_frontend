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
  return pageTitles[pathname] || 'Vyapar';
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const isLoginPage = pathname === '/login';

  useEffect(() => {
    if (isLoading) return;
    // Only redirect to login if there's genuinely no token (not just a mid-render state lag)
    const hasToken = !!getAuthToken();
    if (isLoginPage && user) {
      router.replace('/');
    } else if (!isLoginPage && !user && !hasToken) {
      router.replace('/login');
    }
  }, [isLoading, user, isLoginPage, router]);

  // Login page — always render the login form directly
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Show loading while auth check is in progress
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

  // Not authenticated and no token — redirect is handled by useEffect above
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
