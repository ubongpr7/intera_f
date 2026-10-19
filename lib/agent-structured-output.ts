export type AgentStructuredPayload = Record<string, unknown>

export type WorkflowStepStatus = "completed" | "current" | "pending"

export type WorkflowStepSummary = {
  key: string
  label: string
  status: WorkflowStepStatus
}

export type AgentWorkflowSummary = {
  title: string
  detail?: string
  statusLabel: string
  tone: "ready" | "working" | "awaiting"
  steps: WorkflowStepSummary[]
  currentAgentLabel?: string
  nextAgentLabel?: string
}

export type DetectedInteractionRequest = {
  type: string
  data: AgentStructuredPayload
}

export type DetectedInsightResponse = {
  data: AgentStructuredPayload
}

export type InteractionResponseSummary = {
  type: string
  title: string
  detail?: string
}

/**
 * Detects Python/A2A part representations that can leak through as text when
 * an event is serialized twice. These are transport/debug values, not user
 * facing assistant content.
 */
export const isTransportDebugText = (value: string): boolean => {
  const normalized = value.trim()
  return /^\[\s*(?:TextPart|DataPart|FilePart|ToolCallPart|ToolResultPart|MessagePart)\s*\(/i.test(normalized)
}

const asObject = (value: unknown): Record<string, unknown> | undefined => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined
  }
  return value as Record<string, unknown>
}

const asRecord = asObject

const asString = (value: unknown): string => (typeof value === "string" ? value : "")

const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : [])

const partKind = (part: Record<string, unknown>): string =>
  asString(part.kind || part.type).trim().toLowerCase()

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

const isInsightResponse = (payload: AgentStructuredPayload): boolean =>
  (asString(payload.kind).trim() === "insight_response" || asString(payload.type).trim() === "insight_response") &&
  Array.isArray(payload.widgets)

const normalizeInsightWidget = (widgetValue: unknown): AgentStructuredPayload | undefined => {
  const widget = asObject(widgetValue)
  if (!widget) {
    return undefined
  }
  const type = asString(widget.type).trim().toLowerCase()
  if (type === "comparison") {
    const rows = asArray(widget.ranked_suppliers ?? widget.items)
      .map((item) => asRecord(item))
      .filter(Boolean) as Array<Record<string, unknown>>
    return {
      ...widget,
      type: "comparison_table",
      columns: rows.length
        ? Object.keys(rows[0]).map((key) => ({ key, label: key.replace(/_/g, " ") }))
        : ["supplier", "delayed_po_count"],
      rows,
    }
  }
  if (type === "timeline") {
    const events = asArray(widget.events ?? widget.items)
      .map((item) => asRecord(item))
      .filter(Boolean)
      .map((item) => ({
        title: asString(item?.title || item?.po_reference || item?.reference || item?.event_name) || "Event",
        detail: asString(item?.detail || item?.notes || item?.summary),
        timestamp: asString(item?.timestamp || item?.expected_delivery_date),
      }))
    return { ...widget, type: "timeline", events }
  }
  if (type === "risk") {
    return {
      ...widget,
      type: "risk_panel",
      severity: asString(widget.severity || widget.rating || "warning").toLowerCase(),
      items: [{
        label: asString(widget.rating || "Operational risk"),
        detail: asString(widget.explanation || widget.detail),
      }],
    }
  }
  return widget
}

const normalizeInsightPayload = (payload: AgentStructuredPayload): AgentStructuredPayload | undefined => {
  if (!Array.isArray(payload.widgets)) {
    return undefined
  }
  return {
    ...payload,
    kind: "insight_response",
    widgets: payload.widgets.map(normalizeInsightWidget).filter(Boolean),
  }
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

const buildLegacyInteractionPayload = (
  functionName: string,
  parsedArgs: Record<string, unknown>,
): AgentStructuredPayload | undefined => {
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

  return buildLegacyInteractionPayload(functionName, parsedArgs)
}

const unquoteSerializedValue = (value: string): string =>
  value.trim().replace(/^['"]|['"]$/g, "").replace(/\\(['"])/g, "$1")

const parseSerializedInsightWidgetResponse = (content: string): AgentStructuredPayload | undefined => {
  const raw = content.trim()
  if (!/^insight_response\s*:/im.test(raw) || !/^\s*-?\s*widgets\s*:/im.test(raw)) {
    return undefined
  }

  const lineValue = (pattern: RegExp): string => unquoteSerializedValue(raw.match(pattern)?.[1] || "")
  const summary = lineValue(/^\s*-\s*summary:\s*(.+)$/im)
  const widgets: AgentStructuredPayload[] = []

  // Newer specialists serialize the insight envelope as YAML-like text with
  // `widgets:` (without the legacy list marker). Convert its common typed
  // sections before the raw text can reach the conversation renderer.
  const scalar = (value: string): unknown => {
    const normalized = unquoteSerializedValue(value)
    if (normalized === "null") return null
    if (/^-?\d+(\.\d+)?$/.test(normalized)) return Number(normalized)
    return normalized
  }
  const genericBlocks = [...raw.matchAll(/^\s*-\s*type:\s*([^\n]+)\n([\s\S]*?)(?=^\s*-\s*type:|\s*$)/gim)]
  for (const match of genericBlocks) {
    const type = unquoteSerializedValue(match[1]).toLowerCase()
    const block = match[2]
    const title = type.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
    const dataLines = [...block.matchAll(/^\s{6,}([a-z_]+):\s*(.+)$/gim)]
    if (type === "pipeline_counts") {
      widgets.push({
        type: "metric_grid",
        title: "Purchase order pipeline",
        data: dataLines.map((item) => ({ label: item[1].replace(/_/g, " "), value: scalar(item[2]), value_kind: "count" })),
      })
      continue
    }
    const itemBlocks = [...block.matchAll(/^\s*-\s+([a-z_]+):\s*(.+?)(?=\n\s*-\s+[a-z_]+:|$)/gim)]
    if (["recent_purchase_orders", "receiving_exceptions"].includes(type)) {
      const rows: Record<string, unknown>[] = []
      for (let index = 0; index < itemBlocks.length; index += 1) {
        const first = itemBlocks[index]
        const row: Record<string, unknown> = { [first[1]]: scalar(first[2]) }
        const remainder = block.slice(first.index! + first[0].length, itemBlocks[index + 1]?.index ?? block.length)
        for (const field of remainder.matchAll(/^\s+([a-z_]+):\s*(.+)$/gim)) row[field[1]] = scalar(field[2])
        rows.push(row)
      }
      if (rows.length) {
        widgets.push({ type: "comparison_table", title, columns: Object.keys(rows[0]).map((key) => ({ key, label: key.replace(/_/g, " ") })), rows })
      }
      continue
    }
    if (type === "risks_and_next_actions") {
      const risks = [...block.matchAll(/^\s*-\s*risk:\s*(.+?)(?=\n\s+[a-z_]+:|$)[\s\S]*?(?=^\s*-\s*risk:|$)/gim)]
      widgets.push({
        type: "text_list",
        title: "Risks and next actions",
        items: risks.map((risk) => ({ detail: unquoteSerializedValue(risk[1]) })),
      })
    }
  }

  const comparisonMatch = raw.match(
    /-\s*comparison:\s*\n\s*-\s*title:\s*(.+?)\n\s*-\s*items:\s*([\s\S]*?)(?=\n\s*-\s*(?:timeline|risk|progress):|\n\s*(?:Evidence|Next steps)|$)/im,
  )
  if (comparisonMatch) {
    const itemLines = comparisonMatch[2]
      .split(/\n\s*-\s+/)
      .map((item) => item.trim())
      .filter(Boolean)
    const rows = itemLines.map((item) => {
      const supplier = unquoteSerializedValue(item.match(/supplier:\s*([^,]+?)(?=,\s*exceptions:|$)/i)?.[1] || "")
      const exceptions = Number(item.match(/exceptions:\s*(\d+)/i)?.[1] || 0)
      const share = unquoteSerializedValue(item.match(/share:\s*([^,]+)$/i)?.[1] || "")
      const others = unquoteSerializedValue(item.match(/others:\s*(\d+)/i)?.[1] || "")
      return supplier
        ? { supplier, exceptions, ...(share ? { share } : {}) }
        : { supplier: "Others", exceptions: Number(others || exceptions) }
    })
    widgets.push({
      type: "comparison_table",
      title: unquoteSerializedValue(comparisonMatch[1]),
      columns: [
        { key: "supplier", label: "Supplier" },
        { key: "exceptions", label: "Open exceptions", format: "number" },
        { key: "share", label: "Share" },
      ],
      rows,
    })
  }

  const timelineMatch = raw.match(
    /-\s*timeline:\s*\n\s*-\s*title:\s*(.+?)\n\s*-\s*items:\s*([\s\S]*?)(?=\n\s*-\s*source:|\n\s*-\s*(?:risk|progress):|\n\s*(?:Evidence|Next steps)|$)/im,
  )
  if (timelineMatch) {
    const events = timelineMatch[2]
      .split(/\n\s*-\s+/)
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => ({
        title: unquoteSerializedValue(item.match(/reference:\s*([^,]+?)(?=,\s*note:|$)/i)?.[1] || "Event"),
        detail: unquoteSerializedValue(item.match(/note:\s*(.+)$/i)?.[1] || ""),
      }))
    const source = lineValue(/\n\s*-\s*source:\s*(.+)$/im)
    widgets.push({ type: "timeline", title: unquoteSerializedValue(timelineMatch[1]), events, ...(source ? { subtitle: source } : {}) })
  }

  const riskMatch = raw.match(
    /-\s*risk:\s*\n\s*-\s*title:\s*(.+?)\n\s*-\s*level:\s*(.+?)\n\s*-\s*explanation:\s*(.+?)(?=\n\s*-\s*(?:progress):|\n\s*(?:Evidence|Next steps)|$)/im,
  )
  if (riskMatch) {
    widgets.push({
      type: "risk_panel",
      title: unquoteSerializedValue(riskMatch[1]),
      severity: unquoteSerializedValue(riskMatch[2]).toLowerCase().includes("high") ? "high" : "warning",
      items: [{ label: unquoteSerializedValue(riskMatch[2]), detail: unquoteSerializedValue(riskMatch[3]) }],
    })
  }

  const progressMatch = raw.match(
    /-\s*progress:\s*\n\s*-\s*title:\s*(.+?)\n\s*-\s*note:\s*(.+?)(?=\n\s*(?:Evidence|Next steps)|$)/im,
  )
  if (progressMatch) {
    widgets.push({
      type: "progress_tracker",
      title: unquoteSerializedValue(progressMatch[1]),
      steps: [{ label: unquoteSerializedValue(progressMatch[2]), detail: "Completed", status: "completed" }],
    })
  }

  const topOffendersMatch = raw.match(
    /-\s*top_offenders[^:]*:\s*([\s\S]*?)(?=\n\s*-\s*(?:frequency_insight|risk|recommended_next_steps):|\n\s*(?:Evidence|Next steps)|$)/im,
  )
  if (topOffendersMatch) {
    const rows = topOffendersMatch[1]
      .split(/\n\s*-\s+/)
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => {
        const [supplierPart, detailPart = ""] = item.split(/\s+—\s+/, 2)
        const openLines = Number(detailPart.match(/(\d+)\s+open lines?/i)?.[1] || 1)
        const remainingQuantity = detailPart.match(/remaining_quantity\s+(?:~)?([\d,]+)/i)?.[1]?.replace(/,/g, "")
        return {
          supplier: unquoteSerializedValue(supplierPart),
          open_lines: openLines,
          ...(remainingQuantity ? { remaining_quantity: Number(remainingQuantity) } : {}),
          detail: detailPart,
        }
      })
    if (rows.length) {
      widgets.push({
        type: "comparison_table",
        title: "Top suppliers by operational impact",
        columns: [
          { key: "supplier", label: "Supplier" },
          { key: "open_lines", label: "Open lines", format: "number" },
          { key: "remaining_quantity", label: "Remaining quantity", format: "number" },
          { key: "detail", label: "Details" },
        ],
        rows,
      })
    }
  }

  const frequencyInsight = lineValue(/\n\s*-\s*frequency_insight:\s*(.+?)(?=\n\s*-\s*(?:risk|recommended_next_steps):|\n\s*(?:Evidence|Next steps)|$)/im)
  if (frequencyInsight) {
    widgets.push({ type: "text_block", title: "Frequency insight", content: frequencyInsight })
  }

  const riskInsight = lineValue(/\n\s*-\s*risk:\s*(.+?)(?=\n\s*-\s*(?:recommended_next_steps):|\n\s*(?:Evidence|Next steps)|$)/im)
  if (riskInsight && !widgets.some((widget) => widget.type === "risk_panel")) {
    widgets.push({
      type: "risk_panel",
      title: "Operational risk",
      severity: "warning",
      items: [{ label: "Review required", detail: riskInsight }],
    })
  }

  const nextStepsMatch = raw.match(
    /-\s*recommended_next_steps:\s*([\s\S]*?)(?=\n\s*(?:Evidence|Next steps)|$)/im,
  )
  if (nextStepsMatch) {
    const items = nextStepsMatch[1]
      .split(/\n\s*(?=\d+\))/)
      .map((item) => item.replace(/^\d+\)\s*/, "").trim())
      .filter(Boolean)
    if (items.length) {
      widgets.push({
        type: "text_list",
        title: "Recommended next steps",
        items: items.map((detail) => ({ detail })),
      })
    }
  }

  return widgets.length ? { kind: "insight_response", summary, widgets } : undefined
}

export const parseStructuredPayloadFromValue = (value: unknown, depth = 0): AgentStructuredPayload | undefined => {
  if (depth > 4) {
    return undefined
  }
  const payload = asObject(value)
  if (!payload) {
    return undefined
  }
  const normalizedInsight = normalizeInsightPayload(payload)
  if (normalizedInsight) {
    return normalizedInsight
  }
  const legacyToolCode = asString(payload.tool_code).trim()
  if (legacyToolCode) {
    const parsedFromCode = parseLegacyToolCodePayload(legacyToolCode)
    if (parsedFromCode) {
      return parsedFromCode
    }

    const functionName = asString(payload.tool_name || payload.toolCode || payload.toolName || payload.tool_code)
      .trim()
      .toLowerCase()
    const parameters = asObject(payload.parameters)
    if (functionName.startsWith("create_") && parameters) {
      return buildLegacyInteractionPayload(functionName, parameters)
    }
  }
  const genericEnvelopeType = ["object", "data", "json", "text", "tool-result", "tool_result"].includes(
    asString(payload.type).trim().toLowerCase(),
  )
  if ((normalizeInteractionType(payload) && !genericEnvelopeType) || isInsightResponse(payload)) {
    return isInsightResponse(payload) && !asString(payload.kind).trim()
      ? { ...payload, kind: "insight_response" }
      : payload
  }

  for (const key of ["structured_payload", "structuredPayload", "payload", "data", "result", "output", "value"]) {
    const nested = payload[key]
    if (nested === undefined || nested === value) {
      continue
    }
    const parsedNested = parseStructuredPayloadFromValue(nested, depth + 1)
    if (parsedNested) {
      return parsedNested
    }
  }
  return undefined
}

export const parseInteractionPayloadFromValue = (value: unknown): AgentStructuredPayload | undefined => {
  const payload = parseStructuredPayloadFromValue(value)
  if (!payload) {
    return undefined
  }
  return normalizeInteractionType(payload) || isInsightResponse(payload) ? payload : undefined
}

export const parseInteractionPayloadFromText = (content: string): AgentStructuredPayload | undefined => {
  let raw = (content || "").trim()
  if (!raw) {
    return undefined
  }

  const serializedInsight = parseSerializedInsightWidgetResponse(raw)
  if (serializedInsight) {
    return serializedInsight
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
    return parseStructuredPayloadFromValue(parsed)
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

    const kind = partKind(record)
    if (kind === "data" || kind === "object" || kind === "json") {
      const payload = parseStructuredPayloadFromValue(
        record.data ?? record.value ?? record.payload ?? record.result ?? record.output ?? record,
      )
      if (payload) {
        return payload
      }
      continue
    }

    if (kind === "tool-result" || kind === "tool_result") {
      const payload = parseStructuredPayloadFromValue(record.output ?? record.result ?? record.data)
      if (payload) {
        return payload
      }
      continue
    }

    if (kind === "text") {
      const payload = parseInteractionPayloadFromText(asString(record.text || record.content))
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
  const summary = asString(payload.summary).trim()

  if (isInsightResponse(payload)) {
    if (summary) {
      return summary
    }
    if (title) {
      return title
    }
    if (status) {
      return status
    }
  }

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

export const detectInsightResponse = (
  content: string,
  structuredPayload?: AgentStructuredPayload,
): DetectedInsightResponse | null => {
  const payload = structuredPayload || parseInteractionPayloadFromText(content)
  if (!payload || !isInsightResponse(payload)) {
    return null
  }
  return { data: payload }
}

const humanizeToken = (value: string): string =>
  value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase())

const normalizeWorkflowList = (value: unknown): string[] =>
  asArray(value)
    .map((item) => asString(item).trim())
    .filter(Boolean)

const latestWorkflowPayload = (
  messages: Array<{ role: string; structuredPayload?: AgentStructuredPayload }>,
): AgentStructuredPayload | undefined => {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index]
    if (message.role !== "assistant") {
      continue
    }
    if (!message.structuredPayload) {
      return undefined
    }
    const workflow = asString(message.structuredPayload.workflow).trim()
    const workflowStage = asString(message.structuredPayload.workflow_stage).trim()
    if (workflow || workflowStage) {
      return message.structuredPayload
    }
    return undefined
  }
  return undefined
}

const buildWorkflowSteps = (
  plan: string[],
  completedAgents: string[],
  currentAgent?: string,
): WorkflowStepSummary[] =>
  plan.map((agentName) => {
    const key = agentName
    if (completedAgents.includes(agentName)) {
      return { key, label: humanizeToken(agentName), status: "completed" }
    }
    if (currentAgent && agentName === currentAgent) {
      return { key, label: humanizeToken(agentName), status: "current" }
    }
    return { key, label: humanizeToken(agentName), status: "pending" }
  })

export const deriveWorkflowSummary = ({
  messages,
  activeAgentName,
  activeSpecialistName,
  currentTaskState,
  awaitingInput,
  statusText,
}: {
  messages: Array<{ role: string; structuredPayload?: AgentStructuredPayload }>
  activeAgentName: string
  activeSpecialistName?: string | null
  currentTaskState?: string | null
  awaitingInput?: boolean
  statusText?: string
}): AgentWorkflowSummary | null => {
  const workflowPayload = latestWorkflowPayload(messages)
  const statusDetail = asString(statusText).trim()
  const specialist = asString(activeSpecialistName).trim()
  const currentAgent = humanizeToken(specialist || activeAgentName)
  const taskState = asString(currentTaskState).trim().toLowerCase()

  if (workflowPayload) {
    const workflow = asString(workflowPayload.workflow).trim().toLowerCase()
    const workflowStage = asString(workflowPayload.workflow_stage || workflowPayload.stage).trim().toLowerCase()

    if (workflow === "host_orchestration") {
      const plan = normalizeWorkflowList(workflowPayload.plan)
      const completedAgents = normalizeWorkflowList(workflowPayload.completed_agents)
      const remainingAgents = normalizeWorkflowList(workflowPayload.remaining_agents)
      const currentAgentKey = asString(workflowPayload.current_agent).trim()
      const nextAgentKey = asString(workflowPayload.next_agent).trim() || remainingAgents[0] || ""
      const focusAgent =
        workflowStage === "continue_prompt"
          ? nextAgentKey || currentAgentKey
          : currentAgentKey || nextAgentKey
      const steps = buildWorkflowSteps(plan, completedAgents, focusAgent)
      const currentAgentLabel = currentAgentKey ? humanizeToken(currentAgentKey) : undefined
      const nextAgentLabel = nextAgentKey ? humanizeToken(nextAgentKey) : undefined
      const lastResponseText = asString(workflowPayload.last_response_text).trim()

      if (workflowStage === "continue_prompt") {
        return {
          title: currentAgentLabel ? `${currentAgentLabel} finished` : "Step finished",
          detail:
            nextAgentLabel
              ? `Next up: ${nextAgentLabel}. Confirm to keep the workflow moving.`
              : "Confirm if you want the host to continue the workflow.",
          statusLabel: "Ready for next step",
          tone: awaitingInput ? "awaiting" : "ready",
          steps,
          currentAgentLabel,
          nextAgentLabel,
        }
      }

      if (workflowStage === "specialist_interaction") {
        return {
          title: currentAgentLabel ? `${currentAgentLabel} needs input` : "Workflow paused for input",
          detail: statusDetail || lastResponseText || "Reply so the current specialist can continue.",
          statusLabel: "Waiting for your reply",
          tone: "awaiting",
          steps,
          currentAgentLabel,
          nextAgentLabel,
        }
      }
    }

    if (workflowStage === "form") {
      return {
        title: "Review before applying changes",
        detail: "The agent drafted the next step. Edit anything you want, then submit.",
        statusLabel: awaitingInput ? "Needs confirmation" : "Draft ready",
        tone: awaitingInput ? "awaiting" : "ready",
        steps: [{ key: specialist || activeAgentName, label: currentAgent, status: "current" }],
        currentAgentLabel: currentAgent,
      }
    }
  }

  if (awaitingInput) {
    return {
      title: `${currentAgent} needs your reply`,
      detail: statusDetail || "Answer the current prompt so this task can continue.",
      statusLabel: "Waiting for your reply",
      tone: "awaiting",
      steps: [{ key: specialist || activeAgentName, label: currentAgent, status: "current" }],
      currentAgentLabel: currentAgent,
    }
  }

  if (taskState && !["completed", "idle", "submitted"].includes(taskState)) {
    return {
      title: `${currentAgent} is working`,
      detail: statusDetail || `Current task state: ${humanizeToken(taskState)}`,
      statusLabel: humanizeToken(taskState),
      tone: "working",
      steps: [{ key: specialist || activeAgentName, label: currentAgent, status: "current" }],
      currentAgentLabel: currentAgent,
    }
  }

  return null
}

const summarizeResponseSelection = (selected: unknown): string => {
  if (Array.isArray(selected)) {
    const values = selected.map((value) => humanizeToken(asString(value) || String(value))).filter(Boolean)
    return values.join(", ")
  }
  const text = asString(selected).trim()
  if (text) {
    return humanizeToken(text)
  }
  if (selected != null) {
    return humanizeToken(String(selected))
  }
  return ""
}

export const detectInteractionResponseSummary = (content: string): InteractionResponseSummary | null => {
  const raw = (content || "").trim()
  if (!raw.startsWith("{")) {
    return null
  }

  try {
    const payload = JSON.parse(raw)
    const record = asObject(payload)
    if (!record) {
      return null
    }
    const type = asString(record.type).trim()
    if (!type.endsWith("_response")) {
      return null
    }

    if (type === "multiple_choice_response") {
      const selection = summarizeResponseSelection(record.selected)
      const additionalInput = asString(record.additional_input).trim()
      return {
        type,
        title: selection ? `Selected ${selection}` : "Selection sent",
        detail: additionalInput || undefined,
      }
    }

    if (
      type === "searchable_selection_response"
      || type === "hierarchical_selection_response"
      || type === "autocomplete_selection_response"
      || type === "comparison_response"
      || type === "bulk_action_response"
    ) {
      const selection =
        summarizeResponseSelection(record.selected)
        || summarizeResponseSelection(record.selection)
        || summarizeResponseSelection(record.value)
      return {
        type,
        title: selection ? `Selected ${selection}` : "Selection sent",
      }
    }

    if (type === "file_upload_response") {
      const files = asArray(record.files)
      return {
        type,
        title: files.length > 0 ? `Shared ${files.length} file${files.length === 1 ? "" : "s"}` : "File response sent",
        detail: asString(record.message).trim() || undefined,
      }
    }

    if (type === "datetime_response" || type === "slider_response") {
      const value = summarizeResponseSelection(record.value)
      return {
        type,
        title: value ? `Submitted ${value}` : "Response sent",
      }
    }

    if (
      type === "form_response"
      || type === "update_form_response"
      || type === "conditional_form_response"
      || type === "dashboard_builder_response"
      || type === "master_detail_response"
      || type === "alert_manager_response"
      || type === "task_assignment_response"
      || type === "approval_workflow_response"
      || type === "wizard_flow_response"
      || type === "progress_response"
      || type === "data_table_response"
      || type === "ranking_response"
      || type === "code_review_response"
      || type === "image_annotation_response"
      || type === "comment_thread_response"
    ) {
      return {
        type,
        title: `${humanizeToken(type.replace(/_response$/, ""))} submitted`,
      }
    }

    return {
      type,
      title: "Structured response sent",
    }
  } catch {
    return null
  }
}
