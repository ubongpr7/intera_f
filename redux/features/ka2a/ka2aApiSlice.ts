import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { getCookie } from "cookies-next";

import { apiSlice } from "../../services/apiSlice";
import { readCookieValue } from "@/lib/authCookies";
import { eventReceived, type Ka2aEvent } from "./ka2aSlice";

type GatewayHealth = {
  status: string;
};

type AgentCard = Record<string, unknown>;

type StreamMessageResult = {
  ok: true;
};

type StreamMessageArgs = {
  sessionId: string;
  text: string;
  agentName: string;
  contextId?: string;
  historyLength: number;
};

type ContinueTaskStreamArgs = {
  sessionId: string;
  taskId: string;
  text: string;
  agentName: string;
  historyLength: number;
};

const stripTrailingSlash = (value: string) => value.replace(/\/+$/, "");

const getGatewayBaseUrl = () => {
  const base = (process.env.NEXT_PUBLIC_KA2A_GATEWAY_URL || "http://localhost:8000").trim();
  return stripTrailingSlash(base);
};

const getRequestTimeoutMs = () => {
  const raw = (process.env.NEXT_PUBLIC_KA2A_REQUEST_TIMEOUT_MS || "").trim();
  if (!raw) {
    return 0;
  }
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 0;
  }
  return Math.floor(parsed);
};

const buildGatewayHeaders = (contentType = true) => {
  const headers = new Headers();
  const accessToken = readCookieValue("accessToken", (name) => getCookie(name));

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }
  if (contentType) {
    headers.set("Content-Type", "application/json");
  }
  return headers;
};

const fetchError = (error: unknown): { error: FetchBaseQueryError } => ({
  error: {
    status: "FETCH_ERROR",
    error: error instanceof Error ? error.message : String(error),
  },
});

const httpError = (status: number, data: unknown): { error: FetchBaseQueryError } => ({
  error: { status, data },
});

const parseJson = <T>(text: string): T => JSON.parse(text) as T;

const fetchWithOptionalTimeout = async (
  input: RequestInfo | URL,
  init: RequestInit = {},
  externalSignal?: AbortSignal,
) => {
  const timeoutMs = getRequestTimeoutMs();
  if (!externalSignal && timeoutMs <= 0) {
    return fetch(input, init);
  }

  const controller = new AbortController();
  const cleanup: Array<() => void> = [];

  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort(externalSignal.reason);
    } else {
      const abortFromExternal = () => controller.abort(externalSignal.reason);
      externalSignal.addEventListener("abort", abortFromExternal, { once: true });
      cleanup.push(() => externalSignal.removeEventListener("abort", abortFromExternal));
    }
  }

  let timer: ReturnType<typeof setTimeout> | undefined;
  if (timeoutMs > 0) {
    timer = setTimeout(() => {
      controller.abort(new Error(`Request timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  }

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    if (timer !== undefined) {
      clearTimeout(timer);
    }
    cleanup.forEach((fn) => fn());
  }
};

const requestJson = async <T>(
  path: string,
  signal?: AbortSignal,
): Promise<{ data: T } | { error: FetchBaseQueryError }> => {
  try {
    const response = await fetchWithOptionalTimeout(
      `${getGatewayBaseUrl()}${path}`,
      {
        cache: "no-store",
        headers: buildGatewayHeaders(false),
      },
      signal,
    );
    const text = await response.text();

    if (!response.ok) {
      return httpError(response.status, text || response.statusText);
    }
    if (!text.trim()) {
      return { data: {} as T };
    }
    return { data: parseJson<T>(text) };
  } catch (error) {
    return fetchError(error);
  }
};

const parseSseChunks = async (
  stream: ReadableStream<Uint8Array>,
  onJson: (obj: unknown) => void,
): Promise<void> => {
  const reader = stream.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }
    buffer += decoder.decode(value, { stream: true });

    while (true) {
      const separatorIndex = buffer.indexOf("\n\n");
      if (separatorIndex === -1) {
        break;
      }
      const rawEvent = buffer.slice(0, separatorIndex);
      buffer = buffer.slice(separatorIndex + 2);

      const dataLines = rawEvent
        .split(/\r?\n/)
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice("data:".length).trimStart());

      if (!dataLines.length) {
        continue;
      }

      const dataText = dataLines.join("\n").trim();
      if (!dataText) {
        continue;
      }
      try {
        onJson(JSON.parse(dataText) as unknown);
      } catch {
        // Ignore malformed chunks and keep streaming.
      }
    }
  }
};

export const ka2aApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getGatewayHealth: builder.query<GatewayHealth, void>({
      queryFn: async (_arg, api) => requestJson<GatewayHealth>("/health", api.signal),
    }),
    lisKA2AtAgents: builder.query<AgentCard[], void>({
      queryFn: async (_arg, api) => requestJson<AgentCard[]>("/agents", api.signal),
    }),
    streamMessage: builder.mutation<StreamMessageResult, StreamMessageArgs>({
      queryFn: async (args, api) => {
        try {
          const response = await fetchWithOptionalTimeout(
            `${getGatewayBaseUrl()}/stream`,
            {
              method: "POST",
              cache: "no-store",
              headers: buildGatewayHeaders(true),
              body: JSON.stringify({
                text: args.text,
                agentName: args.agentName,
                contextId: args.contextId,
                historyLength: args.historyLength,
              }),
            },
            api.signal,
          );

          if (!response.ok) {
            const detail = await response.text().catch(() => "");
            return httpError(response.status, detail || response.statusText);
          }
          if (!response.body) {
            return fetchError("No response body");
          }

          await parseSseChunks(response.body, (obj) => {
            if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
              return;
            }
            const record = obj as Record<string, unknown>;
            if (typeof record.kind !== "string") {
              return;
            }
            api.dispatch(eventReceived({ sessionId: args.sessionId, event: record as Ka2aEvent }));
          });

          return { data: { ok: true } };
        } catch (error) {
          return fetchError(error);
        }
      },
    }),
    continueTaskStream: builder.mutation<StreamMessageResult, ContinueTaskStreamArgs>({
      queryFn: async (args, api) => {
        try {
          const search = new URLSearchParams();
          if (args.agentName) {
            search.set("agent_name", args.agentName);
          }
          const suffix = search.size ? `?${search.toString()}` : "";
          const response = await fetchWithOptionalTimeout(
            `${getGatewayBaseUrl()}/tasks/${encodeURIComponent(args.taskId)}/continue/stream${suffix}`,
            {
              method: "POST",
              cache: "no-store",
              headers: buildGatewayHeaders(true),
              body: JSON.stringify({
                text: args.text,
                historyLength: args.historyLength,
              }),
            },
            api.signal,
          );

          if (!response.ok) {
            const detail = await response.text().catch(() => "");
            return httpError(response.status, detail || response.statusText);
          }
          if (!response.body) {
            return fetchError("No response body");
          }

          await parseSseChunks(response.body, (obj) => {
            if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
              return;
            }
            const record = obj as Record<string, unknown>;
            if (typeof record.kind !== "string") {
              return;
            }
            api.dispatch(eventReceived({ sessionId: args.sessionId, event: record as Ka2aEvent }));
          });

          return { data: { ok: true } };
        } catch (error) {
          return fetchError(error);
        }
      },
    }),
  }),
});

export const { useGetGatewayHealthQuery, useLazyLisKA2AtAgentsQuery } = ka2aApiSlice;
