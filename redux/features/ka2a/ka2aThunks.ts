import type { AppDispatch, RootState } from "@/redux/store";
import { historyAnswerReturned, streamEnded, streamErrored, streamStarted } from "./ka2aSlice";
import { ka2aApiSlice } from "./ka2aApiSlice";
import type { StreamHistoryItem } from "./ka2aApiSlice";
import type { AgentStructuredPayload } from "@/lib/agent-structured-output";

const parseErrorText = (value: string): string => {
  const text = value.trim();
  if (!text) {
    return "";
  }
  try {
    const parsed = JSON.parse(text) as unknown;
    if (parsed && typeof parsed === "object") {
      const detail = (parsed as { detail?: unknown }).detail;
      if (typeof detail === "string" && detail.trim()) {
        return detail;
      }
    }
  } catch {
    // Fall back to the raw text when the server did not return JSON.
  }
  return text;
};

const errorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (error && typeof error === "object") {
    const record = error as { data?: unknown; error?: unknown };
    if (typeof record.error === "string") {
      return record.error;
    }
    if (typeof record.data === "string") {
      return parseErrorText(record.data);
    }
    if (record.data && typeof record.data === "object") {
      const detail = (record.data as { detail?: unknown }).detail;
      if (typeof detail === "string") {
        return detail;
      }
    }
  }
  return String(error);
};

const buildStreamHistory = (
  messages: RootState["ka2a"]["sessions"][string]["messages"],
  text: string,
  historyLength: number,
): StreamHistoryItem[] => {
  const limit = Math.max(0, Math.min(Math.floor(historyLength || 0), 100));
  const selected = limit > 0 ? messages.slice(-Math.max(0, limit - 1)) : [];
  return [
    ...selected.map((message) => ({
      role: message.role,
      content: message.content,
      structuredPayload: message.structuredPayload,
    })),
    { role: "user" as const, content: text },
  ];
};

const normalizeQuestion = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[?.!,]+$/g, "")
    .replace(/\s+/g, " ");

const isNewScopedInsightRequest = (value: string): boolean => {
  const question = normalizeQuestion(value);
  if (!question || question.startsWith("going back") || question.startsWith("based on") || question.startsWith("from that")) {
    return false;
  }
  const startsLikeRequest = /^(show|give|get|analyse|analyze|review|summarise|summarize|compare|list|find|tell me|what are|which are)\b/.test(question);
  if (!startsLikeRequest) {
    return false;
  }
  const hasScope = /\b(today|yesterday|last|past|this month|this year|date|between|from)\b/.test(question);
  const hasDomain = /\b(sales?|products?|variants?|purchase orders?|po|procurement|receiving|staff|audit|activity|stock|inventory|system|business analyst)\b/.test(question);
  return hasScope && hasDomain;
};

const asRecord = (value: unknown): Record<string, unknown> | undefined =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined;

const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const asString = (value: unknown): string => (typeof value === "string" ? value : "");

const asNumber = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value.replace(/,/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const formatNumber = (value: unknown): string => {
  const numeric = asNumber(value);
  return Number.isInteger(numeric) ? numeric.toLocaleString() : numeric.toLocaleString(undefined, { maximumFractionDigits: 2 });
};

const formatMoney = (value: unknown, currencyCode = "NGN"): string => {
  const currency = currencyCode || "NGN";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      currencyDisplay: "narrowSymbol",
      maximumFractionDigits: 2,
    }).format(asNumber(value));
  } catch {
    return `${currency} ${formatNumber(value)}`;
  }
};

const findLatestInsightPayload = (
  messages: RootState["ka2a"]["sessions"][string]["messages"],
): AgentStructuredPayload | undefined =>
  [...messages]
    .reverse()
    .find((message) => message.role === "assistant" && message.structuredPayload?.kind === "insight_response")
    ?.structuredPayload;

const findInsightPayloads = (
  messages: RootState["ka2a"]["sessions"][string]["messages"],
): AgentStructuredPayload[] =>
  messages
    .filter((message) => message.role === "assistant" && message.structuredPayload?.kind === "insight_response")
    .map((message) => message.structuredPayload)
    .filter(Boolean) as AgentStructuredPayload[];

const payloadSearchText = (payload: AgentStructuredPayload): string => {
  try {
    return JSON.stringify(payload).toLowerCase();
  } catch {
    return String(payload).toLowerCase();
  }
};

const selectInsightPayload = (
  messages: RootState["ka2a"]["sessions"][string]["messages"],
  text: string,
): AgentStructuredPayload | undefined => {
  const payloads = findInsightPayloads(messages);
  if (!payloads.length) {
    return findLatestInsightPayload(messages);
  }

  const question = normalizeQuestion(text);
  const wantsBusiness = ["business", "analyst", "analysis", "analyze", "analyse", "entire system", "whole system", "owner review", "first analysis", "first review"].some(
    (term) => question.includes(term),
  );
  const wantsComparison =
    ["comparison", "compare", "product comparison", "variant comparison"].some((term) => question.includes(term)) ||
    (["product", "variant"].some((term) => question.includes(term)) &&
      ["revenue", "sales", "units", "quantity", "orders", "generated", "sold", "leader", "led", "best"].some((term) => question.includes(term)));
  const wantsProcurement = ["purchase order", "procurement", "po ", "receiving", "supplier"].some((term) => question.includes(term));
  const wantsStaff = ["staff", "audit", "activity", "user"].some((term) => question.includes(term));

  const terms = wantsBusiness
    ? ["business analyst review", "recommended owner actions", "revenue posture", "entire system"]
    : wantsComparison
      ? ["product comparison table", "product revenue ranking", "product units trend", "variant comparison"]
      : wantsProcurement
        ? ["receiving progress", "receiving lifecycle", "receiving activity", "purchase-order receiving"]
        : wantsStaff
          ? ["staff audit activity", "most frequent staff actions", "audit events for", "staff activity"]
          : [];

  if (!terms.length) {
    return payloads[payloads.length - 1];
  }

  const scored = payloads
    .map((payload, index) => ({
      payload,
      index,
      score: terms.reduce((count, term) => count + (payloadSearchText(payload).includes(term) ? 1 : 0), 0),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || b.index - a.index);

  if (scored[0]?.payload) {
    return scored[0].payload;
  }
  if (wantsBusiness || wantsComparison || wantsProcurement || wantsStaff) {
    return undefined;
  }
  return payloads[payloads.length - 1];
};

const findWidgetByTitle = (payload: AgentStructuredPayload, ...terms: string[]): Record<string, unknown> | undefined =>
  asArray(payload.widgets)
    .map(asRecord)
    .find((widget): widget is Record<string, unknown> => {
      if (!widget) {
        return false;
      }
      const title = asString(widget.title).toLowerCase();
      return terms.every((term) => title.includes(term.toLowerCase()));
    });

const pickFirst = (record: Record<string, unknown>, keys: string[]): unknown => {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null && record[key] !== "") {
      return record[key];
    }
  }
  return `I have the previous analysis${suffix}, but that follow-up is not mapped yet. Ask about the leader, laggard, gap, trend, risk, or next action, and I will answer from the saved result.`;
};

const comparisonProductName = (row: Record<string, unknown>): string =>
  asString(pickFirst(row, ["product", "product_name", "productName", "label", "title", "name"]));

const comparisonRevenue = (row: Record<string, unknown>): number =>
  asNumber(pickFirst(row, ["sales_total", "salesTotal", "total_sales", "totalSales", "revenue", "sales", "value"]));

const comparisonUnits = (row: Record<string, unknown>): number =>
  asNumber(pickFirst(row, ["quantity_sold", "quantitySold", "units_sold", "unitsSold", "quantity", "units"]));

const comparisonOrders = (row: Record<string, unknown>): number =>
  asNumber(pickFirst(row, ["order_count", "orderCount", "orders", "count"]));

const comparisonBarcode = (row: Record<string, unknown>): string =>
  asString(pickFirst(row, ["barcode", "bar_code", "barcode_value", "barcodeValue"]));

const itemLabel = (row: Record<string, unknown>): string =>
  asString(pickFirst(row, ["label", "title", "reference", "name", "id"]));

const itemStatus = (row: Record<string, unknown>): string =>
  asString(pickFirst(row, ["status", "state", "badge", "stage"]));

const findRankedItems = (payload: AgentStructuredPayload, ...terms: string[]): Record<string, unknown>[] => {
  const widget = findWidgetByTitle(payload, ...terms);
  return asArray(widget?.items).map(asRecord).filter(Boolean) as Record<string, unknown>[];
};

const findTimelineEvents = (payload: AgentStructuredPayload, ...terms: string[]): Record<string, unknown>[] => {
  const widget = findWidgetByTitle(payload, ...terms);
  return asArray(widget?.events).map(asRecord).filter(Boolean) as Record<string, unknown>[];
};

const findComparisonRows = (payload: AgentStructuredPayload): Record<string, unknown>[] => {
  const widgets = asArray(payload.widgets).map(asRecord).filter(Boolean) as Record<string, unknown>[];
  const table = widgets.find((widget) => {
    const title = asString(widget.title).toLowerCase();
    return title.includes("product comparison table") || title.includes("comparison table");
  });
  const tableRows = asArray(table?.rows).map(asRecord).filter(Boolean) as Record<string, unknown>[];
  if (tableRows.length >= 2) {
    return tableRows;
  }

  const ranking = widgets.find((widget) => {
    const title = asString(widget.title).toLowerCase();
    return title.includes("product revenue ranking") || title.includes("revenue ranking");
  });
  const items = asArray(ranking?.items).map(asRecord).filter(Boolean) as Record<string, unknown>[];
  return items.length >= 2 ? items : [];
};

const findProcurementItems = (payload: AgentStructuredPayload): Record<string, unknown>[] => {
  const widget =
    findWidgetByTitle(payload, "receiving", "progress") ||
    findWidgetByTitle(payload, "purchase", "progress") ||
    findWidgetByTitle(payload, "po", "progress") ||
    findWidgetByTitle(payload, "receiving", "lifecycle");
  const items = asArray(widget?.items).map(asRecord).filter(Boolean) as Record<string, unknown>[];
  const rows = asArray(widget?.rows).map(asRecord).filter(Boolean) as Record<string, unknown>[];
  const steps = asArray(widget?.steps).map(asRecord).filter(Boolean) as Record<string, unknown>[];
  return items.length ? items : rows.length ? rows : steps;
};

const openProcurementItems = (items: Record<string, unknown>[]): Record<string, unknown>[] =>
  items.filter((item) => {
    const status = itemStatus(item).toLowerCase();
    return status && !/(received|complete|completed|closed|done)/.test(status);
  });

const findComparisonChartGap = (payload: AgentStructuredPayload, currencyCode: string): string | undefined => {
  const chart = findWidgetByTitle(payload, "product", "revenue", "trend");
  const data = asArray(chart?.data).map(asRecord).filter(Boolean) as Record<string, unknown>[];
  const series = asArray(chart?.series).map(asRecord).filter(Boolean) as Record<string, unknown>[];
  if (!data.length || series.length < 2) {
    return undefined;
  }

  let strongest: { label: string; gap: number; leader: string; leaderValue: number; runnerValue: number } | undefined;
  for (const point of data) {
    const ranked = series
      .map((item) => {
        const key = asString(item.key);
        return {
          label: asString(item.label) || key,
          value: key ? asNumber(point[key]) : 0,
        };
      })
      .sort((a, b) => b.value - a.value);
    if (ranked.length < 2) {
      continue;
    }
    const gap = Math.abs(ranked[0].value - ranked[1].value);
    if (!strongest || gap > strongest.gap) {
      strongest = {
        label: asString(point[asString(chart?.x_key) || "label"]) || asString(point.label) || "the selected period",
        gap,
        leader: ranked[0].label,
        leaderValue: ranked[0].value,
        runnerValue: ranked[1].value,
      };
    }
  }

  if (!strongest) {
    return undefined;
  }
  return `The widest revenue gap was in ${strongest.label}: ${strongest.leader} led by ${formatMoney(
    strongest.gap,
    currencyCode,
  )} (${formatMoney(strongest.leaderValue, currencyCode)} vs ${formatMoney(strongest.runnerValue, currencyCode)}).`;
};

const answerFromInsightPayload = (text: string, payload: AgentStructuredPayload): string | undefined => {
  const question = normalizeQuestion(text);
  const timeframe = asRecord(payload.timeframe);
  const timeframeLabel = asString(timeframe?.label);
  const suffix = timeframeLabel ? ` for ${timeframeLabel}` : "";
  const currencyCode = asString(payload.currency_code) || "NGN";
  const comparisonRows = findComparisonRows(payload);

  if (comparisonRows.length >= 2) {
    const revenueRanked = [...comparisonRows].sort((a, b) => comparisonRevenue(b) - comparisonRevenue(a));
    const unitsRanked = [...comparisonRows].sort((a, b) => comparisonUnits(b) - comparisonUnits(a));
    const ordersRanked = [...comparisonRows].sort((a, b) => comparisonOrders(b) - comparisonOrders(a));

    if (/revenue|sales total|made more|led|leader|ahead|by how much/.test(question)) {
      const leader = revenueRanked[0];
      const runner = revenueRanked[1];
      const margin = comparisonRevenue(leader) - comparisonRevenue(runner);
      return `From the comparison${suffix}, ${comparisonProductName(leader)} led revenue with ${formatMoney(
        comparisonRevenue(leader),
        currencyCode,
      )}. It was ahead of ${comparisonProductName(runner)} by ${formatMoney(margin, currencyCode)}.`;
    }

    if (/unit|quantity|sold more|volume/.test(question)) {
      const leader = unitsRanked[0];
      const runner = unitsRanked[1];
      const margin = comparisonUnits(leader) - comparisonUnits(runner);
      return `From the comparison${suffix}, ${comparisonProductName(leader)} sold more units: ${formatNumber(
        comparisonUnits(leader),
      )} units vs ${formatNumber(comparisonUnits(runner))} for ${comparisonProductName(runner)}. The unit gap is ${formatNumber(
        margin,
      )}.`;
    }

    if (/order|purchase frequency|frequency/.test(question)) {
      const leader = ordersRanked[0];
      const runner = ordersRanked[1];
      const margin = comparisonOrders(leader) - comparisonOrders(runner);
      return `From the comparison${suffix}, ${comparisonProductName(leader)} had more orders: ${formatNumber(
        comparisonOrders(leader),
      )} orders vs ${formatNumber(comparisonOrders(runner))} for ${comparisonProductName(runner)}. The order gap is ${formatNumber(
        margin,
      )}.`;
    }

    if (/month|period|gap|strongest|widest|biggest difference/.test(question)) {
      return (
        findComparisonChartGap(payload, currencyCode) ||
        "I can answer the overall comparison from the saved response, but the monthly gap needs the chart series values. Ask me to regenerate the comparison if you want the exact month-by-month gap."
      );
    }

    if (/what should i do|what do i do|next|recommend|priority|action/.test(question)) {
      const revenueLeader = revenueRanked[0];
      const unitLeader = unitsRanked[0];
      const laggard = revenueRanked[revenueRanked.length - 1];
      return `Based on the comparison${suffix}: keep ${comparisonProductName(revenueLeader)} well-stocked because it leads revenue; protect shelf/POS visibility for ${comparisonProductName(
        unitLeader,
      )} because it leads unit movement; review pricing, placement, or promotion for ${comparisonProductName(laggard)}${
        comparisonBarcode(laggard) ? ` (${comparisonBarcode(laggard)})` : ""
      } if you expected stronger performance.`;
    }
  }

  if (/\b(procurement|purchasing|purchase order|po|receiving|supplier)\b/.test(question)) {
    const procurementItems = findProcurementItems(payload);
    if (procurementItems.length) {
      const openItems = openProcurementItems(procurementItems);
      const attentionItems = openItems.length ? openItems : procurementItems.slice(0, 3);
      const statusCounts = procurementItems.reduce<Record<string, number>>((counts, item) => {
        const status = itemStatus(item) || "unknown";
        counts[status] = (counts[status] || 0) + 1;
        return counts;
      }, {});
      const statusSummary = Object.entries(statusCounts)
        .map(([status, count]) => `${status}: ${formatNumber(count)}`)
        .join(", ");

      if (/bottleneck|block|delay|issue|risk/.test(question)) {
        return `From the receiving lifecycle${suffix}, the main bottleneck is unfinished receiving work: ${formatNumber(
          openItems.length,
        )} of ${formatNumber(procurementItems.length)} tracked POs are not fully received. Status mix: ${statusSummary}.`;
      }

      if (/status|attention|needs attention/.test(question)) {
        return `From the receiving lifecycle${suffix}, these statuses need attention: ${statusSummary}. Priority POs: ${attentionItems
          .slice(0, 5)
          .map((item) => `${itemLabel(item)}${itemStatus(item) ? ` (${itemStatus(item)})` : ""}`)
          .join(", ")}.`;
      }

      if (/what should|next|action|do next|recommend|team/.test(question)) {
        return `From the receiving lifecycle${suffix}, the purchasing team should first follow up on ${attentionItems
          .slice(0, 3)
          .map((item) => `${itemLabel(item)}${itemStatus(item) ? ` (${itemStatus(item)})` : ""}`)
          .join(", ")}. Then confirm supplier ETAs, close partial receipts, and split large supplier deliveries where receiving spikes are recurring.`;
      }
    }
  }

  if (/\b(staff|audit|activity|action|event|risk)\b/.test(question)) {
    const actionItems = findRankedItems(payload, "staff", "actions").length
      ? findRankedItems(payload, "staff", "actions")
      : findRankedItems(payload, "frequent", "actions");
    const timelineEvents = findTimelineEvents(payload, "audit", "events");

    if (/most active staff|active staff|staff member|which staff|who was/.test(question)) {
      return `The saved staff activity response${suffix} does not include a staff-member ranking. It includes action frequency and recent audit events. Ask for staff activity by user if you want the top staff member.`;
    }

    if (actionItems.length && /activity type|action type|happened the most|most frequent|most common/.test(question)) {
      const top = actionItems[0];
      return `From the staff audit activity${suffix}, the most frequent activity type was ${itemLabel(top)} with ${formatNumber(
        top.value ?? top.count,
      )} events.`;
    }

    if (/risk|risks|attention|warning|high/.test(question)) {
      const risky = timelineEvents.filter((event) => /warning|high|critical|error/.test(asString(event.severity).toLowerCase()));
      if (risky.length) {
        return `From the staff audit activity${suffix}, ${formatNumber(risky.length)} recent audit events need attention: ${risky
          .slice(0, 3)
          .map((event) => asString(event.title) || "Audit event")
          .join("; ")}.`;
      }
      if (timelineEvents.length) {
        return `From the staff audit activity${suffix}, no high-severity staff activity risk is visible in the recent audit events shown.`;
      }
    }
  }

  if (/(which|what).*(location).*led|top location|best location|leading location|location led|far behind|lagging|lowest revenue|least revenue|underperforming/.test(question)) {
    const widget = findWidgetByTitle(payload, "location");
    const rows = asArray(widget?.rows).map(asRecord).filter(Boolean) as Record<string, unknown>[];
    const fallbackRows = rows.length ? rows : (asArray(widget?.data).map(asRecord).filter(Boolean) as Record<string, unknown>[]);
    const analysisRows = fallbackRows;
    const best = analysisRows.reduce<Record<string, unknown> | undefined>((winner, row) => {
      const rowValue = asNumber(row.sales ?? row.value ?? row.total_sales);
      const winnerValue = winner ? asNumber(winner.sales ?? winner.value ?? winner.total_sales) : -Infinity;
      return rowValue > winnerValue ? row : winner;
    }, undefined);
    if (best) {
      const worst = analysisRows.reduce<Record<string, unknown> | undefined>((loser, row) => {
        const rowValue = asNumber(row.sales ?? row.value ?? row.total_sales);
        const loserValue = loser ? asNumber(loser.sales ?? loser.value ?? loser.total_sales) : Infinity;
        return rowValue < loserValue ? row : loser;
      }, undefined);
      const bestSales = asNumber(best.sales ?? best.value ?? best.total_sales);
      const bestOrders = asNumber(best.orders ?? best.count ?? best.order_count);
      const totalSales = analysisRows.reduce((sum, row) => sum + asNumber(row.sales ?? row.value ?? row.total_sales), 0);
      const orderLeader = analysisRows.reduce<Record<string, unknown> | undefined>((winner, row) => {
        const rowOrders = asNumber(row.orders ?? row.count ?? row.order_count);
        const winnerOrders = winner ? asNumber(winner.orders ?? winner.count ?? winner.order_count) : -Infinity;
        return rowOrders > winnerOrders ? row : winner;
      }, undefined);
      const share = totalSales > 0 ? `, representing ${((bestSales / totalSales) * 100).toFixed(1)}% of location revenue` : "";
      const alsoLedOrders =
        orderLeader && (asString(orderLeader.location) || asString(orderLeader.label)) === (asString(best.location) || asString(best.label));
      const reason = /why|reason|because/.test(question)
        ? ` It led because it generated the highest revenue${share}${alsoLedOrders ? " and also had the highest order count" : ""}.`
        : "";
      if (/far behind|lagging|lowest revenue|least revenue|underperforming/.test(question) && worst) {
        const worstSales = asNumber(worst.sales ?? worst.value ?? worst.total_sales);
        const gap = bestSales - worstSales;
        return `From the last analysis${suffix}, ${asString(worst.location) || asString(worst.label)} was farthest behind with ${formatMoney(
          worstSales,
          currencyCode,
        )}, trailing ${asString(best.location) || asString(best.label)} by ${formatMoney(gap, currencyCode)}.`;
      }
      return `From the last analysis${suffix}, ${asString(best.location) || asString(best.label)} led with ${formatMoney(bestSales, currencyCode)} across ${formatNumber(bestOrders)} orders.${reason}`;
    }
  }

  if (/what should i do|what do i do|first action|next action|recommend|priority/.test(question)) {
    const widget = findWidgetByTitle(payload, "recommended", "actions") || findWidgetByTitle(payload, "owner", "actions");
    const items = asArray(widget?.items).map(asRecord).filter(Boolean).slice(0, 3) as Record<string, unknown>[];
    if (items.length) {
      return `From the last analysis, prioritize:\n${items
        .map((item, index) => `${index + 1}. ${asString(item.label) || asString(item.title)}${asString(item.detail) ? `: ${asString(item.detail)}` : ""}`)
        .join("\n")}`;
    }
  }

  if (/risk|problem|attention|weak|issue/.test(question)) {
    const widget = findWidgetByTitle(payload, "attention") || findWidgetByTitle(payload, "risk");
    const items = asArray(widget?.items).map(asRecord).filter(Boolean).slice(0, 4) as Record<string, unknown>[];
    if (items.length) {
      return `From the last analysis, the main attention areas are:\n${items
        .map((item, index) => `${index + 1}. ${asString(item.label) || asString(item.title)}${asString(item.description) ? `: ${asString(item.description)}` : ""}`)
        .join("\n")}`;
    }
  }

  if (/top product|which product|products drove|best seller|top seller/.test(question)) {
    const widget = findWidgetByTitle(payload, "top", "product") || findWidgetByTitle(payload, "top", "seller");
    const items = asArray(widget?.items).map(asRecord).filter(Boolean).slice(0, 5) as Record<string, unknown>[];
    if (items.length) {
      return `From the last analysis, the top products were:\n${items
        .map((item, index) => `${index + 1}. ${asString(item.label) || asString(item.title)}${item.value !== undefined ? `: ${formatMoney(item.value, currencyCode)}` : ""}${asString(item.detail) ? ` (${asString(item.detail)})` : ""}`)
        .join("\n")}`;
    }
  }

  return undefined;
};

const answerFromHistory = (
  messages: RootState["ka2a"]["sessions"][string]["messages"],
  text: string,
): { assistantText: string; structuredPayload?: AgentStructuredPayload } | undefined => {
  const normalized = normalizeQuestion(text);
  const scopedInsightRequest = isNewScopedInsightRequest(text);
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const message = messages[i];
    if (message.role !== "user" || normalizeQuestion(message.content) !== normalized) {
      continue;
    }
    const answer = messages.slice(i + 1).find((candidate) => candidate.role === "assistant");
    if (answer) {
      if (scopedInsightRequest && answer.structuredPayload?.kind !== "insight_response") {
        continue;
      }
      return { assistantText: answer.content, structuredPayload: answer.structuredPayload };
    }
  }

  if (scopedInsightRequest) {
    return undefined;
  }

  const latestInsight = selectInsightPayload(messages, text);
  if (!latestInsight) {
    return {
      assistantText:
        "I have the previous analysis, but that follow-up is not mapped yet. Ask about the leader, laggard, gap, trend, risk, or next action, and I will answer from the saved result.",
    };
  }
  const assistantText = answerFromInsightPayload(text, latestInsight);
  return assistantText ? { assistantText } : undefined;
};

export const sendStreamMessage =
  (args: { text: string; sessionId?: string }) => async (dispatch: AppDispatch, getState: () => RootState) => {
    const state = getState();
    const sessionId = args.sessionId || state.ka2a.activeSessionId;
    if (!sessionId) {
      return;
    }
    const session = state.ka2a.sessions[sessionId];
    if (!session) {
      return;
    }

    const text = args.text.trim();
    if (!text) {
      return;
    }

    const historyAnswer = answerFromHistory(session.messages, text);
    if (historyAnswer) {
      dispatch(
        historyAnswerReturned({
          sessionId,
          userText: text,
          assistantText: historyAnswer.assistantText,
          structuredPayload: historyAnswer.structuredPayload,
        }),
      );
      return;
    }

    const history = buildStreamHistory(session.messages, text, session.historyLength);

    dispatch(streamStarted({ sessionId, userText: text }));

    try {
      const request = session.resumeTaskId
        ? dispatch(
            ka2aApiSlice.endpoints.continueTaskStream.initiate({
              sessionId,
              taskId: session.resumeTaskId,
              text,
              agentName: session.agentName,
              historyLength: session.historyLength,
              history,
            }),
          )
        : dispatch(
            ka2aApiSlice.endpoints.streamMessage.initiate({
              sessionId,
              text,
              agentName: session.agentName,
              contextId: session.contextId,
              historyLength: session.historyLength,
              history,
            }),
          );
      try {
        await request.unwrap();
      } finally {
        request.reset();
      }
    } catch (error: unknown) {
      dispatch(streamErrored({ sessionId, error: errorMessage(error) }));
      return;
    }

    dispatch(streamEnded({ sessionId }));
  };
