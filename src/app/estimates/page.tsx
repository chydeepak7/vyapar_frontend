import { TransactionList } from '@/components/TransactionList';

export default function EstimatesPage() {
  return <TransactionList txnType="Estimate" title="Estimates" createPath="/estimates/new" editPathBase="/estimates" />;
}
