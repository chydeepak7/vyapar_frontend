import type {
  BusinessProfile, Party, Item, Transaction, Expense, OtherIncome,
  BankAccount, Settings, DashboardData, PartyBalance,
} from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
  const data = await res.json();
  return data as T;
}

async function send<T>(url: string, method: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
  // 204 No Content (e.g. DELETE) has no body — skip JSON parsing
  if (res.status === 204 || res.headers.get('content-length') === '0') {
    return undefined as T;
  }
  const data = await res.json();
  return data as T;
}

// ============ Endpoints ============
export const api = {
  // Dashboard
  getDashboard: () => fetcher<DashboardData>(`${API_BASE}/dashboard/`),

  // Business
  getBusiness: () => fetcher<BusinessProfile[]>(`${API_BASE}/business/`),
  updateBusiness: (id: number, data: Partial<BusinessProfile>) =>
    send<BusinessProfile>(`${API_BASE}/business/${id}/`, 'PATCH', data),

  // Parties
  getParties: () => fetcher<Party[]>(`${API_BASE}/parties/`),
  createParty: (data: Partial<Party>) => send<Party>(`${API_BASE}/parties/`, 'POST', data),
  updateParty: (id: number, data: Partial<Party>) => send<Party>(`${API_BASE}/parties/${id}/`, 'PATCH', data),
  deleteParty: (id: number) => send<void>(`${API_BASE}/parties/${id}/`, 'DELETE'),
  getPartyBalances: () => fetcher<PartyBalance[]>(`${API_BASE}/party-balances/`),

  // Items
  getItems: () => fetcher<Item[]>(`${API_BASE}/items/`),
  createItem: (data: Partial<Item>) => send<Item>(`${API_BASE}/items/`, 'POST', data),
  updateItem: (id: number, data: Partial<Item>) => send<Item>(`${API_BASE}/items/${id}/`, 'PATCH', data),
  deleteItem: (id: number) => send<void>(`${API_BASE}/items/${id}/`, 'DELETE'),

  // Transactions
  getTransactions: (params?: { type?: string; party?: number; from_date?: string; to_date?: string }) => {
    const q = new URLSearchParams();
    if (params) Object.entries(params).forEach(([k, v]) => v && q.set(k, String(v)));
    return fetcher<Transaction[]>(`${API_BASE}/transactions/${q.toString() ? '?' + q : ''}`);
  },
  getTransaction: (id: number) => fetcher<Transaction>(`${API_BASE}/transactions/${id}/`),
  createTransaction: (data: Partial<Transaction>) => send<Transaction>(`${API_BASE}/transactions/`, 'POST', data),
  updateTransaction: (id: number, data: Partial<Transaction>) => send<Transaction>(`${API_BASE}/transactions/${id}/`, 'PATCH', data),
  deleteTransaction: (id: number) => send<void>(`${API_BASE}/transactions/${id}/`, 'DELETE'),

  // Expenses
  getExpenses: () => fetcher<Expense[]>(`${API_BASE}/expenses/`),
  createExpense: (data: Partial<Expense>) => send<Expense>(`${API_BASE}/expenses/`, 'POST', data),
  updateExpense: (id: number, data: Partial<Expense>) => send<Expense>(`${API_BASE}/expenses/${id}/`, 'PATCH', data),
  deleteExpense: (id: number) => send<void>(`${API_BASE}/expenses/${id}/`, 'DELETE'),

  // Other Income
  getOtherIncomes: () => fetcher<OtherIncome[]>(`${API_BASE}/other-incomes/`),
  createOtherIncome: (data: Partial<OtherIncome>) => send<OtherIncome>(`${API_BASE}/other-incomes/`, 'POST', data),
  updateOtherIncome: (id: number, data: Partial<OtherIncome>) => send<OtherIncome>(`${API_BASE}/other-incomes/${id}/`, 'PATCH', data),
  deleteOtherIncome: (id: number) => send<void>(`${API_BASE}/other-incomes/${id}/`, 'DELETE'),

  // Bank Accounts
  getBankAccounts: () => fetcher<BankAccount[]>(`${API_BASE}/bank-accounts/`),
  createBankAccount: (data: Partial<BankAccount>) => send<BankAccount>(`${API_BASE}/bank-accounts/`, 'POST', data),
  updateBankAccount: (id: number, data: Partial<BankAccount>) => send<BankAccount>(`${API_BASE}/bank-accounts/${id}/`, 'PATCH', data),
  deleteBankAccount: (id: number) => send<void>(`${API_BASE}/bank-accounts/${id}/`, 'DELETE'),

  // Settings
  getSettings: () => fetcher<Settings[]>(`${API_BASE}/settings/`),
  updateSettings: (id: number, data: Partial<Settings>) => send<Settings>(`${API_BASE}/settings/${id}/`, 'PATCH', data),

  // Reports
  getReports: (type: string, from_date?: string, to_date?: string) => {
    const q = new URLSearchParams({ type });
    if (from_date) q.set('from_date', from_date);
    if (to_date) q.set('to_date', to_date);
    return fetcher<any>(`${API_BASE}/reports/?${q}`);
  },
};

// SWR fetcher
export const swrFetcher = (url: string) => fetcher(url);
