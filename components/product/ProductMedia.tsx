"use client"

import type React from "react"

import { useState } from "react"
import {
  useGetAttachmentsQuery,
  useUpdateAttachmentMutation,
  useDeleteAttachmentMutation,
  useSetPrimaryAttachmentMutation,
  useBulkUploadAttachmentsMutation,
} from "@/redux/features/product/productAPISlice"
import LoadingAnimation from "../common/LoadingAnimation"
import Modal from "../common/Modal"
import { extractErrorMessage } from "@/lib/utils"
import { toast } from "react-toastify"
import { confirmAction } from "../common/confirmAction"

interface ProductMediaProps {
  productId: string
}

export default function ProductMedia({ productId }: ProductMediaProps) {
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [editingAttachment, setEditingAttachment] = useState<any>(null)

  const {
    data: attachments = [],
    isLoading,
    refetch,
  } = useGetAttachmentsQuery({
    product_id: productId,
  })

  const [updateAttachment, { isLoading: isUpdating }] = useUpdateAttachmentMutation()
  const [deleteAttachment] = useDeleteAttachmentMutation()
  const [setPrimary] = useSetPrimaryAttachmentMutation()
  const [bulkUpload, { isLoading: isBulkUploading }] = useBulkUploadAttachmentsMutation()

  const handleFileUpload = async (files: FileList, purpose = "GALLERY") => {
    const formData = new FormData()

    Array.from(files).forEach((file) => {
      formData.append("files", file)
    })

    formData.append("content_type", "product")
    formData.append("object_id", productId)
    formData.append("purpose", purpose)

    try {
      await bulkUpload(formData).unwrap()
      setShowUploadModal(false)
      refetch()
    } catch (error) {
      toast.error(extractErrorMessage(error, ["files", "detail"]))
    }
  }

  const handleSingleUpload = async (file: File, purpose: string, description: string) => {
    const formData = new FormData()
    formData.append("files", file)
    formData.append("content_type", "product")
    formData.append("object_id", productId)
    formData.append("purpose", purpose)
    formData.append("description", description)

    try {
      await bulkUpload(formData).unwrap()
      setShowUploadModal(false)
      refetch()
    } catch (error) {
      toast.error(extractErrorMessage(error, ["files", "description", "detail"]))
    }
  }

  const handleUpdateAttachment = async (data: any) => {
    try {
      await updateAttachment({ id: editingAttachment.id, data }).unwrap()
      setEditingAttachment(null)
      refetch()
    } catch (error) {
      toast.error(extractErrorMessage(error, ["description", "purpose", "detail"]))
    }
  }

  const handleDeleteAttachment = async (attachmentId: string) => {
    const confirmed = await confirmAction({
      title: "Delete attachment?",
      description: "This removes the media file from the product record.",
      confirmText: "Delete attachment",
      destructive: true,
    })
    if (!confirmed) return

    try {
      await deleteAttachment(attachmentId).unwrap()
      refetch()
    } catch (error) {
      toast.error(extractErrorMessage(error, ["detail"]))
    }
  }

  const handleSetPrimary = async (attachmentId: string) => {
    try {
      await setPrimary(attachmentId).unwrap()
      refetch()
    } catch (error) {
      toast.error(extractErrorMessage(error, ["detail"]))
    }
  }

  const groupedAttachments = attachments.reduce((groups: any, attachment: any) => {
    const purpose = attachment.purpose || "OTHER"
    if (!groups[purpose]) {
      groups[purpose] = []
    }
    groups[purpose].push(attachment)
    return groups
  }, {})

  if (isLoading) {
    return (
      <div className="text-center flex items-center justify-center py-8 text-gray-500">
        <LoadingAnimation text="Loading media..." ringColor="#3b82f6" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Product Media</h2>
        <button
          onClick={() => setShowUploadModal(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          Upload Media
        </button>
      </div>

      {/* Media Groups */}
      {Object.keys(groupedAttachments).map((purpose) => (
        <div key={purpose} className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {purpose.replace("_", " ")} ({groupedAttachments[purpose].length})
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {groupedAttachments[purpose].map((attachment: any) => (
              <div key={attachment.id} className="relative group">
                {/* Media Preview */}
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  {attachment.file_type === "IMAGE" ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={attachment.file_url || "/placeholder.svg"}
                        alt={attachment.description || "Product image"}
                        className="w-full h-full object-cover"
                      />
                    </>
                  ) : attachment.file_type === "VIDEO" ? (
                    <video src={attachment.file_url} className="w-full h-full object-cover" controls />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-2xl text-gray-400 mb-2">📄</div>
                        <p className="text-xs text-gray-600">{attachment.file_type}</p>
                      </div>
                    </div>
                  )}

                  {attachment.is_primary && (
                    <div className="absolute top-2 left-2">
                      <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full">Primary</span>
                    </div>
                  )}
                </div>

                {/* Media Info */}
                <div className="mt-2">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {attachment.description || "No description"}
                  </p>
                  <p className="text-xs text-gray-600">{attachment.file_size_formatted}</p>
                </div>

                {/* Actions Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                  <div className="flex space-x-2">
                    {!attachment.is_primary && (
                      <button
                        onClick={() => handleSetPrimary(attachment.id)}
                        className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                      >
                        Set Primary
                      </button>
                    )}
                    <button
                      onClick={() => setEditingAttachment(attachment)}
                      className="px-2 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteAttachment(attachment.id)}
                      className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {Object.keys(groupedAttachments).length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No media files found for this product.</p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Upload First Media
          </button>
        </div>
      )}

      {/* Upload Modal */}
      <Modal isOpen={showUploadModal} onClose={() => setShowUploadModal(false)} title="Upload Media Files" size="lg">
        <MediaUploadForm
          onUpload={handleFileUpload}
          onSingleUpload={handleSingleUpload}
          onCancel={() => setShowUploadModal(false)}
          isLoading={isBulkUploading}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editingAttachment} onClose={() => setEditingAttachment(null)} title="Edit Attachment">
        {editingAttachment && (
          <AttachmentEditForm
            attachment={editingAttachment}
            onSubmit={handleUpdateAttachment}
            onCancel={() => setEditingAttachment(null)}
            isLoading={isUpdating}
          />
        )}
      </Modal>
    </div>
  )
}

// Media Upload Form Component
function MediaUploadForm({
  onUpload,
  onSingleUpload,
  onCancel,
  isLoading,
}: {
  onUpload: (files: FileList, purpose: string) => void
  onSingleUpload: (file: File, purpose: string, description: string) => void
  onCancel: () => void
  isLoading: boolean
}) {
  const [uploadMode, setUploadMode] = useState<"bulk" | "single">("bulk")
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null)
  const [purpose, setPurpose] = useState("GALLERY")
  const [description, setDescription] = useState("")

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(e.target.files)
  }

  const handleBulkUpload = () => {
    if (selectedFiles) {
      onUpload(selectedFiles, purpose)
    }
  }

  const handleSingleUpload = () => {
    if (selectedFiles && selectedFiles[0]) {
      onSingleUpload(selectedFiles[0], purpose, description)
    }
  }

  return (
    <div className="space-y-6 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.08),_transparent_38%)] p-6 text-slate-100">
      {/* Upload Mode Toggle */}
      <div className="flex space-x-4">
        <button
          onClick={() => setUploadMode("bulk")}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
            uploadMode === "bulk"
              ? "bg-blue-600 text-white shadow-lg shadow-blue-900/30"
              : "border border-slate-700 bg-slate-900/70 text-slate-200 hover:border-slate-500 hover:bg-slate-800"
          }`}
        >
          Bulk Upload
        </button>
        <button
          onClick={() => setUploadMode("single")}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
            uploadMode === "single"
              ? "bg-blue-600 text-white shadow-lg shadow-blue-900/30"
              : "border border-slate-700 bg-slate-900/70 text-slate-200 hover:border-slate-500 hover:bg-slate-800"
          }`}
        >
          Single Upload
        </button>
      </div>

      {/* File Selection */}
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-200">Select Files</label>
        <input
          type="file"
          multiple={uploadMode === "bulk"}
          accept="image/*,video/*,.pdf,.doc,.docx"
          onChange={handleFileSelect}
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-800 file:px-3 file:py-2 file:text-slate-100 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        />
        {selectedFiles && <p className="mt-1 text-sm text-slate-400">{selectedFiles.length} file(s) selected</p>}
      </div>

      {/* Purpose Selection */}
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-200">Purpose</label>
        <select
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        >
          <option value="MAIN_IMAGE">Main Product Image</option>
          <option value="GALLERY">Gallery Image</option>
          <option value="MANUAL">Product Manual</option>
          <option value="SPEC">Specification Sheet</option>
          <option value="BARCODE">Barcode Image</option>
          <option value="QR_CODE">QR Code</option>
        </select>
      </div>

      {/* Description (for single upload) */}
      {uploadMode === "single" && (
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-200">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            rows={3}
            placeholder="File description..."
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end space-x-3 border-t border-slate-800 pt-6">
        <button
          onClick={onCancel}
          className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:bg-slate-800"
        >
          Cancel
        </button>
        <button
          onClick={uploadMode === "bulk" ? handleBulkUpload : handleSingleUpload}
          disabled={!selectedFiles || isLoading}
          className="flex items-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading && <LoadingAnimation text="" ringColor="#ffffff" size={14} />}
          Upload {uploadMode === "bulk" ? "Files" : "File"}
        </button>
      </div>
    </div>
  )
}

// Attachment Edit Form Component
function AttachmentEditForm({
  attachment,
  onSubmit,
  onCancel,
  isLoading,
}: {
  attachment: any
  onSubmit: (data: any) => void
  onCancel: () => void
  isLoading: boolean
}) {
  const [formData, setFormData] = useState({
    purpose: attachment.purpose || "GALLERY",
    description: attachment.description || "",
    is_primary: attachment.is_primary || false,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.08),_transparent_38%)] p-6 text-slate-100">
      {/* File Preview */}
      <div className="text-center">
          {attachment.file_type === "IMAGE" ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={attachment.file_url || "/placeholder.svg"}
              alt={attachment.description || attachment.file || "Attachment"}
              className="mx-auto max-h-48 max-w-full rounded-2xl border border-slate-800 object-contain"
            />
          </>
        ) : (
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900">
            <span className="text-2xl">📄</span>
          </div>
        )}
        <p className="mt-2 text-sm text-slate-400">
          {attachment.file_size_formatted} • {attachment.mime_type}
        </p>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-200">Purpose</label>
        <select
          value={formData.purpose}
          onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        >
          <option value="MAIN_IMAGE">Main Product Image</option>
          <option value="GALLERY">Gallery Image</option>
          <option value="MANUAL">Product Manual</option>
          <option value="SPEC">Specification Sheet</option>
          <option value="BARCODE">Barcode Image</option>
          <option value="QR_CODE">QR Code</option>
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-200">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          rows={3}
          placeholder="File description..."
        />
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="is_primary"
          checked={formData.is_primary}
          onChange={(e) => setFormData({ ...formData, is_primary: e.target.checked })}
          className="h-4 w-4 rounded border-slate-600 text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="is_primary" className="ml-2 block text-sm text-slate-100">
          Set as primary image
        </label>
      </div>

      <div className="flex justify-end space-x-3 border-t border-slate-800 pt-6">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:bg-slate-800"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex items-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading && <LoadingAnimation text="" ringColor="#ffffff" size={14} />}
          Update Attachment
        </button>
      </div>
    </form>
  )
}
