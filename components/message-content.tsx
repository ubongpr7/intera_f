"use client"

import { useState } from "react"
import { Copy, Check } from "lucide-react"

interface MessageContentProps {
  content: string
  role: "user" | "assistant"
}

// Simple code block detection - looks for triple backticks or indented code
function parseMessageContent(content: string) {
  // Handle undefined or null content
  if (!content || typeof content !== "string") {
    return [{ type: "text" as const, content: "" }]
  }

  const parts: Array<{ type: "text" | "code"; content: string; language?: string }> = []

  // Split by triple backticks first
  const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g
  let lastIndex = 0
  let match

  while ((match = codeBlockRegex.exec(content)) !== null) {
    // Add text before code block
    if (match.index > lastIndex) {
      const textBefore = content.slice(lastIndex, match.index)
      if (textBefore.trim()) {
        parts.push({ type: "text", content: textBefore })
      }
    }

    // Add code block
    const language = match[1] || "text"
    const code = match[2].trim()
    if (code) {
      parts.push({ type: "code", content: code, language })
    }

    lastIndex = match.index + match[0].length
  }

  // Add remaining text
  if (lastIndex < content.length) {
    const remainingText = content.slice(lastIndex)
    if (remainingText.trim()) {
      parts.push({ type: "text", content: remainingText })
    }
  }

  // If no code blocks found, check for inline code or return as single text block
  if (parts.length === 0) {
    // Check for inline code (single backticks)
    const inlineCodeRegex = /`([^`]+)`/g
    if (inlineCodeRegex.test(content)) {
      // For now, just return as text - could enhance this further
      parts.push({ type: "text", content })
    } else {
      parts.push({ type: "text", content })
    }
  }

  return parts
}

function CodeBlock({ content, language }: { content: string; language?: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy code:", err)
    }
  }

  return (
    <div className="relative group my-3">
      <div className="flex items-center justify-between bg-gray-800 text-gray-300 px-4 py-2 rounded-t-lg text-sm">
        <span className="font-mono text-xs">{language && language !== "text" ? language : "code"}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-1 rounded text-xs hover:bg-gray-700 transition-colors"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              Copy
            </>
          )}
        </button>
      </div>
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-b-lg overflow-x-auto text-sm leading-relaxed">
        <code className="font-mono">{content}</code>
      </pre>
    </div>
  )
}

function TextContent({ content }: { content: string }) {
  // Handle inline code with backticks
  if (!content) return null

  const parts = content.split(/(`[^`]+`)/)

  return (
    <div className="whitespace-pre-wrap">
      {parts.map((part, index) => {
        if (part.startsWith("`") && part.endsWith("`")) {
          const code = part.slice(1, -1)
          return (
            <code key={index} className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-sm font-mono">
              {code}
            </code>
          )
        }
        return <span key={index}>{part}</span>
      })}
    </div>
  )
}

export default function MessageContent({ content, role }: MessageContentProps) {
  const parts = parseMessageContent(content)

  return (
    <div className="space-y-1">
      {parts.map((part, index) => (
        <div key={index}>
          {part.type === "code" ? (
            <CodeBlock content={part.content} language={part.language} />
          ) : (
            <TextContent content={part.content} />
          )}
        </div>
      ))}
    </div>
  )
}
