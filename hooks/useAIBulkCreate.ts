"use client"

import { useState, useCallback } from "react"
import {
  useAiBulkCreateProductsMutation,
  useLazyGetBulkTaskStatusQuery,
} from "@/redux/features/product/productAPISlice"
import { toast } from "react-toastify"

export interface BulkCreateStatus {
  status: "idle" | "processing" | "completed" | "error"
  progress: number
  taskId: string | null
  error: string | null
}

export function useAIBulkCreate() {
  const [state, setState] = useState<BulkCreateStatus>({
    status: "idle",
    progress: 0,
    taskId: null,
    error: null,
  })

  const [aiBulkCreate, { isLoading: isCreating }] = useAiBulkCreateProductsMutation()
  const [getTaskStatus] = useLazyGetBulkTaskStatusQuery()

  const pollTaskStatus = useCallback(
    async (taskId: string) => {
      const pollInterval = window.setInterval(async () => {
        try {
          const result = await getTaskStatus(taskId)

          if (result.data) {
            const { status: taskStatus, error_message } = result.data

            if (taskStatus === "COMPLETED") {
              setState((prev) => ({
                ...prev,
                status: "completed",
                progress: 100,
              }))
              window.clearInterval(pollInterval)
              toast.success("AI processing completed successfully!")
            } else if (taskStatus === "FAILED") {
              setState((prev) => ({
                ...prev,
                status: "error",
                error: error_message || "Processing failed",
              }))
              window.clearInterval(pollInterval)
              toast.error(error_message || "Processing failed")
            } else if (taskStatus === "PROCESSING") {
              setState((prev) => ({
                ...prev,
                progress: Math.min(prev.progress + 5, 90),
              }))
            }
          }
        } catch {
          setState((prev) => ({
            ...prev,
            status: "error",
            error: "Failed to check processing status",
          }))
          window.clearInterval(pollInterval)
          toast.error("Failed to check processing status")
        }
      }, 3000)

      window.setTimeout(
        () => {
          window.clearInterval(pollInterval)
          setState((prev) => {
            if (prev.status === "processing") {
              toast.error("Processing timeout. Please check the task status manually.")
              return {
                ...prev,
                status: "error",
                error: "Processing timeout",
              }
            }
            return prev
          })
        },
        10 * 60 * 1000,
      )
    },
    [getTaskStatus],
  )

  const startBulkCreate = useCallback(
    async (images: File[], excelFile?: File) => {
      if (images.length === 0) {
        toast.error("Please upload at least one product image")
        return false
      }

      if (images.length > 50) {
        toast.error("Maximum 50 images allowed per batch")
        return false
      }

      const formData = new FormData()

      // Add images
      images.forEach((image) => {
        formData.append("images", image)
      })

      // Add Excel file if provided
      if (excelFile) {
        formData.append("excel_file", excelFile)
      }

      try {
        const result = await aiBulkCreate(formData).unwrap()

        setState({
          status: "processing",
          progress: 10,
          taskId: result.task_id,
          error: null,
        })

        toast.success("AI processing started successfully!")

        // Start polling for status
        pollTaskStatus(result.task_id)
        return true
      } catch (error: any) {
        const errorMessage = error?.data?.detail || error?.message || "Failed to start AI processing"
        setState({
          status: "error",
          progress: 0,
          taskId: null,
          error: errorMessage,
        })

        toast.error(errorMessage)
        return false
      }
    },
    [aiBulkCreate, pollTaskStatus],
  )

  const reset = useCallback(() => {
    setState({
      status: "idle",
      progress: 0,
      taskId: null,
      error: null,
    })
  }, [])

  return {
    ...state,
    isCreating,
    startBulkCreate,
    reset,
  }
}
