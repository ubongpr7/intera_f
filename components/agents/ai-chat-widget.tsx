"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import AgentChat from "./agent-chat"
import { MessageSquareText, X } from 'lucide-react'
import {
  useCreateConversationMutation,
  useSendMessageMutation,
  useListMessagesMutation,
  usePendingMessagesMutation,
  useGetEventMutation,
  useListTaskMutation,
} from "@/redux/features/agent/agentAPISlice"
import { v4 as uuidv4 } from "uuid"
import { toast } from "react-toastify"


type Role = "user" | "assistant"

export type ChatMessage = {
  id: string
  role: Role
  content: string
}

function partsToText(parts: any[] | undefined): string {
  if (!Array.isArray(parts)) return ""
  return parts
    .map((p) => {
      if (!p) return ""
      if (p.text && typeof p.text === "string") return p.text
      if (p.kind === "text" && typeof p.text === "string") return p.text
      return ""
    })
    .filter(Boolean)
    .join("\n")
}

function mapServerMessagesToClient(serverMessages: any[], sessionId: string) {
  const filtered = serverMessages.filter((m) =>
    typeof m?.contextId === "string" ? m.contextId === sessionId : true
  )
  return filtered.map((m) => {
    const role = m?.role === "agent" ? ("assistant" as Role) : ("user" as Role)
    const text = partsToText(m?.parts)
    return {
      id: m?.messageId ?? uuidv4(),
      role,
      content: text,
    } as ChatMessage
  })
}

export default function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [isFullScreen, setIsFullScreen] = useState(false)
  const widgetRef = useRef<HTMLDivElement>(null)
  const toggleBtnRef = useRef<HTMLButtonElement>(null)

  // Conversation state
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messagesMap, setMessagesMap] = useState<Map<string, ChatMessage>>(new Map())
  const messages = useMemo(() => Array.from(messagesMap.values()), [messagesMap])

  // Live counters
  const [pendingCount, setPendingCount] = useState(0)
  const [eventCount, setEventCount] = useState(0)
  const [taskCount, setTaskCount] = useState(0)
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null)

  // Activity tracking (for auto-close)
  const [lastActivityAt, setLastActivityAt] = useState<number | null>(null)
  const prevSnapshotRef = useRef({ msgSize: 0, pending: 0, events: 0, tasks: 0 })


  // RTK Query hooks
  const [createConversation, { isLoading: isCreatingConversation }] = useCreateConversationMutation()
  const [sendMessage, { isLoading: isSendingMessage }] = useSendMessageMutation()
  const [listMessages] = useListMessagesMutation()
  const [pendingMessages] = usePendingMessagesMutation()
  const [getEvents] = useGetEventMutation()
  const [listTasks] = useListTaskMutation()

  const combinedLoading = isCreatingConversation || isSendingMessage

  const toggleChat = () => {
    setIsOpen((prev) => !prev)
    if (!isOpen) {
      // Just opened: mark activity now
      setLastActivityAt(Date.now())
    }
    if (isFullScreen) setIsFullScreen(false)
  }
  const toggleFullScreen = () => {
    setIsFullScreen((prev) => !prev)
    setLastActivityAt(Date.now())
  }

  // Close chat when clicking outside
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

  // ESC handling
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

  // Create conversation on open
  useEffect(() => {
    if (!isOpen || sessionId || isCreatingConversation) return
    ;(async () => {
      try {
        const resp = await createConversation({}).unwrap()
        const id = resp?.result?.conversation_id
        if (typeof id === "string" && id.length > 0) {
          setSessionId(id)
          setMessagesMap(new Map())
          setLastActivityAt(Date.now())
        }
      } catch (err) {
        console.error("Failed to create conversation:", err)
      }
    })()
  }, [isOpen, sessionId, isCreatingConversation, createConversation])

  // Poll messages/pending/events/tasks regularly while open
  useEffect(() => {
    if (!isOpen || !sessionId) return
    let cancelled = false

    const poll = async () => {
      let changeDetected = false

      // 1) Messages
      try {
        const res = await listMessages({
          data: { id: uuidv4(), jsonrpc: "2.0", method: "message/list", params: sessionId },
        } as any).unwrap()
        const serverMessages = Array.isArray(res?.result) ? res.result : []
        const mapped = mapServerMessagesToClient(serverMessages, sessionId)
        if (!cancelled && mapped.length) {
          // Calculate new messages to merge
          const newOnes = mapped.filter((m) => !messagesMap.has(m.id) && m.content?.trim())
          if (newOnes.length > 0) changeDetected = true
          if (newOnes.length > 0) {
            setMessagesMap((prev) => {
              const next = new Map(prev)
              for (const m of newOnes) next.set(m.id, m)
              return next
            })
          }
        }
      } catch (e) {
        console.warn("message/list poll error:", e)
      }

      // 2) Pending
      try {
        const res = await pendingMessages({
          data: { id: uuidv4(), jsonrpc: "2.0", method: "message/pending", params: sessionId },
        } as any).unwrap()
        const result = Array.isArray(res?.result) ? res.result : []
        const count = result.length
        if (!cancelled) {
          if (count !== prevSnapshotRef.current.pending) {
            changeDetected = true
          }
          setPendingCount(count)
        }
      } catch (e) {
        console.warn("message/pending poll error:", e)
      }

      // 3) Events
      try {
        const res = await getEvents({
          data: { id: uuidv4(), jsonrpc: "2.0", method: "events/get", params: sessionId },
        } as any).unwrap()
        const events = Array.isArray(res?.result) ? res.result : []
        // Filter to this conversation if available in content
        const filtered = events.filter((ev: any) => ev?.content?.contextId === sessionId)
        if (!cancelled) {
          if (filtered.length !== prevSnapshotRef.current.events) {
            changeDetected = true
          }
          setEventCount(filtered.length)
        }
      } catch (e) {
        console.warn("events/get poll error:", e)
      }

      // 4) Tasks
      try {
        const res = await listTasks({
          data: { id: uuidv4(), jsonrpc: "2.0", method: "task/list", params: sessionId },
        } as any).unwrap()
        const tasks = Array.isArray(res?.result) ? res.result : []
        const filtered = tasks.filter((t: any) => (t?.contextId ?? t?.content?.contextId) === sessionId)
        if (!cancelled) {
          if (filtered.length !== prevSnapshotRef.current.tasks) {
            changeDetected = true
          }
          setTaskCount(filtered.length)
        }
      } catch (e) {
        console.warn("task/list poll error:", e)
      }

      if (!cancelled) {
        // Update lastUpdatedAt every cycle
        setLastUpdatedAt(Date.now())

        // Update snapshot for inactivity detection
        const currentMsgSize = messagesMap.size
        if (currentMsgSize !== prevSnapshotRef.current.msgSize) changeDetected = true

        prevSnapshotRef.current = {
          msgSize: messagesMap.size,
          pending: pendingCount,
          events: eventCount,
          tasks: taskCount,
        }

        if (changeDetected) {
          setLastActivityAt(Date.now())
        }
      }
    }

    // Initial poll, then interval
    poll()
    const interval = setInterval(poll, 2500)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [
    isOpen,
    sessionId,
    listMessages,
    pendingMessages,
    getEvents,
    listTasks,
    messagesMap.size,
    pendingCount,
    eventCount,
    taskCount,
  ])

  // Inactivity auto-close: close after 3 minutes with no activity and no work in progress
  useEffect(() => {
    if (!isOpen) return
    const INACTIVITY_MS = 3 * 60 * 1000 // 3 minutes

    const ticker = setInterval(() => {
      if (!isOpen) return
      if (!lastActivityAt) return

      const now = Date.now()
      const idleFor = now - lastActivityAt

      // Don't close if any work is in progress
      const hasWork = pendingCount > 0 || taskCount > 0
      if (!hasWork && idleFor >= INACTIVITY_MS) {
        setIsOpen(false)
        toast.info("AI Assistant closed due to inactivity.")
        
      }
    }, 10000) // check every 10s

    return () => clearInterval(ticker)
  }, [isOpen, lastActivityAt, pendingCount, taskCount, toast])

  // Send user message
  const handleSend = async (text: string) => {
    if (!text.trim() || combinedLoading || !sessionId) return
    const messageId = uuidv4()
    setMessagesMap((prev) => {
      const next = new Map(prev)
      next.set(messageId, { id: messageId, role: "user", content: text })
      return next
    })
    setLastActivityAt(Date.now())

    try {
      const payload = {
        data: {
          jsonrpc: "2.0",
          id: uuidv4(),
          method: "message/send",
          params: {
            messageId,
            contextId: sessionId,
            role: "user",
            parts: [{ kind: "text", text }],
            kind: "message",
          },
          metadata: {
            blocking: true,
            accepted_output_modes: ["text/plain"],
          },
        },
      } as any
      await sendMessage(payload).unwrap()
      // Polling will ingest assistant messages
    } catch (err) {
      console.error("send message error:", err)
      setMessagesMap((prev) => {
        const next = new Map(prev)
        next.delete(messageId)
        const errId = uuidv4()
        next.set(errId, { id: errId, role: "assistant", content: "Sorry, I couldn't process that request." })
        return next
      })
    }
  }

  // User activity callback passed down to the chat (typing, toggling, etc.)
  const handleUserActivity = () => setLastActivityAt(Date.now())

  const chatWindowClasses = isFullScreen
    ? "fixed inset-0 w-full h-full rounded-none"
    : "absolute bottom-20 right-0 w-96 h-[600px] rounded-xl border border-gray-200"

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Toggle Button */}
      <button
        id="chat-toggle"
        ref={toggleBtnRef}
        onClick={toggleChat}
        className="bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-all transform hover:scale-110"
        aria-label={isOpen ? "Close AI Assistant" : "Open AI Assistant"}
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageSquareText className="h-6 w-6" />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div
          id="chat-widget"
          ref={widgetRef}
          className={`shadow-2xl flex flex-col overflow-hidden bg-white ${chatWindowClasses}`}
        >
          <AgentChat
            onClose={() => {
              setIsOpen(false)
            }}
            isFullScreen={isFullScreen}
            toggleFullScreen={() => {
              toggleFullScreen()
              handleUserActivity()
            }}
            messages={messages}
            onSend={handleSend}
            onActivity={handleUserActivity}
            isBusy={combinedLoading}
            pendingCount={pendingCount}
            taskCount={taskCount}
            eventCount={eventCount}
            lastUpdatedAt={lastUpdatedAt ?? undefined}
          />
        </div>
      )}
    </div>
  )
}
