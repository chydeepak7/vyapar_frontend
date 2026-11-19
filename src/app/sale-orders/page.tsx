import { TransactionList } from '@/components/TransactionList';

export default function SaleOrdersPage() {
  return <TransactionList txnType="SaleOrder" title="Sale Orders" />;
}
