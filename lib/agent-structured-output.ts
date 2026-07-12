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

const isInsightResponse = (payload: AgentStructuredPayload): boolean =>
  asString(payload.kind).trim() === "insight_response" && Array.isArray(payload.widgets)

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

export const parseStructuredPayloadFromValue = (value: unknown): AgentStructuredPayload | undefined => {
  const payload = asObject(value)
  if (!payload) {
    return undefined
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
  if (normalizeInteractionType(payload) || isInsightResponse(payload)) {
    return payload
  }
  return undefined
}

export const parseInteractionPayloadFromValue = (value: unknown): AgentStructuredPayload | undefined => {
  const payload = parseStructuredPayloadFromValue(value)
  if (!payload) {
    return undefined
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

    const kind = asString(record.kind).trim().toLowerCase()
    if (kind === "data") {
      const payload = parseStructuredPayloadFromValue(record.data)
      if (payload) {
        return payload
      }
      continue
    }

    if (kind === "tool-result") {
      const payload = parseStructuredPayloadFromValue(record.output)
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
