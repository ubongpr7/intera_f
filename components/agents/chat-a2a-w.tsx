"use client"

import { useEffect, useRef, useState } from "react"
import { Bot, Send, Maximize, Minimize, X, Clock, Loader2, ListChecks, Radio } from 'lucide-react'
import type { ChatMessage } from "./a2a-cli"

interface AgentChatProps {
  onClose: () => void
  isFullScreen: boolean
  toggleFullScreen: () => void

  messages: ChatMessage[]
  onSend: (text: string) => void

  isBusy?: boolean
  pendingCount?: number
  taskCount?: number
  eventCount?: number
  lastUpdatedAt?: number
}

export default function AgentChat(props: AgentChatProps) {
  const {
    onClose,
    isFullScreen,
    toggleFullScreen,
    messages,
    onSend,
    isBusy = false,
    pendingCount = 0,
    taskCount = 0,
    eventCount = 0,
    lastUpdatedAt,
  } = props

  const [input, setInput] = useState("")
  const messageEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const MAX_TEXTAREA_HEIGHT = 160 // px

  // Autoscroll
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isBusy, pendingCount])

  // Autofocus
  useEffect(() => {
    if (!isBusy && inputRef.current) inputRef.current.focus()
  }, [isBusy])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSend(input)
    setInput("")
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }

  function resizeTextarea(el: HTMLTextAreaElement) {
    el.style.height = "auto"
    const newHeight = Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT)
    el.style.height = `${newHeight}px`
    el.style.overflowY = el.scrollHeight > MAX_TEXTAREA_HEIGHT ? "auto" : "hidden"
  }

  useEffect(() => {
    if (textareaRef.current) resizeTextarea(textareaRef.current)
  }, [input])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as unknown as React.FormEvent)
    }
  }

  return (
    <>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4 flex items-center justify-between">
        {/* LEFT: Move fullscreen toggle here and ensure icons are visible */}
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
          <h3 className="font-bold text-lg truncate">AI Assistant</h3>

          {/* Status badges */}
          <div className="ml-3 flex items-center gap-2 text-xs">
            {/* Pending badge */}
            <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-1">
              <Radio
                className={`h-4 w-4 ${pendingCount > 0 ? "animate-pulse text-yellow-300" : "text-white"}`}
                aria-hidden
                strokeWidth={2.4}
              />
              <span>{pendingCount > 0 ? `${pendingCount} pending` : "Idle"}</span>
            </span>
            {/* Tasks badge */}
            <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-1">
              <ListChecks className="h-4 w-4 text-white" aria-hidden strokeWidth={2.4} />
              <span>{taskCount} tasks</span>
            </span>
            {/* Events badge */}
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-1">
              <Clock className="h-4 w-4 text-white" aria-hidden strokeWidth={2.4} />
              <span>{eventCount} events</span>
            </span>
          </div>
        </div>

        {/* RIGHT: Timestamp + close */}
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
            <X className="h-5 w-5 text-white" strokeWidth={2.2} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="text-center h-full flex flex-col items-center justify-center text-gray-500">
            <Bot className="h-12 w-12 mb-3 text-blue-500" aria-hidden strokeWidth={2.2} />
            <p>{"How can I help you today?"}</p>
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`mb-4 flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  m.role === "user" ? "bg-blue-500 text-white rounded-br-none" : "bg-gray-200 text-gray-800 rounded-bl-none"
                }`}
              >
                <div className="font-semibold text-xs mb-1">{m.role === "user" ? "You" : "Assistant"}</div>
                <div className="whitespace-pre-wrap">{m.content}</div>
              </div>
            </div>
          ))
        )}

        {/* Typing / processing indicator if pending */}
        {pendingCount > 0 && (
          <div className="flex justify-start mb-4">
            <div className="bg-gray-200 text-gray-800 rounded-2xl rounded-bl-none px-4 py-3 max-w-[80%]">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-gray-700" aria-hidden />
                <span>Assistant is processing...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messageEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t border-gray-200 p-3 bg-white">
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              if (textareaRef.current) resizeTextarea(textareaRef.current)
            }}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Type your message..."
            className="flex-1 text-gray-800 border border-gray-300 rounded-2xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none leading-6 max-h-[160px]"
            disabled={isBusy}
            aria-label="Type your message"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50"
            disabled={isBusy || !input.trim()}
            aria-label="Send message"
            title="Send"
          >
            <Send className="h-5 w-5 text-white" strokeWidth={2.2} />
          </button>
        </div>
      </form>
    </>
  )
}
