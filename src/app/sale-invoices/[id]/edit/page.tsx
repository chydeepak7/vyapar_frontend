import { InvoiceEditor } from '@/components/InvoiceEditor';

export default function EditSaleInvoicePage({ params }: { params: { id: string } }) {
  return <InvoiceEditor txnType="SaleInvoice" txnId={Number(params.id)} />;
}
