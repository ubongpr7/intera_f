'use client';

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { getCookie } from "cookies-next";
import { readCookieValue } from "@/lib/authCookies";
import { getFrontendOrigin, setFrontendOriginHeader } from "@/lib/frontendOrigin";
import { persistAuthSession } from "@/redux/services/apiSlice";

type Workspace = {
  id: string;
  name: string;
  company_code?: string | null;
  can_use_agent: boolean;
};

const usersApi = (process.env.NEXT_PUBLIC_BACKEND_HOST_URL || "http://localhost:7001").replace(/\/+$/, "");

const authHeaders = (includeJson = false) => {
  const headers = new Headers({ Accept: "application/json" });
  const accessToken = readCookieValue("accessToken", (name) => getCookie(name));
  const authorizationContext = readCookieValue("authorizationContext", (name) => getCookie(name));
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  if (authorizationContext) headers.set("X-Intera-Authorization-Context", authorizationContext);
  if (includeJson) headers.set("Content-Type", "application/json");
  setFrontendOriginHeader(headers);
  return headers;
};

const refreshBrowserSession = async () => {
  const refreshToken = readCookieValue("refreshToken", (name) => getCookie(name));
  if (!refreshToken) return false;
  const response = await fetch(`${usersApi}/auth/refresh/`, {
    method: "POST",
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(getFrontendOrigin() ? { "X-Intera-Frontend-Origin": getFrontendOrigin() } : {}),
    },
    body: JSON.stringify({ refresh: refreshToken }),
  });
  if (!response.ok) return false;
  const payload = await response.json().catch(() => ({}));
  if (!payload.access) return false;
  persistAuthSession(payload);
  return true;
};

const fetchWithBrowserAuth = async (url: string, init: RequestInit = {}) => {
  const response = await fetch(url, {
    ...init,
    credentials: "include",
    headers: authHeaders(Boolean(init.body)),
  });
  if (response.status !== 401 || !(await refreshBrowserSession())) return response;
  return fetch(url, {
    ...init,
    credentials: "include",
    headers: authHeaders(Boolean(init.body)),
  });
};

export default function McpConnectPage() {
  const searchParams = useSearchParams();
  const requestId = searchParams.get("request_id") || "";
  const preferredProfileId = searchParams.get("profile_id") || "";
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [requiresLogin, setRequiresLogin] = useState(false);
  const [error, setError] = useState("");

  const loginUrl = useMemo(() => {
    if (typeof window === "undefined") return "/accounts";
    const next = `${window.location.pathname}${window.location.search}`;
    return `/accounts?next=${encodeURIComponent(next)}`;
  }, []);

  useEffect(() => {
    if (!requestId) {
      setError("This connection link is missing its request ID.");
      setLoading(false);
      return;
    }
    let cancelled = false;
    fetchWithBrowserAuth(`${usersApi}/auth/mcp/connect/workspaces/?request_id=${encodeURIComponent(requestId)}`)
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (response.status === 401) {
          if (!cancelled) setRequiresLogin(true);
          return;
        }
        if (!response.ok) throw new Error(payload.detail || "Unable to load your workspaces.");
        if (!cancelled) {
          const nextWorkspaces = Array.isArray(payload.workspaces) ? payload.workspaces : [];
          setWorkspaces(nextWorkspaces);
          const preferred = nextWorkspaces.find((workspace: Workspace) => workspace.id === preferredProfileId);
          if (preferred) {
            setSelectedId(preferred.id);
            if (!preferred.can_use_agent) {
              setError("AI access is not granted for the requested workspace. Choose another workspace or update its permissions.");
            }
          } else if (preferredProfileId) {
            setError("The requested workspace is not accessible to this account.");
          } else if (nextWorkspaces.length === 1) {
            setSelectedId(nextWorkspaces[0].id);
          }
        }
      })
      .catch((reason) => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : "Unable to load your workspaces.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [preferredProfileId, requestId]);

  const selected = workspaces.find((workspace) => workspace.id === selectedId);

  async function approve() {
    if (!selected || !selected.can_use_agent) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetchWithBrowserAuth(`${usersApi}/auth/mcp/connect/approve/`, {
        method: "POST",
        body: JSON.stringify({ request_id: requestId, profile_id: selected.id }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.detail || "Intera AI access could not be granted.");
      window.location.assign(payload.redirect_uri);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Intera AI access could not be granted.");
      setBusy(false);
    }
  }

  return (
    <main
      className="relative min-h-screen overflow-hidden bg-[#07111f] px-5 py-8 text-slate-100 sm:px-8 sm:py-14"
      aria-labelledby="mcp-connect-title"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(45,212,191,0.18),transparent_34%),radial-gradient(circle_at_90%_85%,rgba(59,130,246,0.2),transparent_38%)]" />
      <div className="relative mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between gap-4 px-1">
          <Image
            src="/assets/img/logos/verticals/no-bg/INTERA-PRIMARY-LOGO-VERTICAL-WHITE-4.png"
            alt="Intera IMS"
            width={220}
            height={66}
            priority
            className="h-10 w-auto object-contain object-left sm:h-12"
          />
          <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-200">
            Secure connection
          </span>
        </div>
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.07] p-6 shadow-[0_24px_90px_rgba(0,0,0,0.32)] backdrop-blur-xl sm:p-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-300 to-blue-500 text-xl font-black text-[#07111f] shadow-lg shadow-blue-500/20">I</div>
          <p className="mt-7 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">Intera AI access</p>
          <h1 id="mcp-connect-title" className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Connect your workspace</h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300">
            Choose the workspace this terminal or AI assistant may use. Your existing Intera permissions still apply, and you can revoke access from your account settings.
          </p>

        {loading ? <p className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-300" role="status" aria-live="polite">Checking your Intera account…</p> : null}
        {requiresLogin ? (
            <a className="mt-8 inline-flex rounded-xl bg-gradient-to-r from-emerald-300 to-blue-400 px-5 py-3 text-sm font-semibold text-[#07111f] shadow-lg shadow-blue-500/20 transition hover:brightness-110" href={loginUrl} aria-describedby="mcp-connect-error">
            Sign in to continue
          </a>
        ) : null}
        {!loading && !requiresLogin && !error && workspaces.length === 0 ? (
          <p className="mt-8 rounded-xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm text-amber-100">
            No accessible workspaces were found.
          </p>
        ) : null}
        {!loading && !requiresLogin && workspaces.length > 0 ? (
          <div className="mt-8 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Available workspaces</p>
            {workspaces.map((workspace) => (
              <button
                key={workspace.id}
                type="button"
                onClick={() => setSelectedId(workspace.id)}
                aria-pressed={selectedId === workspace.id}
                aria-label={`${workspace.name}${workspace.can_use_agent ? " — AI enabled" : " — permission needed"}`}
                className={`w-full rounded-2xl border p-4 text-left transition ${selectedId === workspace.id ? "border-emerald-300 bg-emerald-300/10 shadow-lg shadow-emerald-950/20" : "border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.06]"}`}
              >
                <span className="flex items-center justify-between gap-3">
                  <span className="block font-semibold">{workspace.name}</span>
                  <span className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${workspace.can_use_agent ? "bg-emerald-300/15 text-emerald-200" : "bg-amber-300/15 text-amber-200"}`}>
                    {workspace.can_use_agent ? "AI enabled" : "Permission needed"}
                  </span>
                </span>
                <span className="mt-1 block text-xs text-slate-400">
                  {workspace.can_use_agent ? "AI access available" : "AI access not granted"}
                </span>
              </button>
            ))}
            <button
              type="button"
              disabled={!selected?.can_use_agent || busy}
              onClick={approve}
              aria-busy={busy}
              className="mt-4 w-full rounded-2xl bg-gradient-to-r from-emerald-300 to-blue-400 px-5 py-4 text-sm font-semibold text-[#07111f] shadow-lg shadow-blue-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? "Connecting…" : "Allow AI access"}
            </button>
          </div>
        ) : null}
        {error ? <p id="mcp-connect-error" className="mt-6 rounded-xl border border-red-300/20 bg-red-300/10 p-4 text-sm text-red-100" role="alert">{error}</p> : null}
          <p className="mt-8 border-t border-white/10 pt-5 text-xs leading-5 text-slate-500">You are authorizing an AI client to use Intera tools within the selected workspace. This page will return you to the terminal after approval.</p>
        </div>
      </div>
    </main>
  );
}
