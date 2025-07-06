"use client"
import { useGetProductVariantQuery } from "@/redux/features/product/productAPISlice"
import VerticalTabs from "@/components/common/verticalTabs"
import LoadingAnimation from "@/components/common/LoadingAnimation"
import VariantDetailsTab from "./tabs/VariantDetailsTab"
import VariantStatisticsTab from "./tabs/VariantStatisticsTab"
import VariantMediaTab from "./tabs/VariantMediaTab"
import VariantAttributesTab from "./tabs/VariantAttributesTab"

interface VariantDetailsModalProps {
  variantId: string
  onClose: () => void
  onSuccess: () => void
  refetchData:boolean
}

const VariantDetailsModal = ({ variantId, onClose, onSuccess,refetchData }: VariantDetailsModalProps) => {
  const { data: variant, isLoading, error, refetch } = useGetProductVariantQuery(variantId)

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <h3 className="text-lg font-semibold text-red-600 mb-2">Error</h3>
          <p className="text-gray-700 mb-4">
            Failed to load variant details: {(error as any).message || "Unknown error"}
          </p>
          <button onClick={onClose} className="w-full bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
            Close
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="w-full h-full sm:h-auto sm:max-w-6xl sm:max-h-[90vh] bg-white sm:rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <LoadingAnimation />
          </div>
        ) : variant ? (
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
                  refetchData={refetchData}
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
        ) : (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500">Variant not found</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default VariantDetailsModal
