import PurchaseOrderOperationsWorkspace from "@/components/orders/purchaseOrder/PurchaseOrderOperationsWorkspace"

export default async function PurchseOderDataDetailPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const reference = (await params).reference

  return (
    <div>
      <PurchaseOrderOperationsWorkspace purchaseOrderId={reference} />
    </div>
  )
}
