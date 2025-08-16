"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import SpeakTTS from "speak-tts"

declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

interface UseVoiceChatOptions {
  onTranscript: (text: string) => void
  onAutoSend: (text: string) => void
  autoSendDelay?: number
  language?: string
}

interface UseVoiceChatReturn {
  isListening: boolean
  isSupported: boolean
  isSpeaking: boolean
  transcript: string
  startListening: () => void
  stopListening: () => void
  speak: (text: string) => void
  stopSpeaking: () => void
  clearTranscript: () => void
}

export function useVoiceChat({
  onTranscript,
  onAutoSend,
  autoSendDelay = 3000,
  language = "en-US",
}: UseVoiceChatOptions): UseVoiceChatReturn {
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [transcript, setTranscript] = useState("")

  const recognitionRef = useRef<any>(null)
  const speakTTSRef = useRef<SpeakTTS | null>(null)
  const autoSendTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastTranscriptRef = useRef("")

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition

      if (SpeechRecognitionAPI) {
        setIsSupported(true)

        const speakTTS = new SpeakTTS()
        speakTTS
          .init({
            volume: 0.8,
            lang: language.split("-")[0],
            rate: 0.9,
            pitch: 1,
            voice: null,
            splitSentences: true,
            listeners: {
              onvoiceschanged: (voices: any) => {
                console.log("[v0] Available voices:", voices)
              },
            },
          })
          .then((data: any) => {
            console.log("[v0] SpeakTTS initialized:", data)
            speakTTSRef.current = speakTTS
          })
          .catch((error: any) => {
            console.error("[v0] SpeakTTS initialization failed:", error)
          })

        const recognition = new SpeechRecognitionAPI()
        recognition.continuous = true
        recognition.interimResults = true
        recognition.lang = language

        recognition.onstart = () => {
          console.log("[v0] Voice recognition started")
          setIsListening(true)
        }

        recognition.onend = () => {
          console.log("[v0] Voice recognition ended")
          setIsListening(false)
        }

        recognition.onerror = (event: any) => {
          console.error("[v0] Voice recognition error:", event.error)
          setIsListening(false)
        }

        recognition.onresult = (event: any) => {
          let finalTranscript = ""
          let interimTranscript = ""

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i]
            if (result.isFinal) {
              finalTranscript += result[0].transcript
            } else {
              interimTranscript += result[0].transcript
            }
          }

          const fullTranscript = lastTranscriptRef.current + finalTranscript + interimTranscript
          setTranscript(fullTranscript)
          onTranscript(fullTranscript)

          if (finalTranscript) {
            lastTranscriptRef.current += finalTranscript

            if (autoSendTimeoutRef.current) {
              clearTimeout(autoSendTimeoutRef.current)
            }

            autoSendTimeoutRef.current = setTimeout(() => {
              if (lastTranscriptRef.current.trim()) {
                console.log("[v0] Auto-sending message after silence")
                onAutoSend(lastTranscriptRef.current.trim())
                clearTranscript()
              }
            }, autoSendDelay)
          }
        }

        recognitionRef.current = recognition
      } else {
        console.warn("[v0] Speech recognition not supported in this browser")
      }
    }
  }, [language, onTranscript, onAutoSend, autoSendDelay])

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start()
      } catch (error) {
        console.error("[v0] Failed to start voice recognition:", error)
      }
    }
  }, [isListening])

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
    }

    if (autoSendTimeoutRef.current) {
      clearTimeout(autoSendTimeoutRef.current)
      autoSendTimeoutRef.current = null
    }
  }, [isListening])

  const speak = useCallback((text: string) => {
    if (!speakTTSRef.current || !text.trim()) return

    speakTTSRef.current.cancel()

    const cleanText = text
      .replace(/```[\s\S]*?```/g, " code block ")
      .replace(/`([^`]+)`/g, " $1 ")
      .replace(/\*\*([^*]+)\*\*/g, " $1 ")
      .replace(/\*([^*]+)\*/g, " $1 ")
      .replace(/#{1,6}\s+/g, "")
      .replace(/\n+/g, " ")
      .trim()

    if (!cleanText) return

    setIsSpeaking(true)

    speakTTSRef.current
      .speak({
        text: cleanText,
        listeners: {
          onstart: () => {
            console.log("[v0] Started speaking")
            setIsSpeaking(true)
          },
          onend: () => {
            console.log("[v0] Finished speaking")
            setIsSpeaking(false)
          },
          onerror: (error: any) => {
            console.error("[v0] Speech synthesis error:", error)
            setIsSpeaking(false)
          },
        },
      })
      .catch((error: any) => {
        console.error("[v0] Speak error:", error)
        setIsSpeaking(false)
      })
  }, [])

  const stopSpeaking = useCallback(() => {
    if (speakTTSRef.current) {
      speakTTSRef.current.cancel()
      setIsSpeaking(false)
    }
  }, [])

  const clearTranscript = useCallback(() => {
    setTranscript("")
    lastTranscriptRef.current = ""

    if (autoSendTimeoutRef.current) {
      clearTimeout(autoSendTimeoutRef.current)
      autoSendTimeoutRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => {
      if (autoSendTimeoutRef.current) {
        clearTimeout(autoSendTimeoutRef.current)
      }
      if (speakTTSRef.current) {
        speakTTSRef.current.cancel()
      }
      if (recognitionRef.current && isListening) {
        recognitionRef.current.stop()
      }
    }
  }, [isListening])

  return {
    isListening,
    isSupported,
    isSpeaking,
    transcript,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    clearTranscript,
  }
}
