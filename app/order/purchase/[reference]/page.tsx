
import PurchseOderDataDetail from "../../../../components/orders/purchaseOrder/Detail";

export default async function PurchseOderDataDetailPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const reference = (await params).reference;

  return (
    <div>
      <PurchseOderDataDetail id={reference} />
    </div>
  );
}
