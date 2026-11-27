import assert from "node:assert/strict"
import test from "node:test"

import {
  detectInsightResponse,
  deriveWorkflowSummary,
  isTransportDebugText,
  parseInteractionPayloadFromText,
  readReportContract,
  readWorkflowContract,
} from "../lib/agent-structured-output.ts"

test("workflow contract metadata distinguishes current, legacy, and newer responses", () => {
  assert.deepEqual(
    readWorkflowContract({
      workflow_id: "wf-1",
      schema_version: 1,
      contract: "intera.workflow.v1",
      profile_id: "4",
      correlation_id: "mcp-workflow:wf-1",
    }),
    {
      status: "versioned",
      schemaVersion: 1,
      contract: "intera.workflow.v1",
      profileId: "4",
      correlationId: "mcp-workflow:wf-1",
    },
  )
  assert.equal(readWorkflowContract({ workflow_id: "wf-legacy" })?.status, "legacy")
  assert.equal(readWorkflowContract({ workflow_id: "wf-new", schema_version: 2, contract: "intera.workflow.v2" })?.status, "unsupported")
})

test("report contract validates coverage before it is rendered as authoritative", () => {
  assert.equal(
    readReportContract({
      schema_version: 1,
      type: "cross_domain_business_review",
      status: "partial",
      sources_attempted: 3,
      sources_available: 2,
      sections: ["Sales"],
      unavailable_sections: ["Inventory"],
    })?.status,
    "versioned",
  )
  assert.equal(
    readReportContract({
      schema_version: 1,
      type: "cross_domain_business_review",
      status: "complete",
      sources_attempted: 1,
      sources_available: 2,
      sections: [],
      unavailable_sections: [],
    })?.status,
    "invalid",
  )
  assert.equal(
    readReportContract({
      schema_version: 1,
      type: "cross_domain_business_review",
      status: "unavailable",
      sources_attempted: 2,
      sources_available: 1,
      sections: [],
      unavailable_sections: ["Sales"],
    })?.status,
    "invalid",
  )
  assert.equal(readReportContract({ schema_version: 2, type: "cross_domain_business_review" })?.status, "unsupported")
  assert.equal(readReportContract({ status: "complete" })?.status, "legacy")
})

test("supplier procurement serialization is converted into typed widgets", () => {
  const payload = parseInteractionPayloadFromText(`insight_response:
- summary: Satnam Investment Nigeria Ltd is delaying replenishment most often.
- widgets:
  - comparison:
    - title: "Top suppliers by open receiving exceptions"
    - items:
      - supplier: "Satnam Investment Nigeria Ltd", exceptions: 14, share: "28%"
      - supplier: "StyleRack Apparel Wholesale Ltd", exceptions: 12, share: "24%"
  - timeline:
    - title: "Recent Satnam exceptions"
    - items:
      - reference: "PO-101", note: "open line(s) remaining"
  - risk:
    - title: "Operational risk"
    - level: "Medium"
    - explanation: "Review the supplier ETA."
`)

  assert.ok(payload)
  assert.equal(payload.kind, "insight_response")
  assert.equal(payload.summary, "Satnam Investment Nigeria Ltd is delaying replenishment most often.")
  const widgets = payload.widgets as Array<{
    type?: unknown
    rows?: Array<Record<string, unknown>>
    events?: Array<Record<string, unknown>>
    items?: Array<Record<string, unknown>>
  }> | undefined
  assert.deepEqual(
    widgets?.map((widget) => widget.type),
    ["comparison_table", "timeline", "risk_panel"],
  )
  assert.equal(widgets?.[0]?.rows?.[0]?.supplier, "Satnam Investment Nigeria Ltd")
  assert.equal(widgets?.[1]?.events?.[0]?.title, "PO-101")
  assert.equal(widgets?.[2]?.items?.[0]?.detail, "Review the supplier ETA.")
})

test("transport part representations are never treated as user-facing content", () => {
  assert.equal(isTransportDebugText("[TextPart(kind='text', text='internal') ]"), true)
  assert.equal(isTransportDebugText("A normal assistant answer"), false)
})

test("insight JSON is recovered when an adapter prepends a status line", () => {
  const payload = parseInteractionPayloadFromText(
    `The procurement specialist completed the review. {"kind":"insight_response","summary":"Satnam is the leading delayed supplier.","widgets":[{"type":"ranked_list","title":"Delayed suppliers","items":[{"label":"Satnam","value":4}]}]}`,
  )

  assert.equal(payload?.kind, "insight_response")
  assert.equal(payload?.summary, "Satnam is the leading delayed supplier.")
  assert.equal((payload?.widgets as Array<Record<string, unknown>>)[0]?.type, "ranked_list")
})

test("text insight wins when the attached payload is only a transport wrapper", () => {
  const detected = detectInsightResponse(
    '{"kind":"insight_response","summary":"Typed result","widgets":[{"type":"metric_grid","data":[]}]}',
    { type: "text", text: "The specialist result is attached below." },
  )

  assert.equal(detected?.data.summary, "Typed result")
  assert.equal((detected?.data.widgets as Array<Record<string, unknown>>)[0]?.type, "metric_grid")
})

test("data envelopes are unwrapped before insight rendering", () => {
  const detected = detectInsightResponse("Typed summary", {
    type: "data",
    data: {
      kind: "insight_response",
      summary: "Unwrapped result",
      widgets: [{ type: "risk_panel", title: "Risk", items: [] }],
    },
  })

  assert.equal(detected?.data.summary, "Unwrapped result")
  assert.equal((detected?.data.widgets as Array<Record<string, unknown>>)[0]?.type, "risk_panel")
})

test("partial host reviews explain completed and retryable sections", () => {
  const summary = deriveWorkflowSummary({
    messages: [{
      role: "assistant",
      structuredPayload: {
        workflow: "host_orchestration",
        workflow_stage: "partial_review",
        plan: ["pos", "inventory", "product"],
        completed_agents: ["pos"],
        retryable_agents: ["inventory", "product"],
      },
    }],
    activeAgentName: "host",
    currentTaskState: "input-required",
    awaitingInput: true,
  })

  assert.equal(summary?.title, "Review partially available")
  assert.equal(summary?.statusLabel, "Needs recovery choice")
  assert.match(summary?.detail || "", /1 section ready/)
  assert.match(summary?.detail || "", /2 sections can be retried/)
  assert.deepEqual(summary?.steps.map((step) => [step.key, step.status]), [
    ["pos", "completed"],
    ["inventory", "current"],
    ["product", "pending"],
  ])
})
