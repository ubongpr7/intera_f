import { NextResponse } from "next/server"

// Importing on the server only
import { AccessToken } from "livekit-server-sdk"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const room = searchParams.get("room")
    const identity = searchParams.get("identity") || `web-${Math.random().toString(36).slice(2)}`

    const LIVEKIT_SERVER_URL = process.env.LIVEKIT_SERVER_URL
    const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY
    const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET

    if (!LIVEKIT_SERVER_URL || !LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
      return NextResponse.json(
        { error: "Missing LiveKit environment variables (LIVEKIT_SERVER_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET)" },
        { status: 500 },
      )
    }

    if (!room) {
      return NextResponse.json({ error: "Missing room parameter" }, { status: 400 })
    }

    const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity,
    })

    at.addGrant({
      room,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    })

    const token = await at.toJwt()

    return NextResponse.json({
      token,
      url: LIVEKIT_SERVER_URL,
      identity,
      room,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 })
  }
}
