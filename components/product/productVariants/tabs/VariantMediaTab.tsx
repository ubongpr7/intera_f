"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useAddVariantMediaMutation, useGetVariantMediaQuery, useRemoveVariantMediaMutation } from "@/redux/features/product/productAPISlice"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, X, ImageIcon, Video, Trash2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ReactSelectField, type SelectOption } from "@/components/ui/react-select-field"
import { cn } from "@/lib/utils"
import LoadingAnimation from "@/components/common/LoadingAnimation"
import type { Attachment } from "@/components/interfaces/product"
import Image from 'next/image';
interface VariantMediaTabProps {
  variantId: string
}

const VariantMediaTab = ({ variantId }: VariantMediaTabProps) => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadPurpose, setUploadPurpose] = useState<string>("MAIN_IMAGE")
  const [uploadDescription, setUploadDescription] = useState<string>("")
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [addMedia, { isLoading: isUploadingMedia }] = useAddVariantMediaMutation()

  const { data: media, isLoading: isMediaLoading, refetch: refetchMedia } = useGetVariantMediaQuery(variantId)
  const [removeMedia] = useRemoveVariantMediaMutation()

  const purposeOptions: SelectOption[] = [
    { value: "MAIN_IMAGE", label: "Main Image" },
    { value: "GALLERY", label: "Gallery Image" },
  ]

  const validateFile = (file: File): string | null => {
    const maxSize = 10 * 1024 * 1024 // 10MB
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "video/mp4",
      "video/webm",
      "video/ogg",
    ]

    if (!allowedTypes.includes(file.type)) {
      return "Only image (JPEG, PNG, GIF, WebP) and video (MP4, WebM, OGG) files are allowed."
    }

    if (file.size > maxSize) {
      return "File size must be less than 10MB."
    }

    return null
  }

  const handleFileSelect = (file: File) => {
    const error = validateFile(file)
    if (error) {
      setUploadError(error)
      return
    }

    setUploadError(null)
    setUploadedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const handleAddMedia = async () => {
    if (!uploadedFile) {
      setUploadError("No file selected.")
      return
    }

    setIsUploading(true)
    setUploadError(null)

    try {
      // Create FormData following your working example pattern
      const formData = new FormData()

      // Append the file first
      formData.append("file", uploadedFile)

      // Append other fields as strings (not arrays)
      formData.append("file_type", uploadedFile.type.startsWith("image/") ? "IMAGE" : "VIDEO")
      formData.append("purpose", uploadPurpose)

      // Only append description if it has content
      if (uploadDescription.trim()) {
        formData.append("description", uploadDescription.trim())
      }

      // Debug log to see what we're sending
      console.log("FormData contents:")
      for (const [key, value] of formData.entries()) {
        console.log(`${key}:`, value)
      }

      // Use the same pattern as your working example - call the mutation directly
      // Instead of using fetch, let's use the RTK Query mutation but with proper FormData handling
    //   const response = await fetch(`//product/variants/${variantId}/add_media/`, {
    //     method: "POST",
    //     body: formData,
    //   })
      const response = await addMedia({ variantId, data: formData })
          // Reset upload state on success
      setUploadedFile(null)
      setPreviewUrl(null)
      setUploadDescription("")
      setUploadError(null)

      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }

      // Refresh media list
      refetchMedia()
    } catch (error: any) {
      console.error("Upload failed:", error)
      setUploadError(error.message || "Failed to upload media. Please try again.")
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveMedia = async (attachmentId: string) => {
    try {
      await removeMedia({ variantId, attachmentId }).unwrap()
      refetchMedia()
    } catch (error) {
      console.error("Failed to remove media:", error)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleCancelUpload = () => {
    setUploadedFile(null)
    setPreviewUrl(null)
    setUploadError(null)
    setUploadDescription("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  if (isMediaLoading) {
    return (
      <div className="p-4 flex items-center justify-center">
        <LoadingAnimation />
      </div>
    )
  }

  return (
    <div className="p-4 space-y-6 max-h-[70vh] overflow-y-auto">
      <div>
        <h3 className="text-lg font-semibold mb-4">Upload Media</h3>

        {uploadError && (
          <Alert className="mb-4 border-red-500 bg-red-50">
            <AlertDescription className="text-red-700">{uploadError}</AlertDescription>
          </Alert>
        )}

        {!uploadedFile ? (
          <Card className="border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors">
            <CardContent className="p-0">
              <div
                className={cn("relative cursor-pointer transition-colors", isDragging && "bg-blue-50 border-blue-400")}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="flex flex-col items-center justify-center py-8 sm:py-12 px-4 sm:px-6 text-center">
                  <Upload className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mb-4" />
                  <p className="text-sm sm:text-lg font-medium text-gray-700 mb-2">
                    Drop your files here, or click to browse
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500">
                    Supports: Images (JPEG, PNG, GIF, WebP) and Videos (MP4, WebM, OGG)
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Maximum file size: 10MB</p>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*,video/*"
                  className="hidden"
                />
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-4">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-4">
                  <div className="flex-shrink-0 w-full sm:w-auto flex justify-center">
                    {uploadedFile.type.startsWith("image/") ? (
                      <div className="relative">
                        <img
                          src={previewUrl || ""}
                          alt="Preview"
                          className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-lg border"
                        />
                        <div className="absolute -top-2 -right-2">
                          <ImageIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500 bg-white rounded-full p-1 border" />
                        </div>
                      </div>
                    ) : (
                      <div className="relative">
                        <video
                          src={previewUrl || ""}
                          className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-lg border"
                          muted
                        />
                        <div className="absolute -top-2 -right-2">
                          <Video className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500 bg-white rounded-full p-1 border" />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-center sm:text-left">
                    <p className="text-sm font-medium text-gray-900 truncate">{uploadedFile.name}</p>
                    <p className="text-sm text-gray-500">{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    <p className="text-xs text-gray-400 capitalize">{uploadedFile.type.split("/")[0]} file</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancelUpload}
                    className="text-gray-400 hover:text-red-500 self-center sm:self-start"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
                    <ReactSelectField
                      options={purposeOptions}
                      value={purposeOptions.find((option) => option.value === uploadPurpose) || null}
                      onChange={(option) => {
                        if (option && !Array.isArray(option)) {
                          setUploadPurpose(option.value)
                        }
                      }}
                      placeholder="Select Purpose"
                      isSearchable={false}
                      isClearable={false}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                    <input
                      type="text"
                      value={uploadDescription}
                      onChange={(e) => setUploadDescription(e.target.value)}
                      placeholder="Enter a description for this media"
                      className="w-full bg-gray-50 px-3 border-2 border-gray-300 focus:outline-none focus:border-blue-500 py-2 rounded-md"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                  <Button
                    variant="outline"
                    onClick={handleCancelUpload}
                    disabled={isUploading}
                    className="w-full sm:w-auto bg-transparent"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddMedia}
                    disabled={isUploading}
                    className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                  >
                    {isUploading ? "Uploading..." : "Upload Media"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Media Library</h3>
        {media && media.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {media.map((attachment: Attachment) => (
              <Card key={attachment.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="aspect-square relative bg-gray-100 flex items-center justify-center">
                    {attachment.file_type === "IMAGE" ? (
                      <Image src={attachment.file_url} fill className='object-cover' alt={attachment.file}/>
                    ) : (
                      <Video className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400" />
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {attachment.description || attachment.file}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">{attachment.file_type.toLowerCase()}</p>
                    <div className="mt-2 flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMedia(attachment.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex items-center justify-center py-8">
              <p className="text-gray-500">No media files uploaded yet</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default VariantMediaTab
