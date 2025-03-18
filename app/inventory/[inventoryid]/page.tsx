import InventoryDetail from "components/inventory/Detail";

export default async function InventoryDetailPage({
  params,
}: {
  params: Promise<{ inventoryid: string }>;
}) {
  const inventoryId = (await params).inventoryid;

  return (
    <div>
      <InventoryDetail id={inventoryId} />
    </div>
  );
}
