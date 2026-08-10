"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { createLocalAudioTrack, Room, RoomEvent } from "livekit-client"

interface UseVoiceChatOptions {
  onTranscript: (text: string) => void
  onAutoSend: (text: string) => void
  onSpeechStart?: () => void
  onSpeechEnd?: () => void
  autoSendDelay?: number
  language?: string
  onInputMethodChange?: (method: "voice" | "text") => void
  onVoiceInterruption?: () => void
  selectedVoice?: SpeechSynthesisVoice | null
  volume?: number
  autoSubmitEnabled?: boolean
  livekitRoomName?: string
  livekitParticipantName?: string
  livekitAgentName?: string
  livekitMetadata?: Record<string, string>
  livekitEnabled?: boolean
  onSyncedVoiceTurnStart?: (text: string, turnId: string) => void
  onSyncedVoiceA2aEvent?: (event: unknown, turnId?: string) => void
  onSyncedVoiceAssistantResult?: (text: string, turnId?: string) => void
  onSyncedVoiceTurnEnd?: (turnId?: string) => void
}

interface UseVoiceChatReturn {
  isListening: boolean
  isSupported: boolean
  isSpeaking: boolean
  isConnecting: boolean
  isConnected: boolean
  transcript: string
  finalTranscript: string
  conversationEntries: Array<{ speaker: "user" | "assistant"; text: string; timestamp: number }>
  startListening: () => void
  stopListening: () => void
  startConversation: () => Promise<void>
  stopConversation: () => Promise<void>
  startPushToTalk: () => Promise<void>
  stopPushToTalk: () => Promise<void>
  speak: (text: string) => void
  stopSpeaking: () => void
  clearTranscript: () => void
  inputMethod: "voice" | "text"
  setInputMethod: (method: "voice" | "text") => void
  cancelAutoSend: () => void
  availableVoices: SpeechSynthesisVoice[]
  selectedVoice: SpeechSynthesisVoice | null
  setSelectedVoice: (voice: SpeechSynthesisVoice | null) => void
  volume: number
  setVolume: (volume: number) => void
  autoSubmitEnabled: boolean
  setAutoSubmitEnabled: (enabled: boolean) => void
  estimatedCoins: number
  sessionRoomName: string | null
  appendLocalConversationEntry: (speaker: "user" | "assistant", text: string) => void
}

const normalizeTranscriptText = (value: string) => value.trim().replace(/\s+/g, " ")

const transcriptComparisonKey = (value: string) =>
  normalizeTranscriptText(value)
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/[^a-z0-9']+/g, " ")
    .replace(/\s+/g, " ")
    .trim()

const collapseRepeatedTranscriptText = (value: string) => {
  const normalizedText = normalizeTranscriptText(value)
  if (!normalizedText) {
    return ""
  }

  const sentenceParts = normalizedText
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
  if (sentenceParts.length > 1) {
    const uniqueSentences: string[] = []
    const seenSentences = new Set<string>()
    for (const sentence of sentenceParts) {
      const key = sentence.toLowerCase()
      if (seenSentences.has(key)) {
        continue
      }
      seenSentences.add(key)
      uniqueSentences.push(sentence)
    }
    if (uniqueSentences.length < sentenceParts.length) {
      return uniqueSentences.join(" ")
    }
  }

  const words = normalizedText.split(" ")
  for (let size = 1; size <= Math.floor(words.length / 2); size += 1) {
    if (words.length % size !== 0) {
      continue
    }
    const phrase = words.slice(0, size)
    const phraseKey = transcriptComparisonKey(phrase.join(" "))
    let repeated = true
    for (let index = 0; index < words.length; index += size) {
      if (transcriptComparisonKey(words.slice(index, index + size).join(" ")) !== phraseKey) {
        repeated = false
        break
      }
    }
    if (repeated) {
      return phrase.join(" ")
    }
  }

  return normalizedText
}

const uniqueTranscriptTexts = (texts: string[]) => {
  const seen = new Set<string>()
  const uniqueTexts: string[] = []

  for (const text of texts) {
    const normalizedText = normalizeTranscriptText(text)
    if (!normalizedText) {
      continue
    }
    const key = transcriptComparisonKey(normalizedText)
    if (seen.has(key)) {
      continue
    }
    seen.add(key)
    uniqueTexts.push(normalizedText)
  }

  return uniqueTexts
}

const LIVEKIT_SESSION_ROOM_STORAGE_KEY = "intera.a2a.voice.room"

const readStoredLivekitRoom = () => {
  if (typeof window === "undefined") {
    return null
  }
  try {
    return window.sessionStorage.getItem(LIVEKIT_SESSION_ROOM_STORAGE_KEY)
  } catch {
    return null
  }
}

const rememberLivekitRoom = (roomName: string) => {
  if (typeof window === "undefined" || !roomName) {
    return
  }
  try {
    window.sessionStorage.setItem(LIVEKIT_SESSION_ROOM_STORAGE_KEY, roomName)
  } catch {
    // Session storage is best-effort; server cleanup still runs from refs.
  }
}

const forgetStoredLivekitRoom = (roomName?: string | null) => {
  if (typeof window === "undefined") {
    return
  }
  try {
    const storedRoomName = window.sessionStorage.getItem(LIVEKIT_SESSION_ROOM_STORAGE_KEY)
    if (!roomName || storedRoomName === roomName) {
      window.sessionStorage.removeItem(LIVEKIT_SESSION_ROOM_STORAGE_KEY)
    }
  } catch {
    // Ignore storage failures.
  }
}

export function useVoiceChat({
  onTranscript,
  onAutoSend,
  onSpeechStart,
  onSpeechEnd,
  autoSendDelay = 6000,
  language = "en-US",
  onInputMethodChange,
  onVoiceInterruption,
  selectedVoice: initialSelectedVoice = null,
  volume: initialVolume = 0.8,
  autoSubmitEnabled: initialAutoSubmitEnabled = false,
  livekitRoomName,
  livekitParticipantName,
  livekitAgentName,
  livekitMetadata,
  livekitEnabled = false,
  onSyncedVoiceTurnStart,
  onSyncedVoiceA2aEvent,
  onSyncedVoiceAssistantResult,
  onSyncedVoiceTurnEnd,
}: UseVoiceChatOptions): UseVoiceChatReturn {
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [inputMethod, setInputMethodState] = useState<"voice" | "text">("text")
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([])
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(initialSelectedVoice)
  const [volume, setVolume] = useState(initialVolume)
  const [autoSubmitEnabled, setAutoSubmitEnabled] = useState(initialAutoSubmitEnabled)
  const [sessionRoomName, setSessionRoomName] = useState<string | null>(null)
  const [sessionStartedAt, setSessionStartedAt] = useState<number | null>(null)
  const [finalTranscript, setFinalTranscript] = useState("")
  const [conversationEntries, setConversationEntries] = useState<Array<{ speaker: "user" | "assistant"; text: string; timestamp: number }>>([])
  const [estimatedCoins, setEstimatedCoins] = useState(0)

  const autoSendTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const listeningResetTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const transcriptFlushTimeoutRef = useRef<{ user: NodeJS.Timeout | null; assistant: NodeJS.Timeout | null }>({
    user: null,
    assistant: null,
  })
  const lastTranscriptRef = useRef("")
  const lastAutoSentTranscriptRef = useRef<{ text: string; timestamp: number }>({ text: "", timestamp: 0 })
  const lastFinalTranscriptBySpeakerRef = useRef<{ user: string; assistant: string }>({ user: "", assistant: "" })
  const pendingTranscriptBySpeakerRef = useRef<{ user: string; assistant: string }>({ user: "", assistant: "" })
  const onTranscriptRef = useRef(onTranscript)
  const onAutoSendRef = useRef(onAutoSend)
  const onInputMethodChangeRef = useRef(onInputMethodChange)
  const onSyncedVoiceTurnStartRef = useRef(onSyncedVoiceTurnStart)
  const onSyncedVoiceA2aEventRef = useRef(onSyncedVoiceA2aEvent)
  const onSyncedVoiceAssistantResultRef = useRef(onSyncedVoiceAssistantResult)
  const onSyncedVoiceTurnEndRef = useRef(onSyncedVoiceTurnEnd)
  const livekitRoomRef = useRef<Room | null>(null)
  const livekitTrackRef = useRef<Awaited<ReturnType<typeof createLocalAudioTrack>> | null>(null)
  const livekitCleanupRef = useRef<(() => Promise<void>) | null>(null)
  const livekitStartPromiseRef = useRef<Promise<void> | null>(null)
  const livekitStopPromiseRef = useRef<Promise<void> | null>(null)
  const livekitStartAbortRef = useRef<AbortController | null>(null)
  const livekitSessionGenerationRef = useRef(0)
  const sessionRoomNameRef = useRef<string | null>(null)
  const remoteAudioElementsRef = useRef<Map<string, HTMLMediaElement>>(new Map())
  const speakingIdleTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const syncedVoiceTurnIdsRef = useRef<Set<string>>(new Set())

  const ensureSyncedVoiceTurnStarted = useCallback((text: string, turnId?: string) => {
    const normalizedTurnId = typeof turnId === "string" ? turnId.trim() : ""
    const normalizedText = collapseRepeatedTranscriptText(text)
    if (!normalizedTurnId || !normalizedText || syncedVoiceTurnIdsRef.current.has(normalizedTurnId)) {
      return
    }
    syncedVoiceTurnIdsRef.current.add(normalizedTurnId)
    onSyncedVoiceTurnStartRef.current?.(normalizedText, normalizedTurnId)
  }, [])

  const stopLivekitRoom = useCallback(
    async (roomName: string | null, keepalive = false) => {
      if (!roomName) {
        return
      }

      const payload = JSON.stringify({
        roomName,
        participantName: livekitParticipantName || "Intera voice participant",
      })

      try {
        if (keepalive && typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
          const blob = new Blob([payload], { type: "application/json" })
          if (navigator.sendBeacon("/api/livekit/room/stop", blob)) {
            return
          }
        }

        await fetch("/api/livekit/room/stop", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: payload,
          keepalive,
        })
      } catch {
        // The local media track is already stopped. Server cleanup is best-effort.
      }
    },
    [livekitParticipantName],
  )

  const clearTranscript = useCallback(() => {
    if (autoSendTimeoutRef.current) {
      clearTimeout(autoSendTimeoutRef.current)
      autoSendTimeoutRef.current = null
    }
    if (listeningResetTimeoutRef.current) {
      clearTimeout(listeningResetTimeoutRef.current)
      listeningResetTimeoutRef.current = null
    }
    if (transcriptFlushTimeoutRef.current.user) {
      clearTimeout(transcriptFlushTimeoutRef.current.user)
      transcriptFlushTimeoutRef.current.user = null
    }
    if (transcriptFlushTimeoutRef.current.assistant) {
      clearTimeout(transcriptFlushTimeoutRef.current.assistant)
      transcriptFlushTimeoutRef.current.assistant = null
    }
    if (speakingIdleTimeoutRef.current) {
      clearTimeout(speakingIdleTimeoutRef.current)
      speakingIdleTimeoutRef.current = null
    }
    lastTranscriptRef.current = ""
    lastAutoSentTranscriptRef.current = { text: "", timestamp: 0 }
    lastFinalTranscriptBySpeakerRef.current = { user: "", assistant: "" }
    syncedVoiceTurnIdsRef.current.clear()
    pendingTranscriptBySpeakerRef.current = { user: "", assistant: "" }
    setTranscript("")
    setFinalTranscript("")
    setConversationEntries([])
    setIsListening(false)
  }, [])

  const disconnectLivekitClient = useCallback(
    async (room: Room | null, track: Awaited<ReturnType<typeof createLocalAudioTrack>> | null) => {
      if (track) {
        try {
          track.stop()
        } catch {
          // ignore local track cleanup errors
        }
      }

      if (room) {
        try {
          room.disconnect()
        } catch {
          // ignore room disconnect errors
        }
      }
    },
    [],
  )

  const cleanupLivekitSession = useCallback(async () => {
    if (livekitStopPromiseRef.current) {
      return livekitStopPromiseRef.current
    }

    const stopPromise = (async () => {
      livekitSessionGenerationRef.current += 1
      livekitStartAbortRef.current?.abort()
      livekitStartAbortRef.current = null

      const room = livekitRoomRef.current
      const track = livekitTrackRef.current
      const roomName = sessionRoomNameRef.current

      forgetStoredLivekitRoom(roomName)
      livekitCleanupRef.current = null
      livekitRoomRef.current = null
      livekitTrackRef.current = null
      sessionRoomNameRef.current = null
      setSessionRoomName(null)
      setSessionStartedAt(null)
      setEstimatedCoins(0)
      setTranscript("")
      setFinalTranscript("")
      lastTranscriptRef.current = ""
      lastAutoSentTranscriptRef.current = { text: "", timestamp: 0 }
      lastFinalTranscriptBySpeakerRef.current = { user: "", assistant: "" }
      syncedVoiceTurnIdsRef.current.clear()
      pendingTranscriptBySpeakerRef.current = { user: "", assistant: "" }
      if (transcriptFlushTimeoutRef.current.user) {
        clearTimeout(transcriptFlushTimeoutRef.current.user)
        transcriptFlushTimeoutRef.current.user = null
      }
      if (transcriptFlushTimeoutRef.current.assistant) {
        clearTimeout(transcriptFlushTimeoutRef.current.assistant)
        transcriptFlushTimeoutRef.current.assistant = null
      }
      if (speakingIdleTimeoutRef.current) {
        clearTimeout(speakingIdleTimeoutRef.current)
        speakingIdleTimeoutRef.current = null
      }
      setIsConnected(false)
      setIsConnecting(false)
      setIsSpeaking(false)

      for (const [trackSid, element] of remoteAudioElementsRef.current.entries()) {
        try {
          element.pause()
        } catch {
          // ignore playback cleanup errors
        }
        try {
          element.remove()
        } catch {
          // ignore DOM cleanup errors
        }
        remoteAudioElementsRef.current.delete(trackSid)
      }

      try {
        await disconnectLivekitClient(room, track)
        await stopLivekitRoom(roomName)
      } finally {
        livekitRoomRef.current = null
        livekitTrackRef.current = null
        livekitCleanupRef.current = null
      }
    })()

    livekitStopPromiseRef.current = stopPromise
    try {
      await stopPromise
    } finally {
      if (livekitStopPromiseRef.current === stopPromise) {
        livekitStopPromiseRef.current = null
      }
    }
  }, [disconnectLivekitClient, stopLivekitRoom])

  useEffect(() => {
    onTranscriptRef.current = onTranscript
  }, [onTranscript])

  useEffect(() => {
    onAutoSendRef.current = onAutoSend
  }, [onAutoSend])

  useEffect(() => {
    onInputMethodChangeRef.current = onInputMethodChange
  }, [onInputMethodChange])

  useEffect(() => {
    onSyncedVoiceTurnStartRef.current = onSyncedVoiceTurnStart
  }, [onSyncedVoiceTurnStart])

  useEffect(() => {
    onSyncedVoiceA2aEventRef.current = onSyncedVoiceA2aEvent
  }, [onSyncedVoiceA2aEvent])

  useEffect(() => {
    onSyncedVoiceAssistantResultRef.current = onSyncedVoiceAssistantResult
  }, [onSyncedVoiceAssistantResult])

  useEffect(() => {
    onSyncedVoiceTurnEndRef.current = onSyncedVoiceTurnEnd
  }, [onSyncedVoiceTurnEnd])

  useEffect(() => {
    if (typeof window !== "undefined") {
      const supportTimerId = window.setTimeout(
        () => setIsSupported(Boolean(window.navigator.mediaDevices?.getUserMedia)),
        0,
      )

      return () => {
        window.clearTimeout(supportTimerId)
      }
    }
  }, [livekitEnabled])

  const startListening = useCallback(() => {
    // Browser speech recognition is intentionally disabled. LiveKit owns audio capture.
  }, [])

  const appendConversationEntry = useCallback(
    (speaker: "user" | "assistant", text: string) => {
      const normalizedText = collapseRepeatedTranscriptText(text)
      if (!normalizedText) {
        return
      }

      setConversationEntries((current) => {
        const last = current[current.length - 1]
        if (last && last.speaker === speaker) {
          const lastKey = transcriptComparisonKey(last.text)
          const nextKey = transcriptComparisonKey(normalizedText)
          if (lastKey === nextKey) {
            return current
          }

          const combinedText = collapseRepeatedTranscriptText(`${last.text} ${normalizedText}`)
          const combinedKey = transcriptComparisonKey(combinedText)
          if (combinedKey === lastKey) {
            return current
          }
          if (combinedKey === nextKey) {
            return [...current.slice(0, -1), { ...last, text: normalizedText, timestamp: Date.now() }]
          }
        }
        return [...current, { speaker, text: normalizedText, timestamp: Date.now() }]
      })
    },
    [],
  )

  const flushBufferedTranscript = useCallback(
    (speaker: "user" | "assistant") => {
      const normalizedText = pendingTranscriptBySpeakerRef.current[speaker].trim()
      if (!normalizedText) {
        return
      }

      pendingTranscriptBySpeakerRef.current[speaker] = ""
      if (speaker === "user") {
        lastTranscriptRef.current = normalizedText
        lastFinalTranscriptBySpeakerRef.current.user = normalizedText
        setFinalTranscript(normalizedText)
        setTranscript(normalizedText)
        setIsListening(false)
      } else {
        lastFinalTranscriptBySpeakerRef.current.assistant = normalizedText
        setIsSpeaking(false)
      }

      onSpeechEnd?.()

      if (livekitEnabled) {
        return
      }

      appendConversationEntry(speaker, normalizedText)

      if (speaker === "user" && autoSubmitEnabled) {
        if (autoSendTimeoutRef.current) {
          clearTimeout(autoSendTimeoutRef.current)
        }
        autoSendTimeoutRef.current = setTimeout(() => {
          const lowerText = normalizedText.toLowerCase()
          const lastAutoSent = lastAutoSentTranscriptRef.current
          if (lastAutoSent.text === lowerText && Date.now() - lastAutoSent.timestamp < 5000) {
            return
          }
          lastAutoSentTranscriptRef.current = { text: lowerText, timestamp: Date.now() }
          onAutoSendRef.current(normalizedText)
          setTranscript("")
          setFinalTranscript("")
        }, Math.max(150, Math.min(autoSendDelay / 4, 1200)))
      }
    },
    [appendConversationEntry, autoSendDelay, autoSubmitEnabled, livekitEnabled, onSpeechEnd],
  )

  const queueBufferedTranscript = useCallback(
    (speaker: "user" | "assistant", text: string) => {
      const normalizedText = collapseRepeatedTranscriptText(text)
      if (!normalizedText) {
        return
      }

      const pendingText = pendingTranscriptBySpeakerRef.current[speaker]
      const pendingKey = transcriptComparisonKey(pendingText)
      const normalizedKey = transcriptComparisonKey(normalizedText)
      if (pendingText && pendingKey === normalizedKey) {
        return
      }
      if (pendingText && (pendingKey.endsWith(` ${normalizedKey}`) || pendingKey.includes(normalizedKey))) {
        return
      }
      if (pendingText && normalizedKey.includes(pendingKey)) {
        pendingTranscriptBySpeakerRef.current[speaker] = normalizedText
      } else {
        pendingTranscriptBySpeakerRef.current[speaker] = collapseRepeatedTranscriptText(
          pendingText ? `${pendingText} ${normalizedText}` : normalizedText,
        )
      }

      const combinedText = pendingTranscriptBySpeakerRef.current[speaker]
      if (speaker === "user") {
        setTranscript(combinedText)
        onTranscriptRef.current(combinedText)
        setIsListening(true)
      } else {
        setIsSpeaking(true)
      }

      onSpeechStart?.()

      const existingTimer = transcriptFlushTimeoutRef.current[speaker]
      if (existingTimer) {
        clearTimeout(existingTimer)
      }
      transcriptFlushTimeoutRef.current[speaker] = setTimeout(() => {
        transcriptFlushTimeoutRef.current[speaker] = null
        flushBufferedTranscript(speaker)
      }, speaker === "user" ? Math.max(900, Math.min(autoSendDelay, 3500)) : 450)
    },
    [autoSendDelay, flushBufferedTranscript, onSpeechStart],
  )

  const stopListening = useCallback(() => {
    if (autoSendTimeoutRef.current) {
      clearTimeout(autoSendTimeoutRef.current)
      autoSendTimeoutRef.current = null
    }
  }, [])

  const ensureLivekitSession = useCallback(async () => {
    if (livekitRoomRef.current) {
      return
    }

    const livekitWsUrl = (process.env.NEXT_PUBLIC_LIVEKIT_URL ?? "").trim()
    if (!livekitWsUrl) {
      return
    }

    if (livekitStartPromiseRef.current) {
      return livekitStartPromiseRef.current
    }

    const startPromise = (async () => {
      const startGeneration = livekitSessionGenerationRef.current + 1
      livekitSessionGenerationRef.current = startGeneration
      const abortController = new AbortController()
      livekitStartAbortRef.current = abortController

      const isStaleStart = () =>
        abortController.signal.aborted || livekitSessionGenerationRef.current !== startGeneration

      setIsConnecting(true)
      setIsConnected(false)

      if (livekitStopPromiseRef.current) {
        await livekitStopPromiseRef.current
      }
      if (livekitRoomRef.current) {
        setIsConnecting(false)
        return
      }
      if (isStaleStart()) {
        setIsConnecting(false)
        return
      }

      let generatedRoomName = ""
      try {
        const previousRoomName = readStoredLivekitRoom()
        if (previousRoomName) {
          await stopLivekitRoom(previousRoomName)
          forgetStoredLivekitRoom(previousRoomName)
        }
        if (isStaleStart()) {
          setIsConnecting(false)
          return
        }

        generatedRoomName =
          livekitRoomName ||
          `a2a-voice-${new Date().toISOString().replace(/[:.]/g, "-")}-${Math.random().toString(16).slice(2, 8)}`
        sessionRoomNameRef.current = generatedRoomName
        setSessionRoomName(generatedRoomName)
        rememberLivekitRoom(generatedRoomName)

        const response = await fetch("/api/livekit/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            roomName: generatedRoomName,
            participantName: livekitParticipantName || "Intera voice participant",
            agentName: livekitAgentName || "ka2a-voice",
            metadata: livekitMetadata || {},
          }),
          signal: abortController.signal,
        })
        if (!response.ok) {
          throw new Error(`Unable to create LiveKit token (${response.status})`)
        }

        const payload = (await response.json()) as { token?: string; wsUrl?: string; roomName?: string }
        const token = payload.token || ""
        const resolvedWsUrl = payload.wsUrl || livekitWsUrl
        if (!token || !resolvedWsUrl) {
          throw new Error("LiveKit token response was incomplete.")
        }
        if (isStaleStart()) {
          forgetStoredLivekitRoom(generatedRoomName)
          await stopLivekitRoom(generatedRoomName)
          return
        }

        const room = new Room({
          adaptiveStream: true,
          dynacast: true,
        })
        room.on(RoomEvent.TrackSubscribed, (track) => {
          if (track.kind !== "audio") {
            return
          }
          const mediaElement = track.attach()
          mediaElement.autoplay = true
          mediaElement.setAttribute("playsinline", "true")
          mediaElement.controls = false
          mediaElement.muted = false
          mediaElement.style.display = "none"
          if (!mediaElement.isConnected) {
            document.body.appendChild(mediaElement)
          }
          void mediaElement.play().catch(() => {
            // browsers may require a later user gesture; keep the element attached regardless
          })
          if (!track.sid) {
            return
          }
          remoteAudioElementsRef.current.set(track.sid, mediaElement)
        })
        room.on(RoomEvent.ActiveSpeakersChanged, (participants) => {
          const localIdentity = room.localParticipant.identity
          const hasLocalSpeaker = participants.some((participant) => participant.identity === localIdentity)
          const hasRemoteSpeaker = participants.some(
            (participant) => participant.identity && participant.identity !== localIdentity,
          )

          if (speakingIdleTimeoutRef.current) {
            clearTimeout(speakingIdleTimeoutRef.current)
            speakingIdleTimeoutRef.current = null
          }

          setIsListening(hasLocalSpeaker)
          setIsSpeaking(hasRemoteSpeaker)
          if (hasLocalSpeaker || hasRemoteSpeaker) {
            onSpeechStart?.()
          } else {
            onSpeechEnd?.()
          }

          if (hasRemoteSpeaker) {
            speakingIdleTimeoutRef.current = setTimeout(() => {
              setIsSpeaking(false)
              speakingIdleTimeoutRef.current = null
              onSpeechEnd?.()
            }, 2500)
          }
        })
        room.on(RoomEvent.TranscriptionReceived, (segments, participant) => {
          const localIdentity = room.localParticipant.identity
          const speakerIdentity = participant?.identity || ""
          if (!speakerIdentity) {
            return
          }
          const speaker: "user" | "assistant" = speakerIdentity === localIdentity ? "user" : "assistant"

          const isFinal = segments.some((segment) => segment.final)
          const transcriptText = collapseRepeatedTranscriptText(
            uniqueTranscriptTexts(
              segments
                .map((segment) => segment.text.trim().replace(/\s+/g, " "))
                .filter(Boolean),
            ).join(" "),
          )
          if (listeningResetTimeoutRef.current) {
            clearTimeout(listeningResetTimeoutRef.current)
            listeningResetTimeoutRef.current = null
          }

          if (!transcriptText) {
            if (speaker === "user") {
              setIsListening(false)
            } else {
              setIsSpeaking(false)
            }
            return
          }

          if (speaker === "user") {
            setTranscript(transcriptText)
            onTranscriptRef.current(transcriptText)
            setIsListening(!isFinal)
            if (isFinal) {
              appendConversationEntry("user", transcriptText)
              lastTranscriptRef.current = transcriptText
              lastFinalTranscriptBySpeakerRef.current.user = transcriptText
              setFinalTranscript(transcriptText)
              onSpeechEnd?.()
            } else {
              onSpeechStart?.()
            }
          } else {
            setIsSpeaking(!isFinal)
            if (isFinal && !livekitEnabled) {
              appendConversationEntry("assistant", transcriptText)
              lastFinalTranscriptBySpeakerRef.current.assistant = transcriptText
              onSpeechEnd?.()
            } else {
              onSpeechStart?.()
            }
          }

          if (!isFinal) {
            listeningResetTimeoutRef.current = setTimeout(() => {
              if (speaker === "user") {
                setIsListening(false)
              } else {
                setIsSpeaking(false)
              }
            }, 750)
            return
          }
        })
        room.on(RoomEvent.DataReceived, (payload, _participant, _kind, topic) => {
          if (topic !== "ka2a.voice") {
            return
          }

          let decodedPayload = ""
          try {
            decodedPayload =
              typeof payload === "string"
                ? payload
                : new TextDecoder().decode(payload instanceof Uint8Array ? payload : new Uint8Array(payload))
          } catch {
            return
          }

        try {
          const event = JSON.parse(decodedPayload) as {
            source?: string
            type?: string
            role?: string
            text?: string
            syncChat?: boolean
            displayInTranscript?: boolean
            turnId?: string
            event?: unknown
            payload?: Record<string, unknown>
            voiceLocalResult?: boolean
          }
          if (event.source !== "ka2a_voice") {
            return
          }

          const eventPayload =
            event.payload && typeof event.payload === "object" && !Array.isArray(event.payload)
              ? event.payload
              : undefined
          const mirroredA2aEvent = event.event ?? eventPayload?.event

          if (event.type === "a2a_event" && mirroredA2aEvent) {
            if (event.turnId && lastFinalTranscriptBySpeakerRef.current.user) {
              ensureSyncedVoiceTurnStarted(lastFinalTranscriptBySpeakerRef.current.user, event.turnId)
            }
            onSyncedVoiceA2aEventRef.current?.(mirroredA2aEvent, event.turnId)
            return
          }

          if (!event.text?.trim()) {
            return
          }

          const syncChat = event.syncChat === true || eventPayload?.syncChat === true
          const turnId =
            typeof event.turnId === "string" && event.turnId.trim()
              ? event.turnId
              : typeof eventPayload?.turnId === "string"
                ? eventPayload.turnId
                : undefined
          const displayInTranscript =
            event.displayInTranscript === false || eventPayload?.displayInTranscript === false ? false : true
          const voiceLocalResult = eventPayload?.voiceLocalResult === true || event.voiceLocalResult === true

          if (event.type === "status") {
            if (syncChat && turnId && lastFinalTranscriptBySpeakerRef.current.user) {
              ensureSyncedVoiceTurnStarted(lastFinalTranscriptBySpeakerRef.current.user, turnId)
            }
            setIsSpeaking(false)
            if (displayInTranscript) {
              appendConversationEntry("assistant", event.text)
            }
            return
          }

          const speaker = event.role === "user" ? "user" : "assistant"
          if (displayInTranscript) {
            appendConversationEntry(speaker, event.text)
          }
          if (speaker === "user") {
            const normalizedText = collapseRepeatedTranscriptText(event.text)
            if (syncChat && turnId) {
              ensureSyncedVoiceTurnStarted(normalizedText, turnId)
            }
            lastTranscriptRef.current = normalizedText
            lastFinalTranscriptBySpeakerRef.current.user = normalizedText
            setFinalTranscript(normalizedText)
            setTranscript("")
            setIsListening(false)
            return
          }
          lastFinalTranscriptBySpeakerRef.current.assistant = collapseRepeatedTranscriptText(event.text)
          if (syncChat && turnId && lastFinalTranscriptBySpeakerRef.current.user) {
            ensureSyncedVoiceTurnStarted(lastFinalTranscriptBySpeakerRef.current.user, turnId)
          }
          if (syncChat && voiceLocalResult && (event.type === "result" || event.type === "error")) {
            onSyncedVoiceAssistantResultRef.current?.(lastFinalTranscriptBySpeakerRef.current.assistant, turnId)
          }
          if (syncChat && (event.type === "result" || event.type === "error")) {
            onSyncedVoiceTurnEndRef.current?.(turnId)
          }
          setIsSpeaking(false)
        } catch {
          // Ignore unrelated data messages.
        }
      })
        room.on(RoomEvent.TrackUnsubscribed, (track) => {
          if (track.kind !== "audio") {
            return
          }
          if (!track.sid) {
            return
          }
          const mediaElement = remoteAudioElementsRef.current.get(track.sid)
          if (mediaElement) {
            try {
              mediaElement.pause()
            } catch {
              // ignore
            }
            try {
              mediaElement.remove()
            } catch {
              // ignore
            }
            remoteAudioElementsRef.current.delete(track.sid)
          }
          if (remoteAudioElementsRef.current.size === 0) {
            setIsSpeaking(false)
            onSpeechEnd?.()
          }
        })
        room.on("disconnected", () => {
          setIsConnected(false)
          setIsConnecting(false)
          setIsSpeaking(false)
        })
        room.on("reconnecting", () => {
          setIsConnected(false)
        })
        room.on("reconnected", () => {
          setIsConnected(true)
        })

        await room.connect(resolvedWsUrl, token, {
          autoSubscribe: true,
        })
        if (isStaleStart()) {
          room.disconnect()
          forgetStoredLivekitRoom(generatedRoomName)
          await stopLivekitRoom(generatedRoomName)
          return
        }

        const localTrack = await createLocalAudioTrack({
          echoCancellation: true,
          noiseSuppression: true,
        })
        await room.localParticipant.publishTrack(localTrack)
        if (isStaleStart()) {
          await disconnectLivekitClient(room, localTrack)
          forgetStoredLivekitRoom(generatedRoomName)
          await stopLivekitRoom(generatedRoomName)
          return
        }

        livekitRoomRef.current = room
        livekitTrackRef.current = localTrack
        livekitCleanupRef.current = cleanupLivekitSession
        setIsConnected(true)
        setSessionStartedAt(Date.now())
        setEstimatedCoins(100)
      } catch (error) {
        if (abortController.signal.aborted) {
          if (generatedRoomName) {
            forgetStoredLivekitRoom(generatedRoomName)
            await stopLivekitRoom(generatedRoomName)
          }
          return
        }
        if (generatedRoomName) {
          forgetStoredLivekitRoom(generatedRoomName)
          await stopLivekitRoom(generatedRoomName)
        }
        setIsConnected(false)
        setSessionRoomName(null)
        sessionRoomNameRef.current = null
        throw error
      } finally {
        if (livekitStartAbortRef.current === abortController) {
          livekitStartAbortRef.current = null
        }
        if (!isStaleStart()) {
          setIsConnecting(false)
        }
      }
    })()

    livekitStartPromiseRef.current = startPromise
    try {
      await startPromise
    } finally {
      if (livekitStartPromiseRef.current === startPromise) {
        livekitStartPromiseRef.current = null
      }
    }
  }, [
    appendConversationEntry,
    cleanupLivekitSession,
    disconnectLivekitClient,
    ensureSyncedVoiceTurnStarted,
    livekitAgentName,
    livekitEnabled,
    livekitMetadata,
    livekitParticipantName,
    livekitRoomName,
    onSpeechEnd,
    onSpeechStart,
    stopLivekitRoom,
  ])

  const startPushToTalk = useCallback(async () => {
    if (!livekitEnabled) return
    await ensureLivekitSession()
  }, [ensureLivekitSession, livekitEnabled])

  const stopPushToTalk = useCallback(async () => {
    await cleanupLivekitSession()
  }, [cleanupLivekitSession])

  const speak = useCallback(
    () => {
      // Intentionally disabled. LiveKit handles the voice experience end-to-end.
    },
    [],
  )

  const stopSpeaking = useCallback(() => {
    // Intentionally disabled. LiveKit handles the voice experience end-to-end.
  }, [])

  const startConversation = useCallback(async () => {
    setTranscript("")
    setFinalTranscript("")
    setConversationEntries([])
    lastTranscriptRef.current = ""
    lastAutoSentTranscriptRef.current = { text: "", timestamp: 0 }
    lastFinalTranscriptBySpeakerRef.current = { user: "", assistant: "" }
    syncedVoiceTurnIdsRef.current.clear()
    pendingTranscriptBySpeakerRef.current = { user: "", assistant: "" }
    await startPushToTalk()
  }, [startPushToTalk])

  const stopConversation = useCallback(async () => {
    await stopPushToTalk()
  }, [stopPushToTalk])

  const setInputMethod = useCallback(
    (method: "voice" | "text") => {
      setInputMethodState(method)
      onInputMethodChange?.(method)
    },
    [onInputMethodChange],
  )

  const cancelAutoSend = useCallback(() => {
    if (autoSendTimeoutRef.current) {
      clearTimeout(autoSendTimeoutRef.current)
      autoSendTimeoutRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!sessionStartedAt) {
      return
    }

    const updateEstimatedCoins = () => {
      const elapsedMinutes = Math.max(1, Math.ceil((Date.now() - sessionStartedAt) / 60000))
      setEstimatedCoins(elapsedMinutes * 100)
    }

    updateEstimatedCoins()
    const timerId = window.setInterval(updateEstimatedCoins, 15000)
    return () => window.clearInterval(timerId)
  }, [sessionStartedAt])

  useEffect(() => {
    const transcriptFlushTimeouts = transcriptFlushTimeoutRef.current
    const disconnectLivekitImmediately = () => {
      livekitSessionGenerationRef.current += 1
      livekitStartAbortRef.current?.abort()
      livekitStartAbortRef.current = null

      const room = livekitRoomRef.current
      const track = livekitTrackRef.current
      const roomName = sessionRoomNameRef.current

      forgetStoredLivekitRoom(roomName)
      livekitRoomRef.current = null
      livekitTrackRef.current = null
      livekitCleanupRef.current = null
      livekitStartPromiseRef.current = null
      livekitStopPromiseRef.current = null
      sessionRoomNameRef.current = null

      for (const [, element] of remoteAudioElementsRef.current.entries()) {
        try {
          element.pause()
        } catch {
          // ignore unload cleanup errors
        }
        try {
          element.remove()
        } catch {
          // ignore unload cleanup errors
        }
      }
      remoteAudioElementsRef.current.clear()

      void disconnectLivekitClient(room, track)
      if (speakingIdleTimeoutRef.current) {
        clearTimeout(speakingIdleTimeoutRef.current)
        speakingIdleTimeoutRef.current = null
      }

      void stopLivekitRoom(roomName, true)
    }

    window.addEventListener("pagehide", disconnectLivekitImmediately)
    window.addEventListener("beforeunload", disconnectLivekitImmediately)

    return () => {
      if (autoSendTimeoutRef.current) {
        clearTimeout(autoSendTimeoutRef.current)
      }
      if (listeningResetTimeoutRef.current) {
        clearTimeout(listeningResetTimeoutRef.current)
      }
      if (speakingIdleTimeoutRef.current) {
        clearTimeout(speakingIdleTimeoutRef.current)
        speakingIdleTimeoutRef.current = null
      }
      if (transcriptFlushTimeouts.user) {
        clearTimeout(transcriptFlushTimeouts.user)
        transcriptFlushTimeouts.user = null
      }
      if (transcriptFlushTimeouts.assistant) {
        clearTimeout(transcriptFlushTimeouts.assistant)
        transcriptFlushTimeouts.assistant = null
      }
      window.removeEventListener("pagehide", disconnectLivekitImmediately)
      window.removeEventListener("beforeunload", disconnectLivekitImmediately)
      disconnectLivekitImmediately()
    }
  }, [disconnectLivekitClient, stopLivekitRoom])

  return {
    isListening,
    isSupported,
    isSpeaking,
    isConnecting,
    isConnected,
    transcript,
    finalTranscript,
    conversationEntries,
    startListening,
    stopListening,
    startConversation,
    stopConversation,
    startPushToTalk,
    stopPushToTalk,
    speak,
    stopSpeaking,
    clearTranscript,
    inputMethod,
    setInputMethod,
    cancelAutoSend,
    availableVoices,
    selectedVoice,
    setSelectedVoice,
    volume,
    setVolume,
    autoSubmitEnabled,
    setAutoSubmitEnabled,
    estimatedCoins,
    sessionRoomName,
    appendLocalConversationEntry: appendConversationEntry,
  }
}
