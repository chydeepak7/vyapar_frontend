import { TransactionList } from '@/components/TransactionList';

export default function PurchaseOrdersPage() {
  return <TransactionList txnType="PurchaseOrder" title="Purchase Orders" />;
}
