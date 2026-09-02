'use client'
import { useDeferredValue, useState } from 'react';
import Link from "next/link";

import { useRouter } from 'nextjs-toploader/app';
import { usePathname, useRouter as useNavigationRouter, useSearchParams } from "next/navigation";
import { Column, DataTable,ActionButton, GeneralButton, type DataTableQueryState } from "../common/DataTable/DataTable";
import type { BulkTaskStatus, ProductData } from "@/redux/features/product/productTypes";
import { useListProductPageQuery, useCreateProductMutation,useDeleteProductMutation,useBulkDeleteProductsMutation,useRemoveTemplateModeMutation, useListBulkTasksQuery, useRetryBulkTaskMutation } from "@/redux/features/product/productAPISlice";
import CustomCreateCard from '../common/createCard';
import { ProductFormKeys, defaultValues } from './selectOptions';
import { useGetUnitsQuery } from "@/redux/features/common/typeOF";
import { useGetProductCategoriesQuery } from "@/redux/features/product/productAPISlice";
import { useResearchBulkTaskPricesMutation } from "@/redux/features/agents/agentControlApiSlice";
import {AIBulkCreateModal} from './AIBulkCreateModal';
import { TableImageHover } from '../common/table-image-render';
import { Trash2, Copy, ToggleLeftIcon, Brain, CheckCircle, Download, RefreshCw, Search, XCircle, ArrowRight } from "lucide-react"
import { toast } from 'react-toastify';
import { getCurrencyCodeForProfile, getCurrencySymbolForProfile } from '@/lib/currency-utils';
import { extractErrorMessage } from '@/lib/utils';
import { confirmAction } from '../common/confirmAction';
import { useSubscriptionQuota } from '@/hooks/useSubscriptionQuota';
import { Pagination } from '@/components/ui/pagination';

  

const inventoryColumns: Column<ProductData>[] = [
  {
    header: 'Name',
    accessor: 'name',
    className: 'font-medium',
  },
  {
    header: 'Category',
    accessor: 'category',
    render: (value) => value || 'Uncategorized',
    info: 'Catalog category assigned to the product',
  },
  {
    header: 'Barcode',
    accessor: 'barcode',
    render: (value) => value || 'Not set',
    className: 'font-medium',
  },
  {
    header: 'SKU',
    accessor: 'sku',
    render: (value) => value || 'Not set',
    className: 'font-medium',
  },
 {
    header: "Image",
    accessor: "display_image",
    render: (value: string) => (
      <TableImageHover
        src={value}
        alt="Product Image"
        className="hover:ring-2 hover:ring-blue-500 hover:ring-opacity-50"
      />
    ),
  },
  {
    header: 'Variants',
    accessor: 'variant_count',
    render: (value) => value ?? 0,
    className: 'font-medium',
  },
  {
    header: `Base Cost Price (${getCurrencySymbolForProfile()})`,
    accessor: 'cost_price',
    render: (value) => value || '0',
    info: 'Configured baseline cost for margin calculations',
  },
  {
    header: `Base Price (${getCurrencySymbolForProfile()})`,
    accessor: 'base_price',
    render: (value) => value || '0',
    info: 'Configured baseline selling price before variant or rule overrides',
  },
 
];


function ProductView() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const navigationRouter = useNavigationRouter()
  const tableStateKey = "table_products"
  const [tableQueryState, setTableQueryState] = useState<DataTableQueryState | null>(null)
  const search = tableQueryState?.searchTerm ?? searchParams.get(`${tableStateKey}_search`) ?? ""
  const category = tableQueryState?.filters.category ?? searchParams.get(`${tableStateKey}_filter_category`) ?? undefined
  const isActive = tableQueryState?.filters.is_active ?? searchParams.get(`${tableStateKey}_filter_is_active`) ?? undefined
  const isFeatured = tableQueryState?.filters.is_featured ?? searchParams.get(`${tableStateKey}_filter_is_featured`) ?? undefined
  const quickSale = tableQueryState?.filters.quick_sale ?? searchParams.get(`${tableStateKey}_filter_quick_sale`) ?? undefined
  const trackStock = tableQueryState?.filters.track_stock ?? searchParams.get(`${tableStateKey}_filter_track_stock`) ?? undefined
  const allowBackorder = tableQueryState?.filters.allow_backorder ?? searchParams.get(`${tableStateKey}_filter_allow_backorder`) ?? undefined
  const allowDiscount = tableQueryState?.filters.allow_discount ?? searchParams.get(`${tableStateKey}_filter_allow_discount`) ?? undefined
  const isTemplate = tableQueryState?.filters.is_template ?? searchParams.get(`${tableStateKey}_filter_is_template`) ?? undefined
  const sortField = tableQueryState?.sortConfig?.key ?? searchParams.get(`${tableStateKey}_sort`)
  const sortDirection = tableQueryState?.sortConfig?.direction ?? searchParams.get(`${tableStateKey}_direction`)
  const orderingFieldMap: Record<string, string> = {
    name: "name",
    barcode: "barcode",
    sku: "sku",
    base_price: "base_price",
    cost_price: "cost_price",
  }
  const ordering = sortField && orderingFieldMap[sortField]
    ? `${sortDirection === "descending" ? "-" : ""}${orderingFieldMap[sortField]}`
    : undefined
  const page = Number(searchParams.get(`${tableStateKey}_page`)) || 1
  const deferredSearch = useDeferredValue(search.trim())
  const { data: productPage, isLoading, refetch, error } = useListProductPageQuery({
    search: deferredSearch || undefined,
    category,
    is_active: isActive,
    is_featured: isFeatured,
    quick_sale: quickSale,
    track_stock: trackStock,
    allow_backorder: allowBackorder,
    allow_discount: allowDiscount,
    is_template: isTemplate,
    ordering,
    page,
    page_size: 20,
  });
  const data = productPage?.results ?? []
  const [createProduct, { isLoading: productCreateLoading }] = useCreateProductMutation();
  const { data: bulkTasks = [], isFetching: isFetchingBulkTasks, refetch: refetchBulkTasks } = useListBulkTasksQuery();
  const [retryBulkTask, { isLoading: isRetryingBulkTask }] = useRetryBulkTaskMutation();
  const [researchBulkTaskPrices, { isLoading: isResearchingPrices }] = useResearchBulkTaskPricesMutation();
  const [isCreateOpen, setIsCreateOpen] = useState(false); // Renamed for clarity
  const router = useRouter();
  const [isAIBulkCreateOpen, setIsAIBulkCreateOpen] = useState(false);
  const productQuota = useSubscriptionQuota("products", productPage?.count ?? 0, 1, { requireBillingAuthorization: true });
  const productCatalogLocked = !productQuota.canCreate;

  const goToSubscription = () => {
    router.push("/subscription")
  }

  const handleCreate = async (createdData: Partial<ProductData>) => {
    if (productQuota.isLoading) {
      toast.info("Subscription limits are still loading. Please try again.");
      return;
    }
    if (!productQuota.canCreate) {
      toast.error(productQuota.message);
      goToSubscription();
      return;
    }
    await createProduct(createdData).unwrap();
    setIsCreateOpen(false); 
    await refetch(); 
  };
  // actions
  const [deleteProduct, { isLoading: deleteLoading }] = useDeleteProductMutation();
  const [bulkDeleteProducts, { isLoading: bulkDeleteLoading }] = useBulkDeleteProductsMutation();
  const [removeTemplateMode] = useRemoveTemplateModeMutation();

  const handleDelete = async (row: ProductData) => {
    const confirmed = await confirmAction({
      title: "Delete product?",
      description: `Delete ${row.name}? Inventory records with non-zero stock may still remain for reconciliation.`,
      confirmText: "Delete product",
      destructive: true,
    })
    if (!confirmed) return

    try {
      await deleteProduct(row.id).unwrap();
      await refetch(); // Refresh the data after deletion
      toast.success("Product deleted successfully!");
    } catch (error) {
      toast.error(extractErrorMessage(error, ["detail"]) || "Failed to delete product");
    }
  }

  const handleBulkDelete = async (selectedIds: string[]) => {
    if (!selectedIds.length) return

    const confirmed = await confirmAction({
      title: "Delete selected products?",
      description: `Delete ${selectedIds.length} selected product${selectedIds.length === 1 ? "" : "s"}? This removes them from the catalog and lets inventory keep only non-zero stock records.`,
      confirmText: "Delete selected",
      destructive: true,
    })
    if (!confirmed) return

    try {
      const result = await bulkDeleteProducts(selectedIds).unwrap()
      await refetch()
      if (result.skipped_ids.length > 0) {
        toast.warning(
          `Deleted ${result.deleted_count} product${result.deleted_count === 1 ? "" : "s"}. ${result.skipped_ids.length} item${result.skipped_ids.length === 1 ? " was" : "s were"} skipped because they were not available in your current workspace.`
        )
      } else {
        toast.success(`Deleted ${result.deleted_count} product${result.deleted_count === 1 ? "" : "s"} successfully!`)
      }
    } catch (error) {
      toast.error("Failed to bulk delete selected products")
    }
  }

    const handleRemoveTemplateMode = async (row: ProductData) => {
      try {
        await removeTemplateMode({ id: row.id }).unwrap();
        await refetch(); // Refresh the data after removing template mode
      } catch (error) {
        toast.error("Failed to remove template mode")
      }
    }
      
      const { data: categories = [] } = useGetProductCategoriesQuery();
      const { data: units=[] } = useGetUnitsQuery();
      const unitOptions = units.map((unit: any) => ({
        value: `${unit.name} (${unit.dimension_type})`,
        text: `${unit.name} (${unit.dimension_type})`,
      }));
    
      const categoryOptions = categories.flatMap((cat: any) => {
        const name = typeof cat?.name === "string" ? cat.name.trim() : "";
        return name ? [{ value: name, text: name }] : [];
      });
      
    const selectOptions = {
      // A product category may be a free-text catalog label. Only force a
      // select control when this workspace has managed category records.
      ...(categoryOptions.length > 0 ? { category: categoryOptions } : {}),
      unit: unitOptions,
    }

  const handleRowClick = (row: ProductData) => {
    router.push(`/product/${row.id}`);
  };

  const handleDuplicate = async (product: ProductData) => {
    if (!productQuota.canCreate) {
      toast.error(productQuota.message)
      goToSubscription()
      return
    }
    const duplicateData: Partial<ProductData> = {}
    ProductFormKeys.forEach((key) => {
      const value = product[key]
      if (value !== undefined) {
        ;(duplicateData as Record<string, unknown>)[String(key)] = value as unknown
      }
    })

    duplicateData.name = `${product.name} (Copy)`
    duplicateData.barcode = ""
    duplicateData.sku = ""

    try {
      await createProduct(duplicateData).unwrap()
      await refetch()
      toast.success("Product duplicated successfully!")
    } catch (error) {
      toast.error("Failed to duplicate product")
    }
  };

  const handleRetryBulkTask = async (task: BulkTaskStatus) => {
    try {
      await retryBulkTask(task.task_id).unwrap()
      await refetchBulkTasks()
      toast.success("Bulk product task retry started")
    } catch (error: any) {
      const detail = error?.data?.detail || "Failed to retry bulk product task"
      toast.error(detail)
    }
  }

  const handleResearchBulkTaskPrices = async (task: BulkTaskStatus) => {
    try {
      const result = await researchBulkTaskPrices({
        task_id: task.task_id,
        currency: getCurrencyCodeForProfile(),
        apply: true,
      }).unwrap()
      await Promise.all([refetch(), refetchBulkTasks()])
      if (result.applied_count > 0) {
        toast.success(`Updated prices for ${result.applied_count} variant${result.applied_count === 1 ? "" : "s"}`)
      } else if (result.suggested_count > 0) {
        toast.info(`Found ${result.suggested_count} price suggestion${result.suggested_count === 1 ? "" : "s"}, but none matched ${result.currency}`)
      } else {
        toast.info("No online prices were found for this bulk task")
      }
    } catch (error: any) {
      const detail = error?.data?.detail || "Failed to research prices for this bulk task"
      toast.error(typeof detail === "string" ? detail : "Failed to research prices for this bulk task")
    }
  }

  const openReport = (url: string) => {
    window.open(url, "_blank")
  }

  
const actionButtons: ActionButton<ProductData>[] = [
  {
      label: "",
      icon: ArrowRight,
      onClick: (row) => handleRowClick(row),
      className: "text-blue-600 hover:text-blue-800",
      variant: "secondary",
      tooltip: "Open Product Details",
    },
  {
      label: "",
      icon:Trash2,
      onClick:async (row) =>await handleDelete(row),
      className: "text-red-600 hover:text-red-800",
      variant: "secondary",
      tooltip: "Delete Product",
      disabled: (row) => deleteLoading,
    },
      
    {
      label: "",
      icon: Copy,
      onClick: (row) => handleDuplicate(row),
      className: "text-purple-600 hover:text-purple-800",
      variant: "secondary",
      tooltip: "Duplicate Product",
    },
      

    {
      label: "",
      icon:ToggleLeftIcon,
      onClick: (row) => handleRemoveTemplateMode(row),
      className: "text-orange-600 hover:text-orange-800",
      variant: "secondary",
      tooltip: "Remove Template Mode",
      disabled: (row) => row.is_template !== true, 
    }
  
  ];

  const generalButtons: GeneralButton<ProductData>[] = [
    {
      label: "Delete selected",
      icon: Trash2,
      onClick: (selectedIds) => {
        void handleBulkDelete(selectedIds)
      },
      variant: "danger",
      disabled: deleteLoading || bulkDeleteLoading,
      tooltip: "Delete all selected products",
    },
  ]








  if (error) {
    return (
      <div className="p-4 text-red-500">
        Unable to load product catalog: {extractErrorMessage(error, ["detail", "error"])}
      </div>
    );
  }

  const notEditableFields: (keyof ProductData)[] = [
    'id',
    'created_at',
    'updated_at',
  ];

  

  return (
    <div className="space-y-4">
      {productCatalogLocked ? (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-900 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold">Product creation is locked until billing is authorized.</p>
              <p className="mt-1">
                Choose a plan and connect the workspace card before creating, duplicating, or bulk importing products.
              </p>
            </div>
            <Link
              href="/subscription"
              className="inline-flex items-center rounded-full border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-100"
            >
              Open subscription
            </Link>
          </div>
        </div>
      ) : null}
      <BulkTaskPanel
        tasks={bulkTasks}
        isFetching={isFetchingBulkTasks}
        isRetrying={isRetryingBulkTask}
        isResearchingPrices={isResearchingPrices}
        onRefresh={refetchBulkTasks}
        onRetry={handleRetryBulkTask}
        onResearchPrices={handleResearchBulkTaskPrices}
        onOpenReport={openReport}
        onNewUpload={() => {
          if (!productQuota.canCreate) {
            toast.error(productQuota.message)
            goToSubscription()
            return
          }
          setIsAIBulkCreateOpen(true)
        }}
      />
      <DataTable<ProductData>
        columns={inventoryColumns}
        data={data}
        isLoading={isLoading}
        error={error}
        errorMessage="Unable to load products."
        onRetry={refetch}
        actionButtons={actionButtons}
        onRowClick={handleRowClick}
        serverSide
        urlStateKey="products"
        onQueryStateChange={(nextState) => {
          setTableQueryState(nextState)
          if (page > 1) {
            const params = new URLSearchParams(searchParams.toString())
            params.delete(`${tableStateKey}_page`)
            const query = params.toString()
            navigationRouter.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
          }
        }}
        secondaryButton={{
          label: 'Create Bulk Product',
          onClick: () => {
            if (!productQuota.canCreate) {
              toast.error(productQuota.message)
              goToSubscription()
              return
            }
            setIsAIBulkCreateOpen(true)
          },

        }}
        searchableFields={['name', 'barcode', 'sku', 'short_description']}
        filterableFields={[
          'category',
          'is_active',
          'is_featured',
          'quick_sale',
          'is_template',
          'allow_discount',
          'track_stock',
          'allow_backorder',
        ]}
        filterOptions={{
          // Catalog category is free text when no managed category records exist.
          // Omitting this option list lets DataTable derive choices from visible products.
          ...(categoryOptions.length > 0
            ? { category: categoryOptions.map(({ value, text }) => ({ value, label: text })) }
            : {}),
          is_active: [{ value: "true", label: "Active" }, { value: "false", label: "Inactive" }],
          is_featured: [{ value: "true", label: "Featured" }, { value: "false", label: "Not featured" }],
          quick_sale: [{ value: "true", label: "Quick sale" }, { value: "false", label: "Not quick sale" }],
          is_template: [{ value: "true", label: "Template" }, { value: "false", label: "Not a template" }],
          allow_discount: [{ value: "true", label: "Discount allowed" }, { value: "false", label: "Discount blocked" }],
          track_stock: [{ value: "true", label: "Tracked" }, { value: "false", label: "Not tracked" }],
          allow_backorder: [{ value: "true", label: "Backorder allowed" }, { value: "false", label: "Backorder blocked" }],
        }}
        sortableFields={['name', 'barcode', 'sku', 'base_price', 'cost_price']}
        rangeFilterFields={[]}
        generalButtons={generalButtons}
        getRowId={(row) => row.id}
        title="Products"
        onClose={() => {
          if (productQuota.isLoading) {
            toast.info("Subscription limits are still loading. Please try again.")
            return
          }
          if (!productQuota.canCreate) {
            toast.error(productQuota.message)
            goToSubscription()
            return
          }
          setIsCreateOpen(true)
        }}
      />
      <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
        <Pagination
          currentPage={productPage?.page ?? page}
          totalPages={productPage?.total_pages ?? 1}
          onPageChange={(nextPage) => {
            const params = new URLSearchParams(searchParams.toString())
            if (nextPage <= 1) {
              params.delete(`${tableStateKey}_page`)
            } else {
              params.set(`${tableStateKey}_page`, String(nextPage))
            }
            const query = params.toString()
            navigationRouter.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
          }}
        />
      </div>

      {/* Always render CustomCreateCard but control visibility */}
      {isAIBulkCreateOpen && (
        <div className={`fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 ${isAIBulkCreateOpen ? 'block' : 'hidden'}`}>
        <AIBulkCreateModal
          isOpen={isAIBulkCreateOpen}
          onClose={() => {
            refetch()
            setIsAIBulkCreateOpen(false)
          }
          }
          />
        </div>
      )}
      {isCreateOpen ? (
        <CustomCreateCard
          defaultValues={defaultValues}
          onClose={() => {setIsCreateOpen(false)
          
          }}
          onSubmit={handleCreate}
          isLoading={productCreateLoading}
          selectOptions={selectOptions}
          keyInfo={{}}
          notEditableFields={notEditableFields}
          interfaceKeys={ProductFormKeys}
          optionalFields={['description', 'short_description', 'category', 'cost_price', 'barcode', 'sku', 'pos_category', 'unit', 'dimensions', 'weight', 'meta_title', 'meta_description']}
          itemTitle={'New Product'}
        />
      ) : null}
    </div>
  );
}

interface BulkTaskPanelProps {
  tasks: BulkTaskStatus[]
  isFetching: boolean
  isRetrying: boolean
  isResearchingPrices: boolean
  onRefresh: () => void
  onRetry: (task: BulkTaskStatus) => void
  onResearchPrices: (task: BulkTaskStatus) => void
  onOpenReport: (url: string) => void
  onNewUpload: () => void
}

function BulkTaskPanel({
  tasks,
  isFetching,
  isRetrying,
  isResearchingPrices,
  onRefresh,
  onRetry,
  onResearchPrices,
  onOpenReport,
  onNewUpload,
}: BulkTaskPanelProps) {
  const latestTasks = tasks.slice(0, 5)

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4 text-gray-900 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-gray-500">
            <Brain className="h-4 w-4 text-blue-600" />
            AI bulk product tasks
          </div>
          <p className="mt-1 text-sm text-gray-600">
            Track uploaded image batches, retry failed processing, and download generated reports.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            disabled={isFetching}
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={onNewUpload}
            className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Upload images
          </button>
        </div>
      </div>

      {latestTasks.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-600">
          No AI bulk tasks yet. Upload product images to start one.
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          {latestTasks.map((task) => (
            <BulkTaskRow
              key={task.task_id}
              task={task}
              isRetrying={isRetrying}
              isResearchingPrices={isResearchingPrices}
              onRetry={onRetry}
              onResearchPrices={onResearchPrices}
              onOpenReport={onOpenReport}
            />
          ))}
        </div>
      )}
    </section>
  )
}

function BulkTaskRow({
  task,
  isRetrying,
  isResearchingPrices,
  onRetry,
  onResearchPrices,
  onOpenReport,
}: {
  task: BulkTaskStatus
  isRetrying: boolean
  isResearchingPrices: boolean
  onRetry: (task: BulkTaskStatus) => void
  onResearchPrices: (task: BulkTaskStatus) => void
  onOpenReport: (url: string) => void
}) {
  const status = task.status.toUpperCase()
  const statusClasses =
    status === "COMPLETED"
      ? "bg-green-50 text-green-700 border-green-200"
      : status === "FAILED"
        ? "bg-red-50 text-red-700 border-red-200"
        : status === "PROCESSING"
          ? "bg-blue-50 text-blue-700 border-blue-200"
          : "bg-gray-50 text-gray-700 border-gray-200"
  const StatusIcon = status === "COMPLETED" ? CheckCircle : status === "FAILED" ? XCircle : Brain

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-semibold ${statusClasses}`}>
              <StatusIcon className={`h-3.5 w-3.5 ${status === "PROCESSING" ? "animate-pulse" : ""}`} />
              {status}
            </span>
            <span className="truncate text-sm font-medium text-gray-900">{task.task_id}</span>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Started {new Date(task.created_at).toLocaleString()}
            {task.updated_at ? `, updated ${new Date(task.updated_at).toLocaleString()}` : ""}
          </p>
          {task.error_message ? (
            <p className="mt-2 max-h-10 overflow-hidden text-sm text-red-600">{task.error_message}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {task.result_file ? (
            <button
              type="button"
              onClick={() => onOpenReport(task.result_file!)}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              <Download className="h-4 w-4" />
              Report
            </button>
          ) : null}
          {status === "COMPLETED" ? (
            <button
              type="button"
              onClick={() => onResearchPrices(task)}
              className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-60"
              disabled={isResearchingPrices}
            >
              <Search className={`h-4 w-4 ${isResearchingPrices ? "animate-pulse" : ""}`} />
              Research prices
            </button>
          ) : null}
          {status === "FAILED" ? (
            <button
              type="button"
              onClick={() => onRetry(task)}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              disabled={isRetrying}
            >
              <RefreshCw className={`h-4 w-4 ${isRetrying ? "animate-spin" : ""}`} />
              Retry
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default ProductView;
