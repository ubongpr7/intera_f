"use client"

import { useState } from "react"
import { CheckCircle2, Image as ImageIcon, RefreshCw, Rocket } from "lucide-react"
import { toast } from "react-toastify"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useGetUnitsQuery } from "@/redux/features/common/typeOF"
import {
  useGetGlobalProductCapturesQuery,
  usePromoteGlobalProductCaptureMutation,
} from "@/redux/features/product/productAPISlice"
import type { GlobalProductCapture } from "@/redux/features/product/productTypes"

type PromotionDraft = {
  name: string
  brand: string
  category_name: string
  base_uom_code: string
  purchase_uom_code: string
  sales_uom_code: string
  purchase_uom_conversion_factor: string
  sales_uom_conversion_factor: string
  variant_name: string
  variant_uom_code: string
  pack_quantity: string
}

function draftFromCapture(capture: GlobalProductCapture): PromotionDraft {
  const suggestedName = capture.name_hint?.trim() || `Product ${capture.barcode}`
  return {
    name: suggestedName,
    brand: "",
    category_name: "",
    base_uom_code: "unit",
    purchase_uom_code: "unit",
    sales_uom_code: "unit",
    purchase_uom_conversion_factor: "1",
    sales_uom_conversion_factor: "1",
    variant_name: suggestedName,
    variant_uom_code: "unit",
    pack_quantity: "1",
  }
}

const statusTone: Record<GlobalProductCapture["status"], string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-800",
  processing: "border-blue-200 bg-blue-50 text-blue-800",
  review: "border-violet-200 bg-violet-50 text-violet-800",
  accepted: "border-emerald-200 bg-emerald-50 text-emerald-800",
  rejected: "border-red-200 bg-red-50 text-red-800",
}

export default function GlobalCatalogCaptureQueue() {
  const [status, setStatus] = useState("review")
  const [selectedCapture, setSelectedCapture] = useState<GlobalProductCapture | null>(null)
  const [draft, setDraft] = useState<PromotionDraft | null>(null)
  const { data, isLoading, isFetching, refetch } = useGetGlobalProductCapturesQuery({ status, page_size: 20 })
  const { data: units = [] } = useGetUnitsQuery()
  const [promote, { isLoading: isPromoting }] = usePromoteGlobalProductCaptureMutation()

  const openPromotion = (capture: GlobalProductCapture) => {
    setSelectedCapture(capture)
    setDraft(draftFromCapture(capture))
  }

  const updateDraft = (key: keyof PromotionDraft, value: string) => {
    setDraft((current) => current ? { ...current, [key]: value } : current)
  }

  const submitPromotion = async () => {
    if (!selectedCapture || !draft) return
    if (!draft.name.trim() || !draft.variant_name.trim()) {
      toast.error("Product and variant names are required.")
      return
    }
    try {
      await promote({
        id: selectedCapture.id,
        product: {
          name: draft.name.trim(),
          brand: draft.brand.trim(),
          category_name: draft.category_name.trim(),
          base_uom_code: draft.base_uom_code,
          purchase_uom_code: draft.purchase_uom_code,
          sales_uom_code: draft.sales_uom_code,
          purchase_uom_conversion_factor: Number(draft.purchase_uom_conversion_factor || 1),
          sales_uom_conversion_factor: Number(draft.sales_uom_conversion_factor || 1),
          source_status: "draft",
        },
        variant: {
          display_name: draft.variant_name.trim(),
          barcode: selectedCapture.barcode,
          variant_number: 1,
          uom_code: draft.variant_uom_code,
          pack_quantity: Number(draft.pack_quantity || 1),
          attributes_snapshot: {},
          is_active: true,
        },
      }).unwrap()
      toast.success("Field capture promoted to a draft global product.")
      setSelectedCapture(null)
      setDraft(null)
    } catch (error: any) {
      toast.error(error?.data?.detail || "Unable to promote this field capture.")
    }
  }

  return (
    <Card className="border-gray-200 bg-white shadow-sm">
      <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-xl text-gray-950">Field capture review</CardTitle>
          <CardDescription>Turn staff barcode and image captures into labeled global products with explicit UOM settings.</CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700">
            <option value="review">Needs review</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="rejected">Rejected</option>
            <option value="accepted">Accepted</option>
          </select>
          <Button type="button" variant="outline" className="rounded-xl" onClick={() => void refetch()} disabled={isFetching}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? <p className="text-sm text-gray-600">Loading captures...</p> : null}
        {!isLoading && !data?.results?.length ? <p className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6 text-sm text-gray-600">No captures in this queue.</p> : null}
        <div className="grid gap-4 lg:grid-cols-2">
          {data?.results?.map((capture) => (
            <article key={capture.id} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex gap-4">
                <div className="grid h-24 w-24 shrink-0 grid-cols-2 gap-1 overflow-hidden rounded-xl border border-gray-200 bg-white p-1">
                  {[capture.image_url, ...(capture.attachments?.map((attachment) => attachment.file_url) || [])].filter(Boolean).slice(0, 4).map((url, index) => <img key={`${url}-${index}`} src={url as string} alt={`${capture.name_hint || capture.barcode} ${index + 1}`} className="h-full w-full rounded object-cover" />)}
                  {!capture.image_url && !capture.attachments?.length ? <div className="col-span-2 flex h-full items-center justify-center text-gray-400"><ImageIcon className="h-6 w-6" /></div> : null}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate font-semibold text-gray-950">{capture.name_hint || "Unnamed capture"}</h3>
                    <Badge variant="outline" className={`rounded-full ${statusTone[capture.status]}`}>{capture.status}</Badge>
                  </div>
                  <p className="mt-2 font-mono text-sm text-gray-700">{capture.barcode}</p>
                  <p className="mt-1 text-xs text-gray-500">Captured {new Date(capture.created_at).toLocaleString()}</p>
                  {capture.notes ? <p className="mt-2 line-clamp-2 text-sm text-gray-600">{capture.notes}</p> : null}
                </div>
              </div>
              {capture.status !== "accepted" ? <Button type="button" className="mt-4 w-full rounded-xl" onClick={() => openPromotion(capture)}><Rocket className="mr-2 h-4 w-4" />Label and promote to global product</Button> : <p className="mt-4 flex items-center gap-2 text-sm font-medium text-emerald-700"><CheckCircle2 className="h-4 w-4" />Already promoted</p>}
            </article>
          ))}
        </div>
      </CardContent>

      {selectedCapture && draft ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div><h2 className="text-xl font-semibold text-gray-950">Label captured product</h2><p className="mt-1 text-sm text-gray-600">Barcode: <span className="font-mono">{selectedCapture.barcode}</span></p></div>
              <Button variant="ghost" onClick={() => setSelectedCapture(null)}>Close</Button>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {(["name", "brand", "category_name", "variant_name"] as const).map((key) => <label key={key} className="grid gap-2 text-sm font-medium text-gray-700">{key === "category_name" ? "Category" : key === "variant_name" ? "Variant name" : key === "name" ? "Product name" : "Brand"}<Input value={draft[key]} onChange={(event) => updateDraft(key, event.target.value)} /></label>)}
              {(["base_uom_code", "purchase_uom_code", "sales_uom_code", "variant_uom_code"] as const).map((key) => <label key={key} className="grid gap-2 text-sm font-medium text-gray-700">{key.replaceAll("_", " ")}<select value={draft[key]} onChange={(event) => updateDraft(key, event.target.value)} className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm"><option value="unit">Unit (unit)</option>{units.map((unit: any) => <option key={unit.code || unit.id} value={unit.code || unit.id}>{unit.name || unit.label || unit.code} ({unit.code || unit.id})</option>)}</select></label>)}
              <label className="grid gap-2 text-sm font-medium text-gray-700">Purchase conversion<Input type="number" min="0.000001" step="0.000001" value={draft.purchase_uom_conversion_factor} onChange={(event) => updateDraft("purchase_uom_conversion_factor", event.target.value)} /><span className="text-xs font-normal text-gray-500">Base units inside one purchase unit, for example 24 pieces per carton.</span></label>
              <label className="grid gap-2 text-sm font-medium text-gray-700">Sales conversion<Input type="number" min="0.000001" step="0.000001" value={draft.sales_uom_conversion_factor} onChange={(event) => updateDraft("sales_uom_conversion_factor", event.target.value)} /><span className="text-xs font-normal text-gray-500">Base units inside one sales unit, for example 6 pieces per pack.</span></label>
              <label className="grid gap-2 text-sm font-medium text-gray-700">Variant pack quantity<Input type="number" min="0.000001" step="0.000001" value={draft.pack_quantity} onChange={(event) => updateDraft("pack_quantity", event.target.value)} /></label>
            </div>
            <div className="mt-6 flex justify-end gap-2"><Button variant="outline" onClick={() => setSelectedCapture(null)}>Cancel</Button><Button onClick={() => void submitPromotion()} disabled={isPromoting}>{isPromoting ? "Promoting..." : "Create draft global product"}</Button></div>
          </div>
        </div>
      ) : null}
    </Card>
  )
}
