"use client"

import type React from "react"
import {
  Bot,
  Send,
  Maximize,
  Minimize,
  X,
  Clock,
  Loader2,
  ListChecks,
  Radio,
  Check,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
} from "lucide-react"
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
  DataTableReviewHandler,
  UpdateFormHandler,
} from "@/components/interaction-handlers"
import {
  SearchableSelectionHandler,
  HierarchicalSelectionHandler,
  AutocompleteSelectionHandler,
  ComparisonViewHandler,
  BulkActionSelectorHandler,
} from "@/components/advanced-interaction-handlers"
import {
  DashboardBuilderHandler,
  MasterDetailTableHandler,
  AlertManagerHandler,
  TaskAssignmentHandler,
  CommentThreadHandler,
  ApprovalWorkflowHandler,
  WizardFlowHandler,
} from "@/components/extra-collab-handlers"
import { useVoiceChat } from "@/hooks/use-voice-chat"
import type { ChatMessage } from "./ai-chat-widget"
import { useState, useRef, useEffect, useMemo } from "react"

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
  const [respondedInteractions, setRespondedInteractions] = useState<Set<string>>(new Set())
  const [isVoiceModeEnabled, setIsVoiceModeEnabled] = useState(false)
  const [hasActiveInteraction, setHasActiveInteraction] = useState(false)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)

  const scrollRef = useRef<HTMLDivElement>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const prevLenRef = useRef<number>(0)
  const MAX_TEXTAREA_HEIGHT = 160

  const newMessagesCount = useMemo(() => Math.max(messages.length - prevLenRef.current, 0), [messages.length])

  const voiceChat = useVoiceChat({
    onTranscript: (text: string) => {
      setInput(text)
      onActivity?.()
    },
    onAutoSend: (text: string) => {
      if (text.trim() && !hasActiveInteraction) {
        onSend(text)
        onActivity?.()
        setInput("")
        if (textareaRef.current) textareaRef.current.style.height = "auto"
        requestAnimationFrame(scrollToBottom)
      }
    },
    autoSendDelay: 6000,
  })

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

  useEffect(() => {
    if (!isVoiceModeEnabled || !voiceChat.isSupported) return

    const lastMessage = messages[messages.length - 1]
    if (!lastMessage || lastMessage.role !== "assistant") return

    const interactionData = detectInteractionRequest(lastMessage.content)
    if (interactionData) {
      setHasActiveInteraction(true)
      voiceChat.stopSpeaking()
      return
    }

    setHasActiveInteraction(false)

    if (lastMessage.content.trim()) {
      voiceChat.speak(lastMessage.content)
    }
  }, [messages, isVoiceModeEnabled, voiceChat])

  useEffect(() => {
    if (hasActiveInteraction && voiceChat.isSpeaking) {
      voiceChat.stopSpeaking()
    }
  }, [hasActiveInteraction, voiceChat])

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

    if (isVoiceModeEnabled) {
      voiceChat.stopListening()
      voiceChat.stopSpeaking()
      voiceChat.clearTranscript()
    }

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
    const jsonCodeBlockRegex = /```json\s*([\s\S]*?)\s*```/gi
    const codeBlockMatches = [...content.matchAll(jsonCodeBlockRegex)]

    console.log("Detecting interaction in content:", content.substring(0, 100) + "...")
    console.log("Found JSON code blocks:", codeBlockMatches.length)

    for (const match of codeBlockMatches) {
      const jsonContent = match[1].trim()
      console.log("Parsing JSON block:", jsonContent.substring(0, 100) + "...")

      try {
        const parsed = JSON.parse(jsonContent)
        console.log("Parsed JSON:", parsed)

        if (parsed.interaction_type === "confirmation_request") {
          console.log("Detected confirmation request")
          return { type: "confirmation", data: parsed }
        }

        if (parsed.type === "AGENT_CONFIRMATION_REQUEST") {
          console.log("Detected legacy confirmation request")
          return { type: "confirmation", data: parsed }
        }

        if (parsed.interaction_type) {
          console.log("Detected interaction type:", parsed.interaction_type)
          return {
            type: parsed.interaction_type,
            data: parsed,
          }
        }

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
          "AGENT_DASHBOARD_BUILDER",
          "AGENT_MASTER_DETAIL_TABLE",
          "AGENT_ALERT_MANAGER",
          "AGENT_TASK_ASSIGNMENT",
          "AGENT_COMMENT_THREAD",
          "AGENT_APPROVAL_WORKFLOW",
        ]

        if (interactionTypes.includes(parsed.type)) {
          return {
            type: parsed.type.replace("AGENT_", "").toLowerCase(),
            data: parsed,
          }
        }
      } catch (error) {
        console.log("Failed to parse JSON block:", error)
        continue
      }
    }

    try {
      const parsed = JSON.parse(content.trim())

      if (parsed.interaction_type === "confirmation_request") {
        console.log("Detected confirmation request")
        return { type: "confirmation", data: parsed }
      }

      if (parsed.type === "AGENT_CONFIRMATION_REQUEST") {
        console.log("Detected legacy confirmation request")
        return { type: "confirmation", data: parsed }
      }

      if (parsed.interaction_type) {
        console.log("Detected interaction type:", parsed.interaction_type)
        return {
          type: parsed.interaction_type,
          data: parsed,
        }
      }

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
        "AGENT_DASHBOARD_BUILDER",
        "AGENT_MASTER_DETAIL_TABLE",
        "AGENT_ALERT_MANAGER",
        "AGENT_TASK_ASSIGNMENT",
        "AGENT_COMMENT_THREAD",
        "AGENT_APPROVAL_WORKFLOW",
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
      data_table_review: { color: "bg-indigo-50 border-indigo-200", textColor: "text-indigo-700", icon: "📋" },
      dynamic_form: { color: "bg-pink-50 border-pink-200", textColor: "text-pink-700", icon: "📝" },
      update_form: { color: "bg-blue-50 border-blue-200", textColor: "text-blue-700", icon: "✏️" },
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
      dashboard_builder: { color: "bg-blue-50 border-blue-200", textColor: "text-blue-700", icon: "📊" },
      master_detail_table: { color: "bg-indigo-50 border-indigo-200", textColor: "text-indigo-700", icon: "📋" },
      alert_manager: { color: "bg-yellow-50 border-yellow-200", textColor: "text-yellow-700", icon: "🔔" },
      task_assignment: { color: "bg-green-50 border-green-200", textColor: "text-green-700", icon: "👥" },
      comment_thread: { color: "bg-purple-50 border-purple-200", textColor: "text-purple-700", icon: "💬" },
      report_builder: { color: "bg-orange-50 border-orange-200", textColor: "text-orange-700", icon: "📈" },
      data_visualization: { color: "bg-teal-50 border-teal-200", textColor: "text-teal-700", icon: "📊" },
      timeline_activity: { color: "bg-gray-50 border-gray-200", textColor: "text-gray-700", icon: "⏰" },
      kanban_board: { color: "bg-pink-50 border-pink-200", textColor: "text-pink-700", icon: "📌" },
      approval_workflow: { color: "bg-emerald-50 border-emerald-200", textColor: "text-emerald-700", icon: "✅" },
      wizard_flow: { color: "bg-purple-50 border-purple-200", textColor: "text-purple-700", icon: "🧙" },
    }
    return styles[type as keyof typeof styles] || styles.confirmation
  }

  const renderInlineInteraction = (type: string, data: any, messageId: string) => {
    const isDisabled = respondedInteractions.has(messageId)

    console.log("Rendering interaction:", type, "with data:", data)
    console.log("Is disabled:", isDisabled)

    const commonProps = {
      data,
      onResponse: (response: any) => handleInteractionResponse(response, messageId),
      compact: true,
      disabled: isDisabled,
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
      case "data_table_review":
        return <DataTableReviewHandler {...commonProps} />
      case "dynamic_form":
        return <DynamicFormHandler {...commonProps} />
      case "update_form":
        return <UpdateFormHandler {...commonProps} />
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
        console.log("Rendering SearchableSelectionHandler with props:", commonProps)
        return <SearchableSelectionHandler {...commonProps} />
      case "hierarchical_selection":
        return <HierarchicalSelectionHandler {...commonProps} />
      case "autocomplete_selection":
        return <AutocompleteSelectionHandler {...commonProps} />
      case "comparison_view":
        return <ComparisonViewHandler {...commonProps} />
      case "bulk_action_selector":
        return <BulkActionSelectorHandler {...commonProps} />
      case "dashboard_builder":
        return <DashboardBuilderHandler {...commonProps} />
      case "master_detail_table":
        return <MasterDetailTableHandler {...commonProps} />
      case "alert_manager":
        return <AlertManagerHandler {...commonProps} />
      case "task_assignment":
        return <TaskAssignmentHandler {...commonProps} />
      case "comment_thread":
        return <CommentThreadHandler {...commonProps} />
      case "approval_workflow":
        return <ApprovalWorkflowHandler {...commonProps} />
      case "wizard_flow":
        return <WizardFlowHandler {...commonProps} />
      case "report_builder":
        return <div className="p-4 text-center text-gray-500">Report Builder - Coming Soon</div>
      case "data_visualization":
        return <div className="p-4 text-center text-gray-500">Data Visualization - Coming Soon</div>
      case "timeline_activity":
        return <div className="p-4 text-center text-gray-500">Timeline Activity - Coming Soon</div>
      case "kanban_board":
        return <div className="p-4 text-center text-gray-500">Kanban Board - Coming Soon</div>
      default:
        console.log("Unknown interaction type:", type)
        return null
    }
  }

  const handleInteractionResponse = (response: any, messageId: string) => {
    setRespondedInteractions((prev) => new Set(prev).add(messageId))

    const responseText = typeof response === "string" ? response : JSON.stringify(response)
    onSend(responseText)
    onActivity?.()
  }

  const handleConfirmationResponse = (response: any) => {
    if (confirmationDialog?.confirmation_id) {
      setRespondedInteractions((prev) => new Set(prev).add(confirmationDialog.confirmation_id))
    }

    const responseText = typeof response === "string" ? response : JSON.stringify(response)
    onSend(responseText)
    onActivity?.()
    setConfirmationDialog(null)
  }

  const toggleVoiceMode = () => {
    if (!voiceChat.isSupported) {
      alert("Voice chat is not supported in your browser. Please use Chrome, Edge, or Safari.")
      return
    }

    const newVoiceMode = !isVoiceModeEnabled
    setIsVoiceModeEnabled(newVoiceMode)

    if (newVoiceMode) {
      voiceChat.startListening()
    } else {
      voiceChat.stopListening()
      voiceChat.stopSpeaking()
      voiceChat.clearTranscript()
    }

    onActivity?.()
  }

  const handleUserInterruption = () => {
    if (isVoiceModeEnabled && voiceChat.isSpeaking) {
      voiceChat.stopSpeaking()
    }
    onActivity?.()
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
        onMouseMove={handleUserInterruption}
        onClick={handleUserInterruption}
      >
        {messages.length === 0 ? (
          <div className="text-center h-full flex flex-col items-center justify-center text-gray-500">
            <Bot className="h-12 w-12 mb-3 text-blue-500" aria-hidden strokeWidth={2.2} />
            <p>{"How can I help you today?"}</p>
          </div>
        ) : (
          messages.map((m) => {
            const interactionData = m.role === "assistant" ? detectInteractionRequest(m.content) : null
            const isInteractionDisabled = respondedInteractions.has(m.id)

            if (interactionData) {
              const { type, data } = interactionData
              const style = getInteractionStyle(type)

              if (type === "confirmation") {
                return (
                  <div key={m.id} className="mb-8 flex justify-start">
                    <div
                      className={`max-w-[95%] ${style.color} border text-gray-800 rounded-2xl rounded-bl-none shadow-lg px-4 py-4 ${
                        isInteractionDisabled ? "opacity-60" : ""
                      }`}
                    >
                      <div className={`font-semibold text-xs mb-3 ${style.textColor} flex items-center gap-2`}>
                        {isInteractionDisabled ? (
                          <Check className="h-3 w-3 text-green-600" />
                        ) : (
                          <Clock className="h-3 w-3" />
                        )}
                        Assistant - {isInteractionDisabled ? "Response Sent" : "Awaiting Confirmation"}
                      </div>
                      <div className="space-y-3">
                        <p className="font-medium text-gray-900 text-sm">{data.description}</p>
                        {data.details && (
                          <p className="text-xs text-gray-600 bg-white/50 p-2 rounded-lg">{data.details}</p>
                        )}
                        {!isInteractionDisabled && (
                          <button
                            onClick={() => setConfirmationDialog(data)}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors"
                          >
                            Review & Respond
                          </button>
                        )}
                        {isInteractionDisabled && (
                          <div className="w-full bg-green-100 text-green-700 py-2 px-3 rounded-lg text-sm font-medium text-center">
                            ✓ Response Sent
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              }

              return (
                <div key={m.id} className="mb-8 flex justify-start">
                  <div
                    className={`max-w-[95%] ${style.color} border text-gray-800 rounded-2xl rounded-bl-none shadow-lg px-4 py-4 ${
                      isInteractionDisabled ? "opacity-60" : ""
                    }`}
                  >
                    <div className={`font-semibold text-xs mb-3 ${style.textColor} flex items-center gap-2`}>
                      <span>{style.icon}</span>
                      Assistant - {type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                      {isInteractionDisabled && (
                        <span className="ml-auto text-green-600 flex items-center gap-1">
                          <Check className="h-3 w-3" />
                          <span className="text-xs">Response Sent</span>
                        </span>
                      )}
                    </div>
                    <div className="space-y-3">
                      <div className="text-sm">{renderInlineInteraction(type, data, m.id)}</div>
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
      <form onSubmit={handleSubmit} className="border-t border-gray-200 p-3 bg-white">
        <div className="flex gap-2 items-end">
          <div className="flex-1 relative">
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
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder={
                isVoiceModeEnabled
                  ? voiceChat.isListening
                    ? "Listening... (speak now or type)"
                    : "Voice mode active (click mic or type)"
                  : "Type your message..."
              }
              className={`w-full text-gray-800 bg-gray-200/70 border border-gray-300 rounded-2xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none leading-6 max-h-[160px] ${
                isVoiceModeEnabled && voiceChat.isListening ? "ring-2 ring-green-400" : ""
              }`}
              disabled={isBusy}
              aria-label="Type your message"
            />

            {isVoiceModeEnabled && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {voiceChat.isListening && (
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-600 font-medium">Listening</span>
                  </div>
                )}
                {voiceChat.isSpeaking && (
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-blue-600 font-medium">Speaking</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {voiceChat.isSupported && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={toggleVoiceMode}
                className={`p-2 rounded-full transition-colors shrink-0 ${
                  isVoiceModeEnabled ? "bg-green-100 hover:bg-green-200" : "bg-gray-100 hover:bg-gray-200"
                }`}
                aria-label={isVoiceModeEnabled ? "Disable voice mode" : "Enable voice mode"}
                title={isVoiceModeEnabled ? "Disable voice mode" : "Enable voice mode"}
              >
                {isVoiceModeEnabled ? (
                  voiceChat.isListening ? (
                    <Mic className="h-4 w-4 text-green-600 animate-pulse" strokeWidth={2.2} />
                  ) : (
                    <MicOff className="h-4 w-4 text-gray-600" strokeWidth={2.2} />
                  )
                ) : (
                  <Mic className="h-4 w-4 text-gray-600" strokeWidth={2.2} />
                )}
              </button>

              {isVoiceModeEnabled && (
                <button
                  type="button"
                  onClick={() => {
                    if (voiceChat.isSpeaking) {
                      voiceChat.stopSpeaking()
                    } else if (messages.length > 0) {
                      const lastAssistantMessage = [...messages].reverse().find((m) => m.role === "assistant")
                      if (lastAssistantMessage && !detectInteractionRequest(lastAssistantMessage.content)) {
                        voiceChat.speak(lastAssistantMessage.content)
                      }
                    }
                    onActivity?.()
                  }}
                  className="p-2 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors shrink-0"
                  aria-label={voiceChat.isSpeaking ? "Stop speaking" : "Repeat last message"}
                  title={voiceChat.isSpeaking ? "Stop speaking" : "Repeat last message"}
                >
                  {voiceChat.isSpeaking ? (
                    <VolumeX className="h-4 w-4 text-red-600" strokeWidth={2.2} />
                  ) : (
                    <Volume2 className="h-4 w-4 text-blue-600" strokeWidth={2.2} />
                  )}
                </button>
              )}
            </div>
          )}

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

        {isVoiceModeEnabled && (
          <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <span>Voice mode active</span>
              {hasActiveInteraction && <span className="text-amber-600">• Interaction detected - voice paused</span>}
            </div>
            <div className="flex items-center gap-2">
              <span>Auto-send after 6s silence</span>
              <button
                type="button"
                onClick={() => {
                  voiceChat.clearTranscript()
                  setInput("")
                }}
                className="text-blue-600 hover:text-blue-700"
              >
                Clear
              </button>
            </div>
          </div>
        )}
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
