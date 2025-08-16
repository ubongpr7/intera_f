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
  onInputMethodChange?: (method: "voice" | "text") => void
  onVoiceInterruption?: () => void
  selectedVoice?: SpeechSynthesisVoice | null
  volume?: number
  autoSubmitEnabled?: boolean
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
}

export function useVoiceChat({
  onTranscript,
  onAutoSend,
  autoSendDelay = 6000,
  language = "en-US",
  onInputMethodChange,
  onVoiceInterruption,
  selectedVoice: initialSelectedVoice = null,
  volume: initialVolume = 0.8,
  autoSubmitEnabled: initialAutoSubmitEnabled = false,
}: UseVoiceChatOptions): UseVoiceChatReturn {
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [inputMethod, setInputMethodState] = useState<"voice" | "text">("text")
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([])
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(initialSelectedVoice)
  const [volume, setVolume] = useState(initialVolume)
  const [autoSubmitEnabled, setAutoSubmitEnabled] = useState(initialAutoSubmitEnabled)

  const recognitionRef = useRef<any>(null)
  const speechSynthesisRef = useRef<SpeechSynthesis | null>(null)
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const autoSendTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastTranscriptRef = useRef("")
  const voiceInterruptionTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const typingDetectionRef = useRef<boolean>(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition

      if (SpeechRecognitionAPI && window.speechSynthesis) {
        setIsSupported(true)

        speechSynthesisRef.current = window.speechSynthesis

        const loadVoices = () => {
          const voices = speechSynthesisRef.current?.getVoices() || []
          console.log(
            "[v0] Available voices:",
            voices.length,
            voices.map((v) => ({ name: v.name, lang: v.lang })),
          )
          setAvailableVoices(voices)

          if (!selectedVoice && voices.length > 0) {
            const preferredVoice =
              voices.find((voice) => voice.name.includes("Google") && voice.lang.startsWith("en")) ||
              voices.find((voice) => voice.lang.startsWith("en") && !voice.name.includes("Microsoft")) ||
              voices.find((voice) => voice.lang.startsWith("en")) ||
              voices[0]
            setSelectedVoice(preferredVoice)
          }
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

          if (finalTranscript || interimTranscript) {
            setInputMethodState("voice")
            onInputMethodChange?.("voice")
          }

          if (finalTranscript) {
            lastTranscriptRef.current += finalTranscript

            if (autoSubmitEnabled && !typingDetectionRef.current) {
              if (autoSendTimeoutRef.current) {
                clearTimeout(autoSendTimeoutRef.current)
              }

              autoSendTimeoutRef.current = setTimeout(() => {
                if (lastTranscriptRef.current.trim() && !typingDetectionRef.current) {
                  console.log("[v0] Auto-sending voice message after silence")
                  onAutoSend(lastTranscriptRef.current.trim())
                  clearTranscript()
                }
              }, autoSendDelay)
            }
          }
        }

        recognitionRef.current = recognition
      } else {
        console.warn("[v0] Speech recognition or synthesis not supported in this browser")
      }
    }
  }, [language, onTranscript, onAutoSend, autoSendDelay, onInputMethodChange, autoSubmitEnabled, selectedVoice])

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

  const speak = useCallback(
    (text: string, isVoiceMessage = false) => {
      if (!speechSynthesisRef.current || !text.trim()) {
        console.log("[v0] Cannot speak: missing synthesis or empty text")
        return
      }

      console.log("[v0] Attempting to speak:", text.substring(0, 50) + "...")

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

      if (!cleanText) {
        console.log("[v0] No clean text to speak after processing")
        return
      }

      console.log("[v0] Clean text to speak:", cleanText.substring(0, 100) + "...")

      const utterance = new SpeechSynthesisUtterance(cleanText)

      if (selectedVoice) {
        utterance.voice = selectedVoice
        console.log("[v0] Using selected voice:", selectedVoice.name, selectedVoice.lang)
      }

      utterance.rate = 0.95
      utterance.pitch = 1
      utterance.volume = volume

      console.log(
        "[v0] Speech settings - Rate:",
        utterance.rate,
        "Pitch:",
        utterance.pitch,
        "Volume:",
        utterance.volume,
      )

      utterance.onstart = () => {
        console.log("[v0] Started speaking")
        setIsSpeaking(true)
      }

      utterance.onend = () => {
        console.log("[v0] Finished speaking")
        setIsSpeaking(false)
        currentUtteranceRef.current = null

        if (voiceInterruptionTimeoutRef.current) {
          clearTimeout(voiceInterruptionTimeoutRef.current)
          voiceInterruptionTimeoutRef.current = null
        }
      }

      utterance.onerror = (error) => {
        console.error("[v0] Speech synthesis error:", error)
        setIsSpeaking(false)
        currentUtteranceRef.current = null

        if (voiceInterruptionTimeoutRef.current) {
          clearTimeout(voiceInterruptionTimeoutRef.current)
          voiceInterruptionTimeoutRef.current = null
        }
      }

      currentUtteranceRef.current = utterance

      try {
        console.log("[v0] Calling speechSynthesis.speak()")
        speechSynthesisRef.current.speak(utterance)

        setTimeout(() => {
          if (speechSynthesisRef.current) {
            console.log(
              "[v0] Speech synthesis status - speaking:",
              speechSynthesisRef.current.speaking,
              "pending:",
              speechSynthesisRef.current.pending,
            )
          }
        }, 100)
      } catch (error) {
        console.error("[v0] Error calling speak():", error)
        setIsSpeaking(false)
        currentUtteranceRef.current = null
      }
    },
    [selectedVoice, volume],
  )

  const stopSpeaking = useCallback(() => {
    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.cancel()
      setIsSpeaking(false)
      currentUtteranceRef.current = null
    }

    if (voiceInterruptionTimeoutRef.current) {
      clearTimeout(voiceInterruptionTimeoutRef.current)
      voiceInterruptionTimeoutRef.current = null
    }
  }, [])

  const clearTranscript = useCallback(() => {
    setTranscript("")
    lastTranscriptRef.current = ""

    if (autoSendTimeoutRef.current) {
      clearTimeout(autoSendTimeoutRef.current)
      autoSendTimeoutRef.current = null
    }

    typingDetectionRef.current = false
  }, [])

  const setInputMethod = useCallback(
    (method: "voice" | "text") => {
      setInputMethodState(method)
      onInputMethodChange?.(method)

      if (method === "text") {
        // Stop listening and cancel auto-send when switching to text
        typingDetectionRef.current = true
        if (isListening) {
          stopListening()
        }
        if (autoSendTimeoutRef.current) {
          clearTimeout(autoSendTimeoutRef.current)
          autoSendTimeoutRef.current = null
        }
      } else {
        typingDetectionRef.current = false
      }
    },
    [isListening, stopListening, onInputMethodChange],
  )

  const cancelAutoSend = useCallback(() => {
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
      if (voiceInterruptionTimeoutRef.current) {
        clearTimeout(voiceInterruptionTimeoutRef.current)
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
  }
}
