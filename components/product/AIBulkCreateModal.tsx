"use client"

import { useState, useCallback, useEffect } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, ImageIcon, FileSpreadsheet, Brain, CheckCircle, XCircle, Download } from "lucide-react"
import {
  useAiBulkCreateProductsMutation,
  useLazyGetBulkTaskStatusQuery,
  useListBulkTasksQuery,
} from "@/redux/features/product/productAPISlice"
import { useGetInventoryDataQuery } from "@/redux/features/inventory/inventoryAPiSlice"
import { toast } from "react-toastify"
import { ReactSelectField, type SelectOption } from "@/components/ui/react-select-field"
import { cn } from "@/lib/utils"

interface AIBulkCreateModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AIBulkCreateModal({ isOpen, onClose }: AIBulkCreateModalProps) {
  const [images, setImages] = useState<File[]>([])
  const [excelFile, setExcelFile] = useState<File | null>(null)
  const [taskId, setTaskId] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState<"idle" | "processing" | "completed" | "error">("idle")
  const [selectedInventory, setSelectedInventory] = useState<string | null>(null) // Store selected inventory ID

  // RTK Query hooks
  const [aiBulkCreate, { isLoading: isCreating, error: createError }] = useAiBulkCreateProductsMutation()
  const [getTaskStatus, { data: taskStatus, error: statusError }] = useLazyGetBulkTaskStatusQuery()
  const { data: bulkTasks, refetch: refetchTasks } = useListBulkTasksQuery(undefined, {
    skip: !isOpen,
  })
  const { data: inventoryData, isLoading: isInventoryLoading, error: inventoryError } = useGetInventoryDataQuery()

  const onImageDrop = useCallback((acceptedFiles: File[]) => {
    const validFiles = acceptedFiles.filter((file) => {
      const isValidSize = file.size <= 10 * 1024 * 1024 // 10MB limit
      const isValidType = file.type.startsWith("image/")

      if (!isValidSize) {
        toast.error(`${file.name} is too large. Maximum size is 10MB.`)
        return false
      }
      if (!isValidType) {
        toast.error(`${file.name} is not a valid image file.`)
        return false
      }
      return true
    })

    setImages((prev) => [...prev, ...validFiles])
  }, [])

  const onExcelDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0]
      const isValidType = file.type.includes("spreadsheet") || file.name.endsWith(".xlsx") || file.name.endsWith(".xls")
      const isValidSize = file.size <= 5 * 1024 * 1024 // 5MB limit

      if (!isValidType) {
        toast.error("Please upload a valid Excel file (.xlsx or .xls)")
        return
      }
      if (!isValidSize) {
        toast.error("Excel file is too large. Maximum size is 5MB.")
        return
      }

      setExcelFile(file)
    }
  }, [])

  const imageDropzone = useDropzone({
    onDrop: onImageDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
    },
    multiple: true,
    maxSize: 10 * 1024 * 1024, // 10MB
  })

  const excelDropzone = useDropzone({
    onDrop: onExcelDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
    },
    multiple: false,
    maxSize: 5 * 1024 * 1024, // 5MB
  })

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const removeExcelFile = () => {
    setExcelFile(null)
  }

  const startProcessing = async () => {
    if (images.length === 0) {
      toast.error("Please upload at least one product image")
      return
    }

    if (images.length > 50) {
      toast.error("Maximum 50 images allowed per batch")
      return
    }

    if (!selectedInventory) {
      toast.error("Please select an inventory location")
      return
    }

    const formData = new FormData()

    // Add images
    images.forEach((image, index) => {
      formData.append("images", image)
    })

    // Add Excel file if provided
    if (excelFile) {
      formData.append("excel_file", excelFile)
    }

    // Add selected inventory
    formData.append("inventory", selectedInventory)

    try {
      const result = await aiBulkCreate(formData).unwrap()

      setTaskId(result.task_id)
      setStatus("processing")
      setProgress(10)

      toast.success("AI processing started successfully!")

      // Start polling for status
      pollTaskStatus(result.task_id)
    } catch (error: any) {
      console.error("Failed to start AI processing:", error)
      setStatus("error")

      const errorMessage = error?.data?.detail || error?.message || "Failed to start AI processing"
      toast.error(errorMessage)
    }
  }

  const pollTaskStatus = async (taskId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const result = await getTaskStatus(taskId)

        if (result.data) {
          const { status: taskStatus, error_message } = result.data

          if (taskStatus === "COMPLETED") {
            setStatus("completed")
            setProgress(100)
            clearInterval(pollInterval)
            toast.success("AI processing completed successfully!")
            refetchTasks() // Refresh the tasks list
          } else if (taskStatus === "FAILED") {
            setStatus("error")
            clearInterval(pollInterval)
            toast.error(error_message || "Processing failed")
          } else if (taskStatus === "PROCESSING") {
            // Simulate progress (in real implementation, you might get actual progress)
            setProgress((prev) => Math.min(prev + 5, 90))
          }
        }
      } catch (err) {
        console.error("Failed to check processing status:", err)
        setStatus("error")
        clearInterval(pollInterval)
        toast.error("Failed to check processing status")
      }
    }, 3000) // Poll every 3 seconds

    // Cleanup interval after 10 minutes to prevent infinite polling
    setTimeout(
      () => {
        clearInterval(pollInterval)
        if (status === "processing") {
          setStatus("error")
          toast.error("Processing timeout. Please check the task status manually.")
        }
      },
      10 * 60 * 1000,
    ) // 10 minutes
  }

  const reset = () => {
    setImages([])
    setExcelFile(null)
    setTaskId(null)
    setProgress(0)
    setStatus("idle")
    setSelectedInventory(null) // Reset inventory selection
  }

  const downloadReport = (resultFileUrl: string) => {
    window.open(resultFileUrl, "_blank")
  }

  // Auto-refresh task status when modal opens
  useEffect(() => {
    if (isOpen && taskId && status === "processing") {
      pollTaskStatus(taskId)
    }
  }, [isOpen, taskId])

  // Prepare inventory options from inventoryData
  const inventoryOptions: SelectOption[] = inventoryData
    ? inventoryData.map((item) => ({
        value: item.id.toString(), // Assuming id is the unique identifier
        label: item.name || `Location ${item.id}`, // Adjust based on your inventory data structure
      }))
    : []

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto text-inherit">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Bulk Product Creation
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Recent Tasks */}
          {bulkTasks && bulkTasks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Recent Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {bulkTasks.slice(0, 3).map((task) => (
                    <div key={task.task_id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center gap-2">
                        {task.status === "COMPLETED" && <CheckCircle className="h-4 w-4 text-green-500" />}
                        {task.status === "FAILED" && <XCircle className="h-4 w-4 text-red-500" />}
                        {task.status === "PROCESSING" && <Brain className="h-4 w-4 text-blue-500 animate-pulse" />}
                        <span className="text-sm">{task.status}</span>
                        <span className="text-xs text-gray-500">{new Date(task.created_at).toLocaleDateString()}</span>
                      </div>
                      {task.result_file && (
                        <Button size="sm" variant="outline" onClick={() => downloadReport(task.result_file!)}>
                          <Download className="h-3 w-3 mr-1" />
                          Report
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Status Display */}
          {status !== "idle" && (
            <Card>
              <CardContent className="pt-6">
                {status === "processing" && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Brain className="h-4 w-4 animate-pulse text-blue-500" />
                      <span>AI is analyzing your images and creating products...</span>
                    </div>
                    <Progress value={progress} className="w-full" />
                    <p className="text-xs text-gray-500">
                      This may take several minutes depending on the number of images.
                    </p>
                  </div>
                )}

                {status === "completed" && taskStatus && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span>Processing completed successfully!</span>
                    </div>
                    {taskStatus.result_file && (
                      <Button
                        variant="outline"
                        onClick={() => downloadReport(taskStatus.result_file!)}
                        className="mt-2"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Report
                      </Button>
                    )}
                  </div>
                )}

                {status === "error" && (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                      {taskStatus?.error_message || createError?.data?.detail || "An error occurred during processing"}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* Inventory Selection (Moved to first position) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Select Inventory Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ReactSelectField
                options={inventoryOptions}
                value={inventoryOptions.find((option) => option.value === selectedInventory) || null}
                onChange={(option) => {
                  if (option && !Array.isArray(option)) {
                    setSelectedInventory(option.value)
                  } else {
                    setSelectedInventory(null)
                  }
                }}
                isDisabled={isCreating || status === "processing" || isInventoryLoading}
                placeholder="Select Inventory Location"
                isSearchable
                isClearable
                className={cn(
                  "w-full",
                  (inventoryError || (inventoryData && inventoryData.length === 0)) ? "border-red-500" : ""
                )}
                error={inventoryError ? "Failed to load inventory locations" : undefined}
              />
            </CardContent>
          </Card>

          {/* Image Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Product Images ({images.length}/50)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                {...imageDropzone.getRootProps()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  imageDropzone.isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
                } ${images.length >= 50 ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <input {...imageDropzone.getInputProps()} disabled={images.length >= 50} />
                <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-600">
                  {images.length >= 50
                    ? "Maximum 50 images reached"
                    : "Drag & drop product images here, or click to select"}
                </p>
                <p className="text-xs text-gray-500 mt-1">Supports PNG, JPG, JPEG, GIF, WebP (Max 10MB each)</p>
              </div>

              {/* Image Preview */}
              {images.length > 0 && (
                <div className="mt-4 grid grid-cols-4 gap-4 max-h-60 overflow-y-auto">
                  {images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(image) || "/placeholder.svg"}
                        alt={`Product ${index + 1}`}
                        className="w-full h-20 object-cover rounded border"
                      />
                      <Button
                        size="sm"
                        variant="destructive"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeImage(index)}
                        disabled={isCreating || status === "processing"}
                      >
                        ×
                      </Button>
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b">
                        {(image.size / 1024 / 1024).toFixed(1)}MB
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Excel Upload (Optional) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                Additional Product Data (Optional)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                {...excelDropzone.getRootProps()}
                className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                  excelDropzone.isDragActive ? "border-green-500 bg-green-50" : "border-gray-300 hover:border-gray-400"
                }`}
              >
                <input {...excelDropzone.getInputProps()} />
                <FileSpreadsheet className="h-6 w-6 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-600">Upload Excel file with additional product information</p>
                <p className="text-xs text-gray-500 mt-1">.xlsx or .xls format (Max 5MB)</p>
              </div>

              {excelFile && (
                <div className="mt-2 flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    <span className="text-sm">{excelFile.name}</span>
                    <span className="text-xs text-gray-500">({(excelFile.size / 1024 / 1024).toFixed(1)}MB)</span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={removeExcelFile}
                    disabled={isCreating || status === "processing"}
                  >
                    Remove
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={isCreating || status === "processing"}>
              {status === "processing" ? "Close" : "Cancel"}
            </Button>

            {status === "completed" && <Button onClick={reset}>Start New Process</Button>}

            {status === "idle" && (
              <Button onClick={startProcessing} disabled={images.length === 0 || isCreating} className="min-w-[140px]">
                {isCreating ? (
                  <>
                    <Brain className="h-4 w-4 mr-2 animate-pulse" />
                    Starting...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2" />
                    Start AI Processing
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}