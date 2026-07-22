import { NextRequest, NextResponse } from "next/server"
import { RoomServiceClient } from "livekit-server-sdk"

export const runtime = "nodejs"

type StopLivekitRoomRequest = {
  roomName?: string
  participantName?: string
}

const livekitHttpUrl = (value: string) => {
  if (value.startsWith("wss://")) {
    return value.replace(/^wss:\/\//, "https://")
  }
  if (value.startsWith("ws://")) {
    return value.replace(/^ws:\/\//, "http://")
  }
  return value
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

  let body: StopLivekitRoomRequest = {}
  try {
    body = (await request.json()) as StopLivekitRoomRequest
  } catch {
    body = {}
  }

  const roomName = body.roomName?.trim() || ""
  if (!roomName || !roomName.startsWith("a2a-voice-")) {
    return NextResponse.json({ error: "Invalid voice room." }, { status: 400 })
  }
  const participantName = body.participantName?.trim() || ""

  try {
    const roomClient = new RoomServiceClient(livekitHttpUrl(wsUrl), apiKey, apiSecret)
    if (participantName) {
      try {
        await roomClient.removeParticipant(roomName, participantName, {
          revokeTokenTs: BigInt(Math.floor(Date.now() / 1000)),
        })
      } catch {
        // The participant may already be gone; deleting the room is still enough.
      }
    }
    await roomClient.deleteRoom(roomName)
  } catch {
    // Treat missing/already-closed rooms as stopped. The client calls this defensively.
  }

  return NextResponse.json({ ok: true, roomName })
}
