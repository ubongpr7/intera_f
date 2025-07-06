"use client"

import type React from "react"

import { useState } from "react"
import {
  useGetAttachmentsQuery,
  useCreateAttachmentMutation,
  useUpdateAttachmentMutation,
  useDeleteAttachmentMutation,
  useSetPrimaryAttachmentMutation,
  useBulkUploadAttachmentsMutation,
} from "@/redux/features/product/productAPISlice"
import LoadingAnimation from "../common/LoadingAnimation"
import Modal from "../common/Modal"

interface ProductMediaProps {
  productId: string
}

export default function ProductMedia({ productId }: ProductMediaProps) {
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [editingAttachment, setEditingAttachment] = useState<any>(null)
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null)

  const {
    data: attachments = [],
    isLoading,
    refetch,
  } = useGetAttachmentsQuery({
    content_type: "product",
    object_id: productId,
  })

  const [createAttachment, { isLoading: isCreating }] = useCreateAttachmentMutation()
  const [updateAttachment, { isLoading: isUpdating }] = useUpdateAttachmentMutation()
  const [deleteAttachment] = useDeleteAttachmentMutation()
  const [setPrimary] = useSetPrimaryAttachmentMutation()
  const [bulkUpload, { isLoading: isBulkUploading }] = useBulkUploadAttachmentsMutation()

  const handleFileUpload = async (files: FileList, purpose = "GALLERY") => {
    const formData = new FormData()

    Array.from(files).forEach((file) => {
      formData.append("files", file)
    })

    formData.append("content_type_id", "1") // Product content type
    formData.append("object_id", productId)
    formData.append("purpose", purpose)

    try {
      await bulkUpload(formData).unwrap()
      setSelectedFiles(null)
      setShowUploadModal(false)
      refetch()
    } catch (error) {
      console.error("Error uploading files:", error)
    }
  }

  const handleSingleUpload = async (file: File, purpose: string, description: string) => {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("content_type_id", "1") // Product content type
    formData.append("object_id", productId)
    formData.append("purpose", purpose)
    formData.append("description", description)

    try {
      await createAttachment(formData).unwrap()
      refetch()
    } catch (error) {
      console.error("Error uploading file:", error)
    }
  }

  const handleUpdateAttachment = async (data: any) => {
    try {
      await updateAttachment({ id: editingAttachment.id, data }).unwrap()
      setEditingAttachment(null)
      refetch()
    } catch (error) {
      console.error("Error updating attachment:", error)
    }
  }

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (confirm("Are you sure you want to delete this attachment?")) {
      try {
        await deleteAttachment(attachmentId).unwrap()
        refetch()
      } catch (error) {
        console.error("Error deleting attachment:", error)
      }
    }
  }

  const handleSetPrimary = async (attachmentId: string) => {
    try {
      await setPrimary(attachmentId).unwrap()
      refetch()
    } catch (error) {
      console.error("Error setting primary:", error)
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
                    <img
                      src={attachment.file_url || "/placeholder.svg"}
                      alt={attachment.description || "Product image"}
                      className="w-full h-full object-cover"
                    />
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
      <Modal isOpen={showUploadModal} onClose={() => setShowUploadModal(false)} title="Upload Media Files" size="large">
        <MediaUploadForm
          onUpload={handleFileUpload}
          onSingleUpload={handleSingleUpload}
          onCancel={() => setShowUploadModal(false)}
          isLoading={isBulkUploading || isCreating}
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
    <div className="space-y-6">
      {/* Upload Mode Toggle */}
      <div className="flex space-x-4">
        <button
          onClick={() => setUploadMode("bulk")}
          className={`px-4 py-2 rounded-lg ${
            uploadMode === "bulk" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Bulk Upload
        </button>
        <button
          onClick={() => setUploadMode("single")}
          className={`px-4 py-2 rounded-lg ${
            uploadMode === "single" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Single Upload
        </button>
      </div>

      {/* File Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Files</label>
        <input
          type="file"
          multiple={uploadMode === "bulk"}
          accept="image/*,video/*,.pdf,.doc,.docx"
          onChange={handleFileSelect}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        {selectedFiles && <p className="text-sm text-gray-600 mt-1">{selectedFiles.length} file(s) selected</p>}
      </div>

      {/* Purpose Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Purpose</label>
        <select
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={3}
            placeholder="File description..."
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
        <button
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={uploadMode === "bulk" ? handleBulkUpload : handleSingleUpload}
          disabled={!selectedFiles || isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
        >
          {isLoading && <LoadingAnimation text="" ringColor="#ffffff" size="sm" />}
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
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* File Preview */}
      <div className="text-center">
        {attachment.file_type === "IMAGE" ? (
          <img
            src={attachment.file_url || "/placeholder.svg"}
            alt={attachment.description}
            className="max-w-full max-h-48 mx-auto rounded-lg"
          />
        ) : (
          <div className="w-24 h-24 mx-auto bg-gray-100 rounded-lg flex items-center justify-center">
            <span className="text-2xl">📄</span>
          </div>
        )}
        <p className="text-sm text-gray-600 mt-2">
          {attachment.file_size_formatted} • {attachment.mime_type}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
        <select
          value={formData.purpose}
          onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="is_primary" className="ml-2 block text-sm text-gray-900">
          Set as primary image
        </label>
      </div>

      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
        >
          {isLoading && <LoadingAnimation text="" ringColor="#ffffff" size="sm" />}
          Update Attachment
        </button>
      </div>
    </form>
  )
}
