"use client"

import { useEffect, useMemo, useState } from "react"
import {
  useAddVariantMediaMutation,
  useGetVariantMediaQuery,
  useRemoveVariantMediaMutation,
  useSetPrimaryAttachmentMutation,
  useUpdateProductVariantMutation,
} from "@/redux/features/product/productAPISlice"
import type { Attachment, ProductVariant } from "@/redux/features/product/productTypes"
import CustomUpdateForm from "@/components/common/updateForm"
import { Camera, ImagePlus, Loader2, RefreshCw, Trash2 } from "lucide-react"
import Image from "next/image"
import { toast } from "react-toastify"

interface VariantDetailsTabProps {
  variant: ProductVariant
  onSuccess: () => void
}

const interfaceKeys: (keyof ProductVariant)[] = [
  "variant_barcode",
  "variant_sku",
  "pos_name",
  "price_override",
  "cost_override",
  "weight_override",
  "dimensions_override",
  "track_stock_override",
  "low_stock_threshold_override",
  "active",
  "pos_visible",
  "is_featured",
]

const VariantDetailsTab = ({ variant, onSuccess }: VariantDetailsTabProps) => {
  const [updateVariant, { isLoading: updateLoading }] = useUpdateProductVariantMutation()
  const { data: media = [], refetch: refetchMedia } = useGetVariantMediaQuery(variant.id)
  const [addVariantMedia, { isLoading: isUploadingImage }] = useAddVariantMediaMutation()
  const [setPrimaryAttachment] = useSetPrimaryAttachmentMutation()
  const [removeVariantMedia] = useRemoveVariantMediaMutation()
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null)
  const [selectedImagePreviewUrl, setSelectedImagePreviewUrl] = useState<string | null>(null)

  const currentMainImage = useMemo<Attachment | null>(() => {
    const primaryMain = media.find((attachment) => attachment.purpose === "MAIN_IMAGE" && attachment.is_primary)
    if (primaryMain) {
      return primaryMain
    }
    const fallbackMain = media.find((attachment) => attachment.purpose === "MAIN_IMAGE")
    if (fallbackMain) {
      return fallbackMain
    }
    return media.find((attachment) => attachment.file_type === "IMAGE") ?? null
  }, [media])

  useEffect(() => {
    return () => {
      if (selectedImagePreviewUrl) {
        URL.revokeObjectURL(selectedImagePreviewUrl)
      }
    }
  }, [selectedImagePreviewUrl])

  const handleUpdate = async (data: Partial<ProductVariant>) => {
    try {
      await updateVariant({ id: variant.id, data }).unwrap()
      onSuccess()
    } catch {
      toast.error("Failed to update variant.")
    }
  }

  const handleVariantImageSelection = (file: File | undefined) => {
    if (!file) {
      return
    }

    const allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"]
    if (!allowedMimeTypes.includes(file.type)) {
      toast.error("Only JPEG, PNG, WebP, and GIF images are supported.")
      return
    }

    if (selectedImagePreviewUrl) {
      URL.revokeObjectURL(selectedImagePreviewUrl)
    }

    setSelectedImageFile(file)
    setSelectedImagePreviewUrl(URL.createObjectURL(file))
  }

  const handleCancelPendingImage = () => {
    if (selectedImagePreviewUrl) {
      URL.revokeObjectURL(selectedImagePreviewUrl)
    }
    setSelectedImageFile(null)
    setSelectedImagePreviewUrl(null)
  }

  const handleReplaceVariantImage = async () => {
    if (!selectedImageFile) {
      toast.error("Choose a new image first.")
      return
    }

    try {
      const formData = new FormData()
      formData.append("file", selectedImageFile)
      formData.append("purpose", "MAIN_IMAGE")
      formData.append("description", selectedImageFile.name || `${variant.pos_display_name || "Variant"} main image`)

      const uploadedAttachment = await addVariantMedia({
        variantId: variant.id,
        data: formData,
      }).unwrap()

      await setPrimaryAttachment(uploadedAttachment.id).unwrap()

      if (currentMainImage?.id && currentMainImage.id !== uploadedAttachment.id) {
        await removeVariantMedia({
          variantId: variant.id,
          attachmentId: currentMainImage.id,
        }).unwrap()
      }

      await refetchMedia()
      handleCancelPendingImage()
      onSuccess()
      toast.success("Variant image updated successfully.")
    } catch {
      toast.error("Failed to replace variant image.")
    }
  }

  return (
    <div className="p-4 max-h-[70vh] overflow-y-auto">
      <div className="mb-6 overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 shadow-[0_24px_60px_-28px_rgba(2,6,23,0.9)]">
        <div className="flex items-center gap-2 border-b border-slate-800 px-5 py-4">
          <Camera className="h-4 w-4 text-slate-300" />
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-100">Variant image</h3>
        </div>

        <div className="grid gap-5 p-5 lg:grid-cols-[220px_minmax(0,1fr)]">
          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
            {selectedImagePreviewUrl || currentMainImage?.file_url || currentMainImage?.file || variant.main_image ? (
              <div className="relative h-56 w-full bg-slate-950">
                <Image
                  src={selectedImagePreviewUrl || currentMainImage?.file_url || currentMainImage?.file || variant.main_image || ""}
                  alt={variant.pos_display_name || variant.display_name || "Variant image"}
                  fill
                  sizes="220px"
                  className="object-contain"
                  unoptimized={selectedImagePreviewUrl?.startsWith("blob:")}
                />
              </div>
            ) : (
              <div className="flex h-56 w-full items-center justify-center bg-slate-900 text-center text-sm text-slate-400">
                No variant image yet
              </div>
            )}
          </div>

          <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-950 p-4">
            <div className="space-y-2">
              <h4 className="text-lg font-semibold text-white">
                {variant.pos_display_name || variant.display_name || variant.variant_sku || "Variant"}
              </h4>
              <p className="text-sm leading-6 text-slate-300">
                Replace the current main image here while editing the variant. The new image becomes the primary product image immediately.
              </p>
            </div>

            <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-950 p-4">
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-700 bg-slate-950 px-4 py-4 text-sm font-medium text-slate-100 transition hover:border-slate-500 hover:bg-slate-900">
                <ImagePlus className="h-4 w-4" />
                <span>{selectedImageFile ? "Choose another image" : "Choose new variant image"}</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(event) => handleVariantImageSelection(event.target.files?.[0])}
                />
              </label>

              {selectedImageFile ? (
                <div className="rounded-2xl border border-blue-900/60 bg-blue-950/40 px-4 py-3 text-sm text-blue-100">
                  <p className="font-medium">{selectedImageFile.name}</p>
                  <p className="mt-1 text-blue-200">{(selectedImageFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleReplaceVariantImage}
                  disabled={!selectedImageFile || isUploadingImage}
                  className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-700"
                >
                  {isUploadingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  <span>{isUploadingImage ? "Updating image..." : "Replace image"}</span>
                </button>

                {selectedImageFile ? (
                  <button
                    type="button"
                    onClick={handleCancelPendingImage}
                    disabled={isUploadingImage}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:bg-slate-800"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Clear selection</span>
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      <CustomUpdateForm
        data={variant}
        isLoading={updateLoading}
        onSubmit={handleUpdate}
        editableFields={interfaceKeys}
        displayKeys={[
          "pos_name",
          "variant_sku",
          "variant_barcode",
          "selling_price",
          "active",
          "pos_visible",
          "is_featured",
        ]}
        optionalFields={[
        "variant_barcode",
        "variant_sku",
        "pos_name",
        "price_override",
        "cost_override",
        "weight_override",
        "dimensions_override",
        "track_stock_override",
        "low_stock_threshold_override",
        'is_featured',
        'pos_visible',
        'active'
      ]}
        selectOptions={{}}
        keyInfo={{
          pos_name: "Custom name for POS display",
          variant_sku: "Stock Keeping Unit for the variant",
          variant_barcode: "Barcode for the variant",
          price_override: "Override product base price",
          cost_override: "Override product cost price",
          weight_override: "Override product weight (kg)",
          dimensions_override: "Override product dimensions (L x W x H in cm)",
          track_stock_override: "Override product stock tracking setting",
          low_stock_threshold_override: "Override low stock threshold",
          active: "Is the variant active for sale?",
          pos_visible: "Show in POS interface",
          is_featured: "Feature for quick access",
        }}
        notEditableFields={["id", "created_at", "updated_at", "variant_number", "product", "selling_price"]}
      />
    </div>
  )
}

export default VariantDetailsTab
