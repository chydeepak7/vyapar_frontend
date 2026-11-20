export function formatCurrency(amount: number, symbol = 'रू', decimals = 2): string {
  const formatted = Math.abs(amount).toLocaleString('en-NP', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  const prefix = amount < 0 ? '-' : '';
  return `${prefix}${symbol}${formatted}`;
}

export function formatNumber(amount: number, decimals = 2): string {
  return amount.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatDate(isoDate: string): string {
  if (!isoDate) return '';
  const d = new Date(isoDate);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

export function addDays(isoDate: string, days: number): string {
  const d = new Date(isoDate);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export function nextInvoiceNo(prefix: string, lastNumber: number): string {
  const next = (lastNumber || 0) + 1;
  return `${prefix}-${String(next).padStart(3, '0')}`;
}

export function extractInvoiceNo(invoiceNo: string): number {
  const match = invoiceNo.match(/(\d+)$/);
  return match ? parseInt(match[1], 10) : 0;
}
