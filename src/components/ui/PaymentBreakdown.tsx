'use client';

import { Trash2 } from 'lucide-react';
import type { PaymentLine, PaymentType } from '@/lib/types';

interface Props {
  paymentLines: PaymentLine[];
  onChange: (lines: PaymentLine[]) => void;
}

/** Reusable split-payment UI for modals (Payment In/Out, Expenses, Other Income). */
export function PaymentBreakdown({ paymentLines, onChange }: Props) {
  const addLine = () =>
    onChange([...paymentLines, { payment_type: 'Cash', amount: 0 }]);

  const updateLine = (index: number, field: keyof PaymentLine, value: string | number) =>
    onChange(paymentLines.map((pl, i) => (i === index ? { ...pl, [field]: value } : pl)));

  const removeLine = (index: number) =>
    onChange(paymentLines.filter((_, i) => i !== index));

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-slate-700">Payment Breakdown</label>
      {paymentLines.map((pl, idx) => (
        <div key={idx} className="space-y-1">
          <div className="flex items-center gap-1.5">
            <select
              value={pl.payment_type}
              onChange={(e) => updateLine(idx, 'payment_type', e.target.value as PaymentType)}
              className="flex-1 rounded border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-vyapar-500"
            >
              <option value="Cash">Cash</option>
              <option value="Cheque">Cheque</option>
              <option value="UPI">UPI</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Credit">Credit</option>
            </select>
            <input
              type="number"
              value={pl.amount}
              onChange={(e) => updateLine(idx, 'amount', +e.target.value)}
              placeholder="Amount"
              className="w-24 rounded border border-slate-200 px-2 py-1.5 text-right text-sm outline-none focus:border-vyapar-500"
            />
            <button
              type="button"
              onClick={() => removeLine(idx)}
              className="text-slate-300 hover:text-red-500"
            >
              <Trash2 size={15} />
            </button>
          </div>
          {pl.payment_type === 'Cheque' && (
            <input
              value={pl.reference_no || ''}
              onChange={(e) => updateLine(idx, 'reference_no', e.target.value)}
              placeholder="Cheque / Ref No."
              className="w-full rounded border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-vyapar-500"
            />
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={addLine}
        className="text-sm font-medium text-vyapar-600 hover:text-vyapar-700"
      >
        + Add Payment
      </button>
    </div>
  );
}
