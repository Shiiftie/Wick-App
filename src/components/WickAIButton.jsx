import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const WICK AI_SYSTEM_PROMPT = `You are WICK AI — a sophisticated female AI trading assistant built into Wick, a professional trading journal and simulator app. You speak exactly like WICK AI from Iron Man: composed, precise, British-accented in tone, elegant, precise, confident, with sharp wit and warmth. You address the user with poise and authority. You are knowledgeable about trading, markets, risk management, and the Wick platform specifically.

About Wick:
- Trading journal app at app.thewickapp.com
- Features: Session logging, Paper trading simulator, XP/rank system (12 tiers from Stone Hands to Wick God), 25+ badges, Trading Floor community, Economic Calendar, TradingView charts, Trading Rules vault, Friends & DMs
- $9.99/month
- The user's rank is based on XP earned through disciplined trading behavior

Your role:
- Be their personal AI trading coach and accountability partner
- Give sharp, concise trading insights and psychology coaching
- Comment on their performance, discipline, and mindset
- Keep responses SHORT — 1-3 sentences max unless they ask for detail
- Always end with something subtly motivating or witty
- Never say "I" at the start — vary your sentence starters
- Sound like WICK AI, not like a generic chatbot

Examples of your tone:
"Your win rate this week sits at 67%. Acceptable, though I suspect you can do better."
"Revenge trading detected in your last three sessions. Shall I pull up your rules vault as a reminder?"
"The market opens in 14 minutes. I trust you have a plan, not just a hope."
`

export default function WickAIButton({ user, sessionStats }) {
  const [isOpen, setIsOpen]       = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking]   = useState(false)
  const [isThinking, setIsThinking]   = useState(false)
  const [transcript, setTranscript]   = useState('')
  const [response, setResponse]       = useState('')
  const [messages, setMessages]       = useState([])
  const [error, setError]             = useState(null)
  const [audioViz, setAudioViz]       = useState([])

  const recognitionRef = useRef(null)
  const audioRef       = useRef(null)
  const vizIntervalRef = useRef(null)

  const API_KEY  = import.meta.env.VITE_ELEVENLABS_API_KEY
  const VOICE_ID = import.meta.env.VITE_ELEVENLABS_VOICE_ID || 'rL5thyifUCj65q3mamdf'

  // Build context string about user
  const userContext = user ? `
Current user: ${user.username || 'Unknown'}
Rank: ${user.rank || 'Stone Hands'}
XP: ${user.xp || 0}
${sessionStats ? `Win rate this week: ${sessionStats.winRate || 'N/A'}%
Total P&L: $${sessionStats.totalPnl || 0}
Sessions logged: ${sessionStats.sessions || 0}` : ''}
` : ''

  // Initialize speech recognition
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Speech recognition not supported in this browser.')
      return
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const rec = new SR()
    rec.continuous = false
    rec.interimResults = true
    rec.lang = 'en-US'

    rec.onresult = (e) => {
      const t = Array.from(e.results).map(r => r[0].transcript).join('')
      setTranscript(t)
    }
    rec.onend = () => {
      setIsListening(false)
      if (transcript.trim()) handleSend(transcript.trim())
    }
    rec.onerror = (e) => {
      setIsListening(false)
      if (e.error !== 'no-speech') setError(`Mic error: ${e.error}`)
    }
    recognitionRef.current = rec
  }, [transcript])

  // Audio visualizer
  const startViz = () => {
    vizIntervalRef.current = setInterval(() => {
      setAudioViz(Array.from({length: 12}, () => 4 + Math.random() * 28))
    }, 80)
  }
  const stopViz = () => {
    clearInterval(vizIntervalRef.current)
    setAudioViz(Array.from({length: 12}, () => 4))
  }

  const startListening = () => {
    if (!recognitionRef.current) return
    setTranscript('')
    setResponse('')
    setError(null)
    setIsListening(true)
    startViz()
    recognitionRef.current.start()
  }

  const stopListening = () => {
    recognitionRef.current?.stop()
    setIsListening(false)
    stopViz()
  }

  // Send to Claude API then speak with ElevenLabs
  const handleSend = async (text) => {
    if (!text.trim()) return
    setIsThinking(true)
    stopViz()

    const newMessages = [...messages, { role: 'user', content: text }]
    setMessages(newMessages)

    try {
      // Step 1: Get AI response from Claude via Anthropic API
      const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 180,
          system: WICK AI_SYSTEM_PROMPT + '\n\nUser context:\n' + userContext,
          messages: newMessages,
        }),
      })

      if (!aiRes.ok) throw new Error('AI error: ' + aiRes.status)
      const aiData = await aiRes.json()
      const wickaiText = aiData.content?.[0]?.text || "Systems temporarily offline, sir."

      setResponse(wickaiText)
      setMessages([...newMessages, { role: 'assistant', content: wickaiText }])
      setIsThinking(false)

      // Step 2: Speak with ElevenLabs
      if (API_KEY) {
        setIsSpeaking(true)
        startViz()
        const ttsRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
          method: 'POST',
          headers: {
            'xi-api-key': API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: wickaiText,
            model_id: 'eleven_monolingual_v1',
            voice_settings: {
              stability: 0.72,
              similarity_boost: 0.85,
              style: 0.18,
              use_speaker_boost: true,
            },
          }),
        })

        if (ttsRes.ok) {
          const blob = await ttsRes.blob()
          const url  = URL.createObjectURL(blob)
          const audio = new Audio(url)
          audioRef.current = audio
          audio.onended = () => { setIsSpeaking(false); stopViz(); URL.revokeObjectURL(url) }
          audio.play()
        } else {
          setIsSpeaking(false)
          stopViz()
        }
      } else {
        setIsThinking(false)
      }
    } catch (err) {
      setIsThinking(false)
      setIsSpeaking(false)
      stopViz()
      setError('Connection issue. Try again.')
      console.error('WickAI error:', err)
    }
  }

  const handleMicClick = () => {
    if (isListening) stopListening()
    else if (!isSpeaking && !isThinking) startListening()
  }

  const pulseColor = isListening ? '#e8c84a' : isSpeaking ? '#00ff88' : isThinking ? '#4488ff' : '#e8c84a'

  return (
    <>
      {/* Floating WickAI Button */}
      <motion.div
        style={{ position: 'fixed', bottom: 28, right: 28, zIndex: 1000 }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
      >
        <motion.button
          onClick={() => { if (!isOpen) setIsOpen(true); else handleMicClick() }}
          animate={{ boxShadow: isListening || isSpeaking
            ? [`0 0 0 0 ${pulseColor}44`, `0 0 0 16px ${pulseColor}00`]
            : `0 4px 24px rgba(232,200,74,0.25)` }}
          transition={{ duration: 1.2, repeat: isListening || isSpeaking ? Infinity : 0 }}
          style={{
            width: 58, height: 58, borderRadius: '50%',
            background: isOpen
              ? `radial-gradient(circle, ${pulseColor}22, #0a0a0a)`
              : 'radial-gradient(circle, #1a1a0a, #050505)',
            border: `1.5px solid ${pulseColor}55`,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative', overflow: 'visible',
          }}
        >
          {/* Arc reactor rings */}
          <div style={{
            position: 'absolute', inset: -4, borderRadius: '50%',
            border: `1px solid ${pulseColor}22`,
            animation: isListening || isSpeaking ? 'wickaiSpin 3s linear infinite' : 'none',
          }} />
          <div style={{
            position: 'absolute', inset: -8, borderRadius: '50%',
            border: `1px solid ${pulseColor}11`,
            animation: isListening || isSpeaking ? 'wickaiSpin 5s linear infinite reverse' : 'none',
          }} />

          {/* Icon */}
          {isThinking ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              style={{ width: 22, height: 22, borderRadius: '50%', border: `2px solid ${pulseColor}`, borderTopColor: 'transparent' }}
            />
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              {isListening ? (
                <>
                  <circle cx="12" cy="10" r="4" stroke={pulseColor} strokeWidth="1.5"/>
                  <path d="M6 10c0 3.314 2.686 6 6 6s6-2.686 6-6" stroke={pulseColor} strokeWidth="1.5" strokeLinecap="round"/>
                  <line x1="12" y1="16" x2="12" y2="20" stroke={pulseColor} strokeWidth="1.5" strokeLinecap="round"/>
                </>
              ) : isSpeaking ? (
                <>
                  <path d="M3 9v6h4l5 5V4L7 9H3z" fill={pulseColor} opacity="0.8"/>
                  <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" fill={pulseColor}/>
                  <path d="M19 12c0 3.04-1.73 5.68-4.25 7.01l.76 1.37C18.9 18.57 21 15.46 21 12s-2.1-6.57-5.49-8.38l-.76 1.37C17.27 6.32 19 8.96 19 12z" fill={pulseColor} opacity="0.5"/>
                </>
              ) : (
                <>
                  <circle cx="12" cy="12" r="3" fill={pulseColor} opacity="0.9"/>
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" fill={pulseColor} opacity="0.4"/>
                  <text x="12" y="16" textAnchor="middle" fill={pulseColor} fontSize="9" fontWeight="bold" fontFamily="monospace">J</text>
                </>
              )}
            </svg>
          )}
        </motion.button>

        {/* Tooltip when closed */}
        {!isOpen && (
          <div style={{
            position: 'absolute', bottom: '110%', right: 0,
            background: 'rgba(10,10,10,0.95)', border: '1px solid rgba(232,200,74,0.2)',
            borderRadius: 8, padding: '6px 12px',
            fontSize: 11, color: 'rgba(232,200,74,0.8)',
            fontFamily: 'DM Mono, monospace', letterSpacing: '1.5px',
            whiteSpace: 'nowrap', pointerEvents: 'none',
            opacity: 0, transition: 'opacity 0.2s',
          }}
          className="wickai-tooltip">
            WICK AI
          </div>
        )}
      </motion.div>

      {/* WickAI Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            style={{
              position: 'fixed', bottom: 100, right: 24, zIndex: 999,
              width: 320, background: 'rgba(6,6,6,0.97)',
              border: '1px solid rgba(232,200,74,0.18)',
              borderRadius: 16, overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(232,200,74,0.05)',
            }}
          >
            {/* Header */}
            <div style={{
              padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'rgba(232,200,74,0.04)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%', background: pulseColor,
                  boxShadow: `0 0 8px ${pulseColor}`,
                  animation: isSpeaking || isListening ? 'blink 0.8s ease-in-out infinite' : 'none',
                }} />
                <div>
                  <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: '#e8c84a', letterSpacing: '2px' }}>
                    WICK AI
                  </div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: '1px', fontFamily: 'DM Mono, monospace' }}>
                    {isListening ? 'LISTENING...' : isSpeaking ? 'SPEAKING...' : isThinking ? 'PROCESSING...' : 'STANDING BY'}
                  </div>
                </div>
              </div>
              <button onClick={() => { setIsOpen(false); audioRef.current?.pause() }}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 16, padding: 4 }}>
                ×
              </button>
            </div>

            {/* Audio visualizer */}
            {(isListening || isSpeaking) && (
              <div style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, background: 'rgba(0,0,0,0.3)' }}>
                {(audioViz.length ? audioViz : Array(12).fill(4)).map((h, i) => (
                  <motion.div key={i}
                    animate={{ height: h }}
                    transition={{ duration: 0.08 }}
                    style={{ width: 3, borderRadius: 2, background: pulseColor, minHeight: 4, opacity: 0.8 }}
                  />
                ))}
              </div>
            )}

            {/* Response area */}
            <div style={{ padding: '16px', minHeight: 80, maxHeight: 180, overflowY: 'auto' }}>
              {error ? (
                <div style={{ fontSize: 12, color: '#ff4466', fontFamily: 'DM Mono, monospace' }}>{error}</div>
              ) : response ? (
                <div style={{ fontSize: 13, color: 'rgba(240,238,232,0.88)', lineHeight: 1.65, fontStyle: 'italic' }}>
                  "{response}"
                </div>
              ) : transcript && !isListening ? (
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', fontFamily: 'DM Mono, monospace' }}>
                  Processing: "{transcript}"
                </div>
              ) : (
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', fontFamily: 'DM Mono, monospace', lineHeight: 1.7 }}>
                  {isListening ? `"${transcript || '...'}"` : 'Tap the mic and speak, sir.'}
                </div>
              )}
            </div>

            {/* Transcript while listening */}
            {isListening && transcript && (
              <div style={{ padding: '0 16px 8px', fontSize: 11, color: 'rgba(232,200,74,0.5)', fontFamily: 'DM Mono, monospace' }}>
                "{transcript}"
              </div>
            )}

            {/* Controls */}
            <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: 8, alignItems: 'center' }}>
              <motion.button
                onClick={handleMicClick}
                disabled={isThinking || isSpeaking}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  flex: 1, padding: '10px',
                  background: isListening
                    ? 'rgba(232,200,74,0.15)'
                    : 'rgba(232,200,74,0.06)',
                  border: `1px solid ${isListening ? 'rgba(232,200,74,0.5)' : 'rgba(232,200,74,0.15)'}`,
                  borderRadius: 9, color: isListening ? '#e8c84a' : 'rgba(232,200,74,0.6)',
                  fontSize: 11, fontWeight: 700, cursor: isThinking || isSpeaking ? 'not-allowed' : 'pointer',
                  fontFamily: 'DM Mono, monospace', letterSpacing: '1.5px',
                  opacity: isThinking || isSpeaking ? 0.4 : 1,
                  transition: 'all 0.2s',
                }}
              >
                {isListening ? '⏹ STOP' : '🎙 SPEAK'}
              </motion.button>

              {(response || transcript) && (
                <motion.button
                  onClick={() => { setTranscript(''); setResponse(''); setError(null) }}
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  style={{
                    padding: '10px 14px', background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)', borderRadius: 9,
                    color: 'rgba(255,255,255,0.3)', fontSize: 11, cursor: 'pointer',
                    fontFamily: 'DM Mono, monospace',
                  }}
                >
                  CLR
                </motion.button>
              )}
            </div>

            {/* Footer hint */}
            <div style={{ padding: '0 16px 12px', fontSize: 9, color: 'rgba(255,255,255,0.12)', fontFamily: 'DM Mono, monospace', letterSpacing: '1px' }}>
              WICK AI · POWERED BY ELEVENLABS
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes wickaiSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0.2; } }
        .wickai-tooltip { opacity: 0 !important; }
        button:hover .wickai-tooltip { opacity: 1 !important; }
      `}</style>
    </>
  )
}