import InventoryOperationsWorkspace from "@/components/inventory/InventoryOperationsWorkspace"

export default async function InventoryDetailPage({
  params,
}: {
  params: Promise<{ inventoryid: string }>
}) {
  const inventoryId = (await params).inventoryid

  return <InventoryOperationsWorkspace inventoryId={inventoryId} />
}
