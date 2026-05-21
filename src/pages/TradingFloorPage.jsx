import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../supabase'
import { Send } from 'lucide-react'

export default function TradingFloorPage({ user }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [timeUntilReset, setTimeUntilReset] = useState('')
  const bottomRef = useRef(null)

  const getTimeUntilMidnight = () => {
    const now = new Date()
    const midnight = new Date()
    midnight.setHours(24, 0, 0, 0)
    const diff = midnight - now
    const h = Math.floor(diff / 1000 / 60 / 60)
    const m = Math.floor((diff / 1000 / 60) % 60)
    const s = Math.floor((diff / 1000) % 60)
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  useEffect(() => {
    const timer = setInterval(() => setTimeUntilReset(getTimeUntilMidnight()), 1000)
    setTimeUntilReset(getTimeUntilMidnight())
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const fetchUsername = async () => {
      const { data } = await supabase.from('profiles').select('username').eq('id', user.id).single()
      if (data?.username) setUsername(data.username)
    }
    fetchUsername()
  }, [])

  useEffect(() => {
    const fetchMessages = async () => {
      const since = new Date()
      since.setHours(0, 0, 0, 0)
      const { data } = await supabase
        .from('messages')
        .select('*')
        .gte('created_at', since.toISOString())
        .order('created_at', { ascending: true })
      if (data) setMessages(data)
    }
    fetchMessages()

    const channel = supabase
      .channel('trading-floor')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        setMessages(prev => [...prev, payload.new])
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || loading) return
    if (!username) { alert('Please set a username in your Profile first.'); return }
    setLoading(true)
    const content = input.trim()
    setInput('')
    await supabase.from('messages').insert({ user_id: user.id, username, content })
    setLoading(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const formatTime = (timestamp) => new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  const getAvatarColor = (name) => {
    const colors = ['#7c5cfc', '#e8c84a', '#00ff88', '#ff4466', '#00c8ff', '#ff8c00', '#ff69b4']
    let hash = 0
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
    return colors[Math.abs(hash) % colors.length]
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h2 style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px', marginBottom: '6px' }}>The Trading Floor</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>24H live community. Resets at midnight.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '8px 16px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 8px var(--green)' }} />
          <span style={{ color: 'var(--text-dim)', fontSize: '13px', fontFamily: 'monospace' }}>Resets in {timeUntilReset}</span>
        </div>
      </div>

      <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '600px' }}>
        {/* Header */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-3)' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 6px var(--green)' }} />
          <span style={{ fontWeight: '700', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--gold)' }}>The Trading Floor</span>
          <span style={{ color: 'var(--text-muted)', fontSize: '12px', marginLeft: 'auto' }}>{messages.length} messages today</span>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {messages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
              <p style={{ fontSize: '32px', marginBottom: '12px' }}>🕯️</p>
              <p style={{ fontSize: '15px' }}>The floor is quiet. Be the first to share.</p>
            </div>
          ) : (
            <AnimatePresence>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}
                >
                  <div style={{
                    width: '34px', height: '34px', borderRadius: '50%',
                    background: getAvatarColor(msg.username),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '13px', fontWeight: '800', color: '#000', flexShrink: 0
                  }}>
                    {msg.username?.[0]?.toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                      <span style={{ fontWeight: '700', fontSize: '13px', color: msg.user_id === user.id ? 'var(--gold)' : 'var(--text)' }}>
                        {msg.username}
                      </span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>{formatTime(msg.created_at)}</span>
                    </div>
                    <p style={{ color: 'var(--text-dim)', fontSize: '14px', lineHeight: '1.5', wordBreak: 'break-word' }}>
                      {msg.content}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', background: 'var(--bg-3)', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Share your analysis, setups, thoughts..."
            maxLength={500}
            style={{ flex: 1, padding: '12px 16px', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text)', fontSize: '14px', outline: 'none', fontFamily: 'Inter, sans-serif' }}
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSend}
            disabled={loading || !input.trim()}
            style={{ width: '44px', height: '44px', background: input.trim() ? 'var(--gold)' : 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: input.trim() ? 'pointer' : 'not-allowed', flexShrink: 0 }}
          >
            <Send size={16} color={input.trim() ? '#000' : 'var(--text-muted)'} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}