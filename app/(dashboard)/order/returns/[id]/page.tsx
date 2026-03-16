import ReturnOrderOperationsWorkspace from "@/components/orders/returnOrder/ReturnOrderOperationsWorkspace"

export default async function ReturnOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = (await params).id

  return <ReturnOrderOperationsWorkspace returnOrderId={id} />
}
