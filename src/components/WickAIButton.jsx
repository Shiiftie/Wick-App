import React, { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

export default function WickAIButton({ user }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isThinking, setIsThinking] = useState(false)
  const [displayTranscript, setDisplayTranscript] = useState("")
  const [response, setResponse] = useState("")
  const [messages, setMessages] = useState([])
  const [error, setError] = useState(null)
  const [muted, setMuted] = useState(false)
  const [textInput, setTextInput] = useState("")
  const [inputMode, setInputMode] = useState("voice")
  const recRef = useRef(null)
  const transcriptRef = useRef("")
  const pauseTimerRef = useRef(null)
  const gold = "#e8c84a"

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return
    const r = new SR()
    r.continuous = true
    r.interimResults = true
    r.onresult = (e) => {
      const t = Array.from(e.results).map(x => x[0].transcript).join("")
      transcriptRef.current = t
      setDisplayTranscript(t)
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current)
      pauseTimerRef.current = setTimeout(() => {
        r.stop()
      }, 5000)
    }
    r.onend = () => {
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current)
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

  const speak = (text) => {
    if (!window.speechSynthesis || muted) return
    window.speechSynthesis.cancel()
    const utt = new SpeechSynthesisUtterance(text)
    const voices = window.speechSynthesis.getVoices()
    const femaleVoice = voices.find(v => v.name === "Google UK English Female") ||
      voices.find(v => v.name.includes("Samantha")) ||
      voices.find(v => v.name.includes("Victoria")) ||
      voices.find(v => v.name.includes("Female")) ||
      voices.find(v => v.lang === "en-US")
    if (femaleVoice) utt.voice = femaleVoice
    utt.rate = 0.95
    utt.pitch = 1.1
    utt.volume = 1
    utt.onstart = () => setIsSpeaking(true)
    utt.onend = () => setIsSpeaking(false)
    utt.onerror = () => setIsSpeaking(false)
    window.speechSynthesis.speak(utt)
  }

  const startListen = () => {
    if (!recRef.current) return
    window.speechSynthesis.cancel()
    transcriptRef.current = ""
    setDisplayTranscript("")
    setResponse("")
    setError(null)
    setIsListening(true)
    try { recRef.current.start() } catch(e) {}
  }

  const stopListen = () => {
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current)
    try { recRef.current && recRef.current.stop() } catch(e) {}
  }

  const sendMessage = async (text) => {
    if (!text.trim()) return
    setIsThinking(true)
    setTextInput("")
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
      speak(reply)
    } catch (err) {
      setIsThinking(false)
      setError("Connection issue. Try again.")
    }
  }

  const handleTextSubmit = (e) => {
    e.preventDefault()
    if (textInput.trim()) sendMessage(textInput.trim())
  }

  const status = isListening ? "LISTENING" : isSpeaking ? "SPEAKING" : isThinking ? "THINKING" : "STANDBY"

  return (
    <>
      <div style={{ position: "fixed", bottom: 28, right: 28, zIndex: 1000 }}>
        <motion.div
          animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          style={{ position: "absolute", inset: -8, borderRadius: "50%", border: "2px solid rgba(232,200,74,0.5)", pointerEvents: "none" }}
        />
        <motion.div
          animate={{ scale: [1, 1.7, 1], opacity: [0.3, 0, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
          style={{ position: "absolute", inset: -8, borderRadius: "50%", border: "2px solid rgba(232,200,74,0.3)", pointerEvents: "none" }}
        />
        <motion.button
          onClick={() => setIsOpen(o => !o)}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          animate={{ boxShadow: ["0 0 12px rgba(232,200,74,0.4)", "0 0 28px rgba(232,200,74,0.8)", "0 0 12px rgba(232,200,74,0.4)"] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          style={{ width: 68, height: 68, borderRadius: "50%", background: "radial-gradient(circle, rgba(232,200,74,0.2), #050505)", border: "2px solid rgba(232,200,74,0.7)", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1 }}
        >
          <span style={{ fontFamily: "monospace", fontSize: 10, fontWeight: 900, color: gold, letterSpacing: 1, lineHeight: 1.2 }}>WICK</span>
          <span style={{ fontFamily: "monospace", fontSize: 10, fontWeight: 900, color: gold, letterSpacing: 1, lineHeight: 1.2 }}>AI</span>
        </motion.button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="wickai-panel"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            style={{ position: "fixed", bottom: 110, right: 24, zIndex: 999, width: 310, background: "rgba(6,6,6,0.97)", border: "1px solid rgba(232,200,74,0.25)", borderRadius: 16, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.8)" }}
          >
            <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(232,200,74,0.03)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <motion.div
                  animate={{ opacity: [1, 0.3, 1], scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  style={{ width: 7, height: 7, borderRadius: "50%", background: gold, boxShadow: "0 0 8px " + gold }}
                />
                <div>
                  <div style={{ fontFamily: "monospace", fontSize: 11, color: gold, letterSpacing: 2 }}>WICK AI</div>
                  <div style={{ fontFamily: "monospace", fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: 1 }}>{status}</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  onClick={() => { setMuted(m => !m); if (!muted) window.speechSynthesis.cancel() }}
                  style={{ background: muted ? "rgba(255,68,102,0.15)" : "rgba(232,200,74,0.08)", border: "1px solid " + (muted ? "rgba(255,68,102,0.4)" : "rgba(232,200,74,0.2)"), borderRadius: 6, color: muted ? "#ff4466" : "rgba(232,200,74,0.6)", cursor: "pointer", padding: "4px 8px", fontSize: 12 }}
                >{muted ? "🔇" : "🔊"}</button>
                <button onClick={() => { setIsOpen(false); window.speechSynthesis.cancel() }} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: 18, lineHeight: 1 }}>×</button>
              </div>
            </div>

            <div style={{ padding: 16, minHeight: 80, maxHeight: 160, overflowY: "auto" }}>
              {error
                ? <div style={{ fontSize: 12, color: "#ff4466" }}>{error}</div>
                : response
                  ? <div style={{ fontSize: 13, color: "rgba(240,238,232,0.9)", lineHeight: 1.65, fontStyle: "italic" }}>"{response}"</div>
                  : <div style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", fontFamily: "monospace" }}>
                      {isListening ? (displayTranscript || "Listening... take your time.") : isThinking ? "Thinking..." : "Speak or type to talk to WICK AI."}
                    </div>
              }
            </div>

            <div style={{ padding: "0 16px 10px", display: "flex", gap: 6 }}>
              <button onClick={() => setInputMode("voice")} style={{ flex: 1, padding: "6px", background: inputMode === "voice" ? "rgba(232,200,74,0.12)" : "rgba(255,255,255,0.03)", border: "1px solid " + (inputMode === "voice" ? "rgba(232,200,74,0.4)" : "rgba(255,255,255,0.08)"), borderRadius: 7, color: inputMode === "voice" ? gold : "rgba(255,255,255,0.3)", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "monospace", letterSpacing: 1 }}>🎙 VOICE</button>
              <button onClick={() => setInputMode("text")} style={{ flex: 1, padding: "6px", background: inputMode === "text" ? "rgba(232,200,74,0.12)" : "rgba(255,255,255,0.03)", border: "1px solid " + (inputMode === "text" ? "rgba(232,200,74,0.4)" : "rgba(255,255,255,0.08)"), borderRadius: 7, color: inputMode === "text" ? gold : "rgba(255,255,255,0.3)", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "monospace", letterSpacing: 1 }}>⌨️ TEXT</button>
            </div>

            {inputMode === "voice" && (
              <div style={{ padding: "0 16px 14px", display: "flex", gap: 8 }}>
                <button
                  onClick={isListening ? stopListen : startListen}
                  disabled={isThinking || isSpeaking}
                  style={{ flex: 1, padding: "10px", background: isListening ? "rgba(232,200,74,0.15)" : "rgba(232,200,74,0.05)", border: "1px solid " + (isListening ? "rgba(232,200,74,0.6)" : "rgba(232,200,74,0.2)"), borderRadius: 9, color: isListening ? gold : "rgba(232,200,74,0.6)", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "monospace", letterSpacing: 1, opacity: isThinking || isSpeaking ? 0.4 : 1 }}
                >{isListening ? "⏹ STOP" : "🎙 SPEAK"}</button>
                {response && <button onClick={() => { setDisplayTranscript(""); setResponse(""); setError(null); transcriptRef.current = "" }} style={{ padding: "10px 14px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 9, color: "rgba(255,255,255,0.3)", fontSize: 11, cursor: "pointer", fontFamily: "monospace" }}>CLR</button>}
              </div>
            )}

            {inputMode === "text" && (
              <form onSubmit={handleTextSubmit} style={{ padding: "0 16px 14px", display: "flex", gap: 8 }}>
                <input
                  value={textInput}
                  onChange={e => setTextInput(e.target.value)}
                  placeholder="Ask WICK AI anything..."
                  disabled={isThinking}
                  style={{ flex: 1, padding: "9px 12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(232,200,74,0.2)", borderRadius: 9, color: "#fff", fontSize: 12, fontFamily: "monospace", outline: "none" }}
                />
                <button type="submit" disabled={isThinking || !textInput.trim()} style={{ padding: "9px 14px", background: "rgba(232,200,74,0.1)", border: "1px solid rgba(232,200,74,0.3)", borderRadius: 9, color: gold, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "monospace", opacity: isThinking || !textInput.trim() ? 0.4 : 1 }}>SEND</button>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}