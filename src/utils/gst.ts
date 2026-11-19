import type { TransactionLine } from '@/lib/types';

export interface LineCalc {
  amount: number;
  gstAmount: number;
  total: number;
}

export function calcLine(line: TransactionLine): LineCalc {
  const gross = line.qty * line.rate;
  const discount = (gross * line.discount_percent) / 100;
  const amount = round(gross - discount);
  const gstAmount = round((amount * line.gst_rate) / 100);
  return { amount, gstAmount, total: round(amount + gstAmount) };
}

export interface TxnTotals {
  subTotal: number;
  discountAmount: number;
  additionalCharges: number;
  roundOff: number;
  cgst: number;
  sgst: number;
  igst: number;
  cess: number;
  totalAmount: number;
}

export function calcTxnTotals(
  lines: TransactionLine[],
  interState: boolean,
  txnDiscount: number,
  additionalCharges: number,
  doRoundOff: boolean,
): TxnTotals {
  let subTotal = 0;
  let totalGst = 0;

  for (const line of lines) {
    const c = calcLine(line);
    subTotal += c.amount;
    totalGst += c.gstAmount;
  }

  const effectiveSubtotal = subTotal - txnDiscount;
  const gstRatio = subTotal > 0 ? totalGst / subTotal : 0;
  const adjustedGst = round(effectiveSubtotal * gstRatio);

  const beforeRound = effectiveSubtotal + adjustedGst + additionalCharges;
  const rounded = doRoundOff ? round(beforeRound) : beforeRound;
  const roundOff = doRoundOff ? round(rounded - beforeRound) : 0;

  let cgst = 0;
  let sgst = 0;
  let igst = 0;

  if (interState) {
    igst = adjustedGst;
  } else {
    cgst = round(adjustedGst / 2);
    sgst = round(adjustedGst - cgst);
  }

  return {
    subTotal: round(effectiveSubtotal),
    discountAmount: round(txnDiscount),
    additionalCharges: round(additionalCharges),
    roundOff,
    cgst,
    sgst,
    igst,
    cess: 0,
    totalAmount: round(rounded),
  };
}

export function round(n: number): number {
  return Math.round(n * 100) / 100;
}

export function isIntraState(businessState: string, partyState: string | undefined): boolean {
  if (!partyState) return true;
  return businessState.toLowerCase() === partyState.toLowerCase();
}
