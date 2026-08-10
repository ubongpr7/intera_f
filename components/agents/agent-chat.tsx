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
  PhoneCall,
  PhoneOff,
  Download,
  RotateCcw,
  AudioLines,
  AlertTriangle,
  BadgeCheck,
  CalendarDays,
  ChartNoAxesCombined,
  CircleHelp,
  ClipboardList,
  Code2,
  FilePenLine,
  FolderUp,
  GitFork,
  Hourglass,
  Image,
  LayoutDashboard,
  MessageCircle,
  PanelTop,
  Pencil,
  Scale,
  Search,
  SlidersHorizontal,
  Store,
  Table2,
  Users,
  WandSparkles,
  Zap,
} from "lucide-react"
import { getCookie } from "cookies-next"
import { toast } from "react-toastify"
import MessageContent from "@/components/message-content"
import ConfirmationDialog from "@/components/confirmation-dialog"
import InsightWidgetRenderer from "@/components/agents/insight-widget-renderer"
import { humanizeAgentDisplayName } from "@/lib/agent-display"
import { hasTokenPermission } from "@/lib/agentPermissions"
import {
  buildChatPdfBlob,
  buildChatCsv,
  buildInsightCsv,
  buildInsightExportFilename,
  buildInsightPdfBlob,
  downloadTextFile,
  type ExportStructuredPayload,
} from "@/lib/agent-export"
import { readCookieValue } from "@/lib/authCookies"
import { DEFAULT_BRAND_AVATAR_SRC, resolveBrandAssetUrl } from "@/lib/brandAssets"
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
import type { ChatMessage, Ka2aEvent } from "@/redux/features/ka2a/ka2aSlice"
import {
  detectInsightResponse,
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
  onDownloadConversation?: () => void
  onClearConversation?: () => void
  onSyncedVoiceTurnStart?: (text: string, turnId: string) => void
  onSyncedVoiceA2aEvent?: (event: Ka2aEvent, turnId?: string) => void
  onSyncedVoiceAssistantResult?: (text: string, turnId?: string) => void
  onSyncedVoiceTurnEnd?: (turnId?: string) => void
}

type ExportDownloadState = {
  source?: "conversation" | "insight"
  title: string
  filename?: string
  href?: string
  kind: "csv" | "pdf" | "json"
  status: "choosing" | "preparing" | "ready"
  description: string
  payload?: ExportStructuredPayload
}

const asText = (value: unknown): string => (typeof value === "string" ? value : "")
const asString = (value: unknown): string => (typeof value === "string" ? value : "")
const asRecord = (value: unknown): Record<string, unknown> | undefined => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined
  }
  return value as Record<string, unknown>
}
const yieldToBrowser = () => new Promise((resolve) => setTimeout(resolve, 0))
const APP_ASSISTANT_AVATAR = DEFAULT_BRAND_AVATAR_SRC

const buildAbsoluteAssetUrl = (value?: string | null) => {
  if (!value) return undefined
  if (/^(https?:)?\/\//i.test(value) || value.startsWith("data:") || value.startsWith("blob:")) {
    return value
  }
  if (value.startsWith("/")) {
    return value
  }
  const base = (process.env.NEXT_PUBLIC_BACKEND_HOST_URL ?? "").replace(/\/+$/, "")
  return base ? `${base}/${value}` : `/${value}`
}

const resolveUserIdentity = () => {
  const firstName = readCookieValue("userFirstName", (name) => getCookie(name)) || ""
  const lastName = readCookieValue("userLastName", (name) => getCookie(name)) || ""
  const email = readCookieValue("userEmail", (name) => getCookie(name)) || ""
  const picture =
    readCookieValue("userPicture", (name) => getCookie(name)) ||
    (typeof window !== "undefined"
      ? window.localStorage.getItem("userPicture") ||
        window.localStorage.getItem("profile_image") ||
        window.localStorage.getItem("profileImage")
      : "")
  const initials =
    [firstName, lastName]
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.trim().charAt(0).toUpperCase())
      .join("") || email.trim().charAt(0).toUpperCase() || "U"

  return {
    initials,
    imageUrl: resolveBrandAssetUrl(buildAbsoluteAssetUrl(picture)),
    email,
  }
}

function ChatAvatar({
  role,
  userInitials,
  userImageUrl,
  className = "",
}: {
  role: "user" | "assistant"
  userInitials: string
  userImageUrl?: string
  className?: string
}) {
  const isAssistant = role === "assistant"
  const imageUrl = isAssistant ? APP_ASSISTANT_AVATAR : userImageUrl || DEFAULT_BRAND_AVATAR_SRC

  return (
    <div
      className={`flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border shadow-sm ${
        isAssistant ? "border-blue-100 bg-white" : "border-blue-200 bg-blue-600 text-gray-50"
      } ${className}`}
      aria-label={isAssistant ? "Intera AI" : "User"}
      title={isAssistant ? "Intera AI" : "User"}
    >
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt={isAssistant ? "Intera AI" : "User avatar"} className="h-full w-full object-cover" />
      ) : (
        <span className="text-xs font-semibold">{userInitials}</span>
      )}
    </div>
  )
}

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

const formatMessageTimestamp = (value?: string | number) => {
  if (value === undefined || value === null || value === "") {
    return ""
  }
  const date = typeof value === "number" ? new Date(value) : new Date(String(value))
  if (Number.isNaN(date.getTime())) {
    return ""
  }
  const sameDay = new Date().toDateString() === date.toDateString()
  return sameDay
    ? date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    : date.toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
}

const humanizeTechnicalMessage = (content: string) => {
  const trimmed = content
    .trim()
    .replace(/\bwa-p\d+-[a-z0-9_]+-[0-9a-f]{8,}\b/gi, (match) => humanizeAgentDisplayName(match))
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
    card: "border-gray-200 bg-gray-100",
    badge: "bg-gray-200 text-gray-900",
    dot: "bg-emerald-500",
    stepCompleted: "border-gray-200 bg-gray-200 text-gray-900",
    stepCurrent: "border-blue-200 bg-blue-100 text-gray-900",
    stepPending: "border-gray-200 bg-white text-gray-700",
  },
  working: {
    card: "border-gray-200 bg-gray-100",
    badge: "bg-gray-200 text-gray-900",
    dot: "bg-blue-500",
    stepCompleted: "border-gray-200 bg-gray-200 text-gray-900",
    stepCurrent: "border-blue-200 bg-blue-100 text-gray-900",
    stepPending: "border-gray-200 bg-white text-gray-700",
  },
  awaiting: {
    card: "border-gray-200 bg-gray-100",
    badge: "bg-gray-200 text-gray-900",
    dot: "bg-yellow-500",
    stepCompleted: "border-gray-200 bg-gray-200 text-gray-900",
    stepCurrent: "border-yellow-200 bg-yellow-100 text-gray-900",
    stepPending: "border-gray-200 bg-white text-gray-700",
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
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-600">Workflow</p>
          <div className="mt-1 flex items-center gap-2">
            <span className={`inline-flex h-2.5 w-2.5 shrink-0 rounded-full ${tone.dot}`} />
            <p className="truncate text-sm font-semibold text-gray-700">{summary.title}</p>
          </div>
          {summary.detail ? <p className="mt-1 text-xs leading-5 text-gray-600">{summary.detail}</p> : null}
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${tone.badge}`}>
          {summary.statusLabel}
        </span>
      </div>
      {summary.currentAgentLabel || summary.nextAgentLabel ? (
        <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-600">
          {summary.currentAgentLabel ? (
            <p>
              <span className="font-medium text-gray-700">Now:</span> {summary.currentAgentLabel}
            </p>
          ) : null}
          {summary.nextAgentLabel ? (
            <p>
              <span className="font-medium text-gray-700">Next:</span> {summary.nextAgentLabel}
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
  onDownloadConversation,
  onClearConversation,
  onSyncedVoiceTurnStart,
  onSyncedVoiceA2aEvent,
  onSyncedVoiceAssistantResult,
  onSyncedVoiceTurnEnd,
}: AgentChatProps) {
  const [input, setInput] = useState("")
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
  const [confirmationDialog, setConfirmationDialog] = useState<any>(null)
  const [respondedInteractions, setRespondedInteractions] = useState<Set<string>>(new Set())
  const [isCallModeActive, setIsCallModeActive] = useState(false)
  const [isCallTransitioning, setIsCallTransitioning] = useState(false)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const [exportDownload, setExportDownload] = useState<ExportDownloadState | null>(null)

  const scrollRef = useRef<HTMLDivElement>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const voiceTranscriptScrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const prevLenRef = useRef<number>(0)
  const exportUrlRef = useRef<string | null>(null)
  const lastSpokenAssistantIdRef = useRef<string | null>(null)
  const resumeListeningAfterSpeechRef = useRef(false)
  const previousAutoSubmitRef = useRef(false)
  const callModeTransitionRef = useRef(false)
  const autoExpandedForCallRef = useRef(false)
  const MAX_TEXTAREA_HEIGHT = 160

  const clearExportDownload = () => {
    if (exportUrlRef.current) {
      URL.revokeObjectURL(exportUrlRef.current)
      exportUrlRef.current = null
    }
    setExportDownload(null)
  }

  const showExportDownload = (state: ExportDownloadState) => {
    if (exportUrlRef.current) {
      URL.revokeObjectURL(exportUrlRef.current)
      exportUrlRef.current = null
    }
    exportUrlRef.current = state.href ?? null
    setExportDownload(state)
  }

  const triggerExportDownload = (href: string, filename: string) => {
    const anchor = document.createElement("a")
    anchor.href = href
    anchor.download = filename
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
  }

  const userIdentity = useMemo(() => resolveUserIdentity(), [])
  const workspaceName = useMemo(
    () =>
      readCookieValue("companyName", (name) => getCookie(name)) ||
      readCookieValue("profile", (name) => getCookie(name)) ||
      "",
    [],
  )
  const profileId = useMemo(() => readCookieValue("profileId", (name) => getCookie(name)) || "", [])
  const accessToken = useMemo(() => readCookieValue("accessToken", (name) => getCookie(name)) || "", [])
  const voiceAccessAllowed = hasTokenPermission("oral_conversation_with_ai")

  const voiceChat = useVoiceChat({
    onTranscript: (text: string) => {
      if (!isCallModeActive) {
        setInput(text)
        onActivity?.()
        return
      }
      onActivity?.()
    },
    onAutoSend: (text: string) => {
      if (isCallModeActive) {
        onActivity?.()
        return
      }
      if (text.trim()) {
        onSend(text)
        onActivity?.()
        setInput("")
        if (textareaRef.current) textareaRef.current.style.height = "auto"
        requestAnimationFrame(scrollToBottom)
      }
    },
    autoSendDelay: isCallModeActive ? 3500 : 6000,
    livekitEnabled: voiceAccessAllowed,
    livekitParticipantName: userIdentity.email || `Intera voice user ${userIdentity.initials}`,
    livekitAgentName: process.env.NEXT_PUBLIC_LIVEKIT_VOICE_AGENT_NAME?.trim() || "ka2a-voice",
    livekitMetadata: {
      profileId,
      accessToken,
      userEmail: userIdentity.email,
      workspaceName,
      participantName: userIdentity.email || `Intera voice user ${userIdentity.initials}`,
    },
    onSyncedVoiceTurnStart,
    onSyncedVoiceA2aEvent: (event, turnId) => {
      if (!event || typeof event !== "object" || Array.isArray(event)) {
        return
      }
      const record = event as Record<string, unknown>
      if (typeof record.kind !== "string") {
        return
      }
      onSyncedVoiceA2aEvent?.(record as Ka2aEvent, turnId)
    },
    onSyncedVoiceAssistantResult,
    onSyncedVoiceTurnEnd,
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

  useEffect(
    () => () => {
      if (exportUrlRef.current) {
        URL.revokeObjectURL(exportUrlRef.current)
        exportUrlRef.current = null
      }
    },
    [],
  )

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
        chipClass: "bg-yellow-100 text-yellow-900",
        borderClass: "border-yellow-200 bg-yellow-50 text-yellow-800",
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

  const voiceCallStatus = useMemo(() => {
    if (!isCallModeActive) {
      return "Idle"
    }
    if (isCallTransitioning) {
      return voiceChat.isConnected ? "Stopping" : "Starting"
    }
    if (voiceChat.isConnecting) {
      return "Connecting"
    }
    if (voiceChat.isListening) {
      return "Listening"
    }
    if (voiceChat.isConnected) {
      return "Connected"
    }
    return "Preparing"
  }, [
    isCallModeActive,
    isCallTransitioning,
    voiceChat.isConnected,
    voiceChat.isConnecting,
    voiceChat.isListening,
  ])

  const voiceConversationEntries = useMemo(() => voiceChat.conversationEntries, [voiceChat.conversationEntries])
  const voiceLiveTranscript = useMemo(() => {
    return (voiceChat.transcript || voiceChat.finalTranscript || "").trim()
  }, [voiceChat.finalTranscript, voiceChat.transcript])
  const widgetBridgeRef = useRef<{
    active: boolean
    lastStatusText: string
    lastAssistantMessageId: string
  }>({
    active: false,
    lastStatusText: "",
    lastAssistantMessageId: "",
  })

  useEffect(() => {
    if (!isCallModeActive) {
      return
    }
    const container = voiceTranscriptScrollRef.current
    if (!container) {
      return
    }
    requestAnimationFrame(() => {
      container.scrollTop = container.scrollHeight
    })
  }, [isCallModeActive, voiceConversationEntries, voiceLiveTranscript])

  useEffect(() => {
    if (!isCallModeActive) {
      widgetBridgeRef.current = {
        active: false,
        lastStatusText: "",
        lastAssistantMessageId: "",
      }
      return
    }

    const bridge = widgetBridgeRef.current
    if (!bridge.active) {
      return
    }

    const normalizedStatus = humanizeTechnicalMessage(statusText?.trim() || "")
    if (normalizedStatus && normalizedStatus !== bridge.lastStatusText) {
      voiceChat.appendLocalConversationEntry("assistant", normalizedStatus)
      bridge.lastStatusText = normalizedStatus
    }

    const latestAssistantMessage = [...messages].reverse().find((message) => message.role === "assistant")
    if (latestAssistantMessage && latestAssistantMessage.id !== bridge.lastAssistantMessageId) {
      const interactionData = detectInteractionRequest(
        latestAssistantMessage.content,
        latestAssistantMessage.structuredPayload,
      )
      if (interactionData) {
        const prompt =
          asString(interactionData.data?.title)
          || asString(interactionData.data?.question)
          || asString(interactionData.data?.description)
          || interactionData.type.replace(/_/g, " ")
        if (prompt) {
          voiceChat.appendLocalConversationEntry("assistant", prompt)
        }
      } else {
        const summarized = humanizeTechnicalMessage(latestAssistantMessage.content)
        if (summarized) {
          voiceChat.appendLocalConversationEntry("assistant", summarized)
        }
      }
      bridge.lastAssistantMessageId = latestAssistantMessage.id
    }

    if (!isBusy && pendingCount === 0 && !awaitingInput) {
      bridge.active = false
      bridge.lastStatusText = ""
      bridge.lastAssistantMessageId = latestAssistantMessage?.id || bridge.lastAssistantMessageId
    }
  }, [awaitingInput, isBusy, isCallModeActive, messages, pendingCount, statusText, voiceChat])

  function scrollToBottom() {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
    setUnreadCount(0)
  }

  const activateVoiceWidgetBridge = () => {
    widgetBridgeRef.current = {
      active: true,
      lastStatusText: "",
      lastAssistantMessageId: "",
    }
  }

  const acknowledgeVoiceLinkedSubmission = (responseText: string, fallbackTitle: string) => {
    if (!isCallModeActive) {
      return
    }
    const summary = detectInteractionResponseSummary(responseText)
    voiceChat.appendLocalConversationEntry(
      "user",
      summary?.detail ? `${summary.title}. ${summary.detail}` : summary?.title || fallbackTitle,
    )
    voiceChat.appendLocalConversationEntry(
      "assistant",
      "Thanks. I’ve sent that through the workspace chat and I’ll keep tracking the progress here.",
    )
    activateVoiceWidgetBridge()
  }

  function restorePrimaryChatScrollAfterCallMode() {
    const syncToBottom = () => {
      const container = scrollRef.current
      if (container) {
        container.scrollTop = container.scrollHeight
      }
      endRef.current?.scrollIntoView({ behavior: "auto", block: "end" })
      setUnreadCount(0)
      setIsAtBottom(true)
    }

    requestAnimationFrame(() => {
      syncToBottom()
      requestAnimationFrame(syncToBottom)
    })
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

    const submittedText = input.trim()
    acknowledgeVoiceLinkedSubmission(submittedText, submittedText)
    onSend(input)
    onActivity?.()
    setInput("")
    if (textareaRef.current) textareaRef.current.style.height = "auto"
    requestAnimationFrame(() => textareaRef.current?.focus())
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
    downloadTextFile(content, `ai-message-${createLocalId()}.txt`)
  }

  const latestInsightMessage = useMemo(
    () =>
      [...messages]
        .reverse()
        .find((message) => message.role === "assistant" && Boolean(detectInsightResponse(message.content, message.structuredPayload))),
    [messages],
  )

  const resolveInsightExportTitle = (payload?: ExportStructuredPayload) => {
    if (!payload) {
      return "AI Insight"
    }
    const widget = Array.isArray(payload.widgets) ? asRecord(payload.widgets[0]) : undefined
    return asString(payload.summary) || asString(payload.title) || asString(widget?.title) || "AI Insight"
  }

  const resolveInsightPayload = (message: ChatMessage) =>
    detectInsightResponse(message.content, message.structuredPayload)?.data as ExportStructuredPayload | undefined

  const openInsightExportChooser = (payload?: ExportStructuredPayload) => {
    if (!payload) {
      toast.error("This response does not include structured insight data.")
      return
    }
    showExportDownload({
      source: "insight",
      title: resolveInsightExportTitle(payload),
      kind: "pdf",
      status: "choosing",
      description: "Choose a download format for this insight.",
      payload,
    })
  }

  const openConversationExportChooser = () => {
    showExportDownload({
      source: "conversation",
      title: "Intera AI Chat Export",
      kind: "pdf",
      status: "choosing",
      description: "Choose a download format for this conversation. JSON exports the full chat transcript.",
    })
  }

  const handleExportInsightCsvPayload = (payload?: ExportStructuredPayload) => {
    if (!payload) {
      toast.error("This response does not include structured insight data.")
      return
    }
    try {
      const title = resolveInsightExportTitle(payload)
      const filename = `${buildInsightExportFilename(title, "data")}.csv`
      const blob = new Blob([buildInsightCsv(payload)], { type: "text/csv;charset=utf-8" })
      const href = URL.createObjectURL(blob)
      showExportDownload({
        source: "insight",
        title,
        filename,
        href,
        kind: "csv",
        status: "ready",
        description: "Your CSV download has started.",
        payload,
      })
      triggerExportDownload(href, filename)
      toast.success("Insight CSV download started.")
    } catch (error) {
      void error
      toast.error("Unable to export insight CSV.")
    }
  }

  const handleExportInsightCsv = (message: ChatMessage) => {
    handleExportInsightCsvPayload(resolveInsightPayload(message))
  }

  const handleExportInsightJsonPayload = (payload?: ExportStructuredPayload) => {
    if (!payload) {
      toast.error("This response does not include structured insight data.")
      return
    }
    try {
      const title = resolveInsightExportTitle(payload)
      const filename = `${buildInsightExportFilename(title, "data")}.json`
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" })
      const href = URL.createObjectURL(blob)
      showExportDownload({
        source: "insight",
        title,
        filename,
        href,
        kind: "json",
        status: "ready",
        description: "Your JSON download has started.",
        payload,
      })
      triggerExportDownload(href, filename)
      toast.success("Insight JSON download started.")
    } catch (error) {
      void error
      toast.error("Unable to export insight JSON.")
    }
  }

  const handleExportInsightPdfPayload = async (payload?: ExportStructuredPayload) => {
    if (!payload) {
      toast.error("This response does not include structured insight data.")
      return
    }
    const title = resolveInsightExportTitle(payload)
    const filename = `${buildInsightExportFilename(title, "report")}.pdf`
    showExportDownload({
      source: "insight",
      title,
      filename,
      kind: "pdf",
      status: "preparing",
      description: "Preparing your insight PDF report...",
      payload,
    })
    try {
      await yieldToBrowser()
      const blob = await buildInsightPdfBlob(payload, title)
      const href = URL.createObjectURL(blob)
      showExportDownload({
        source: "insight",
        title,
        filename,
        href,
        kind: "pdf",
        status: "ready",
        description: "Your PDF download has started.",
        payload,
      })
      triggerExportDownload(href, filename)
      toast.success("Insight PDF download started.")
    } catch (error) {
      void error
      toast.error("Unable to export insight PDF.")
    }
  }

  const handleExportInsightPdf = async (message: ChatMessage) => {
    await handleExportInsightPdfPayload(resolveInsightPayload(message))
  }

  const handleExportChatPdf = async () => {
    const title = "Intera AI Chat Export"
    const filename = "intera-ai-chat-export.pdf"
    showExportDownload({
      source: "conversation",
      title,
      filename,
      kind: "pdf",
      status: "preparing",
      description: "Preparing your chat PDF export...",
    })
    try {
      await yieldToBrowser()
      const blob = await buildChatPdfBlob(messages, title)
      const href = URL.createObjectURL(blob)
      showExportDownload({
        source: "conversation",
        title,
        filename,
        href,
        kind: "pdf",
        status: "ready",
        description: "Your chat PDF download has started.",
      })
      triggerExportDownload(href, filename)
      toast.success("Chat PDF download started.")
    } catch (error) {
      void error
      toast.error("Unable to export chat PDF.")
    }
  }

  const handleExportChatCsv = async () => {
    const filename = "intera-ai-chat-export.csv"
    try {
      showExportDownload({
        source: "conversation",
        title: "Intera AI Chat Export",
        filename,
        kind: "csv",
        status: "preparing",
        description: "Preparing your chat CSV export...",
      })
      await yieldToBrowser()
      const csv = buildChatCsv(messages)
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
      const href = URL.createObjectURL(blob)
      showExportDownload({
        source: "conversation",
        title: "Intera AI Chat Export",
        filename,
        href,
        kind: "csv",
        status: "ready",
        description: "Your chat CSV download has started.",
      })
      triggerExportDownload(href, filename)
      toast.success("Chat CSV download started.")
    } catch (error) {
      void error
      toast.error("Unable to export chat CSV.")
    }
  }

  const handleExportChatJson = async () => {
    const filename = "intera-ai-chat-export.json"
    try {
      showExportDownload({
        source: "conversation",
        title: "Intera AI Chat Export",
        filename,
        kind: "json",
        status: "preparing",
        description: "Preparing your chat JSON export...",
      })
      await yieldToBrowser()
      const payload = {
        exportedAt: new Date().toISOString(),
        title: "Intera AI Chat Export",
        messages,
      }
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" })
      const href = URL.createObjectURL(blob)
      showExportDownload({
        source: "conversation",
        title: "Intera AI Chat Export",
        filename,
        href,
        kind: "json",
        status: "ready",
        description: "Your chat JSON download has started.",
      })
      triggerExportDownload(href, filename)
      toast.success("Chat JSON download started.")
    } catch (error) {
      void error
      toast.error("Unable to export chat JSON.")
    }
  }

  const getInteractionStyle = (type: string) => {
    const styles = {
      confirmation: { color: "bg-yellow-50 border-yellow-200", textColor: "text-gray-900", icon: AlertTriangle },
      multiple_choice: { color: "bg-blue-50 border-blue-200", textColor: "text-gray-900", icon: CircleHelp },
      file_upload: { color: "bg-green-50 border-green-200", textColor: "text-gray-900", icon: FolderUp },
      progress_tracker: { color: "bg-purple-50 border-purple-200", textColor: "text-gray-900", icon: Hourglass },
      data_table: { color: "bg-indigo-50 border-indigo-200", textColor: "text-gray-900", icon: Table2 },
      data_table_review: { color: "bg-indigo-50 border-indigo-200", textColor: "text-gray-900", icon: ClipboardList },
      dynamic_form: { color: "bg-pink-50 border-pink-200", textColor: "text-gray-900", icon: FilePenLine },
      update_form: { color: "bg-blue-50 border-blue-200", textColor: "text-gray-900", icon: Pencil },
      date_time_picker: { color: "bg-teal-50 border-teal-200", textColor: "text-gray-900", icon: CalendarDays },
      slider_input: { color: "bg-orange-50 border-orange-200", textColor: "text-gray-900", icon: SlidersHorizontal },
      priority_ranking: { color: "bg-red-50 border-red-200", textColor: "text-gray-900", icon: ClipboardList },
      code_review: { color: "bg-gray-50 border-gray-200", textColor: "text-gray-900", icon: Code2 },
      image_annotation: { color: "bg-yellow-50 border-yellow-200", textColor: "text-gray-900", icon: Image },
      searchable_selection: { color: "bg-cyan-50 border-cyan-200", textColor: "text-gray-900", icon: Search },
      hierarchical_selection: { color: "bg-emerald-50 border-emerald-200", textColor: "text-gray-900", icon: GitFork },
      autocomplete_selection: { color: "bg-violet-50 border-violet-200", textColor: "text-gray-900", icon: Zap },
      comparison_view: { color: "bg-rose-50 border-rose-200", textColor: "text-gray-900", icon: Scale },
      bulk_action_selector: { color: "bg-gray-50 border-gray-200", textColor: "text-gray-900", icon: Zap },
      marketplace_results: { color: "bg-yellow-50 border-yellow-200", textColor: "text-gray-900", icon: Store },
      dashboard_builder: { color: "bg-blue-50 border-blue-200", textColor: "text-gray-900", icon: LayoutDashboard },
      master_detail_table: { color: "bg-indigo-50 border-indigo-200", textColor: "text-gray-900", icon: PanelTop },
      alert_manager: { color: "bg-yellow-50 border-yellow-200", textColor: "text-gray-900", icon: AlertTriangle },
      task_assignment: { color: "bg-green-50 border-green-200", textColor: "text-gray-900", icon: Users },
      comment_thread: { color: "bg-purple-50 border-purple-200", textColor: "text-gray-900", icon: MessageCircle },
      report_builder: { color: "bg-orange-50 border-orange-200", textColor: "text-gray-900", icon: ChartNoAxesCombined },
      data_visualization: { color: "bg-teal-50 border-teal-200", textColor: "text-gray-900", icon: ChartNoAxesCombined },
      timeline_activity: { color: "bg-gray-50 border-gray-200", textColor: "text-gray-900", icon: Clock },
      kanban_board: { color: "bg-pink-50 border-pink-200", textColor: "text-gray-900", icon: PanelTop },
      approval_workflow: { color: "bg-emerald-50 border-emerald-200", textColor: "text-gray-900", icon: BadgeCheck },
      wizard_flow: { color: "bg-purple-50 border-purple-200", textColor: "text-gray-900", icon: WandSparkles },
      conditional_form: { color: "bg-purple-50 border-purple-200", textColor: "text-gray-900", icon: WandSparkles },
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
        return <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-center text-sm text-gray-600">Report builder interaction is not available in this workspace yet.</div>
      case "data_visualization":
        return <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-center text-sm text-gray-600">Data visualization interaction is not available in this workspace yet.</div>
      case "timeline_activity":
        return <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-center text-sm text-gray-600">Timeline activity interaction is not available in this workspace yet.</div>
      case "kanban_board":
        return <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-center text-sm text-gray-600">Kanban board interaction is not available in this workspace yet.</div>
      default:
        return null
    }
  }

  const handleInteractionResponse = (response: any, messageId: string) => {
    setRespondedInteractions((prev) => new Set(prev).add(messageId))

    const responseText = typeof response === "string" ? response : JSON.stringify(response)
    acknowledgeVoiceLinkedSubmission(responseText, "I submitted that selection.")
    onSend(responseText)
    onActivity?.()
  }

  const handleConfirmationResponse = (response: any) => {
    if (confirmationDialog?.confirmation_id) {
      setRespondedInteractions((prev) => new Set(prev).add(confirmationDialog.confirmation_id))
    }

    const responseText = typeof response === "string" ? response : JSON.stringify(response)
    acknowledgeVoiceLinkedSubmission(responseText, "I confirmed that request.")
    onSend(responseText)
    onActivity?.()
    setConfirmationDialog(null)
  }

  const stopCallMode = async () => {
    callModeTransitionRef.current = true
    setIsCallTransitioning(true)
    setIsCallModeActive(false)
    try {
      await voiceChat.stopConversation()
      voiceChat.stopSpeaking()
      setInput("")
      voiceChat.setAutoSubmitEnabled(previousAutoSubmitRef.current)
      autoExpandedForCallRef.current = false
      restorePrimaryChatScrollAfterCallMode()
      onActivity?.()
    } catch (error) {
      void error
      toast.error("Unable to stop the voice session.")
    } finally {
      callModeTransitionRef.current = false
      setIsCallTransitioning(false)
    }
  }

  const toggleCallMode = async () => {
    if (callModeTransitionRef.current) {
      return
    }

    if (!voiceAccessAllowed) {
      toast.info("Voice conversation is not enabled for this workspace.")
      return
    }

    if (!voiceChat.isSupported) {
      toast.info("Voice chat is not supported in this browser. Please use Chrome, Edge, or Safari.")
      return
    }

    callModeTransitionRef.current = true
    setIsCallTransitioning(true)
    if (isCallModeActive || voiceChat.isConnected || voiceChat.isConnecting) {
      await stopCallMode()
      return
    }

    setIsCallModeActive(true)
    try {
      if (!isFullScreen) {
        autoExpandedForCallRef.current = true
        toggleFullScreen()
      }
      previousAutoSubmitRef.current = voiceChat.autoSubmitEnabled
      voiceChat.setInputMethod("voice")
      voiceChat.setAutoSubmitEnabled(false)
      await voiceChat.startConversation()
      onActivity?.()
    } catch (error) {
      void error
      setIsCallModeActive(false)
      if (autoExpandedForCallRef.current && isFullScreen) {
        toggleFullScreen()
      }
      autoExpandedForCallRef.current = false
      voiceChat.setAutoSubmitEnabled(previousAutoSubmitRef.current)
      toast.error("Unable to start the voice session.")
    } finally {
      callModeTransitionRef.current = false
      setIsCallTransitioning(false)
    }
  }

  const handleUserInterruption = () => {
    if (isCallModeActive && voiceChat.isSpeaking) {
      voiceChat.stopSpeaking()
    }
    onActivity?.()
  }

  const handleCloseChat = () => {
    if (isCallModeActive || voiceChat.isConnected || voiceChat.isConnecting) {
      setIsCallModeActive(false)
      void voiceChat.stopConversation()
      setIsCallTransitioning(false)
      callModeTransitionRef.current = false
      restorePrimaryChatScrollAfterCallMode()
    }
    onClose()
    onActivity?.()
  }

  const voicePanel = isCallModeActive ? (
    <aside className="sticky top-0 flex h-full min-h-0 max-h-full min-w-[280px] max-w-md shrink-0 self-start flex-col overflow-hidden rounded-2xl border border-blue-200 bg-blue-50 shadow-sm">
      <div className="flex items-start justify-between gap-3 border-b border-blue-200 px-4 py-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <AudioLines
              className={`h-5 w-5 text-blue-700 ${voiceChat.isSpeaking || voiceChat.isListening ? "animate-pulse" : ""}`}
              strokeWidth={2.2}
            />
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-600">Voice call active</p>
            <span className="rounded-full bg-blue-100 px-2 py-1 text-[11px] font-semibold text-blue-700">
              {voiceCallStatus}
            </span>
          </div>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            {voiceChat.isConnecting
              ? "Connecting to LiveKit..."
              : voiceChat.isSpeaking
                ? "Assistant is speaking."
                : voiceChat.isListening
                  ? "Listening for your next phrase."
                  : voiceCallStatus === "Preparing"
                    ? "Preparing the workspace assistant..."
                    : "Speak naturally. Incomplete requests stay here until the missing detail is clarified."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            void toggleCallMode()
          }}
          disabled={isCallTransitioning}
          className="rounded-full border border-gray-200 bg-white p-2 text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
          aria-label="End voice call"
          title="End voice call"
        >
          <PhoneOff className="h-5 w-5" strokeWidth={2.2} />
        </button>
      </div>
      <div className="flex min-h-0 flex-1 overflow-hidden px-4 py-4">
        <div
          ref={voiceTranscriptScrollRef}
          className="h-full min-h-0 flex-1 overflow-y-auto rounded-2xl border border-dashed border-blue-200 bg-white/80 px-4 py-3 custom-scrollbar"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">Voice transcript</p>
          {voiceConversationEntries.length > 0 ? (
            <div className="mt-3 space-y-2">
              {voiceConversationEntries.map((entry, index) => (
                <div
                  key={`${entry.timestamp}-${index}`}
                  className={`rounded-2xl px-3 py-2 text-sm leading-6 ${
                    entry.speaker === "user"
                      ? "ml-auto max-w-[94%] bg-blue-500 text-gray-50"
                      : "mr-auto max-w-[94%] bg-gray-100 text-gray-900"
                  }`}
                >
                  <div className="mb-1 flex items-center justify-between gap-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] opacity-75">
                      {entry.speaker === "user" ? "You" : "Assistant"}
                    </p>
                    <span className="shrink-0 text-[10px] opacity-75">{formatMessageTimestamp(entry.timestamp)}</span>
                  </div>
                  <p>{entry.text}</p>
                </div>
              ))}
            </div>
          ) : voiceLiveTranscript ? (
            <p className="mt-3 text-sm leading-6 text-gray-800">{voiceLiveTranscript}</p>
          ) : (
            <p className="mt-3 text-sm leading-6 text-gray-500">
              Voice conversation will appear here while the main A2A thread stays on the left.
            </p>
          )}
        </div>
      </div>
    </aside>
  ) : null

  return (
    <div className="flex h-full min-h-0 flex-col">
      {showHeader && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-gray-50 p-4 flex items-center justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <Bot className="h-5 w-5 text-gray-50 shrink-0" aria-hidden strokeWidth={2.2} />
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
                type="button"
                data-ai-chat-export-trigger="true"
                className="p-1 rounded-full hover:bg-white/20 transition-colors shrink-0"
                aria-label="Export conversation"
                title="Export"
                onClick={() => {
                  if (onDownloadConversation) {
                    onDownloadConversation()
                  } else {
                    openConversationExportChooser()
                  }
                  onActivity?.()
                }}
              >
                <Download className="h-5 w-5 text-gray-50" strokeWidth={2.2} />
              </button>
              <button
                type="button"
                onClick={() => {
                  onClearConversation?.()
                  onActivity?.()
                }}
                disabled={!onClearConversation}
                className="p-1 rounded-full hover:bg-white/20 transition-colors shrink-0 disabled:opacity-50"
                aria-label="Start new chat"
                title="New chat"
              >
                <RotateCcw className="h-5 w-5 text-gray-50" strokeWidth={2.2} />
              </button>
              <button
                type="button"
                onClick={() => {
                  toggleFullScreen()
                  onActivity?.()
                }}
                className="p-1 rounded-full hover:bg-white/20 transition-colors shrink-0"
                aria-label={isFullScreen ? "Exit full screen" : "Enter full screen"}
                title={isFullScreen ? "Exit full screen" : "Enter full screen"}
              >
                {isFullScreen ? (
                  <Minimize className="h-5 w-5 text-gray-50" strokeWidth={2.2} />
                ) : (
                  <Maximize className="h-5 w-5 text-gray-50" strokeWidth={2.2} />
                )}
              </button>
              <button
                type="button"
                onClick={handleCloseChat}
                className="p-1 rounded-full hover:bg-white/20 transition-colors"
                aria-label="Close chat"
                title="Close"
              >
                <X className="h-5 w-5 text-gray-50" strokeWidth={2.2} />
              </button>
            </div>
          ) : null}
        </div>
      )}

      {/* Messages area */}
      <div
        className={`min-h-0 flex-1 bg-gray-50 p-4 ${isCallModeActive ? "overflow-hidden" : "overflow-y-auto custom-scrollbar"}`}
        onMouseMove={handleUserInterruption}
        onClick={handleUserInterruption}
      >
        <div className={`min-h-0 ${isCallModeActive ? "grid h-full grid-cols-[minmax(0,1fr)_minmax(280px,360px)] gap-4 items-stretch" : "block"}`}>
          <div
            ref={scrollRef}
            className={`relative min-h-0 ${isCallModeActive ? "h-full overflow-y-auto pr-1 custom-scrollbar" : ""}`}
          >
            {workflowSummary ? <WorkflowSummaryStrip summary={workflowSummary} /> : null}
            {statusText && statusText.trim() !== workflowSummary?.detail?.trim() && (
                <div className={`mb-4 rounded-2xl border px-4 py-3 text-sm ${
                statusTone.borderClass
              }`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 font-medium">
                    <ChatAvatar role="assistant" userInitials={userIdentity.initials} className="h-6 w-6" />
                    <span>{activeAgentName}</span>
                  </div>
                  {lastUpdatedAt ? (
                    <span className="shrink-0 text-xs text-gray-500">{formatMessageTimestamp(lastUpdatedAt)}</span>
                  ) : null}
                </div>
                <p className="mt-1">{humanizeTechnicalMessage(statusText)}</p>
              </div>
            )}
            {messages.length === 0 ? (
              <div className="text-center h-full flex flex-col items-center justify-center text-gray-500">
                <ChatAvatar role="assistant" userInitials={userIdentity.initials} className="mb-3 h-14 w-14" />
                <p className="text-base font-medium text-gray-700">{emptyTitle}</p>
                {emptyDescription ? <p className="mt-2 max-w-md text-sm leading-6 text-gray-500">{emptyDescription}</p> : null}
                {pendingCount > 0 ? (
                  <div className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 shadow-sm">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-700" aria-hidden />
                    <span>Assistant is processing. You can ask another question while it works.</span>
                  </div>
                ) : null}
              </div>
            ) : (
              messages.map((m) => {
            const insightData =
              m.role === "assistant" ? detectInsightResponse(m.content, m.structuredPayload) : null
            const interactionData =
              m.role === "assistant" ? detectInteractionRequest(m.content, m.structuredPayload) : null
            const isInteractionDisabled = respondedInteractions.has(m.id)

            if (insightData) {
              return (
                <div key={m.id} className="mb-8 flex items-end justify-start gap-3">
                  <ChatAvatar role="assistant" userInitials={userIdentity.initials} />
                  <div className="max-w-[95%] rounded-3xl rounded-bl-none border border-gray-200 bg-white px-4 py-4 shadow-lg">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                        {formatMessageTimestamp(m.timestamp)}
                      </span>
                      <div className="flex flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        onMouseDown={(event) => event.stopPropagation()}
                        onClick={(event) => {
                          event.preventDefault()
                          event.stopPropagation()
                          openInsightExportChooser(insightData.data as ExportStructuredPayload)
                          onActivity?.()
                        }}
                        className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
                        aria-label="Download insight"
                        title="Download"
                      >
                        <Download className="h-3.5 w-3.5" strokeWidth={2.2} />
                        Download
                      </button>
                      </div>
                    </div>
                    <InsightWidgetRenderer
                      payload={insightData.data}
                      onSend={(text) => {
                        onSend(text)
                        onActivity?.()
                      }}
                    />
                    <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-gray-100 pt-3">
                      <button
                        type="button"
                        onMouseDown={(event) => event.stopPropagation()}
                        onClick={(event) => {
                          event.preventDefault()
                          event.stopPropagation()
                          openInsightExportChooser(insightData.data as ExportStructuredPayload)
                          onActivity?.()
                        }}
                        className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
                        aria-label="Download insight"
                        title="Download"
                      >
                        <Download className="h-3.5 w-3.5" strokeWidth={2.2} />
                        Download
                      </button>
                    </div>
                  </div>
                </div>
              )
            }

            if (interactionData) {
              const { type, data } = interactionData
              const style = getInteractionStyle(type)

              if (type === "confirmation") {
                return (
                  <div key={m.id} className="mb-8 flex items-end justify-start gap-3">
                    <ChatAvatar role="assistant" userInitials={userIdentity.initials} />
                    <div
                      className={`max-w-[95%] ${style.color} rounded-2xl rounded-bl-none border px-4 py-4 text-gray-800 shadow-lg`}
                    >
                      <div className="mb-3 flex items-center justify-between gap-3 text-xs font-semibold">
                        <div className="flex items-center gap-2">
                          {isInteractionDisabled ? (
                            <Check className="h-3 w-3 text-green-600" />
                          ) : (
                            <Clock className="h-3 w-3 text-gray-700" />
                          )}
                          <span className="text-gray-900">{isInteractionDisabled ? "Response Sent" : "Awaiting Confirmation"}</span>
                        </div>
                        <span className="shrink-0 text-gray-600">{formatMessageTimestamp(m.timestamp)}</span>
                      </div>
                      <div className="space-y-3">
                        <p className="text-sm font-medium text-gray-900">
                          {asText(data.description) || asText(data.title) || "Please review this request."}
                        </p>
                        {asText(data.details) && (
                          <p className="rounded-lg bg-white/60 p-2 text-xs text-gray-700">{asText(data.details)}</p>
                        )}
                        {!isInteractionDisabled && (
                          <button
                            onClick={() => setConfirmationDialog(data)}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-gray-50 py-2 px-3 rounded-lg text-sm font-medium transition-colors"
                          >
                            Review & Respond
                          </button>
                        )}
                        {isInteractionDisabled && (
                          <div className="w-full bg-green-100 text-green-700 py-2 px-3 rounded-lg text-sm font-medium text-center">
                            <Check className="mr-1 inline h-4 w-4" aria-hidden="true" /> Response Sent
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              }

              return (
                <div key={m.id} className="mb-8 flex items-end justify-start gap-3">
                  <ChatAvatar role="assistant" userInitials={userIdentity.initials} />
                  <div
                      className={`max-w-[95%] ${style.color} rounded-2xl rounded-bl-none border px-4 py-4 text-gray-800 shadow-lg`}
                    >
                    <div className="mb-3 flex items-center justify-between gap-3 text-xs font-semibold">
                      <div className="flex items-center gap-2">
                        <style.icon className="h-4 w-4 text-gray-700" aria-hidden="true" />
                        <span className="text-gray-900">{type.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}</span>
                        {isInteractionDisabled && (
                          <span className="ml-1 inline-flex items-center gap-1 text-green-600">
                            <Check className="h-3 w-3" />
                            <span className="text-xs">Response Sent</span>
                          </span>
                        )}
                      </div>
                      <span className="shrink-0 text-gray-600">{formatMessageTimestamp(m.timestamp)}</span>
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
            const isUserMessage = m.role === "user"

            return (
              <div key={m.id} className={`mb-8 flex items-end gap-3 ${isUserMessage ? "justify-end" : "justify-start"}`}>
                {!isUserMessage ? (
                  <ChatAvatar role="assistant" userInitials={userIdentity.initials} />
                ) : null}
                <div
                  className={`max-w-[85%] rounded-2xl px-5 py-4 ${
                    isUserMessage
                      ? "bg-blue-500 text-gray-50 rounded-br-none"
                      : "bg-gray-200 text-gray-700 rounded-bl-none shadow-lg border border-gray-300"
                  }`}
                >
                  <div
                    className={`mb-3 flex items-center justify-between text-xs font-semibold ${isUserMessage ? "text-blue-100" : "text-gray-500"}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="uppercase tracking-[0.18em]">{isUserMessage ? "You" : "Assistant"}</span>
                      {copiedMessageId === m.id && (
                        <span className="inline-flex items-center gap-1 text-green-600">
                          <Check className="h-3 w-3" />
                          <span className="text-xs">Copied!</span>
                        </span>
                      )}
                    </div>
                    <span className={isUserMessage ? "text-blue-100" : "text-gray-500"}>
                      {formatMessageTimestamp(m.timestamp)}
                    </span>
                  </div>
                  {interactionResponseSummary ? (
                    <div className="space-y-1">
                      <p className={`text-base font-semibold ${isUserMessage ? "text-gray-50" : "text-gray-700"}`}>
                        {interactionResponseSummary.title}
                      </p>
                      {interactionResponseSummary.detail ? (
                        <p className={`text-sm leading-6 ${isUserMessage ? "text-blue-50" : "text-gray-600"}`}>
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
                {isUserMessage ? (
                  <ChatAvatar role="user" userInitials={userIdentity.initials} userImageUrl={userIdentity.imageUrl} />
                ) : null}
              </div>
            )
              })
            )}

            {pendingCount > 0 && (
              <div className="mb-4 flex items-end justify-start gap-3">
                <ChatAvatar role="assistant" userInitials={userIdentity.initials} />
                <div className="max-w-[80%] rounded-2xl rounded-bl-none border border-gray-300 bg-gray-200 px-4 py-3 text-gray-700 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-600" aria-hidden />
                    <span>Assistant is processing. You can ask another question while it works.</span>
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
                className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-blue-600 text-gray-50 text-xs px-3 py-1.5 rounded-full shadow hover:bg-blue-700"
              >
                View {unreadCount} new message{unreadCount > 1 ? "s" : ""}
              </button>
            )}

            <div ref={endRef} />
          </div>

          {voicePanel}
        </div>
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
                (awaitingInput
                  ? "Provide the requested answer, approval, or follow-up..."
                  : "Type your message...")
              }
            className="w-full text-gray-800 bg-gray-200/70 border border-gray-300 rounded-2xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none leading-6 max-h-[160px]"
            aria-label="Type your message"
          />
          </div>

          <div className="flex items-center gap-1">
            {voiceChat.isSupported && voiceAccessAllowed && (
              <button
                type="button"
                onClick={() => {
                  void toggleCallMode()
                }}
                disabled={isCallTransitioning || voiceChat.isConnecting}
                className={`p-2 rounded-full transition-colors shrink-0 ${
                  isCallModeActive ? "bg-blue-100 hover:bg-blue-200" : "bg-gray-100 hover:bg-gray-200"
                }`}
                aria-label={isCallModeActive ? "End call mode" : "Start call mode"}
                title={isCallModeActive ? "End call mode" : "Start call mode"}
              >
                {isCallModeActive ? (
                  <PhoneOff className="h-5 w-5 text-blue-600" strokeWidth={2.2} />
                ) : (
                  <PhoneCall className="h-5 w-5 text-gray-600" strokeWidth={2.2} />
                )}
              </button>
            )}
            {voiceChat.isSupported && !voiceAccessAllowed && (
              <div className="rounded-full border border-gray-200 bg-gray-100 px-3 py-2 text-xs text-gray-500">
                Voice conversation is disabled for this account.
              </div>
            )}
          </div>

          <button
            type="submit"
            className="bg-blue-600 text-gray-50 p-3 rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50"
            disabled={!input.trim()}
            aria-label="Send message"
            title={sendLabel}
            onClick={onActivity}
          >
            <Send className="h-5 w-5 text-gray-50" strokeWidth={2.2} />
          </button>
        </div>

        <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
          <span>
            {awaitingInput
              ? "The active agent is waiting for your reply to continue this task."
              : isBusy || pendingCount > 0
                ? "You can ask another question while the current task is processing."
                : "Enter sends. Shift+Enter adds a new line."}
          </span>
          <span className="font-medium text-gray-600">{sendLabel}</span>
        </div>
      </form>

      {exportDownload && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-gray-950/45 px-4 backdrop-blur-sm"
          data-ai-chat-export-panel="true"
          onMouseDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-6 text-gray-900 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-600">
                  {exportDownload.status === "choosing" ? "Download" : `${exportDownload.kind.toUpperCase()} Export`}
                </p>
                <h3 className="mt-2 text-xl font-bold text-gray-900">{exportDownload.title}</h3>
              </div>
              <button
                type="button"
                onClick={clearExportDownload}
                className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
                aria-label="Close export panel"
              >
                <X className="h-5 w-5" strokeWidth={2.2} />
              </button>
            </div>

            <p className="mt-3 text-sm leading-6 text-gray-600">{exportDownload.description}</p>

            {exportDownload.filename ? (
                <div className="mt-5 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">File</p>
                <p className="mt-1 break-all text-sm font-medium text-gray-800">{exportDownload.filename}</p>
              </div>
            ) : null}

            {exportDownload.status === "choosing" ? (
              <div className="mt-5 grid gap-3">
                <button
                  type="button"
                  onClick={() =>
                    exportDownload.source === "conversation"
                      ? void handleExportChatPdf()
                      : void handleExportInsightPdfPayload(exportDownload.payload)
                  }
                  className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-3 text-left transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span>
                    <span className="block text-sm font-semibold text-gray-900">PDF report</span>
                    <span className="block text-xs text-gray-500">Visual report with charts and product cards.</span>
                  </span>
                  <Download className="h-4 w-4 text-gray-500" strokeWidth={2.2} />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    exportDownload.source === "conversation"
                      ? void handleExportChatCsv()
                      : handleExportInsightCsvPayload(exportDownload.payload)
                  }
                  className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-3 text-left transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span>
                    <span className="block text-sm font-semibold text-gray-900">CSV data</span>
                    <span className="block text-xs text-gray-500">Spreadsheet-ready rows for analysis.</span>
                  </span>
                  <Download className="h-4 w-4 text-gray-500" strokeWidth={2.2} />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    exportDownload.source === "conversation"
                      ? void handleExportChatJson()
                      : handleExportInsightJsonPayload(exportDownload.payload)
                  }
                  className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-3 text-left transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span>
                    <span className="block text-sm font-semibold text-gray-900">JSON payload</span>
                    <span className="block text-xs text-gray-500">Structured data for integrations or backup.</span>
                  </span>
                  <Download className="h-4 w-4 text-gray-500" strokeWidth={2.2} />
                </button>
              </div>
            ) : exportDownload.status === "preparing" ? (
              <div className="mt-5 flex items-center gap-3 rounded-2xl bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.2} />
                Generating export...
              </div>
            ) : (
              <>
                <div className="mt-5 flex flex-wrap gap-3">
                  <a
                    href={exportDownload.href}
                    download={exportDownload.filename}
                    className="inline-flex flex-1 items-center justify-center rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-gray-50 transition hover:bg-blue-700"
                  >
                    Download {exportDownload.kind.toUpperCase()}
                  </a>
                  <a
                    href={exportDownload.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                  >
                    Open
                  </a>
                </div>
                {exportDownload.source === "conversation" || exportDownload.payload ? (
                  <button
                    type="button"
                    onClick={() =>
                      exportDownload.source === "conversation"
                        ? openConversationExportChooser()
                        : openInsightExportChooser(exportDownload.payload)
                    }
                    className="mt-3 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                  >
                    Choose another format
                  </button>
                ) : null}
              </>
            )}
          </div>
        </div>
      )}

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
