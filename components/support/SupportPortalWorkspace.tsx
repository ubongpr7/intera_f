"use client"

import { useEffect, useRef, useState } from "react"
import { getCookie } from "cookies-next"
import { Headphones, Loader2, MessageSquare, Mic, Paperclip, Send, ShieldAlert, Square, UserCheck, Wifi, WifiOff } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { chatBackendUrl } from "@/redux/services/apiSlice"
import {
  useClaimSupportConversationMutation,
  useCreateChatMessageMutation,
  useListChatMessagesQuery,
  useListSupportInboxQuery,
  useUploadChatAttachmentMutation,
} from "@/redux/features/chat/chatApiSlice"
import type { ChatConversation, ChatMessage } from "@/redux/features/chat/chatTypes"
import { readCookieValue } from "@/lib/authCookies"
import { getDecodedToken } from "@/lib/utils"
import AdminServiceHealth from "@/components/admin/AdminServiceHealth"

const toWebSocketUrl = (baseUrl: string) => baseUrl.replace(/^http/i, "ws").replace(/\/$/, "")

const isSupportClaim = () => {
  const token = getDecodedToken() as Record<string, unknown> | null
  return ["is_support", "is_support_agent", "is_staff", "is_superuser"].some((key) => {
    const value = token?.[key]
    return value === true || value === 1 || value === "1" || value === "true"
  }) || ["support_agent", "platform_staff", "superuser", "admin"].includes(String(token?.role ?? ""))
}

const mergeMessage = (messages: ChatMessage[], incoming: ChatMessage) => {
  if (messages.some((message) => message.id === incoming.id)) return messages
  return [...messages, incoming].sort((left, right) => left.message_seq - right.message_seq)
}

const MAX_ATTACHMENT_BYTES = 15 * 1024 * 1024

const displayName = (conversation: ChatConversation) => {
  const participants = Array.isArray(conversation?.participants) ? conversation.participants : []
  const customer = participants.find((participant) => participant.role !== "support_ai" && participant.user_id !== "support-ai")
  return customer?.display_name || customer?.email || "Support customer"
}

export default function SupportPortalWorkspace() {
  const accessToken = readCookieValue("accessToken", getCookie)
  const authenticated = Boolean(accessToken)
  const allowed = authenticated && isSupportClaim()
  const [selectedId, setSelectedId] = useState<string>()
  const [draft, setDraft] = useState("")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [connection, setConnection] = useState<"connected" | "connecting" | "offline">("offline")
  const [recording, setRecording] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const { data: inboxData, isLoading, refetch } = useListSupportInboxQuery(undefined, {
    skip: !allowed,
    pollingInterval: 5000,
  })
  const inbox = Array.isArray(inboxData) ? inboxData : []
  const selectedConversation = inbox.find((conversation) => conversation.id === selectedId)
  const { data: loadedMessagesData, isFetching: messagesLoading } = useListChatMessagesQuery(selectedId || "", {
    skip: !selectedId,
    pollingInterval: 5000,
  })
  const loadedMessages = Array.isArray(loadedMessagesData) ? loadedMessagesData : []
  const [claimConversation, { isLoading: claiming }] = useClaimSupportConversationMutation()
  const [createMessage, { isLoading: sending }] = useCreateChatMessageMutation()
  const [uploadAttachment, { isLoading: uploading }] = useUploadChatAttachmentMutation()

  useEffect(() => {
    if (!selectedId && inbox[0]) setSelectedId(inbox[0].id)
  }, [inbox, selectedId])

  useEffect(() => {
    setMessages(loadedMessages)
  }, [loadedMessages, selectedId])

  useEffect(() => {
    if (!selectedId || !accessToken) return
    let disposed = false
    const socket = new WebSocket(`${toWebSocketUrl(chatBackendUrl)}/ws/conversations/${selectedId}?token=${encodeURIComponent(accessToken)}`)
    setConnection("connecting")
    socket.onopen = () => setConnection("connected")
    socket.onclose = () => {
      if (!disposed) setConnection("offline")
    }
    socket.onmessage = (event) => {
      try {
        const envelope = JSON.parse(event.data) as { type?: string; data?: ChatMessage }
        if (envelope.type === "message.created" && envelope.data?.id) {
          setMessages((current) => mergeMessage(current, envelope.data as ChatMessage))
        }
      } catch {
        // REST polling remains authoritative if a realtime frame is malformed.
      }
    }
    return () => {
      disposed = true
      socket.close()
      setConnection("offline")
    }
  }, [accessToken, selectedId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current?.state === "recording") mediaRecorderRef.current.stop()
    }
  }, [])

  if (!authenticated) {
    return <main className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center p-6"><Card className="w-full border-blue-200"><CardContent className="flex items-start gap-4 p-6"><ShieldAlert className="mt-1 h-6 w-6 text-blue-600" /><div><h1 className="text-xl font-bold">Sign in to the support portal</h1><p className="mt-2 text-sm text-slate-600">Sign in with your Intera IMS account. Support agents, platform staff, and superusers can continue after authentication.</p><a href="/accounts/signin?next=%2Fdashboard" className="mt-5 inline-flex rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">Sign in</a></div></CardContent></Card></main>
  }

  if (!allowed) {
    return <main className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center p-6"><Card className="w-full border-red-200"><CardContent className="flex items-start gap-4 p-6"><ShieldAlert className="mt-1 h-6 w-6 text-red-600" /><div><h1 className="text-xl font-bold">Support portal access required</h1><p className="mt-2 text-sm text-slate-600">Your account is signed in, but it is not marked as a support agent or platform administrator.</p></div></CardContent></Card></main>
  }

  const sendMessage = async () => {
    const body = draft.trim()
    if (!body || !selectedId || sending) return
    setDraft("")
    try {
      const message = await createMessage({ conversationId: selectedId, body, workspace_id: selectedConversation?.context_workspace_id || undefined }).unwrap()
      setMessages((current) => mergeMessage(current, message))
    } catch {
      setDraft(body)
    }
  }

  const sendFile = async (file: File, kind?: "voice" | "file") => {
    if (!selectedConversation || selectedConversation.support_status !== "assigned" || uploading) return
    if (file.size > MAX_ATTACHMENT_BYTES) return
    try {
      const response = await uploadAttachment({ conversationId: selectedConversation.id, file }).unwrap()
      const message = await createMessage({
        conversationId: selectedConversation.id,
        kind: kind || (file.type.startsWith("image/") ? "image" : "file"),
        attachment_ids: [response.attachment.id],
        workspace_id: selectedConversation.context_workspace_id || undefined,
      }).unwrap()
      setMessages((current) => mergeMessage(current, message))
    } catch {
      // Keep the queue usable; the REST query remains authoritative.
    }
  }

  const toggleRecording = async () => {
    if (recording && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      setRecording(false)
      return
    }
    if (!selectedConversation || selectedConversation.support_status !== "assigned") return
    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      return
    }
    const recorder = new MediaRecorder(stream)
    chunksRef.current = []
    recorder.ondataavailable = (event) => chunksRef.current.push(event.data)
    recorder.onstop = async () => {
      stream.getTracks().forEach((track) => track.stop())
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" })
      await sendFile(new File([blob], `support-voice-note-${Date.now()}.webm`, { type: blob.type }), "voice")
    }
    mediaRecorderRef.current = recorder
    recorder.start()
    setRecording(true)
  }

  const claim = async () => {
    if (!selectedId || claiming) return
    await claimConversation({ conversationId: selectedId }).unwrap()
    await refetch()
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-[1500px] flex-col gap-5 p-4 md:p-7">
      <header className="rounded-[2rem] bg-[#091321] px-6 py-7 text-white shadow-xl md:px-9">
        <div className="flex flex-wrap items-end justify-between gap-4"><div><div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-emerald-200"><Headphones className="h-3.5 w-3.5" /> Support centre</div><h1 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">Help customers move forward.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">Claim AI-escalated conversations, reply to customers, and keep the support queue moving.</p></div><span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs text-slate-200">{connection === "connected" ? <Wifi className="h-3.5 w-3.5 text-emerald-300" /> : <WifiOff className="h-3.5 w-3.5 text-amber-300" />}{connection === "connected" ? "Live" : "Polling queue"}</span></div>
      </header>
      <section className="grid min-h-[620px] flex-1 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-950 lg:grid-cols-[340px_1fr]">
        <aside className="border-b border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60 lg:border-b-0 lg:border-r"><div className="mb-3 flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Open queue</p><span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-bold text-blue-700">{inbox.length}</span></div>{isLoading ? <p className="p-3 text-sm text-slate-500">Loading queue...</p> : null}{inbox.map((conversation) => <button key={conversation.id} type="button" onClick={() => setSelectedId(conversation.id)} className={`mb-2 w-full rounded-2xl border p-4 text-left transition ${selectedId === conversation.id ? "border-blue-400 bg-blue-50 dark:bg-blue-950/40" : "border-transparent bg-white hover:border-slate-200 dark:bg-slate-950"}`}><div className="flex items-center justify-between gap-2"><span className="truncate font-bold text-slate-900 dark:text-white">{displayName(conversation)}</span><span className="text-[11px] text-slate-400">{conversation.support_status === "assigned" ? "Assigned" : "Waiting"}</span></div><p className="mt-1 truncate text-xs text-slate-500">{conversation.latest_message?.body || "No messages yet"}</p></button>)}{!isLoading && !inbox.length ? <div className="rounded-2xl border border-dashed border-slate-300 p-5 text-sm leading-6 text-slate-500">No conversations are waiting for support.</div> : null}</aside>
        <div className="flex min-h-[620px] min-w-0 flex-col"><div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800 md:px-7"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">Human support</p><h2 className="mt-1 truncate text-xl font-black text-slate-900 dark:text-white">{selectedConversation ? displayName(selectedConversation) : "Select a conversation"}</h2></div>{selectedConversation?.support_status === "waiting" ? <Button onClick={() => void claim()} disabled={claiming}>{claiming ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />} Claim conversation</Button> : null}</div><div className="flex-1 space-y-4 overflow-y-auto bg-slate-50 p-5 dark:bg-slate-900/50 md:p-7">{messagesLoading ? <p className="text-sm text-slate-500">Loading messages...</p> : null}{messages.map((message) => <div key={message.id} className={`flex ${message.sender_user_id === readCookieValue("userID", getCookie) ? "justify-end" : "justify-start"}`}><div className={`max-w-[min(720px,88%)] rounded-3xl px-4 py-3 shadow-sm ${message.sender_user_id === readCookieValue("userID", getCookie) ? "rounded-br-md bg-blue-600 text-white" : "rounded-bl-md border border-slate-200 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"}`}><div className="text-[11px] font-bold uppercase tracking-wide opacity-70">{message.sender_role === "support_agent" ? "Support" : "Customer"}</div>{message.body ? <p className="mt-1 whitespace-pre-wrap text-sm leading-6">{message.body}</p> : null}{message.attachments?.map((attachment) => <a key={attachment.id} href={attachment.access_url || "#"} target="_blank" rel="noreferrer" className="mt-2 block rounded-xl bg-black/10 px-3 py-2 text-xs underline">{attachment.original_filename}</a>)}</div></div>)}<div ref={bottomRef} /></div><div className="border-t border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"><div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-900"><label className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-500 ${!selectedConversation || selectedConversation.support_status !== "assigned" || uploading ? "cursor-not-allowed opacity-40" : "cursor-pointer hover:bg-white hover:text-blue-600"}`} title="Attach a file"><Paperclip className="h-5 w-5" /><input type="file" className="hidden" disabled={!selectedConversation || selectedConversation.support_status !== "assigned" || uploading} onChange={(event) => { const file = event.target.files?.[0]; if (file) void sendFile(file); event.currentTarget.value = "" }} /></label><button type="button" onClick={() => void toggleRecording()} disabled={!selectedConversation || selectedConversation.support_status !== "assigned" || uploading} className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${recording ? "bg-red-100 text-red-600" : "text-slate-500 hover:bg-white hover:text-blue-600"}`} aria-label={recording ? "Stop voice note" : "Record voice note"}>{recording ? <Square className="h-4 w-4" /> : <Mic className="h-5 w-5" />}</button><textarea value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void sendMessage() } }} disabled={!selectedConversation || selectedConversation.support_status !== "assigned"} placeholder={selectedConversation?.support_status === "assigned" ? "Reply to the customer..." : "Claim the conversation to reply"} rows={2} className="min-h-12 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none" /><Button size="icon" onClick={() => void sendMessage()} disabled={!draft.trim() || !selectedConversation || selectedConversation.support_status !== "assigned" || sending || uploading} aria-label="Send reply">{sending || uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</Button></div><p className="mt-2 flex items-center gap-1 px-1 text-[11px] text-slate-400"><MessageSquare className="h-3 w-3" /> Text, files, and voice notes are available after claiming.</p></div></div>
      </section>
      <section aria-label="Platform service health" className="space-y-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">Operations visibility</p>
          <h2 className="mt-1 text-2xl font-black text-slate-900 dark:text-white">Service health</h2>
          <p className="mt-1 text-sm text-slate-500">Read-only status for the APIs and background workers that support customer conversations.</p>
        </div>
        <AdminServiceHealth />
      </section>
    </main>
  )
}
