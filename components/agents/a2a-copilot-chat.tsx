 "use client"

import { useEffect, useRef, useState } from "react"
import { Bot, Clock, ListChecks, Maximize, Minimize, Radio } from "lucide-react"

// CopilotKit UI. We keep functionality delegated to CopilotKit.
import { CopilotChat } from "@copilotkit/react-ui"

type A2ACopilotChatProps = {
  onClose: () => void
  isFullScreen: boolean
  toggleFullScreen: () => void
  // When no provider key is available, we still render the shell with a notice.
  noProvider?: boolean
}

export default function A2ACopilotChat({
  onClose,
  isFullScreen,
  toggleFullScreen,
  noProvider = false,
}: A2ACopilotChatProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const endRef = useRef<HTMLDivElement>(null)

  // UI-only counters/placeholders to keep a similar look-and-feel.
  // CopilotKit manages message functionality internally.
  const [pendingCount] = useState(0)
  const [taskCount] = useState(0)
  const [eventCount] = useState(0)
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null)

  // Simple timestamp refresher to mimic “Updated …”
  useEffect(() => {
    setLastUpdatedAt(Date.now())
    const t = setInterval(() => setLastUpdatedAt(Date.now()), 10000)
    return () => clearInterval(t)
  }, [])

  // Smart autoscroll helper for when CopilotChat content grows
  const [isAtBottom, setIsAtBottom] = useState(true)
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const onScroll = () => {
      const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 20
      setIsAtBottom(nearBottom)
    }
    el.addEventListener("scroll", onScroll)
    return () => el.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    if (isAtBottom) endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [isAtBottom])

  return (
    <>
      {/* Header (matches the style of your existing widget) */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4 flex items-center justify-between">
        {/* Left group: expand button + title */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={toggleFullScreen}
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
          <Bot className="h-5 w-5 text-white shrink-0" aria-hidden strokeWidth={2.2} />
          <h3 className="font-bold text-lg truncate">A2A Copilot</h3>

          {/* Badges (UI-only placeholders for now) */}
          <div className="ml-3 flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-1">
              <Radio
                className={`h-4 w-4 ${pendingCount > 0 ? "animate-pulse text-yellow-300" : "text-white"}`}
                aria-hidden
                strokeWidth={2.4}
              />
              <span>{pendingCount > 0 ? `${pendingCount} pending` : "Idle"}</span>
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-1">
              <ListChecks className="h-4 w-4 text-white" aria-hidden strokeWidth={2.4} />
              <span>{taskCount} tasks</span>
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-1">
              <Clock className="h-4 w-4 text-white" aria-hidden strokeWidth={2.4} />
              <span>{eventCount} events</span>
            </span>
          </div>
        </div>

        {/* Right group: timestamp + close */}
        <div className="flex items-center gap-2">
          {lastUpdatedAt ? (
            <span className="hidden sm:inline text-xs text-white/80">
              Updated {new Date(lastUpdatedAt).toLocaleTimeString()}
            </span>
          ) : null}
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/20 transition-colors"
            aria-label="Close chat"
            title="Close"
          >
            {/* Using a unicode × to avoid extra import; your toggle button already shows X when closed */}
            <span className="inline-block text-white text-xl leading-none select-none" aria-hidden>
              {"\u00D7"}
            </span>
          </button>
        </div>
      </div>

      {/* Body */}
      <div ref={scrollRef} className="relative flex-1 overflow-hidden bg-gray-50">
        {/* Note / fallback when no provider key is present */}
        {noProvider ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center text-sm text-gray-600">
            <p className="max-w-md">
              CopilotKit is not connected. Provide a public API key (NEXT_PUBLIC_COPILOTKIT_PUBLIC_API_KEY) to enable
              the chat functionality, or pass it as a prop to the widget.
            </p>
          </div>
        ) : (
          <div className="h-full overflow-y-auto custom-scrollbar p-3">
            {/* Delegates all chat functionality to CopilotKit */}
            <CopilotChat
              className="h-full"
              // You can tune these labels/placeholders to your brand
              labels={{
                title: "Assistant",
                initial: "How can I help you with your inventory or POS today?",
              }}
              // Optional: helper instructions
              instructions={{
                systemPrompt: "You are a helpful inventory and POS assistant. Provide concise, accurate answers.",
              }}
              // For appearance, keep minimal so it fits our shell
              // You can further theme via CSS variables if needed
            />
            <div ref={endRef} />
          </div>
        )}
      </div>
    </>
  )
}
