"use client"
import { useGetProductVariantQuery } from "@/redux/features/product/productAPISlice"
import VerticalTabs from "@/components/common/verticalTabs"
import LoadingAnimation from "@/components/common/LoadingAnimation"
import { useOverlayDismiss } from "@/components/common/useOverlayDismiss"
import VariantDetailsTab from "./tabs/VariantDetailsTab"
import VariantStatisticsTab from "./tabs/VariantStatisticsTab"
import VariantMediaTab from "./tabs/VariantMediaTab"
import VariantAttributesTab from "./tabs/VariantAttributesTab"
import { extractErrorMessage } from "@/lib/utils"

interface VariantDetailsModalProps {
  variantId: string
  onClose: () => void
  onSuccess: () => void
}

const VariantDetailsModal = ({ variantId, onClose, onSuccess }: VariantDetailsModalProps) => {
  const { data: variant, isLoading, error, refetch } = useGetProductVariantQuery(variantId)
  const useFallbackOverlay = Boolean(error) || isLoading || !variant

  useOverlayDismiss({ enabled: useFallbackOverlay, onClose })

  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
        <div className="w-full max-w-md rounded-lg bg-white p-6" onClick={(event) => event.stopPropagation()}>
          <h3 className="text-lg font-semibold text-red-600 mb-2">Error</h3>
          <p className="text-gray-700 mb-4">
            Failed to load variant details: {extractErrorMessage(error, ["detail", "error"])}
          </p>
          <button onClick={onClose} className="w-full bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
            Close
          </button>
        </div>
      </div>
    )
  }

  if (isLoading || !variant) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4" onClick={onClose}>
        <div
          className="flex h-full w-full items-center justify-center overflow-hidden bg-white sm:h-auto sm:max-h-[90vh] sm:max-w-6xl sm:rounded-lg"
          onClick={(event) => event.stopPropagation()}
        >
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <LoadingAnimation />
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center">
              <p className="text-gray-500">Variant not found</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <VerticalTabs
      items={[
        {
          id: "details",
          label: "Details",
          content: (
            <VariantDetailsTab
              variant={variant}
              onSuccess={() => {
                refetch()
                onSuccess()
              }}
            />
          ),
        },
        {
          id: "statistics",
          label: "Statistics",
          content: <VariantStatisticsTab variantId={variantId} />,
        },
        {
          id: "media",
          label: "Media",
          content: <VariantMediaTab variantId={variantId} />,
        },
        {
          id: "attributes",
          label: "Attributes",
          content: (
            <VariantAttributesTab
              variant={variant}
              onSuccess={() => {
                refetch()
                onSuccess()
              }}
            />
          ),
        },
      ]}
      onClose={onClose}
      className="h-full sm:h-auto"
    />
  )
}

export default VariantDetailsModal
