"use client"

import { useMemo, useRef, useState } from "react"
import { MessageSquareText, X } from "lucide-react"
import A2ACopilotChat from "./a2a-copilot-chat"

import { CopilotKit } from "@copilotkit/react-core"

type A2ACopilotWidgetProps = {
  publicApiKey?: string
}

export default function A2ACopilotWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [isFullScreen, setIsFullScreen] = useState(false)
  const widgetRef = useRef<HTMLDivElement>(null)
  const toggleBtnRef = useRef<HTMLButtonElement>(null)
    const publicApiKey ='ck_pub_ee72aa0b7d73c3bf13d29bca3e44d0aa'
  const resolvedKey = useMemo(
    () =>
      publicApiKey ||
      (typeof window !== "undefined" ? (process.env.NEXT_PUBLIC_COPILOTKIT_PUBLIC_API_KEY as string) : ""),
    [publicApiKey],
  )

  const toggleChat = () => {
    setIsOpen((prev) => !prev)
    if (isFullScreen) setIsFullScreen(false)
  }
  const toggleFullScreen = () => setIsFullScreen((prev) => !prev)

  const chatWindowClasses = isFullScreen
    ? "fixed inset-0 w-full h-full rounded-none"
    : "absolute bottom-20 right-0 w-96 h-[600px] rounded-xl border border-gray-200"

  const ChatContainer = (
    <div
      id="a2a-copilot-widget"
      ref={widgetRef}
      className={`shadow-2xl flex flex-col overflow-hidden bg-white ${chatWindowClasses}`}
    >
      {resolvedKey ? (
        <CopilotKit runtimeUrl="/api/copilotkit" publicApiKey="ck_pub_ee72aa0b7d73c3bf13d29bca3e44d0aa" agent="weatherAgent">
          <A2ACopilotChat onClose={toggleChat} isFullScreen={isFullScreen} toggleFullScreen={toggleFullScreen} />
        </CopilotKit>
      ) : (
        <A2ACopilotChat
          onClose={toggleChat}
          isFullScreen={isFullScreen}
          toggleFullScreen={toggleFullScreen}
          noProvider
        />
      )}
    </div>
  )

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Toggle */}
      <button
        id="a2a-copilot-toggle"
        ref={toggleBtnRef}
        onClick={toggleChat}
        className="bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-all transform hover:scale-110"
        aria-label={isOpen ? "Close A2A Agent" : "Open A2A Agent"}
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageSquareText className="h-6 w-6" />}
      </button>

      {/* Chat */}
      {isOpen && ChatContainer}
    </div>
  )
}
