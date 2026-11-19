import { InvoiceEditor } from '@/components/InvoiceEditor';

export default function EditEstimatePage({ params }: { params: { id: string } }) {
  return <InvoiceEditor txnType="Estimate" txnId={Number(params.id)} />;
}
