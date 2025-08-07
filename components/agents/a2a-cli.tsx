"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { MessageSquareText, X } from 'lucide-react'
import AgentChat from "./chat-a2a-w"
import { v4 as uuidv4 } from "uuid" // Import uuid for session_id
import {
  useSendMessageMutationMutation,
  useCreateConversationMutationMutation,
} from "@/redux/features/agent/agentAPISlice"
import {
  AgentCard,
  Task,
  TaskState,
  TaskStatusUpdateEvent,
  TextPart,
  Message as A2AMessage,
} from "@a2a-js/sdk";


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

  // Lifted state for chat history
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [sessionId, setSessionId] = useState<string | null>(null) // This will be our conversation_id

  // Redux Toolkit Query mutation hooks
  const [askAgent, { isLoading: isSendingMessage }] = useSendMessageMutationMutation()
  const [createConversation, { isLoading: isCreatingConversation }] = useCreateConversationMutationMutation()
  // const [listMessages, { isLoading: isListingMessages }] = useListMessagesMutationMutation(); // Not used effectively

  const isLoading = isSendingMessage || isCreatingConversation // Combined loading state

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

  // Effect to create a new conversation when the chat opens if no session exists
  useEffect(() => {
    if (isOpen && !sessionId && !isCreatingConversation) {
      const startNewConversation = async () => {
        try {
          const response = await createConversation({}).unwrap()
          console.log("New conversation started with ID:", response.result.conversation_id, 'response: ', response)
          setSessionId(response.result.conversation_id)
          setMessages([]) 
        } catch (error) {
          console.error("Error creating new conversation:", error)
          alert("Failed to start a new conversation. Please try again.")
        }
      }
      startNewConversation()
    }
  }, [isOpen, sessionId, isCreatingConversation, createConversation])

  // handleSubmit function now uses RTK Query mutation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading || !sessionId) return // Ensure sessionId exists before sending

    const userMessage: Message = {
      role: "user",
      content: input,
    }
    setMessages((prev) => [...prev, userMessage]) // Optimistic update
    setInput("")

    try {
      // Call the RTK Query mutation
      const response = await askAgent({
        data: {
          message: userMessage.content,
          session_id: sessionId, // Use the generated/existing sessionId
        },
      }).unwrap() // .unwrap() to get the actual response or throw an error

      const assistantMessage: Message = {
        role: "assistant",
        content: response.response, // Access response from the mutation result
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
    }
  }

  const chatWindowClasses = isFullScreen
    ? "fixed inset-0 w-full h-full rounded-none"
    : "absolute bottom-20 right-0 w-96 h-[500px] rounded-xl border border-gray-200"

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
            isLoading={isLoading} // Pass combined isLoading from RTK Query
            setInput={setInput}
            handleSubmit={handleSubmit}
          />
        </div>
      )}
    </div>
  )
}
