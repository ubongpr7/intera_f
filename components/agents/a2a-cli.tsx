"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { MessageSquareText, X } from "lucide-react"
import AgentChat from "./chat-a2a-w"
import { getCookie } from "cookies-next" // Import getCookie here
import { v4 as uuidv4 } from "uuid" // Import uuid for session_id

type MessageRole = "user" | "assistant"
type Message = {
  role: MessageRole
  content: string
}

export default function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [isFullScreen, setIsFullScreen] = useState(false)
  const widgetRef = useRef<HTMLDivElement>(null)
  const toggleBtnRef = useRef<HTMLButtonElement>(null)

  // Lifted state from AgentChat
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)

  const toggleChat = () => {
    setIsOpen((prev) => !prev)
    if (isFullScreen) {
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
        !isFullScreen &&
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

  // getAuthHeaders function (moved from AgentChat)
  const getAuthHeaders = () => {
    const token = getCookie("accessToken")
    const profileId = getCookie("profile")
    return {
      Authorization: `Bearer ${token}`,
      "X-Profile-ID": `${profileId}`,
    }
  }

  // handleSubmit function (moved from AgentChat)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      role: "user",
      content: input,
    }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput("")
    setIsLoading(true)

    try {
      const currentSessionId = sessionId || uuidv4() // Generate new session ID if not exists
      if (!sessionId) {
        setSessionId(currentSessionId)
      }

      const response = await fetch("http://localhost:8000/api/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          message: userMessage.content,
          session_id: currentSessionId,
        }),
      })

      if (!response.ok) {
        throw new Error(await response.text())
      }

      const data = await response.json()

      const assistantMessage: Message = {
        role: "assistant",
        content: data.response,
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Error talking to agent:", error)
      const errorMessage: Message = {
        role: "assistant",
        content: "Sorry, I couldn't process that request.",
      }
      setMessages((prev) => [...prev, errorMessage])
      alert("Error communicating with agent. Please check console for details.")
    } finally {
      setIsLoading(false)
    }
  }

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
          <AgentChat
            onClose={toggleChat}
            isFullScreen={isFullScreen}
            toggleFullScreen={toggleFullScreen}
            messages={messages}
            input={input}
            isLoading={isLoading}
            setInput={setInput}
            handleSubmit={handleSubmit}
          />
        </div>
      )}
    </div>
  )
}
