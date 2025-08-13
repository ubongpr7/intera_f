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
function highlightCode(code: string, language: string): string {
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
    html: [
      "html",
      "head",
      "body",
      "div",
      "span",
      "p",
      "a",
      "img",
      "ul",
      "ol",
      "li",
      "table",
      "tr",
      "td",
      "th",
      "form",
      "input",
      "button",
      "script",
      "style",
      "link",
      "meta",
    ],
    css: [
      "color",
      "background",
      "margin",
      "padding",
      "border",
      "width",
      "height",
      "display",
      "position",
      "top",
      "left",
      "right",
      "bottom",
      "font",
      "text",
      "flex",
      "grid",
    ],
  }

  let highlighted = code
  const langKeywords = keywords[language.toLowerCase()] || []

  // Highlight strings (single and double quotes)
  highlighted = highlighted.replace(/(["'])((?:\\.|(?!\1)[^\\])*?)\1/g, '<span class="text-green-400">$1$2$1</span>')

  // Highlight numbers
  highlighted = highlighted.replace(/\b(\d+\.?\d*)\b/g, '<span class="text-blue-300">$1</span>')

  // Highlight comments
  if (language === "python") {
    highlighted = highlighted.replace(/(#.*$)/gm, '<span class="text-gray-500 italic">$1</span>')
  } else if (["javascript", "java", "c", "cpp"].includes(language)) {
    highlighted = highlighted.replace(/(\/\/.*$)/gm, '<span class="text-gray-500 italic">$1</span>')
    highlighted = highlighted.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="text-gray-500 italic">$1</span>')
  }

  // Highlight keywords
  langKeywords.forEach((keyword) => {
    const regex = new RegExp(`\\b(${keyword})\\b`, "g")
    highlighted = highlighted.replace(regex, '<span class="text-purple-400 font-semibold">$1</span>')
  })

  // Highlight function calls
  highlighted = highlighted.replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g, '<span class="text-yellow-300">$1</span>(')

  // Highlight operators
  highlighted = highlighted.replace(/([+\-*/%=<>!&|^~])/g, '<span class="text-red-400">$1</span>')

  return highlighted
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
    parts.push({ type: "text", content })
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

  const highlightedCode = highlightCode(content, language || "text")

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
        <code className="font-mono" dangerouslySetInnerHTML={{ __html: highlightedCode }} />
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
