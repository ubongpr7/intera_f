"use client"

import type { ReactNode } from "react"
import { useState } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  ShieldAlert,
  TrendingUp,
} from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { formatCurrency, formatCurrencyCompact, getCurrencyCodeForProfile } from "@/lib/currency-utils"

type InsightRendererProps = {
  payload: Record<string, unknown>
  onSend: (text: string) => void
}

const asRecord = (value: unknown): Record<string, unknown> | undefined => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined
  }
  return value as Record<string, unknown>
}

const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : [])

const asString = (value: unknown): string => (typeof value === "string" ? value : "")

const escapeSvgText = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")

const productImageFallback = (item: Record<string, unknown>) => {
  const label = (asString(item.label) || asString(item.title) || "Product").trim()
  const meta = asRecord(item.meta)
  const barcode = (asString(item.barcode) || asString(meta?.barcode)).trim()
  const sku = (asString(item.sku) || asString(meta?.sku)).trim()
  const seed = (barcode || sku || label || "product").toLowerCase()
  const palette = [
    ["#0f766e", "#ecfeff", "#99f6e4"],
    ["#1d4ed8", "#eff6ff", "#bfdbfe"],
    ["#b45309", "#fffbeb", "#fde68a"],
    ["#be123c", "#fff1f2", "#fecdd3"],
    ["#6d28d9", "#f5f3ff", "#ddd6fe"],
    ["#047857", "#ecfdf5", "#a7f3d0"],
  ] as const
  const paletteIndex = Array.from(seed).reduce((total, char) => total + char.charCodeAt(0), 0) % palette.length
  const [primary, background, accent] = palette[paletteIndex]
  const initials = label.split(/[^A-Za-z0-9]+/).filter(Boolean).map((part) => part[0]).join("").slice(0, 3).toUpperCase() || "IMS"
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160"><rect width="160" height="160" rx="28" fill="${background}"/><circle cx="126" cy="30" r="34" fill="${accent}"/><rect x="22" y="22" width="116" height="78" rx="22" fill="${primary}"/><text x="80" y="74" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="34" font-weight="800" fill="white">${escapeSvgText(initials)}</text><text x="80" y="122" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="11" font-weight="700" fill="#0f172a">${escapeSvgText(label.slice(0, 34))}</text><text x="80" y="140" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,monospace" font-size="9" fill="#475569">${escapeSvgText(barcode || sku || "No barcode")}</text></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

const productImageUrl = (item: Record<string, unknown>) => {
  const media = asRecord(item.media)
  return (
    asString(item.image_url) ||
    asString(item.display_image) ||
    asString(item.product_variant_image_url) ||
    asString(item.product_image_url) ||
    asString(item.image) ||
    asString(media?.image_url) ||
    asString(media?.url) ||
    ""
  )
}

function ProductImage({ item, alt, className }: { item: Record<string, unknown>; alt: string; className: string }) {
  const [hasError, setHasError] = useState(false)
  const source = hasError || !productImageUrl(item) ? productImageFallback(item) : productImageUrl(item)
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={source}
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
    />
  )
}

const asNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

const formatNumber = (value: unknown) => {
  const numeric = asNumber(value)
  if (numeric === null) {
    return asString(value) || "0"
  }
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: Number.isInteger(numeric) ? 0 : 2,
  }).format(numeric)
}

const formatAxisLabel = (value: unknown) => {
  const text = typeof value === "string" ? value : String(value ?? "")
  const monthMatch = text.match(/^(\d{4})-(\d{2})(?:-\d{2})?/)
  if (monthMatch) {
    return `${monthMatch[1]}/${monthMatch[2]}`
  }
  return text.length > 16 ? `${text.slice(0, 15)}…` : text
}

const humanizeKey = (value: unknown) =>
  (asString(value) || String(value || ""))
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase())

const IDENTIFIER_HINT_PATTERN = /\b(barcode|sku|upc|ean|gtin|id|code)\b/i

type ScalarFormatHint = "currency" | "currency_compact" | "number"

const EXPLICIT_CURRENCY_HINTS = new Set(["currency", "money", "monetary"])
const MONEY_HINT_PATTERN =
  /\b(revenue|sales|price|cost|basket|stock value|order value|payment|subtotal|inflow|outflow|profit|margin|gmv|value)\b/i
const NUMBER_HINT_PATTERN =
  /\b(count|quantity|qty|unit|units|item|items|location|locations|event|events|alert|alerts|days|rate|ratio|score|status|statuses|tracked|ranked|remaining|action|actions|offset|offsets|frequency|frequencies|occurrence|occurrences|staff)\b/i

const resolveCurrencyCode = (...candidates: unknown[]) => {
  for (const candidate of candidates) {
    const code = asString(candidate).trim().toUpperCase()
    if (code) {
      return code
    }
  }
  return getCurrencyCodeForProfile()
}

const resolveScalarFormat = ({
  explicitFormat,
  title,
  label,
  key,
}: {
  explicitFormat?: unknown
  title?: unknown
  label?: unknown
  key?: unknown
}): ScalarFormatHint => {
  const normalizedExplicitFormat = asString(explicitFormat).trim().toLowerCase()
  if (EXPLICIT_CURRENCY_HINTS.has(normalizedExplicitFormat)) {
    return "currency"
  }
  if (normalizedExplicitFormat === "currency_compact") {
    return "currency_compact"
  }
  if (normalizedExplicitFormat === "number" || normalizedExplicitFormat === "count" || normalizedExplicitFormat === "integer") {
    return "number"
  }

  const titleText = asString(title).trim().toLowerCase()
  if (!normalizedExplicitFormat && titleText.includes("top sellers") && asString(label).trim()) {
    return "number"
  }

  const inferFromText = (value: string): ScalarFormatHint | null => {
    const normalized = value.trim().toLowerCase()
    if (!normalized) {
      return null
    }
    if (NUMBER_HINT_PATTERN.test(normalized)) {
      return "number"
    }
    if (MONEY_HINT_PATTERN.test(normalized)) {
      return "currency"
    }
    return null
  }

  const primaryHintText = [label, key]
    .map((value) => asString(value).trim().toLowerCase())
    .filter(Boolean)
    .join(" ")
  const primaryHint = inferFromText(primaryHintText)
  if (primaryHint) {
    return primaryHint
  }

  const titleHint = inferFromText(asString(title))
  if (titleHint) {
    return titleHint
  }

  return "number"
}

const formatScalarValue = (
  value: unknown,
  {
    explicitFormat,
    title,
    label,
    key,
    compact = false,
    currencyCode,
  }: {
    explicitFormat?: unknown
    title?: unknown
    label?: unknown
    key?: unknown
    compact?: boolean
    currencyCode?: unknown
  } = {},
) => {
  const hintText = [explicitFormat, label, key].map((item) => asString(item)).join(" ")
  if (IDENTIFIER_HINT_PATTERN.test(hintText)) {
    return typeof value === "string" || typeof value === "number" ? String(value) : asString(value) || "0"
  }

  const numeric = asNumber(value)
  if (typeof value === "boolean") {
    return value ? "Yes" : "No"
  }
  if (numeric === null) {
    return asString(value) || "0"
  }

  const kind = resolveScalarFormat({ explicitFormat, title, label, key })
  if (kind === "currency_compact" || (kind === "currency" && compact)) {
    return formatCurrencyCompact(resolveCurrencyCode(currencyCode), numeric)
  }
  if (kind === "currency") {
    return formatCurrency(resolveCurrencyCode(currencyCode), numeric)
  }
  return formatNumber(numeric)
}

const formatMetricValue = (
  value: unknown,
  unit?: string,
  options?: {
    explicitFormat?: unknown
    title?: unknown
    label?: unknown
    key?: unknown
    compact?: boolean
    currencyCode?: unknown
  },
) => {
  const formatted = formatScalarValue(value, options)
  return unit ? `${formatted}${unit}` : formatted
}

const plainActionText = (action: Record<string, unknown>, values?: Record<string, string>) => {
  const payload = asRecord(action.payload)
  const actionName =
    asString(action.prompt).trim()
    || asString(payload?.prompt).trim()
    || asString(action.label).trim()
    || asString(action.action).trim()
    || asString(action.title).trim()
    || "Continue"
  const entries = Object.entries(values ?? {}).filter(([, value]) => value.trim())
  return entries.length
    ? `${actionName}\n${entries.map(([key, value]) => `${humanizeKey(key)}: ${value}`).join("\n")}`
    : actionName
}

type DisplayValueContext = {
  title?: string
  label?: string
  key?: string
  explicitFormat?: unknown
  currencyCode?: unknown
}

const displayValue = (value: unknown, context: DisplayValueContext = {}): string => {
  if (typeof value === "boolean") {
    return value ? "Yes" : "No"
  }
  if (typeof value === "string" || typeof value === "number") {
    return formatScalarValue(value, context)
  }
  if (Array.isArray(value)) {
    return value
      .map((item) => displayValue(item, context))
      .filter(Boolean)
      .map((item) => `• ${item}`)
      .join("\n")
  }
  const record = asRecord(value)
  if (record) {
    return Object.entries(record)
      .filter(([, item]) => item !== undefined && item !== null && item !== "")
      .map(([key, item]) => `${humanizeKey(key)}: ${displayValue(item, { ...context, key })}`)
      .join("\n")
  }
  return ""
}

const INTERNAL_DISPLAY_KEYS = new Set([
  "raw_json",
  "agent_id",
  "source_agent",
  "source_agent_id",
  "global_product_id",
])

const isImageKey = (key: string) => /(?:^|_)(?:image|thumbnail|photo|picture)(?:_url)?$/i.test(key)

const isInternalDisplayKey = (key: string) => INTERNAL_DISPLAY_KEYS.has(key.toLowerCase())

const normalizeDataRows = (value: unknown): Array<Record<string, unknown>> => {
  if (!Array.isArray(value)) {
    return []
  }
  const records = value.map(asRecord)
  if (records.every(Boolean)) {
    return records.filter(Boolean) as Array<Record<string, unknown>>
  }
  return value.map((item) => ({ value: item }))
}

const palette = ["#0f766e", "#1d4ed8", "#ca8a04", "#c2410c", "#9333ea", "#be185d"]

const chartConfig: ChartConfig = {
  value: { label: "Value", color: "#1d4ed8" },
}

function WidgetCard({
  title,
  subtitle,
  children,
}: {
  title?: string
  subtitle?: string
  children: ReactNode
}) {
  return (
    <section className="rounded-[24px] border border-gray-200 bg-white p-4 text-gray-700 shadow-[0_18px_44px_-34px_rgba(15,23,42,0.28)]">
      {title ? <h4 className="text-sm font-semibold text-gray-900">{title}</h4> : null}
      {subtitle ? <p className="mt-1 text-xs leading-5 text-gray-500">{subtitle}</p> : null}
      <div className={title || subtitle ? "mt-4" : ""}>{children}</div>
    </section>
  )
}

function InsightActionForm({
  widget,
  onSend,
}: {
  widget: Record<string, unknown>
  onSend: (text: string) => void
}) {
  const fields = asArray(widget.fields).map((field) => asRecord(field)).filter(Boolean) as Array<Record<string, unknown>>
  const defaults = asRecord(widget.defaults) ?? {}
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(
      fields.map((field) => {
        const name = asString(field.name)
        return [name, asString(defaults[name])]
      }),
    ),
  )

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault()
        onSend(plainActionText({
          action: asString(widget.action),
          title: asString(widget.title),
        }, values))
      }}
    >
      {fields.map((field) => {
        const name = asString(field.name)
        const label = asString(field.label) || name
        const type = asString(field.type) || "text"
        const required = Boolean(field.required)
        const options = asArray(field.options).map((option) => asRecord(option)).filter(Boolean) as Array<Record<string, unknown>>

        return (
          <label key={name} className="block">
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.14em] text-gray-500">
              {label}
            </span>
            {type === "select" ? (
              <select
                required={required}
                value={values[name] ?? ""}
                onChange={(event) => setValues((current) => ({ ...current, [name]: event.target.value }))}
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 outline-none ring-0 transition focus:border-blue-400"
              >
                <option value="">{asString(field.placeholder) || `Select ${label}`}</option>
                {options.map((option) => (
                  <option key={asString(option.value)} value={asString(option.value)}>
                    {asString(option.label) || asString(option.value)}
                  </option>
                ))}
              </select>
            ) : type === "textarea" ? (
              <textarea
                required={required}
                rows={3}
                value={values[name] ?? ""}
                placeholder={asString(field.placeholder)}
                onChange={(event) => setValues((current) => ({ ...current, [name]: event.target.value }))}
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 outline-none ring-0 transition focus:border-blue-400"
              />
            ) : (
              <input
                required={required}
                type={type === "number" ? "number" : "text"}
                value={values[name] ?? ""}
                placeholder={asString(field.placeholder)}
                onChange={(event) => setValues((current) => ({ ...current, [name]: event.target.value }))}
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 outline-none ring-0 transition focus:border-blue-400"
              />
            )}
          </label>
        )
      })}
      <button
        type="submit"
        className="inline-flex items-center rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-gray-50 transition hover:bg-gray-700"
      >
        {asString(widget.submit_label) || "Submit"}
      </button>
    </form>
  )
}

function renderWidget(
  widget: Record<string, unknown>,
  index: number,
  onSend: (text: string) => void,
) {
  const type = asString(widget.type)
  const title = asString(widget.title)
  const subtitle = asString(widget.subtitle)

  if (type === "metric_grid") {
    const items = asArray(widget.data).map((item) => asRecord(item)).filter(Boolean) as Array<Record<string, unknown>>
    return (
      <WidgetCard key={`${type}-${index}`} title={title} subtitle={subtitle}>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {items.map((item, itemIndex) => (
            <div key={`${title}-${itemIndex}`} className="rounded-[20px] bg-gray-50 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-gray-500">{asString(item.label) || `Metric ${itemIndex + 1}`}</p>
              <p className="mt-2 text-2xl font-semibold text-gray-900">
                {formatMetricValue(item.value, asString(item.unit) || undefined, {
                  explicitFormat: item.format ?? item.type ?? item.value_format ?? widget.value_format,
                  title,
                  label: item.label,
                  key: item.key,
                  currencyCode: item.currency_code ?? item.currency ?? widget.currency_code ?? widget.currency,
                })}
              </p>
              {asString(item.detail) ? <p className="mt-1 text-xs text-gray-500">{asString(item.detail)}</p> : null}
            </div>
          ))}
        </div>
      </WidgetCard>
    )
  }

  if (type === "bar_chart" || type === "histogram") {
    const data = asArray(widget.data).map((item) => asRecord(item)).filter(Boolean) as Array<Record<string, unknown>>
    const xKey = asString(widget.x_key) || "label"
    const yKey = asString(widget.y_key) || "value"
    const yFormat = widget.y_format ?? widget.value_format ?? widget.format
    const chartCurrencyCode = widget.currency_code ?? widget.currency
    return (
      <WidgetCard key={`${type}-${index}`} title={title} subtitle={subtitle}>
        <ChartContainer config={chartConfig} className="h-72 w-full">
          <BarChart data={data}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey={xKey} tickLine={false} axisLine={false} tickFormatter={formatAxisLabel} />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) =>
                formatScalarValue(value, {
                  explicitFormat: yFormat,
                  title,
                  label: yKey,
                  key: yKey,
                  compact: true,
                  currencyCode: chartCurrencyCode,
                })
              }
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name) => (
                    <>
                      <span className="text-gray-500">{String(name)}</span>
                      <span className="font-mono font-medium tabular-nums text-gray-900">
                        {formatScalarValue(value, {
                          explicitFormat: yFormat,
                          title,
                          label: name,
                          key: yKey,
                          currencyCode: chartCurrencyCode,
                        })}
                      </span>
                    </>
                  )}
                />
              }
            />
            <Bar dataKey={yKey} radius={[12, 12, 0, 0]} fill="#1d4ed8" />
          </BarChart>
        </ChartContainer>
      </WidgetCard>
    )
  }

  if (type === "donut_chart") {
    const data = asArray(widget.data).map((item) => asRecord(item)).filter(Boolean) as Array<Record<string, unknown>>
    const valueKey = asString(widget.value_key) || "value"
    const labelKey = asString(widget.label_key) || "label"
    return (
      <WidgetCard key={`${type}-${index}`} title={title} subtitle={subtitle}>
        <ChartContainer config={chartConfig} className="h-72 w-full">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent nameKey={labelKey} />} />
            <Pie data={data} dataKey={valueKey} nameKey={labelKey} innerRadius={68} outerRadius={100} paddingAngle={3}>
              {data.map((_, pieIndex) => (
                <Cell key={`cell-${pieIndex}`} fill={palette[pieIndex % palette.length]} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {data.map((item, itemIndex) => (
            <div key={`${title}-${itemIndex}`} className="flex items-center justify-between rounded-2xl bg-gray-50 px-3 py-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: palette[itemIndex % palette.length] }} />
                <span className="text-gray-700">{asString(item[labelKey])}</span>
              </div>
              <span className="font-medium text-gray-900">
                {formatScalarValue(item[valueKey], {
                  explicitFormat: widget.value_format ?? widget.format,
                  title,
                  label: labelKey,
                  key: valueKey,
                  currencyCode: widget.currency_code ?? widget.currency,
                })}
              </span>
            </div>
          ))}
        </div>
      </WidgetCard>
    )
  }

  if (type === "line_chart") {
    const data = asArray(widget.data).map((item) => asRecord(item)).filter(Boolean) as Array<Record<string, unknown>>
    const xKey = asString(widget.x_key) || "label"
    const yKey = asString(widget.y_key) || "value"
    const series = asArray(widget.series)
      .map((item, seriesIndex) => {
        const record = asRecord(item)
        const key = asString(record?.key)
        if (!key) {
          return null
        }
        return {
          key,
          label: asString(record?.label) || humanizeKey(key),
          color: asString(record?.color) || palette[seriesIndex % palette.length],
        }
      })
      .filter(Boolean) as Array<{ key: string; label: string; color: string }>
    const renderedSeries = series.length ? series : [{ key: yKey, label: humanizeKey(yKey), color: "#0f766e" }]
    const yFormat = widget.y_format ?? widget.value_format ?? widget.format
    const chartCurrencyCode = widget.currency_code ?? widget.currency
    const dynamicChartConfig = renderedSeries.reduce<ChartConfig>((config, item) => {
      config[item.key] = { label: item.label, color: item.color }
      return config
    }, {})
    return (
      <WidgetCard key={`${type}-${index}`} title={title} subtitle={subtitle}>
        <ChartContainer config={dynamicChartConfig} className="h-72 w-full">
          <LineChart data={data}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey={xKey} tickLine={false} axisLine={false} tickFormatter={formatAxisLabel} />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) =>
                formatScalarValue(value, {
                  explicitFormat: yFormat,
                  title,
                  label: yKey,
                  key: yKey,
                  compact: true,
                  currencyCode: chartCurrencyCode,
                })
              }
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name) => (
                    <>
                      <span className="text-gray-500">{String(name)}</span>
                      <span className="font-mono font-medium tabular-nums text-gray-900">
                        {formatScalarValue(value, {
                          explicitFormat: yFormat,
                          title,
                          label: name,
                          key: name,
                          currencyCode: chartCurrencyCode,
                        })}
                      </span>
                    </>
                  )}
                />
              }
            />
            {renderedSeries.map((item) => (
              <Line key={item.key} type="monotone" dataKey={item.key} name={item.label} stroke={item.color} strokeWidth={3} dot={false} />
            ))}
          </LineChart>
        </ChartContainer>
        {series.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {renderedSeries.map((item) => (
              <span key={item.key} className="inline-flex items-center gap-2 rounded-full bg-gray-50 px-3 py-1 text-xs font-medium text-gray-600">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                {item.label}
              </span>
            ))}
          </div>
        ) : null}
      </WidgetCard>
    )
  }

  if (type === "sparkline_metric") {
    const points = asArray(widget.data).map((item) => asRecord(item)).filter(Boolean) as Array<Record<string, unknown>>
    const metric = asRecord(widget.metric) ?? {}
    return (
      <WidgetCard key={`${type}-${index}`} title={title || asString(metric.label)} subtitle={subtitle}>
        <div className="grid gap-4 md:grid-cols-[180px,1fr]">
          <div className="rounded-[20px] bg-gray-50 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-gray-500">{asString(metric.label) || "Metric"}</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">
              {formatMetricValue(metric.value, asString(metric.unit) || undefined, {
                explicitFormat: metric.format ?? metric.type ?? metric.value_format ?? widget.value_format,
                title,
                label: metric.label,
                key: widget.y_key,
                currencyCode: metric.currency_code ?? metric.currency ?? widget.currency_code ?? widget.currency,
              })}
            </p>
            {asString(metric.detail) ? <p className="mt-1 text-xs text-gray-500">{asString(metric.detail)}</p> : null}
          </div>
          <ChartContainer config={chartConfig} className="h-36 w-full">
            <LineChart data={points}>
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => (
                      <>
                        <span className="text-gray-500">{String(name)}</span>
                        <span className="font-mono font-medium tabular-nums text-gray-900">
                          {formatScalarValue(value, {
                            explicitFormat: widget.y_format ?? widget.value_format ?? widget.format,
                            title,
                            label: name,
                            key: widget.y_key,
                            currencyCode: widget.currency_code ?? widget.currency,
                          })}
                        </span>
                      </>
                    )}
                  />
                }
              />
              <Line type="monotone" dataKey={asString(widget.y_key) || "value"} stroke="#1d4ed8" strokeWidth={3} dot={false} />
            </LineChart>
          </ChartContainer>
        </div>
      </WidgetCard>
    )
  }

  if (type === "ranked_list") {
    const items = asArray(widget.items).map((item) => asRecord(item)).filter(Boolean) as Array<Record<string, unknown>>
    return (
      <WidgetCard key={`${type}-${index}`} title={title} subtitle={subtitle}>
        <div className="space-y-2">
          {items.map((item, itemIndex) => {
            const barcodeValue = asString(item.barcode || asRecord(item.meta)?.barcode)
            const hideValue = Boolean(item.hide_value)
            return (
            <div key={`${title}-${itemIndex}`} className="flex items-start justify-between gap-3 rounded-[20px] bg-gray-50 px-4 py-3">
              <div className="flex min-w-0 gap-3">
                <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-gray-600">
                  {itemIndex + 1}
                </span>
                <ProductImage
                  item={item}
                  alt={asString(item.label) || asString(item.title) || "Item"}
                  className="h-14 w-14 shrink-0 rounded-2xl object-cover"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900">{asString(item.label) || asString(item.title) || "Item"}</p>
                  {asString(item.detail) ? <p className="mt-1 text-xs text-gray-500">{asString(item.detail)}</p> : null}
                  {barcodeValue ? (
                    <div className="mt-2">
                      <span className="inline-flex rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-gray-600">
                        Barcode: {barcodeValue}
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>
              {!hideValue ? (
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    {formatScalarValue(item.value ?? item.count, {
                      explicitFormat: item.format ?? item.type ?? item.value_format ?? widget.value_format,
                      title,
                      label: item.label,
                      key: item.key ?? "value",
                      currencyCode: item.currency_code ?? item.currency ?? widget.currency_code ?? widget.currency,
                    })}
                  </p>
                  {item.secondary_value !== undefined && item.secondary_value !== null && `${item.secondary_value}`.trim() ? (
                    <p className="text-xs text-gray-500">
                      {formatScalarValue(item.secondary_value, {
                        explicitFormat: item.secondary_format ?? item.secondary_value_format ?? widget.secondary_value_format,
                        title,
                        label: item.secondary_label ?? "secondary_value",
                        key: "secondary_value",
                        currencyCode: item.currency_code ?? item.currency ?? widget.currency_code ?? widget.currency,
                      })}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          )})}
        </div>
      </WidgetCard>
    )
  }

  if (type === "risk_panel") {
    const items = asArray(widget.items).map((item) => asRecord(item)).filter(Boolean) as Array<Record<string, unknown>>
    return (
      <WidgetCard key={`${type}-${index}`} title={title} subtitle={subtitle}>
        <div className="space-y-3">
          {items.map((item, itemIndex) => {
            const severity = asString(item.severity || widget.severity).toLowerCase()
            const icon =
              severity === "high" || severity === "critical" ? (
                <ShieldAlert className="h-4 w-4 text-rose-600" />
              ) : severity === "warning" ? (
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              )
            return (
              <div key={`${title}-${itemIndex}`} className="rounded-[20px] border border-gray-200 bg-gray-50 px-4 py-3">
                <div className="flex items-start gap-2">
                  {icon}
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{asString(item.label) || "Risk"}</p>
                    {asString(item.detail) || asString(item.description) ? (
                      <p className="mt-1 text-xs leading-5 text-gray-600">{asString(item.detail) || asString(item.description)}</p>
                    ) : null}
                    {asString(item.next_action) ? <p className="mt-2 text-xs font-medium text-gray-900">Next: {asString(item.next_action)}</p> : null}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </WidgetCard>
    )
  }

  if (type === "comparison_table") {
    const columns = asArray(widget.columns)
    const rows = asArray(widget.rows).map((item) => asRecord(item)).filter(Boolean) as Array<Record<string, unknown>>
    const hasBarcodeColumn = columns.some((column) => {
      const record = asRecord(column)
      return (asString(record?.key) || String(column)).toLowerCase() === "barcode"
    })
    const normalizedColumns = columns.map((column, columnIndex) => {
      const record = asRecord(column)
      if (record) {
        return {
          key: asString(record.key) || `col_${columnIndex}`,
          label: asString(record.label) || humanizeKey(record.key),
          format: record.format ?? record.type ?? record.value_format,
          currencyCode: record.currency_code ?? record.currency,
        }
      }
      return { key: String(column), label: humanizeKey(column), format: undefined, currencyCode: undefined }
    }).filter((column) => !(hasBarcodeColumn && column.key.toLowerCase() === "sku"))
    return (
      <WidgetCard key={`${type}-${index}`} title={title} subtitle={subtitle}>
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-2 text-sm">
            <thead>
              <tr>
                {normalizedColumns.map((column) => (
                  <th key={column.key} className="px-3 py-1 text-left text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={`${title}-${rowIndex}`} className="rounded-2xl bg-gray-50">
                  {normalizedColumns.map((column) => (
                    <td key={`${rowIndex}-${column.key}`} className="px-3 py-3 text-gray-700">
                      {column.key.toLowerCase() === "already_imported" && typeof row[column.key] === "boolean" ? (
                        row[column.key] ? "Already in inventory" : "New import candidate"
                      ) : isImageKey(column.key) && asString(row[column.key]) ? (
                        <ProductImage
                          item={row}
                          alt={asString(row.name) || asString(row.label) || "Product"}
                          className="h-12 w-12 rounded-xl object-cover"
                        />
                      ) : (
                        <span className="whitespace-pre-line">
                          {displayValue(row[column.key], {
                            title,
                            label: column.label,
                            key: column.key,
                            explicitFormat: column.format,
                            currencyCode: column.currencyCode ?? row.currency_code ?? row.currency ?? widget.currency_code ?? widget.currency,
                          }) || "Not provided"}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </WidgetCard>
    )
  }

  if (type === "timeline") {
    const events = asArray(widget.events ?? widget.items).map((item) => asRecord(item)).filter(Boolean) as Array<Record<string, unknown>>
    return (
      <WidgetCard key={`${type}-${index}`} title={title} subtitle={subtitle}>
        <div className="space-y-4">
          {events.map((event, eventIndex) => (
            <div key={`${title}-${eventIndex}`} className="grid grid-cols-[20px,1fr] gap-3">
              <div className="flex flex-col items-center">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-gray-900" />
                {eventIndex < events.length - 1 ? <span className="mt-2 h-full w-px bg-gray-200" /> : null}
              </div>
              <div className="rounded-[20px] bg-gray-50 px-4 py-3">
                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                  <Clock3 className="h-3.5 w-3.5" />
                  <span>{asString(event.timestamp) || asString(event.occurred_at)}</span>
                  {asString(event.severity) ? <span className="rounded-full bg-white px-2 py-0.5 font-medium text-gray-700">{asString(event.severity)}</span> : null}
                </div>
                <p className="mt-2 text-sm font-semibold text-gray-900">{asString(event.title) || asString(event.event_name) || "Event"}</p>
                {asString(event.detail) || asString(event.summary) ? (
                  <p className="mt-1 text-xs leading-5 text-gray-600">{asString(event.detail) || asString(event.summary)}</p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </WidgetCard>
    )
  }

  if (type === "text_list") {
    const items = asArray(widget.items)
    return (
      <WidgetCard key={`${type}-${index}`} title={title} subtitle={subtitle}>
        <div className="space-y-2">
          {items.map((rawItem, itemIndex) => {
            const item = asRecord(rawItem)
            const itemText = item
              ? asString(item.detail) || asString(item.description) || asString(item.value)
              : displayValue(rawItem, { title, key: "item" })
            return (
            <div key={`${title}-${itemIndex}`} className="rounded-[20px] bg-gray-50 px-4 py-3">
              {item && asString(item.label) ? (
                <p className="text-sm font-semibold text-gray-900">{asString(item.label)}</p>
              ) : null}
              {itemText ? (
                <p className={`${item && asString(item.label) ? "mt-1" : ""} whitespace-pre-line text-sm leading-6 text-gray-700`}>
                  {itemText}
                </p>
              ) : null}
            </div>
            )
          })}
        </div>
      </WidgetCard>
    )
  }

  if (type === "text_block") {
    const text = asString(widget.content) || asString(widget.text) || displayValue(widget.value, { title, key: "value" })
    return (
      <WidgetCard key={`${type}-${index}`} title={title} subtitle={subtitle}>
        <div className="rounded-[20px] bg-gray-50 px-4 py-3">
          <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">{text}</p>
        </div>
      </WidgetCard>
    )
  }

  if (type === "progress_tracker") {
    const steps = asArray(widget.steps).map((item) => asRecord(item)).filter(Boolean) as Array<Record<string, unknown>>
    return (
      <WidgetCard key={`${type}-${index}`} title={title} subtitle={subtitle}>
        <div className="space-y-3">
          {steps.map((step, stepIndex) => {
            const status = asString(step.status).toLowerCase()
            const icon =
              status === "completed" ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              ) : status === "current" || status === "in_progress" ? (
                <TrendingUp className="h-4 w-4 text-blue-600" />
              ) : (
                <Clock3 className="h-4 w-4 text-gray-400" />
              )
            return (
              <div key={`${title}-${stepIndex}`} className="flex items-start gap-3 rounded-[20px] bg-gray-50 px-4 py-3">
                {icon}
                <div>
                  <p className="text-sm font-semibold text-gray-900">{asString(step.label) || `Step ${stepIndex + 1}`}</p>
                  {asString(step.detail) ? <p className="mt-1 text-xs text-gray-500">{asString(step.detail)}</p> : null}
                </div>
              </div>
            )
          })}
        </div>
      </WidgetCard>
    )
  }

  if (type === "section_stack") {
    const sections = asArray(widget.sections).map((item) => asRecord(item)).filter(Boolean) as Array<Record<string, unknown>>
    return (
      <div key={`${type}-${index}`} className="space-y-4">
        <WidgetCard title={title} subtitle={subtitle}>
          <p className="text-xs leading-5 text-gray-500">
            This review combines the completed analyses below. Each card represents a separate business domain.
          </p>
        </WidgetCard>
        {sections.map((section, sectionIndex) => {
          const nestedWidgets = asArray(section.widgets).map((item) => asRecord(item)).filter(Boolean) as Array<Record<string, unknown>>
          const sectionWarnings = asArray(section.warnings)
            .map((item) => asString(item).trim())
            .filter(Boolean)
          return (
            <WidgetCard
              key={`${title}-section-${sectionIndex}`}
              title={asString(section.title) || `Section ${sectionIndex + 1}`}
              subtitle={asString(section.summary) || undefined}
            >
              {asString(section.status_label) ? (
                <span className="inline-flex rounded-full bg-gray-50 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-gray-500">
                  {asString(section.status_label)}
                </span>
              ) : null}
              {sectionWarnings.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {sectionWarnings.map((warning, warningIndex) => (
                    <span
                      key={`${title}-section-${sectionIndex}-warning-${warningIndex}`}
                      className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800"
                    >
                      {warning}
                    </span>
                  ))}
                </div>
              ) : null}

              {nestedWidgets.length ? (
                <div className="mt-4 space-y-4">
                  {nestedWidgets.map((nestedWidget, nestedIndex) =>
                    renderWidget(nestedWidget, sectionIndex * 100 + nestedIndex, onSend),
                  )}
                </div>
              ) : asString(section.raw_text) ? (
                <div className="mt-4 rounded-[20px] bg-gray-50 px-4 py-3">
                  <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">{asString(section.raw_text)}</p>
                </div>
              ) : null}
            </WidgetCard>
          )
        })}
      </div>
    )
  }

  if (["object", "data", "data_part", "data-table", "table"].includes(type)) {
    const rawRows = widget.rows ?? widget.items ?? widget.data
    const rows = normalizeDataRows(rawRows)
    if (rows.length) {
      const columnKeys = Array.from(new Set(rows.flatMap((row) => Object.keys(row))))
        .filter((key) => !isInternalDisplayKey(key))
      return renderWidget(
        {
          type: "comparison_table",
          title: title || "Data",
          subtitle,
          columns: columnKeys,
          rows,
        },
        index,
        onSend,
      )
    }

    const values = asRecord(widget.data) ?? asRecord(widget.value) ?? {}
    return (
      <WidgetCard key={`${type}-${index}`} title={title || "Data"} subtitle={subtitle}>
        <div className="grid gap-2 sm:grid-cols-2">
          {Object.entries(values).map(([key, value]) => (
            <div key={key} className="rounded-[20px] bg-gray-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">{humanizeKey(key)}</p>
              <p className="mt-1 text-sm leading-6 text-gray-700">
                {displayValue(value, { title, label: humanizeKey(key), key }) || "Not provided"}
              </p>
            </div>
          ))}
        </div>
      </WidgetCard>
    )
  }

  if (["text", "text_part"].includes(type)) {
    const text = asString(widget.text) || asString(widget.content) || displayValue(widget.value, { title, key: "value" })
    return (
      <WidgetCard key={`${type}-${index}`} title={title || "Overview"} subtitle={subtitle}>
        <p className="whitespace-pre-wrap rounded-[20px] bg-gray-50 px-4 py-3 text-sm leading-6 text-gray-700">
          {text}
        </p>
      </WidgetCard>
    )
  }

  if (type === "action_form") {
    return (
      <WidgetCard key={`${type}-${index}`} title={title} subtitle={subtitle}>
        <InsightActionForm widget={widget} onSend={onSend} />
      </WidgetCard>
    )
  }

  if (type === "confirmation_card") {
    return (
      <WidgetCard key={`${type}-${index}`} title={title} subtitle={subtitle}>
        <div className="rounded-[20px] bg-gray-50 px-4 py-4">
          <p className="text-sm font-semibold text-gray-900">{asString(widget.summary) || "Confirm this action."}</p>
          {asString(widget.risk_level) ? <p className="mt-1 text-xs text-gray-500">Risk level: {asString(widget.risk_level)}</p> : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-gray-50 transition hover:bg-gray-700"
              onClick={() =>
                onSend(`Confirm: ${asString(widget.action) || asString(widget.title) || "this action"}`)
              }
            >
              Confirm
            </button>
            <button
              type="button"
              className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              onClick={() =>
                onSend(`Cancel: ${asString(widget.action) || asString(widget.title) || "this action"}`)
              }
            >
              Cancel
            </button>
          </div>
        </div>
      </WidgetCard>
    )
  }

  if (type === "entity_preview") {
    const entity = asRecord(widget.entity) ?? {}
    return (
      <WidgetCard key={`${type}-${index}`} title={title} subtitle={subtitle}>
        <div className="flex items-start gap-4 rounded-[20px] bg-gray-50 px-4 py-4">
          {productImageUrl(entity) ? (
            <ProductImage item={entity} alt={asString(entity.title) || "Entity"} className="h-20 w-20 rounded-2xl object-cover" />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
              {asString(entity.kind) || "Item"}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900">{asString(entity.title) || asString(entity.name) || "Entity"}</p>
            {asString(entity.subtitle) ? <p className="mt-1 text-xs text-gray-500">{asString(entity.subtitle)}</p> : null}
            {asArray(entity.meta).length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {asArray(entity.meta).map((meta, metaIndex) => {
                  const record = asRecord(meta)
                  if (!record) {
                    return null
                  }
                  return (
                    <span key={`${title}-${metaIndex}`} className="rounded-full bg-white px-2.5 py-1 text-xs text-gray-600">
                      {asString(record.label)}: {asString(record.value) || formatNumber(record.value)}
                    </span>
                  )
                })}
              </div>
            ) : null}
          </div>
        </div>
      </WidgetCard>
    )
  }

  return (
    <WidgetCard key={`${type}-${index}`} title={title || humanizeKey(type) || "Data"} subtitle={subtitle}>
      <div className="space-y-2 rounded-[20px] bg-gray-50 px-4 py-3">
        {Object.entries(widget)
          .filter(([key, value]) => !["type", "title", "subtitle"].includes(key) && !isInternalDisplayKey(key) && value !== undefined && value !== null)
          .map(([key, value]) => (
            <div key={key} className="flex items-start justify-between gap-4 border-b border-gray-200 py-2 last:border-b-0">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">{humanizeKey(key)}</span>
              <span className="max-w-[70%] text-right text-sm text-gray-700">
                {displayValue(value, { title, label: humanizeKey(key), key }) || "Not provided"}
              </span>
            </div>
          ))}
      </div>
    </WidgetCard>
  )
}

export default function InsightWidgetRenderer({ payload, onSend }: InsightRendererProps) {
  const summary = asString(payload.summary)
  const explanation = asString(payload.explanation)
  const insights = asArray(payload.insights).map((item) => asRecord(item)).filter(Boolean) as Array<Record<string, unknown>>
  const widgets = asArray(payload.widgets).map((widget) => asRecord(widget)).filter(Boolean) as Array<Record<string, unknown>>
  const suggestedActions = asArray(payload.suggested_actions).map((item) => asRecord(item)).filter(Boolean) as Array<Record<string, unknown>>

  return (
    <div className="space-y-4">
      {summary || explanation || insights.length ? (
        <WidgetCard>
          <div className="space-y-3">
            {summary ? <p className="text-sm font-semibold leading-6 text-gray-900">{summary}</p> : null}
            {explanation ? <p className="text-sm leading-6 text-gray-600">{explanation}</p> : null}
            {insights.length ? (
              <div className="grid gap-3 md:grid-cols-2">
                {insights.map((insight, index) => (
                  <div key={`insight-${index}`} className="rounded-[20px] bg-gray-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                      {asString(insight.title) || `Insight ${index + 1}`}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-gray-700">
                      {asString(insight.detail) || asString(insight.summary) || asString(insight.description)}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </WidgetCard>
      ) : null}

      {widgets.map((widget, index) => renderWidget(widget, index, onSend))}

      {suggestedActions.length ? (
        <WidgetCard title="Suggested actions">
          <div className="flex flex-wrap gap-2">
            {suggestedActions.map((action, index) => (
              <button
                key={`suggested-${index}`}
                type="button"
                className="rounded-full border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                onClick={() =>
                onSend(plainActionText(action))
                }
              >
                {asString(action.label) || asString(action.action) || "Continue"}
              </button>
            ))}
          </div>
        </WidgetCard>
      ) : null}

    </div>
  )
}
