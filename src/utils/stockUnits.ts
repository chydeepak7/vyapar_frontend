import type { Item, ItemUnitConversion } from '@/lib/types';

export interface ConvRow {
  unit_id: number | null;
  unit_name: string;
  conversion_factor: number;
}

export function trimQty(n: number): string {
  if (!Number.isFinite(n)) return '0';
  const rounded = Math.round(n * 10000) / 10000;
  return String(rounded);
}

/** Split a quantity stored in the small unit into whole large units + remainder. */
export function splitByFactor(quantityInSmall: number, factor: number): { whole: number; remainder: number } {
  const f = Number(factor);
  const q = Number(quantityInSmall);
  if (!f || f <= 0 || !Number.isFinite(q)) return { whole: Number.isFinite(q) ? q : 0, remainder: 0 };
  const small = Math.round(q * 10000) / 10000;
  let whole = Math.floor((small + 1e-8) / f);
  let remainder = Math.round((small - whole * f) * 10000) / 10000;
  if (remainder < 0) remainder = 0;
  if (remainder >= f - 1e-6) {
    whole += 1;
    remainder = 0;
  }
  return { whole, remainder };
}

export function largestConversion(conversions: ItemUnitConversion[] | undefined): ItemUnitConversion | null {
  const rows = conversions || [];
  if (!rows.length) return null;
  return rows.reduce((best, row) =>
    Number(row.conversion_factor) >= Number(best.conversion_factor) ? row : best,
  );
}

export function stockPair(item: Pick<Item, 'stock' | 'unit_name' | 'unit_conversions'>) {
  const big = largestConversion(item.unit_conversions);
  if (!big) return null;
  const factor = Number(big.conversion_factor);
  const { whole, remainder } = splitByFactor(Number(item.stock) || 0, factor);
  return {
    whole,
    wholeUnit: big.unit_name,
    remainder,
    smallUnit: item.unit_name || 'pcs',
    factor,
  };
}

export function stockPairLabel(item: Pick<Item, 'stock' | 'unit_name' | 'unit_conversions'>): string | null {
  const pair = stockPair(item);
  if (!pair) return null;
  return `${trimQty(pair.whole)} ${pair.wholeUnit} and ${trimQty(pair.remainder)} ${pair.smallUnit}`;
}
