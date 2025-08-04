"use client"

import { useState, useEffect, useRef } from "react"
import { MessageSquareText, X } from "lucide-react"
import AgentChat from "./chat-a2a-w"

export default function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [isFullScreen, setIsFullScreen] = useState(false) // New state for full screen
  const widgetRef = useRef<HTMLDivElement>(null)
  const toggleBtnRef = useRef<HTMLButtonElement>(null)

  const toggleChat = () => {
    setIsOpen((prev) => !prev)
    if (isFullScreen) {
      // If closing from full screen, reset full screen state
      setIsFullScreen(false)
    }
  }

  const toggleFullScreen = () => {
    setIsFullScreen((prev) => !prev)
  }

  // Close chat when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        !isFullScreen && // Only close on outside click if not full screen
        widgetRef.current &&
        !widgetRef.current.contains(event.target as Node) &&
        toggleBtnRef.current &&
        !toggleBtnRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isOpen, isFullScreen])

  // Handle Escape key to close or exit full screen
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (isFullScreen) {
          setIsFullScreen(false)
        } else if (isOpen) {
          setIsOpen(false)
        }
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, isFullScreen])

  const chatWindowClasses = isFullScreen
    ? "fixed inset-0 w-full h-full rounded-none" // Full screen
    : "absolute bottom-20 right-0 w-96 h-[500px] rounded-xl border border-gray-200" // Normal size

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
          <AgentChat onClose={toggleChat} isFullScreen={isFullScreen} toggleFullScreen={toggleFullScreen} />
        </div>
      )}
    </div>
  )
}
