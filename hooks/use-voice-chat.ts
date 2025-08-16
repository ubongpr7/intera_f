"use client"

import { useCallback, useEffect, useRef, useState } from "react"

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
  autoSendDelay = 6000,
  language = "en-US",
}: UseVoiceChatOptions): UseVoiceChatReturn {
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [transcript, setTranscript] = useState("")

  const recognitionRef = useRef<any>(null)
  const speechSynthesisRef = useRef<SpeechSynthesis | null>(null)
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const autoSendTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastTranscriptRef = useRef("")

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition

      if (SpeechRecognitionAPI && window.speechSynthesis) {
        setIsSupported(true)

        speechSynthesisRef.current = window.speechSynthesis

        // Wait for voices to load
        const loadVoices = () => {
          const voices = speechSynthesisRef.current?.getVoices() || []
          console.log(
            "[v0] Available voices:",
            voices.length,
            voices.map((v) => ({ name: v.name, lang: v.lang })),
          )
        }

        if (speechSynthesisRef.current.getVoices().length > 0) {
          loadVoices()
        } else {
          speechSynthesisRef.current.addEventListener("voiceschanged", loadVoices)
        }

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
        console.warn("[v0] Speech recognition or synthesis not supported in this browser")
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
    if (!speechSynthesisRef.current || !text.trim()) return

    // Cancel any ongoing speech
    speechSynthesisRef.current.cancel()

    const cleanText = text
      .replace(/```[\s\S]*?```/g, " code block ")
      .replace(/`([^`]+)`/g, " $1 ")
      .replace(/\*\*([^*]+)\*\*/g, " $1 ")
      .replace(/\*([^*]+)\*/g, " $1 ")
      .replace(/#{1,6}\s+/g, "")
      .replace(/\n+/g, " ")
      .trim()

    if (!cleanText) return

    const utterance = new SpeechSynthesisUtterance(cleanText)

    // Get available voices and prefer English ones
    const voices = speechSynthesisRef.current.getVoices()
    const englishVoice = voices.find((voice) => voice.lang.startsWith("en")) || voices[0]

    if (englishVoice) {
      utterance.voice = englishVoice
    }

    utterance.rate = 0.9
    utterance.pitch = 1
    utterance.volume = 0.8

    utterance.onstart = () => {
      console.log("[v0] Started speaking")
      setIsSpeaking(true)
    }

    utterance.onend = () => {
      console.log("[v0] Finished speaking")
      setIsSpeaking(false)
      currentUtteranceRef.current = null
    }

    utterance.onerror = (error) => {
      console.error("[v0] Speech synthesis error:", error)
      setIsSpeaking(false)
      currentUtteranceRef.current = null
    }

    currentUtteranceRef.current = utterance
    speechSynthesisRef.current.speak(utterance)
  }, [])

  const stopSpeaking = useCallback(() => {
    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.cancel()
      setIsSpeaking(false)
      currentUtteranceRef.current = null
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
      if (speechSynthesisRef.current) {
        speechSynthesisRef.current.cancel()
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
