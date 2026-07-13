"use client"

import * as XLSX from "xlsx"

export type ExportStructuredPayload = Record<string, unknown>

export type ExportChatMessage = {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp?: string
  structuredPayload?: ExportStructuredPayload
}

export type ExportRow = Record<string, string | number | boolean | null>
export type ChatCsvRow = {
  message_id: string
  role: string
  timestamp: string
  content: string
  has_structured_payload: boolean
  structured_summary: string
}

const asRecord = (value: unknown): Record<string, unknown> | undefined => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined
  }
  return value as Record<string, unknown>
}

const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : [])

const asString = (value: unknown): string => (typeof value === "string" ? value : "")

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")

const printText = (value: unknown): string => {
  if (value === null || value === undefined) {
    return ""
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value)
  }
  if (typeof value === "string") {
    return value
  }
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

const EXPORT_CURRENCY_CONFIG: Record<string, { symbol: string; decimals: number; locale: string }> = {
  USD: { symbol: "$", decimals: 2, locale: "en-US" },
  EUR: { symbol: "€", decimals: 2, locale: "de-DE" },
  GBP: { symbol: "£", decimals: 2, locale: "en-GB" },
  NGN: { symbol: "₦", decimals: 2, locale: "en-NG" },
  CAD: { symbol: "C$", decimals: 2, locale: "en-CA" },
  AUD: { symbol: "A$", decimals: 2, locale: "en-AU" },
  JPY: { symbol: "¥", decimals: 0, locale: "ja-JP" },
  GHS: { symbol: "₵", decimals: 2, locale: "en-GH" },
  KES: { symbol: "KSh", decimals: 2, locale: "en-KE" },
  ZAR: { symbol: "R", decimals: 2, locale: "en-ZA" },
}

const getExportCurrencyCode = () => {
  if (typeof document === "undefined") {
    return "NGN"
  }
  const match = document.cookie.match(/(?:^|;\s*)currency=([^;]+)/)
  return decodeURIComponent(match?.[1] || "NGN").trim().toUpperCase() || "NGN"
}

const resolveExportImageUrl = (value?: string | null) => {
  if (!value) {
    return ""
  }
  if (/^(https?:)?\/\//i.test(value) || value.startsWith("data:") || value.startsWith("blob:")) {
    return value
  }
  if (value.startsWith("/")) {
    const backendHost = (process.env.NEXT_PUBLIC_BACKEND_HOST_URL ?? "").replace(/\/+$/, "")
    return backendHost ? `${backendHost}${value}` : value
  }
  const backendHost = (process.env.NEXT_PUBLIC_BACKEND_HOST_URL ?? "").replace(/\/+$/, "")
  return backendHost ? `${backendHost}/${value}` : `/${value}`
}

const blobToDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "")
    reader.onerror = () => reject(new Error("Unable to read image blob."))
    reader.readAsDataURL(blob)
  })

const resolveExportImageDataUrl = async (value?: string | null) => {
  const url = resolveExportImageUrl(value)
  if (!url) {
    return ""
  }
  if (url.startsWith("data:") || url.startsWith("blob:")) {
    return url
  }
  try {
    const response = await fetch(url, {
      credentials: "include",
      cache: "force-cache",
    })
    if (!response.ok) {
      return url
    }
    const blob = await response.blob()
    return await blobToDataUrl(blob)
  } catch {
    return url
  }
}

const hydrateExportImages = async (value: unknown): Promise<unknown> => {
  if (Array.isArray(value)) {
    return Promise.all(value.map((item) => hydrateExportImages(item)))
  }
  if (!value || typeof value !== "object") {
    return value
  }
  const record = value as Record<string, unknown>
  const hydratedEntries = await Promise.all(
    Object.entries(record).map(async ([key, entry]) => {
      if ((key === "image_url" || key === "display_image" || key === "product_variant_image_url") && typeof entry === "string") {
        return [key, await resolveExportImageDataUrl(entry)] as const
      }
      return [key, await hydrateExportImages(entry)] as const
    }),
  )
  return Object.fromEntries(hydratedEntries)
}

const formatExportCurrency = (amount: number) => {
  const currencyCode = getExportCurrencyCode()
  const config = EXPORT_CURRENCY_CONFIG[currencyCode] || { symbol: `${currencyCode} `, decimals: 2, locale: "en-US" }
  return `${currencyCode} ${new Intl.NumberFormat(config.locale, {
    minimumFractionDigits: config.decimals,
    maximumFractionDigits: config.decimals,
  }).format(amount)}`
}

const formatMoneyInText = (value: string) => {
  const normalized = value
    .replace(/₦\s?(\d[\d,]*(?:\.\d+)?)/g, "NGN $1")
    .replace(/₵\s?(\d[\d,]*(?:\.\d+)?)/g, "GHS $1")
  return normalized.replace(
    /\b(totaling|totalled|totaled|revenue of|sales of|amounting to)\s+(-?\d+(?:\.\d+)?)(?=\.|,|\s|$)/gi,
    (match, prefix: string, rawAmount: string) => {
      const numeric = Number(rawAmount)
      if (!Number.isFinite(numeric)) {
        return match
      }
      return `${prefix} ${formatExportCurrency(numeric)}`
    },
  )
}

const exportText = (value: unknown) => formatMoneyInText(printText(value))

const escapeCsvCell = (value: unknown) => {
  const text = printText(value)
  if (!/[",\n\r]/.test(text)) {
    return text
  }
  return `"${text.replace(/"/g, '""')}"`
}

const csvRowsToText = <T extends Record<string, string | number | boolean | null | undefined>>(rows: T[]) => {
  if (!rows.length) {
    return ""
  }
  const header = Object.keys(rows[0])
  const lines = [header.map((cell) => escapeCsvCell(cell)).join(",")]
  rows.forEach((row) => {
    lines.push(header.map((key) => escapeCsvCell(row[key])).join(","))
  })
  return lines.join("\n")
}

const humanizeKey = (value: unknown) =>
  printText(value)
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase())

const sanitizeFileStem = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "ai-export"

const isInsightPayload = (payload?: ExportStructuredPayload): payload is ExportStructuredPayload =>
  asString(payload?.kind).trim() === "insight_response" && Array.isArray(payload?.widgets)

const appendRows = (target: ExportRow[], rows: ExportRow[]) => {
  rows.forEach((row) => target.push(row))
}

const USER_HIDDEN_TABLE_COLUMNS = new Set(["row_type", "widget_type", "widget_title", "widget_subtitle"])

const userFacingColumnsFromRows = (rows: ExportRow[]) =>
  Array.from(new Set(rows.flatMap((row) => Object.keys(row)).filter((key) => !USER_HIDDEN_TABLE_COLUMNS.has(key))))

const removeInternalRowFields = (row: ExportRow): ExportRow =>
  Object.fromEntries(Object.entries(row).filter(([key]) => key !== "row_type")) as ExportRow

const widgetRows = (widget: Record<string, unknown>): ExportRow[] => {
  const type = asString(widget.type) || "widget"
  const title = asString(widget.title)
  const subtitle = asString(widget.subtitle)
  const base = {
    widget_type: type,
    widget_title: title,
    widget_subtitle: subtitle,
  }

  if (type === "metric_grid") {
    return asArray(widget.data)
      .map((item) => asRecord(item))
      .filter(Boolean)
      .map((item, index) => ({
        ...base,
        row_type: "metric",
        row_index: index + 1,
        label: asString(item?.label) || `Metric ${index + 1}`,
        value: item?.value === undefined ? null : (item.value as string | number | boolean | null),
        unit: asString(item?.unit) || null,
        detail: asString(item?.detail) || null,
        key: asString(item?.key) || null,
      }))
  }

  if (type === "bar_chart" || type === "histogram" || type === "line_chart" || type === "donut_chart" || type === "sparkline_metric") {
    const xKey =
      asString(widget.x_key) ||
      asString(widget.label_key) ||
      "label"
    const yKey =
      asString(widget.y_key) ||
      asString(widget.value_key) ||
      "value"
    const series = asArray(widget.series)
      .map((item) => asRecord(item))
      .filter(Boolean)
      .map((item) => ({
        key: asString(item?.key),
        label: asString(item?.label) || humanizeKey(item?.key),
      }))
      .filter((item) => item.key)

    const dataset = type === "sparkline_metric" ? asArray(widget.data) : asArray(widget.data)
    return dataset
      .map((item) => asRecord(item))
      .filter(Boolean)
      .map((item, index) => ({
        ...base,
        row_type: "chart_point",
        row_index: index + 1,
        label: printText(item?.[xKey]),
        ...(series.length
          ? Object.fromEntries(series.map((seriesItem) => [seriesItem.label, item?.[seriesItem.key] === undefined ? null : item[seriesItem.key]]))
          : {
              value: item?.[yKey] === undefined ? null : (item[yKey] as string | number | boolean | null),
              series_key: yKey,
            }),
      }))
  }

  if (type === "ranked_list") {
    return asArray(widget.items)
      .map((item) => asRecord(item))
      .filter(Boolean)
      .map((item, index) => ({
        ...base,
        row_type: "ranked_item",
        rank: index + 1,
        label: asString(item?.label) || asString(item?.title) || `Item ${index + 1}`,
        value: item?.value === undefined && item?.count === undefined ? null : ((item?.value ?? item?.count) as string | number | boolean | null),
        secondary_value:
          item?.secondary_value === undefined ? null : (item.secondary_value as string | number | boolean | null),
        detail: asString(item?.detail) || null,
        barcode: asString(item?.barcode || asRecord(item?.meta)?.barcode) || null,
        image_url: asString(item?.image_url) || null,
      }))
  }

  if (type === "risk_panel") {
    return asArray(widget.items)
      .map((item) => asRecord(item))
      .filter(Boolean)
      .map((item, index) => ({
        ...base,
        row_type: "risk",
        row_index: index + 1,
        label: asString(item?.label) || `Risk ${index + 1}`,
        severity: asString(item?.severity || widget.severity) || null,
        detail: asString(item?.detail) || null,
        next_action: asString(item?.next_action) || null,
      }))
  }

  if (type === "comparison_table") {
    const rawColumns = asArray(widget.columns)
    const hasBarcodeColumn = rawColumns.some((column) => {
      const record = asRecord(column)
      return (asString(record?.key) || String(column)).toLowerCase() === "barcode"
    })
    const columns = rawColumns
      .map((column, index) => {
        const record = asRecord(column)
        if (record) {
          return {
            key: asString(record.key) || `col_${index}`,
            label: asString(record.label) || humanizeKey(record.key) || `Column ${index + 1}`,
          }
        }
        return {
          key: String(column),
          label: humanizeKey(column),
        }
      })
      .filter((column) => !(hasBarcodeColumn && column.key.toLowerCase() === "sku"))
    return asArray(widget.rows)
      .map((row) => asRecord(row))
      .filter(Boolean)
      .map((row, index) => {
        const output: ExportRow = {
          ...base,
          row_type: "table_row",
          row_index: index + 1,
        }
        columns.forEach((column) => {
          output[column.label] = row?.[column.key] === undefined ? null : (row[column.key] as string | number | boolean | null)
        })
        output.image_url = asString(row?.image_url || row?.display_image || row?.product_variant_image_url) || null
        output.label = asString(row?.label || row?.title || row?.name) || null
        output.detail = asString(row?.detail || row?.subtitle) || null
        return output
      })
  }

  if (type === "timeline") {
    return asArray(widget.events ?? widget.items)
      .map((item) => asRecord(item))
      .filter(Boolean)
      .map((item, index) => ({
        ...base,
        row_type: "timeline_event",
        row_index: index + 1,
        title: asString(item?.title) || asString(item?.event_name) || `Event ${index + 1}`,
        timestamp: asString(item?.timestamp) || asString(item?.occurred_at) || null,
        severity: asString(item?.severity) || null,
        detail: asString(item?.detail) || asString(item?.summary) || null,
      }))
  }

  if (type === "progress_tracker") {
    return asArray(widget.steps)
      .map((item) => asRecord(item))
      .filter(Boolean)
      .map((item, index) => ({
        ...base,
        row_type: "progress_step",
        row_index: index + 1,
        label: asString(item?.label) || `Step ${index + 1}`,
        status: asString(item?.status) || null,
        detail: asString(item?.detail) || null,
      }))
  }

  if (type === "entity_preview") {
    const entity = asRecord(widget.entity) ?? {}
    return [
      {
        ...base,
        row_type: "entity_preview",
        title: asString(entity.title) || asString(entity.name) || null,
        subtitle: asString(entity.subtitle) || null,
        kind: asString(entity.kind) || null,
        image_url: resolveExportImageUrl(asString(entity.image_url)) || null,
        meta: asArray(entity.meta).map((meta) => printText(meta)).join(" | ") || null,
      },
    ]
  }

  if (type === "action_form") {
    return asArray(widget.fields)
      .map((item) => asRecord(item))
      .filter(Boolean)
      .map((item, index) => ({
        ...base,
        row_type: "action_field",
        row_index: index + 1,
        label: asString(item?.label) || asString(item?.name) || `Field ${index + 1}`,
        field_name: asString(item?.name) || null,
        field_type: asString(item?.type) || null,
        required: item?.required === undefined ? null : Boolean(item.required),
        placeholder: asString(item?.placeholder) || null,
      }))
  }

  if (type === "confirmation_card") {
    return [
      {
        ...base,
        row_type: "confirmation",
        summary: asString(widget.summary) || null,
        risk_level: asString(widget.risk_level) || null,
        action: asString(widget.action) || null,
      },
    ]
  }

  return [
    {
      ...base,
      row_type: "raw_widget",
      raw_json: JSON.stringify(widget),
    },
  ]
}

export const buildInsightCsvRows = (payload: ExportStructuredPayload): ExportRow[] => {
  if (!isInsightPayload(payload)) {
    return []
  }

  const rows: ExportRow[] = []
  const summary = asString(payload.summary).trim()
  const explanation = asString(payload.explanation).trim()

  if (summary || explanation) {
    rows.push({
      row_type: "readout",
      summary: summary || null,
      explanation: explanation || null,
    })
  }

  appendRows(
    rows,
    asArray(payload.insights)
      .map((item) => asRecord(item))
      .filter(Boolean)
      .map((item, index) => ({
        row_type: "insight",
        row_index: index + 1,
        title: asString(item?.title) || `Insight ${index + 1}`,
        detail: asString(item?.detail) || asString(item?.summary) || asString(item?.description) || null,
      })),
  )

  asArray(payload.widgets)
    .map((widget) => asRecord(widget))
    .filter(Boolean)
    .forEach((widget) => appendRows(rows, widgetRows(widget)))

  appendRows(
    rows,
    asArray(payload.suggested_actions)
      .map((item) => asRecord(item))
      .filter(Boolean)
      .map((item, index) => ({
        row_type: "suggested_action",
        row_index: index + 1,
        label: asString(item?.label) || asString(item?.action) || `Action ${index + 1}`,
        prompt: asString(item?.prompt) || null,
      })),
  )

  appendRows(
    rows,
    asArray(payload.warnings)
      .map((item) => asString(item).trim())
      .filter(Boolean)
      .map((warning, index) => ({
        row_type: "warning",
        row_index: index + 1,
        message: warning,
      })),
  )

  appendRows(
    rows,
    asArray(payload.permissions_checked)
      .map((item) => asString(item).trim())
      .filter(Boolean)
      .map((permission, index) => ({
        row_type: "permission_checked",
        row_index: index + 1,
        permission,
      })),
  )

  appendRows(
    rows,
    asArray(payload.data_sources)
      .map((item) => asRecord(item))
      .filter(Boolean)
      .map((item, index) => ({
        row_type: "data_source",
        row_index: index + 1,
        service: asString(item?.service) || null,
        endpoint_or_topic: asString(item?.endpoint_or_topic) || null,
        freshness: asString(item?.freshness) || null,
      })),
  )

  return rows
}

export const buildInsightCsv = (payload: ExportStructuredPayload): string => {
  const rows = buildInsightCsvRows(payload).map(removeInternalRowFields)
  const sheet = XLSX.utils.json_to_sheet(rows.length ? rows : [{ note: "No structured insight rows were found." }])
  return XLSX.utils.sheet_to_csv(sheet)
}

export const buildChatCsvRows = (messages: ExportChatMessage[]): ChatCsvRow[] =>
  messages.map((message) => ({
    message_id: message.id,
    role: message.role,
    timestamp: message.timestamp || "",
    content: message.content || "",
    has_structured_payload: Boolean(message.structuredPayload),
    structured_summary: message.structuredPayload
      ? asString(message.structuredPayload.summary) ||
        asString(message.structuredPayload.title) ||
        asString(message.structuredPayload.kind) ||
        JSON.stringify(message.structuredPayload).slice(0, 500)
      : "",
  }))

export const buildChatCsv = (messages: ExportChatMessage[]): string => csvRowsToText(buildChatCsvRows(messages))

const renderTable = (columns: string[], rows: ExportRow[]) => `
  <div class="table-wrap">
    <table>
      <thead>
        <tr>${columns.map((column) => `<th>${escapeHtml(column)}</th>`).join("")}</tr>
      </thead>
      <tbody>
        ${rows
          .map(
            (row) => `
          <tr>
            ${columns.map((column) => `<td>${escapeHtml(printText(row[column])) || "&nbsp;"}</td>`).join("")}
          </tr>
        `,
          )
          .join("")}
      </tbody>
    </table>
  </div>
`

const renderRankedListHtml = (widget: Record<string, unknown>) => {
  const items = asArray(widget.items).map((item) => asRecord(item)).filter(Boolean)
  if (!items.length) {
    return `<p class="muted">No ranked items were found.</p>`
  }
  return `
    <div class="ranked-list">
      ${items
        .map((item, index) => {
          const label = asString(item?.label) || asString(item?.title) || `Item ${index + 1}`
          const imageUrl = resolveExportImageUrl(asString(item?.image_url))
          const barcode = asString(item?.barcode || asRecord(item?.meta)?.barcode)
          return `
            <div class="ranked-item">
              <span class="rank-badge">${index + 1}</span>
              ${imageUrl ? `<img class="ranked-image" src="${escapeHtml(imageUrl)}" alt="${escapeHtml(label)}" />` : ""}
              <div class="ranked-main">
                <strong>${escapeHtml(label)}</strong>
                ${asString(item?.detail) ? `<span>${escapeHtml(asString(item.detail))}</span>` : ""}
                ${barcode ? `<span class="barcode">Barcode: ${escapeHtml(barcode)}</span>` : ""}
              </div>
              <div class="ranked-values">
                <strong>${escapeHtml(printText(item?.value ?? item?.count))}</strong>
                ${item?.secondary_value !== undefined ? `<span>${escapeHtml(printText(item.secondary_value))}</span>` : ""}
              </div>
            </div>
          `
        })
        .join("")}
    </div>
  `
}

const renderProductCardRowsHtml = (rows: ExportRow[]) => {
  const imageRows = rows.filter((row) => asString(row.image_url))
  if (!imageRows.length) {
    return ""
  }
  return `
    <div class="ranked-list">
      ${imageRows
        .map((row) => {
          const label = asString(row.label) || asString(row.widget_title) || "Product"
          const imageUrl = asString(row.image_url)
          const barcode = asString(row.barcode)
          const detail = asString(row.detail)
          return `
            <div class="ranked-item">
              ${imageUrl ? `<img class="ranked-image" src="${escapeHtml(imageUrl)}" alt="${escapeHtml(label)}" />` : ""}
              <div class="ranked-main">
                <strong>${escapeHtml(label)}</strong>
                ${detail ? `<span>${escapeHtml(detail)}</span>` : ""}
                ${barcode ? `<span class="barcode">Barcode: ${escapeHtml(barcode)}</span>` : ""}
              </div>
            </div>
          `
        })
        .join("")}
    </div>
  `
}

const renderInsightWidgetHtml = (widget: Record<string, unknown>) => {
  const rows = widgetRows(widget)
  const type = asString(widget.type) || "widget"
  const title = asString(widget.title) || type.replace(/_/g, " ")
  const subtitle = asString(widget.subtitle)
  const columns = userFacingColumnsFromRows(rows)
  const body =
    type === "ranked_list"
      ? renderRankedListHtml(widget)
      : type === "comparison_table" && rows.some((row) => asString(row.image_url))
        ? `${renderProductCardRowsHtml(rows)}${renderTable(columns, rows)}`
        : renderTable(columns, rows)
  return `
    <section class="card">
      <div class="section-head">
        <div>
          <h3>${escapeHtml(title)}</h3>
          ${subtitle ? `<p class="muted">${escapeHtml(subtitle)}</p>` : ""}
        </div>
        <span class="type-pill">${escapeHtml(type)}</span>
      </div>
      ${body}
    </section>
  `
}

export const buildInsightReportBodyHtml = (payload: ExportStructuredPayload): string => {
  if (!isInsightPayload(payload)) {
    return `<section class="card"><h3>No structured insight payload</h3><p class="muted">This response does not include widget data.</p></section>`
  }

  const summary = asString(payload.summary).trim()
  const explanation = asString(payload.explanation).trim()
  const insights = asArray(payload.insights).map((item) => asRecord(item)).filter(Boolean)
  const widgets = asArray(payload.widgets).map((item) => asRecord(item)).filter(Boolean)
  const actions = asArray(payload.suggested_actions).map((item) => asRecord(item)).filter(Boolean)

  return `
    ${
      summary || explanation || insights.length
        ? `
      <section class="hero">
        ${summary ? `<h2>${escapeHtml(summary)}</h2>` : ""}
        ${explanation ? `<p>${escapeHtml(explanation)}</p>` : ""}
        ${
          insights.length
            ? `<div class="insight-grid">
              ${insights
                .map(
                  (insight, index) => `
                <article class="mini-card">
                  <h4>${escapeHtml(asString(insight.title) || `Insight ${index + 1}`)}</h4>
                  <p>${escapeHtml(asString(insight.detail) || asString(insight.summary) || asString(insight.description))}</p>
                </article>
              `,
                )
                .join("")}
            </div>`
            : ""
        }
      </section>
    `
        : ""
    }
    ${widgets.map((widget) => renderInsightWidgetHtml(widget)).join("")}
    ${
      actions.length
        ? `
      <section class="card">
        <h3>Suggested actions</h3>
        <ul class="list">
          ${actions
            .map(
              (action, index) => `
            <li><strong>${escapeHtml(asString(action.label) || asString(action.action) || `Action ${index + 1}`)}</strong>${
              asString(action.prompt) ? `: ${escapeHtml(asString(action.prompt))}` : ""
            }</li>
          `,
            )
            .join("")}
        </ul>
      </section>
    `
        : ""
    }
  `
}

export const buildInsightReportDocument = (
  payload: ExportStructuredPayload,
  {
    title = "AI Insight Report",
  }: {
    title?: string
  } = {},
) =>
  `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>${escapeHtml(title)}</title>
      <style>
        ${reportStyles}
      </style>
    </head>
    <body>
      <main class="page">
        <header class="report-header">
          <p class="eyebrow">Intera AI</p>
          <h1>${escapeHtml(title)}</h1>
          <p class="muted">Generated ${escapeHtml(new Date().toLocaleString())}</p>
        </header>
        ${buildInsightReportBodyHtml(payload)}
      </main>
    </body>
  </html>
`

export const buildChatReportBodyHtml = (messages: ExportChatMessage[]) =>
  messages
    .map((message) => {
      const bubbleClass = message.role === "user" ? "message user" : "message assistant"
      const header = `
        <div class="message-meta">
          <span class="author">${message.role === "user" ? "You" : "Intera AI"}</span>
          ${message.timestamp ? `<span class="timestamp">${escapeHtml(message.timestamp)}</span>` : ""}
        </div>
      `
      if (message.role === "assistant" && isInsightPayload(message.structuredPayload)) {
        return `
          <section class="${bubbleClass}">
            ${header}
            ${buildInsightReportBodyHtml(message.structuredPayload)}
          </section>
        `
      }
      return `
        <section class="${bubbleClass}">
          ${header}
          <div class="message-body text-block">${escapeHtml(message.content).replace(/\n/g, "<br />")}</div>
        </section>
      `
    })
    .join("")

export const buildChatReportDocument = (
  messages: ExportChatMessage[],
  {
    title = "AI Chat Export",
  }: {
    title?: string
  } = {},
) =>
  `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>${escapeHtml(title)}</title>
      <style>
        ${reportStyles}
        .chat-page { gap: 16px; }
        .message { border-radius: 24px; padding: 18px 20px; page-break-inside: avoid; }
        .message.assistant { background: #ffffff; border: 1px solid #dbe4f0; }
        .message.user { background: #e0ecff; border: 1px solid #bfdbfe; }
        .message-meta { display: flex; justify-content: space-between; gap: 12px; font-size: 12px; color: #64748b; margin-bottom: 10px; }
        .author { font-weight: 700; color: #0f172a; }
        .text-block { font-size: 14px; line-height: 1.7; color: #1e293b; }
      </style>
    </head>
    <body>
      <main class="page chat-page">
        <header class="report-header">
          <p class="eyebrow">Intera AI</p>
          <h1>${escapeHtml(title)}</h1>
          <p class="muted">Generated ${escapeHtml(new Date().toLocaleString())}</p>
        </header>
        ${buildChatReportBodyHtml(messages)}
      </main>
    </body>
  </html>
`

const downloadBlob = (content: BlobPart, contentType: string, filename: string) => {
  const blob = new Blob([content], { type: contentType })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  window.setTimeout(() => {
    anchor.remove()
    URL.revokeObjectURL(url)
  }, 10_000)
}

const downloadExistingBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  window.setTimeout(() => {
    anchor.remove()
    URL.revokeObjectURL(url)
  }, 10_000)
}

const openExportWindow = (title: string) => {
  const popup = window.open("", "_blank", "noopener,noreferrer")
  if (!popup) {
    return null
  }
  popup.document.open()
  popup.document.write(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${escapeHtml(title)}</title>
        <style>
          body { font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 32px; background: #f8fafc; color: #0f172a; }
          .shell { max-width: 960px; margin: 0 auto; background: #fff; border: 1px solid #dbe4f0; border-radius: 24px; padding: 24px; }
          h1 { margin: 0 0 12px; font-size: 24px; }
          p { color: #64748b; line-height: 1.6; }
        </style>
      </head>
      <body>
        <div class="shell">
          <h1>${escapeHtml(title)}</h1>
          <p>Preparing export…</p>
        </div>
      </body>
    </html>
  `)
  popup.document.close()
  return popup
}

const renderCsvPopup = (popup: Window | null, title: string, csv: string, filename: string) => {
  if (!popup || popup.closed) {
    downloadCsvFile(csv, filename)
    return
  }
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
  const blobUrl = URL.createObjectURL(blob)
  popup.document.open()
  popup.document.write(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${escapeHtml(title)}</title>
        <style>
          body { font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 32px; background: #f8fafc; color: #0f172a; }
          .shell { max-width: 1080px; margin: 0 auto; background: #fff; border: 1px solid #dbe4f0; border-radius: 24px; padding: 24px; }
          h1 { margin: 0 0 8px; font-size: 24px; }
          p { color: #64748b; line-height: 1.6; }
          .actions { margin: 20px 0; display: flex; gap: 12px; flex-wrap: wrap; }
          .button { display: inline-flex; align-items: center; border-radius: 999px; padding: 12px 18px; background: #0f172a; color: #fff; text-decoration: none; font-weight: 600; }
          .button.secondary { background: #e2e8f0; color: #0f172a; }
          pre { overflow: auto; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 18px; padding: 16px; white-space: pre-wrap; word-break: break-word; font-size: 12px; line-height: 1.5; }
        </style>
      </head>
      <body>
        <div class="shell">
          <h1>${escapeHtml(title)}</h1>
          <p>CSV export is ready.</p>
          <div class="actions">
            <a class="button" href="${blobUrl}" download="${escapeHtml(filename)}">Download CSV</a>
            <a class="button secondary" href="${blobUrl}" target="_blank" rel="noopener noreferrer">Open Raw CSV</a>
          </div>
          <pre>${escapeHtml(csv)}</pre>
        </div>
      </body>
    </html>
  `)
  popup.document.close()
}

const renderPdfPopup = (popup: Window | null, title: string, blob: Blob, filename: string) => {
  if (!popup || popup.closed) {
    downloadExistingBlob(blob, filename)
    return
  }
  const blobUrl = URL.createObjectURL(blob)
  popup.document.open()
  popup.document.write(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${escapeHtml(title)}</title>
        <style>
          body { font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 0; background: #0f172a; color: #fff; }
          .topbar { display: flex; justify-content: space-between; gap: 16px; align-items: center; padding: 16px 20px; background: rgba(15, 23, 42, 0.94); position: sticky; top: 0; }
          .meta h1 { margin: 0; font-size: 18px; }
          .meta p { margin: 4px 0 0; color: #cbd5e1; font-size: 13px; }
          .actions { display: flex; gap: 12px; flex-wrap: wrap; }
          .button { display: inline-flex; align-items: center; border-radius: 999px; padding: 10px 16px; background: #fff; color: #0f172a; text-decoration: none; font-weight: 600; }
          iframe { width: 100%; height: calc(100vh - 82px); border: 0; background: #fff; }
        </style>
      </head>
      <body>
        <div class="topbar">
          <div class="meta">
            <h1>${escapeHtml(title)}</h1>
            <p>PDF export is ready.</p>
          </div>
          <div class="actions">
            <a class="button" href="${blobUrl}" download="${escapeHtml(filename)}">Download PDF</a>
          </div>
        </div>
        <iframe src="${blobUrl}" title="${escapeHtml(title)}"></iframe>
      </body>
    </html>
  `)
  popup.document.close()
}

export const downloadTextFile = (content: string, filename: string) => {
  downloadBlob(content, "text/plain;charset=utf-8", filename)
}

export const downloadJsonFile = (value: unknown, filename: string) => {
  downloadBlob(JSON.stringify(value, null, 2), "application/json", filename)
}

export const downloadCsvFile = (csv: string, filename: string) => {
  downloadBlob(csv, "text/csv;charset=utf-8", filename)
}

const openPrintWindow = (title: string, documentHtml: string) => {
  const popup = window.open("", "_blank", "noopener,noreferrer")
  if (!popup) {
    throw new Error("Unable to open print window.")
  }
  popup.document.open()
  popup.document.write(documentHtml)
  popup.document.close()
  popup.focus()
  popup.addEventListener("load", () => {
    popup.print()
  })
  setTimeout(() => {
    try {
      popup.print()
    } catch {
      void title
    }
  }, 350)
}

const pdfText = (value: unknown) => printText(value).slice(0, 500)

const dateTokenPattern = /\b\d{4}-\d{2}-\d{2}\b/g

const collectDateTokens = (value: unknown, target: Set<string>) => {
  if (typeof value === "string") {
    for (const match of value.matchAll(dateTokenPattern)) {
      target.add(match[0])
    }
    return
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectDateTokens(item, target))
    return
  }
  const record = asRecord(value)
  if (record) {
    Object.values(record).forEach((item) => collectDateTokens(item, target))
  }
}

const resolvePayloadTimeframe = (payload?: ExportStructuredPayload) => {
  if (!payload) return ""
  const timeframe = asRecord(payload.timeframe) ?? asRecord(payload.period) ?? asRecord(payload.date_range)
  const start =
    asString(timeframe?.start_date) ||
    asString(timeframe?.startDate) ||
    asString(timeframe?.date_from) ||
    asString(timeframe?.from) ||
    asString(payload._window_start_date) ||
    asString(payload.start_date) ||
    asString(payload.date_from)
  const end =
    asString(timeframe?.end_date) ||
    asString(timeframe?.endDate) ||
    asString(timeframe?.date_to) ||
    asString(timeframe?.to) ||
    asString(payload._window_end_date) ||
    asString(payload.end_date) ||
    asString(payload.date_to)
  const label = asString(timeframe?.label) || asString(payload._window_label)
  if (start && end) {
    return label ? `${label}: ${start} to ${end}` : `${start} to ${end}`
  }

  const dateTokens = new Set<string>()
  collectDateTokens(payload.widgets, dateTokens)
  const sortedDates = Array.from(dateTokens).sort()
  if (sortedDates.length >= 2) {
    return label ? `${label}: ${sortedDates[0]} to ${sortedDates[sortedDates.length - 1]}` : `${sortedDates[0]} to ${sortedDates[sortedDates.length - 1]}`
  }
  return label || ""
}

const createReactPdfBlob = async (
  title: string,
  mode: "insight" | "chat",
  body: ExportStructuredPayload | ExportChatMessage[],
) => {
  const React = await import("react")
  const { Document, Page, Text, View, Image, StyleSheet, pdf, Svg, Line: PdfLine, Polyline, Rect, Circle, Path } =
    await import("@react-pdf/renderer")
  const h = React.createElement
  const chartPalette = ["#0f766e", "#1d4ed8", "#ca8a04", "#c2410c", "#9333ea", "#be185d"]
  const hydratedBody =
    mode === "insight"
      ? ((await hydrateExportImages(body)) as ExportStructuredPayload)
      : ((await hydrateExportImages(body)) as ExportChatMessage[])
  const reportTimeframe =
    mode === "insight"
      ? resolvePayloadTimeframe(hydratedBody as ExportStructuredPayload)
      : resolvePayloadTimeframe(
          (hydratedBody as ExportChatMessage[]).find((message) => isInsightPayload(message.structuredPayload))?.structuredPayload,
        )

  const styles = StyleSheet.create({
    page: {
      padding: 30,
      fontFamily: "Helvetica",
      fontSize: 10,
      color: "#0f172a",
      backgroundColor: "#f8fafc",
    },
    header: {
      padding: 18,
      marginBottom: 14,
      borderRadius: 10,
      backgroundColor: "#eaf2ff",
      borderWidth: 1,
      borderColor: "#dbe4f0",
    },
    eyebrow: {
      fontSize: 8,
      color: "#475569",
      textTransform: "uppercase",
      letterSpacing: 1.4,
      marginBottom: 5,
    },
    title: {
      fontSize: 21,
      fontWeight: 700,
      lineHeight: 1.2,
    },
    generated: {
      marginTop: 7,
      fontSize: 9,
      color: "#64748b",
    },
    card: {
      padding: 14,
      marginBottom: 12,
      borderRadius: 9,
      backgroundColor: "#ffffff",
      borderWidth: 1,
      borderColor: "#dbe4f0",
    },
    cardSoft: {
      padding: 10,
      marginTop: 8,
      borderRadius: 8,
      backgroundColor: "#f8fafc",
      borderWidth: 1,
      borderColor: "#e5edf7",
    },
    cardTitle: {
      fontSize: 13,
      fontWeight: 700,
      marginBottom: 5,
    },
    subtitle: {
      fontSize: 9,
      color: "#64748b",
      lineHeight: 1.5,
      marginBottom: 8,
    },
    paragraph: {
      fontSize: 10,
      color: "#334155",
      lineHeight: 1.55,
      marginTop: 5,
    },
    row: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: "#e5edf7",
      borderBottomStyle: "solid",
    },
    th: {
      flex: 1,
      padding: 6,
      fontSize: 7,
      color: "#64748b",
      fontWeight: 700,
      backgroundColor: "#f8fafc",
      textTransform: "uppercase",
    },
    td: {
      flex: 1,
      padding: 6,
      fontSize: 8,
      color: "#1e293b",
      lineHeight: 1.35,
    },
    badgeRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
      marginTop: 8,
    },
    badge: {
      paddingVertical: 4,
      paddingHorizontal: 7,
      borderRadius: 99,
      backgroundColor: "#eef2ff",
      color: "#3730a3",
      fontSize: 8,
    },
    messageUser: {
      padding: 12,
      marginBottom: 10,
      borderRadius: 9,
      backgroundColor: "#e0ecff",
      borderWidth: 1,
      borderColor: "#bfdbfe",
    },
    messageAssistant: {
      padding: 12,
      marginBottom: 10,
      borderRadius: 9,
      backgroundColor: "#ffffff",
      borderWidth: 1,
      borderColor: "#dbe4f0",
    },
    meta: {
      fontSize: 8,
      color: "#64748b",
      marginBottom: 7,
    },
    chartFrame: {
      marginTop: 10,
      padding: 10,
      borderRadius: 8,
      backgroundColor: "#f8fafc",
      borderWidth: 1,
      borderColor: "#e5edf7",
    },
    chartLegend: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginTop: 8,
    },
    chartLegendItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      fontSize: 8,
      color: "#334155",
    },
    chartLegendSwatch: {
      width: 7,
      height: 7,
      borderRadius: 99,
    },
    rankedItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 9,
      padding: 10,
      marginTop: 7,
      borderRadius: 8,
      backgroundColor: "#f8fafc",
      borderWidth: 1,
      borderColor: "#e5edf7",
    },
    rankBadge: {
      width: 24,
      height: 24,
      borderRadius: 99,
      backgroundColor: "#ffffff",
      textAlign: "center",
      paddingTop: 6,
      fontSize: 8,
      fontWeight: 700,
      color: "#475569",
    },
    productImage: {
      width: 42,
      height: 42,
      borderRadius: 9,
      objectFit: "cover",
      backgroundColor: "#eaf2ff",
    },
    productImageFallback: {
      width: 42,
      height: 42,
      borderRadius: 9,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#eaf2ff",
      borderWidth: 1,
      borderColor: "#dbe4f0",
    },
    productImageText: {
      fontSize: 13,
      fontWeight: 700,
      color: "#1d4ed8",
    },
    rankedMain: {
      flex: 1,
    },
    rankedValue: {
      width: 90,
      textAlign: "right",
    },
  })

  const getChartData = (widget: Record<string, unknown>) =>
    asArray(widget.data).map((item) => asRecord(item)).filter(Boolean) as Array<Record<string, unknown>>

  const resolveChartKeys = (widget: Record<string, unknown>) => ({
    xKey: asString(widget.x_key) || asString(widget.label_key) || "label",
    yKey: asString(widget.y_key) || asString(widget.value_key) || "value",
  })

  const resolveChartSeries = (widget: Record<string, unknown>, fallbackYKey: string) => {
    const series = asArray(widget.series)
      .map((item, index) => {
        const record = asRecord(item)
        const key = asString(record?.key)
        if (!key) return null
        return {
          key,
          label: asString(record?.label) || humanizeKey(key),
          color: asString(record?.color) || chartPalette[index % chartPalette.length],
        }
      })
      .filter(Boolean) as Array<{ key: string; label: string; color: string }>
    return series.length ? series : [{ key: fallbackYKey, label: humanizeKey(fallbackYKey), color: "#1d4ed8" }]
  }

  const chartNumber = (value: unknown) => {
    if (typeof value === "number" && Number.isFinite(value)) return value
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value)
      return Number.isFinite(parsed) ? parsed : 0
    }
    return 0
  }

  const shortLabel = (value: unknown, max = 16) => {
    const text = pdfText(value)
    return text.length > max ? `${text.slice(0, max - 1)}…` : text
  }

  const chartAxisLabel = (value: unknown) => {
    const text = pdfText(value).trim()
    const dateMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (dateMatch) {
      return `${dateMatch[2]}/${dateMatch[3]}`
    }
    const monthMatch = text.match(/^(\d{4})-(\d{2})$/)
    if (monthMatch) {
      return `${monthMatch[1]}/${monthMatch[2]}`
    }
    return shortLabel(text, 13)
  }

  const chartLegendLabel = (value: unknown) => shortLabel(value, 34)

  const formatChartTick = (value: number) => {
    const absolute = Math.abs(value)
    if (absolute >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1).replace(/\.0$/, "")}B`
    if (absolute >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`
    if (absolute >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, "")}K`
    return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, "")
  }

  const chartTickTextProps = {
    fontSize: 7,
    fill: "#64748b",
  }

  const getSampledTickIndexes = (length: number, maxTicks = 6) => {
    if (length <= 0) return []
    if (length <= maxTicks) return Array.from({ length }, (_, index) => index)
    const indexes = new Set<number>()
    const lastIndex = length - 1
    for (let tick = 0; tick < maxTicks; tick += 1) {
      indexes.add(Math.round((tick / (maxTicks - 1)) * lastIndex))
    }
    return Array.from(indexes).sort((a, b) => a - b)
  }

  const clampChartLabelX = (x: number, width: number, right: number) =>
    Math.max(42, Math.min(x, width - right - 48))

  const renderPdfBarChart = (widget: Record<string, unknown>) => {
    const data = getChartData(widget).slice(0, 24)
    const { xKey, yKey } = resolveChartKeys(widget)
    if (!data.length) return null

    const width = 500
    const height = 210
    const left = 44
    const right = 12
    const top = 14
    const bottom = 42
    const plotWidth = width - left - right
    const plotHeight = height - top - bottom
    const maxValue = Math.max(...data.map((item) => chartNumber(item[yKey])), 1)
    const barGap = 4
    const barWidth = Math.max(4, (plotWidth - barGap * (data.length - 1)) / data.length)
    const useIndexedLabels = data.some((item) => pdfText(item[xKey]).length > 14)

    return h(
      View,
      { style: styles.chartFrame, wrap: false },
      h(
        Svg,
        { width, height, viewBox: `0 0 ${width} ${height}` },
        h(PdfLine, { x1: left, y1: top, x2: left, y2: top + plotHeight, stroke: "#cbd5e1", strokeWidth: 1 }),
        h(PdfLine, { x1: left, y1: top + plotHeight, x2: width - right, y2: top + plotHeight, stroke: "#cbd5e1", strokeWidth: 1 }),
        ...[0, 0.25, 0.5, 0.75, 1].flatMap((ratio) => {
          const y = top + plotHeight - plotHeight * ratio
          return [
            h(PdfLine, {
              key: `grid-${ratio}`,
              x1: left,
              y1: y,
              x2: width - right,
              y2: y,
              stroke: "#e2e8f0",
              strokeWidth: 0.7,
            }),
            h(Text, {
              key: `grid-label-${ratio}`,
              x: 2,
              y: y + 2.5,
              ...chartTickTextProps,
            }, formatChartTick(maxValue * ratio)),
          ]
        }),
        ...getSampledTickIndexes(data.length, 6).map((index) => {
          const x = left + index * (barWidth + barGap) + barWidth / 2
          return h(Text, {
            key: `x-label-${index}`,
            x: clampChartLabelX(x - 18, width, right),
            y: top + plotHeight + 15,
            ...chartTickTextProps,
          }, useIndexedLabels ? String(index + 1) : chartAxisLabel(data[index]?.[xKey]))
        }),
        ...data.map((item, index) => {
          const value = chartNumber(item[yKey])
          const barHeight = Math.max((value / maxValue) * plotHeight, value > 0 ? 2 : 0)
          const x = left + index * (barWidth + barGap)
          const y = top + plotHeight - barHeight
          return h(Rect, {
            key: `bar-${index}`,
            x,
            y,
            width: barWidth,
            height: barHeight,
            fill: chartPalette[index % chartPalette.length],
            rx: 3,
          })
        }),
      ),
      h(
        View,
        {
          style: [
            styles.chartLegend,
            useIndexedLabels
              ? {
                  flexDirection: "column",
                  gap: 5,
                }
              : null,
          ],
        },
        ...data.slice(0, 8).map((item, index) =>
          h(
            View,
            {
              key: `legend-${index}`,
              style: [
                styles.chartLegendItem,
                useIndexedLabels
                  ? {
                      width: "100%",
                      alignItems: "flex-start",
                    }
                  : {
                      width: data.length <= 3 ? 145 : 118,
                      alignItems: "flex-start",
                    },
              ],
            },
            h(View, { style: [styles.chartLegendSwatch, { backgroundColor: chartPalette[index % chartPalette.length] }] }),
            h(
              Text,
              { style: { flex: 1, lineHeight: 1.25 } },
              useIndexedLabels
                ? `${index + 1}. ${pdfText(item[xKey])}: ${formatChartTick(chartNumber(item[yKey]))}`
                : `${chartLegendLabel(item[xKey])}: ${formatChartTick(chartNumber(item[yKey]))}`,
            ),
          ),
        ),
      ),
    )
  }

  const renderPdfLineChart = (widget: Record<string, unknown>) => {
    const data = getChartData(widget).slice(0, 120)
    const { xKey, yKey } = resolveChartKeys(widget)
    const series = resolveChartSeries(widget, yKey)
    if (!data.length) return null

    const width = 500
    const height = 230
    const left = 44
    const right = 12
    const top = 14
    const bottom = 38
    const plotWidth = width - left - right
    const plotHeight = height - top - bottom
    const values = data.flatMap((item) => series.map((seriesItem) => chartNumber(item[seriesItem.key])))
    const actualMinValue = Math.min(...values)
    const maxValue = Math.max(...values, 1)
    const minValue =
      actualMinValue === maxValue
        ? Math.min(actualMinValue, 0)
        : actualMinValue > 0
          ? Math.max(0, actualMinValue - (maxValue - actualMinValue) * 0.12)
          : actualMinValue
    const range = Math.max(maxValue - minValue, 1)
    const buildPoints = (seriesKey: string) =>
      data
        .map((item, index) => {
        const x = left + (data.length === 1 ? plotWidth / 2 : (index / (data.length - 1)) * plotWidth)
          const y = top + plotHeight - ((chartNumber(item[seriesKey]) - minValue) / range) * plotHeight
        return `${x.toFixed(2)},${y.toFixed(2)}`
        })
        .join(" ")
    const first = data[0]
    const last = data[data.length - 1]

    return h(
      View,
      { style: styles.chartFrame, wrap: false },
      h(
        Svg,
        { width, height, viewBox: `0 0 ${width} ${height}` },
        h(PdfLine, { x1: left, y1: top, x2: left, y2: top + plotHeight, stroke: "#cbd5e1", strokeWidth: 1 }),
        h(PdfLine, { x1: left, y1: top + plotHeight, x2: width - right, y2: top + plotHeight, stroke: "#cbd5e1", strokeWidth: 1 }),
        ...[0, 0.25, 0.5, 0.75, 1].flatMap((ratio) => {
          const y = top + plotHeight - plotHeight * ratio
          const value = minValue + range * ratio
          return [
            h(PdfLine, {
              key: `line-grid-${ratio}`,
              x1: left,
              y1: y,
              x2: width - right,
              y2: y,
              stroke: "#e2e8f0",
              strokeWidth: 0.7,
            }),
            h(Text, {
              key: `line-grid-label-${ratio}`,
              x: 2,
              y: y + 2.5,
              ...chartTickTextProps,
            }, formatChartTick(value)),
          ]
        }),
        ...getSampledTickIndexes(data.length, 6).map((index) => {
          const x = left + (data.length === 1 ? plotWidth / 2 : (index / (data.length - 1)) * plotWidth)
          return h(Text, {
            key: `line-x-label-${index}`,
            x: clampChartLabelX(x - 18, width, right),
            y: top + plotHeight + 15,
            ...chartTickTextProps,
          }, chartAxisLabel(data[index]?.[xKey]))
        }),
        ...series.map((seriesItem) =>
          h(Polyline, {
            key: `series-${seriesItem.key}`,
            points: buildPoints(seriesItem.key),
            fill: "none",
            stroke: seriesItem.color,
            strokeWidth: 2.2,
          }),
        ),
      ),
      h(
        View,
        { style: styles.chartLegend },
        ...series.slice(0, 8).map((seriesItem) =>
          h(
            View,
            { key: `legend-${seriesItem.key}`, style: [styles.chartLegendItem, { width: 145, alignItems: "flex-start" }] },
            h(View, { style: [styles.chartLegendSwatch, { backgroundColor: seriesItem.color }] }),
            h(Text, { style: { flex: 1, lineHeight: 1.25 } }, `${chartLegendLabel(seriesItem.label)} · Last ${formatChartTick(chartNumber(last?.[seriesItem.key]))}`),
          ),
        ),
      ),
    )
  }

  const describeArc = (cx: number, cy: number, radius: number, startAngle: number, endAngle: number) => {
    const start = {
      x: cx + radius * Math.cos((Math.PI / 180) * startAngle),
      y: cy + radius * Math.sin((Math.PI / 180) * startAngle),
    }
    const end = {
      x: cx + radius * Math.cos((Math.PI / 180) * endAngle),
      y: cy + radius * Math.sin((Math.PI / 180) * endAngle),
    }
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1"
    return `M ${cx} ${cy} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y} Z`
  }

  const renderPdfDonutChart = (widget: Record<string, unknown>) => {
    const data = getChartData(widget).slice(0, 12)
    const valueKey = asString(widget.value_key) || "value"
    const labelKey = asString(widget.label_key) || "label"
    const total = data.reduce((sum, item) => sum + Math.max(chartNumber(item[valueKey]), 0), 0)
    if (!data.length || total <= 0) return null

    let currentAngle = -90
    const cx = 115
    const cy = 115
    const radius = 92

    return h(
      View,
      { style: styles.chartFrame, wrap: false },
      h(
        View,
        { style: { flexDirection: "row", gap: 16, alignItems: "center" } },
        h(
          Svg,
          { width: 230, height: 230, viewBox: "0 0 230 230" },
          ...data.map((item, index) => {
            const value = Math.max(chartNumber(item[valueKey]), 0)
            const angle = (value / total) * 360
            const path = describeArc(cx, cy, radius, currentAngle, currentAngle + angle)
            currentAngle += angle
            return h(Path, { key: `slice-${index}`, d: path, fill: chartPalette[index % chartPalette.length] })
          }),
          h(Circle, { cx, cy, r: 48, fill: "#f8fafc" }),
        ),
        h(
          View,
          { style: { flex: 1 } },
          ...data.map((item, index) =>
            h(
              View,
              { key: `donut-legend-${index}`, style: [styles.chartLegendItem, { marginBottom: 6 }] },
              h(View, { style: [styles.chartLegendSwatch, { backgroundColor: chartPalette[index % chartPalette.length] }] }),
              h(Text, null, `${shortLabel(item[labelKey], 22)}: ${pdfText(item[valueKey])}`),
            ),
          ),
        ),
      ),
    )
  }

  const renderPdfChart = (widget: Record<string, unknown>) => {
    const type = asString(widget.type)
    if (type === "line_chart") return renderPdfLineChart(widget)
    if (type === "bar_chart" || type === "histogram") return renderPdfBarChart(widget)
    if (type === "donut_chart") return renderPdfDonutChart(widget)
    return null
  }

  const productInitials = (value: unknown) =>
    pdfText(value)
      .split(/[^A-Za-z0-9]+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 3)
      .toUpperCase() || "IMS"

  const renderPdfProductImage = (item: Record<string, unknown>) => {
    const label = asString(item.label) || asString(item.title) || "Product"
    const imageUrl = resolveExportImageUrl(asString(item.image_url))
    if (imageUrl && !imageUrl.startsWith("data:image/svg+xml")) {
      return h(Image, { src: imageUrl, style: styles.productImage })
    }
    return h(
      View,
      { style: styles.productImageFallback },
      h(Text, { style: styles.productImageText }, productInitials(label)),
    )
  }

  const renderPdfComparisonProductCards = (widget: Record<string, unknown>) => {
    const rows = asArray(widget.rows).map((item) => asRecord(item)).filter(Boolean).slice(0, 12)
    const imageRows = rows.filter((item) => {
      const imageUrl = resolveExportImageUrl(asString(item?.image_url || item?.display_image || item?.product_variant_image_url))
      return Boolean(imageUrl)
    })
    if (!imageRows.length) {
      return null
    }
    return h(
      View,
      { style: { marginTop: 6 } },
      ...imageRows.map((item, index) => {
        const label = asString(item?.label) || asString(item?.title) || asString(item?.name) || `Item ${index + 1}`
        const barcode = asString(item?.barcode || asRecord(item?.meta)?.barcode)
        const imageUrl = resolveExportImageUrl(asString(item?.image_url || item?.display_image || item?.product_variant_image_url))
        return h(
          View,
          { key: `comparison-product-${index}`, style: styles.rankedItem, wrap: false },
          h(Text, { style: styles.rankBadge }, String(index + 1)),
          imageUrl ? h(Image, { src: imageUrl, style: styles.productImage }) : renderPdfProductImage(item),
          h(
            View,
            { style: styles.rankedMain },
            h(Text, { style: { fontSize: 10, fontWeight: 700, lineHeight: 1.25 } }, label),
            asString(item?.detail || item?.subtitle) ? h(Text, { style: styles.subtitle }, asString(item?.detail || item?.subtitle)) : null,
            barcode ? h(Text, { style: styles.subtitle }, `Barcode: ${barcode}`) : null,
          ),
          h(
            View,
            { style: styles.rankedValue },
            h(Text, { style: { fontSize: 10, fontWeight: 700 } }, pdfText(item?.value ?? item?.count)),
          ),
        )
      }),
    )
  }

  const renderPdfRankedList = (widget: Record<string, unknown>) => {
    const items = asArray(widget.items).map((item) => asRecord(item)).filter(Boolean).slice(0, 25)
    if (!items.length) return null
    return h(
      View,
      { style: { marginTop: 6 } },
      ...items.map((item, index) => {
        const label = asString(item?.label) || asString(item?.title) || `Item ${index + 1}`
        const barcode = asString(item?.barcode || asRecord(item?.meta)?.barcode)
        return h(
          View,
          { key: `ranked-${index}`, style: styles.rankedItem, wrap: false },
          h(Text, { style: styles.rankBadge }, String(index + 1)),
          renderPdfProductImage(item),
          h(
            View,
            { style: styles.rankedMain },
            h(Text, { style: { fontSize: 10, fontWeight: 700, lineHeight: 1.25 } }, label),
            asString(item?.detail) ? h(Text, { style: styles.subtitle }, asString(item.detail)) : null,
            barcode ? h(Text, { style: styles.subtitle }, `Barcode: ${barcode}`) : null,
          ),
          h(
            View,
            { style: styles.rankedValue },
            h(Text, { style: { fontSize: 10, fontWeight: 700 } }, pdfText(item?.value ?? item?.count)),
            item?.secondary_value !== undefined ? h(Text, { style: styles.subtitle }, pdfText(item.secondary_value)) : null,
          ),
        )
      }),
    )
  }

  const renderTable = (columns: string[], rows: ExportRow[]) =>
    h(
      View,
      { style: { marginTop: 8, borderWidth: 1, borderColor: "#e5edf7", borderRadius: 7 } },
      h(
        View,
        { style: styles.row },
        ...columns.map((column) => h(Text, { key: column, style: styles.th }, column)),
      ),
      ...rows.slice(0, 80).map((row, rowIndex) =>
        h(
          View,
          { key: rowIndex, style: styles.row, wrap: false },
          ...columns.map((column) => h(Text, { key: column, style: styles.td }, pdfText(row[column]))),
        ),
      ),
    )

  const renderInsightPayload = (payload: ExportStructuredPayload) => {
    const summary = asString(payload.summary).trim()
    const explanation = asString(payload.explanation).trim()
    const insights = asArray(payload.insights).map((item) => asRecord(item)).filter(Boolean)
    const widgets = asArray(payload.widgets).map((item) => asRecord(item)).filter(Boolean)

    return [
      summary || explanation || insights.length
        ? h(
            View,
            { key: "readout", style: styles.card },
            summary ? h(Text, { style: styles.paragraph }, exportText(summary)) : null,
            explanation ? h(Text, { style: styles.paragraph }, exportText(explanation)) : null,
            ...insights.map((insight, index) =>
              h(
                View,
                { key: `insight-${index}`, style: styles.cardSoft, wrap: false },
                h(Text, { style: styles.cardTitle }, asString(insight?.title) || `Insight ${index + 1}`),
                h(Text, { style: styles.paragraph }, exportText(asString(insight?.detail) || asString(insight?.summary) || asString(insight?.description))),
              ),
            ),
          )
        : null,
      ...widgets.map((widget, index) => {
        if (!widget) return null
        const type = asString(widget.type)
        const visual =
          type === "ranked_list"
            ? renderPdfRankedList(widget)
            : type === "comparison_table"
              ? renderPdfComparisonProductCards(widget)
              : renderPdfChart(widget)
        const rows = widgetRows(widget)
        const columns = userFacingColumnsFromRows(rows).slice(0, 8)
        return h(
          View,
          { key: `widget-${index}`, style: styles.card },
          h(Text, { style: styles.cardTitle }, asString(widget.title) || asString(widget.type) || `Widget ${index + 1}`),
          asString(widget.subtitle) ? h(Text, { style: styles.subtitle }, asString(widget.subtitle)) : null,
          visual ?? (rows.length ? renderTable(columns, rows) : h(Text, { style: styles.paragraph }, "No rows in this widget.")),
        )
      }),
    ].filter(Boolean)
  }

  const content =
    mode === "insight"
      ? renderInsightPayload(hydratedBody as ExportStructuredPayload)
      : (hydratedBody as ExportChatMessage[]).flatMap((message, index) =>
          h(
            View,
            {
              key: message.id || index,
              style: message.role === "user" ? styles.messageUser : styles.messageAssistant,
            },
            h(Text, { style: styles.meta }, `${message.role === "user" ? "You" : "Intera AI"}${message.timestamp ? ` · ${message.timestamp}` : ""}`),
            message.role === "assistant" && isInsightPayload(message.structuredPayload)
              ? renderInsightPayload(message.structuredPayload)
              : h(Text, { style: styles.paragraph }, exportText(message.content || "")),
          ),
        )

  const document = h(
    Document,
    null,
    h(
      Page,
      { size: "A4", style: styles.page, wrap: true },
      h(
        View,
        { style: styles.header },
        h(Text, { style: styles.eyebrow }, "Intera AI"),
        h(Text, { style: styles.title }, exportText(title)),
        h(Text, { style: styles.generated }, `Generated ${new Date().toLocaleString()}`),
        reportTimeframe ? h(Text, { style: styles.generated }, `Period ${reportTimeframe}`) : null,
      ),
      ...(Array.isArray(content) ? content : [content]),
    ),
  )

  return pdf(document).toBlob()
}

export const buildInsightPdfBlob = (payload: ExportStructuredPayload, title = "AI Insight Report") =>
  createReactPdfBlob(title, "insight", payload)

export const buildChatPdfBlob = (messages: ExportChatMessage[], title = "AI Chat Export") =>
  createReactPdfBlob(title, "chat", messages)

export const exportInsightCsv = (payload: ExportStructuredPayload, filenameStem: string) => {
  void (async () => {
    const filename = `${sanitizeFileStem(filenameStem)}.csv`
    const csv = buildInsightCsv(payload)
    const title = filenameStem.replace(/[-_]+/g, " ").trim() || "AI Insight CSV"
    renderCsvPopup(openExportWindow(title), title, csv, filename)
  })()
}

export const exportInsightPdf = async (payload: ExportStructuredPayload, title: string) => {
  const filename = `${sanitizeFileStem(title)}.pdf`
  const popup = openExportWindow(title)
  try {
    const blob = await createReactPdfBlob(title, "insight", payload)
    renderPdfPopup(popup, title, blob, filename)
  } catch {
    openPrintWindow(title, buildInsightReportDocument(payload, { title }))
  }
}

export const exportChatPdf = async (messages: ExportChatMessage[], title: string) => {
  const filename = `${sanitizeFileStem(title)}.pdf`
  const popup = openExportWindow(title)
  try {
    const blob = await createReactPdfBlob(title, "chat", messages)
    renderPdfPopup(popup, title, blob, filename)
  } catch {
    openPrintWindow(title, buildChatReportDocument(messages, { title }))
  }
}

export const buildInsightExportFilename = (title: string, suffix: string) =>
  `${sanitizeFileStem(title)}-${suffix}`

const reportStyles = `
  :root {
    color-scheme: light;
    --bg: #f8fafc;
    --surface: #ffffff;
    --surface-soft: #f8fafc;
    --border: #dbe4f0;
    --text: #0f172a;
    --muted: #64748b;
    --accent: #1d4ed8;
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: var(--bg); color: var(--text); font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
  body { padding: 24px; }
  .page { max-width: 1080px; margin: 0 auto; display: grid; gap: 20px; }
  .report-header { background: linear-gradient(135deg, #eff6ff 0%, #f8fafc 100%); border: 1px solid var(--border); border-radius: 28px; padding: 28px; }
  .eyebrow { margin: 0 0 8px; font-size: 11px; letter-spacing: 0.24em; text-transform: uppercase; color: #475569; font-weight: 700; }
  h1 { margin: 0; font-size: 30px; line-height: 1.15; }
  h2, h3, h4 { margin: 0; }
  .muted { color: var(--muted); }
  .hero, .card { background: var(--surface); border: 1px solid var(--border); border-radius: 24px; padding: 20px; }
  .hero > p { margin: 12px 0 0; color: var(--muted); line-height: 1.7; }
  .insight-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 12px; margin-top: 16px; }
  .mini-card { background: var(--surface-soft); border-radius: 18px; padding: 16px; border: 1px solid #e5edf7; }
  .mini-card p { margin: 8px 0 0; color: var(--muted); line-height: 1.6; }
  .section-head { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; margin-bottom: 16px; }
  .type-pill, .chip { display: inline-flex; align-items: center; border-radius: 999px; padding: 6px 10px; font-size: 12px; font-weight: 600; }
  .type-pill { background: #e2e8f0; color: #334155; }
  .chips { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; }
  .chip.warning { background: #fff7ed; color: #9a3412; }
  .chip.neutral { background: #eef2ff; color: #3730a3; }
  .ranked-list { display: grid; gap: 10px; }
  .ranked-item { display: grid; grid-template-columns: 34px 56px 1fr auto; gap: 12px; align-items: center; border: 1px solid #e5edf7; border-radius: 18px; padding: 12px; background: #f8fafc; }
  .rank-badge { display: inline-flex; width: 30px; height: 30px; border-radius: 999px; align-items: center; justify-content: center; background: #fff; color: #475569; font-weight: 800; }
  .ranked-image { width: 56px; height: 56px; border-radius: 16px; object-fit: cover; border: 1px solid #e5edf7; background: #fff; }
  .ranked-main { display: grid; gap: 4px; min-width: 0; }
  .ranked-main span, .ranked-values span { color: #64748b; font-size: 12px; }
  .barcode { display: inline-flex; width: fit-content; border-radius: 999px; background: #fff; padding: 4px 8px; }
  .ranked-values { display: grid; gap: 4px; text-align: right; white-space: nowrap; }
  .table-wrap { overflow: hidden; border: 1px solid #e5edf7; border-radius: 18px; }
  table { width: 100%; border-collapse: collapse; }
  th, td { padding: 12px 14px; text-align: left; vertical-align: top; border-bottom: 1px solid #e5edf7; font-size: 13px; }
  th { background: #f8fafc; font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: #64748b; }
  tbody tr:last-child td { border-bottom: 0; }
  .list { margin: 12px 0 0; padding-left: 18px; color: var(--muted); }
  .list li + li { margin-top: 8px; }
  @media print {
    body { padding: 0; background: #fff; }
    .page { max-width: none; }
    .hero, .card, .report-header, .message { break-inside: avoid; }
  }
`
