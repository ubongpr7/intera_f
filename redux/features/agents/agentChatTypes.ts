export type AgentConversationStatus = "active" | "archived" | "closed"

export type AgentConversationMessageRole = "user" | "assistant" | "system"
export type AgentConversationMessageKind = "text" | "structured" | "status"

export type AgentConversation = {
  id: string
  profileId: string
  userId: string
  title: string
  status: AgentConversationStatus
  agentSlug: string
  agentName: string
  agentIconUrl: string
  runtimeAgentName: string
  messageCount: number
  historyLength: number
  lastMessagePreview: string
  lastMessageAt?: string | null
  lastTaskId?: string | null
  lastContextId?: string | null
  currentTaskState?: string | null
  activeSpecialistSlug?: string | null
  awaitingInput: boolean
  resumeTaskId?: string | null
  metadata: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export type AgentConversationMessage = {
  id: string
  conversationId: string
  sequence: number
  role: AgentConversationMessageRole
  kind: AgentConversationMessageKind
  content: string
  structuredPayload?: Record<string, unknown>
  taskId?: string | null
  contextId?: string | null
  serverMessageId?: string | null
  metadata?: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export type AgentConversationActivity = {
  id: string
  conversationId: string
  kind: string
  label: string
  detail?: string | null
  state?: string | null
  taskId?: string | null
  contextId?: string | null
  specialistSlug?: string | null
  metadata?: Record<string, unknown>
  receivedAt: string
}

export type AgentConversationDetail = {
  conversation: AgentConversation
  messages: AgentConversationMessage[]
  activities: AgentConversationActivity[]
}

export type CreateAgentConversationRequest = {
  agentSlug: string
  title?: string
  historyLength?: number
}

export type UpdateAgentConversationRequest = {
  conversationId: string
  title?: string
  status?: AgentConversationStatus
  historyLength?: number
}
