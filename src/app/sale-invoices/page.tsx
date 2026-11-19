import { TransactionList } from '@/components/TransactionList';

export default function SaleInvoicesPage() {
  return <TransactionList txnType="SaleInvoice" title="Sale Invoices" createPath="/sale-invoices/new" editPathBase="/sale-invoices" />;
}
