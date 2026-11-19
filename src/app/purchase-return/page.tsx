import { TransactionList } from '@/components/TransactionList';

export default function PurchaseReturnPage() {
  return <TransactionList txnType="PurchaseReturn" title="Purchase Returns (Debit Notes)" />;
}
