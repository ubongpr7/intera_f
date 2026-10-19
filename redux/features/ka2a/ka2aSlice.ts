import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import {
  extractInteractionPayloadFromParts,
  isTransportDebugText,
  summarizeStructuredPayload,
  type AgentStructuredPayload,
} from "@/lib/agent-structured-output";

type Ka2aRole = "user" | "assistant";

export type Ka2aEventKind = "task" | "status-update" | "artifact-update";

export type Ka2aEvent = {
  kind: Ka2aEventKind;
  [key: string]: unknown;
};

export type ChatMessage = {
  id: string;
  role: Ka2aRole;
  content: string;
  taskId?: string;
  timestamp: string;
  serverMessageId?: string;
  structuredPayload?: AgentStructuredPayload;
  voiceTurnId?: string;
  sourceAgent?: string;
  messageKind?: "specialist" | "summary";
};

export type EventLogItem = {
  id: string;
  receivedAt: string;
  event: Ka2aEvent;
};

export type TaskRun = {
  taskId: string;
  contextId?: string;
  state?: string;
  submittedAt?: string;
  completedAt?: string;
  resultText?: string;
  structuredPayload?: AgentStructuredPayload;
};

export type Ka2aSession = {
  sessionId: string;
  title: string;
  agentName: string;
  contextId?: string;
  historyLength: number;
  isStreaming: boolean;
  lastTaskId?: string;
  messages: ChatMessage[];
  eventLog: EventLogItem[];
  runs: Record<string, TaskRun>;
  activeSpecialist?: string;
  currentTaskState?: string;
  currentStatusText?: string;
  awaitingInput: boolean;
  resumeTaskId?: string;
  error?: string;
  pendingVoiceTurnId?: string;
  pendingVoiceUserText?: string;
  pendingRequestId?: string;
};

export type Ka2aState = {
  sessions: Record<string, Ka2aSession>;
  activeSessionId?: string;
};

const createId = () => {
  const cryptoAny = globalThis.crypto as { randomUUID?: () => string } | undefined;
  if (cryptoAny?.randomUUID) {
    return cryptoAny.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const nowIso = () => new Date().toISOString();

const asObject = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
};

const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const asString = (value: unknown): string => (typeof value === "string" ? value : "");

const asBoolean = (value: unknown): boolean => (typeof value === "boolean" ? value : Boolean(value));

const asId = (value: unknown): string => {
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number") {
    return String(value);
  }
  return "";
};

const partKind = (part: Record<string, unknown>): string => asString(part.kind || part.type).toLowerCase();

const extractTextParts = (value: unknown): string =>
  asArray(value)
    .map((part) => asObject(part))
    .filter((part) => partKind(part) === "text")
    .map((part) => asString(part.text || part.content))
    .filter(Boolean)
    .join("\n")
    .trim();

const extractAssistantText = (value: unknown): string => {
  const text = extractTextParts(value);
  return isTransportDebugText(text) ? "" : text;
};

const unsupportedDemoFallback = (userText: string): string | undefined => {
  const normalized = userText.trim().toLowerCase().replace(/\s+/g, " ");
  if (normalized.includes("suspicious") && normalized.includes("stock movement")) {
    return (
      "Anti-theft investigation is coming soon. For now, I can help you review " +
      "audit events and stock-movement history for a selected time range."
    );
  }
  return undefined;
};

export const structuredDemoFollowUp = (userText: string): AgentStructuredPayload | undefined => {
  const normalized = userText.trim().toLowerCase().replace(/\s+/g, " ").replace(/[?!.]+$/, "");
  if (normalized === "what should i review first" || normalized === "what do i review first") {
    return {
      kind: "insight_response",
      summary: "Start with the adjustment log, then compare receiving and sales events around the movement.",
      widgets: [{
        type: "ranked_list",
        title: "Review order",
        items: [
          { label: "Adjustment log", detail: "Look for recent manual edits.", tone: "risk" },
          { label: "Receiving history", detail: "Compare expected and received quantities.", tone: "warn" },
          { label: "Sales and stock trail", detail: "Confirm the full movement chain.", tone: "good" },
        ],
      }],
      confidence: "high",
    };
  }
  if (normalized === "what should i act on first") {
    return {
      kind: "insight_response",
      summary: "Approve urgent replenishment first, then resolve the terminal sync queue before peak-hour checkout.",
      widgets: [{
        type: "ranked_list",
        title: "Priority actions",
        items: [
          { label: "Approve urgent purchase draft", detail: "Prevents fast-mover stockout.", tone: "risk" },
          { label: "Resolve terminal sync queue", detail: "Avoid reporting gaps.", tone: "warn" },
          { label: "Check cashier readiness", detail: "Terminals and remittance owners.", tone: "good" },
        ],
      }],
      confidence: "high",
    };
  }
  if (normalized === "what alternative action should i take") {
    return {
      kind: "insight_response",
      summary: "Split urgent replenishment between the delayed supplier and a backup supplier, while keeping non-urgent quantities on review.",
      widgets: [{
        type: "action_form",
        title: "Supplier action",
        fields: [
          { name: "primary_supplier", label: "Primary supplier", type: "text", required: true },
          { name: "backup_supplier", label: "Backup supplier", type: "text", required: true },
          { name: "urgent_quantity_split", label: "Urgent quantity split", type: "text", required: true },
          { name: "review_date", label: "Review date", type: "text", required: true },
        ],
        submit_label: "Prepare supplier split",
      }],
      confidence: "high",
    };
  }
  if (normalized === "notify the staff member when the role is updated") {
    return {
      kind: "insight_response",
      summary: "I can prepare the staff notification after you provide the staff member and confirm the message.",
      widgets: [{
        type: "action_form",
        title: "Notify staff after a role update",
        description: "Choose the staff member and confirm before any notification is sent.",
        fields: [
          { name: "staff_member", label: "Staff member", type: "text", required: true },
          {
            name: "message",
            label: "Notification message",
            type: "text",
            required: false,
            placeholder: "Your cashier role has been updated.",
          },
        ],
        submit_label: "Preview notification",
      }],
      confidence: "high",
      warnings: ["No notification is sent without explicit confirmation."],
    };
  }
  return undefined;
};

const structuredDemoFallback = (userText: string, responseText: string): AgentStructuredPayload | undefined => {
  if (!responseText) {
    return undefined;
  }
  const normalized = userText.trim().toLowerCase().replace(/\s+/g, " ");
  if (normalized.includes("notify the staff member") && responseText.toLowerCase().includes("staff activity")) {
    return structuredDemoFollowUp(userText);
  }
  return undefined;
};

const normalizeTransportFailure = (session: Ka2aSession, text: string): string => {
  if (!text.toLowerCase().includes("i could not complete that answer from the agent service")) {
    return text;
  }
  const lastUserMessage = [...session.messages].reverse().find((message) => message.role === "user");
  return unsupportedDemoFallback(lastUserMessage?.content || "") || text;
};

const extractPrimaryData = (value: unknown): Record<string, unknown> | undefined => {
  const part = asArray(value)
    .map((item) => asObject(item))
    .find((item) => partKind(item) === "data" || partKind(item) === "object" || partKind(item) === "json");
  if (!part) {
    return undefined;
  }
  const data = asObject(part.data);
  return Object.keys(data).length ? data : undefined;
};

const hasMeaningfulValue = (value: unknown): boolean => {
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  if (value && typeof value === "object") {
    return Object.keys(value as Record<string, unknown>).length > 0;
  }
  if (typeof value === "string") {
    return value.trim().length > 0;
  }
  return value !== undefined && value !== null;
};

const mergeStructuredPayload = (
  previous?: AgentStructuredPayload,
  incoming?: AgentStructuredPayload,
): AgentStructuredPayload | undefined => {
  if (!previous) {
    return incoming;
  }
  if (!incoming) {
    return previous;
  }

  const merged: AgentStructuredPayload = {
    ...previous,
    ...incoming,
  };

  for (const key of [
    "existing_responses",
    "current_values",
    "fields",
    "steps",
    "options",
    "choices",
    "workflow_plan",
    "completed_agents",
    "next_agents",
  ]) {
    if (!hasMeaningfulValue(incoming[key]) && hasMeaningfulValue(previous[key])) {
      merged[key] = previous[key];
    }
  }

  return merged;
};

const isIgnorableAssistantPayloadText = (value: string): boolean => {
  const normalized = value.trim();
  return normalized === "[]" || normalized === "{}" || normalized === "null";
};

const stableSerialize = (value: unknown): string => {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableSerialize(item)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    return `{${Object.keys(value as Record<string, unknown>)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableSerialize((value as Record<string, unknown>)[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
};

const payloadSignature = (payload?: AgentStructuredPayload): string =>
  payload ? stableSerialize(payload) : "";

const comparableStructuredIdentity = (payload?: AgentStructuredPayload): string => {
  if (!payload) {
    return "";
  }

  const record = payload as Record<string, unknown>;
  const identity = {
    interaction_type: record.interaction_type,
    kind: record.kind,
    type: record.type,
    title: record.title,
    question: record.question,
    description: record.description,
    workflow_id: record.workflow_id,
    step_id: record.step_id,
    field_name: record.field_name,
    options: record.options,
    choices: record.choices,
    fields: record.fields,
    widgets: record.widgets,
  };

  return stableSerialize(identity);
};

const upsertAssistantMessage = (
  session: Ka2aSession,
  payload: {
    taskId?: string;
    content: string;
    timestamp: string;
    serverMessageId?: string;
    structuredPayload?: AgentStructuredPayload;
    voiceTurnId?: string;
    sourceAgent?: string;
    messageKind?: "specialist" | "summary";
  },
) => {
  // A serialized TextPart can arrive alongside the real artifact/result. Do
  // not persist it as a second assistant message or let it replace a widget.
  const rawText = isTransportDebugText(payload.content) ? "" : payload.content.trim();
  const text = normalizeTransportFailure(session, rawText);
  const lastUserMessage = [...session.messages].reverse().find((message) => message.role === "user");
  const structuredPayload =
    payload.structuredPayload || structuredDemoFallback(lastUserMessage?.content || "", text);
  const fallbackText = summarizeStructuredPayload(structuredPayload);
  const content = text || fallbackText;
  if ((!content && !structuredPayload) || (!structuredPayload && isIgnorableAssistantPayloadText(content))) {
    return;
  }

  const incomingSignature = payloadSignature(structuredPayload);
  const incomingComparableIdentity = comparableStructuredIdentity(structuredPayload);

  const existing = payload.serverMessageId
    ? session.messages.find((message) => message.role === "assistant" && message.serverMessageId === payload.serverMessageId)
    : undefined;

  if (existing) {
    existing.content = content;
    existing.timestamp = payload.timestamp;
    existing.structuredPayload = mergeStructuredPayload(existing.structuredPayload, structuredPayload);
    existing.voiceTurnId = payload.voiceTurnId || existing.voiceTurnId;
    existing.sourceAgent = payload.sourceAgent || existing.sourceAgent;
    existing.messageKind = payload.messageKind || existing.messageKind;
    return;
  }

  const byVoiceTurn = payload.voiceTurnId
    && payload.messageKind !== "specialist"
    ? [...session.messages]
        .reverse()
        .find(
          (message) =>
            message.role === "assistant" &&
            message.voiceTurnId === payload.voiceTurnId &&
            message.messageKind !== "specialist",
        )
    : undefined;

  if (byVoiceTurn) {
    byVoiceTurn.content = content || byVoiceTurn.content;
    byVoiceTurn.timestamp = payload.timestamp;
    byVoiceTurn.taskId = payload.taskId || byVoiceTurn.taskId;
    byVoiceTurn.serverMessageId = payload.serverMessageId || byVoiceTurn.serverMessageId;
    byVoiceTurn.voiceTurnId = payload.voiceTurnId || byVoiceTurn.voiceTurnId;
    byVoiceTurn.structuredPayload = mergeStructuredPayload(byVoiceTurn.structuredPayload, structuredPayload);
    byVoiceTurn.sourceAgent = payload.sourceAgent || byVoiceTurn.sourceAgent;
    byVoiceTurn.messageKind = payload.messageKind || byVoiceTurn.messageKind;
    return;
  }

  const equivalentExisting = [...session.messages]
    .reverse()
    .find((message) => {
      if (message.role !== "assistant") {
        return false;
      }
      if (payload.voiceTurnId && message.voiceTurnId && message.voiceTurnId !== payload.voiceTurnId) {
        return false;
      }
      if (payload.taskId && message.taskId && message.taskId !== payload.taskId) {
        return false;
      }
      if (payload.sourceAgent && message.sourceAgent && payload.sourceAgent !== message.sourceAgent) {
        return false;
      }
      if (payload.messageKind && message.messageKind && payload.messageKind !== message.messageKind) {
        return false;
      }

      const messageContent = message.content.trim();
      const sameContent = Boolean(content) && messageContent === content;
      const existingSignature = payloadSignature(message.structuredPayload);
      const sameStructuredPayload = Boolean(incomingSignature) && existingSignature === incomingSignature;
      const existingComparableIdentity = comparableStructuredIdentity(message.structuredPayload);
      const sameComparableStructuredPayload =
        Boolean(incomingComparableIdentity) &&
        Boolean(existingComparableIdentity) &&
        existingComparableIdentity === incomingComparableIdentity;
      const sameSummary =
        Boolean(incomingSignature) &&
        Boolean(message.structuredPayload) &&
        messageContent === fallbackText &&
        fallbackText.length > 0;

      return sameContent || sameStructuredPayload || sameComparableStructuredPayload || sameSummary;
    });

  if (equivalentExisting) {
    equivalentExisting.content = content;
    equivalentExisting.timestamp = payload.timestamp;
    equivalentExisting.taskId = payload.taskId || equivalentExisting.taskId;
    equivalentExisting.serverMessageId = payload.serverMessageId || equivalentExisting.serverMessageId;
    equivalentExisting.voiceTurnId = payload.voiceTurnId || equivalentExisting.voiceTurnId;
    equivalentExisting.sourceAgent = payload.sourceAgent || equivalentExisting.sourceAgent;
    equivalentExisting.messageKind = payload.messageKind || equivalentExisting.messageKind;
    equivalentExisting.structuredPayload = mergeStructuredPayload(
      equivalentExisting.structuredPayload,
      structuredPayload,
    );
    return;
  }

  session.messages.push({
    id: createId(),
    role: "assistant",
    content,
    taskId: payload.taskId,
    timestamp: payload.timestamp,
    serverMessageId: payload.serverMessageId,
    structuredPayload,
    voiceTurnId: payload.voiceTurnId,
    sourceAgent: payload.sourceAgent,
    messageKind: payload.messageKind,
  });
};

const ensurePendingVoiceUserMessage = (session: Ka2aSession) => {
  const pendingText = session.pendingVoiceUserText?.trim();
  if (!pendingText) {
    return;
  }

  const pendingTurnId = session.pendingVoiceTurnId?.trim();
  const alreadyExists = session.messages.some((message) => {
    if (message.role !== "user") {
      return false;
    }
    if (pendingTurnId && message.voiceTurnId === pendingTurnId) {
      return true;
    }
    return message.content.trim() === pendingText;
  });

  if (alreadyExists) {
    return;
  }

  session.messages.push({
    id: createId(),
    role: "user",
    content: pendingText,
    timestamp: nowIso(),
    voiceTurnId: pendingTurnId || undefined,
  });
};

const newSession = (): Ka2aSession => ({
  sessionId: createId(),
  title: "New session",
  agentName: "host",
  historyLength: 10,
  isStreaming: false,
  messages: [],
  eventLog: [],
  runs: {},
  awaitingInput: false,
});

const initialState: Ka2aState = {
  sessions: {},
  activeSessionId: undefined,
};

const ka2aSlice = createSlice({
  name: "ka2a",
  initialState,
  reducers: {
    createSession: (state) => {
      const session = newSession();
      state.sessions[session.sessionId] = session;
      state.activeSessionId = session.sessionId;
    },
    createSessionWithConfig: (
      state,
      action: PayloadAction<{
        sessionId: string;
        title?: string;
        agentName?: string;
        historyLength?: number;
        makeActive?: boolean;
      }>,
    ) => {
      const session = {
        ...newSession(),
        sessionId: action.payload.sessionId,
        title: action.payload.title || "Assistant",
        agentName: action.payload.agentName || "host",
        historyLength:
          typeof action.payload.historyLength === "number"
            ? Math.max(0, Math.floor(action.payload.historyLength))
            : 10,
      };
      state.sessions[session.sessionId] = session;
      if (action.payload.makeActive !== false) {
        state.activeSessionId = session.sessionId;
      }
    },
    setActiveSession: (state, action: PayloadAction<string>) => {
      if (state.sessions[action.payload]) {
        state.activeSessionId = action.payload;
      }
    },
    deleteSession: (state, action: PayloadAction<string>) => {
      delete state.sessions[action.payload];
      if (state.activeSessionId === action.payload) {
        const next = Object.keys(state.sessions)[0];
        state.activeSessionId = next;
      }
    },
    updateSessionConfig: (
      state,
      action: PayloadAction<{ sessionId: string; agentName?: string; historyLength?: number }>,
    ) => {
      const session = state.sessions[action.payload.sessionId];
      if (!session) {
        return;
      }
      if (typeof action.payload.agentName === "string") {
        session.agentName = action.payload.agentName;
      }
      if (typeof action.payload.historyLength === "number") {
        session.historyLength = Math.max(0, Math.floor(action.payload.historyLength));
      }
    },
    setSessionContextId: (state, action: PayloadAction<{ sessionId: string; contextId?: string }>) => {
      const session = state.sessions[action.payload.sessionId];
      if (!session) {
        return;
      }
      session.contextId = action.payload.contextId;
    },
    streamStarted: (
      state,
      action: PayloadAction<{
        sessionId: string;
        userText: string;
        silent?: boolean;
        showUserMessage?: boolean;
        turnId?: string;
        requestId?: string;
      }>,
    ) => {
      const session = state.sessions[action.payload.sessionId];
      if (!session) {
        return;
      }
      const resumingExistingTask = session.awaitingInput;
      session.isStreaming = true;
      session.error = undefined;
      session.awaitingInput = false;
      session.resumeTaskId = undefined;
      session.currentTaskState = "working";
      session.currentStatusText = action.payload.silent
        ? "Assistant is processing your voice request."
        : undefined;
      const normalizedUserText = action.payload.userText.trim();
      const normalizedVoiceTurnId = action.payload.turnId?.trim() || undefined;
      session.pendingVoiceTurnId = normalizedVoiceTurnId;
      session.pendingVoiceUserText = normalizedUserText || undefined;
      session.pendingRequestId = action.payload.requestId?.trim() || undefined;
      if (!resumingExistingTask) {
        session.activeSpecialist = undefined;
      }
      if (normalizedUserText && (!action.payload.silent || action.payload.showUserMessage)) {
        const existingVoiceUserMessage = normalizedVoiceTurnId
          ? [...session.messages]
              .reverse()
              .find((message) => message.role === "user" && message.voiceTurnId === normalizedVoiceTurnId)
          : undefined;

        if (existingVoiceUserMessage) {
          existingVoiceUserMessage.content = normalizedUserText;
          existingVoiceUserMessage.timestamp = nowIso();
        } else {
          session.messages.push({
            id: createId(),
            role: "user",
            content: normalizedUserText,
            timestamp: nowIso(),
            voiceTurnId: normalizedVoiceTurnId,
          });
        }
      }
    },
    historyAnswerReturned: (
      state,
      action: PayloadAction<{
        sessionId: string;
        userText: string;
        assistantText: string;
        structuredPayload?: AgentStructuredPayload;
      }>,
    ) => {
      const session = state.sessions[action.payload.sessionId];
      if (!session) {
        return;
      }
      session.isStreaming = false;
      session.error = undefined;
      session.awaitingInput = false;
      session.resumeTaskId = undefined;
      session.pendingRequestId = undefined;
      session.currentTaskState = "completed";
      session.currentStatusText = undefined;
      session.messages.push({
        id: createId(),
        role: "user",
        content: action.payload.userText,
        timestamp: nowIso(),
      });
      session.messages.push({
        id: createId(),
        role: "assistant",
        content: action.payload.assistantText,
        timestamp: nowIso(),
        structuredPayload: action.payload.structuredPayload,
      });
    },
    streamEnded: (
      state,
      action: PayloadAction<{ sessionId: string; turnId?: string; requestId?: string }>,
    ) => {
      const session = state.sessions[action.payload.sessionId];
      if (!session) {
        return;
      }
      const normalizedTurnId = action.payload.turnId?.trim();
      if (
        normalizedTurnId &&
        session.pendingVoiceTurnId &&
        session.pendingVoiceTurnId !== normalizedTurnId
      ) {
        return;
      }
      const normalizedRequestId = action.payload.requestId?.trim();
      if (
        normalizedRequestId &&
        session.pendingRequestId &&
        session.pendingRequestId !== normalizedRequestId
      ) {
        return;
      }
      const wasStreaming = session.isStreaming;
      session.isStreaming = false;
      session.pendingRequestId = undefined;
      if (!wasStreaming) {
        session.pendingVoiceTurnId = undefined;
        session.pendingVoiceUserText = undefined;
        return;
      }
      const lastUserIndex = [...session.messages].map((message) => message.role).lastIndexOf("user");
      const hasAssistantAfterLastUser =
        lastUserIndex >= 0 && session.messages.slice(lastUserIndex + 1).some((message) => message.role === "assistant");
      if (lastUserIndex >= 0 && !hasAssistantAfterLastUser) {
      const fallback = unsupportedDemoFallback(session.messages[lastUserIndex]?.content || "");
      session.messages.push({
        id: createId(),
        role: "assistant",
        content: fallback ||
          "I could not complete that answer from the agent service. Please retry, or ask me to regenerate the analysis if you need fresh data.",
          timestamp: nowIso(),
        });
      }
      session.pendingVoiceTurnId = undefined;
      session.pendingVoiceUserText = undefined;
    },
    streamErrored: (
      state,
      action: PayloadAction<{ sessionId: string; error: string; requestId?: string }>,
    ) => {
      const session = state.sessions[action.payload.sessionId];
      if (!session) {
        return;
      }
      const normalizedRequestId = action.payload.requestId?.trim();
      if (
        normalizedRequestId &&
        session.pendingRequestId &&
        session.pendingRequestId !== normalizedRequestId
      ) {
        return;
      }
      session.isStreaming = false;
      session.pendingRequestId = undefined;
      session.currentStatusText = undefined;
      session.error = action.payload.error;
      const lastUserIndex = [...session.messages].map((message) => message.role).lastIndexOf("user");
      const hasAssistantAfterLastUser =
        lastUserIndex >= 0 && session.messages.slice(lastUserIndex + 1).some((message) => message.role === "assistant");
      if (lastUserIndex >= 0 && !hasAssistantAfterLastUser) {
        const fallback = unsupportedDemoFallback(session.messages[lastUserIndex]?.content || "");
        session.messages.push({
          id: createId(),
          role: "assistant",
          content: fallback ||
            "I could not complete that answer from the agent service. Please retry, or ask me to regenerate the analysis if you need fresh data.",
          timestamp: nowIso(),
        });
      }
      session.pendingVoiceTurnId = undefined;
      session.pendingVoiceUserText = undefined;
    },
    syncedVoiceAssistantResolved: (
      state,
      action: PayloadAction<{ sessionId: string; content: string; timestamp?: string; turnId?: string }>,
    ) => {
      const session = state.sessions[action.payload.sessionId];
      if (!session) {
        return;
      }
      ensurePendingVoiceUserMessage(session);
      const content = action.payload.content.trim();
      if (!content) {
        session.isStreaming = false;
        session.currentStatusText = undefined;
        session.pendingVoiceTurnId = undefined;
        session.pendingVoiceUserText = undefined;
        return;
      }
      session.isStreaming = false;
      session.awaitingInput = false;
      session.resumeTaskId = undefined;
      session.currentTaskState = "completed";
      session.currentStatusText = undefined;
      upsertAssistantMessage(session, {
        content,
        timestamp: action.payload.timestamp || nowIso(),
        voiceTurnId: action.payload.turnId?.trim() || session.pendingVoiceTurnId,
      });
      session.pendingVoiceTurnId = undefined;
      session.pendingVoiceUserText = undefined;
    },
    eventReceived: (state, action: PayloadAction<{ sessionId: string; event: Ka2aEvent }>) => {
      const session = state.sessions[action.payload.sessionId];
      if (!session) {
        return;
      }
      ensurePendingVoiceUserMessage(session);

      const receivedAt = nowIso();
      session.eventLog.push({ id: createId(), receivedAt, event: action.payload.event });

      const event = action.payload.event;
      if (event.kind === "task") {
        const taskId = asId(event.id);
        const contextId = asString(event.contextId) || undefined;
        session.contextId = contextId || session.contextId;
        session.lastTaskId = taskId || session.lastTaskId;
        session.currentTaskState = asString(asObject(event.status).state) || session.currentTaskState;

        const status = asObject(event.status);
        const stateValue = asString(status.state) || undefined;
        const submittedAt = asString(status.timestamp) || undefined;

        if (taskId) {
          session.runs[taskId] = {
            taskId,
            contextId,
            state: stateValue,
            submittedAt,
          };
        }
        return;
      }

      if (event.kind === "status-update") {
        const taskId = asId(event.taskId);
        const contextId = asString(event.contextId) || undefined;
        if (contextId) {
          session.contextId = contextId;
        }

        const status = asObject(event.status);
        const stateValue = asString(status.state) || undefined;
        const timestamp = asString(status.timestamp) || undefined;
        const isFinal = asBoolean(event.final);
        const statusMessage = asObject(status.message);
        const statusMessageRole = asString(statusMessage.role) || undefined;
        const statusMessageId = asString(statusMessage.messageId) || undefined;
        const structuredPayload = extractInteractionPayloadFromParts(statusMessage.parts);
        const rawFinalText = extractAssistantText(statusMessage.parts) || summarizeStructuredPayload(structuredPayload);
        const finalText = normalizeTransportFailure(session, rawFinalText);
        session.currentTaskState = stateValue || session.currentTaskState;
        if (!isFinal && finalText && statusMessageRole !== "user") {
          session.currentStatusText = finalText;
        }

        if (taskId) {
          const run = session.runs[taskId] || { taskId };
          run.contextId = run.contextId || contextId;
          run.state = stateValue || run.state;
          const effectiveStructuredPayload = mergeStructuredPayload(run.structuredPayload, structuredPayload);
          if (finalText && statusMessageRole !== "user") {
            run.resultText = finalText;
          }
          if (effectiveStructuredPayload) {
            run.structuredPayload = effectiveStructuredPayload;
          }
          if (isFinal) {
            run.completedAt = timestamp || run.completedAt;
          }
          session.runs[taskId] = run;
          session.lastTaskId = taskId;
        }

        if (isFinal) {
          session.isStreaming = false;
          session.currentStatusText = undefined;
          const awaitingInput = stateValue === "input-required" || stateValue === "auth-required";
          session.awaitingInput = awaitingInput;
          session.resumeTaskId = awaitingInput ? taskId || undefined : undefined;
          const run = taskId ? session.runs[taskId] : undefined;
          const effectiveStructuredPayload = mergeStructuredPayload(run?.structuredPayload, structuredPayload);
          const effectiveFinalText = finalText || summarizeStructuredPayload(effectiveStructuredPayload);
          if (effectiveFinalText && statusMessageRole !== "user") {
            upsertAssistantMessage(session, {
              taskId: taskId || undefined,
              content: effectiveFinalText,
              timestamp: timestamp || nowIso(),
              serverMessageId: statusMessageId,
              structuredPayload: effectiveStructuredPayload,
              voiceTurnId: session.pendingVoiceTurnId,
            });
          }
        }
        return;
      }

      if (event.kind === "artifact-update") {
        const taskId = asId(event.taskId);
        const contextId = asString(event.contextId) || undefined;
        if (contextId) {
          session.contextId = contextId;
        }

        const artifact = asObject(event.artifact);
        const artifactName = asString(artifact.name);
        const artifactId = asString(artifact.artifactId) || undefined;
        const artifactData = extractPrimaryData(artifact.parts);

        if (artifactName === "delegation" && artifactData) {
          const selectedAgent = asString(artifactData.selectedAgent);
          session.activeSpecialist = selectedAgent || session.activeSpecialist;
        }

        if (artifactName === "result") {
          const text = normalizeTransportFailure(session, extractAssistantText(artifact.parts));
          const structuredPayload = extractInteractionPayloadFromParts(artifact.parts);
          const resultText = text || summarizeStructuredPayload(structuredPayload);

          if (taskId) {
            const run = session.runs[taskId] || { taskId };
            run.contextId = run.contextId || contextId;
            run.resultText = resultText || run.resultText;
            run.structuredPayload = mergeStructuredPayload(run.structuredPayload, structuredPayload);
            session.runs[taskId] = run;
            session.lastTaskId = taskId;
          }

          if (resultText || structuredPayload) {
            upsertAssistantMessage(session, {
              taskId: taskId || undefined,
              content: resultText,
              timestamp: receivedAt,
              structuredPayload,
              voiceTurnId: session.pendingVoiceTurnId,
              messageKind:
                Array.isArray(structuredPayload?.widgets) &&
                structuredPayload.widgets.some(
                  (widget) => asString(asObject(widget).type) === "section_stack",
                )
                ? "summary"
                : undefined,
            });
            session.isStreaming = false;
            session.currentStatusText = undefined;
            const widgets = Array.isArray(structuredPayload?.widgets)
              ? structuredPayload.widgets
              : [];
            const isCompletedInsight =
              structuredPayload?.kind === "insight_response" ||
              widgets.some(
                (widget) => asString(asObject(widget).type) === "section_stack",
              );
            if (isCompletedInsight) {
              // A completed aggregate is terminal even if a child specialist
              // emitted an earlier input-required status while the host was
              // collecting the remaining domains.
              session.currentTaskState = "completed";
              session.awaitingInput = false;
              session.resumeTaskId = undefined;
              session.activeSpecialist = undefined;
            }
            session.pendingVoiceTurnId = undefined;
            session.pendingVoiceUserText = undefined;
          }
          return;
        }

        // Delegated specialist results arrive before the host's final aggregate
        // as artifacts such as "pos.result" or "inventory.result". Preserve
        // them as separate messages so the UI can render each domain in order.
        const childResult = artifactName.includes(".") && (
          artifactName.endsWith(".result") || Boolean(extractInteractionPayloadFromParts(artifact.parts))
        );
        if (childResult) {
          const sourceAgent = artifactName.slice(0, artifactName.lastIndexOf(".")).trim() || undefined;
          const text = normalizeTransportFailure(session, extractAssistantText(artifact.parts));
          const structuredPayload = extractInteractionPayloadFromParts(artifact.parts);
          const resultText = text || summarizeStructuredPayload(structuredPayload);
          if (resultText || structuredPayload) {
            upsertAssistantMessage(session, {
              taskId: taskId || undefined,
              content: resultText,
              timestamp: receivedAt,
              serverMessageId: artifactId,
              structuredPayload,
              voiceTurnId: session.pendingVoiceTurnId,
              sourceAgent,
              messageKind: "specialist",
            });
          }
        }
      }
    },
    clearSession: (state, action: PayloadAction<{ sessionId: string }>) => {
      const session = state.sessions[action.payload.sessionId];
      if (!session) {
        return;
      }
      session.messages = [];
      session.eventLog = [];
      session.runs = {};
      // A new chat must not reuse the server-side context from the previous chat.
      session.contextId = undefined;
      session.lastTaskId = undefined;
      session.error = undefined;
      session.isStreaming = false;
      session.activeSpecialist = undefined;
      session.currentTaskState = undefined;
      session.currentStatusText = undefined;
      session.awaitingInput = false;
      session.resumeTaskId = undefined;
      session.pendingVoiceTurnId = undefined;
      session.pendingVoiceUserText = undefined;
    },
  },
});

export const {
  createSession,
  createSessionWithConfig,
  setActiveSession,
  deleteSession,
  updateSessionConfig,
  setSessionContextId,
  historyAnswerReturned,
  streamStarted,
  streamEnded,
  streamErrored,
  syncedVoiceAssistantResolved,
  eventReceived,
  clearSession,
} = ka2aSlice.actions;

export default ka2aSlice.reducer;
