export type NotificationRecord = {
  id: string
  user_id: string
  workspace_id: string
  category: string
  scope: string
  title: string
  message: string
  metadata_json: Record<string, unknown>
  action_url?: string | null
  is_read: boolean
  read_at?: string | null
  created_at: string
}

export type NotificationListResponse = {
  count: number
  results: NotificationRecord[]
}

export type NotificationUnreadCountResponse = {
  unread_count: number
}
