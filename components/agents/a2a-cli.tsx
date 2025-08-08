"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import AgentChat from "./chat-a2a-w"
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

type Role = "user" | "assistant"

export type ChatMessage = {
  id: string
  role: Role
  content: string
}

/**
 * Extracts human-readable text from a message "parts" array.
 * The backend returns parts like: [{ kind: 'text', text: 'Hello' }, ...]
 */
function partsToText(parts: any[] | undefined): string {
  if (!Array.isArray(parts)) return ""
  return parts
    .map((p) => {
      if (!p) return ""
      // Some responses wrap text like {kind:'text', text:'...'}, sometimes with metadata
      if (p.text && typeof p.text === "string") return p.text
      if (p.kind === "text" && typeof p.text === "string") return p.text
      return ""
    })
    .filter(Boolean)
    .join("\n")
}

/**
 * Maps server "message/list" results to our ChatMessage[]
 * - role 'agent' -> 'assistant'
 * - role 'user' -> 'user'
 */
function mapServerMessagesToClient(serverMessages: any[], sessionId: string) {
  const filtered = serverMessages.filter((m) =>
    // Prefer messages matching this session/context
    typeof m?.contextId === "string" ? m.contextId === sessionId : true
  )
  return filtered.map((m) => {
    const role = m?.role === "agent" ? ("assistant" as Role) : ("user" as Role)
    const text = partsToText(m?.parts)
    return {
      id: m?.messageId ?? uuidv4(),
      role,
      content: text,
      contextId: m?.contextId,
    }
  }) as (ChatMessage & { contextId?: string })[]
}

export default function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [isFullScreen, setIsFullScreen] = useState(false)
  const widgetRef = useRef<HTMLDivElement>(null)
  const toggleBtnRef = useRef<HTMLButtonElement>(null)

  // Conversation and UI state
  const [sessionId, setSessionId] = useState<string | null>(null)

  // Messages managed client-side; keep a map to dedupe by messageId
  const [messagesMap, setMessagesMap] = useState<Map<string, ChatMessage>>(new Map())
  const messages = useMemo(() => Array.from(messagesMap.values()), [messagesMap])

  // Live status
  const [pendingCount, setPendingCount] = useState(0)
  const [eventCount, setEventCount] = useState(0)
  const [taskCount, setTaskCount] = useState(0)
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null)

  // RTK Query hooks (do not modify slice; just use them)
  const [createConversation, { isLoading: isCreatingConversation }] = useCreateConversationMutation()
  const [sendMessage, { isLoading: isSendingMessage }] = useSendMessageMutation()
  const [listMessages] = useListMessagesMutation()
  const [pendingMessages] = usePendingMessagesMutation()
  const [getEvents] = useGetEventMutation()
  const [listTasks] = useListTaskMutation()

  const combinedLoading = isCreatingConversation || isSendingMessage

  const toggleChat = () => {
    setIsOpen((prev) => !prev)
    if (isFullScreen) setIsFullScreen(false)
  }
  const toggleFullScreen = () => setIsFullScreen((prev) => !prev)

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

  // ESC to close/exit full screen
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

  // Start a conversation when widget opens if none exists
  useEffect(() => {
    if (!isOpen || sessionId || isCreatingConversation) return
    ;(async () => {
      try {
        const resp = await createConversation({}).unwrap()
        // Expecting shape: { result: { conversation_id: string } }
        const id = resp?.result?.conversation_id
        if (typeof id === "string" && id.length > 0) {
          setSessionId(id)
          setMessagesMap(new Map()) // reset any old messages
        }
      } catch (err) {
        console.error("Failed to create conversation:", err)
      }
    })()
  }, [isOpen, sessionId, isCreatingConversation, createConversation])

  // Polling: messages, pending, events, tasks
  useEffect(() => {
    if (!isOpen || !sessionId) return
    let cancelled = false

    const poll = async () => {
      try {
        // 1) Messages
        try {
          const res = await listMessages({
            data: {
              id: uuidv4(),
              jsonrpc: "2.0",
              method: "message/list",
              params: sessionId,
            },
          } as any).unwrap()

          const serverMessages = Array.isArray(res?.result) ? res.result : []
          const mapped = mapServerMessagesToClient(serverMessages, sessionId)

          if (!cancelled && mapped.length) {
            setMessagesMap((prev) => {
              const next = new Map(prev)
              // Only keep messages belonging to this session
              for (const m of mapped) {
                // Deduplicate by id; ensure we only store role/content
                if (!next.has(m.id) && m.content?.trim().length > 0) {
                  next.set(m.id, { id: m.id, role: m.role, content: m.content })
                }
              }
              return next
            })
          }
        } catch (e) {
          // Swallow list errors to avoid breaking polling loop
          console.warn("message/list poll error:", e)
        }

        // 2) Pending
        try {
          const res = await pendingMessages({
            data: {
              id: uuidv4(),
              jsonrpc: "2.0",
              method: "message/pending",
              params: sessionId,
            },
          } as any).unwrap()
          const result = Array.isArray(res?.result) ? res.result : []
          // result looks like: [ [messageId, ""] , ... ] or []
          const count = result.length
          if (!cancelled) setPendingCount(count)
        } catch (e) {
          console.warn("message/pending poll error:", e)
        }

        // 3) Events
        try {
          const res = await getEvents({
            data: {
              id: uuidv4(),
              jsonrpc: "2.0",
              method: "events/get",
              params: sessionId,
            },
          } as any).unwrap()
          const events = Array.isArray(res?.result) ? res.result : []
          if (!cancelled) setEventCount(events.length)
        } catch (e) {
          console.warn("events/get poll error:", e)
        }

        // 4) Tasks
        try {
          const res = await listTasks({
            data: {
              id: uuidv4(),
              jsonrpc: "2.0",
              method: "task/list",
              params: sessionId,
            },
          } as any).unwrap()
          const tasks = Array.isArray(res?.result) ? res.result : []
          if (!cancelled) setTaskCount(tasks.length)
        } catch (e) {
          console.warn("task/list poll error:", e)
        }

        if (!cancelled) setLastUpdatedAt(Date.now())
      } catch (e) {
        console.warn("Polling error:", e)
      }
    }

    // Initial poll immediately, then at interval
    poll()
    const interval = setInterval(poll, 2500)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [isOpen, sessionId, listMessages, pendingMessages, getEvents, listTasks])

  // Send user message
  const handleSend = async (text: string) => {
    if (!text.trim() || combinedLoading || !sessionId) return
    const messageId = uuidv4()
    // Optimistic add
    setMessagesMap((prev) => {
      const next = new Map(prev)
      next.set(messageId, { id: messageId, role: "user", content: text })
      return next
    })

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
      // Do not manually fetch; polling will hydrate assistant response and pending status
    } catch (err) {
      console.error("send message error:", err)
      // Rollback optimistic item or mark as failed (simple rollback here)
      setMessagesMap((prev) => {
        const next = new Map(prev)
        next.delete(messageId)
        // Append an error bubble
        const errId = uuidv4()
        next.set(errId, {
          id: errId,
          role: "assistant",
          content: "Sorry, I couldn't process that request.",
        })
        return next
      })
    }
  }

  const chatWindowClasses = isFullScreen
    ? "fixed inset-0 w-full h-full rounded-none"
    : "absolute bottom-20 right-0 w-96 h-[560px] rounded-xl border border-gray-200"

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
            onClose={toggleChat}
            isFullScreen={isFullScreen}
            toggleFullScreen={toggleFullScreen}
            messages={messages}
            onSend={handleSend}
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
