"use client"

import Link from "next/link"
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react"
import {
  Activity,
  Archive,
  ArchiveRestore,
  Bot,
  ChevronDown,
  ChevronUp,
  Clock3,
  Copy,
  Download,
  MessageSquareText,
  Plus,
  Radio,
  RefreshCcw,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Workflow,
  Trash2,
} from "lucide-react"
import { toast } from "react-toastify"

import AgentChat from "@/components/agents/agent-chat"
import { hasTokenPermission } from "@/lib/agentPermissions"
import { deriveWorkflowSummary } from "@/lib/agent-structured-output"
import { cn, formatRelativeTime, truncateText } from "@/lib/utils"
import { useGetRuntimeAgentRegistryQuery } from "@/redux/features/agents/agentControlApiSlice"
import {
  getAgentGatewayWebSocketBaseUrl,
  getGatewayAccessToken,
  useCreateAgentConversationMutation,
  useDeleteAgentConversationMutation,
  useGetAgentConversationQuery,
  useListAgentConversationsQuery,
  useUpdateAgentConversationMutation,
} from "@/redux/features/agents/agentChatApiSlice"
import type {
  AgentConversation,
  AgentConversationActivity,
  AgentConversationMessage,
} from "@/redux/features/agents/agentChatTypes"
import type { WorkspaceAgentRuntimeSummary } from "@/redux/features/agents/agentControlTypes"
import { useGetGatewayHealthQuery } from "@/redux/features/ka2a/ka2aApiSlice"
import type { ChatMessage } from "@/redux/features/ka2a/ka2aSlice"

type SocketState = "disconnected" | "connecting" | "connected"
type ConversationFilter = "all" | "active" | "awaiting" | "archived"

type PendingOutboundMessage = {
  conversationId: string
  text: string
}

type RuntimeEventLog = {
  id: string
  label: string
  receivedAt: string
  detail?: string
  kind?: string
  state?: string
  specialistSlug?: string
}

type SocketEnvelope =
  | { type: "conversation.snapshot"; conversation: AgentConversation; messages: AgentConversationMessage[]; activities: AgentConversationActivity[] }
  | { type: "conversation.updated"; conversation: AgentConversation }
  | { type: "message.created"; message: AgentConversationMessage }
  | { type: "activity.created"; activity: AgentConversationActivity }
  | { type: "task.status"; state?: string; text?: string; final?: boolean }
  | { type: "task.event"; event?: Record<string, unknown> }
  | { type: "typing.started" }
  | { type: "typing.stopped" }
  | { type: "error"; message?: string }
  | { type: "pong" }

const asRecord = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {}
  }
  return value as Record<string, unknown>
}

const asString = (value: unknown): string => (typeof value === "string" ? value.trim() : "")

const humanize = (value: string) =>
  value
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase())

const createId = () => {
  const cryptoAny = globalThis.crypto as { randomUUID?: () => string } | undefined
  if (cryptoAny?.randomUUID) {
    return cryptoAny.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const messagePreview = (conversation: AgentConversation) =>
  conversation.lastMessagePreview?.trim() || "No messages yet."

const agentSummary = (agent: WorkspaceAgentRuntimeSummary) =>
  [agent.description, agent.origin, agent.visibility].filter(Boolean).join(" • ")

const quickStartPrompts = [
  "Summarize the latest workspace issues and suggest the next actions.",
  "Review the current inventory risks and tell me what needs attention first.",
  "Help me investigate a stuck workflow and propose the fastest resolution path.",
]

const eventLabel = (event: Record<string, unknown>): string => {
  const kind = asString(event.kind)
  if (kind === "task") {
    const status = asRecord(event.status)
    return `Task created • ${asString(status.state) || "submitted"}`
  }
  if (kind === "status-update") {
    const status = asRecord(event.status)
    const message = asRecord(status.message)
    const parts = Array.isArray(message.parts) ? message.parts : []
    const text = parts
      .map((part) => asRecord(part))
      .filter((part) => asString(part.kind) === "text")
      .map((part) => asString(part.text))
      .join(" ")
      .trim()
    return text || `Status update • ${asString(status.state) || "working"}`
  }
  if (kind === "artifact-update") {
    const artifact = asRecord(event.artifact)
    return asString(artifact.name) ? `Artifact • ${asString(artifact.name)}` : "Artifact update"
  }
  return humanize(kind || "event")
}

const toChatMessages = (messages: AgentConversationMessage[]): ChatMessage[] =>
  messages.map((message) => ({
    id: message.id,
    role: message.role === "user" ? "user" : "assistant",
    content: message.content,
    taskId: message.taskId ?? undefined,
    timestamp: message.createdAt,
    serverMessageId: message.serverMessageId ?? undefined,
    structuredPayload: message.structuredPayload as ChatMessage["structuredPayload"],
  }))

function MetricCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode
  label: string
  value: string
  hint: string
}) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white/95 p-4 shadow-[0_16px_32px_-28px_rgba(15,23,42,0.35)]">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-blue-50 p-2.5 text-blue-700">{icon}</div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">{label}</p>
          <p className="mt-1 text-lg font-semibold text-slate-950">{value}</p>
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-500">{hint}</p>
    </div>
  )
}

export default function AgentRuntimeWorkspace() {
  const canInteractWithAgent = useMemo(() => hasTokenPermission("interact_with_agent"), [])
  const canManageAgentSettings = useMemo(() => hasTokenPermission("manage_agent_settings"), [])

  const overviewRef = useRef<HTMLDivElement | null>(null)
  const [selectedAgentSlug, setSelectedAgentSlug] = useState("")
  const [activeConversationId, setActiveConversationId] = useState<string>("")
  const [conversationSearch, setConversationSearch] = useState("")
  const [conversationFilter, setConversationFilter] = useState<ConversationFilter>("all")
  const [isOverviewOpen, setIsOverviewOpen] = useState(false)
  const [liveConversation, setLiveConversation] = useState<AgentConversation | null>(null)
  const [liveMessages, setLiveMessages] = useState<AgentConversationMessage[]>([])
  const [liveActivities, setLiveActivities] = useState<AgentConversationActivity[]>([])
  const [liveStatusText, setLiveStatusText] = useState("")
  const [runtimeEvents, setRuntimeEvents] = useState<RuntimeEventLog[]>([])
  const [socketState, setSocketState] = useState<SocketState>("disconnected")
  const [isBusy, setIsBusy] = useState(false)

  const pendingOutboundMessageRef = useRef<PendingOutboundMessage | null>(null)
  const socketRef = useRef<WebSocket | null>(null)
  const deferredConversationSearch = useDeferredValue(conversationSearch)

  const { data: gatewayHealth, isFetching: isCheckingGateway, refetch: refetchGateway } = useGetGatewayHealthQuery()
  const {
    data: runtimeRegistry,
    isFetching: isFetchingRuntimeRegistry,
    refetch: refetchRuntimeRegistry,
  } = useGetRuntimeAgentRegistryQuery(undefined, {
    skip: !canInteractWithAgent,
    pollingInterval: 30000,
    refetchOnMountOrArgChange: true,
  })
  const {
    data: conversations = [],
    isFetching: isFetchingConversations,
    refetch: refetchConversations,
  } = useListAgentConversationsQuery(undefined, {
    skip: !canInteractWithAgent,
    pollingInterval: 15000,
    refetchOnMountOrArgChange: true,
  })
  const resolvedActiveConversationId = activeConversationId || conversations[0]?.id || ""
  const {
    data: activeConversationDetail,
    isFetching: isFetchingConversationDetail,
  } = useGetAgentConversationQuery(resolvedActiveConversationId, {
    skip: !canInteractWithAgent || !resolvedActiveConversationId,
    refetchOnMountOrArgChange: true,
  })

  const [createConversation, { isLoading: isCreatingConversation }] = useCreateAgentConversationMutation()
  const [deleteConversation, { isLoading: isDeletingConversation }] = useDeleteAgentConversationMutation()
  const [updateConversation, { isLoading: isUpdatingConversation }] = useUpdateAgentConversationMutation()

  const runtimeAgents = useMemo(() => runtimeRegistry?.agents ?? [], [runtimeRegistry?.agents])
  const runtimeAgentMap = useMemo(
    () => new Map(runtimeAgents.map((agent) => [agent.slug, agent])),
    [runtimeAgents],
  )
  const preferredAgentSlug = useMemo(
    () => runtimeAgents.find((agent) => agent.slug === "host")?.slug ?? runtimeAgents[0]?.slug ?? "",
    [runtimeAgents],
  )

  const filteredConversations = useMemo(() => {
    const search = deferredConversationSearch.trim().toLowerCase()
    const statusFiltered = conversations.filter((conversation) => {
      if (conversationFilter === "all") {
        return true
      }
      if (conversationFilter === "awaiting") {
        return conversation.awaitingInput
      }
      if (conversationFilter === "archived") {
        return conversation.status === "archived"
      }
      return conversation.status === "active"
    })
    if (!search) {
      return statusFiltered
    }
    return statusFiltered.filter((conversation) =>
      [conversation.title, conversation.agentName, conversation.agentSlug, conversation.lastMessagePreview]
        .join(" ")
        .toLowerCase()
        .includes(search),
    )
  }, [conversations, conversationFilter, deferredConversationSearch])
  const resolvedSelectedAgentSlug =
    selectedAgentSlug ||
    (liveConversation && liveConversation.id === resolvedActiveConversationId ? liveConversation.agentSlug : "") ||
    activeConversationDetail?.conversation.agentSlug ||
    preferredAgentSlug

  useEffect(() => {
    if (!resolvedActiveConversationId || !canInteractWithAgent) {
      return
    }
    const accessToken = getGatewayAccessToken()
    if (!accessToken) {
      return
    }
    const baseUrl = getAgentGatewayWebSocketBaseUrl()
    const socket = new WebSocket(
      `${baseUrl}/ws/conversations/${encodeURIComponent(resolvedActiveConversationId)}?token=${encodeURIComponent(accessToken)}`,
    )
    socketRef.current = socket
    const connectingTimer = window.setTimeout(() => {
      setSocketState("connecting")
      setIsBusy(false)
    }, 0)

    socket.onopen = () => {
      setSocketState("connected")
    }

    socket.onmessage = (event) => {
      let envelope: SocketEnvelope | null = null
      try {
        envelope = JSON.parse(event.data) as SocketEnvelope
      } catch {
        return
      }
      if (!envelope) {
        return
      }
      if (envelope.type === "conversation.snapshot") {
        setLiveConversation(envelope.conversation)
        setLiveMessages(envelope.messages)
        setLiveActivities(envelope.activities)
        setLiveStatusText("")
        setRuntimeEvents([])
        const queued = pendingOutboundMessageRef.current
        if (queued && queued.conversationId === envelope.conversation.id && socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: "message.send", text: queued.text }))
          pendingOutboundMessageRef.current = null
        }
        return
      }
      if (envelope.type === "conversation.updated") {
        setLiveConversation(envelope.conversation)
        void refetchConversations()
        return
      }
      if (envelope.type === "message.created") {
        setLiveMessages((current) => {
          if (current.some((message) => message.id === envelope.message.id)) {
            return current.map((message) => (message.id === envelope.message.id ? envelope.message : message))
          }
          return [...current, envelope.message]
        })
        void refetchConversations()
        return
      }
      if (envelope.type === "activity.created") {
        setLiveActivities((current) => {
          const next = [envelope.activity, ...current.filter((item) => item.id !== envelope.activity.id)]
          return next.slice(0, 40)
        })
        return
      }
      if (envelope.type === "task.status") {
        setLiveStatusText(envelope.text || "")
        if (envelope.final) {
          setIsBusy(false)
        }
        return
      }
      if (envelope.type === "task.event") {
        const eventPayload = asRecord(envelope.event)
        setRuntimeEvents((current) => [
          {
            id: createId(),
            label: eventLabel(eventPayload),
            receivedAt: new Date().toISOString(),
            kind: asString(eventPayload.kind) || "event",
          },
          ...current,
        ].slice(0, 8))
        return
      }
      if (envelope.type === "typing.started") {
        setIsBusy(true)
        return
      }
      if (envelope.type === "typing.stopped") {
        setIsBusy(false)
        return
      }
      if (envelope.type === "error") {
        setIsBusy(false)
        if (envelope.message) {
          toast.error(envelope.message)
        }
      }
    }

    socket.onerror = () => {
      setSocketState("disconnected")
      setIsBusy(false)
    }

    socket.onclose = () => {
      if (socketRef.current === socket) {
        socketRef.current = null
      }
      setSocketState("disconnected")
      setIsBusy(false)
    }

    return () => {
      window.clearTimeout(connectingTimer)
      if (socketRef.current === socket) {
        socketRef.current = null
      }
      socket.close()
    }
  }, [canInteractWithAgent, refetchConversations, resolvedActiveConversationId])

  useEffect(() => {
    if (!isOverviewOpen) {
      return
    }

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target
      if (!(target instanceof Node)) {
        return
      }
      if (overviewRef.current?.contains(target)) {
        return
      }
      setIsOverviewOpen(false)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOverviewOpen(false)
      }
    }

    document.addEventListener("mousedown", handlePointerDown)
    document.addEventListener("touchstart", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("mousedown", handlePointerDown)
      document.removeEventListener("touchstart", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOverviewOpen])

  const activeConversation = useMemo(() => {
    if (liveConversation && liveConversation.id === resolvedActiveConversationId) {
      return liveConversation
    }
    return activeConversationDetail?.conversation ?? null
  }, [activeConversationDetail?.conversation, liveConversation, resolvedActiveConversationId])

  const activeMessages = useMemo(() => {
    if (liveConversation && liveConversation.id === resolvedActiveConversationId) {
      return liveMessages
    }
    return activeConversationDetail?.messages ?? []
  }, [activeConversationDetail?.messages, liveConversation, liveMessages, resolvedActiveConversationId])
  const activeActivities = useMemo(() => {
    if (liveConversation && liveConversation.id === resolvedActiveConversationId) {
      return liveActivities
    }
    return activeConversationDetail?.activities ?? []
  }, [activeConversationDetail?.activities, liveActivities, liveConversation, resolvedActiveConversationId])
  const activeRuntimeAgent =
    (activeConversation?.agentSlug ? runtimeAgentMap.get(activeConversation.agentSlug) : undefined) ??
    (resolvedSelectedAgentSlug ? runtimeAgentMap.get(resolvedSelectedAgentSlug) : undefined)
  const chatMessages = useMemo(() => toChatMessages(activeMessages), [activeMessages])
  const selectedAgent =
    (resolvedSelectedAgentSlug ? runtimeAgentMap.get(resolvedSelectedAgentSlug) : undefined) ??
    (preferredAgentSlug ? runtimeAgentMap.get(preferredAgentSlug) : undefined)
  const workflowSummary = useMemo(
    () =>
      deriveWorkflowSummary({
        messages: chatMessages,
        activeAgentName: activeRuntimeAgent?.name || activeConversation?.agentName || selectedAgent?.name || "Host",
        activeSpecialistName: activeConversation?.activeSpecialistSlug || null,
        currentTaskState: activeConversation?.currentTaskState || null,
        awaitingInput: activeConversation?.awaitingInput,
        statusText: liveStatusText,
      }),
    [
      activeConversation?.activeSpecialistSlug,
      activeConversation?.agentName,
      activeConversation?.awaitingInput,
      activeConversation?.currentTaskState,
      activeRuntimeAgent?.name,
      chatMessages,
      liveStatusText,
      selectedAgent?.name,
    ],
  )

  const gatewayOnline = gatewayHealth?.status === "ok"
  const activityFeed = useMemo(() => {
    const live = runtimeEvents.map((event) => ({
      id: event.id,
      kind: event.kind || "event",
      label: event.label,
      detail: event.detail || null,
      state: event.state || null,
      specialistSlug: event.specialistSlug || null,
      receivedAt: event.receivedAt,
    }))
    const merged = [...live, ...activeActivities]
    const seen = new Set<string>()
    return merged
      .filter((item) => {
        const key = `${item.kind}:${item.label}:${item.receivedAt}:${item.specialistSlug || ""}`
        if (seen.has(key)) {
          return false
        }
        seen.add(key)
        return true
      })
      .sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime())
      .slice(0, 12)
  }, [activeActivities, runtimeEvents])
  const latestHeaderUpdate = useMemo(() => {
    if (liveStatusText.trim()) {
      return {
        label: liveStatusText.trim(),
        receivedAt: activeConversation?.updatedAt || new Date().toISOString(),
      }
    }
    const latestActivity = activityFeed[0]
    if (!latestActivity) {
      return null
    }
    return {
      label: latestActivity.detail?.trim() || latestActivity.label,
      receivedAt: latestActivity.receivedAt,
    }
  }, [activeConversation?.updatedAt, activityFeed, liveStatusText])
  const debugSnapshot = useMemo(
    () => ({
      exportedAt: new Date().toISOString(),
      workspace: "intera_f:/agent",
      gateway: {
        status: gatewayHealth?.status ?? "unknown",
        isChecking: isCheckingGateway,
        online: gatewayOnline,
      },
      runtime: {
        socketState,
        isBusy,
        liveStatusText,
      },
      discovery: {
        isLoadingAgents: isFetchingRuntimeRegistry,
        selectedAgentSlug: resolvedSelectedAgentSlug || null,
        preferredAgentSlug: preferredAgentSlug || null,
        agents: runtimeAgents,
      },
      conversations: {
        isLoading: isFetchingConversations,
        filter: conversationFilter,
        search: conversationSearch,
        total: conversations.length,
        filteredTotal: filteredConversations.length,
        items: conversations,
      },
      activeConversation: activeConversation
        ? {
            conversation: activeConversation,
            messages: activeMessages,
            activities: activeActivities,
            activityFeed,
            runtimeEvents,
          }
        : null,
    }),
    [
      activeActivities,
      activeConversation,
      activeMessages,
      activityFeed,
      conversationFilter,
      conversationSearch,
      conversations,
      filteredConversations.length,
      gatewayHealth?.status,
      gatewayOnline,
      isBusy,
      isCheckingGateway,
      isFetchingConversations,
      isFetchingRuntimeRegistry,
      liveStatusText,
      preferredAgentSlug,
      resolvedSelectedAgentSlug,
      runtimeAgents,
      runtimeEvents,
      socketState,
    ],
  )

  const handleCopyDebugSnapshot = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(debugSnapshot, null, 2))
      toast.success("Copied runtime debug JSON.")
    } catch {
      toast.error("Unable to copy runtime debug JSON.")
    }
  }

  const handleDownloadDebugSnapshot = () => {
    try {
      const blob = new Blob([JSON.stringify(debugSnapshot, null, 2)], {
        type: "application/json",
      })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement("a")
      anchor.href = url
      anchor.download = "ai_convo.json"
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(url)
    } catch {
      toast.error("Unable to download runtime debug JSON.")
    }
  }

  const createBlankConversation = async (initialText?: string) => {
    const targetAgentSlug = activeConversation?.agentSlug || resolvedSelectedAgentSlug || preferredAgentSlug
    if (!targetAgentSlug) {
      toast.error("Install or select an agent before starting a conversation.")
      return null
    }
    try {
      const detail = await createConversation({
        agentSlug: targetAgentSlug,
        historyLength: activeConversation?.historyLength ?? 10,
      }).unwrap()
      setActiveConversationId(detail.conversation.id)
      setLiveConversation(detail.conversation)
      setLiveMessages(detail.messages)
      setLiveActivities(detail.activities)
      setSelectedAgentSlug(detail.conversation.agentSlug)
      await refetchConversations()
      if (initialText) {
        pendingOutboundMessageRef.current = {
          conversationId: detail.conversation.id,
          text: initialText,
        }
      }
      return detail
    } catch (error) {
      const message =
        typeof error === "object" && error && "data" in error ? String((error as { data?: unknown }).data) : "Unable to create conversation."
      toast.error(message)
      return null
    }
  }

  const sendOverSocket = (conversationId: string, text: string) => {
    const socket = socketRef.current
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      pendingOutboundMessageRef.current = { conversationId, text }
      return false
    }
    socket.send(JSON.stringify({ type: "message.send", text }))
    return true
  }

  const handleSend = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed) {
      return
    }
    setLiveStatusText("")
    setIsBusy(true)
    if (!resolvedActiveConversationId) {
      await createBlankConversation(trimmed)
      return
    }
    const sent = sendOverSocket(resolvedActiveConversationId, trimmed)
    if (!sent) {
      return
    }
  }

  const handleDeleteConversation = async (conversationId: string) => {
    try {
      await deleteConversation(conversationId).unwrap()
      await refetchConversations()
      if (conversationId === resolvedActiveConversationId) {
        const nextConversation = conversations.find((item) => item.id !== conversationId)
        setActiveConversationId(nextConversation?.id ?? "")
        setLiveConversation(null)
        setLiveMessages([])
        setLiveActivities([])
        setLiveStatusText("")
        setRuntimeEvents([])
      }
    } catch (error) {
      const message =
        typeof error === "object" && error && "data" in error ? String((error as { data?: unknown }).data) : "Unable to delete conversation."
      toast.error(message)
    }
  }

  const handleToggleArchiveConversation = async (conversation: AgentConversation) => {
    try {
      const nextStatus = conversation.status === "archived" ? "active" : "archived"
      const updated = await updateConversation({
        conversationId: conversation.id,
        status: nextStatus,
      }).unwrap()
      if (conversation.id === resolvedActiveConversationId) {
        setLiveConversation((current) => (current?.id === conversation.id ? updated : current))
      }
      await refetchConversations()
    } catch (error) {
      const message =
        typeof error === "object" && error && "data" in error
          ? String((error as { data?: unknown }).data)
          : "Unable to update conversation."
      toast.error(message)
    }
  }

  if (!canInteractWithAgent) {
    return (
      <div className="rounded-[32px] border border-slate-200 bg-white/95 p-8 shadow-[0_22px_40px_-30px_rgba(15,23,42,0.45)]">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">
            <ShieldCheck className="h-4 w-4" />
            Agent Access Required
          </div>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-950">Agent runtime is locked for this workspace.</h1>
          <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600">
            You need the workspace owner override or the <code>interact_with_agent</code> permission before this runtime
            surface becomes available.
          </p>
          {canManageAgentSettings && (
            <Link
              href="/settings?tab=agents"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <Settings2 className="h-4 w-4" />
              Open Agent Settings
            </Link>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-col gap-6 xl:h-[calc(100vh-9.5rem)]">
      <div
        ref={overviewRef}
        className="rounded-[32px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.14),_transparent_38%),linear-gradient(135deg,_rgba(255,255,255,0.98),_rgba(248,250,252,0.96))] p-4 shadow-[0_28px_60px_-36px_rgba(15,23,42,0.35)]"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <button
              type="button"
              onClick={() => setIsOverviewOpen((current) => !current)}
              aria-expanded={isOverviewOpen}
              className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/90 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.26em] text-blue-700 transition hover:border-blue-300 hover:bg-blue-100"
            >
              <Radio className="h-4 w-4" />
              Workspace Agent Runtime
              {isOverviewOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {!isOverviewOpen ? (
              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-700">
                  {runtimeAgents.length} agents
                </span>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-700">
                  {conversations.length} threads
                </span>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-700">
                  {gatewayOnline ? "Gateway online" : isCheckingGateway ? "Checking gateway" : "Gateway offline"}
                </span>
              </div>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                void refetchRuntimeRegistry()
                void refetchConversations()
                void refetchGateway()
              }}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
            >
              <RefreshCcw className={cn("h-4 w-4", (isFetchingRuntimeRegistry || isFetchingConversations || isCheckingGateway) && "animate-spin")} />
              Refresh
            </button>
            {canManageAgentSettings && (
              <Link
                href="/settings?tab=agents"
                className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <Settings2 className="h-4 w-4" />
                Agent Settings
              </Link>
            )}
          </div>
        </div>

        {isOverviewOpen ? (
          <>
            <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Persistent conversations for the active workspace.</h1>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  Installed workspace agents are the only chat targets here. Threads are persisted in the A2A runtime,
                  not the users service, and the gateway streams live task progress over the active conversation socket.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => void handleCopyDebugSnapshot()}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
                >
                  <Copy className="h-4 w-4" />
                  Copy Debug JSON
                </button>
                <button
                  type="button"
                  onClick={handleDownloadDebugSnapshot}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
                >
                  <Download className="h-4 w-4" />
                  Download JSON
                </button>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <MetricCard
                icon={<Bot className="h-4 w-4" />}
                label="Installed Agents"
                value={`${runtimeAgents.length}`}
                hint="Only agents installed into this workspace are available in chat."
              />
              <MetricCard
                icon={<MessageSquareText className="h-4 w-4" />}
                label="Threads"
                value={`${conversations.length}`}
                hint="Persistent conversation threads stored in the A2A runtime."
              />
              <MetricCard
                icon={<Activity className="h-4 w-4" />}
                label="Gateway"
                value={gatewayOnline ? "Online" : isCheckingGateway ? "Checking" : "Offline"}
                hint={socketState === "connected" ? "Conversation socket connected." : "Runtime websocket is idle or reconnecting."}
              />
            </div>

            <div className="mt-6 grid gap-3 lg:grid-cols-3">
              {quickStartPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => void createBlankConversation(prompt)}
                  disabled={!preferredAgentSlug || isCreatingConversation}
                  className="rounded-[24px] border border-slate-200 bg-white/80 p-4 text-left transition hover:border-blue-200 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <div className="flex items-center gap-2 text-blue-700">
                    <Sparkles className="h-4 w-4" />
                    <span className="text-[11px] font-semibold uppercase tracking-[0.2em]">Quick Start</span>
                  </div>
                  <p className="mt-3 text-sm font-medium leading-6 text-slate-900">{prompt}</p>
                </button>
              ))}
            </div>
          </>
        ) : null}
      </div>

      <div className="grid min-h-0 flex-1 gap-5 xl:grid-cols-[280px_minmax(0,1fr)_280px]">
        <aside className="min-h-0 overflow-hidden">
          <div className="flex h-full min-h-0 flex-col gap-6 overflow-y-auto pr-1">
          <section className="shrink-0 rounded-[28px] border border-slate-200 bg-white/95 p-5 shadow-[0_18px_36px_-30px_rgba(15,23,42,0.32)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Installed Agents</p>
                <h2 className="mt-2 text-lg font-semibold text-slate-950">Workspace registry</h2>
              </div>
              <button
                type="button"
                onClick={() => void createBlankConversation()}
                disabled={!resolvedSelectedAgentSlug || isCreatingConversation}
                className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Plus className="h-3.5 w-3.5" />
                New
              </button>
            </div>
            <div className="mt-4 space-y-3">
              {runtimeAgents.length ? (
                runtimeAgents.map((agent) => {
                  const active = (activeConversation?.agentSlug || resolvedSelectedAgentSlug) === agent.slug
                  return (
                    <button
                      type="button"
                      key={agent.id}
                      onClick={() => setSelectedAgentSlug(agent.slug)}
                      className={cn(
                        "w-full rounded-[22px] border px-4 py-4 text-left transition",
                        active
                          ? "border-blue-300 bg-blue-50/80 shadow-[0_16px_30px_-28px_rgba(37,99,235,0.7)]"
                          : "border-slate-200 bg-slate-50/70 hover:border-slate-300 hover:bg-white",
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-950">{agent.name}</p>
                          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">{humanize(agent.slug)}</p>
                        </div>
                        <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                          {humanize(agent.visibility)}
                        </span>
                      </div>
                      <p className="mt-3 text-xs leading-6 text-slate-600">{truncateText(agentSummary(agent), 110)}</p>
                    </button>
                  )
                })
              ) : (
                <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                  No installed agents yet. Add them from the agent settings page first.
                </div>
              )}
            </div>
          </section>

          <section className="flex min-h-0 flex-1 flex-col rounded-[28px] border border-slate-200 bg-white/95 p-5 shadow-[0_18px_36px_-30px_rgba(15,23,42,0.32)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Conversations</p>
                <h2 className="mt-2 text-lg font-semibold text-slate-950">Persistent threads</h2>
              </div>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                {filteredConversations.length}
              </span>
            </div>
            <label className="relative mt-4 block">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={conversationSearch}
                onChange={(event) => setConversationSearch(event.target.value)}
                placeholder="Search conversations"
                className="h-12 w-full rounded-full border border-slate-200 bg-slate-50/80 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:bg-white"
              />
            </label>
            <div className="mt-4 flex flex-wrap gap-2">
              {([
                { key: "all", label: "All" },
                { key: "active", label: "Active" },
                { key: "awaiting", label: "Awaiting" },
                { key: "archived", label: "Archived" },
              ] as const).map((filter) => {
                const active = conversationFilter === filter.key
                return (
                  <button
                    key={filter.key}
                    type="button"
                    onClick={() => setConversationFilter(filter.key)}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] transition",
                      active
                        ? "bg-slate-950 text-white"
                        : "border border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:text-slate-900",
                    )}
                  >
                    {filter.label}
                  </button>
                )
              })}
            </div>
            <div className="mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
              {filteredConversations.length ? (
                filteredConversations.map((conversation) => {
                  const active = conversation.id === resolvedActiveConversationId
                  return (
                    <div
                      key={conversation.id}
                      className={cn(
                        "rounded-[22px] border px-4 py-4 transition",
                        active
                          ? "border-slate-900 bg-slate-950 text-white shadow-[0_22px_34px_-28px_rgba(15,23,42,0.8)]"
                          : "border-slate-200 bg-slate-50/60 hover:border-slate-300 hover:bg-white",
                      )}
                    >
                      <button type="button" onClick={() => setActiveConversationId(conversation.id)} className="w-full text-left">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className={cn("truncate text-sm font-semibold", active ? "text-white" : "text-slate-950")}>
                              {conversation.title || `${conversation.agentName} conversation`}
                            </p>
                            <p className={cn("mt-1 text-xs uppercase tracking-[0.16em]", active ? "text-slate-300" : "text-slate-500")}>
                              {conversation.agentName}
                            </p>
                          </div>
                          {conversation.awaitingInput && (
                            <span className={cn("rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]", active ? "bg-white/10 text-white" : "bg-amber-100 text-amber-700")}>
                              Awaiting input
                            </span>
                          )}
                        </div>
                        <p className={cn("mt-3 text-xs leading-6", active ? "text-slate-200" : "text-slate-600")}>
                          {truncateText(messagePreview(conversation), 110)}
                        </p>
                        <div className={cn("mt-3 flex items-center gap-2 text-[11px]", active ? "text-slate-300" : "text-slate-500")}>
                          <Clock3 className="h-3.5 w-3.5" />
                          {conversation.lastMessageAt ? formatRelativeTime(conversation.lastMessageAt) : "New thread"}
                        </div>
                      </button>
                      <div className="mt-3 flex justify-end">
                        <button
                          type="button"
                          onClick={() => void handleToggleArchiveConversation(conversation)}
                          disabled={isUpdatingConversation}
                          className={cn(
                            "mr-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition",
                            active
                              ? "text-slate-300 hover:bg-white/10 hover:text-white"
                              : "text-slate-500 hover:bg-slate-100 hover:text-slate-900",
                          )}
                        >
                          {conversation.status === "archived" ? (
                            <>
                              <ArchiveRestore className="h-3.5 w-3.5" />
                              Reopen
                            </>
                          ) : (
                            <>
                              <Archive className="h-3.5 w-3.5" />
                              Archive
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDeleteConversation(conversation.id)}
                          disabled={isDeletingConversation}
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition",
                            active
                              ? "text-slate-300 hover:bg-white/10 hover:text-white"
                              : "text-slate-500 hover:bg-slate-100 hover:text-slate-900",
                          )}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                  {isFetchingConversations ? "Loading conversations..." : "No conversations match this filter."}
                </div>
              )}
            </div>
          </section>
          </div>
        </aside>

        <section className="min-w-0 min-h-0 overflow-hidden rounded-[30px] border border-slate-200 bg-white/95 p-5 shadow-[0_22px_48px_-34px_rgba(15,23,42,0.35)]">
          <div className="flex h-full min-h-0 flex-col">
          <div className="shrink-0 flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Live Conversation</p>
              <h2 className="mt-2 truncate text-2xl font-semibold tracking-tight text-slate-950">
                {activeConversation?.title || activeRuntimeAgent?.name || "Select or start a conversation"}
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                {activeConversation
                  ? `Runtime target: ${activeRuntimeAgent?.name || activeConversation.agentName}`
                  : "Pick an installed agent and start a new persistent conversation."}
              </p>
              {latestHeaderUpdate ? (
                <div className="mt-3 inline-flex max-w-full items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  <Activity className="h-3.5 w-3.5 shrink-0 text-blue-600" />
                  <span className="truncate">{truncateText(latestHeaderUpdate.label, 120)}</span>
                  <span className="shrink-0 text-[11px] text-slate-400">{formatRelativeTime(latestHeaderUpdate.receivedAt)}</span>
                  {isBusy ? <span className="inline-flex h-2 w-2 shrink-0 rounded-full bg-emerald-500" /> : null}
                </div>
              ) : null}
            </div>
            <div className="hidden sm:block" />
          </div>

          <div className="mt-5 min-h-0 flex-1 overflow-hidden rounded-[28px] border border-slate-200 bg-slate-50/70">
            <AgentChat
              onClose={() => undefined}
              isFullScreen={false}
              toggleFullScreen={() => undefined}
              messages={chatMessages}
              onSend={(text) => void handleSend(text)}
              isBusy={isBusy || isCreatingConversation || isFetchingConversationDetail}
              pendingCount={activeConversation?.awaitingInput ? 1 : 0}
              activeAgentName={activeRuntimeAgent?.name || activeConversation?.agentName || selectedAgent?.name || "Host"}
              statusText={liveStatusText}
              awaitingInput={Boolean(activeConversation?.awaitingInput)}
              showHeader={false}
              showWindowControls={false}
              inputPlaceholder={
                activeConversation?.awaitingInput
                  ? "Reply so the active task can continue..."
                  : selectedAgent
                    ? `Message ${selectedAgent.name}...`
                    : "Install or select an agent before messaging..."
              }
              emptyTitle={selectedAgent ? `Start a thread with ${selectedAgent.name}` : "Select an installed agent"}
              emptyDescription={
                selectedAgent
                  ? "Use a quick-start prompt or type your first message. This conversation will persist inside the A2A runtime."
                  : "The runtime only exposes agents installed into this workspace."
              }
              sendLabel={activeConversation?.awaitingInput ? "Continue task" : "Send"}
              workflowSummary={workflowSummary}
            />
          </div>
          </div>
        </section>

        <aside className="min-h-0 overflow-hidden">
          <div className="flex h-full min-h-0 flex-col gap-6 overflow-y-auto pr-1">
          <section className="shrink-0 rounded-[28px] border border-slate-200 bg-white/95 p-5 shadow-[0_18px_36px_-30px_rgba(15,23,42,0.32)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Selected Agent</p>
            <h2 className="mt-2 text-lg font-semibold text-slate-950">{activeRuntimeAgent?.name || selectedAgent?.name || "No agent selected"}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              {activeRuntimeAgent?.description || selectedAgent?.description || "Choose an installed agent to start a new conversation."}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {activeRuntimeAgent && (
                <>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                    {humanize(activeRuntimeAgent.origin)}
                  </span>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                    {humanize(activeRuntimeAgent.visibility)}
                  </span>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                    {activeRuntimeAgent.tool_count} tools
                  </span>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                    {activeRuntimeAgent.skill_count} skills
                  </span>
                </>
              )}
            </div>
            <button
              type="button"
              onClick={() => void createBlankConversation()}
              disabled={!resolvedSelectedAgentSlug || isCreatingConversation}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Plus className="h-4 w-4" />
              Start New Conversation
            </button>
          </section>

          <section className="shrink-0 rounded-[28px] border border-slate-200 bg-white/95 p-5 shadow-[0_18px_36px_-30px_rgba(15,23,42,0.32)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Current Flow</p>
            <div className="mt-4 rounded-[22px] border border-slate-200 bg-white p-4 shadow-[0_10px_24px_-24px_rgba(15,23,42,0.28)]">
              <p className="text-sm font-semibold text-slate-950">
                {workflowSummary?.title || "Ready for the next message"}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {workflowSummary?.detail || "The chat surface will summarize the current step here whenever a task is active."}
              </p>
              {workflowSummary?.currentAgentLabel || workflowSummary?.nextAgentLabel ? (
                <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-600">
                  {workflowSummary.currentAgentLabel ? (
                    <p>
                      <span className="font-medium text-slate-900">Now:</span> {workflowSummary.currentAgentLabel}
                    </p>
                  ) : null}
                  {workflowSummary.nextAgentLabel ? (
                    <p>
                      <span className="font-medium text-slate-900">Next:</span> {workflowSummary.nextAgentLabel}
                    </p>
                  ) : null}
                </div>
              ) : null}
              {workflowSummary?.steps.length ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {workflowSummary.steps.map((step) => (
                    <span
                      key={step.key}
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-[11px] font-medium",
                        step.status === "completed" && "border-emerald-200 bg-emerald-100 text-emerald-900",
                        step.status === "current" && "border-blue-200 bg-blue-100 text-blue-900",
                        step.status === "pending" && "border-slate-200 bg-white text-slate-500",
                      )}
                    >
                      {step.label}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[18px] border border-slate-200 bg-white p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Task state</p>
                <p className="mt-2 text-sm font-medium text-slate-900">{humanize(activeConversation?.currentTaskState || "idle")}</p>
              </div>
              <div className="rounded-[18px] border border-slate-200 bg-white p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Specialist</p>
                <p className="mt-2 text-sm font-medium text-slate-900">
                  {activeConversation?.activeSpecialistSlug ? humanize(activeConversation.activeSpecialistSlug) : "Host"}
                </p>
              </div>
              <div className="rounded-[18px] border border-slate-200 bg-white p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Needs reply</p>
                <p className="mt-2 text-sm font-medium text-slate-900">{activeConversation?.awaitingInput ? "Yes" : "No"}</p>
              </div>
              <div className="rounded-[18px] border border-slate-200 bg-white p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Last update</p>
                <p className="mt-2 text-sm font-medium text-slate-900">
                  {activeConversation?.updatedAt ? formatRelativeTime(activeConversation.updatedAt) : "No activity yet"}
                </p>
              </div>
            </div>
          </section>

          <section className="shrink-0 rounded-[28px] border border-slate-200 bg-white/95 p-5 shadow-[0_18px_36px_-30px_rgba(15,23,42,0.32)]">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Delegation Mode</p>
              <h2 className="mt-2 text-lg font-semibold text-slate-950">Runtime routing</h2>
            </div>
            <div className="mt-4 rounded-[20px] border border-slate-200 bg-slate-50/80 p-4">
              <div className="flex items-center gap-2 text-slate-900">
                <Workflow className="h-4 w-4 text-blue-700" />
                <p className="text-sm font-medium">
                  {humanize(activeRuntimeAgent?.routing_policy || selectedAgent?.routing_policy || "direct")}
                </p>
              </div>
              <p className="mt-3 text-xs leading-6 text-slate-600">
                The host agent can stay direct, orchestrate to specialists, or remain specialist-only depending on the
                workspace configuration.
              </p>
            </div>
          </section>

          <section className="flex min-h-0 flex-1 flex-col rounded-[28px] border border-slate-200 bg-white/95 p-5 shadow-[0_18px_36px_-30px_rgba(15,23,42,0.32)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Runtime Activity</p>
                <h2 className="mt-2 text-lg font-semibold text-slate-950">Latest events</h2>
              </div>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                {activityFeed.length}
              </span>
            </div>
            <div className="mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
              {activityFeed.length ? (
                activityFeed.map((event) => (
                  <div key={event.id} className="rounded-[20px] border border-slate-200 bg-slate-50/80 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-medium text-slate-900">{event.label}</p>
                      {event.state ? (
                        <span className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                          {humanize(event.state)}
                        </span>
                      ) : null}
                    </div>
                    {event.detail ? <p className="mt-2 text-xs leading-6 text-slate-600">{truncateText(event.detail, 140)}</p> : null}
                    {event.specialistSlug ? (
                      <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.16em] text-blue-700">
                        Specialist: {humanize(event.specialistSlug)}
                      </p>
                    ) : null}
                    <p className="mt-2 text-xs text-slate-500">{formatRelativeTime(event.receivedAt)}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-[20px] border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                  Runtime activity will appear here during and after conversation processing.
                </div>
              )}
            </div>
          </section>
          </div>
        </aside>
      </div>
    </div>
  )
}
