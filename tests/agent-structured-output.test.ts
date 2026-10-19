import assert from "node:assert/strict"
import test from "node:test"

import {
  isTransportDebugText,
  parseInteractionPayloadFromText,
} from "../lib/agent-structured-output.ts"

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
