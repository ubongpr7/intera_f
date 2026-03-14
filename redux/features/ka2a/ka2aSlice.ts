import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

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

const upsertAssistantMessage = (session: Ka2aSession, payload: { taskId?: string; content: string; timestamp: string }) => {
  const text = payload.content.trim();
  if (!text) {
    return;
  }

  const existing = payload.taskId
    ? session.messages.find((message) => message.role === "assistant" && message.taskId === payload.taskId)
    : undefined;

  if (existing) {
    existing.content = text;
    existing.timestamp = payload.timestamp;
    return;
  }

  session.messages.push({
    id: createId(),
    role: "assistant",
    content: text,
    taskId: payload.taskId,
    timestamp: payload.timestamp,
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
    streamStarted: (state, action: PayloadAction<{ sessionId: string; userText: string }>) => {
      const session = state.sessions[action.payload.sessionId];
      if (!session) {
        return;
      }
      session.isStreaming = true;
      session.error = undefined;
      session.messages.push({
        id: createId(),
        role: "user",
        content: action.payload.userText,
        timestamp: nowIso(),
      });
    },
    streamEnded: (state, action: PayloadAction<{ sessionId: string }>) => {
      const session = state.sessions[action.payload.sessionId];
      if (!session) {
        return;
      }
      session.isStreaming = false;
    },
    streamErrored: (state, action: PayloadAction<{ sessionId: string; error: string }>) => {
      const session = state.sessions[action.payload.sessionId];
      if (!session) {
        return;
      }
      session.isStreaming = false;
      session.error = action.payload.error;
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
        const finalText = extractTextParts(statusMessage.parts);

        if (taskId) {
          const run = session.runs[taskId] || { taskId };
          run.contextId = run.contextId || contextId;
          run.state = stateValue || run.state;
          if (finalText) {
            run.resultText = finalText;
          }
          if (isFinal) {
            run.completedAt = timestamp || run.completedAt;
          }
          session.runs[taskId] = run;
          session.lastTaskId = taskId;
        }

        if (isFinal) {
          session.isStreaming = false;
          if (finalText) {
            upsertAssistantMessage(session, {
              taskId: taskId || undefined,
              content: finalText,
              timestamp: timestamp || nowIso(),
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

        if (artifactName === "result") {
          const text = extractTextParts(artifact.parts);

          if (taskId) {
            const run = session.runs[taskId] || { taskId };
            run.contextId = run.contextId || contextId;
            run.resultText = text || run.resultText;
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
    },
  },
});

export const {
  createSession,
  setActiveSession,
  deleteSession,
  updateSessionConfig,
  setSessionContextId,
  streamStarted,
  streamEnded,
  streamErrored,
  eventReceived,
  clearSession,
} = ka2aSlice.actions;

export default ka2aSlice.reducer;
