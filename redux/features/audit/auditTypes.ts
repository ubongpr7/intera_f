export type AuditEventRecord = {
  id: string
  event_id: string
  event_name: string
  event_version: number
  source_service: string
  feature_area: string
  workspace_id: string
  actor_user_id: string
  actor_email: string
  actor_role: string
  actor_name: string
  target_type: string
  target_id: string
  target_label: string
  action: string
  summary: string
  severity: string
  visibility_scope: string
  occurred_at: string
  ingested_at: string
  correlation_id: string
  request_id: string
  reference_number: string
  entity_barcode: string
  entity_sku: string
  location_id: string
  terminal_id: string
  support_access_grant_id: string
  metadata_json: Record<string, unknown>
  changes_json: Record<string, unknown>
  search_text: string
}

export type AuditEventListResponse = {
  count: number
  results: AuditEventRecord[]
}

export type AuditFilterOptions = {
  source_services: string[]
  feature_areas: string[]
  actor_roles: string[]
  target_types: string[]
  actions: string[]
  severities: string[]
}

export type AuditQueryParams = {
  search?: string
  barcode?: string
  workspace_id?: string
  actor_user_id?: string
  actor_role?: string
  source_service?: string
  feature_area?: string
  target_type?: string
  action?: string
  severity?: string
  occurred_from?: string
  occurred_to?: string
  limit?: number
  offset?: number
}
