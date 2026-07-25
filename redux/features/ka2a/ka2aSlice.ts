import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import {
  extractInteractionPayloadFromParts,
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

const extractTextParts = (value: unknown): string =>
  asArray(value)
    .map((part) => asObject(part))
    .filter((part) => asString(part.kind) === "text" && typeof part.text === "string")
    .map((part) => String(part.text))
    .join("")
    .trim();

const extractPrimaryData = (value: unknown): Record<string, unknown> | undefined => {
  const part = asArray(value)
    .map((item) => asObject(item))
    .find((item) => asString(item.kind) === "data");
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

const upsertAssistantMessage = (
  session: Ka2aSession,
  payload: {
    taskId?: string;
    content: string;
    timestamp: string;
    serverMessageId?: string;
    structuredPayload?: AgentStructuredPayload;
  },
) => {
  const text = payload.content.trim();
  const fallbackText = summarizeStructuredPayload(payload.structuredPayload);
  const content = text || fallbackText;
  if ((!content && !payload.structuredPayload) || (!payload.structuredPayload && isIgnorableAssistantPayloadText(content))) {
    return;
  }

  const existing = payload.serverMessageId
    ? session.messages.find((message) => message.role === "assistant" && message.serverMessageId === payload.serverMessageId)
    : undefined;

  if (existing) {
    existing.content = content;
    existing.timestamp = payload.timestamp;
    existing.structuredPayload = mergeStructuredPayload(existing.structuredPayload, payload.structuredPayload);
    return;
  }

  session.messages.push({
    id: createId(),
    role: "assistant",
    content,
    taskId: payload.taskId,
    timestamp: payload.timestamp,
    serverMessageId: payload.serverMessageId,
    structuredPayload: payload.structuredPayload,
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
    streamStarted: (state, action: PayloadAction<{ sessionId: string; userText: string; silent?: boolean }>) => {
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
      session.currentStatusText = undefined;
      if (!resumingExistingTask) {
        session.activeSpecialist = undefined;
      }
      if (!action.payload.silent) {
        session.messages.push({
          id: createId(),
          role: "user",
          content: action.payload.userText,
          timestamp: nowIso(),
        });
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
    streamEnded: (state, action: PayloadAction<{ sessionId: string }>) => {
      const session = state.sessions[action.payload.sessionId];
      if (!session) {
        return;
      }
      session.isStreaming = false;
      const lastUserIndex = [...session.messages].map((message) => message.role).lastIndexOf("user");
      const hasAssistantAfterLastUser =
        lastUserIndex >= 0 && session.messages.slice(lastUserIndex + 1).some((message) => message.role === "assistant");
      if (lastUserIndex >= 0 && !hasAssistantAfterLastUser) {
        session.messages.push({
          id: createId(),
          role: "assistant",
          content:
            "I could not complete that answer from the agent service. Please retry, or ask me to regenerate the analysis if you need fresh data.",
          timestamp: nowIso(),
        });
      }
    },
    streamErrored: (state, action: PayloadAction<{ sessionId: string; error: string }>) => {
      const session = state.sessions[action.payload.sessionId];
      if (!session) {
        return;
      }
      session.isStreaming = false;
      session.currentStatusText = undefined;
      session.error = action.payload.error;
      const lastUserIndex = [...session.messages].map((message) => message.role).lastIndexOf("user");
      const hasAssistantAfterLastUser =
        lastUserIndex >= 0 && session.messages.slice(lastUserIndex + 1).some((message) => message.role === "assistant");
      if (lastUserIndex >= 0 && !hasAssistantAfterLastUser) {
        session.messages.push({
          id: createId(),
          role: "assistant",
          content:
            "I could not complete that answer from the agent service. Please retry, or ask me to regenerate the analysis if you need fresh data.",
          timestamp: nowIso(),
        });
      }
    },
    eventReceived: (state, action: PayloadAction<{ sessionId: string; event: Ka2aEvent }>) => {
      const session = state.sessions[action.payload.sessionId];
      if (!session) {
        return;
      }

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
        const finalText = extractTextParts(statusMessage.parts) || summarizeStructuredPayload(structuredPayload);
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
        const artifactData = extractPrimaryData(artifact.parts);

        if (artifactName === "delegation" && artifactData) {
          const selectedAgent = asString(artifactData.selectedAgent);
          session.activeSpecialist = selectedAgent || session.activeSpecialist;
        }

        if (artifactName === "result") {
          const text = extractTextParts(artifact.parts);
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
      session.error = undefined;
      session.isStreaming = false;
      session.activeSpecialist = undefined;
      session.currentTaskState = undefined;
      session.currentStatusText = undefined;
      session.awaitingInput = false;
      session.resumeTaskId = undefined;
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
  eventReceived,
  clearSession,
} = ka2aSlice.actions;

export default ka2aSlice.reducer;
