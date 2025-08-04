"use client"

import type React from "react"

import { getCookie } from "cookies-next"
import { useState, useRef, useEffect } from "react"
import { Bot, Send, Maximize, Minimize, X } from "lucide-react" // Added Maximize, Minimize, X

type MessageRole = "user" | "assistant"
type Message = {
  role: MessageRole
  content: string
}

interface AgentChatProps {
  onClose: () => void
  isFullScreen: boolean // New prop
  toggleFullScreen: () => void // New prop
}

export default function AgentChat({ onClose, isFullScreen, toggleFullScreen }: AgentChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messageEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [sessionId, setSessionId] = useState(null) // Retaining sessionId for functionality

  const getAuthHeaders = () => {
    const token = getCookie("accessToken") // Or from your auth context
    const profileId = getCookie("profile")

    return {
      Authorization: `Bearer ${token}`,
      "X-Profile-ID": `${profileId}`,
    }
  }

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
      const response = await fetch("http://localhost:8000/api/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          message: userMessage.content, // Send only the current message content
          session_id: sessionId,
        }),
      })

      if (!response.ok) {
        throw new Error(await response.text())
      }

      const data = await response.json()

      // Update session ID if this is the first message
      if (!sessionId) {
        setSessionId(data.session_id)
      }

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

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading]) // Scroll when messages or loading state changes

  useEffect(() => {
    if (!isLoading && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isLoading])

  return (
    <>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4 flex items-center justify-between">
        <div className="flex items-center">
          <Bot className="mr-2 h-5 w-5" />
          <h3 className="font-bold text-lg">AI Assistant</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleFullScreen}
            className="p-1 rounded-full hover:bg-white/20 transition-colors"
            aria-label={isFullScreen ? "Exit full screen" : "Enter full screen"}
          >
            {isFullScreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/20 transition-colors"
            aria-label="Close chat"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="text-center h-full flex flex-col items-center justify-center text-gray-500">
            <Bot className="h-12 w-12 mb-3 text-blue-500" />
            <p>How can I help you today?</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className={`mb-4 flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-blue-500 text-white rounded-br-none"
                    : "bg-gray-200 text-gray-800 rounded-bl-none"
                }`}
              >
                <div className="font-semibold text-xs mb-1">{msg.role === "user" ? "You" : "Assistant"}</div>
                <div className="whitespace-pre-wrap">{msg.content}</div>
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex justify-start mb-4">
            <div className="bg-gray-200 text-gray-800 rounded-2xl rounded-bl-none px-4 py-3 max-w-[80%]">
              <div className="flex items-center">
                <div className="animate-pulse h-2 w-2 bg-gray-500 rounded-full mr-1"></div>
                <div className="animate-pulse h-2 w-2 bg-gray-500 rounded-full mr-1"></div>
                <div className="animate-pulse h-2 w-2 bg-gray-500 rounded-full"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messageEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="border-t border-gray-200 p-3 bg-white">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 text-gray-100 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
            aria-label="Type your message"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50"
            disabled={isLoading || !input.trim()}
            aria-label="Send message"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </form>
    </>
  )
}
