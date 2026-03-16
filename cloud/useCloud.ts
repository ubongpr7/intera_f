"use client"

export function useCloud() {
  return {
    wsUrl: process.env.NEXT_PUBLIC_LIVEKIT_URL ?? "",
    generateToken: async () => {
      throw new Error("LiveKit cloud token generation is not configured in this frontend.")
    },
  }
}
