import { NextRequest, NextResponse } from "next/server";
import {
  GoogleGenAI,
  LiveServerMessage,
  MediaResolution,
  Modality,
  Session,
} from "@google/genai";

export async function POST(req: NextRequest) {
  const { userInput } = await req.json();

  const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_API_KEY,
  });

  const model = "models/gemini-2.5-flash-preview-native-audio-dialog";

  const config = {
    responseModalities: [Modality.AUDIO],
    mediaResolution: MediaResolution.MEDIA_RESOLUTION_MEDIUM,
    speechConfig: {
      voiceConfig: {
        prebuiltVoiceConfig: {
          voiceName: "Zephyr",
        },
      },
    },
  };

  const session = await ai.live.connect({
    model,
    callbacks: {
      onmessage(message: LiveServerMessage) {
        console.log(message);
      },
    },
    config,
  });

  session.sendClientContent({
    turns: [userInput],
  });

  session.close();

  return NextResponse.json({ status: "sent" });
}
