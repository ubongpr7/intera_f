"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Bot,
  Check,
  ChevronDown,
  ChevronRight,
  Clock3,
  Copy,
  Plus,
  RefreshCcw,
  Server,
  Sparkles,
  Trash2,
} from "lucide-react";
import AgentChat from "@/components/agents/agent-chat";

import { useAppDispatch, useAppSelector } from "@/redux/store";
import {
  clearSession,
  createSession,
  deleteSession,
  setActiveSession,
  updateSessionConfig,
} from "@/redux/features/ka2a/ka2aSlice";
import { sendStreamMessage } from "@/redux/features/ka2a/ka2aThunks";
import { useGetGatewayHealthQuery, useLazyLisKA2AtAgentsQuery } from "@/redux/features/ka2a/ka2aApiSlice";

type AgentCard = Record<string, unknown>;

const asString = (value: unknown): string => (typeof value === "string" ? value : "");

const cardName = (card: AgentCard) => asString(card.name) || asString(card.id) || "agent";

const cardDescription = (card: AgentCard) =>
  asString(card.description) || asString(card.summary) || "No description available yet.";

const formatTimestamp = (value?: string) => {
  if (!value) {
    return "n/a";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

export default function AgentsPage() {
  const dispatch = useAppDispatch();
  const sessions = useAppSelector((state) => state.ka2a.sessions);
  const activeSessionId = useAppSelector((state) => state.ka2a.activeSessionId);
  const activeSession = activeSessionId ? sessions[activeSessionId] : undefined;
  const [copiedBundle, setCopiedBundle] = useState(false);
  const [copiedEventId, setCopiedEventId] = useState<string | null>(null);
  const [showSessionSettings, setShowSessionSettings] = useState(false);
  const [showAgentCards, setShowAgentCards] = useState(false);

  const { data: gatewayHealth, isFetching: isCheckingGateway, refetch: refetchGateway } =
    useGetGatewayHealthQuery(undefined, {
      pollingInterval: 30000,
      refetchOnMountOrArgChange: true,
    });
  const [loadAgents, { data: agentCards = [], isFetching: isLoadingAgents }] = useLazyLisKA2AtAgentsQuery();

  useEffect(() => {
    if (!activeSessionId && !Object.keys(sessions).length) {
      dispatch(createSession());
    }
  }, [activeSessionId, dispatch, sessions]);

  useEffect(() => {
    void loadAgents();
  }, [loadAgents]);

  const sessionList = useMemo(() => Object.values(sessions), [sessions]);
  const totalEvents = sessionList.reduce((count, session) => count + session.eventLog.length, 0);
  const totalRuns = sessionList.reduce((count, session) => count + Object.keys(session.runs).length, 0);
  const recentEvents = useMemo(() => [...(activeSession?.eventLog ?? [])].reverse(), [activeSession?.eventLog]);
  const chatMessages = useMemo(
    () =>
      (activeSession?.messages ?? []).map((message) => ({
        id: message.id,
        role: message.role,
        content: message.content,
        timestamp: message.timestamp,
        structuredPayload: message.structuredPayload,
      })),
    [activeSession?.messages],
  );
  const activeAgentName = activeSession?.activeSpecialist || activeSession?.agentName || "host";
  const statusText = activeSession?.awaitingInput
    ? "Waiting for your answer to continue this task."
    : activeSession?.currentStatusText || undefined;
  const debugBundle = useMemo(() => {
    const transcript = (activeSession?.messages ?? []).map((message) => ({
      role: message.role,
      timestamp: message.timestamp,
      taskId: message.taskId ?? null,
      serverMessageId: message.serverMessageId ?? null,
      structuredPayload: message.structuredPayload ?? null,
      content: message.content,
    }));

    return {
      exportedAt: new Date().toISOString(),
      workspace: "intera_f:/agent",
      gateway: {
        status: gatewayHealth?.status ?? "unknown",
        isChecking: isCheckingGateway,
      },
      discovery: {
        isLoadingAgents,
        cards: agentCards,
      },
      activeSessionId: activeSessionId ?? null,
      activeSession: activeSession
        ? {
            sessionId: activeSession.sessionId,
            title: activeSession.title,
            agentName: activeSession.agentName,
            contextId: activeSession.contextId ?? null,
            historyLength: activeSession.historyLength,
            isStreaming: activeSession.isStreaming,
            lastTaskId: activeSession.lastTaskId ?? null,
            activeSpecialist: activeSession.activeSpecialist ?? null,
            currentTaskState: activeSession.currentTaskState ?? null,
            currentStatusText: activeSession.currentStatusText ?? null,
            awaitingInput: activeSession.awaitingInput,
            resumeTaskId: activeSession.resumeTaskId ?? null,
            error: activeSession.error ?? null,
            transcript,
            runs: activeSession.runs,
            eventLog: activeSession.eventLog,
          }
        : null,
      sessions: sessionList.map((session) => ({
        sessionId: session.sessionId,
        title: session.title,
        agentName: session.agentName,
        contextId: session.contextId ?? null,
        historyLength: session.historyLength,
        isStreaming: session.isStreaming,
        lastTaskId: session.lastTaskId ?? null,
        activeSpecialist: session.activeSpecialist ?? null,
        currentTaskState: session.currentTaskState ?? null,
        awaitingInput: session.awaitingInput,
        resumeTaskId: session.resumeTaskId ?? null,
        messageCount: session.messages.length,
        eventCount: session.eventLog.length,
        runCount: Object.keys(session.runs).length,
        error: session.error ?? null,
      })),
    };
  }, [
    activeSession,
    activeSessionId,
    agentCards,
    gatewayHealth?.status,
    isCheckingGateway,
    isLoadingAgents,
    sessionList,
  ]);

  const handleCreateSession = () => {
    dispatch(createSession());
  };

  const handleDeleteSession = (sessionId: string) => {
    dispatch(deleteSession(sessionId));
  };

  const handleClearSession = () => {
    if (!activeSession) {
      return;
    }
    dispatch(clearSession({ sessionId: activeSession.sessionId }));
  };

  const handleCopyEvent = async (eventId: string, payload: unknown) => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      setCopiedEventId(eventId);
      window.setTimeout(() => {
        setCopiedEventId((current) => (current === eventId ? null : current));
      }, 1600);
    } catch {
      setCopiedEventId(null);
    }
  };

  const handleCopyBundle = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(debugBundle, null, 2));
      setCopiedBundle(true);
      window.setTimeout(() => {
        setCopiedBundle(false);
      }, 1800);
    } catch {
      setCopiedBundle(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-5 px-2 pb-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-4xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-700">Agent Workspace</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">Intera AI orchestration</h1>
            <p className="mt-2 text-sm text-gray-600">Developer console for host orchestration, discovery, and raw task tracing.</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void handleCopyBundle()}
              className="inline-flex items-center rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-blue-300 hover:text-blue-700"
            >
              {copiedBundle ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
              {copiedBundle ? "Copied bundle" : "Copy debug bundle"}
            </button>
            <button
              type="button"
              onClick={() => {
                void refetchGateway();
                void loadAgents();
              }}
              className="inline-flex items-center rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-blue-300 hover:text-blue-700"
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Refresh
            </button>
            <button
              type="button"
              onClick={handleCreateSession}
              className="inline-flex items-center rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              New session
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-2.5 text-blue-700">
              <Server className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500">Gateway</p>
              <p className="mt-1 text-base font-semibold text-gray-900">
                {gatewayHealth?.status === "ok" ? "Online" : isCheckingGateway ? "Checking" : "Offline"}
              </p>
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-500">Session health</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700">
              <Bot className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500">Agents</p>
              <p className="mt-1 text-base font-semibold text-gray-900">{agentCards.length}</p>
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-500">Discovered cards</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-50 p-2.5 text-amber-700">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500">Sessions</p>
              <p className="mt-1 text-base font-semibold text-gray-900">{sessionList.length}</p>
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-500">Debug threads</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-violet-50 p-2.5 text-violet-700">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500">Trace</p>
              <p className="mt-1 text-base font-semibold text-gray-900">{totalEvents}</p>
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-500">{totalRuns} task runs</p>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(360px,0.8fr)]">
        <div className="flex min-h-[820px] min-w-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-5 py-3.5">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500">Conversation</p>
                  <h2 className="mt-1 text-xl font-semibold text-gray-900">Host agent console</h2>
                  <p className="mt-1 text-sm text-gray-600">Orchestrate specialists and inspect raw stream output.</p>
                </div>

                <div className="grid gap-2 text-xs text-gray-600 sm:grid-cols-3">
                  <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
                    <p className="font-semibold uppercase tracking-wide text-gray-500">Target</p>
                    <p className="mt-1 font-mono text-[11px] text-gray-900">{activeSession?.agentName || "host"}</p>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
                    <p className="font-semibold uppercase tracking-wide text-gray-500">Specialist</p>
                    <p className="mt-1 font-mono text-[11px] text-gray-900">{activeAgentName}</p>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
                    <p className="font-semibold uppercase tracking-wide text-gray-500">State</p>
                    <p className="mt-1 font-mono text-[11px] text-gray-900">
                      {activeSession?.currentTaskState || (activeSession?.isStreaming ? "working" : "idle")}
                    </p>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
                    <p className="font-semibold uppercase tracking-wide text-gray-500">Task</p>
                    <p className="mt-1 truncate font-mono text-[11px] text-gray-900">
                      {activeSession?.lastTaskId || "none"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 sm:col-span-2">
                    <p className="font-semibold uppercase tracking-wide text-gray-500">Context</p>
                    <p className="mt-1 truncate font-mono text-[11px] text-gray-900">
                      {activeSession?.contextId || "none"}
                    </p>
                  </div>
                </div>
              </div>

              {activeSession ? (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleClearSession}
                    className="inline-flex items-center rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:border-red-200 hover:text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Clear session
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          <div className="min-h-0 flex-1 bg-gray-50">
            {activeSession?.error ? (
              <div className="mx-5 mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {activeSession.error}
              </div>
            ) : null}

            {activeSession?.awaitingInput ? (
              <div className="mx-5 mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">Paused for user input</span>
                  {activeSession.resumeTaskId ? (
                    <span className="rounded-full bg-white px-2.5 py-1 font-mono text-[11px] text-amber-900">
                      resume {activeSession.resumeTaskId}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1">
                  Reply in the chat below and the same task will continue instead of starting a new one.
                </p>
              </div>
            ) : null}

            <div className="flex min-h-0 flex-1 flex-col">
              <AgentChat
                onClose={() => undefined}
                isFullScreen={false}
                toggleFullScreen={() => undefined}
                messages={chatMessages}
                onSend={(text) => {
                  if (!activeSession?.sessionId || activeSession.isStreaming) {
                    return;
                  }
                  void dispatch(sendStreamMessage({ text, sessionId: activeSession.sessionId }));
                }}
                isBusy={activeSession?.isStreaming ?? false}
                pendingCount={activeSession?.isStreaming ? 1 : 0}
                taskCount={Object.keys(activeSession?.runs ?? {}).length}
                eventCount={activeSession?.eventLog.length ?? 0}
                activeAgentName={activeAgentName}
                statusText={statusText}
                awaitingInput={activeSession?.awaitingInput ?? false}
                showHeader={false}
                showWindowControls={false}
              />
            </div>
          </div>
        </div>

        <div className="flex min-h-[420px] flex-col gap-4">
          <div className="flex min-h-[260px] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500">Sessions</p>
                  <h3 className="mt-1 text-lg font-semibold text-gray-900">Execution settings</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowSessionSettings((value) => !value)}
                    className="inline-flex items-center rounded-full border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:border-blue-300 hover:text-blue-700"
                  >
                    {showSessionSettings ? <ChevronDown className="mr-1.5 h-4 w-4" /> : <ChevronRight className="mr-1.5 h-4 w-4" />}
                    Config
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateSession}
                    className="inline-flex items-center rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-blue-300 hover:text-blue-700"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    New
                  </button>
                </div>
              </div>
            </div>

            {showSessionSettings ? (
              <div className="border-b border-gray-200 px-5 py-4">
                {activeSession ? (
                <div className="grid gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4 md:grid-cols-2">
                  <label className="grid gap-2 text-sm text-gray-600">
                    <span className="font-medium text-gray-700">Target agent</span>
                    <input
                      value={activeSession.agentName}
                      onChange={(event) =>
                        dispatch(
                          updateSessionConfig({
                            sessionId: activeSession.sessionId,
                            agentName: event.target.value.trim() || "host",
                          }),
                        )
                      }
                      className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-400"
                    />
                  </label>

                  <label className="grid gap-2 text-sm text-gray-600">
                    <span className="font-medium text-gray-700">History length</span>
                    <input
                      type="number"
                      min={0}
                      value={activeSession.historyLength}
                      onChange={(event) =>
                        dispatch(
                          updateSessionConfig({
                            sessionId: activeSession.sessionId,
                            historyLength: Number(event.target.value),
                          }),
                        )
                      }
                      className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-400"
                    />
                  </label>
                </div>
              ) : (
                <p className="text-sm text-gray-500">Create a session to start configuring agent execution.</p>
              )}
              </div>
            ) : null}

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              {!sessionList.length ? (
                <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">
                  No sessions yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {sessionList.map((session) => {
                    const isActive = session.sessionId === activeSessionId;
                    return (
                      <div
                        key={session.sessionId}
                        className={`rounded-2xl border p-3 transition ${
                          isActive ? "border-blue-200 bg-blue-50" : "border-gray-200 bg-gray-50"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <button
                            type="button"
                            onClick={() => dispatch(setActiveSession(session.sessionId))}
                            className="min-w-0 flex-1 text-left"
                          >
                            <p className="text-sm font-semibold text-gray-900">{session.title}</p>
                            <p className="mt-1 truncate font-mono text-[11px] text-gray-500">{session.sessionId}</p>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteSession(session.sessionId)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-transparent text-gray-400 transition hover:border-red-200 hover:bg-white hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2 text-xs">
                          <span className="rounded-full bg-white px-2.5 py-1 text-gray-600">
                            {session.messages.length} msgs
                          </span>
                          <span className="rounded-full bg-white px-2.5 py-1 text-gray-600">
                            {session.eventLog.length} events
                          </span>
                          {session.activeSpecialist ? (
                            <span className="rounded-full bg-white px-2.5 py-1 text-gray-600">
                              {session.activeSpecialist}
                            </span>
                          ) : null}
                          {session.awaitingInput ? (
                            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-amber-800">awaiting input</span>
                          ) : null}
                          {session.currentTaskState ? (
                            <span className="rounded-full bg-white px-2.5 py-1 text-gray-600">{session.currentTaskState}</span>
                          ) : null}
                          {session.isStreaming ? (
                            <span className="rounded-full bg-blue-100 px-2.5 py-1 text-blue-700">streaming</span>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="flex min-h-[120px] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500">Agents</p>
                  <h3 className="mt-1 text-lg font-semibold text-gray-900">Discovered cards</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAgentCards((value) => !value)}
                  className="inline-flex items-center rounded-full border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:border-blue-300 hover:text-blue-700"
                >
                  {showAgentCards ? <ChevronDown className="mr-1.5 h-4 w-4" /> : <ChevronRight className="mr-1.5 h-4 w-4" />}
                  {agentCards.length} cards
                </button>
              </div>
            </div>

            {showAgentCards ? (
              <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
                {agentCards.length ? (
                <div className="space-y-3">
                  {agentCards.map((card) => (
                    <div key={cardName(card)} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-gray-900">{cardName(card)}</p>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-600">live</span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-gray-600">{cardDescription(card)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">
                  No agent cards loaded yet.
                </div>
              )}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="flex h-[28rem] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm xl:h-[32rem]">
        <div className="border-b border-gray-200 px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-gray-100 p-3 text-gray-600">
                <Clock3 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500">Status Trace</p>
                <h3 className="mt-1 text-lg font-semibold text-gray-900">Task status and artifact updates</h3>
              </div>
            </div>
            <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-600">
              {recentEvents.length} events
            </span>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {recentEvents.length ? (
            <div className="space-y-3">
              {recentEvents.map((item) => (
                <div key={item.id} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <span className="text-sm font-semibold capitalize text-gray-900">{item.event.kind}</span>
                      <p className="mt-1 text-xs text-gray-500">{formatTimestamp(item.receivedAt)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleCopyEvent(item.id, item.event)}
                      className="inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:border-blue-300 hover:text-blue-700"
                    >
                      {copiedEventId === item.id ? (
                        <>
                          <Check className="mr-1.5 h-4 w-4" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="mr-1.5 h-4 w-4" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-words rounded-xl bg-white p-3 text-xs leading-5 text-gray-600">
                    {JSON.stringify(item.event, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">
              Task and artifact events will appear here once a stream starts.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
