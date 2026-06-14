'use client'
import { useState } from 'react';

import { useRouter } from 'nextjs-toploader/app';
import { Column, DataTable,ActionButton} from "../common/DataTable/DataTable";
import type { BulkTaskStatus, ProductData } from "@/redux/features/product/productTypes";
import { useGetProductDataQuery, useCreateProductMutation,useDeleteProductMutation,useRemoveTemplateModeMutation, useListBulkTasksQuery, useRetryBulkTaskMutation } from "@/redux/features/product/productAPISlice";
import CustomCreateCard from '../common/createCard';
import { ProductFormKeys, defaultValues } from './selectOptions';
import { useGetUnitsQuery } from "@/redux/features/common/typeOF";
import { useGetProductCategoriesQuery } from "@/redux/features/product/productAPISlice";
import { useResearchBulkTaskPricesMutation } from "@/redux/features/agents/agentControlApiSlice";
import {AIBulkCreateModal} from './AIBulkCreateModal';
import { TableImageHover } from '../common/table-image-render';
import { Trash2, Copy, ToggleLeftIcon, Brain, CheckCircle, Download, RefreshCw, Search, XCircle } from "lucide-react"
import { toast } from 'react-toastify';
import { getCurrencyCodeForProfile, getCurrencySymbolForProfile } from '@/lib/currency-utils';

  

const inventoryColumns: Column<ProductData>[] = [
  {
    header: 'Name',
    accessor: 'name',
    className: 'font-medium',
  },
  {
    header: 'Category',
    accessor: 'category',
    render: (value) => value || 'N/A',
    info: 'Catalog category assigned to the product',
  },
  {
    header: 'Barcode',
    accessor: 'barcode',
    render: (value) => value || 'N/A',
    className: 'font-medium',
  },
  {
    header: 'SKU',
    accessor: 'sku',
    render: (value) => value || 'N/A',
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
    render: (value) => value || 'N/A',
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
  const { data, isLoading, refetch, error } = useGetProductDataQuery();
  const [createProduct, { isLoading: productCreateLoading }] = useCreateProductMutation();
  const { data: bulkTasks = [], isFetching: isFetchingBulkTasks, refetch: refetchBulkTasks } = useListBulkTasksQuery();
  const [retryBulkTask, { isLoading: isRetryingBulkTask }] = useRetryBulkTaskMutation();
  const [researchBulkTaskPrices, { isLoading: isResearchingPrices }] = useResearchBulkTaskPricesMutation();
  const [isCreateOpen, setIsCreateOpen] = useState(false); // Renamed for clarity
  const router = useRouter();
  const [isAIBulkCreateOpen, setIsAIBulkCreateOpen] = useState(false);

  const handleCreate = async (createdData: Partial<ProductData>) => {
    await createProduct(createdData).unwrap();
    setIsCreateOpen(false); 
    await refetch(); 
  };
  // actions
  const [deleteProduct, { isLoading: deleteLoading }] = useDeleteProductMutation();
  const [removeTemplateMode] = useRemoveTemplateModeMutation();


  // const handleDelete = async (row: ProductData) => {
  //   if (window.confirm(`Are you sure you want to delete ${row.name}?`)) {
  //     try {
  //       await deleteProduct(row.id).unwrap();
  //       await refetch(); // Refresh the data after deletion
  //     } catch (error) {
  //       console.error('Failed to delete product:', error);
  //     }
  //   }
  const handleDelete = async (row: ProductData) => {
    if (window.confirm(`Are you sure you want to delete ${row.name}?`)) {
      try {
        await deleteProduct(row.id).unwrap();
        await refetch(); // Refresh the data after deletion
        toast.success("Product deleted successfully!");
      } catch (error) {
        console.error('Failed to delete product:', error);
        toast.error("Failed to delete product");
      }
    } 
  }

    const handleRemoveTemplateMode = async (row: ProductData) => {
      try {
        await removeTemplateMode({ id: row.id }).unwrap();
        await refetch(); // Refresh the data after removing template mode
      } catch (error) {
        console.error('Failed to remove template mode:', error);
      }
    }
      
      const { data: categories = [] } = useGetProductCategoriesQuery();
      const { data: units=[] } = useGetUnitsQuery();
      const unitOptions = units.map((unit: any) => ({
        value: `${unit.name} (${unit.dimension_type})`,
        text: `${unit.name} (${unit.dimension_type})`,
      }));
    
      const categoryOptions = categories.map((cat: any) => ({
        value: cat.name,
        text: cat.name,
      }));
      
    const  selectOptions = {
      category: categoryOptions,
      unit: unitOptions,
    }

  const handleRowClick = (row: ProductData) => {
    router.push(`/product/${row.id}`);
  };

  const handleDuplicate = async (product: ProductData) => {
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








  if (error) {
    return (
      <div className="p-4 text-red-500">
        Error loading Product data: {(error as any).message || 'Unknown error'}
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
      <BulkTaskPanel
        tasks={bulkTasks}
        isFetching={isFetchingBulkTasks}
        isRetrying={isRetryingBulkTask}
        isResearchingPrices={isResearchingPrices}
        onRefresh={refetchBulkTasks}
        onRetry={handleRetryBulkTask}
        onResearchPrices={handleResearchBulkTaskPrices}
        onOpenReport={openReport}
        onNewUpload={() => setIsAIBulkCreateOpen(true)}
      />
      <DataTable<ProductData>
        columns={inventoryColumns}
        data={data || []}
        isLoading={isLoading}
        onRowClick={handleRowClick}
        actionButtons={actionButtons}
        secondaryButton={{
          label: 'Create Bulk Product',
          onClick: () => setIsAIBulkCreateOpen(true),

        }}
        searchableFields={['name', 'barcode', 'sku']}
        filterableFields={['category', 'pos_category']}
        sortableFields={['name', 'barcode', 'base_price']}
        rangeFilterFields={['cost_price', 'base_price']}
        title="Products"
        onClose={() =>setIsCreateOpen(true)}
      />

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
          optionalFields={['description', 'short_description', 'cost_price', 'barcode', 'sku', 'pos_category', 'unit', 'dimensions', 'weight', 'meta_title', 'meta_description']}
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
