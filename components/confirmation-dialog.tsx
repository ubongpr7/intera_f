"use client"

import { useState } from "react"
import { AlertTriangle, CheckCircle, Info } from "lucide-react"

interface ConfirmationData {
  interaction_type: string
  title: string
  description: string
  action_type: string
  details?: string
  approve_text: string
  deny_text: string
  allow_input: boolean
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            {getActionIcon()}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{data.title}</h3>
              <p className="text-sm text-gray-500 mt-1">Action: {data.action_type.replace(/_/g, " ")}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-4">
            <p className="text-gray-800 leading-relaxed">{data.description}</p>

            {data.details && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg border-l-4 border-blue-400">
                <p className="text-sm text-gray-700">{data.details}</p>
              </div>
            )}
          </div>

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
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
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
