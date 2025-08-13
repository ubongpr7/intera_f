"use client"

import { useState } from "react"
import { Copy, Check, Download } from "lucide-react"

interface MessageContentProps {
  content: string
  role: "user" | "assistant"
  onCopy?: () => void
  onExport?: () => void
}

// Enhanced syntax highlighting for different languages
function highlightCode(code: string, language: string) {
  const keywords: Record<string, string[]> = {
    javascript: [
      "function",
      "const",
      "let",
      "var",
      "if",
      "else",
      "for",
      "while",
      "return",
      "class",
      "import",
      "export",
      "from",
      "async",
      "await",
      "try",
      "catch",
      "finally",
      "throw",
      "new",
      "this",
      "super",
      "extends",
      "static",
      "public",
      "private",
      "protected",
    ],
    python: [
      "def",
      "class",
      "if",
      "elif",
      "else",
      "for",
      "while",
      "return",
      "import",
      "from",
      "as",
      "try",
      "except",
      "finally",
      "raise",
      "with",
      "lambda",
      "yield",
      "global",
      "nonlocal",
      "pass",
      "break",
      "continue",
      "and",
      "or",
      "not",
      "in",
      "is",
    ],
    json: ["true", "false", "null"],
    sql: [
      "SELECT",
      "FROM",
      "WHERE",
      "INSERT",
      "UPDATE",
      "DELETE",
      "CREATE",
      "TABLE",
      "INDEX",
      "DROP",
      "ALTER",
      "JOIN",
      "INNER",
      "LEFT",
      "RIGHT",
      "OUTER",
      "ON",
      "GROUP",
      "BY",
      "ORDER",
      "HAVING",
      "LIMIT",
      "OFFSET",
    ],
  }

  const langKeywords = keywords[language.toLowerCase()] || []
  const tokens: Array<{ text: string; type: string }> = []

  // Simple tokenization - split by spaces and special characters while preserving them
  const tokenRegex =
    /(\s+|[{}[\]().,;:=+\-*/%<>!&|^~"'`]|[a-zA-Z_][a-zA-Z0-9_]*|\d+\.?\d*|#.*$|\/\/.*$|\/\*[\s\S]*?\*\/)/g
  const matches = code.match(tokenRegex) || []

  const remaining = code
  let currentIndex = 0

  matches.forEach((match) => {
    const matchIndex = remaining.indexOf(match, currentIndex - (code.length - remaining.length))

    // Add any text before this match
    if (matchIndex > currentIndex - (code.length - remaining.length)) {
      const beforeText = code.slice(currentIndex, matchIndex + (code.length - remaining.length))
      if (beforeText) {
        tokens.push({ text: beforeText, type: "text" })
      }
    }

    // Determine token type
    let type = "text"

    if (langKeywords.includes(match)) {
      type = "keyword"
    } else if (/^["'].*["']$/.test(match)) {
      type = "string"
    } else if (/^\d+\.?\d*$/.test(match)) {
      type = "number"
    } else if (/^(#.*|\/\/.*|\/\*[\s\S]*\*\/)$/.test(match)) {
      type = "comment"
    } else if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(match) && code.charAt(code.indexOf(match) + match.length) === "(") {
      type = "function"
    } else if (/^[+\-*/%=<>!&|^~]$/.test(match)) {
      type = "operator"
    }

    tokens.push({ text: match, type })
    currentIndex = matchIndex + match.length + (code.length - remaining.length)
  })

  // Add any remaining text
  if (currentIndex < code.length) {
    tokens.push({ text: code.slice(currentIndex), type: "text" })
  }

  return tokens
}

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
        // Check if the text before contains auto-detectable code
        const processedTextParts = autoDetectCode(textBefore)
        parts.push(...processedTextParts)
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
      // Check if the remaining text contains auto-detectable code
      const processedTextParts = autoDetectCode(remainingText)
      parts.push(...processedTextParts)
    }
  }

  // If no code blocks found, check for auto-detectable code patterns
  if (parts.length === 0) {
    const processedParts = autoDetectCode(content)
    parts.push(...processedParts)
  }

  return parts
}

function autoDetectCode(text: string): Array<{ type: "text" | "code"; content: string; language?: string }> {
  const parts: Array<{ type: "text" | "code"; content: string; language?: string }> = []

  // Trim the text to check patterns
  const trimmedText = text.trim()

  // Check if the entire text is JSON
  if (isJSON(trimmedText)) {
    parts.push({ type: "code", content: trimmedText, language: "json" })
    return parts
  }

  // Check if the entire text is SQL
  if (isSQL(trimmedText)) {
    parts.push({ type: "code", content: trimmedText, language: "sql" })
    return parts
  }

  // Check if the entire text is Python code
  if (isPython(trimmedText)) {
    parts.push({ type: "code", content: trimmedText, language: "python" })
    return parts
  }

  // Check if the entire text is JavaScript code
  if (isJavaScript(trimmedText)) {
    parts.push({ type: "code", content: trimmedText, language: "javascript" })
    return parts
  }

  // If no code pattern detected, treat as regular text
  parts.push({ type: "text", content: text })
  return parts
}

function isJSON(text: string): boolean {
  try {
    const trimmed = text.trim()
    if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
      JSON.parse(trimmed)
      return true
    }
  } catch {
    // Not valid JSON
  }
  return false
}

function isSQL(text: string): boolean {
  const sqlKeywords = /^\s*(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|SHOW|DESCRIBE)\s+/i
  return sqlKeywords.test(text.trim())
}

function isPython(text: string): boolean {
  const pythonPatterns = [
    /^\s*def\s+\w+\s*\(/m, // function definition
    /^\s*class\s+\w+/m, // class definition
    /^\s*import\s+\w+/m, // import statement
    /^\s*from\s+\w+\s+import/m, // from import statement
    /^\s*if\s+__name__\s*==\s*['"']__main__['"']/m, // main guard
  ]
  return pythonPatterns.some((pattern) => pattern.test(text))
}

function isJavaScript(text: string): boolean {
  const jsPatterns = [
    /^\s*function\s+\w+\s*\(/m, // function declaration
    /^\s*const\s+\w+\s*=/m, // const declaration
    /^\s*let\s+\w+\s*=/m, // let declaration
    /^\s*var\s+\w+\s*=/m, // var declaration
    /^\s*import\s+.*from/m, // ES6 import
    /^\s*export\s+(default\s+)?/m, // ES6 export
  ]
  return jsPatterns.some((pattern) => pattern.test(text))
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

  const tokens = highlightCode(content, language || "text")

  const getTokenClassName = (type: string) => {
    switch (type) {
      case "keyword":
        return "text-purple-400 font-semibold"
      case "string":
        return "text-green-400"
      case "number":
        return "text-blue-300"
      case "comment":
        return "text-gray-500 italic"
      case "function":
        return "text-yellow-300"
      case "operator":
        return "text-red-400"
      default:
        return "text-gray-100"
    }
  }

  return (
    <div className="relative group my-4">
      {/* macOS-style window controls */}
      <div className="flex items-center justify-between bg-gray-800 text-gray-300 px-4 py-3 rounded-t-lg">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <span className="font-mono text-sm text-gray-400">{language && language !== "text" ? language : "code"}</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm hover:bg-gray-700 transition-colors border border-gray-600"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 text-green-400" />
              <span className="text-green-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-b-lg overflow-x-auto text-sm leading-relaxed border-l-4 border-blue-500">
        <code className="font-mono">
          {tokens.map((token, index) => (
            <span key={index} className={getTokenClassName(token.type)}>
              {token.text}
            </span>
          ))}
        </code>
      </pre>
    </div>
  )
}

function TextContent({ content }: { content: string }) {
  // Handle inline code with backticks and markdown formatting
  if (!content) return null

  let processedContent = content

  // Handle bold text **text**
  processedContent = processedContent.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')

  // Handle italic text *text*
  processedContent = processedContent.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em class="italic">$1</em>')

  // Handle inline code `code`
  processedContent = processedContent.replace(
    /`([^`]+)`/g,
    '<code class="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm font-mono border">$1</code>',
  )

  // Handle links [text](url)
  processedContent = processedContent.replace(
    /\[([^\]]+)\]$$([^)]+)$$/g,
    '<a href="$2" class="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer">$1</a>',
  )

  return <div className="whitespace-pre-wrap leading-relaxed" dangerouslySetInnerHTML={{ __html: processedContent }} />
}

export default function MessageContent({ content, role, onCopy, onExport }: MessageContentProps) {
  const parts = parseMessageContent(content)

  return (
    <div className="space-y-2 relative group">
      {/* Message actions - only show for assistant messages */}
      {role === "assistant" && (
        <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
          <button
            onClick={onCopy}
            className="p-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
            title="Copy message"
          >
            <Copy className="h-4 w-4 text-gray-600" />
          </button>
          <button
            onClick={onExport}
            className="p-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
            title="Export message"
          >
            <Download className="h-4 w-4 text-gray-600" />
          </button>
        </div>
      )}

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
