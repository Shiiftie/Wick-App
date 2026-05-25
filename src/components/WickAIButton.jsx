import React, { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

const SYSTEM_PROMPT = "You are WICK AI, a sophisticated female AI trading assistant built into the Wick trading journal app. You are elegant, precise, confident with sharp wit. Keep responses to 1-3 sentences max. You know trading psychology, risk management, and the Wick platform."

export default function WickAIButton({ user }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isThinking, setIsThinking] = useState(false)
  const [displayTranscript, setDisplayTranscript] = useState("")
  const [response, setResponse] = useState("")
  const [messages, setMessages] = useState([])
  const [error, setError] = useState(null)
  const recRef = useRef(null)
  const audioRef = useRef(null)
  const transcriptRef = useRef("")
  const VOICE_ID = import.meta.env.VITE_ELEVENLABS_VOICE_ID
  const EL_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY
  const gold = "#e8c84a"

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return
    const r = new SR()
    r.continuous = false
    r.interimResults = true
    r.onresult = (e) => {
      const t = Array.from(e.results).map(x => x[0].transcript).join("")
      transcriptRef.current = t
      setDisplayTranscript(t)
    }
    r.onend = () => {
      setIsListening(false)
      const final = transcriptRef.current.trim()
      if (final) sendMessage(final)
    }
    r.onerror = (e) => {
      if (e.error !== "no-speech") setError("Mic error: " + e.error)
      setIsListening(false)
    }
    recRef.current = r
  }, [])

  const startListen = () => {
    if (!recRef.current) return
    transcriptRef.current = ""
    setDisplayTranscript("")
    setResponse("")
    setError(null)
    setIsListening(true)
    try { recRef.current.start() } catch(e) {}
  }

  const stopListen = () => {
    try { recRef.current && recRef.current.stop() } catch(e) {}
  }

  const sendMessage = async (text) => {
    if (!text.trim()) return
    setIsThinking(true)
    const newMsgs = [...messages, { role: "user", content: text }]
    setMessages(newMsgs)
    try {
      const res = await fetch("https://hhxxrhtzhfmfudpmznkx.supabase.co/functions/v1/wick-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMsgs })
      })
      const data = await res.json()
      const reply = data.reply || "Connection error."
      setResponse(reply)
      setMessages([...newMsgs, { role: "assistant", content: reply }])
      setIsThinking(false)
      if (EL_KEY) {
        setIsSpeaking(true)
        const tts = await fetch("https://api.elevenlabs.io/v1/text-to-speech/" + VOICE_ID, {
          method: "POST",
          headers: { "xi-api-key": EL_KEY, "Content-Type": "application/json" },
          body: JSON.stringify({ text: reply, model_id: "eleven_turbo_v2_5", voice_settings: { stability: 0.72, similarity_boost: 0.85 } })
        })
        if (tts.ok) {
          const blob = await tts.blob()
          const url = URL.createObjectURL(blob)
          const audio = new Audio(url)
          audioRef.current = audio
          audio.onended = function() { setIsSpeaking(false); URL.revokeObjectURL(url) }
          audio.play()
        } else { setIsSpeaking(false) }
      }
    } catch (err) {
      setIsThinking(false)
      setIsSpeaking(false)
      setError("Connection issue. Try again.")
    }
  }

  const status = isListening ? "LISTENING" : isSpeaking ? "SPEAKING" : isThinking ? "THINKING" : "STANDBY"

  return (
    <>
      <motion.button
        onClick={() => setIsOpen(o => !o)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        style={{ position: "fixed", bottom: 28, right: 28, zIndex: 1000, width: 56, height: 56, borderRadius: "50%", background: "radial-gradient(circle, rgba(232,200,74,0.15), #050505)", border: "1.5px solid rgba(232,200,74,0.4)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 24px rgba(232,200,74,0.2)" }}
      >
        <span style={{ fontFamily: "monospace", fontSize: 9, fontWeight: 700, color: gold, letterSpacing: 1, textAlign: "center", lineHeight: 1.4 }}>WICK AI</span>
      </motion.button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="wickai-panel"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            style={{ position: "fixed", bottom: 96, right: 24, zIndex: 999, width: 290, background: "rgba(6,6,6,0.97)", border: "1px solid rgba(232,200,74,0.2)", borderRadius: 14, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.8)" }}
          >
            <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: gold, boxShadow: "0 0 6px " + gold }} />
                <div style={{ fontFamily: "monospace", fontSize: 11, color: gold, letterSpacing: 2 }}>WICK AI - {status}</div>
              </div>
              <button onClick={() => { setIsOpen(false); if (audioRef.current) audioRef.current.pause() }} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: 18 }}>x</button>
            </div>
            <div style={{ padding: 16, minHeight: 80 }}>
              {error
                ? <div style={{ fontSize: 12, color: "#ff4466" }}>{error}</div>
                : response
                  ? <div style={{ fontSize: 13, color: "rgba(240,238,232,0.9)", lineHeight: 1.65, fontStyle: "italic" }}>"{response}"</div>
                  : <div style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", fontFamily: "monospace" }}>
                      {isListening ? (displayTranscript || "Listening...") : isThinking ? "Thinking..." : "Tap speak to talk to Wick AI."}
                    </div>
              }
            </div>
            <div style={{ padding: "10px 16px 14px", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", gap: 8 }}>
              <button
                onClick={isListening ? stopListen : startListen}
                disabled={isThinking || isSpeaking}
                style={{ flex: 1, padding: "9px", background: isListening ? "rgba(232,200,74,0.12)" : "rgba(232,200,74,0.05)", border: "1px solid rgba(232,200,74,0.3)", borderRadius: 8, color: gold, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "monospace", letterSpacing: 1, opacity: isThinking || isSpeaking ? 0.4 : 1 }}
              >
                {isListening ? "STOP" : "SPEAK"}
              </button>
              {response && (
                <button
                  onClick={() => { setDisplayTranscript(""); setResponse(""); setError(null); transcriptRef.current = "" }}
                  style={{ padding: "9px 12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "rgba(255,255,255,0.3)", fontSize: 11, cursor: "pointer", fontFamily: "monospace" }}
                >CLR</button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}