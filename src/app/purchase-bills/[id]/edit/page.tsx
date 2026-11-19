import { InvoiceEditor } from '@/components/InvoiceEditor';

export default function EditPurchaseBillPage({ params }: { params: { id: string } }) {
  return <InvoiceEditor txnType="PurchaseBill" txnId={Number(params.id)} />;
}
