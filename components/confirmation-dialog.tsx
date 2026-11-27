"use client"

import { useState } from "react"
import Image from "next/image"
import { AlertTriangle, CheckCircle, Info, Package, ShoppingCart, ArrowRightLeft, CreditCard } from "lucide-react"
import { useOverlayDismiss } from "@/components/common/useOverlayDismiss"
import { formatMachineLabel } from "@/lib/displayLabels"
import { readWorkflowContract } from "@/lib/agent-structured-output"

interface ConfirmationData {
  interaction_type: string
  title: string
  description: string
  action_type: string
  details?: string
  approve_text: string
  deny_text: string
  allow_input: boolean
  [key: string]: any
}

interface ConfirmationDialogProps {
  data: ConfirmationData
  onResponse: (response: {
    approved: boolean
    action_type: string
    additional_instructions: string
  }) => void
  onClose: () => void
}

export default function ConfirmationDialog({ data, onResponse, onClose }: ConfirmationDialogProps) {
  const [additionalInstructions, setAdditionalInstructions] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [workflowCopied, setWorkflowCopied] = useState(false)

  useOverlayDismiss({ onClose })

  const handleResponse = async (approved: boolean) => {
    setIsSubmitting(true)

    const response = {
      approved,
      action_type: data.action_type,
      additional_instructions: additionalInstructions.trim(),
    }

    // Send structured response
    onResponse(response)
    onClose()
  }

  const getActionIcon = () => {
    const action = data.action_type.toLowerCase()
    if (action.includes("delete") || action.includes("remove")) {
      return <AlertTriangle className="h-6 w-6 text-red-500" />
    }
    if (action.includes("update") || action.includes("modify")) {
      return <Info className="h-6 w-6 text-blue-500" />
    }
    return <CheckCircle className="h-6 w-6 text-green-500" />
  }

  const renderWorkflowPreview = () => {
    const preview = data.adjustment || data.transfer || data.payment || data.change || data.line_item || data.price_change
    const order = data.order || data.purchase_order
    const items = Array.isArray(data.items)
      ? data.items
      : Array.isArray(data.adjustments)
        ? data.adjustments
        : Array.isArray(data.transfers)
          ? data.transfers
          : []
    if (!preview && !order && items.length === 0) return null

    const isTransfer = Boolean(data.transfer)
    const isPayment = Boolean(data.payment)
    const isPurchaseOrder = Boolean(data.purchase_order || data.line_item || String(data.action_type || "").includes("purchase_order"))
    const Icon = isTransfer ? ArrowRightLeft : isPayment ? CreditCard : order ? ShoppingCart : Package
    const rows = preview ? Object.entries(preview).filter(([key, value]) => value !== null && value !== undefined && value !== "" && !["inventory_item_id", "stock_lot_id", "stock_serial_id"].includes(key)) : []
    const productImportItems = items.filter((item: any) => item.global_product_id || item.global_product_name || item.display_image)
    const isProductImport = data.action_type === "import_products" || productImportItems.length > 0
    const inventoryPreview = data.adjustment || data.transfer
    const inventoryName = inventoryPreview?.inventory_item_name || "Inventory item"
    const isAdjustment = Boolean(data.adjustment)
    const productDraft = data.product && typeof data.product === "object" ? data.product : null
    const productDiff = Array.isArray(data.diff) ? data.diff : []
    const priceChange = data.price_change && typeof data.price_change === "object" ? data.price_change : null
    const mediaPreview = data.media && typeof data.media === "object" ? data.media : null
    const mediaUrl = mediaPreview?.file_url || mediaPreview?.url || mediaPreview?.file || mediaPreview?.optimized_url || null
    const bulkTask = data.bulk_task && typeof data.bulk_task === "object" ? data.bulk_task : null
    const bulkImages = Array.isArray(data.images) ? data.images : []

    return (
      <div className="mb-5 rounded-xl border border-[#d9c6a5] bg-[#fffaf1] p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#3b3025]">
          <Icon className="h-4 w-4 text-[#a56a2a]" />
          <span>{isTransfer ? "Transfer preview" : isPayment ? "Payment preview" : isPurchaseOrder ? "Purchase-order preview" : order ? "Order preview" : "Change preview"}</span>
        </div>
        {order && (
          <div className="mb-3 grid grid-cols-2 gap-2 text-xs text-[#5d5145]">
            <span>{isPurchaseOrder ? "Reference" : "Order"}: <strong className="text-[#30271f]">{order.reference || order.order_number || order.id}</strong></span>
            <span>Status: <strong className="text-[#30271f]">{formatMachineLabel(order.status || order.payment_status || "")}</strong></span>
            {isPurchaseOrder && order.supplier_reference && <span>Supplier ref: <strong className="text-[#30271f]">{order.supplier_reference}</strong></span>}
            {isPurchaseOrder && order.supplier_id && <span>Supplier: <strong className="text-[#30271f]">{order.supplier_id}</strong></span>}
            {order.total_amount !== undefined && <span>Total: <strong className="text-[#30271f]">{order.total_amount}</strong></span>}
            {order.remaining_balance !== undefined && <span>Balance: <strong className="text-[#30271f]">{order.remaining_balance}</strong></span>}
          </div>
        )}
        {data.payment && (
          <div className="mb-3 rounded-xl border border-[#eadfce] bg-white/80 p-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#897765]">Payment amount</p>
            <div className="mt-1 flex items-baseline justify-between gap-3">
              <strong className="text-xl tracking-tight text-[#30271f]">{data.payment.amount ?? "—"}</strong>
              <span className="rounded-full bg-[#f3e6cf] px-2 py-1 text-xs font-semibold text-[#7c4d20]">{formatMachineLabel(data.payment.payment_method || "payment")}</span>
            </div>
            {data.payment.reference && <p className="mt-1 truncate text-xs text-[#6f6255]">Reference: {data.payment.reference}</p>}
          </div>
        )}
        {inventoryPreview && (
          <div className="mb-3 rounded-xl border border-[#eadfce] bg-white/80 p-3">
            <p className="text-sm font-semibold text-[#30271f]">{inventoryName}</p>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-[#5d5145]">
              <span>Operation <strong className="text-[#30271f]">{isAdjustment ? "Adjustment" : "Transfer"}</strong></span>
              {inventoryPreview.quantity !== undefined && <span>Quantity <strong className="text-[#30271f]">{inventoryPreview.quantity}</strong></span>}
              {inventoryPreview.quantity_delta !== undefined && <span>Change <strong className="text-[#30271f]">{inventoryPreview.quantity_delta}</strong></span>}
              {inventoryPreview.from_location_id && <span>From <strong className="text-[#30271f]">{inventoryPreview.from_location_id}</strong></span>}
              {inventoryPreview.to_location_id && <span>To <strong className="text-[#30271f]">{inventoryPreview.to_location_id}</strong></span>}
            </div>
          </div>
        )}
        {isProductImport && productImportItems.length > 0 && (
          <div className="mb-3 space-y-2">
            <div className="flex items-center justify-between gap-2 text-xs text-[#5d5145]">
              <span className="font-medium">Products selected</span>
              <span className="rounded-full bg-[#f3e6cf] px-2 py-0.5 font-semibold text-[#7c4d20]">{productImportItems.length}</span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {productImportItems.slice(0, 6).map((item: any, index: number) => {
                const missingVariants = Array.isArray(item.missing_variants) ? item.missing_variants : []
                const imageUrl = item.display_image || missingVariants[0]?.image_url || "/placeholder.svg"
                return (
                  <div key={`${item.global_product_id || item.global_product_name || index}`} className="flex min-w-0 gap-2 rounded-xl border border-[#eadfce] bg-white/80 p-2">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-[#f4eee5]">
                      <Image src={imageUrl} alt={item.name || item.global_product_name || "Product"} fill sizes="56px" className="object-cover" unoptimized />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-[#30271f]">{item.name || item.global_product_name || "Product"}</p>
                      <p className="truncate text-[11px] text-[#6f6255]">{item.brand || "Unbranded"}{item.category_name ? ` · ${item.category_name}` : ""}</p>
                      <p className="mt-1 text-[10px] text-[#897765]">
                        {item.missing_variant_count ?? missingVariants.length ?? 0} variant{(item.missing_variant_count ?? missingVariants.length ?? 0) === 1 ? "" : "s"} to import
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
            {productImportItems.length > 6 && <p className="pt-1 text-center text-[11px] font-medium text-[#7c4d20]">+ {productImportItems.length - 6} more products</p>}
          </div>
        )}
        {productDraft && !isProductImport && (
          <div className="mb-3 rounded-xl border border-[#eadfce] bg-white/80 p-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#897765]">Product draft</p>
            <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-[#5d5145]">
              {Object.entries(productDraft)
                .filter(([key, value]) => value !== null && value !== undefined && value !== "" && !["id", "product_id"].includes(key))
                .slice(0, 10)
                .map(([key, value]) => (
                  <div key={key} className="min-w-0">
                    <dt className="truncate text-[#897765]">{formatMachineLabel(key)}</dt>
                    <dd className="truncate font-semibold text-[#30271f]">{typeof value === "object" ? JSON.stringify(value) : String(value)}</dd>
                  </div>
                ))}
            </dl>
          </div>
        )}
        {mediaPreview && (
          <div className="mb-3 rounded-xl border border-[#eadfce] bg-white/80 p-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#897765]">Media asset</p>
            <div className="mt-2 flex items-center gap-3">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-[#f4eee5]">
                {mediaUrl ? (
                  <Image src={mediaUrl} alt="Product media preview" fill sizes="64px" className="object-cover" unoptimized />
                ) : (
                  <div className="flex h-full items-center justify-center text-[10px] text-[#897765]">Preview unavailable</div>
                )}
              </div>
              <div className="min-w-0 text-xs text-[#5d5145]">
                <p className="truncate font-semibold text-[#30271f]">{mediaPreview.description || mediaPreview.filename || "Product media attachment"}</p>
                <p className="mt-1">{formatMachineLabel(mediaPreview.purpose || "gallery")} {mediaPreview.is_primary ? "· Current primary" : ""}</p>
              </div>
            </div>
          </div>
        )}
        {bulkTask && (
          <div className="mb-3 rounded-xl border border-[#eadfce] bg-white/80 p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#897765]">AI product batch</p>
                <p className="mt-1 text-sm font-semibold text-[#30271f]">{bulkTask.image_count || bulkImages.length} image{(bulkTask.image_count || bulkImages.length) === 1 ? "" : "s"} ready for analysis</p>
              </div>
              <span className="rounded-full bg-[#f3e6cf] px-2 py-1 text-xs font-semibold text-[#7c4d20]">{formatMachineLabel(bulkTask.currency || "NGN")}</span>
            </div>
            {bulkImages.length > 0 && (
              <div className="mt-3 space-y-1 text-xs text-[#5d5145]">
                {bulkImages.slice(0, 5).map((image: any, index: number) => (
                  <div key={`${image.filename || "image"}-${index}`} className="flex items-center justify-between rounded-lg bg-[#f8f3eb] px-3 py-2">
                    <span className="truncate pr-3">{image.filename || `Image ${index + 1}`}</span>
                    <span className="shrink-0 text-[10px] text-[#897765]">{image.content_type || "image"}</span>
                  </div>
                ))}
                {bulkImages.length > 5 && <p className="pt-1 text-center text-[11px] text-[#7c4d20]">+ {bulkImages.length - 5} more images</p>}
              </div>
            )}
          </div>
        )}
        {productDiff.length > 0 && (
          <div className="mb-3 rounded-xl border border-[#eadfce] bg-white/80 p-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#897765]">Before and after</p>
            <div className="mt-2 space-y-2">
              {productDiff.slice(0, 10).map((change: any, index: number) => (
                <div key={`${change.field || "field"}-${index}`} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-2 text-xs">
                  <div className="min-w-0 rounded-lg bg-[#f8f3eb] p-2">
                    <p className="truncate text-[10px] font-medium uppercase tracking-[0.06em] text-[#897765]">{formatMachineLabel(change.field || "Field")} · Before</p>
                    <p className="mt-1 break-words font-semibold text-[#5d5145]">{change.before === undefined || change.before === null || change.before === "" ? "—" : String(change.before)}</p>
                  </div>
                  <div className="min-w-0 rounded-lg bg-[#eef8f1] p-2">
                    <p className="truncate text-[10px] font-medium uppercase tracking-[0.06em] text-[#4d8060]">{formatMachineLabel(change.field || "Field")} · After</p>
                    <p className="mt-1 break-words font-semibold text-[#245c38]">{change.after === undefined || change.after === null || change.after === "" ? "—" : String(change.after)}</p>
                  </div>
                </div>
              ))}
            </div>
            {productDiff.length > 10 && <p className="mt-2 text-center text-[11px] text-[#7c4d20]">+ {productDiff.length - 10} more changes</p>}
          </div>
        )}
        {priceChange && (
          <div className="mb-3 rounded-xl border border-[#eadfce] bg-white/80 p-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#897765]">Price change</p>
            <div className="mt-2 flex items-end justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#30271f]">{priceChange.label || "Product price"}</p>
                {priceChange.reason && <p className="mt-1 text-xs text-[#6f6255]">{priceChange.reason}</p>}
              </div>
              <div className="shrink-0 text-right text-sm">
                <span className="text-[#897765]">{priceChange.old_price ?? "—"}</span>
                <span className="mx-1 text-[#a56a2a]">→</span>
                <strong className="text-[#245c38]">{priceChange.new_price ?? "—"}</strong>
              </div>
            </div>
          </div>
        )}
        {items.length > 0 && !isProductImport && (
          <div className="mb-3 space-y-2 text-xs text-[#5d5145]">
            {items.slice(0, 5).map((item: any, index: number) => (
              <div key={`${item.line_item_id || item.inventory_item_id || index}`} className="flex items-center justify-between rounded-lg bg-white/70 px-3 py-2">
                <span className="min-w-0 pr-3">
                  <span className="block truncate">{item.inventory_item_name || item.description || item.inventory_item_id || `Item ${index + 1}`}</span>
                  {(item.location_id || item.lot_number || item.expiry_date) && <span className="mt-0.5 block truncate text-[10px] text-[#897765]">{[item.location_id && `Location ${item.location_id}`, item.lot_number && `Lot ${item.lot_number}`, item.expiry_date && `Expires ${item.expiry_date}`].filter(Boolean).join(" · ")}</span>}
                </span>
                <strong className="shrink-0">{item.quantity_received || item.quantity || "—"}</strong>
              </div>
            ))}
            {items.length > 5 && <p className="pt-1 text-center text-[11px] font-medium text-[#7c4d20]">+ {items.length - 5} more lines</p>}
          </div>
        )}
        {rows.length > 0 && (
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-[#5d5145]">
            {rows.slice(0, 8).map(([key, value]) => (
              <div key={key} className="min-w-0">
                <dt className="truncate text-[#897765]">{formatMachineLabel(key)}</dt>
                <dd className="truncate font-semibold text-[#30271f]">{typeof value === "object" ? JSON.stringify(value) : String(value)}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    )
  }

  const renderWorkflowContext = () => {
    const history = Array.isArray(data.workflow_history) ? data.workflow_history : []
    if (!data.workflow_id && history.length === 0) return null
    const contract = readWorkflowContract(data)
    return (
      <div className="mb-5 rounded-xl border border-[#e5ddd2] bg-[#faf8f5] p-3 text-xs text-[#5d5145]">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold text-[#30271f]">Workflow context</p>
            {data.workflow_id && <p className="truncate font-mono text-[10px] text-[#897765]">{data.workflow_id}</p>}
          </div>
          {data.workflow_id && (
            <button
              type="button"
              className="shrink-0 rounded-md border border-[#d9c6a5] bg-white px-2 py-1 font-medium text-[#7c4d20] hover:bg-[#fffaf1]"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(String(data.workflow_id))
                  setWorkflowCopied(true)
                  window.setTimeout(() => setWorkflowCopied(false), 1500)
                } catch {
                  setWorkflowCopied(false)
                }
              }}
            >
              {workflowCopied ? "Copied" : "Copy ID"}
            </button>
          )}
        </div>
        {data.workflow_step && <p className="mt-2">Current step: <strong>{formatMachineLabel(data.workflow_step)}</strong></p>}
        {data.workflow_expires_at && <p className="mt-1">Expires: <strong>{new Date(data.workflow_expires_at).toLocaleString()}</strong></p>}
        {data.correlation_id && <p className="mt-1 truncate">Trace: <strong className="font-mono text-[10px]">{data.correlation_id}</strong></p>}
        {contract?.status === "unsupported" && <p className="mt-2 text-amber-700">This workflow uses a newer contract version. Review the details before continuing.</p>}
        {history.length > 0 && (
          <div className="mt-3 border-l border-[#d9c6a5] pl-3">
            {history.slice(-4).map((event: any, index: number) => (
              <div key={`${event.created_at || index}-${event.event_type || "event"}`} className="relative pb-2 last:pb-0">
                <span className="font-medium text-[#7c4d20]">{formatMachineLabel(event.event_type || "workflow update")}</span>
                {event.to_step && <span> · {formatMachineLabel(event.to_step)}</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            {getActionIcon()}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{data.title}</h3>
              <p className="text-sm text-gray-500 mt-1">Action: {formatMachineLabel(data.action_type)}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-4">
            <p className="text-gray-800 leading-relaxed">{data.description}</p>

            {data.details && (
              <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 p-3">
                <p className="text-sm text-gray-700">{data.details}</p>
              </div>
            )}
          </div>

          {renderWorkflowPreview()}
          {renderWorkflowContext()}

          {data.allow_input && (
            <div className="mb-6">
              <label htmlFor="additional-instructions" className="block text-sm font-medium text-gray-700 mb-2">
                Additional Instructions (Optional)
              </label>
              <textarea
                id="additional-instructions"
                value={additionalInstructions}
                onChange={(e) => setAdditionalInstructions(e.target.value)}
                placeholder="Add any specific instructions or notes..."
                rows={3}
                className="w-full px-3 bg-gray-200/70 text-gray-800 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                disabled={isSubmitting}
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
          <button
            onClick={() => handleResponse(false)}
            disabled={isSubmitting}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {data.deny_text}
          </button>
          <button
            onClick={() => handleResponse(true)}
            disabled={isSubmitting}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              data.approve_text
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
