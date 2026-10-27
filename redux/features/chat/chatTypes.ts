export type ConversationKind = "direct" | "group" | "urgent" | "support"
export type MessageKind = "text" | "system" | "file" | "image" | "voice"

export interface ChatParticipant {
  id: string
  user_id: string
  role?: string | null
  display_name?: string | null
  email?: string | null
  is_admin: boolean
  can_manage_participants: boolean
  is_active: boolean
  unread_count: number
  presence_status?: "online" | "busy" | "offline" | null
}

export interface ChatAttachment {
  id: string
  original_filename: string
  content_type: string
  size_bytes: number
  access_url?: string | null
  status: string
}

export interface ChatMessage {
  id: string
  conversation_id: string
  message_seq: number
  sender_user_id: string
  sender_role?: string | null
  kind: MessageKind
  body: string
  attachments: ChatAttachment[]
  created_at: string
}

export interface UploadAttachmentResponse {
  attachment: ChatAttachment
}

export interface ChatConversation {
  id: string
  kind: ConversationKind
  status: "active" | "closed" | "archived"
  title?: string | null
  subject?: string | null
  context_workspace_id?: string | null
  context_department_id?: string | null
  context_label?: string | null
  last_message_at?: string | null
  participants: ChatParticipant[]
  latest_message?: ChatMessage | null
}

export interface SupportAssistResponse {
  conversation_id: string
  user_message: ChatMessage
  assistant_message: ChatMessage
}

export interface CallSession {
  id: string
  room_name: string
  conversation_id?: string | null
  call_type: "support" | "internal"
  billing_mode: string
  status: string
  token: string
  livekit_url: string
  started_at?: string | null
  duration_seconds: number
}

export interface CallEndResponse {
  id: string
  status: string
  duration_seconds: number
  billing_mode: string
  billed_coin_amount: number
  billing_status: string
}
