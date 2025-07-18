import PurchseOderDataDetailView from "@/components/product/ProductDetailPage";

export default async function PurchseOderDataDetailPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const reference = (await params).reference;
  
  return (
    <div>
      <PurchseOderDataDetailView reference={reference}  />
    </div>
  );
}
