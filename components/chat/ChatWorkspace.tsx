"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { getCookie } from "cookies-next"
import { AlertCircle, Check, Headphones, Loader2, Mic, Paperclip, Plus, Search, Send, Sparkles, Square, Users, Wifi, WifiOff, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { readCookieValue } from "@/lib/authCookies"
import { chatBackendUrl } from "@/redux/services/apiSlice"
import { useLazySearchUsersQuery, useGetCompanyUsersQuery } from "@/redux/features/users/userApiSlice"
import { useGetUserCompaniesQuery, useSwitchCompanyMutation } from "@/redux/features/auth/authApiSlice"
import {
  useCreateChatConversationMutation,
  useCreateChatMessageMutation,
  useListChatConversationsQuery,
  useListChatMessagesQuery,
  useSupportAssistMutation,
  useRequestSupportAgentMutation,
  useUploadChatAttachmentMutation,
} from "@/redux/features/chat/chatApiSlice"
import type { ChatConversation, ChatMessage } from "@/redux/features/chat/chatTypes"

const toWebSocketUrl = (baseUrl: string) => baseUrl.replace(/^http/i, "ws").replace(/\/$/, "")

const formatTime = (value: string) =>
  new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

const formatRelativeTime = (value?: string | null) => {
  if (!value) return ""
  const minutes = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60000))
  if (minutes < 1) return "now"
  if (minutes < 60) return `${minutes}m`
  if (minutes < 1440) return `${Math.round(minutes / 60)}h`
  return new Date(value).toLocaleDateString([], { month: "short", day: "numeric" })
}

const buildInitials = (value: string) => value.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase() || "").join("") || "?"

const conversationPreview = (conversation: ChatConversation) => {
  const latest = conversation.latest_message
  if (!latest) return "No messages yet"
  if (latest.body) return latest.body
  if (latest.attachments?.length) return latest.attachments.length === 1 ? "Attachment" : `${latest.attachments.length} attachments`
  return "New message"
}

const conversationName = (conversation: ChatConversation) => {
  if (conversation.kind === "support") return "Intera IMS Support"
  if (conversation.title) return conversation.title
  const participant = conversation.participants.find((item) => item.is_active && item.user_id !== readCookieValue("userID", getCookie))
  return participant?.display_name || "Workspace conversation"
}

const participantName = (conversation: ChatConversation | undefined, userId: string) => {
  const participant = conversation?.participants.find((item) => item.user_id === userId)
  return participant?.display_name || "Teammate"
}

const isImageAttachment = (attachment: ChatMessage["attachments"][number], message: ChatMessage) =>
  attachment.content_type?.startsWith("image/") || message.kind === "image"

const isAudioAttachment = (attachment: ChatMessage["attachments"][number], message: ChatMessage) =>
  attachment.content_type?.startsWith("audio/") || message.kind === "voice"

const formatFileSize = (bytes: number) => {
  if (!bytes) return "Attachment"
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const mergeMessage = (messages: ChatMessage[], incoming: ChatMessage) => {
  if (messages.some((item) => item.id === incoming.id)) return messages
  return [...messages, incoming].sort((a, b) => a.message_seq - b.message_seq)
}

const MAX_ATTACHMENT_BYTES = 15 * 1024 * 1024

export default function ChatWorkspace() {
  const userId = readCookieValue("userID", getCookie) || ""
  const workspaceId = readCookieValue("profileId", getCookie) || undefined
  const accessToken = readCookieValue("accessToken", getCookie)
  const [selectedId, setSelectedId] = useState<string>()
  const [supportMode, setSupportMode] = useState(false)
  const [draft, setDraft] = useState("")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [participantId, setParticipantId] = useState("")
  const [participantSearch, setParticipantSearch] = useState("")
  const [conversationSearch, setConversationSearch] = useState("")
  const [showNewChat, setShowNewChat] = useState(false)
  const [recording, setRecording] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "reconnecting" | "offline">("offline")
  const [actionError, setActionError] = useState<string | null>(null)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const { data: conversations = [], isLoading: conversationsLoading, refetch: refetchConversations } = useListChatConversationsQuery()
  const { data: companyMemberships } = useGetUserCompaniesQuery()
  const { data: companyUsers = [] } = useGetCompanyUsersQuery()
  const [switchCompany, { isLoading: switchingWorkspace }] = useSwitchCompanyMutation()
  const selectedConversation = conversations.find((item) => item.id === selectedId)
  const conversationWorkspace = selectedConversation?.context_workspace_id
    ? companyMemberships?.profiles?.find((profile) => `${profile.id}` === `${selectedConversation.context_workspace_id}`)
    : undefined
  const isConversationOutsideActiveWorkspace = Boolean(
    selectedConversation?.context_workspace_id &&
      workspaceId &&
      `${selectedConversation.context_workspace_id}` !== `${workspaceId}`,
  )
  const humanSupportActive = Boolean(
    supportMode && selectedConversation?.participants.some((participant) => participant.is_active && participant.role === "support_agent"),
  )
  const supportTextOnly = supportMode && !humanSupportActive
  const { data: loadedMessages = [], isFetching: messagesLoading } = useListChatMessagesQuery(selectedId || "", {
    skip: !selectedId,
  })
  const [createConversation, { isLoading: creatingConversation }] = useCreateChatConversationMutation()
  const [createMessage, { isLoading: sendingMessage }] = useCreateChatMessageMutation()
  const [uploadAttachment, { isLoading: uploadingAttachment }] = useUploadChatAttachmentMutation()
  const [supportAssist, { isLoading: askingSupport }] = useSupportAssistMutation()
  const [requestSupportAgent, { isLoading: requestingSupportAgent }] = useRequestSupportAgentMutation()
  const [searchUsers, { data: userSearchResults = [], isFetching: searchingUsers }] = useLazySearchUsersQuery()

  useEffect(() => {
    if (selectedId) setMessages(loadedMessages)
  }, [loadedMessages, selectedId])

  useEffect(() => {
    if (!selectedId && conversations[0]) setSelectedId(conversations[0].id)
  }, [conversations, selectedId])

  useEffect(() => {
    if (!selectedId || !accessToken) return
    let disposed = false
    let socket: WebSocket | null = null
    let attempt = 0

    const connect = () => {
      if (disposed) return
      setConnectionStatus(attempt === 0 ? "connecting" : "reconnecting")
      socket = new WebSocket(`${toWebSocketUrl(chatBackendUrl)}/ws/conversations/${selectedId}?token=${encodeURIComponent(accessToken)}`)
      socket.onopen = () => {
        attempt = 0
        setConnectionStatus("connected")
      }
      socket.onmessage = (event) => {
        try {
          const envelope = JSON.parse(event.data) as { type?: string; data?: ChatMessage | { message?: ChatMessage } }
          const incoming = envelope.type === "support.assist.completed"
            ? (envelope.data as { message?: ChatMessage } | undefined)?.message
            : envelope.data as ChatMessage | undefined
          if ((envelope.type === "message.created" || envelope.type === "support.assist.completed") && incoming?.id) {
            setMessages((current) => mergeMessage(current, incoming))
          }
        } catch {
          // Ignore malformed realtime frames; the REST query remains authoritative.
        }
      }
      socket.onclose = () => {
        if (disposed) return
        setConnectionStatus("reconnecting")
        const delay = Math.min(1000 * (2 ** attempt), 15000)
        attempt += 1
        reconnectTimerRef.current = setTimeout(connect, delay)
      }
      socket.onerror = () => setConnectionStatus("reconnecting")
    }

    connect()
    return () => {
      disposed = true
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
      socket?.close()
      setConnectionStatus("offline")
    }
  }, [accessToken, selectedId])

  useEffect(() => {
    const query = participantSearch.trim()
    if (query.length < 2) return
    const timer = setTimeout(() => void searchUsers(query), 300)
    return () => clearTimeout(timer)
  }, [participantSearch, searchUsers])

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current?.state === "recording") mediaRecorderRef.current.stop()
    }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const supportConversation = conversations.find((conversation) => conversation.kind === "support" && conversation.status === "active" && conversation.support_status !== "resolved")

  const teammates = companyUsers
    .map((assignment) => assignment.user)
    .filter((user): user is NonNullable<typeof user> => Boolean(user && `${user.id}` !== `${userId}`))
    .filter((user, index, all) => all.findIndex((candidate) => `${candidate.id}` === `${user.id}`) === index)
    .filter((user) => {
      const query = participantSearch.trim().toLowerCase()
      if (!query) return true
      const name = `${user.first_name || ""} ${user.last_name || ""}`.trim().toLowerCase()
      return name.includes(query) || `${user.email || ""}`.toLowerCase().includes(query)
    })
  const teammateIds = new Set(teammates.map((user) => `${user.id}`))
  const searchedTeammates = userSearchResults.filter((user) => teammateIds.has(`${user.id}`))
  const filteredConversations = useMemo(() => {
    const query = conversationSearch.trim().toLowerCase()
    if (!query) return conversations
    return conversations.filter((conversation) => `${conversationName(conversation)} ${conversationPreview(conversation)}`.toLowerCase().includes(query))
  }, [conversationSearch, conversations])

  const openSupport = () => {
    setSupportMode(true)
    if (supportConversation) setSelectedId(supportConversation.id)
    else setSelectedId(undefined)
    setMessages([])
  }

  const selectConversation = (conversation: ChatConversation) => {
    setSupportMode(conversation.kind === "support")
    setSelectedId(conversation.id)
  }

  const sendText = async () => {
    const body = draft.trim()
    if (!body || sendingMessage || askingSupport) return
    setDraft("")
    try {
      if (supportTextOnly) {
        const response = await supportAssist({ conversation_id: selectedId, body }).unwrap()
        setSelectedId(response.conversation_id)
        setMessages((current) => mergeMessage(mergeMessage(current, response.user_message), response.assistant_message))
        await refetchConversations()
        return
      }
      if (!selectedId) return
      const response = await createMessage({ conversationId: selectedId, body, workspace_id: workspaceId }).unwrap()
      setMessages((current) => mergeMessage(current, response))
    } catch {
      setDraft(body)
      setActionError("Your message could not be sent. Check the connection and try again.")
    }
  }

  const requestHumanAgent = async () => {
    if (!selectedId || requestingSupportAgent) return
    try {
      await requestSupportAgent(selectedId).unwrap()
      setActionError("Your request is in the support queue. A support agent will join shortly.")
      await refetchConversations()
    } catch {
      setActionError("The support handoff could not be requested. Please try again.")
    }
  }

  const sendFile = async (file: File, kind?: "voice" | "file") => {
    if (supportTextOnly || !selectedId || uploadingAttachment) {
      if (supportTextOnly) setActionError("Support AI accepts text messages only. File and voice sharing becomes available after human handoff.")
      return
    }
    if (file.size > MAX_ATTACHMENT_BYTES) {
      setActionError("That file is larger than the 15 MB limit.")
      return
    }
    try {
      const response = await uploadAttachment({ conversationId: selectedId, file }).unwrap()
      const message = await createMessage({
        conversationId: selectedId,
        kind: kind || (file.type.startsWith("image/") ? "image" : "file"),
        attachment_ids: [response.attachment.id],
        workspace_id: workspaceId,
      }).unwrap()
      setMessages((current) => mergeMessage(current, message))
    } catch {
      setActionError("The attachment could not be uploaded. Please try again.")
    }
  }

  const toggleRecording = async () => {
    if (supportTextOnly) {
      setActionError("Support AI accepts text messages only. Voice notes become available after human handoff.")
      return
    }
    if (recording && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      setRecording(false)
      return
    }
    if (!selectedId) return
    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      setActionError("Microphone access is required to record a voice note.")
      return
    }
    const recorder = new MediaRecorder(stream)
    chunksRef.current = []
    recorder.ondataavailable = (event) => chunksRef.current.push(event.data)
    recorder.onstop = async () => {
      stream.getTracks().forEach((track) => track.stop())
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" })
      await sendFile(new File([blob], `voice-note-${Date.now()}.webm`, { type: blob.type }), "voice")
    }
    mediaRecorderRef.current = recorder
    recorder.start()
    setRecording(true)
  }

  const createDirectChat = async () => {
    const target = participantId.trim()
    if (!target) return
    try {
      const conversation = await createConversation({
        kind: "direct",
        context_workspace_id: workspaceId,
        context_label: "Workspace chat",
        participants: [{ user_id: target }],
      }).unwrap()
      setParticipantId("")
      setParticipantSearch("")
      setShowNewChat(false)
      setSupportMode(false)
      setSelectedId(conversation.id)
      await refetchConversations()
    } catch {
      setActionError("The conversation could not be created. Confirm that this teammate is available to chat.")
    }
  }

  const switchToConversationWorkspace = async () => {
    if (!conversationWorkspace?.company_code || switchingWorkspace) return
    try {
      await switchCompany({ company_code: conversationWorkspace.company_code }).unwrap()
      window.location.reload()
    } catch {
      setActionError("This workspace could not be opened. Please try again.")
    }
  }

  return (
    <main className="chat-workspace mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-[1500px] flex-col gap-5 p-4 md:p-7">
      <header className="relative overflow-hidden rounded-[2rem] bg-[#091321] px-6 py-7 text-white shadow-[0_24px_70px_-38px_rgba(9,19,33,.9)] md:px-9">
        <div className="absolute -right-12 -top-20 h-64 w-64 rounded-full bg-[#98fcc2]/10 blur-2xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-5">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#98fcc2]/30 bg-[#98fcc2]/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-[#98fcc2]">
              <Sparkles className="h-3.5 w-3.5" /> Connected support
            </div>
            <h1 className="text-3xl font-black tracking-tight md:text-5xl">Conversations that keep work moving.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 md:text-base">Chat with your workspace team, attach files and voice notes, or start a text conversation with Intera IMS support.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs text-slate-200">
              {connectionStatus === "connected" ? <Wifi className="h-3.5 w-3.5 text-[#98fcc2]" /> : <WifiOff className="h-3.5 w-3.5 text-amber-300" />}
              {connectionStatus === "connected" ? "Live" : connectionStatus === "reconnecting" ? "Reconnecting" : connectionStatus === "connecting" ? "Connecting" : "Offline"}
            </span>
            <Button variant="secondary" onClick={() => setShowNewChat((value) => !value)}><Plus className="h-4 w-4" /> New chat</Button>
          </div>
        </div>
      </header>

      {actionError ? (
        <div role="alert" className="flex items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span className="flex items-center gap-2"><AlertCircle className="h-4 w-4 shrink-0" />{actionError}</span>
          <button type="button" onClick={() => setActionError(null)} aria-label="Dismiss error"><X className="h-4 w-4" /></button>
        </div>
      ) : null}

      {showNewChat ? (
        <Card className="border-blue-200 bg-blue-50/70 dark:border-slate-700 dark:bg-slate-900">
          <CardContent className="space-y-4 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><p className="text-sm font-bold text-slate-900 dark:text-white">Start a conversation</p><p className="text-xs text-slate-500 dark:text-slate-400">Choose AI support or a teammate in this workspace.</p></div>
              <Button variant="outline" onClick={openSupport}><Sparkles className="h-4 w-4" /> Start AI support</Button>
            </div>
            <div className="relative min-w-[260px] text-sm font-semibold text-slate-700 dark:text-slate-200">
              <label htmlFor="chat-teammate-search">Find a teammate</label>
              <div className="relative mt-2">
                <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input id="chat-teammate-search" value={participantSearch} onChange={(event) => { setParticipantSearch(event.target.value); setParticipantId("") }} placeholder="Search by name or email" className="h-11 w-full rounded-xl border border-blue-200 bg-white pl-9 pr-3 text-slate-900 outline-none focus:ring-2 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {teammates.slice(0, 9).map((user) => {
                  const name = `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.email || "Teammate"
                  return <button key={user.id} type="button" onClick={() => { setParticipantId(String(user.id)); setParticipantSearch(name) }} className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left text-sm transition ${participantId === String(user.id) ? "border-blue-500 bg-blue-100 dark:bg-blue-950/50" : "border-slate-200 bg-white hover:border-blue-300 dark:border-slate-700 dark:bg-slate-950"}`}><span className="min-w-0"><span className="block truncate font-semibold text-slate-800 dark:text-slate-100">{name}</span><span className="block truncate text-xs text-slate-500">{user.email}</span></span><Users className="h-4 w-4 shrink-0 text-slate-400" /></button>
                })}
              </div>
              {participantSearch.trim().length >= 2 && !participantId && searchedTeammates.length ? (
                <div className="mt-2 overflow-hidden rounded-xl border border-blue-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-950">
                  {searchingUsers ? <p className="flex items-center gap-2 p-3 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Searching...</p> : searchedTeammates.slice(0, 6).map((user) => {
                    const name = user.get_full_name || `${user.first_name} ${user.last_name}`.trim() || user.email
                    return <button key={user.id} type="button" onClick={() => { setParticipantId(String(user.id)); setParticipantSearch(name) }} className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-blue-50 dark:hover:bg-slate-800"><span className="font-semibold text-slate-800 dark:text-slate-100">{name}</span><span className="truncate text-xs text-slate-500">{user.email}</span></button>
                  })}
                </div>
              ) : null}
              {participantId ? <p className="mt-1 flex items-center gap-1 text-xs text-emerald-700"><Check className="h-3 w-3" /> Teammate selected</p> : null}
            </div>
            {!teammates.length && !searchingUsers ? <p className="text-sm text-amber-700 dark:text-amber-300">No active teammates are available in this workspace yet.</p> : null}
            <Button onClick={createDirectChat} disabled={!participantId || creatingConversation}>{creatingConversation ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Start conversation</Button>
          </CardContent>
        </Card>
      ) : null}

      <section className="grid min-h-[620px] flex-1 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_24px_80px_-52px_rgba(15,23,42,.55)] dark:border-slate-800 dark:bg-slate-950 lg:grid-cols-[320px_1fr]">
        <aside className="border-b border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/60 lg:border-b-0 lg:border-r">
          <button type="button" onClick={openSupport} className={`mb-4 flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition ${supportMode ? "border-[#3c83f7] bg-blue-50 dark:bg-blue-950/40" : "border-slate-200 bg-white hover:border-blue-300 dark:border-slate-800 dark:bg-slate-950"}`}>
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#091321] text-[#98fcc2]"><Headphones className="h-5 w-5" /></span>
            <span><span className="block font-bold text-slate-900 dark:text-white">Intera IMS Support</span><span className="block text-xs text-slate-500">Text support with AI assistance</span></span>
          </button>
          <div className="mb-3 flex items-center justify-between px-1"><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Your conversations</p><Users className="h-4 w-4 text-slate-400" /></div>
          <label className="mb-3 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-950"><Search className="h-4 w-4 shrink-0 text-slate-400" /><input value={conversationSearch} onChange={(event) => setConversationSearch(event.target.value)} placeholder="Search conversations" className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white" /></label>
          <div className="space-y-2 overflow-y-auto lg:max-h-[500px]">
            {conversationsLoading ? <p className="p-3 text-sm text-slate-500">Loading conversations...</p> : null}
            {filteredConversations.map((conversation) => (
              <button key={conversation.id} type="button" onClick={() => selectConversation(conversation)} className={`w-full rounded-2xl border p-3 text-left transition ${selectedId === conversation.id && !supportMode ? "border-blue-400 bg-blue-50 dark:bg-blue-950/40" : "border-transparent hover:border-slate-200 hover:bg-white dark:hover:border-slate-700 dark:hover:bg-slate-950"}`}>
                <div className="flex items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-200">{buildInitials(conversationName(conversation))}</span><span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-2"><span className="truncate font-semibold text-slate-900 dark:text-white">{conversationName(conversation)}</span>{conversation.latest_message ? <span className="shrink-0 text-[11px] text-slate-400">{formatRelativeTime(conversation.latest_message.created_at)}</span> : null}</span><span className="mt-1 block truncate text-xs text-slate-500 dark:text-slate-400">{conversationPreview(conversation)}</span></span></div>
              </button>
            ))}
            {!conversationsLoading && !filteredConversations.length ? <p className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm leading-6 text-slate-500 dark:border-slate-700 dark:text-slate-400">{conversationSearch ? "No conversations match that search." : "No conversations yet. Start with support or create a direct chat."}</p> : null}
          </div>
        </aside>

        <div className="flex min-h-[620px] min-w-0 flex-col">
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800 md:px-7">
            <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">{supportMode ? "Support centre" : "Workspace chat"}</p><h2 className="mt-1 truncate text-xl font-black text-slate-900 dark:text-white">{supportMode ? "How can we help?" : selectedConversation ? conversationName(selectedConversation) : "Select a conversation"}</h2></div>
            {supportMode && supportTextOnly && selectedId ? <Button variant="outline" size="sm" onClick={() => void requestHumanAgent()} disabled={requestingSupportAgent}>{requestingSupportAgent ? <Loader2 className="h-4 w-4 animate-spin" /> : <Headphones className="h-4 w-4" />} Request a human agent</Button> : null}
          </div>

          {isConversationOutsideActiveWorkspace ? (
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-200 bg-amber-50 px-5 py-3 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100 md:px-7">
              <span>This conversation belongs to {conversationWorkspace?.name || "another workspace"}. Switch workspace to reply.</span>
              <Button size="sm" variant="outline" onClick={() => void switchToConversationWorkspace()} disabled={!conversationWorkspace || switchingWorkspace}>
                {switchingWorkspace ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Switch workspace
              </Button>
            </div>
          ) : null}

          <div className="flex-1 space-y-4 overflow-y-auto bg-[radial-gradient(circle_at_top_right,rgba(60,131,247,.08),transparent_35%),#f8fbff] p-5 dark:bg-[radial-gradient(circle_at_top_right,rgba(152,252,194,.08),transparent_35%),#0b1220] md:p-7">
            {supportTextOnly && messages.length === 0 ? <div className="mx-auto mt-12 max-w-md text-center"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-[#091321] text-[#98fcc2]"><Sparkles className="h-7 w-7" /></div><h3 className="mt-5 text-2xl font-black text-slate-900 dark:text-white">Start with a question</h3><p className="mt-2 text-sm leading-6 text-slate-500">Support AI accepts text questions. File and voice sharing will be available after a human agent takes over.</p></div> : null}
            {messagesLoading ? <p className="text-sm text-slate-500">Loading messages...</p> : null}
            {messages.map((message) => {
              const mine = message.sender_user_id === userId
              return <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}><div className={`max-w-[min(720px,88%)] rounded-3xl px-4 py-3 shadow-sm ${mine ? "rounded-br-md bg-[#3c83f7] text-white" : "rounded-bl-md border border-slate-200 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"}`}><div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide opacity-70"><span>{mine ? "You" : message.sender_role === "support_ai" ? "Support AI" : participantName(selectedConversation, message.sender_user_id)}</span><span>·</span><span>{formatTime(message.created_at)}</span></div>{message.body ? <p className="mt-1 whitespace-pre-wrap text-sm leading-6">{message.body}</p> : null}{message.attachments?.length ? <div className="mt-3 space-y-2">{message.attachments.map((attachment) => isImageAttachment(attachment, message) && attachment.access_url ? <img key={attachment.id} src={attachment.access_url} alt={attachment.original_filename} className="max-h-80 w-full rounded-2xl object-contain" /> : isAudioAttachment(attachment, message) && attachment.access_url ? <div key={attachment.id} className="rounded-2xl border border-current/10 bg-black/10 p-3"><div className="mb-2 flex items-center justify-between gap-2 text-xs opacity-80"><span className="truncate">{attachment.original_filename}</span><span>{formatFileSize(attachment.size_bytes)}</span></div><audio controls preload="metadata" src={attachment.access_url} className="w-full" /></div> : <a key={attachment.id} href={attachment.access_url || "#"} download={attachment.original_filename} className="flex items-center gap-3 rounded-2xl border border-current/10 bg-black/10 px-3 py-3 text-xs underline"><span className="truncate">{attachment.original_filename}</span><span className="shrink-0 opacity-70">{formatFileSize(attachment.size_bytes)}</span></a>)}</div> : null}</div></div>
            })}
            <div ref={bottomRef} />
          </div>

          <div className="border-t border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950 md:p-5">
            <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 dark:border-slate-800 dark:bg-slate-900">
              <label className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-white hover:text-blue-600 dark:hover:bg-slate-800 ${supportTextOnly || uploadingAttachment ? "cursor-not-allowed opacity-40" : "cursor-pointer"}`} title={supportTextOnly ? "Available after human handoff" : "Attach a file"}><Paperclip className="h-5 w-5" /><input type="file" className="hidden" disabled={supportTextOnly || uploadingAttachment} onChange={(event) => { const file = event.target.files?.[0]; if (file) void sendFile(file); event.currentTarget.value = "" }} /></label>
              <button type="button" onClick={() => void toggleRecording()} disabled={supportTextOnly || !selectedId || uploadingAttachment} className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${recording ? "bg-red-100 text-red-600" : "text-slate-500 hover:bg-white hover:text-blue-600 dark:hover:bg-slate-800"}`} aria-label={recording ? "Stop voice note" : supportTextOnly ? "Available after human handoff" : "Record voice note"}>{recording ? <Square className="h-4 w-4" /> : <Mic className="h-5 w-5" />}</button>
              <textarea value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void sendText() } }} placeholder={supportTextOnly ? "Ask support anything..." : "Write a message..."} rows={1} className="max-h-32 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-slate-400" />
              <Button size="icon" onClick={() => void sendText()} disabled={isConversationOutsideActiveWorkspace || !draft.trim() || sendingMessage || askingSupport || uploadingAttachment} aria-label="Send message">{sendingMessage || askingSupport || uploadingAttachment ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</Button>
            </div>
            <p className="mt-2 px-1 text-[11px] text-slate-400">Enter to send · Shift + Enter for a new line · {supportTextOnly ? "Support AI accepts text only" : "Files up to 15 MB and voice notes are available"}</p>
          </div>
        </div>
      </section>
    </main>
  )
}
