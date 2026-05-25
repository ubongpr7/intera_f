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
  Check,
  Mic,
  MicOff,
  Volume2,
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
  MarketplaceResultsHandler,
} from "@/components/advanced-interaction-handlers"
import { ConditionalFormHandler } from "../user-agents-interaction/conditional-form" 
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
import type { ChatMessage } from "@/redux/features/ka2a/ka2aSlice"
import {
  detectInteractionRequest,
  detectInteractionResponseSummary,
  type AgentWorkflowSummary,
} from "@/lib/agent-structured-output"
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
  lastUpdatedAt?: number
  activeAgentName?: string
  statusText?: string
  awaitingInput?: boolean
  showHeader?: boolean
  showWindowControls?: boolean
  inputPlaceholder?: string
  emptyTitle?: string
  emptyDescription?: string
  sendLabel?: string
  workflowSummary?: AgentWorkflowSummary | null
}

const asText = (value: unknown): string => (typeof value === "string" ? value : "")

const createLocalId = () => {
  const cryptoAny = globalThis.crypto as { randomUUID?: () => string } | undefined
  if (cryptoAny?.randomUUID) {
    return cryptoAny.randomUUID()
  }
  return `${new Date().toISOString()}-${Math.random().toString(16).slice(2)}`
}

const formatRelativeTime = (timestamp?: number) => {
  if (!timestamp) {
    return ""
  }
  const deltaMs = Math.max(Date.now() - timestamp, 0)
  const seconds = Math.floor(deltaMs / 1000)
  if (seconds < 45) {
    return "just now"
  }
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) {
    return `${minutes}m ago`
  }
  const hours = Math.floor(minutes / 60)
  if (hours < 24) {
    return `${hours}h ago`
  }
  return `${Math.floor(hours / 24)}d ago`
}

const humanizeTechnicalMessage = (content: string) => {
  const trimmed = content.trim()
  if (!trimmed) {
    return ""
  }

  if (/Timed out waiting for delegated response from ['"]?[^'"]+['"]? after [\d.]+s\./i.test(trimmed)) {
    return "A specialist did not respond in time. Retry, simplify the request, or continue with a more specific instruction."
  }

  if (/No downstream specialist agents are currently visible in the agent directory\./i.test(trimmed)) {
    return "No specialist agents are currently available for this request."
  }

  return content
}

const workflowToneStyles: Record<
  AgentWorkflowSummary["tone"],
  {
    card: string
    badge: string
    dot: string
    stepCompleted: string
    stepCurrent: string
    stepPending: string
  }
> = {
  ready: {
    card: "border-slate-200 bg-white",
    badge: "bg-slate-100 text-slate-700",
    dot: "bg-emerald-500",
    stepCompleted: "border-slate-200 bg-slate-100 text-slate-700",
    stepCurrent: "border-blue-200 bg-blue-50 text-blue-700",
    stepPending: "border-slate-200 bg-white text-slate-500",
  },
  working: {
    card: "border-slate-200 bg-white",
    badge: "bg-slate-100 text-slate-700",
    dot: "bg-blue-500",
    stepCompleted: "border-slate-200 bg-slate-100 text-slate-700",
    stepCurrent: "border-blue-200 bg-blue-50 text-blue-700",
    stepPending: "border-slate-200 bg-white text-slate-500",
  },
  awaiting: {
    card: "border-slate-200 bg-white",
    badge: "bg-slate-100 text-slate-700",
    dot: "bg-amber-500",
    stepCompleted: "border-slate-200 bg-slate-100 text-slate-700",
    stepCurrent: "border-amber-200 bg-amber-50 text-amber-700",
    stepPending: "border-slate-200 bg-white text-slate-500",
  },
}

function WorkflowSummaryStrip({ summary }: { summary: AgentWorkflowSummary }) {
  const tone = workflowToneStyles[summary.tone]

  const stepClass = (status: AgentWorkflowSummary["steps"][number]["status"]) => {
    if (status === "completed") {
      return tone.stepCompleted
    }
    if (status === "current") {
      return tone.stepCurrent
    }
    return tone.stepPending
  }

  return (
    <div className={`mb-4 rounded-[22px] border px-4 py-3 shadow-[0_12px_28px_-26px_rgba(15,23,42,0.18)] ${tone.card}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Workflow</p>
          <div className="mt-1 flex items-center gap-2">
            <span className={`inline-flex h-2.5 w-2.5 shrink-0 rounded-full ${tone.dot}`} />
            <p className="truncate text-sm font-semibold text-slate-900">{summary.title}</p>
          </div>
          {summary.detail ? <p className="mt-1 text-xs leading-5 text-slate-600">{summary.detail}</p> : null}
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${tone.badge}`}>
          {summary.statusLabel}
        </span>
      </div>
      {summary.currentAgentLabel || summary.nextAgentLabel ? (
        <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-600">
          {summary.currentAgentLabel ? (
            <p>
              <span className="font-medium text-slate-900">Now:</span> {summary.currentAgentLabel}
            </p>
          ) : null}
          {summary.nextAgentLabel ? (
            <p>
              <span className="font-medium text-slate-900">Next:</span> {summary.nextAgentLabel}
            </p>
          ) : null}
        </div>
      ) : null}
      {summary.steps.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {summary.steps.map((step, index) => (
            <span
              key={step.key}
              className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-medium ${stepClass(step.status)}`}
            >
              <span className="text-[10px] font-semibold opacity-70">{index + 1}</span>
              <span>{step.label}</span>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  )
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
  lastUpdatedAt,
  activeAgentName = "host",
  statusText,
  awaitingInput = false,
  showHeader = true,
  showWindowControls = true,
  inputPlaceholder,
  emptyTitle = "How can I help you today?",
  emptyDescription = "",
  sendLabel = "Send",
  workflowSummary = null,
}: AgentChatProps) {
  const [input, setInput] = useState("")
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
  const [confirmationDialog, setConfirmationDialog] = useState<any>(null)
  const [respondedInteractions, setRespondedInteractions] = useState<Set<string>>(new Set())
  const [isVoiceModeEnabled, setIsVoiceModeEnabled] = useState(false)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)

  const scrollRef = useRef<HTMLDivElement>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const prevLenRef = useRef<number>(0)
  const MAX_TEXTAREA_HEIGHT = 160

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
    const delta = Math.max(messages.length - prevLenRef.current, 0)
    if (isAtBottom) {
      endRef.current?.scrollIntoView({ behavior: "smooth" })
    } else if (delta > 0) {
      setUnreadCount((c) => c + delta)
    }
    prevLenRef.current = messages.length
  }, [isAtBottom, messages])

  const hasActiveInteraction = messages.some(
    (message) =>
      message.role === "assistant"
      && Boolean(detectInteractionRequest(message.content, message.structuredPayload))
      && !respondedInteractions.has(message.id),
  )

  const statusTone = useMemo(() => {
    if (awaitingInput) {
      return {
        label: "Awaiting your reply",
        chipClass: "bg-amber-100 text-amber-900",
        borderClass: "border-amber-200 bg-amber-50 text-amber-800",
      }
    }
    if (isBusy || pendingCount > 0) {
      return {
        label: "Working",
        chipClass: "bg-blue-100 text-blue-900",
        borderClass: "border-blue-200 bg-blue-50 text-blue-800",
      }
    }
    return {
      label: "Ready",
      chipClass: "bg-emerald-100 text-emerald-900",
      borderClass: "border-emerald-200 bg-emerald-50 text-emerald-800",
    }
  }, [awaitingInput, isBusy, pendingCount])

  const workflowDetail = workflowSummary?.detail?.trim() || ""

  const headerDetail = useMemo(() => {
    if (workflowDetail) {
      return workflowDetail
    }
    if (statusText?.trim()) {
      return humanizeTechnicalMessage(statusText.trim())
    }
    const relative = formatRelativeTime(lastUpdatedAt)
    return relative ? `Last update ${relative}` : "Ready for the next message."
  }, [lastUpdatedAt, statusText, workflowDetail])

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
      void err
    }
  }

  const handleExportMessage = (content: string) => {
    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `ai-message-${createLocalId()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
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
      marketplace_results: { color: "bg-amber-50 border-amber-200", textColor: "text-amber-700", icon: "🛍️" },
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
      conditional_form: { color: "bg-purple-50 border-purple-200", textColor: "text-purple-700", icon: "🧙" },
    }
    return styles[type as keyof typeof styles] || styles.confirmation
  }

  const renderInlineInteraction = (type: string, data: any, messageId: string) => {
    const isDisabled = respondedInteractions.has(messageId)
    const interactionKey = `${messageId}:${JSON.stringify(data?.current_values || {})}:${JSON.stringify(data?.fields || [])}:${JSON.stringify(data?.existing_responses || {})}:${data?.current_step ?? ""}`

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
        return <DynamicFormHandler key={interactionKey} {...commonProps} />
      case "update_form":
        return <UpdateFormHandler key={interactionKey} {...commonProps} />
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
      case "marketplace_results":
        return <MarketplaceResultsHandler {...commonProps} />
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
        return <WizardFlowHandler key={interactionKey} {...commonProps} />
      case "conditional_form":
        return <ConditionalFormHandler {...commonProps} />
      case "report_builder":
        return <div className="p-4 text-center text-gray-500">Report Builder - Coming Soon</div>
      case "data_visualization":
        return <div className="p-4 text-center text-gray-500">Data Visualization - Coming Soon</div>
      case "timeline_activity":
        return <div className="p-4 text-center text-gray-500">Timeline Activity - Coming Soon</div>
      case "kanban_board":
        return <div className="p-4 text-center text-gray-500">Kanban Board - Coming Soon</div>
      default:
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

  const speakMessage = (content: string, _messageId: string) => {
    voiceChat.speak(content)
    onActivity?.()
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {showHeader && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4 flex items-center justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <Bot className="h-5 w-5 text-white shrink-0" aria-hidden strokeWidth={2.2} />
              <span className="truncate text-sm font-semibold uppercase tracking-[0.22em] text-blue-100">
                {activeAgentName}
              </span>
              <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${statusTone.chipClass}`}>
                {statusTone.label}
              </span>
            </div>
            <p className="mt-2 max-w-[28rem] truncate text-sm text-blue-50/90">{headerDetail}</p>
          </div>

          {showWindowControls ? (
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
          ) : null}
        </div>
      )}

      {/* Messages area */}
      <div
        ref={scrollRef}
        className="relative min-h-0 flex-1 overflow-y-auto bg-gray-50 p-4 custom-scrollbar"
        onMouseMove={handleUserInterruption}
        onClick={handleUserInterruption}
      >
        {workflowSummary ? <WorkflowSummaryStrip summary={workflowSummary} /> : null}
        {statusText && statusText.trim() !== workflowSummary?.detail?.trim() && (
          <div className={`mb-4 rounded-2xl border px-4 py-3 text-sm ${
            statusTone.borderClass
          }`}>
            <div className="flex items-center gap-2 font-medium">
              <Bot className="h-4 w-4" />
              <span>{activeAgentName}</span>
            </div>
            <p className="mt-1">{humanizeTechnicalMessage(statusText)}</p>
          </div>
        )}
        {messages.length === 0 ? (
          <div className="text-center h-full flex flex-col items-center justify-center text-gray-500">
            <Bot className="h-12 w-12 mb-3 text-blue-500" aria-hidden strokeWidth={2.2} />
            <p className="text-base font-medium text-slate-700">{emptyTitle}</p>
            {emptyDescription ? <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">{emptyDescription}</p> : null}
          </div>
        ) : (
          messages.map((m) => {
            const interactionData =
              m.role === "assistant" ? detectInteractionRequest(m.content, m.structuredPayload) : null
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
                        <p className="font-medium text-gray-900 text-sm">
                          {asText(data.description) || asText(data.title) || "Please review this request."}
                        </p>
                        {asText(data.details) && (
                          <p className="text-xs text-gray-600 bg-white/50 p-2 rounded-lg">{asText(data.details)}</p>
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
                      Assistant - {type.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}
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

            const interactionResponseSummary =
              m.role === "user" ? detectInteractionResponseSummary(m.content) : null
            const displayContent = m.role === "assistant" ? humanizeTechnicalMessage(m.content) : m.content

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
                    className={`font-semibold text-xs mb-3 flex items-center justify-between ${m.role === "user" ? "text-blue-100" : "text-gray-500"}`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{m.role === "user" ? "You" : "Assistant"}</span>
                      {copiedMessageId === m.id && (
                        <span className="inline-flex items-center gap-1 text-green-600">
                          <Check className="h-3 w-3" />
                          <span className="text-xs">Copied!</span>
                        </span>
                      )}
                    </div>

                    {m.role === "assistant" && voiceChat.isSupported && (
                      <button
                        onClick={() => speakMessage(m.content, m.id)}
                        className="p-1 rounded-full hover:bg-gray-100 transition-colors shrink-0"
                        aria-label="Listen to this message"
                        title="Listen to this message"
                      >
                        <Volume2 className="h-3 w-3 text-gray-500 hover:text-blue-600" strokeWidth={2.2} />
                      </button>
                    )}
                  </div>
                  {interactionResponseSummary ? (
                    <div className="space-y-1">
                      <p className="text-base font-semibold">{interactionResponseSummary.title}</p>
                      {interactionResponseSummary.detail ? (
                        <p className={`text-sm leading-6 ${m.role === "user" ? "text-blue-50" : "text-slate-600"}`}>
                          {interactionResponseSummary.detail}
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <MessageContent
                      content={displayContent}
                      role={m.role}
                      onCopy={() => handleCopyMessage(m.id, m.content)}
                      onExport={() => handleExportMessage(m.content)}
                    />
                  )}
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
      <form onSubmit={handleSubmit} className="shrink-0 border-t border-gray-200 bg-white p-3">
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
                inputPlaceholder ||
                isVoiceModeEnabled
                  ? voiceChat.isListening
                    ? "Listening... (speak now or type)"
                    : "Voice mode active (click mic or type)"
                  : awaitingInput
                    ? "Provide the requested answer, approval, or follow-up..."
                    : "Type your message..."
              }
              className={`w-full  text-gray-800 bg-gray-200/70 border border-gray-300 rounded-2xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none leading-6 max-h-[160px] ${
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
                    <Mic className="h-5 w-5 text-green-600 animate-pulse" strokeWidth={2.2} />
                  ) : (
                    <MicOff className="h-5 w-5 text-gray-600" strokeWidth={2.2} />
                  )
                ) : (
                  <Mic className="h-5 w-5 text-gray-600" strokeWidth={2.2} />
                )}
              </button>
            </div>
          )}

          <button
            type="submit"
            className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50"
            disabled={isBusy || !input.trim()}
            aria-label="Send message"
            title={sendLabel}
            onClick={onActivity}
          >
            <Send className="h-5 w-5 text-white" strokeWidth={2.2} />
          </button>
        </div>

        <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
          <span>
            {awaitingInput ? "The active agent is waiting for your reply to continue this task." : "Enter sends. Shift+Enter adds a new line."}
          </span>
          <span className="font-medium text-slate-600">{sendLabel}</span>
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
    </div>
  )
}
