"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { MessageSquareText, X } from "lucide-react"
import { toast } from "react-toastify"

import AgentChat from "./agent-chat"
import { createSessionWithConfig, type ChatMessage } from "@/redux/features/ka2a/ka2aSlice"
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
  const [lastActivityAt, setLastActivityAt] = useState<number | null>(null)

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
  const eventCount = session?.eventLog.length ?? 0
  const taskCount = Object.keys(session?.runs ?? {}).length
  const lastUpdatedAt = useMemo(() => {
    const latest = session?.eventLog.at(-1)?.receivedAt
    if (!latest) {
      return undefined
    }
    const ts = new Date(latest).getTime()
    return Number.isNaN(ts) ? undefined : ts
  }, [session?.eventLog])
  const activeAgentName = session?.activeSpecialist || session?.agentName || "host"
  const statusText = session?.awaitingInput
    ? "Waiting for your answer to continue"
    : session?.currentStatusText || undefined

  const toggleChat = () => {
    setIsOpen((prev) => !prev)
    if (!isOpen) {
      setLastActivityAt(Date.now())
    }
    if (isFullScreen) setIsFullScreen(false)
  }

  const toggleFullScreen = () => {
    setIsFullScreen((prev) => !prev)
    setLastActivityAt(Date.now())
  }

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        isOpen &&
        !isFullScreen &&
        widgetRef.current &&
        !widgetRef.current.contains(e.target as Node) &&
        toggleBtnRef.current &&
        !toggleBtnRef.current.contains(e.target as Node)
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
    if (!isOpen || sessionId) {
      return
    }
    const id = createLocalId()
    setSessionId(id)
    dispatch(
      createSessionWithConfig({
        sessionId: id,
        title: "Assistant",
        agentName: "host",
        historyLength: 10,
        makeActive: false,
      }),
    )
    setLastActivityAt(Date.now())
  }, [dispatch, isOpen, sessionId])

  useEffect(() => {
    if (!isOpen) {
      return
    }
    setLastActivityAt(Date.now())
  }, [isOpen, messages.length, pendingCount, eventCount, taskCount])

  useEffect(() => {
    if (!isOpen) return
    const inactivityMs = 3 * 60 * 1000

    const ticker = setInterval(() => {
      if (!isOpen || !lastActivityAt) return
      const idleFor = Date.now() - lastActivityAt
      const hasWork = pendingCount > 0 || Boolean(session?.awaitingInput)
      if (!hasWork && idleFor >= inactivityMs) {
        setIsOpen(false)
        toast.info("AI Assistant closed due to inactivity.")
      }
    }, 10000)

    return () => clearInterval(ticker)
  }, [isOpen, lastActivityAt, pendingCount, session?.awaitingInput])

  const handleSend = async (text: string) => {
    if (!text.trim() || !sessionId) return
    setLastActivityAt(Date.now())
    await dispatch(sendStreamMessage({ text, sessionId }))
  }

  const handleUserActivity = () => setLastActivityAt(Date.now())

  const chatWindowClasses = isFullScreen
    ? "fixed inset-0 w-full h-full rounded-none"
    : "absolute bottom-20 right-0 max-w-[450px] h-[520px] rounded-xl border border-gray-200"

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
            taskCount={taskCount}
            eventCount={eventCount}
            lastUpdatedAt={lastUpdatedAt}
            activeAgentName={activeAgentName}
            statusText={statusText}
            awaitingInput={session?.awaitingInput ?? false}
          />
        </div>
      )}
    </div>
  )
}
