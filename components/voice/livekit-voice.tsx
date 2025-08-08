"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import {
  Room,
  RoomEvent,
  Track,
  RemoteTrackPublication,
  RemoteParticipant,
  createLocalAudioTrack,
  ConnectionState,
  type LocalAudioTrack,
  type RemoteTrack,
} from "livekit-client"
import { Mic, MicOff, PhoneCall, PhoneOff, Volume2 } from 'lucide-react'

type Props = {
  roomName: string
  tokenEndpoint?: string // defaults to /api/livekit/token
  autoConnect?: boolean
  onConnectedChange?: (connected: boolean) => void
}

export default function LiveKitVoice({
  roomName,
  tokenEndpoint = "/api/livekit/token",
  autoConnect = true,
  onConnectedChange,
}: Props) {
  const roomRef = useRef<Room | null>(null)
  const [connected, setConnected] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [muted, setMuted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const localAudioTrackRef = useRef<LocalAudioTrack | null>(null)
  const remoteAudioEls = useRef<Map<string, HTMLAudioElement>>(new Map())

  const cleanup = useCallback(async () => {
    try {
      // Stop/publish off local track
      if (localAudioTrackRef.current) {
        localAudioTrackRef.current.stop()
        localAudioTrackRef.current = null
      }
      if (roomRef.current) {
        await roomRef.current.disconnect()
        roomRef.current = null
      }
    } catch {
      // ignore
    } finally {
      setConnected(false)
      setMuted(false)
      onConnectedChange?.(false)
      // Remove remote audio elements
      remoteAudioEls.current.forEach((el) => {
        try {
          el.pause()
          el.srcObject = null
          el.remove()
        } catch {}
      })
      remoteAudioEls.current.clear()
    }
  }, [onConnectedChange])

  const handleTrackSubscribed = useCallback((track: RemoteTrack, pub: RemoteTrackPublication, participant: RemoteParticipant) => {
    if (track.kind === Track.Kind.Audio) {
      const id = participant.identity + ":" + pub.sid
      let el = remoteAudioEls.current.get(id)
      if (!el) {
        el = document.createElement("audio")
        el.autoplay = true
        // el.playsInline = true
        el.dataset.participant = participant.identity
        document.body.appendChild(el) // we keep it off-UI; can be moved into a portal if desired
        remoteAudioEls.current.set(id, el)
      }
      track.attach(el)
    }
  }, [])

  const handleTrackUnsubscribed = useCallback((track: RemoteTrack, pub: RemoteTrackPublication, participant: RemoteParticipant) => {
    if (track.kind === Track.Kind.Audio) {
      const id = participant.identity  + ":" + pub.trackSid
      const el = remoteAudioEls.current.get(id)
      if (el) {
        track.detach(el)
        try {
          el.pause()
          el.srcObject = null
          el.remove()
        } catch {}
        remoteAudioEls.current.delete(id)
      }
    }
  }, [])

  const connect = useCallback(async () => {
    if (connecting || connected) return
    setError(null)
    setConnecting(true)
    try {
      const res = await fetch(`${tokenEndpoint}?room=${encodeURIComponent(roomName)}`)
      if (!res.ok) {
        throw new Error(`Token endpoint error: ${res.status}`)
      }
      const { token, url } = await res.json()
      if (!token || !url) throw new Error("Invalid token response")

      const room = new Room({
        // optional: set audio capture defaults here
      })
      roomRef.current = room

      // room event listeners
      room
        .on(RoomEvent.ConnectionStateChanged, (state: ConnectionState) => {
          if (state === ConnectionState.Connected) {
            setConnected(true)
            onConnectedChange?.(true)
          }
          if (state === ConnectionState.Disconnected) {
            setConnected(false)
            onConnectedChange?.(false)
          }
        })
        .on(RoomEvent.TrackSubscribed, handleTrackSubscribed)
        .on(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed)

      await room.connect(url, token)

      // publish microphone
      const localAudio = await createLocalAudioTrack()
      localAudioTrackRef.current = localAudio
      await room.localParticipant.publishTrack(localAudio)
      setMuted(false)
    } catch (e: any) {
      setError(e?.message ?? "Failed to connect")
      await cleanup()
    } finally {
      setConnecting(false)
    }
  }, [roomName, tokenEndpoint, handleTrackSubscribed, handleTrackUnsubscribed, connecting, connected, cleanup, onConnectedChange])

  const disconnect = useCallback(async () => {
    await cleanup()
  }, [cleanup])

  const toggleMute = useCallback(async () => {
    const track = localAudioTrackRef.current
    if (!track) return
    const next = !muted
    try {
      if (next) {
        track.mute()
      } else {
        track.unmute()
      }
      setMuted(next)
    } catch {
      // ignore
    }
  }, [muted])

  useEffect(() => {
    if (autoConnect) {
      connect()
    }
    return () => {
      cleanup()
    }
  }, [autoConnect, connect, cleanup])

  return (
    <div className="w-full rounded-lg border border-gray-200 bg-white">
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-2">
          <Volume2 className="h-4 w-4 text-gray-600" />
          <div className="text-sm">
            <div className="font-medium">{connected ? "Voice session active" : connecting ? "Connecting..." : "Voice ready"}</div>
            <div className="text-xs text-gray-500">Room: {roomName}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleMute}
            disabled={!connected}
            className={`rounded-full p-2 ${!connected ? "opacity-50 cursor-not-allowed bg-gray-200" : muted ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-700"}`}
            aria-label={muted ? "Unmute microphone" : "Mute microphone"}
            title={muted ? "Unmute" : "Mute"}
          >
            {muted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>
          {connected ? (
            <button
              onClick={disconnect}
              className="rounded-full p-2 bg-red-600 text-white hover:bg-red-700"
              aria-label="End voice session"
              title="End call"
            >
              <PhoneOff className="h-5 w-5" />
            </button>
          ) : (
            <button
              onClick={connect}
              disabled={connecting}
              className="rounded-full p-2 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              aria-label="Start voice session"
              title="Start call"
            >
              <PhoneCall className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
      {error ? <div className="px-3 pb-3 text-xs text-red-600">{error}</div> : null}
    </div>
  )
}
