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
}

const normalizeTranscriptText = (value: string) => value.trim().replace(/\s+/g, " ")

const collapseRepeatedTranscriptText = (value: string) => {
  const normalizedText = normalizeTranscriptText(value)
  if (!normalizedText) {
    return ""
  }

  const words = normalizedText.split(" ")
  for (let size = 1; size <= Math.floor(words.length / 2); size += 1) {
    if (words.length % size !== 0) {
      continue
    }
    const phrase = words.slice(0, size)
    let repeated = true
    for (let index = 0; index < words.length; index += size) {
      if (words.slice(index, index + size).join(" ") !== phrase.join(" ")) {
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
    const key = normalizedText.toLowerCase()
    if (seen.has(key)) {
      continue
    }
    seen.add(key)
    uniqueTexts.push(normalizedText)
  }

  return uniqueTexts
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
  const lastFinalTranscriptBySpeakerRef = useRef<{ user: string; assistant: string }>({ user: "", assistant: "" })
  const processedTranscriptSegmentKeysRef = useRef<Set<string>>(new Set())
  const pendingTranscriptBySpeakerRef = useRef<{ user: string; assistant: string }>({ user: "", assistant: "" })
  const onTranscriptRef = useRef(onTranscript)
  const onAutoSendRef = useRef(onAutoSend)
  const onInputMethodChangeRef = useRef(onInputMethodChange)
  const livekitRoomRef = useRef<Room | null>(null)
  const livekitTrackRef = useRef<Awaited<ReturnType<typeof createLocalAudioTrack>> | null>(null)
  const livekitCleanupRef = useRef<(() => Promise<void>) | null>(null)
  const livekitStartPromiseRef = useRef<Promise<void> | null>(null)
  const livekitStopPromiseRef = useRef<Promise<void> | null>(null)
  const livekitStartAbortRef = useRef<AbortController | null>(null)
  const livekitSessionGenerationRef = useRef(0)
  const sessionRoomNameRef = useRef<string | null>(null)
  const remoteAudioElementsRef = useRef<Map<string, HTMLMediaElement>>(new Map())

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
    lastTranscriptRef.current = ""
    lastFinalTranscriptBySpeakerRef.current = { user: "", assistant: "" }
    processedTranscriptSegmentKeysRef.current.clear()
    pendingTranscriptBySpeakerRef.current = { user: "", assistant: "" }
    setTranscript("")
    setFinalTranscript("")
    setConversationEntries([])
    setIsListening(false)
  }, [])

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

      livekitCleanupRef.current = null
      livekitRoomRef.current = null
      livekitTrackRef.current = null
      sessionRoomNameRef.current = null
      setSessionRoomName(null)
      setSessionStartedAt(null)
      setEstimatedCoins(0)
      setTranscript("")
      setFinalTranscript("")
      setConversationEntries([])
      lastTranscriptRef.current = ""
      lastFinalTranscriptBySpeakerRef.current = { user: "", assistant: "" }
      processedTranscriptSegmentKeysRef.current.clear()
      pendingTranscriptBySpeakerRef.current = { user: "", assistant: "" }
      if (transcriptFlushTimeoutRef.current.user) {
        clearTimeout(transcriptFlushTimeoutRef.current.user)
        transcriptFlushTimeoutRef.current.user = null
      }
      if (transcriptFlushTimeoutRef.current.assistant) {
        clearTimeout(transcriptFlushTimeoutRef.current.assistant)
        transcriptFlushTimeoutRef.current.assistant = null
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
        if (room && track) {
          try {
            await room.localParticipant.unpublishTrack(track)
          } catch {
            // ignore unpublish errors on disconnect
          }
        }
        if (track) {
          try {
            track.stop()
          } catch {
            // ignore cleanup errors
          }
        }
        if (room) {
          try {
            room.disconnect()
          } catch {
            // ignore cleanup errors
          }
        }
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
  }, [stopLivekitRoom])

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
        if (last && last.speaker === speaker && last.text === normalizedText) {
          return current
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

      appendConversationEntry(speaker, normalizedText)
      onSpeechEnd?.()

      if (speaker === "user" && autoSubmitEnabled) {
        if (autoSendTimeoutRef.current) {
          clearTimeout(autoSendTimeoutRef.current)
        }
        autoSendTimeoutRef.current = setTimeout(() => {
          onAutoSendRef.current(normalizedText)
          setTranscript("")
          setFinalTranscript("")
        }, Math.max(150, Math.min(autoSendDelay / 4, 1200)))
      }
    },
    [appendConversationEntry, autoSendDelay, autoSubmitEnabled, onSpeechEnd],
  )

  const queueBufferedTranscript = useCallback(
    (speaker: "user" | "assistant", text: string) => {
      const normalizedText = collapseRepeatedTranscriptText(text)
      if (!normalizedText) {
        return
      }

      const pendingText = pendingTranscriptBySpeakerRef.current[speaker]
      if (pendingText && pendingText === normalizedText) {
        return
      }
      if (pendingText && pendingText.endsWith(` ${normalizedText}`)) {
        return
      }
      pendingTranscriptBySpeakerRef.current[speaker] = collapseRepeatedTranscriptText(
        pendingText ? `${pendingText} ${normalizedText}` : normalizedText,
      )

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
      }, speaker === "user" ? Math.max(900, Math.min(autoSendDelay, 2500)) : 450)
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

      if (livekitStopPromiseRef.current) {
        await livekitStopPromiseRef.current
      }
      if (livekitRoomRef.current) {
        return
      }
      if (isStaleStart()) {
        return
      }

      setIsConnecting(true)
      let generatedRoomName = ""
      try {
        generatedRoomName =
          sessionRoomNameRef.current ||
          livekitRoomName ||
          `a2a-voice-${new Date().toISOString().replace(/[:.]/g, "-")}-${Math.random().toString(16).slice(2, 8)}`
        sessionRoomNameRef.current = generatedRoomName
        setSessionRoomName(generatedRoomName)

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
          setIsSpeaking(true)
          onSpeechStart?.()
        })
        room.on(RoomEvent.TranscriptionReceived, (segments, participant) => {
          const localIdentity = room.localParticipant.identity
          const speakerIdentity = participant?.identity || ""
          if (!speakerIdentity) {
            return
          }
          const speaker: "user" | "assistant" = speakerIdentity === localIdentity ? "user" : "assistant"

          const isFinal = segments.some((segment) => segment.final)
          if (listeningResetTimeoutRef.current) {
            clearTimeout(listeningResetTimeoutRef.current)
            listeningResetTimeoutRef.current = null
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

          const newFinalTexts: string[] = []
          for (const segment of segments) {
            if (!segment.final) {
              continue
            }
            const segmentText = segment.text.trim().replace(/\s+/g, " ")
            if (!segmentText) {
              continue
            }
            const segmentId = typeof segment.id === "string" && segment.id ? segment.id : segmentText.toLowerCase()
            const segmentKey = `${speaker}:${segmentId}`
            if (processedTranscriptSegmentKeysRef.current.has(segmentKey)) {
              continue
            }
            processedTranscriptSegmentKeysRef.current.add(segmentKey)
            newFinalTexts.push(segmentText)
          }

          const transcriptText = collapseRepeatedTranscriptText(uniqueTranscriptTexts(newFinalTexts).join(" "))
          if (!transcriptText) {
            if (speaker === "user") {
              setIsListening(false)
            } else {
              setIsSpeaking(false)
            }
            onSpeechEnd?.()
            return
          }

          if (speaker === "user" && transcriptText === lastTranscriptRef.current) {
            setIsListening(false)
            onSpeechEnd?.()
            return
          }
          if (speaker === "assistant" && transcriptText === lastFinalTranscriptBySpeakerRef.current.assistant) {
            setIsSpeaking(false)
            onSpeechEnd?.()
            return
          }

          queueBufferedTranscript(speaker, transcriptText)
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
          await stopLivekitRoom(generatedRoomName)
          return
        }

        const localTrack = await createLocalAudioTrack({
          echoCancellation: true,
          noiseSuppression: true,
        })
        await room.localParticipant.publishTrack(localTrack)
        if (isStaleStart()) {
          try {
            await room.localParticipant.unpublishTrack(localTrack)
          } catch {
            // ignore stale cleanup errors
          }
          try {
            localTrack.stop()
          } catch {
            // ignore stale cleanup errors
          }
          room.disconnect()
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
            await stopLivekitRoom(generatedRoomName)
          }
          return
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
    cleanupLivekitSession,
    livekitAgentName,
    livekitMetadata,
    livekitParticipantName,
    livekitRoomName,
    onSpeechEnd,
    onSpeechStart,
    queueBufferedTranscript,
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

      try {
        track?.stop()
      } catch {
        // ignore unload cleanup errors
      }
      try {
        room?.disconnect()
      } catch {
        // ignore unload cleanup errors
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
  }, [stopLivekitRoom])

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
  }
}
