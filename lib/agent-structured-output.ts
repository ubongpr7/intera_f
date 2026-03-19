export type AgentStructuredPayload = Record<string, unknown>

export type DetectedInteractionRequest = {
  type: string
  data: AgentStructuredPayload
}

const asObject = (value: unknown): Record<string, unknown> | undefined => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined
  }
  return value as Record<string, unknown>
}

const asString = (value: unknown): string => (typeof value === "string" ? value : "")

const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : [])

const normalizeInteractionType = (payload: AgentStructuredPayload): string | undefined => {
  const interactionType = asString(payload.interaction_type).trim()
  if (interactionType === "confirmation_request") {
    return "confirmation"
  }
  if (interactionType) {
    return interactionType
  }

  const typed = asString(payload.type).trim()
  if (typed === "AGENT_CONFIRMATION_REQUEST") {
    return "confirmation"
  }
  if (typed.startsWith("AGENT_")) {
    return typed.replace("AGENT_", "").toLowerCase()
  }
  return undefined
}

const slugifyChoiceValue = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")

const splitTopLevelArgs = (source: string): string[] => {
  const args: string[] = []
  let current = ""
  let depth = 0
  let quote: "'" | '"' | null = null
  let escaped = false

  for (const char of source) {
    if (quote) {
      current += char
      if (escaped) {
        escaped = false
        continue
      }
      if (char === "\\") {
        escaped = true
        continue
      }
      if (char === quote) {
        quote = null
      }
      continue
    }

    if (char === "'" || char === '"') {
      quote = char
      current += char
      continue
    }

    if (char === "[" || char === "{" || char === "(") {
      depth += 1
      current += char
      continue
    }
    if (char === "]" || char === "}" || char === ")") {
      depth = Math.max(0, depth - 1)
      current += char
      continue
    }

    if (char === "," && depth === 0) {
      if (current.trim()) {
        args.push(current.trim())
      }
      current = ""
      continue
    }

    current += char
  }

  if (current.trim()) {
    args.push(current.trim())
  }

  return args
}

const normalizePythonLiteral = (raw: string) =>
  raw
    .replace(/\bTrue\b/g, "true")
    .replace(/\bFalse\b/g, "false")
    .replace(/\bNone\b/g, "null")
    .replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, (_, value: string) => JSON.stringify(value))

const parseLegacyLiteral = (raw: string): unknown => {
  const value = raw.trim()
  if (!value) {
    return ""
  }

  const normalized = normalizePythonLiteral(value)

  if (normalized.startsWith("{") || normalized.startsWith("[") || normalized.startsWith('"')) {
    try {
      return JSON.parse(normalized)
    } catch {
      return value
    }
  }

  if (/^-?\d+(\.\d+)?$/.test(normalized)) {
    return Number(normalized)
  }

  if (normalized === "true") {
    return true
  }
  if (normalized === "false") {
    return false
  }
  if (normalized === "null") {
    return null
  }

  return value.replace(/^["']|["']$/g, "")
}

const parseLegacyToolCodePayload = (toolCode: string): AgentStructuredPayload | undefined => {
  const trimmed = toolCode.trim().replace(/^print\(\s*/, "").replace(/\)\s*$/, "")
  const match = trimmed.match(/(create_[a-z_]+)\s*\(([\s\S]*)\)\s*$/i)
  if (!match) {
    return undefined
  }

  const functionName = match[1].trim().toLowerCase()
  const argsSource = match[2].trim()
  const parsedArgs: Record<string, unknown> = {}

  for (const entry of splitTopLevelArgs(argsSource)) {
    const eqIndex = entry.indexOf("=")
    if (eqIndex === -1) {
      continue
    }
    const key = entry.slice(0, eqIndex).trim()
    const rawValue = entry.slice(eqIndex + 1).trim()
    if (!key) {
      continue
    }
    parsedArgs[key] = parseLegacyLiteral(rawValue)
  }

  const interactionType =
    functionName === "create_confirmation_request"
      ? "confirmation_request"
      : functionName.replace(/^create_/, "")

  const payload: AgentStructuredPayload = {
    interaction_type: interactionType,
    ...parsedArgs,
  }

  if (!asString(payload.description).trim() && typeof payload.question === "string") {
    payload.description = payload.question
  }

  if (interactionType === "multiple_choice") {
    const options = Array.isArray(payload.options) ? payload.options : undefined
    const choices = Array.isArray(payload.choices) ? payload.choices : undefined

    if (!options && choices) {
      payload.options = choices.map((choice) => {
        if (typeof choice === "string") {
          return {
            value: slugifyChoiceValue(choice) || choice,
            label: choice,
          }
        }
        if (choice && typeof choice === "object") {
          const record = choice as Record<string, unknown>
          return {
            value: asString(record.value) || slugifyChoiceValue(asString(record.label) || "option"),
            label: asString(record.label) || asString(record.value) || "Option",
          }
        }
        return {
          value: "option",
          label: String(choice),
        }
      })
    }

    if (!asString(payload.title).trim()) {
      payload.title = "Make a selection"
    }
    if (typeof payload.multiple !== "boolean") {
      payload.multiple = false
    }
    if (typeof payload.allow_input !== "boolean") {
      payload.allow_input = Boolean(payload.allow_additional_input)
    }
  }

  return normalizeInteractionType(payload) ? payload : undefined
}

export const parseInteractionPayloadFromValue = (value: unknown): AgentStructuredPayload | undefined => {
  const payload = asObject(value)
  if (!payload) {
    return undefined
  }
  const legacyToolCode = asString(payload.tool_code).trim()
  if (legacyToolCode) {
    return parseLegacyToolCodePayload(legacyToolCode)
  }
  return normalizeInteractionType(payload) ? payload : undefined
}

export const parseInteractionPayloadFromText = (content: string): AgentStructuredPayload | undefined => {
  let raw = (content || "").trim()
  if (!raw) {
    return undefined
  }

  const jsonCodeBlockRegex = /```json\s*([\s\S]*?)\s*```/i
  const codeMatch = raw.match(jsonCodeBlockRegex)
  if (codeMatch?.[1]) {
    raw = codeMatch[1].trim()
  } else if (raw.startsWith("```")) {
    raw = raw.replace(/^```[a-zA-Z]*\s*/, "").replace(/\s*```$/, "").trim()
  }

  if (!(raw.startsWith("{") || raw.startsWith("["))) {
    return undefined
  }

  try {
    const parsed = JSON.parse(raw)
    return parseInteractionPayloadFromValue(parsed)
  } catch {
    return undefined
  }
}

export const extractInteractionPayloadFromParts = (parts: unknown): AgentStructuredPayload | undefined => {
  for (const part of asArray(parts)) {
    const record = asObject(part)
    if (!record) {
      continue
    }

    const kind = asString(record.kind).trim().toLowerCase()
    if (kind === "data") {
      const payload = parseInteractionPayloadFromValue(record.data)
      if (payload) {
        return payload
      }
      continue
    }

    if (kind === "tool-result") {
      const payload = parseInteractionPayloadFromValue(record.output)
      if (payload) {
        return payload
      }
      continue
    }

    if (kind === "text") {
      const payload = parseInteractionPayloadFromText(asString(record.text))
      if (payload) {
        return payload
      }
    }
  }

  return undefined
}

export const summarizeStructuredPayload = (payload?: AgentStructuredPayload): string => {
  if (!payload) {
    return ""
  }

  const title = asString(payload.title).trim()
  const description = asString(payload.description).trim()
  const status = asString(payload.status).trim()
  const normalizedType = normalizeInteractionType(payload)

  if (title && description) {
    return `${title}: ${description}`
  }
  if (description) {
    return description
  }
  if (title) {
    return title
  }
  if (status) {
    return status
  }
  if (normalizedType) {
    return normalizedType.replace(/_/g, " ")
  }
  return ""
}

export const detectInteractionRequest = (
  content: string,
  structuredPayload?: AgentStructuredPayload,
): DetectedInteractionRequest | null => {
  const payload = structuredPayload || parseInteractionPayloadFromText(content)
  if (!payload) {
    return null
  }

  const type = normalizeInteractionType(payload)
  if (!type) {
    return null
  }

  return {
    type,
    data: payload,
  }
}
