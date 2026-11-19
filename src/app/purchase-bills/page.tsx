import { TransactionList } from '@/components/TransactionList';

export default function PurchaseBillsPage() {
  return <TransactionList txnType="PurchaseBill" title="Purchase Bills" createPath="/purchase-bills/new" editPathBase="/purchase-bills" />;
}
