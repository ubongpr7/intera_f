"use client"

import type React from "react"

import { useRef, useEffect } from "react" // Keep useState, useRef, useEffect for internal UI logic
import { Bot, Send, Maximize, Minimize, X } from "lucide-react"

type MessageRole = "user" | "assistant"
type Message = {
  role: MessageRole
  content: string
}

interface AgentChatProps {
  onClose: () => void
  isFullScreen: boolean
  toggleFullScreen: () => void
  // New props for chat state and actions
  messages: Message[]
  input: string
  isLoading: boolean
  setInput: (input: string) => void
  handleSubmit: (e: React.FormEvent) => Promise<void>
}

export default function AgentChat({
  onClose,
  isFullScreen,
  toggleFullScreen,
  messages,
  input,
  isLoading,
  setInput,
  handleSubmit,
}: AgentChatProps) {
  const messageEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Scroll to bottom when messages or loading state changes
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

  // Focus input when not loading
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
            className="flex-1 text-gray-800 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
