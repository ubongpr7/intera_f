"use client"

import { useDeferredValue, useMemo, useState, type ChangeEvent } from "react"
import { Archive, Boxes, ChevronLeft, ChevronRight, Eye, FileUp, Filter, ImagePlus, PackagePlus, Pencil, Rocket, Search, Shapes, Star, Trash2 } from "lucide-react"
import { toast } from "react-toastify"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ReactSelectField, type SelectOption } from "@/components/ui/react-select-field"
import { Textarea } from "@/components/ui/textarea"
import { formatMachineLabel } from "@/lib/displayLabels"
import { getDecodedToken } from "@/lib/utils"
import { truthyAccessClaim } from "@/lib/permissionsGuard"
import { confirmAction } from "@/components/common/confirmAction"
import { GlobalProductPreviewSheet } from "@/components/product/GlobalProductLibrary"
import { useGetUnitsQuery } from "@/redux/features/common/typeOF"
import {
  useArchiveGlobalCatalogAdminProductMutation,
  useBulkIngestGlobalCatalogAdminProductsMutation,
  useCreateAttachmentMutation,
  useCreateGlobalCatalogAdminProductMutation,
  useCreateGlobalCatalogAdminVariantMutation,
  useDeleteAttachmentMutation,
  useDeleteGlobalCatalogAdminVariantMutation,
  useGetAttachmentsQuery,
  useGetGlobalCatalogAdminProductsQuery,
  useGetGlobalCatalogAdminStatsQuery,
  usePublishGlobalCatalogAdminProductMutation,
  useSetPrimaryAttachmentMutation,
  useUpdateGlobalCatalogAdminProductMutation,
  useUpdateGlobalCatalogAdminVariantMutation,
} from "@/redux/features/product/productAPISlice"
import type { Attachment, GlobalCatalogAdminProduct, GlobalCatalogVariant } from "@/redux/features/product/productTypes"

type StaffToken = {
  is_staff?: boolean | string | number | null
  is_superuser?: boolean | string | number | null
}

type ProductFormState = {
  name: string
  brand: string
  category_name: string
  short_description: string
  description: string
  base_price: string
  unit: string
}

type VariantFormState = {
  display_name: string
  variant_number: string
  barcode: string
  sku: string
  attributes_snapshot: string
  price_override: string
  image_url_override: string
  is_active: boolean
}

const initialProductForm: ProductFormState = {
  name: "",
  brand: "",
  category_name: "",
  short_description: "",
  description: "",
  base_price: "0",
  unit: "",
}

const initialVariantForm: VariantFormState = {
  display_name: "",
  variant_number: "1",
  barcode: "",
  sku: "",
  attributes_snapshot: '{"Size":"","Type":""}',
  price_override: "",
  image_url_override: "",
  is_active: true,
}

function buildVisiblePageNumbers(currentPage: number, totalPages: number) {
  if (totalPages <= 1) {
    return [1]
  }
  const start = Math.max(1, currentPage - 2)
  const end = Math.min(totalPages, start + 4)
  const normalizedStart = Math.max(1, end - 4)
  return Array.from({ length: end - normalizedStart + 1 }, (_, index) => normalizedStart + index)
}

const bulkIngestTemplate = JSON.stringify(
  {
    products: [
      {
        name: "Nivea Body Lotion",
        brand: "Nivea",
        category_name: "Personal Care",
        short_description: "Curated product family for workspace onboarding",
        base_price: "3500.00",
        unit: "bottle",
        source_status: "draft",
        variants: [
          {
            display_name: "Nivea Body Lotion 400ml",
            variant_number: 1,
            barcode: "NIVEA-400",
            sku: "NIVEA-400",
            attributes_snapshot: {
              Size: "400ml",
              Type: "Body Lotion",
            },
            price_override: "3500.00",
          },
        ],
      },
    ],
  },
  null,
  2,
)

type BulkCatalogProductPayload = {
  name: string
  brand?: string
  category_name?: string
  short_description?: string
  description?: string
  base_price?: string
  unit?: string
  source_status?: string
  variants: Array<{
    display_name: string
    variant_number: number
    barcode?: string
    sku?: string
    attributes_snapshot: Record<string, string>
    price_override?: string
    image_url_override?: string
    is_active?: boolean
  }>
}

const splitDelimitedLine = (line: string, delimiter: string) => {
  const values: string[] = []
  let current = ""
  let inQuotes = false
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index]
    const nextCharacter = line[index + 1]
    if (character === '"' && inQuotes && nextCharacter === '"') {
      current += '"'
      index += 1
      continue
    }
    if (character === '"') {
      inQuotes = !inQuotes
      continue
    }
    if (character === delimiter && !inQuotes) {
      values.push(current.trim())
      current = ""
      continue
    }
    current += character
  }
  values.push(current.trim())
  return values
}

const catalogRowsToProducts = (headers: string[], rows: string[][]): BulkCatalogProductPayload[] => {
  const products = new Map<string, BulkCatalogProductPayload>()

  rows.forEach((values, rowIndex) => {
    const row = headers.reduce<Record<string, string>>((accumulator, header, index) => {
      accumulator[header] = values[index] || ""
      return accumulator
    }, {})
    const productName = row.product_name || row.name
    if (!productName) {
      throw new Error(`Row ${rowIndex + 2} is missing product_name or name.`)
    }
    const brand = row.brand || ""
    const productKey = `${brand.toLowerCase()}::${productName.toLowerCase()}`
    const product = products.get(productKey) || {
      name: productName,
      brand,
      category_name: row.category_name || row.category || "",
      short_description: row.short_description || "",
      description: row.description || "",
      base_price: row.base_price || "0",
      unit: row.unit || "",
      source_status: row.source_status || "draft",
      variants: [],
    }

    let attributes: Record<string, string> = {}
    if (row.attributes_json) {
      attributes = JSON.parse(row.attributes_json)
    } else {
      attributes = Object.entries(row).reduce<Record<string, string>>((accumulator, [key, value]) => {
        if (key.startsWith("attribute_") && value) {
          accumulator[key.replace(/^attribute_/, "")] = value
        }
        return accumulator
      }, {})
    }

    product.variants.push({
      display_name: row.variant_display_name || row.display_name || productName,
      variant_number: Number(row.variant_number || product.variants.length + 1),
      barcode: row.barcode || undefined,
      sku: row.sku || undefined,
      attributes_snapshot: attributes,
      price_override: row.price_override || undefined,
      image_url_override: row.image_url_override || row.image_url || undefined,
      is_active: row.is_active ? row.is_active.toLowerCase() !== "false" : true,
    })
    products.set(productKey, product)
  })

  return Array.from(products.values())
}

const parseCatalogDelimitedText = (content: string): BulkCatalogProductPayload[] => {
  const lines = content
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
  if (lines.length < 2) {
    throw new Error("CSV/TSV file must contain a header row and at least one data row.")
  }

  const delimiter = lines[0].includes("\t") ? "\t" : ","
  const headers = splitDelimitedLine(lines[0], delimiter).map((header) => header.trim())
  const rows = lines.slice(1).map((line) => splitDelimitedLine(line, delimiter))
  return catalogRowsToProducts(headers, rows)
}

function buildProductForm(product?: GlobalCatalogAdminProduct | null): ProductFormState {
  if (!product) {
    return initialProductForm
  }
  return {
    name: product.name || "",
    brand: product.brand || "",
    category_name: product.category_name || "",
    short_description: product.short_description || "",
    description: product.description || "",
    base_price: String(product.base_price ?? 0),
    unit: product.unit || "",
  }
}

function buildVariantForm(variant?: GlobalCatalogVariant | null): VariantFormState {
  if (!variant) {
    return initialVariantForm
  }
  return {
    display_name: variant.display_name || "",
    variant_number: String(variant.variant_number ?? 1),
    barcode: variant.barcode || "",
    sku: variant.sku || "",
    attributes_snapshot: JSON.stringify(variant.attributes_snapshot || {}, null, 2),
    price_override: variant.price_override != null ? String(variant.price_override) : "",
    image_url_override: variant.image_url_override || "",
    is_active: variant.is_active,
  }
}

function resolveSelectValue(value: string, options: SelectOption[]) {
  if (!value) {
    return null
  }
  return options.find((option) => String(option.value) === value) ?? { label: value, value }
}

function ProductDialog({
  open,
  onOpenChange,
  product,
  brandOptions,
  categoryOptions,
  unitOptions,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  product?: GlobalCatalogAdminProduct | null
  brandOptions: SelectOption[]
  categoryOptions: SelectOption[]
  unitOptions: SelectOption[]
}) {
  const [form, setForm] = useState<ProductFormState>(buildProductForm(product))
  const [createProduct, { isLoading: isCreating }] = useCreateGlobalCatalogAdminProductMutation()
  const [updateProduct, { isLoading: isUpdating }] = useUpdateGlobalCatalogAdminProductMutation()

  const isEditing = Boolean(product)
  const isLoading = isCreating || isUpdating
  const selectMenuPortalTarget = typeof document !== "undefined" ? document.body : undefined

  const submit = async () => {
    try {
      const payload = {
        ...form,
        base_price: Number(form.base_price || 0),
        track_stock: true,
        allow_backorder: false,
        low_stock_threshold: 10,
      }

      if (isEditing && product) {
        await updateProduct({ id: product.id, data: payload }).unwrap()
        toast.success("Global source product updated.")
      } else {
        await createProduct(payload).unwrap()
        toast.success("Global source product created.")
      }

      onOpenChange(false)
    } catch (error: any) {
      toast.error(error?.data?.detail || "Failed to save the global source product.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl text-inherit">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit global source product" : "Create global source product"}</DialogTitle>
          <DialogDescription>
            The product family stays platform-owned and becomes importable by workspaces only after you publish it.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2 md:col-span-2">
            <label className="text-sm font-medium text-gray-700">Product family name</label>
            <Input value={form.name} onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))} placeholder="Product family name" />
          </div>
          <ReactSelectField
            label="Brand"
            value={resolveSelectValue(form.brand, brandOptions)}
            options={brandOptions}
            onChange={(option) => {
              const selected = Array.isArray(option) ? null : (option as SelectOption | null)
              setForm((current) => ({ ...current, brand: selected ? String(selected.value) : "" }))
            }}
            placeholder="Select or type a brand"
            isClearable
            isSearchable
            creatable
            formatCreateLabel={(inputValue: string) => `Use "${inputValue}"`}
            menuPortalTarget={selectMenuPortalTarget}
          />
          <ReactSelectField
            label="Category"
            value={resolveSelectValue(form.category_name, categoryOptions)}
            options={categoryOptions}
            onChange={(option) => {
              const selected = Array.isArray(option) ? null : (option as SelectOption | null)
              setForm((current) => ({ ...current, category_name: selected ? String(selected.value) : "" }))
            }}
            placeholder="Select or type a category"
            isClearable
            isSearchable
            creatable
            formatCreateLabel={(inputValue: string) => `Use "${inputValue}"`}
            menuPortalTarget={selectMenuPortalTarget}
          />
          <ReactSelectField
            label="Unit"
            value={resolveSelectValue(form.unit, unitOptions)}
            options={unitOptions}
            onChange={(option) => {
              const selected = Array.isArray(option) ? null : (option as SelectOption | null)
              setForm((current) => ({ ...current, unit: selected ? String(selected.value) : "" }))
            }}
            placeholder="Select or type a unit"
            isClearable
            isSearchable
            creatable
            formatCreateLabel={(inputValue: string) => `Use "${inputValue}"`}
            menuPortalTarget={selectMenuPortalTarget}
          />
          <div className="grid gap-2">
            <label className="text-sm font-medium text-gray-700">Base price</label>
            <Input value={form.base_price} onChange={(e) => setForm((current) => ({ ...current, base_price: e.target.value }))} placeholder="0.00" type="number" />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-gray-700">Short description</label>
            <Input value={form.short_description} onChange={(e) => setForm((current) => ({ ...current, short_description: e.target.value }))} placeholder="Short description" />
          </div>
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-gray-700">Product family description</label>
            <Textarea value={form.description} onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))} placeholder="Product family description" rows={5} />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => void submit()} disabled={isLoading}>
            {isLoading ? "Saving..." : isEditing ? "Save changes" : "Create product"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function VariantDialog({
  open,
  onOpenChange,
  product,
  variant,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: GlobalCatalogAdminProduct | null
  variant?: GlobalCatalogVariant | null
}) {
  const [form, setForm] = useState<VariantFormState>(buildVariantForm(variant))
  const [createVariant, { isLoading: isCreating }] = useCreateGlobalCatalogAdminVariantMutation()
  const [updateVariant, { isLoading: isUpdating }] = useUpdateGlobalCatalogAdminVariantMutation()

  const isEditing = Boolean(variant)
  const isLoading = isCreating || isUpdating

  const submit = async () => {
    if (!product) {
      toast.error("Choose a source product before adding a variant.")
      return
    }

    try {
      const payload = {
        global_product: product.id,
        display_name: form.display_name,
        variant_number: Number(form.variant_number || 1),
        barcode: form.barcode || undefined,
        sku: form.sku || undefined,
        attributes_snapshot: JSON.parse(form.attributes_snapshot || "{}"),
        price_override: form.price_override ? Number(form.price_override) : undefined,
        image_url_override: form.image_url_override || undefined,
        is_active: form.is_active,
      }

      if (isEditing && variant) {
        await updateVariant({ id: variant.id, data: payload }).unwrap()
        toast.success("Source variant updated.")
      } else {
        await createVariant(payload).unwrap()
        toast.success("Source variant created.")
      }

      onOpenChange(false)
    } catch (error: any) {
      const detail = error?.data?.detail || error?.message || "Failed to save the source variant."
      toast.error(detail)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl text-inherit">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit source variant" : `Add source variant to ${product?.name || "global product"}`}
          </DialogTitle>
          <DialogDescription>
            Source variants are the exact records workspaces inherit during import and sync.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 md:grid-cols-2">
          <Input value={form.display_name} onChange={(e) => setForm((current) => ({ ...current, display_name: e.target.value }))} placeholder="Variant display name" />
          <Input value={form.variant_number} onChange={(e) => setForm((current) => ({ ...current, variant_number: e.target.value }))} placeholder="Variant number" type="number" />
          <Input value={form.barcode} onChange={(e) => setForm((current) => ({ ...current, barcode: e.target.value }))} placeholder="Barcode" />
          <Input value={form.sku} onChange={(e) => setForm((current) => ({ ...current, sku: e.target.value }))} placeholder="SKU" />
          <Input value={form.price_override} onChange={(e) => setForm((current) => ({ ...current, price_override: e.target.value }))} placeholder="Price override" type="number" />
          <Input
            value={form.image_url_override}
            onChange={(e) => setForm((current) => ({ ...current, image_url_override: e.target.value }))}
            placeholder="Optional image URL override"
          />
          <div className="md:col-span-2">
            <Textarea
              value={form.attributes_snapshot}
              onChange={(e) => setForm((current) => ({ ...current, attributes_snapshot: e.target.value }))}
              placeholder='{"Size":"400ml","Type":"Body Lotion"}'
              rows={7}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => void submit()} disabled={isLoading}>
            {isLoading ? "Saving..." : isEditing ? "Save variant" : "Add variant"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function VariantMediaManager({
  variant,
  productName,
}: {
  variant: GlobalCatalogVariant
  productName: string
}) {
  const [open, setOpen] = useState(false)
  const { data: attachments = [], isLoading } = useGetAttachmentsQuery(
    { content_type: "global_catalog_variant", object_id: variant.id },
    { skip: !open },
  )
  const [createAttachment, { isLoading: isUploading }] = useCreateAttachmentMutation()
  const [setPrimaryAttachment, { isLoading: isSettingPrimary }] = useSetPrimaryAttachmentMutation()
  const [deleteAttachment, { isLoading: isDeleting }] = useDeleteAttachmentMutation()

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (!files.length) {
      return
    }

    try {
      for (const [index, file] of files.entries()) {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("file_type", "IMAGE")
        formData.append("purpose", attachments.length === 0 && index === 0 ? "MAIN_IMAGE" : "GALLERY")
        formData.append("is_primary", attachments.length === 0 && index === 0 ? "true" : "false")
        formData.append("content_type", "global_catalog_variant")
        formData.append("object_id", variant.id)
        formData.append("description", `Source image for ${variant.display_name}`)
        await createAttachment(formData).unwrap()
      }
      toast.success(`Source media updated for ${variant.display_name}.`)
    } catch (error: any) {
      toast.error(error?.data?.detail || "Failed to upload source media.")
    } finally {
      event.target.value = ""
    }
  }

  const handleSetPrimary = async (attachmentId: string) => {
    try {
      await setPrimaryAttachment(attachmentId).unwrap()
      toast.success("Primary source image updated.")
    } catch (error: any) {
      toast.error(error?.data?.detail || "Failed to set the primary image.")
    }
  }

  const handleDelete = async (attachmentId: string) => {
    try {
      await deleteAttachment(attachmentId).unwrap()
      toast.success("Source media deleted.")
    } catch (error: any) {
      toast.error(error?.data?.detail || "Failed to delete the source image.")
    }
  }

  return (
    <>
      <Button variant="outline" className="rounded-full" onClick={() => setOpen(true)}>
        <ImagePlus className="mr-2 h-4 w-4" />
        Manage media
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-5xl text-inherit">
          <DialogHeader>
            <DialogTitle>{variant.display_name}</DialogTitle>
            <DialogDescription>
              Source media for {productName}. Upload multiple images, select the primary visual, and remove outdated files.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-gray-600">
              {attachments.length} source image{attachments.length === 1 ? "" : "s"} attached to this variant.
            </div>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50">
              <ImagePlus className="h-4 w-4" />
              {isUploading ? "Uploading..." : "Upload image(s)"}
              <input type="file" accept="image/*" multiple className="hidden" onChange={(event) => void handleUpload(event)} />
            </label>
          </div>

          {isLoading ? (
            <div className="rounded-3xl border border-gray-200 bg-gray-50 p-6 text-sm text-gray-600">Loading source media...</div>
          ) : attachments.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm text-gray-600">
              No source images yet. Upload the first curated image for this variant.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {attachments.map((attachment) => (
                <div key={attachment.id} className="rounded-3xl border border-gray-200 bg-gray-50 p-4">
                  <div className="aspect-[4/3] overflow-hidden rounded-2xl border border-gray-200 bg-white">
                    {attachment.file_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={attachment.file_url} alt={attachment.description || variant.display_name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-gray-400">
                        <Boxes className="h-6 w-6" />
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {attachment.is_primary ? (
                      <Badge className="rounded-full border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-50">
                        Primary
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="rounded-full px-3 py-1 text-gray-600">
                        Gallery
                      </Badge>
                    )}
                    <Badge variant="outline" className="rounded-full px-3 py-1 text-gray-600">
                      {attachment.file_type}
                    </Badge>
                  </div>

                  <p className="mt-3 line-clamp-2 text-sm text-gray-600">
                    {attachment.description || "Curated source media"}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {!attachment.is_primary ? (
                      <Button variant="outline" className="rounded-full" onClick={() => void handleSetPrimary(String(attachment.id))} disabled={isSettingPrimary}>
                        <Star className="mr-2 h-4 w-4" />
                        Make primary
                      </Button>
                    ) : null}
                    <Button variant="outline" className="rounded-full text-red-600 hover:text-red-700" onClick={() => void handleDelete(String(attachment.id))} disabled={isDeleting}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

function VariantCard({
  product,
  variant,
  onEdit,
  onDelete,
}: {
  product: GlobalCatalogAdminProduct
  variant: GlobalCatalogVariant
  onEdit: (product: GlobalCatalogAdminProduct, variant: GlobalCatalogVariant) => void
  onDelete: (variant: GlobalCatalogVariant) => void
}) {
  const [updateVariant, { isLoading }] = useUpdateGlobalCatalogAdminVariantMutation()

  const toggleActive = async () => {
    try {
      await updateVariant({
        id: variant.id,
        data: {
          is_active: !variant.is_active,
        },
      }).unwrap()
      toast.success(variant.is_active ? "Source variant deactivated." : "Source variant reactivated.")
    } catch (error: any) {
      toast.error(error?.data?.detail || "Failed to update the source variant state.")
    }
  }

  return (
    <div className="rounded-3xl border border-gray-200 bg-gray-50 p-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 gap-4">
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-gray-200 bg-white">
            {variant.display_image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={variant.display_image} alt={variant.display_name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-gray-400">
                <Shapes className="h-5 w-5" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-base font-semibold text-gray-950">{variant.display_name}</p>
              <Badge variant="outline" className="rounded-full px-3 py-1 text-gray-600">
                Variant {variant.variant_number}
              </Badge>
              {!variant.is_active ? (
                <Badge variant="outline" className="rounded-full px-3 py-1 text-gray-500">
                  Inactive
                </Badge>
              ) : null}
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
              {variant.barcode ? <span className="rounded-full bg-white px-3 py-1">{variant.barcode}</span> : null}
              {variant.sku ? <span className="rounded-full bg-white px-3 py-1">{variant.sku}</span> : null}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {Object.entries(variant.attributes_snapshot || {}).map(([key, value]) => (
                <span key={`${variant.id}-${key}`} className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-600">
                  {key}: {String(value)}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <VariantMediaManager variant={variant} productName={product.name} />
          <Button variant="outline" className="rounded-full" onClick={() => onEdit(product, variant)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit variant
          </Button>
          <Button variant="outline" className="rounded-full" onClick={() => void toggleActive()} disabled={isLoading}>
            {variant.is_active ? "Deactivate" : "Reactivate"}
          </Button>
          <Button variant="outline" className="rounded-full text-red-600 hover:text-red-700" onClick={() => onDelete(variant)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>
    </div>
  )
}

function BulkIngestDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [rawPayload, setRawPayload] = useState(bulkIngestTemplate)
  const [bulkIngest, { isLoading }] = useBulkIngestGlobalCatalogAdminProductsMutation()

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }
    try {
      let products: BulkCatalogProductPayload[]
      if (/\.(xlsx|xls)$/i.test(file.name)) {
        const XLSX = await import("xlsx")
        const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" })
        const firstSheetName = workbook.SheetNames[0]
        if (!firstSheetName) {
          throw new Error("The spreadsheet does not contain any sheets.")
        }
        const rows = XLSX.utils.sheet_to_json<string[]>(workbook.Sheets[firstSheetName], {
          header: 1,
          raw: false,
          defval: "",
        })
        const [headerRow, ...dataRows] = rows
        if (!headerRow || dataRows.length === 0) {
          throw new Error("XLSX file must contain a header row and at least one data row.")
        }
        products = catalogRowsToProducts(
          headerRow.map((header) => String(header).trim()),
          dataRows.map((row) => row.map((value) => String(value).trim())).filter((row) => row.some(Boolean)),
        )
      } else {
        const text = await file.text()
        products = parseCatalogDelimitedText(text)
      }
      setRawPayload(JSON.stringify({ products }, null, 2))
      toast.success(`${products.length} product family${products.length === 1 ? "" : "ies"} loaded from ${file.name}. Review, then run ingest.`)
    } catch (error: any) {
      toast.error(error?.message || "Failed to parse the catalog CSV/TSV file.")
    } finally {
      event.target.value = ""
    }
  }

  const submit = async () => {
    try {
      const parsed = JSON.parse(rawPayload)
      const products = Array.isArray(parsed) ? parsed : parsed.products
      if (!Array.isArray(products)) {
        toast.error("Bulk ingest expects either an array of products or an object with a products array.")
        return
      }

      const result = await bulkIngest({ products }).unwrap()
      const message = [
        `${result.created_products} product${result.created_products === 1 ? "" : "s"} created`,
        `${result.updated_products} updated`,
        `${result.created_variants} variant${result.created_variants === 1 ? "" : "s"} created`,
        `${result.updated_variants} updated`,
      ].join(" · ")
      if (result.errors.length > 0) {
        toast.warn(`${message}. ${result.errors.length} row${result.errors.length === 1 ? "" : "s"} need review.`)
      } else {
        toast.success(message)
      }
      onOpenChange(false)
    } catch (error: any) {
      const detail = error?.data?.detail || error?.message || "Failed to bulk ingest global catalog products."
      toast.error(detail)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl text-inherit">
        <DialogHeader>
          <DialogTitle>Bulk ingest global source products</DialogTitle>
          <DialogDescription>
            Paste JSON or upload CSV/TSV exported from a prepared catalog sheet. Products are matched by brand and name; variants are matched by variant number.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-3xl border border-gray-200 bg-gray-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">Spreadsheet import</p>
              <p className="mt-1 text-xs leading-5 text-gray-600">
                Supported headers: product_name, brand, category_name, base_price, variant_display_name, variant_number, barcode, sku, price_override, attributes_json, or attribute_Size-style columns.
              </p>
            </div>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50">
              <FileUp className="h-4 w-4" />
              Upload CSV/XLSX
              <input type="file" accept=".csv,.tsv,.xlsx,.xls,text/csv,text/tab-separated-values" className="hidden" onChange={(event) => void handleFileUpload(event)} />
            </label>
          </div>
        </div>

        <Textarea
          value={rawPayload}
          onChange={(event) => setRawPayload(event.target.value)}
          rows={20}
          className="font-mono text-xs"
          spellCheck={false}
        />

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => void submit()} disabled={isLoading}>
            {isLoading ? "Ingesting..." : "Run ingest"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function GlobalCatalogAdminWorkspace() {
  const token = getDecodedToken() as StaffToken | null
  const isStaff = truthyAccessClaim(token?.is_staff) || truthyAccessClaim(token?.is_superuser)
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<GlobalCatalogAdminProduct | null>(null)
  const [variantProduct, setVariantProduct] = useState<GlobalCatalogAdminProduct | null>(null)
  const [editingVariant, setEditingVariant] = useState<GlobalCatalogVariant | null>(null)
  const [previewProductId, setPreviewProductId] = useState<string | null>(null)
  const [previewProductStatus, setPreviewProductStatus] = useState<string | null>(null)
  const [isBulkIngestOpen, setIsBulkIngestOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [query, setQuery] = useState("")
  const [brand, setBrand] = useState("")
  const [category, setCategory] = useState("")
  const [sourceStatus, setSourceStatus] = useState("")
  const deferredQuery = useDeferredValue(query.trim())
  const { data: catalogPage, isLoading, isFetching, error } = useGetGlobalCatalogAdminProductsQuery(
    {
      page,
      page_size: 12,
      q: deferredQuery || undefined,
      brand: brand || undefined,
      category: category || undefined,
      source_status: sourceStatus || undefined,
    },
    { skip: !isStaff },
  )
  const { data: adminStats, isLoading: loadingStats } = useGetGlobalCatalogAdminStatsQuery(undefined, { skip: !isStaff })
  const { data: units = [] } = useGetUnitsQuery()
  const [publishProduct, { isLoading: publishing }] = usePublishGlobalCatalogAdminProductMutation()
  const [archiveProduct, { isLoading: archiving }] = useArchiveGlobalCatalogAdminProductMutation()
  const [deleteVariant] = useDeleteGlobalCatalogAdminVariantMutation()

  const products = useMemo(() => catalogPage?.results ?? [], [catalogPage])
  const currentPage = catalogPage?.page ?? page
  const totalPages = catalogPage?.total_pages ?? 1
  const pageNumbers = useMemo(() => buildVisiblePageNumbers(currentPage, totalPages), [currentPage, totalPages])
  const filterOptions = catalogPage?.filters ?? adminStats?.filters
  const brandOptions = useMemo<SelectOption[]>(
    () => (filterOptions?.brands ?? []).map((value) => ({ label: value, value })),
    [filterOptions?.brands],
  )
  const categoryOptions = useMemo<SelectOption[]>(
    () => (filterOptions?.categories ?? []).map((value) => ({ label: value, value })),
    [filterOptions?.categories],
  )
  const unitOptions = useMemo<SelectOption[]>(
    () =>
      units.map((unit) => ({
        label: unit.dimension_type ? `${unit.name} (${unit.dimension_type})` : unit.name,
        value: unit.name,
      })),
    [units],
  )
  const statusOptions = useMemo<SelectOption[]>(
    () => (filterOptions?.source_statuses ?? []).map((value) => ({ label: formatMachineLabel(value), value })),
    [filterOptions?.source_statuses],
  )
  const selectedBrandOption = useMemo<SelectOption | null>(
    () => brandOptions.find((option) => option.value === brand) ?? null,
    [brand, brandOptions],
  )
  const selectedCategoryOption = useMemo<SelectOption | null>(
    () => categoryOptions.find((option) => option.value === category) ?? null,
    [category, categoryOptions],
  )
  const selectedStatusOption = useMemo<SelectOption | null>(
    () => statusOptions.find((option) => option.value === sourceStatus) ?? null,
    [sourceStatus, statusOptions],
  )

  const stats = useMemo(
    () => ({
      total: adminStats?.total_products ?? 0,
      published: adminStats?.published_products ?? 0,
      drafts: adminStats?.draft_products ?? 0,
      archived: adminStats?.archived_products ?? 0,
    }),
    [adminStats],
  )

  if (!isStaff) {
    return (
      <Card className="border-amber-200 bg-amber-50 shadow-sm">
        <CardHeader className="p-6 text-left text-inherit">
          <CardTitle className="text-xl text-amber-950">Global catalog admin requires a staff session</CardTitle>
          <CardDescription className="mt-2 text-sm leading-6 text-amber-900">
            This page is restricted to Intera IMS platform staff. If your account should have access, refresh your session so the latest staff claims are loaded into the frontend.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const openCreateProduct = () => {
    setEditingProduct(null)
    setIsProductDialogOpen(true)
  }

  const openEditProduct = (product: GlobalCatalogAdminProduct) => {
    setEditingProduct(product)
    setIsProductDialogOpen(true)
  }

  const openCreateVariant = (product: GlobalCatalogAdminProduct) => {
    setVariantProduct(product)
    setEditingVariant(null)
  }

  const openEditVariant = (product: GlobalCatalogAdminProduct, variant: GlobalCatalogVariant) => {
    setVariantProduct(product)
    setEditingVariant(variant)
  }

  const openPreviewProduct = (product: GlobalCatalogAdminProduct) => {
    setPreviewProductId(product.id)
    setPreviewProductStatus(product.source_status)
  }

  const handlePublish = async (id: string) => {
    try {
      await publishProduct(id).unwrap()
      toast.success("Global source product published.")
    } catch (error: any) {
      toast.error(error?.data?.detail || "Failed to publish the global source product.")
    }
  }

  const handleArchive = async (id: string) => {
    try {
      await archiveProduct(id).unwrap()
      toast.success("Global source product archived.")
    } catch (error: any) {
      toast.error(error?.data?.detail || "Failed to archive the global source product.")
    }
  }

  const handleDeleteVariant = async (variant: GlobalCatalogVariant) => {
    const confirmed = await confirmAction({
      title: "Delete source catalog variant?",
      description: `Delete "${variant.display_name}" from the global source catalog? Use deactivate instead if this variant has ever been imported.`,
      confirmText: "Delete variant",
      destructive: true,
    })
    if (!confirmed) return

    try {
      await deleteVariant(variant.id).unwrap()
      toast.success("Unused source variant deleted.")
    } catch (error: any) {
      toast.error(error?.data?.detail || "Failed to delete the source variant.")
    }
  }

  return (
    <>
      <div className="min-w-0 space-y-6 overflow-x-hidden">

      <Card className="w-full max-w-full overflow-hidden border-gray-200 shadow-sm">
        <CardHeader className="border-b border-gray-100 p-6 text-left text-inherit">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-700">
                <Boxes className="h-3.5 w-3.5" />
                Intera IMS catalog staff
              </div>
              <CardTitle className="mt-3 text-2xl tracking-tight">Curate the master global product catalog</CardTitle>
              <CardDescription className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
                Create source product families, maintain source variants, attach multiple curated images, and publish only the records workspaces should inherit. Use the filters below to find what needs updating fast.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" onClick={() => setIsBulkIngestOpen(true)} className="rounded-full">
                <Boxes className="mr-2 h-4 w-4" />
                Bulk ingest
              </Button>
              <Button onClick={openCreateProduct} className="rounded-full">
                <PackagePlus className="mr-2 h-4 w-4" />
                New source product
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="min-w-0 space-y-5 p-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Total source products</p>
              <p className="mt-3 text-3xl font-semibold text-gray-950">{loadingStats ? "..." : stats.total}</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Published</p>
              <p className="mt-3 text-3xl font-semibold text-gray-950">{loadingStats ? "..." : stats.published}</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Drafts</p>
              <p className="mt-3 text-3xl font-semibold text-gray-950">{loadingStats ? "..." : stats.drafts}</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Archived</p>
              <p className="mt-3 text-3xl font-semibold text-gray-950">{loadingStats ? "..." : stats.archived}</p>
            </div>
          </div>

          <div className="grid gap-3 rounded-3xl border border-gray-200 bg-white p-4 xl:grid-cols-[minmax(0,1.3fr)_repeat(3,minmax(0,1fr))]">
            <div className="grid gap-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                <Search className="h-4 w-4 text-blue-600" />
                Search source catalog
              </div>
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value)
                    setPage(1)
                  }}
                  placeholder="Search by product name, brand, or category"
                  className="h-12 rounded-full border-gray-200 bg-white pl-11"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                <Filter className="h-4 w-4 text-blue-600" />
                Brand
              </div>
              <ReactSelectField
                value={selectedBrandOption}
                options={brandOptions}
                onChange={(option) => {
                  const selected = Array.isArray(option) ? null : (option as SelectOption | null)
                  setBrand(selected ? String(selected.value) : "")
                  setPage(1)
                }}
                placeholder="All brands"
                isClearable
                className="text-sm"
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                <Filter className="h-4 w-4 text-blue-600" />
                Category
              </div>
              <ReactSelectField
                value={selectedCategoryOption}
                options={categoryOptions}
                onChange={(option) => {
                  const selected = Array.isArray(option) ? null : (option as SelectOption | null)
                  setCategory(selected ? String(selected.value) : "")
                  setPage(1)
                }}
                placeholder="All categories"
                isClearable
                className="text-sm"
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                <Filter className="h-4 w-4 text-blue-600" />
                Status
              </div>
              <ReactSelectField
                value={selectedStatusOption}
                options={statusOptions}
                onChange={(option) => {
                  const selected = Array.isArray(option) ? null : (option as SelectOption | null)
                  setSourceStatus(selected ? String(selected.value) : "")
                  setPage(1)
                }}
                placeholder="All statuses"
                isClearable
                className="text-sm"
              />
            </div>
          </div>

          {error ? (
            <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
              Failed to load the admin catalog. Refresh the page and retry.
            </div>
          ) : isLoading ? (
            <div className="rounded-3xl border border-gray-200 bg-gray-50 p-6 text-sm text-gray-600">Loading master catalog...</div>
          ) : products.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm text-gray-600">
              No global source products matched the current filters. Clear the filters or create the first source family.
            </div>
          ) : (
            <div className="min-w-0 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-gray-200 bg-gray-50 p-4">
                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                  <span className="rounded-full bg-white px-3 py-1">Showing {products.length} on this page</span>
                  <span className="rounded-full bg-white px-3 py-1">{catalogPage?.count?.toLocaleString() ?? 0} matching source products</span>
                  <span className="rounded-full bg-white px-3 py-1">{stats.total.toLocaleString()} total source products</span>
                  {isFetching && !isLoading ? <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">Refreshing...</span> : null}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full"
                  onClick={() => {
                    setQuery("")
                    setBrand("")
                    setCategory("")
                    setSourceStatus("")
                    setPage(1)
                  }}
                  disabled={!query && !brand && !category && !sourceStatus}
                >
                  Clear filters
                </Button>
              </div>
              {products.map((product) => (
                <div key={product.id} className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex min-w-0 gap-4">
                      <div className="h-24 w-24 shrink-0 overflow-hidden rounded-3xl border border-gray-200 bg-gray-100">
                        {product.display_image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={product.display_image} alt={product.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-gray-400">
                            <Boxes className="h-6 w-6" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-lg font-semibold text-gray-950">{product.name}</p>
                          <Badge variant="outline" className="rounded-full px-3 py-1 text-gray-600">
                            {formatMachineLabel(product.source_status)}
                          </Badge>
                          <Badge variant="outline" className="rounded-full px-3 py-1 text-gray-600">
                            {product.variant_count} variants
                          </Badge>
                        </div>
                        <p className="mt-2 text-sm text-gray-600">
                          {[product.brand, product.category_name].filter(Boolean).join(" · ") || "Source family"}
                        </p>
                        <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
                          {product.short_description || product.description || "No source description added yet."}
                        </p>
                        <p className="mt-2 text-xs text-gray-500">Version {product.version}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button variant="outline" className="rounded-full" onClick={() => openPreviewProduct(product)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Preview
                      </Button>
                      <Button variant="outline" className="rounded-full" onClick={() => openEditProduct(product)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit product
                      </Button>
                      <Button variant="outline" className="rounded-full" onClick={() => openCreateVariant(product)}>
                        <Shapes className="mr-2 h-4 w-4" />
                        Add variant
                      </Button>
                      {product.source_status !== "published" ? (
                        <Button className="rounded-full" onClick={() => void handlePublish(product.id)} disabled={publishing}>
                          <Rocket className="mr-2 h-4 w-4" />
                          Publish
                        </Button>
                      ) : (
                        <Button variant="outline" className="rounded-full" onClick={() => void handleArchive(product.id)} disabled={archiving}>
                          <Archive className="mr-2 h-4 w-4" />
                          Archive
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    {product.variants && product.variants.length > 0 ? (
                      product.variants.map((variant) => (
                        <VariantCard
                          key={variant.id}
                          product={product}
                          variant={variant}
                          onEdit={openEditVariant}
                          onDelete={(selectedVariant) => void handleDeleteVariant(selectedVariant)}
                        />
                      ))
                    ) : (
                      <div className="rounded-3xl border border-dashed border-gray-300 bg-gray-50 p-5 text-sm text-gray-600">
                        This source product has no variants yet. Add the first source variant before publishing it to workspaces.
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {products.length > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-gray-200 bg-white p-4">
              <p className="text-sm text-gray-600">
                Admin page <span className="font-semibold text-gray-950">{currentPage}</span> of <span className="font-semibold text-gray-950">{totalPages}</span>
                {isFetching && !isLoading ? <span className="ml-2 rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-700">Refreshing...</span> : null}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full"
                  disabled={currentPage <= 1 || isFetching}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Previous
                </Button>
                <div className="flex flex-wrap items-center gap-2">
                  {pageNumbers.map((pageNumber) => (
                    <Button
                      key={pageNumber}
                      type="button"
                      variant={pageNumber === currentPage ? "default" : "outline"}
                      className="min-w-10 rounded-full"
                      disabled={isFetching}
                      onClick={() => setPage(pageNumber)}
                    >
                      {pageNumber}
                    </Button>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full"
                  disabled={currentPage >= totalPages || isFetching}
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                >
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
      </div>

      <ProductDialog
        key={`${editingProduct?.id ?? "new-product"}-${isProductDialogOpen ? "open" : "closed"}`}
        open={isProductDialogOpen}
        onOpenChange={setIsProductDialogOpen}
        product={editingProduct}
        brandOptions={brandOptions}
        categoryOptions={categoryOptions}
        unitOptions={unitOptions}
      />
      <VariantDialog
        key={`${variantProduct?.id ?? "no-product"}-${editingVariant?.id ?? "new-variant"}-${variantProduct ? "open" : "closed"}`}
        open={!!variantProduct}
        onOpenChange={(open) => {
          if (!open) {
            setVariantProduct(null)
            setEditingVariant(null)
          }
        }}
        product={variantProduct}
        variant={editingVariant}
      />
      <BulkIngestDialog open={isBulkIngestOpen} onOpenChange={setIsBulkIngestOpen} />
      <GlobalProductPreviewSheet
        mode="admin"
        productId={previewProductId}
        sourceStatus={previewProductStatus}
        onOpenChange={(open) => {
          if (!open) {
            setPreviewProductId(null)
            setPreviewProductStatus(null)
          }
        }}
      />
    </>
  )
}
