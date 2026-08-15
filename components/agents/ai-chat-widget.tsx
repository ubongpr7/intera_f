"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { MessageSquareText, X } from "lucide-react"
import { toast } from "react-toastify"

import AgentChat from "./agent-chat"
import { humanizeAgentDisplayName } from "@/lib/agent-display"
import { deriveWorkflowSummary } from "@/lib/agent-structured-output"
import { downloadJsonFile } from "@/lib/agent-export"
import {
  clearSession,
  createSessionWithConfig,
  eventReceived,
  streamEnded,
  streamStarted,
  syncedVoiceAssistantResolved,
  type ChatMessage,
  type Ka2aEvent,
} from "@/redux/features/ka2a/ka2aSlice"
import { sendStreamMessage } from "@/redux/features/ka2a/ka2aThunks"
import { useAppDispatch, useAppSelector } from "@/redux/store"

const createLocalId = () => {
  const cryptoAny = globalThis.crypto as { randomUUID?: () => string } | undefined
  if (cryptoAny?.randomUUID) {
    return cryptoAny.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export default function AIChatWidget() {
  const dispatch = useAppDispatch()
  const [isOpen, setIsOpen] = useState(false)
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const lastActivityAtRef = useRef<number | null>(null)
  const syncedVoiceTurnIdsRef = useRef<Set<string>>(new Set())
  const sessionIdRef = useRef<string | null>(null)

  const widgetRef = useRef<HTMLDivElement>(null)
  const toggleBtnRef = useRef<HTMLButtonElement>(null)

  const session = useAppSelector((state) => (sessionId ? state.ka2a.sessions[sessionId] : undefined))
  const messages = useMemo<ChatMessage[]>(
    () =>
      (session?.messages ?? []).map((message) => ({
        id: message.id,
        role: message.role,
        content: message.content,
        timestamp: message.timestamp,
        structuredPayload: message.structuredPayload,
      })),
    [session?.messages],
  )

  const pendingCount = session?.isStreaming ? 1 : 0
  const lastUpdatedAt = useMemo(() => {
    const latest = session?.eventLog.at(-1)?.receivedAt
    if (!latest) {
      return undefined
    }
    const ts = new Date(latest).getTime()
    return Number.isNaN(ts) ? undefined : ts
  }, [session?.eventLog])
  const activeAgentName = humanizeAgentDisplayName(session?.activeSpecialist || session?.agentName || "host")
  const statusText = session?.awaitingInput
    ? "Waiting for your answer to continue"
    : session?.currentStatusText || undefined
  const workflowSummary = useMemo(
    () =>
      deriveWorkflowSummary({
        messages,
        activeAgentName: humanizeAgentDisplayName(session?.agentName || "host"),
        activeSpecialistName: humanizeAgentDisplayName(session?.activeSpecialist || null),
        currentTaskState: session?.currentTaskState || null,
        awaitingInput: session?.awaitingInput,
        statusText,
      }),
    [
      messages,
      session?.activeSpecialist,
      session?.agentName,
      session?.awaitingInput,
      session?.currentTaskState,
      statusText,
    ],
  )

  const markActivity = () => {
    lastActivityAtRef.current = Date.now()
  }

  const ensureSessionId = useCallback(() => {
    if (sessionIdRef.current) {
      return sessionIdRef.current
    }

    const id = createLocalId()
    sessionIdRef.current = id
    setSessionId(id)
    dispatch(
      createSessionWithConfig({
        sessionId: id,
        title: "Assistant",
        agentName: "host",
        historyLength: 10,
        makeActive: true,
      }),
    )
    return id
  }, [dispatch])

  useEffect(() => {
    sessionIdRef.current = sessionId
  }, [sessionId])

  const toggleChat = () => {
    if (!isOpen && !sessionId) {
      ensureSessionId()
    }
    setIsOpen((prev) => !prev)
    if (!isOpen) {
      markActivity()
    }
    if (isFullScreen) setIsFullScreen(false)
  }

  const toggleFullScreen = () => {
    setIsFullScreen((prev) => !prev)
    markActivity()
  }

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const portalSelector = [
        '[data-radix-menu-content]',
        '[data-radix-popper-content-wrapper]',
        '[role="menu"]',
        '[data-ai-chat-export-menu]',
        '[data-ai-chat-export-panel]',
      ].join(", ")
      const eventPath = typeof e.composedPath === "function" ? e.composedPath() : []
      const isPortalMenuClick = eventPath.some((node) => node instanceof Element && node.matches(portalSelector))
      const target = e.target as Element | null
      const isInsideProtectedSurface = Boolean(target?.closest(portalSelector))
      if (
        isOpen &&
        !isFullScreen &&
        widgetRef.current &&
        !widgetRef.current.contains(e.target as Node) &&
        toggleBtnRef.current &&
        !toggleBtnRef.current.contains(e.target as Node) &&
        !isInsideProtectedSurface &&
        !isPortalMenuClick
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isOpen, isFullScreen])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isFullScreen) setIsFullScreen(false)
        else if (isOpen) setIsOpen(false)
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [isOpen, isFullScreen])

  useEffect(() => {
    if (!isOpen) {
      return
    }
    markActivity()
  }, [isOpen, messages.length, pendingCount])

  useEffect(() => {
    if (!isOpen) return
    const inactivityMs = 3 * 60 * 1000

    const ticker = setInterval(() => {
      if (!isOpen) return
      const lastActivityAt = lastActivityAtRef.current
      if (!lastActivityAt) return
      const idleFor = Date.now() - lastActivityAt
      const hasWork = pendingCount > 0 || Boolean(session?.awaitingInput)
      if (!hasWork && idleFor >= inactivityMs) {
        setIsOpen(false)
        toast.info("AI Assistant closed due to inactivity.")
      }
    }, 10000)

    return () => clearInterval(ticker)
  }, [isOpen, pendingCount, session?.awaitingInput])

  const handleSend = async (text: string) => {
    if (!text.trim()) return
    const resolvedSessionId = sessionIdRef.current ?? ensureSessionId()
    const resolvedSession = resolvedSessionId ? (resolvedSessionId === sessionId ? session : undefined) : undefined
    if ((resolvedSession ?? session)?.isStreaming) {
      toast.info("AI Assistant is still responding. Please wait for the current answer before sending another message.")
      return
    }
    markActivity()
    await dispatch(sendStreamMessage({ text, sessionId: resolvedSessionId }))
  }

  const handleUserActivity = () => markActivity()

  const handleSyncedVoiceTurnStart = (text: string, turnId: string) => {
    if (!text.trim() || syncedVoiceTurnIdsRef.current.has(turnId)) {
      return
    }
    const resolvedSessionId = sessionIdRef.current ?? ensureSessionId()
    syncedVoiceTurnIdsRef.current.add(turnId)
    markActivity()
    dispatch(streamStarted({ sessionId: resolvedSessionId, userText: text, silent: true, showUserMessage: true, turnId }))
  }

  const handleSyncedVoiceA2aEvent = (event: Ka2aEvent, turnId?: string) => {
    const resolvedSessionId = sessionIdRef.current ?? ensureSessionId()
    markActivity()
    dispatch(eventReceived({ sessionId: resolvedSessionId, event }))
    if (turnId) {
      syncedVoiceTurnIdsRef.current.add(turnId)
    }
  }

  const handleSyncedVoiceAssistantResult = (text: string, turnId?: string) => {
    if (!text.trim()) {
      return
    }
    const resolvedSessionId = sessionIdRef.current ?? ensureSessionId()
    markActivity()
    dispatch(syncedVoiceAssistantResolved({ sessionId: resolvedSessionId, content: text, turnId }))
  }

  const handleSyncedVoiceTurnEnd = (turnId?: string) => {
    const resolvedSessionId = sessionIdRef.current
    if (!resolvedSessionId) {
      return
    }
    markActivity()
    dispatch(streamEnded({ sessionId: resolvedSessionId, turnId }))
    if (turnId) {
      syncedVoiceTurnIdsRef.current.delete(turnId)
    }
  }

  const handleClearConversation = () => {
    if (!sessionId) return
    dispatch(clearSession({ sessionId }))
    syncedVoiceTurnIdsRef.current.clear()
    markActivity()
    toast.info("Started a new AI chat.")
  }

  const handleDownloadConversation = () => {
    if (!session) {
      toast.error("No AI conversation is available to download.")
      return
    }
    try {
      const payload = {
        exportedAt: new Date().toISOString(),
        source: "ai-chat-widget",
        sessionId: session.sessionId,
        title: session.title,
        agentName: session.agentName,
        activeSpecialist: session.activeSpecialist,
        contextId: session.contextId,
        lastTaskId: session.lastTaskId,
        currentTaskState: session.currentTaskState,
        awaitingInput: session.awaitingInput,
        messages: session.messages,
        runs: session.runs,
        eventLog: session.eventLog,
      }
      downloadJsonFile(payload, `ai-widget-conversation-${session.sessionId}.json`)
      toast.success("Conversation JSON downloaded.")
    } catch (error) {
      void error
      toast.error("Unable to download conversation JSON.")
    }
  }

  const chatWindowClasses = isFullScreen
    ? "fixed inset-0 w-full h-full rounded-none"
    : "absolute bottom-20 right-0  w-[90vw] sm:w-[520px] h-[600px]   rounded-xl border border-gray-200"

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        id="chat-toggle"
        ref={toggleBtnRef}
        onClick={toggleChat}
        className="bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-all transform hover:scale-110"
        aria-label={isOpen ? "Close AI Assistant" : "Open AI Assistant"}
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageSquareText className="h-6 w-6" />}
      </button>

      {isOpen && (
        <div
          id="chat-widget"
          ref={widgetRef}
          className={`shadow-2xl flex flex-col overflow-hidden bg-white ${chatWindowClasses}`}
        >
          <AgentChat
            onClose={() => setIsOpen(false)}
            isFullScreen={isFullScreen}
            toggleFullScreen={() => {
              toggleFullScreen()
              handleUserActivity()
            }}
            messages={messages}
            onSend={handleSend}
            onActivity={handleUserActivity}
            isBusy={session?.isStreaming ?? false}
            pendingCount={pendingCount}
            lastUpdatedAt={lastUpdatedAt}
            activeAgentName={activeAgentName}
            statusText={statusText}
            awaitingInput={session?.awaitingInput ?? false}
            workflowSummary={workflowSummary}
            onDownloadConversation={handleDownloadConversation}
            onClearConversation={handleClearConversation}
            onSyncedVoiceTurnStart={handleSyncedVoiceTurnStart}
            onSyncedVoiceA2aEvent={handleSyncedVoiceA2aEvent}
            onSyncedVoiceAssistantResult={handleSyncedVoiceAssistantResult}
            onSyncedVoiceTurnEnd={handleSyncedVoiceTurnEnd}
          />
        </div>
      )}
    </div>
  )
}
