"use client"

import type React from "react"

import { useEffect, useMemo, useRef, useState } from "react"
import { Bot, Send, Maximize, Minimize, X, Clock, Loader2, ListChecks, Radio, Check } from "lucide-react"
import MessageContent from "@/components/message-content"
import ConfirmationDialog from "@/components/confirmation-dialog"
import {
  MultipleChoiceHandler,
  FileUploadHandler,
  ProgressTrackerHandler,
  DataTableHandler,
  DynamicFormHandler,
  DateTimePickerHandler,
  SliderInputHandler,
  PriorityRankingHandler,
  CodeReviewHandler,
  ImageAnnotationHandler,
} from "@/components/interaction-handlers"
import {
  SearchableSelectionHandler,
  HierarchicalSelectionHandler,
  AutocompleteSelectionHandler,
  ComparisonViewHandler,
  BulkActionSelectorHandler,
} from "@/components/advanced-interaction-handlers"
import type { ChatMessage } from "./ai-chat-widget"

interface AgentChatProps {
  onClose: () => void
  isFullScreen: boolean
  toggleFullScreen: () => void
  messages: ChatMessage[]
  onSend: (text: string) => void
  onActivity?: () => void
  isBusy?: boolean
  pendingCount?: number
  taskCount?: number
  eventCount?: number
  lastUpdatedAt?: number
}

export default function AgentChat({
  onClose,
  isFullScreen,
  toggleFullScreen,
  messages,
  onSend,
  onActivity,
  isBusy = false,
  pendingCount = 0,
  taskCount = 0,
  eventCount = 0,
  lastUpdatedAt,
}: AgentChatProps) {
  const [input, setInput] = useState("")
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
  const [confirmationDialog, setConfirmationDialog] = useState<any>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const MAX_TEXTAREA_HEIGHT = 160

  // Smart autoscroll
  const [isAtBottom, setIsAtBottom] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const prevLenRef = useRef<number>(0)
  const newMessagesCount = useMemo(() => Math.max(messages.length - prevLenRef.current, 0), [messages.length])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const onScroll = () => {
      const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 20
      setIsAtBottom(nearBottom)
      if (nearBottom) setUnreadCount(0)
    }
    el.addEventListener("scroll", onScroll)
    return () => el.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    if (isAtBottom) {
      endRef.current?.scrollIntoView({ behavior: "smooth" })
    } else if (newMessagesCount > 0) {
      setUnreadCount((c) => c + newMessagesCount)
    }
    prevLenRef.current = messages.length
  }, [messages, isAtBottom, newMessagesCount])

  function scrollToBottom() {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
    setUnreadCount(0)
  }

  function resizeTextarea(el: HTMLTextAreaElement) {
    el.style.height = "auto"
    const newHeight = Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT)
    el.style.height = `${newHeight}px`
    el.style.overflowY = el.scrollHeight > MAX_TEXTAREA_HEIGHT ? "auto" : "hidden"
  }

  useEffect(() => {
    if (textareaRef.current) resizeTextarea(textareaRef.current)
  }, [input])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    onSend(input)
    onActivity?.()
    setInput("")
    if (textareaRef.current) textareaRef.current.style.height = "auto"
    requestAnimationFrame(scrollToBottom)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as unknown as React.FormEvent)
    }
  }

  const handleCopyMessage = async (messageId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedMessageId(messageId)
      setTimeout(() => setCopiedMessageId(null), 2000)
    } catch (err) {
      console.error("Failed to copy message:", err)
    }
  }

  const handleExportMessage = (content: string) => {
    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `ai-message-${Date.now()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const detectInteractionRequest = (content: string) => {
    const jsonCodeBlockRegex = /```json\s*([\s\S]*?)\s*```/i
    const codeBlockMatch = content.match(jsonCodeBlockRegex)

    let jsonContent = content
    if (codeBlockMatch) {
      jsonContent = codeBlockMatch[1].trim()
    }

    try {
      const parsed = JSON.parse(jsonContent)

      // Check for confirmation request
      if (parsed.type === "AGENT_CONFIRMATION_REQUEST") {
        return { type: "confirmation", data: parsed }
      }

      // Check for interaction types based on interaction_type field
      if (parsed.interaction_type) {
        return {
          type: parsed.interaction_type,
          data: parsed,
        }
      }

      // Check for legacy interaction types (backward compatibility)
      const interactionTypes = [
        "AGENT_MULTIPLE_CHOICE",
        "AGENT_FILE_UPLOAD",
        "AGENT_PROGRESS_TRACKER",
        "AGENT_DATA_TABLE",
        "AGENT_DYNAMIC_FORM",
        "AGENT_DATE_TIME_PICKER",
        "AGENT_SLIDER_INPUT",
        "AGENT_PRIORITY_RANKING",
        "AGENT_CODE_REVIEW",
        "AGENT_IMAGE_ANNOTATION",
      ]

      if (interactionTypes.includes(parsed.type)) {
        return {
          type: parsed.type.replace("AGENT_", "").toLowerCase(),
          data: parsed,
        }
      }
    } catch {
      // Not a JSON interaction request
    }
    return null
  }

  const getInteractionStyle = (type: string) => {
    const styles = {
      confirmation: { color: "bg-amber-50 border-amber-200", textColor: "text-amber-700", icon: "⚠️" },
      multiple_choice: { color: "bg-blue-50 border-blue-200", textColor: "text-blue-700", icon: "❓" },
      file_upload: { color: "bg-green-50 border-green-200", textColor: "text-green-700", icon: "📁" },
      progress_tracker: { color: "bg-purple-50 border-purple-200", textColor: "text-purple-700", icon: "⏳" },
      data_table: { color: "bg-indigo-50 border-indigo-200", textColor: "text-indigo-700", icon: "📊" },
      dynamic_form: { color: "bg-pink-50 border-pink-200", textColor: "text-pink-700", icon: "📝" },
      date_time_picker: { color: "bg-teal-50 border-teal-200", textColor: "text-teal-700", icon: "📅" },
      slider_input: { color: "bg-orange-50 border-orange-200", textColor: "text-orange-700", icon: "🎚️" },
      priority_ranking: { color: "bg-red-50 border-red-200", textColor: "text-red-700", icon: "📋" },
      code_review: { color: "bg-gray-50 border-gray-200", textColor: "text-gray-700", icon: "💻" },
      image_annotation: { color: "bg-yellow-50 border-yellow-200", textColor: "text-yellow-700", icon: "🖼️" },
      searchable_selection: { color: "bg-cyan-50 border-cyan-200", textColor: "text-cyan-700", icon: "🔍" },
      hierarchical_selection: { color: "bg-emerald-50 border-emerald-200", textColor: "text-emerald-700", icon: "🌳" },
      autocomplete_selection: { color: "bg-violet-50 border-violet-200", textColor: "text-violet-700", icon: "⚡" },
      comparison_view: { color: "bg-rose-50 border-rose-200", textColor: "text-rose-700", icon: "⚖️" },
      bulk_action_selector: { color: "bg-slate-50 border-slate-200", textColor: "text-slate-700", icon: "⚡" },
    }
    return styles[type as keyof typeof styles] || styles.confirmation
  }

  const renderInlineInteraction = (type: string, data: any) => {
    const commonProps = {
      data,
      onResponse: handleInteractionResponse,
      compact: true, // Add compact mode for inline display
    }

    switch (type) {
      case "multiple_choice":
        return <MultipleChoiceHandler {...commonProps} />
      case "file_upload":
        return <FileUploadHandler {...commonProps} />
      case "progress_tracker":
        return <ProgressTrackerHandler {...commonProps} />
      case "data_table":
        return <DataTableHandler {...commonProps} />
      case "dynamic_form":
        return <DynamicFormHandler {...commonProps} />
      case "date_time_picker":
        return <DateTimePickerHandler {...commonProps} />
      case "slider_input":
        return <SliderInputHandler {...commonProps} />
      case "priority_ranking":
        return <PriorityRankingHandler {...commonProps} />
      case "code_review":
        return <CodeReviewHandler {...commonProps} />
      case "image_annotation":
        return <ImageAnnotationHandler {...commonProps} />
      case "searchable_selection":
        return <SearchableSelectionHandler {...commonProps} />
      case "hierarchical_selection":
        return <HierarchicalSelectionHandler {...commonProps} />
      case "autocomplete_selection":
        return <AutocompleteSelectionHandler {...commonProps} />
      case "comparison_view":
        return <ComparisonViewHandler {...commonProps} />
      case "bulk_action_selector":
        return <BulkActionSelectorHandler {...commonProps} />
      default:
        return null
    }
  }

  const handleInteractionResponse = (response: any) => {
    // Send the response back to the agent as a regular message
    const responseText = typeof response === "string" ? response : JSON.stringify(response)
    onSend(responseText)
    onActivity?.()
  }

  const handleConfirmationResponse = (response: any) => {
    // Send the response back to the agent as a regular message
    const responseText = typeof response === "string" ? response : JSON.stringify(response)
    onSend(responseText)
    onActivity?.()
    setConfirmationDialog(null)
  }

  return (
    <>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4 flex items-center justify-between">
        {/* Left group */}
        <div className="flex items-center gap-2 min-w-0">
          <Bot className="h-5 w-5 text-white shrink-0" aria-hidden strokeWidth={2.2} />

          {/* Badges */}
          <div className="ml-3 flex items-center gap-2 text-xs">
            <span className="inline-flex whitespace-nowrap items-center gap-1 rounded-full bg-white/15 px-2 py-1">
              <Radio
                className={`h-4 w-4 ${pendingCount > 0 ? "animate-pulse text-yellow-300" : "text-white"}`}
                aria-hidden
                strokeWidth={2.4}
              />
              <span>{pendingCount > 0 ? `${pendingCount} pending` : "Idle"}</span>
            </span>
            <span className="inline-flex whitespace-nowrap items-center gap-1 rounded-full bg-white/15 px-2 py-1">
              <ListChecks className="h-4 w-4 text-white" aria-hidden strokeWidth={2.4} />
              <span>{taskCount} tasks</span>
            </span>
            <span className="hidden whitespace-nowrap sm:inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-1">
              <Clock className="h-4 w-4 text-white" aria-hidden strokeWidth={2.4} />
              <span>{eventCount} events</span>
            </span>
          </div>
        </div>

        {/* Right group */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              toggleFullScreen()
              onActivity?.()
            }}
            className="p-1 rounded-full hover:bg-white/20 transition-colors shrink-0"
            aria-label={isFullScreen ? "Exit full screen" : "Enter full screen"}
            title={isFullScreen ? "Exit full screen" : "Enter full screen"}
          >
            {isFullScreen ? (
              <Minimize className="h-5 w-5 text-white" strokeWidth={2.2} />
            ) : (
              <Maximize className="h-5 w-5 text-white" strokeWidth={2.2} />
            )}
          </button>
          <button
            onClick={() => {
              onClose()
              onActivity?.()
            }}
            className="p-1 rounded-full hover:bg-white/20 transition-colors"
            aria-label="Close chat"
            title="Close"
          >
            <X className="h-5 w-5 text-white" strokeWidth={2.2} />
          </button>
        </div>
      </div>

      {/* Messages area */}
      <div
        ref={scrollRef}
        className="relative flex-1 overflow-y-auto p-4 bg-gray-50 custom-scrollbar"
        onMouseMove={onActivity}
        onClick={onActivity}
      >
        {messages.length === 0 ? (
          <div className="text-center h-full flex flex-col items-center justify-center text-gray-500">
            <Bot className="h-12 w-12 mb-3 text-blue-500" aria-hidden strokeWidth={2.2} />
            <p>{"How can I help you today?"}</p>
          </div>
        ) : (
          messages.map((m) => {
            const interactionData = m.role === "assistant" ? detectInteractionRequest(m.content) : null

            if (interactionData) {
              const { type, data } = interactionData
              const style = getInteractionStyle(type)

              // Handle confirmation separately for backward compatibility
              if (type === "confirmation") {
                return (
                  <div key={m.id} className="mb-8 flex justify-start">
                    <div
                      className={`max-w-[95%] ${style.color} border text-gray-800 rounded-2xl rounded-bl-none shadow-lg px-4 py-4`}
                    >
                      <div className={`font-semibold text-xs mb-3 ${style.textColor} flex items-center gap-2`}>
                        <Clock className="h-3 w-3" />
                        Assistant - Awaiting Confirmation
                      </div>
                      <div className="space-y-3">
                        <p className="font-medium text-gray-900 text-sm">{data.description}</p>
                        {data.details && (
                          <p className="text-xs text-gray-600 bg-white/50 p-2 rounded-lg">{data.details}</p>
                        )}
                        <button
                          onClick={() => setConfirmationDialog(data)}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors"
                        >
                          Review & Respond
                        </button>
                      </div>
                    </div>
                  </div>
                )
              }

              return (
                <div key={m.id} className="mb-8 flex justify-start">
                  <div
                    className={`max-w-[95%] ${style.color} border text-gray-800 rounded-2xl rounded-bl-none shadow-lg px-4 py-4`}
                  >
                    <div className={`font-semibold text-xs mb-3 ${style.textColor} flex items-center gap-2`}>
                      <span>{style.icon}</span>
                      Assistant - {type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                    </div>
                    <div className="space-y-3">
                      <div className="text-sm">{renderInlineInteraction(type, data)}</div>
                    </div>
                  </div>
                </div>
              )
            }

            return (
              <div key={m.id} className={`mb-8 flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-5 py-4 ${
                    m.role === "user"
                      ? "bg-blue-500 text-white rounded-br-none"
                      : "bg-white text-gray-800 rounded-bl-none shadow-lg border border-gray-100"
                  }`}
                >
                  <div
                    className={`font-semibold text-xs mb-3 ${m.role === "user" ? "text-blue-100" : "text-gray-500"}`}
                  >
                    {m.role === "user" ? "You" : "Assistant"}
                    {copiedMessageId === m.id && (
                      <span className="ml-2 inline-flex items-center gap-1 text-green-600">
                        <Check className="h-3 w-3" />
                        <span className="text-xs">Copied!</span>
                      </span>
                    )}
                  </div>
                  <MessageContent
                    content={m.content}
                    role={m.role}
                    onCopy={() => handleCopyMessage(m.id, m.content)}
                    onExport={() => handleExportMessage(m.content)}
                  />
                </div>
              </div>
            )
          })
        )}

        {pendingCount > 0 && (
          <div className="flex justify-start mb-4">
            <div className="bg-white text-gray-800 rounded-2xl rounded-bl-none px-4 py-3 max-w-[80%] shadow-sm border border-gray-100">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-gray-700" aria-hidden />
                <span>Assistant is processing...</span>
              </div>
            </div>
          </div>
        )}

        {!isAtBottom && unreadCount > 0 && (
          <button
            type="button"
            onClick={() => {
              scrollToBottom()
              onActivity?.()
            }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs px-3 py-1.5 rounded-full shadow hover:bg-blue-700"
          >
            View {unreadCount} new message{unreadCount > 1 ? "s" : ""}
          </button>
        )}

        <div ref={endRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (!input.trim()) return
          onSend(input)
          onActivity?.()
          setInput("")
          if (textareaRef.current) textareaRef.current.style.height = "auto"
          requestAnimationFrame(() => {
            endRef.current?.scrollIntoView({ behavior: "smooth" })
          })
        }}
        className="border-t border-gray-200 p-3 bg-white"
      >
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              onActivity?.()
              if (textareaRef.current) {
                textareaRef.current.style.height = "auto"
                const h = Math.min(textareaRef.current.scrollHeight, MAX_TEXTAREA_HEIGHT)
                textareaRef.current.style.height = `${h}px`
                textareaRef.current.style.overflowY =
                  textareaRef.current.scrollHeight > MAX_TEXTAREA_HEIGHT ? "auto" : "hidden"
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                // submit
                if (input.trim()) {
                  onSend(input)
                  onActivity?.()
                  setInput("")
                  if (textareaRef.current) textareaRef.current.style.height = "auto"
                }
              }
            }}
            rows={1}
            placeholder="Type your message..."
            className="flex-1 text-gray-800 border border-gray-300 rounded-2xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none leading-6 max-h-[160px]"
            disabled={isBusy}
            aria-label="Type your message"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50"
            disabled={isBusy || !input.trim()}
            aria-label="Send message"
            title="Send"
            onClick={onActivity}
          >
            <Send className="h-5 w-5 text-white" strokeWidth={2.2} />
          </button>
        </div>
      </form>

      {/* Confirmation Dialog */}
      {confirmationDialog && (
        <ConfirmationDialog
          data={confirmationDialog}
          onResponse={handleConfirmationResponse}
          onClose={() => setConfirmationDialog(null)}
        />
      )}
    </>
  )
}
