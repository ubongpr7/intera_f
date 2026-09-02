import assert from "node:assert/strict"
import test from "node:test"

import {
  buildChatCsv,
  buildChatPdfBlob,
  buildChatReportBodyHtml,
  buildInsightCsv,
  buildInsightCsvRows,
  buildInsightPdfBlob,
  buildInsightReportBodyHtml,
} from "../lib/agent-export.ts"

test("buildInsightCsvRows preserves numeric units for ranked lists and metrics", () => {
  const rows = buildInsightCsvRows({
    kind: "insight_response",
    summary: "Top sellers",
    widgets: [
      {
        type: "metric_grid",
        title: "Sales snapshot",
        data: [
          { label: "Orders", value: 31, format: "number" },
          { label: "Revenue", value: 120500, format: "currency" },
        ],
      },
      {
        type: "ranked_list",
        title: "Top sellers for last 7 days",
        items: [
          {
            label: "Eva Premium Water 75cl",
            value: 16,
            secondary_value: 5600,
            barcode: "1234567890123",
          },
        ],
      },
    ],
  })

  const ordersRow = rows.find((row) => row.row_type === "metric" && row.label === "Orders")
  const rankedRow = rows.find((row) => row.row_type === "ranked_item")

  assert.ok(ordersRow)
  assert.equal(ordersRow.value, 31)
  assert.ok(rankedRow)
  assert.equal(rankedRow.value, 16)
  assert.equal(rankedRow.secondary_value, 5600)
  assert.equal(rankedRow.barcode, "1234567890123")
})

test("buildInsightCsvRows expands comparison tables into flat rows", () => {
  const rows = buildInsightCsvRows({
    kind: "insight_response",
    widgets: [
      {
        type: "comparison_table",
        title: "Location comparison",
        columns: [
          { key: "location", label: "Location" },
          { key: "orders", label: "Orders" },
        ],
        rows: [
          { location: "Gberigbe Store", orders: 12 },
          { location: "Airport Road", orders: 8 },
        ],
      },
    ],
  })

  assert.equal(rows.filter((row) => row.row_type === "table_row").length, 2)
  assert.deepEqual(
    rows.filter((row) => row.row_type === "table_row").map((row) => row.Location),
    ["Gberigbe Store", "Airport Road"],
  )
})

test("buildInsightReportBodyHtml includes summary, insights, and widget titles", () => {
  const html = buildInsightReportBodyHtml({
    kind: "insight_response",
    summary: "Sales analysis for last month",
    explanation: "This compares orders and revenue across locations.",
    insights: [{ title: "Peak day", detail: "Fridays drove the highest basket value." }],
    widgets: [
      {
        type: "bar_chart",
        title: "Orders by day",
        data: [
          { label: "Week 1", value: 44 },
          { label: "Week 2", value: 52 },
        ],
      },
    ],
  })

  assert.match(html, /Sales analysis for last month/)
  assert.match(html, /Peak day/)
  assert.match(html, /Orders by day/)
  assert.doesNotMatch(html, /row_type|chart_point|Traceability|Data sources/)
})

test("buildInsightReportBodyHtml renders ranked products as image cards", () => {
  const html = buildInsightReportBodyHtml({
    kind: "insight_response",
    widgets: [
      {
        type: "ranked_list",
        title: "Top products",
        items: [
          {
            label: "Eva Premium Water 75cl",
            value: 16,
            secondary_value: 5600,
            barcode: "1234567890123",
            image_url: "data:image/svg+xml;utf8,%3Csvg%3E%3C/svg%3E",
          },
        ],
      },
    ],
    data_sources: [{ service: "pos", endpoint_or_topic: "get_top_sellers", freshness: "live" }],
  })

  assert.match(html, /ranked-image/)
  assert.match(html, /Barcode: 1234567890123/)
  assert.doesNotMatch(html, /ranked_item|Traceability|Data sources/)
})

test("business review section stacks export as separate domain cards", () => {
  const payload = {
    kind: "insight_response",
    summary: "Business review for the last year",
    widgets: [
      {
        type: "section_stack",
        title: "Business review dashboard",
        sections: [
          {
            title: "POS sales review",
            summary: "Paid orders and revenue for the selected period.",
            widgets: [
              {
                type: "metric_grid",
                title: "Sales snapshot",
                data: [{ label: "Paid orders", value: 9 }],
              },
            ],
          },
          {
            title: "Inventory health review",
            summary: "Stock risk across all locations.",
            widgets: [
              {
                type: "ranked_list",
                title: "Products to reorder",
                items: [{ label: "Eva Premium Water 75cl", value: 4, barcode: "1234567890123" }],
              },
            ],
          },
        ],
      },
    ],
  }

  const html = buildInsightReportBodyHtml(payload)
  const rows = buildInsightCsvRows(payload)

  assert.match(html, /POS sales review/)
  assert.match(html, /Inventory health review/)
  assert.match(html, /Sales snapshot/)
  assert.match(html, /Products to reorder/)
  assert.doesNotMatch(html, /RAW_JSON|raw_widget|section_stack/)
  assert.ok(rows.some((row) => row.section_title === "POS sales review" && row.label === "Paid orders"))
  assert.ok(rows.some((row) => row.section_title === "Inventory health review" && row.label === "Eva Premium Water 75cl"))
  assert.doesNotMatch(buildInsightCsv(payload), /raw_widget|section_stack|raw_json/)
})

test("business review section stacks render as a valid PDF", async () => {
  const blob = await buildInsightPdfBlob(
    {
      kind: "insight_response",
      widgets: [
        {
          type: "section_stack",
          title: "Business review dashboard",
          sections: [
            {
              title: "POS sales review",
              summary: "Revenue and paid orders.",
              widgets: [{ type: "metric_grid", title: "Sales snapshot", data: [{ label: "Revenue", value: 120500 }] }],
            },
          ],
        },
      ],
    },
    "Business Review",
  )

  const bytes = new Uint8Array(await blob.arrayBuffer())
  assert.ok(bytes.length > 1000)
  assert.equal(String.fromCharCode(...bytes.slice(0, 4)), "%PDF")
})

test("buildInsightCsv hides internal row_type column", () => {
  const csv = buildInsightCsv({
    kind: "insight_response",
    widgets: [
      {
        type: "comparison_table",
        title: "Location comparison",
        columns: ["location", "orders"],
        rows: [{ location: "Gberigbe Store", orders: 12 }],
      },
    ],
  })

  assert.doesNotMatch(csv, /row_type|table_row/)
  assert.match(csv, /Gberigbe Store/)
})

test("buildChatReportBodyHtml renders both plain messages and structured insight messages", () => {
  const html = buildChatReportBodyHtml([
    {
      id: "1",
      role: "user",
      content: "Give me the sales analysis for last month",
      timestamp: "2026-07-10T12:00:00.000Z",
    },
    {
      id: "2",
      role: "assistant",
      content: "",
      timestamp: "2026-07-10T12:00:05.000Z",
      structuredPayload: {
        kind: "insight_response",
        summary: "Sales analysis for last month",
        widgets: [
          {
            type: "timeline",
            title: "Order milestones",
            events: [{ title: "Promotion launch", occurred_at: "2026-06-04" }],
          },
        ],
      },
    },
  ])

  assert.match(html, /Give me the sales analysis for last month/)
  assert.match(html, /Sales analysis for last month/)
  assert.match(html, /Order milestones/)
  assert.match(html, /Promotion launch/)
})

test("buildChatCsv includes message metadata without developer-only fields", () => {
  const csv = buildChatCsv([
    {
      id: "1",
      role: "user",
      content: "Show sales by location today.",
      timestamp: "2026-07-10T12:00:00.000Z",
    },
    {
      id: "2",
      role: "assistant",
      content: "Here is the analysis.",
      structuredPayload: {
        kind: "insight_response",
        summary: "Sales analysis",
        widgets: [],
      },
    },
  ])

  assert.match(csv, /message_id,role,timestamp,content,has_structured_payload,structured_summary/)
  assert.match(csv, /Here is the analysis\./)
  assert.match(csv, /Sales analysis/)
  assert.doesNotMatch(csv, /row_type|widget_type/)
})

test("buildInsightPdfBlob renders a real PDF with react-pdf renderer", async () => {
  const blob = await buildInsightPdfBlob(
    {
      kind: "insight_response",
      summary: "Sales analysis for last month",
      widgets: [
        {
          type: "metric_grid",
          title: "Snapshot",
          data: [
            { label: "Orders", value: 31, format: "number" },
            { label: "Revenue", value: 120500, format: "currency" },
          ],
        },
      ],
    },
    "Sales Analysis",
  )

  const bytes = new Uint8Array(await blob.arrayBuffer())
  assert.ok(bytes.length > 1000)
  assert.equal(String.fromCharCode(...bytes.slice(0, 4)), "%PDF")
})

test("chart widgets render on dedicated A4 landscape PDF pages", async () => {
  const blob = await buildInsightPdfBlob(
    {
      kind: "insight_response",
      summary: "Sales analysis",
      widgets: [
        {
          type: "metric_grid",
          title: "Snapshot",
          data: [{ label: "Orders", value: 6 }],
        },
        {
          type: "section_stack",
          title: "Specialist findings",
          sections: [
            {
              title: "POS sales review",
              widgets: [
                {
                  type: "line_chart",
                  title: "Daily sales trend",
                  data: [
                    { label: "2026-06-17", value: 1200 },
                    { label: "2026-06-18", value: 900 },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    "Sales Analysis",
  )

  const pdf = Buffer.from(await blob.arrayBuffer()).toString("latin1")
  assert.equal((pdf.match(/\/MediaBox \[0 0 841\.890015 595\.280029\]/g) || []).length, 1)
  assert.equal((pdf.match(/\/MediaBox \[0 0 595\.280029 841\.890015\]/g) || []).length, 1)
})

test("buildChatPdfBlob renders a real PDF with chat messages", async () => {
  const blob = await buildChatPdfBlob(
    [
      {
        id: "1",
        role: "user",
        content: "Show sales by location today.",
      },
      {
        id: "2",
        role: "assistant",
        content: "Gberigbe Store leads today's sales.",
      },
    ],
    "Chat Export",
  )

  const bytes = new Uint8Array(await blob.arrayBuffer())
  assert.ok(bytes.length > 1000)
  assert.equal(String.fromCharCode(...bytes.slice(0, 4)), "%PDF")
})
