export type DashboardSeriesPoint = {
  bucket: string
  value: number
}

export type DashboardRankingEntry = {
  entity_key: string
  title: string
  subtitle: string
  metric_value: number
  image_url?: string
}

export type DashboardFeedEntry = {
  audit_id: string
  occurred_at: string
  event_name: string
  summary: string
  severity: string
  source_service: string
  feature_area: string
  target_label: string
  reference_number: string
  stream_kind: string
  title: string
  subtitle: string
  image_url?: string
  actor_name: string
  location_label: string
  terminal_name: string
  quantity: number
  unit_label: string
  sku: string
  barcode: string
}

export type DashboardWorkspaceSnapshot = {
  workspace_id: string
  scope_key: string
  generated_at: string
  metrics: Record<string, number | string>
  charts: Record<string, DashboardSeriesPoint[]>
  leaderboards: Record<string, DashboardRankingEntry[]>
  alerts: Record<string, number | string>
  feed: DashboardFeedEntry[]
}

export type DashboardRealtimeEnvelope = {
  type?: string
  workspace_id?: string
  snapshot?: DashboardWorkspaceSnapshot
}
