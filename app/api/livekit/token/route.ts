import { NextRequest, NextResponse } from "next/server"
import { RoomAgentDispatch, RoomConfiguration } from "@livekit/protocol"
import { AccessToken } from "livekit-server-sdk"

export const runtime = "nodejs"

type LivekitTokenRequest = {
  roomName?: string
  participantName?: string
  metadata?: Record<string, string> | string
  agentName?: string
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.LIVEKIT_API_KEY?.trim()
  const apiSecret = process.env.LIVEKIT_API_SECRET?.trim()
  const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL?.trim()

  if (!apiKey || !apiSecret || !wsUrl) {
    return NextResponse.json(
      { error: "LiveKit credentials are not configured." },
      { status: 500 },
    )
  }

  let body: LivekitTokenRequest = {}
  try {
    body = (await request.json()) as LivekitTokenRequest
  } catch {
    body = {}
  }

  const roomName =
    body.roomName?.trim() ||
    `a2a-voice-${new Date().toISOString().replace(/[:.]/g, "-")}`
  const participantName =
    body.participantName?.trim() || "Intera voice participant"
  const agentName = body.agentName?.trim() || process.env.NEXT_PUBLIC_LIVEKIT_VOICE_AGENT_NAME?.trim() || "ka2a-voice"
  let metadataPayload: Record<string, string> = {}
  if (typeof body.metadata === "string") {
    try {
      const parsedMetadata = JSON.parse(body.metadata)
      metadataPayload =
        parsedMetadata && typeof parsedMetadata === "object"
          ? Object.fromEntries(
              Object.entries(parsedMetadata).map(([key, value]) => [key, String(value)]),
            )
          : {}
    } catch {
      metadataPayload = {}
    }
  } else {
    metadataPayload = Object.fromEntries(
      Object.entries(body.metadata || {}).map(([key, value]) => [key, String(value)]),
    )
  }
  const metadata = JSON.stringify({
    ...metadataPayload,
    roomName,
    participantName,
    agentName,
  })

  const token = new AccessToken(apiKey, apiSecret, {
    identity: participantName,
    name: participantName,
    metadata: metadata || undefined,
  })

  const roomConfig = new RoomConfiguration({
    emptyTimeout: 30,
    departureTimeout: 1,
    agents: [
      new RoomAgentDispatch({
        agentName,
        metadata: metadata || undefined,
      }),
    ],
  })
  token.roomConfig = roomConfig

  token.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
    canUpdateOwnMetadata: true,
  })

  return NextResponse.json({
    token: await token.toJwt(),
    wsUrl,
    roomName,
    identity: participantName,
    agentName,
  })
}
