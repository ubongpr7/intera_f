
import ProductDetail from "@/components/product/ProductPage"
export default async function ProductPageDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const Id = (await params).id

  return (
    <div>
      <ProductDetail Id={Id}/>
    </div>
  )
}
