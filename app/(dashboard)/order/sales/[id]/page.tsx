import SalesOrderOperationsWorkspace from "@/components/orders/salesOrder/SalesOrderOperationsWorkspace"

export default async function SalesOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = (await params).id

  return <SalesOrderOperationsWorkspace salesOrderId={id} />
}
