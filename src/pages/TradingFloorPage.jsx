import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../supabase'
import { Send } from 'lucide-react'

export default function TradingFloorPage({ user }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [username, setUsername] = useState('')
  const [usernameColor, setUsernameColor] = useState('#e8c84a')
  const [loading, setLoading] = useState(false)
  const [timeUntilReset, setTimeUntilReset] = useState('')
  const [userColors, setUserColors] = useState({})
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
    const fetchProfile = async () => {
      const { data } = await supabase.from('profiles').select('username, username_color').eq('id', user.id).single()
      if (data) {
        setUsername(data.username || '')
        setUsernameColor(data.username_color || '#e8c84a')
      }
    }
    fetchProfile()
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
      if (data) {
        setMessages(data)
        fetchUserColors(data)
      }
    }

    const fetchUserColors = async (msgs) => {
      const userIds = [...new Set(msgs.map(m => m.user_id))]
      const { data } = await supabase.from('profiles').select('id, username_color').in('id', userIds)
      if (data) {
        const colorMap = {}
        data.forEach(p => { colorMap[p.id] = p.username_color || '#e8c84a' })
        setUserColors(colorMap)
      }
    }

    fetchMessages()

    const channel = supabase
      .channel('trading-floor')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, async (payload) => {
        setMessages(prev => [...prev, payload.new])
        const { data } = await supabase.from('profiles').select('id, username_color').eq('id', payload.new.user_id).single()
        if (data) setUserColors(prev => ({ ...prev, [data.id]: data.username_color || '#e8c84a' }))
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
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-3)' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 6px var(--green)' }} />
          <span style={{ fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--gold)' }}>The Trading Floor</span>
          <span style={{ color: 'var(--text-muted)', fontSize: '12px', marginLeft: 'auto' }}>{messages.length} messages today</span>
        </div>

        {/* Messages */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px 16px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start'
        }}>
          {messages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
              <p style={{ fontSize: '32px', marginBottom: '12px' }}>🕯️</p>
              <p style={{ fontSize: '15px' }}>The floor is quiet. Be the first to share.</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} style={{
                fontSize: '14px',
                lineHeight: '1.6',
                wordBreak: 'break-word',
                padding: '2px 0',
                textAlign: 'left',
                width: '100%'
              }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '11px', marginRight: '8px' }}>
                  {formatTime(msg.created_at)}
                </span>
                <span style={{ fontWeight: '700', color: userColors[msg.user_id] || '#e8c84a' }}>
                  {msg.username}
                </span>
                <span style={{ color: 'var(--text-muted)', margin: '0 4px' }}>:</span>
                <span style={{ color: '#e0e0e0' }}>{msg.content}</span>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', background: 'var(--bg-3)', display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0 12px', gap: '6px' }}>
            <span style={{ color: usernameColor, fontWeight: '700', fontSize: '13px', whiteSpace: 'nowrap' }}>{username || 'you'}</span>
            <span style={{ color: 'var(--text-muted)' }}>:</span>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Share your analysis, setups, thoughts..."
              maxLength={500}
              style={{ flex: 1, padding: '10px 0', background: 'transparent', border: 'none', color: 'var(--text)', fontSize: '14px', outline: 'none', fontFamily: 'Inter, sans-serif' }}
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSend}
            disabled={loading || !input.trim()}
            style={{ width: '40px', height: '40px', background: input.trim() ? 'var(--gold)' : 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: input.trim() ? 'pointer' : 'not-allowed', flexShrink: 0 }}
          >
            <Send size={15} color={input.trim() ? '#000' : 'var(--text-muted)'} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}