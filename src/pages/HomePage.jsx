import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../supabase'
import { CheckCircle, TrendingUp, TrendingDown, Minus, Crown, Medal, Send, ChevronDown } from 'lucide-react'
import ReportCard from '../components/ReportCard'

const RANKS = [
  { name: 'Stone Hands', min: 0, max: 499, color: '#888', icon: '🪨' },
  { name: 'Bronze Wick', min: 500, max: 1499, color: '#CD7F32', icon: '🥉' },
  { name: 'Silver Wick', min: 1500, max: 2999, color: '#C0C0C0', icon: '🥈' },
  { name: 'Gold Wick', min: 3000, max: 5999, color: '#FFD700', icon: '🥇' },
  { name: 'Platinum Wick', min: 6000, max: 9999, color: '#00c8ff', icon: '⚡' },
  { name: 'Diamond Wick', min: 10000, max: 14999, color: '#b9f2ff', icon: '💠' },
  { name: 'Obsidian Wick', min: 15000, max: 24999, color: '#7c5cfc', icon: '🌑' },
  { name: 'Crimson Wick', min: 25000, max: 39999, color: '#ff4466', icon: '🔴' },
  { name: 'Phantom Wick', min: 40000, max: 59999, color: '#e0aaff', icon: '👻' },
  { name: 'Titan Wick', min: 60000, max: 99999, color: '#ff8c00', icon: '⚔️' },
  { name: 'Legend Wick', min: 100000, max: 199999, color: '#e8c84a', icon: '🏆' },
  { name: 'Wick God', min: 200000, max: Infinity, color: '#fff', icon: '👁️' },
]

function getRank(xp) {
  return RANKS.find(r => xp >= r.min && xp <= r.max) || RANKS[0]
}

function SessionLogForm({ user, onSessionSaved }) {
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    outcome: '',
    pnl: '',
    emotions: '',
    bias: '',
    analysis: '',
    lessons: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)
    const { error } = await supabase.from('sessions').insert({
      user_id: user.id,
      date: form.date,
      outcome: form.outcome,
      pnl: form.pnl ? parseFloat(form.pnl) : null,
      emotions: form.emotions,
      bias: form.bias,
      analysis: form.analysis,
      lessons: form.lessons
    })
    if (error) {
      setError(error.message)
    } else {
      const xpGain = form.outcome === 'win' ? 100 : form.outcome === 'loss' ? 50 : 25
      await supabase.rpc('increment_xp', { user_id_input: user.id, xp_amount: xpGain })
      setSuccess(true)
      setForm({ date: new Date().toISOString().split('T')[0], outcome: '', pnl: '', emotions: '', bias: '', analysis: '', lessons: '' })
      setExpanded(false)
      onSessionSaved()
      setTimeout(() => setSuccess(false), 3000)
    }
    setLoading(false)
  }

  const inputStyle = {
    width: '100%', padding: '10px 14px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid var(--border)',
    borderRadius: '8px', color: 'var(--text)',
    fontSize: '14px', outline: 'none',
    boxSizing: 'border-box', fontFamily: 'Inter, sans-serif'
  }

  const outcomes = [
    { value: 'win', label: '🟢 Win', color: 'var(--green)' },
    { value: 'loss', label: '🔴 Loss', color: 'var(--red)' },
    { value: 'no_trade', label: '⚪ No Trade', color: 'var(--text-muted)' },
  ]

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      style={{ background: 'rgba(13,13,13,0.8)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px', marginBottom: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '2px' }}>Log Today's Session</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Document your trade before the details fade.</p>
        </div>
        <AnimatePresence>
          {success && (
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--green)', fontSize: '13px', fontWeight: '700' }}>
              <CheckCircle size={14} /> Saved!
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
          <div>
            <label style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>Date</label>
            <input type="date" name="date" value={form.date} onChange={handleChange} style={inputStyle} required />
          </div>
          <div>
            <label style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>Outcome</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              {outcomes.map(({ value, label, color }) => (
                <motion.button key={value} type="button" whileTap={{ scale: 0.95 }}
                  onClick={() => setForm({ ...form, outcome: value })}
                  style={{ flex: 1, padding: '10px 4px', borderRadius: '8px', border: form.outcome === value ? `1px solid ${color}` : '1px solid var(--border)', background: form.outcome === value ? `${color}15` : 'rgba(255,255,255,0.03)', color: form.outcome === value ? color : 'var(--text-muted)', fontSize: '12px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.15s' }}>
                  {label}
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>P&L ($)</label>
          <input type="number" name="pnl" value={form.pnl} onChange={handleChange} placeholder="e.g. 250 or -100" style={inputStyle} />
        </div>

        <motion.button type="button" onClick={() => setExpanded(!expanded)} whileTap={{ scale: 0.98 }}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '13px', cursor: 'pointer', marginBottom: expanded ? '12px' : '0', padding: '4px 0' }}>
          <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown size={14} />
          </motion.div>
          {expanded ? 'Less fields' : 'Add thoughts, emotions, analysis...'}
        </motion.button>

        <AnimatePresence>
          {expanded && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>Emotions</label>
                  <input type="text" name="emotions" value={form.emotions} onChange={handleChange} placeholder="How were you feeling?" style={inputStyle} />
                </div>
                <div>
                  <label style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>Bias</label>
                  <input type="text" name="bias" value={form.bias} onChange={handleChange} placeholder="Bullish, bearish, neutral?" style={inputStyle} />
                </div>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>Before: What's your plan?</label>
                <textarea name="analysis" value={form.analysis} onChange={handleChange} placeholder="What are you seeing in the market? What's your setup?" rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>After: What did you learn?</label>
                <textarea name="lessons" value={form.lessons} onChange={handleChange} placeholder="What happened? What would you do differently?" rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && <p style={{ color: 'var(--red)', fontSize: '13px', marginBottom: '12px' }}>{error}</p>}

        <motion.button type="submit" disabled={loading || !form.outcome} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          style={{ padding: '12px 28px', background: loading || !form.outcome ? 'var(--bg-3)' : 'var(--gold)', color: loading || !form.outcome ? 'var(--text-muted)' : '#000', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: loading || !form.outcome ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}>
          {loading ? 'Saving...' : 'Save Session'}
        </motion.button>
      </form>
    </motion.div>
  )
}

function SessionFeed({ sessions }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
      <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '12px', color: 'var(--text-dim)' }}>Recent Sessions</h3>
      {sessions.length === 0 ? (
        <div style={{ background: 'rgba(13,13,13,0.8)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)', borderRadius: '14px', padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
          No sessions yet. Log your first one above. 👆
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {sessions.slice(0, 10).map((s, i) => (
            <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              style={{ background: 'rgba(13,13,13,0.8)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)', borderRadius: '14px', padding: '16px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: s.analysis || s.lessons ? '12px' : '0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: s.outcome === 'win' ? 'rgba(0,255,136,0.1)' : s.outcome === 'loss' ? 'rgba(255,68,102,0.1)' : 'rgba(136,136,136,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {s.outcome === 'win' ? <TrendingUp size={15} color="var(--green)" /> : s.outcome === 'loss' ? <TrendingDown size={15} color="var(--red)" /> : <Minus size={15} color="var(--text-muted)" />}
                  </div>
                  <div>
                    <p style={{ fontWeight: '700', fontSize: '14px' }}>{s.date}</p>
                    <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', textTransform: 'capitalize', background: s.outcome === 'win' ? 'rgba(0,255,136,0.1)' : s.outcome === 'loss' ? 'rgba(255,68,102,0.1)' : 'rgba(136,136,136,0.1)', color: s.outcome === 'win' ? 'var(--green)' : s.outcome === 'loss' ? 'var(--red)' : 'var(--text-muted)' }}>
                      {s.outcome.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <p style={{ fontSize: '18px', fontWeight: '800', color: !s.pnl ? 'var(--text-muted)' : s.pnl >= 0 ? 'var(--green)' : 'var(--red)', letterSpacing: '-0.5px' }}>
                  {s.pnl ? `${s.pnl >= 0 ? '+' : ''}$${s.pnl}` : '—'}
                </p>
              </div>
              {s.analysis && (
                <div style={{ marginBottom: '8px' }}>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Before</p>
                  <p style={{ fontSize: '13px', color: 'var(--text-dim)', lineHeight: '1.5' }}>{s.analysis}</p>
                </div>
              )}
              {s.lessons && (
                <div>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>After</p>
                  <div style={{ background: 'rgba(232,200,74,0.06)', borderLeft: '2px solid var(--gold)', borderRadius: '0 6px 6px 0', padding: '8px 12px' }}>
                    <p style={{ fontSize: '13px', color: 'var(--text-dim)', lineHeight: '1.5' }}>{s.lessons}</p>
                  </div>
                </div>
              )}
              {(s.emotions || s.bias) && (
                <div style={{ display: 'flex', gap: '6px', marginTop: '10px', flexWrap: 'wrap' }}>
                  {s.emotions && <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '11px', background: 'var(--bg-3)', color: 'var(--text-dim)', border: '1px solid var(--border)' }}>😶 {s.emotions}</span>}
                  {s.bias && <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '11px', background: 'var(--bg-3)', color: 'var(--text-dim)', border: '1px solid var(--border)' }}>📈 {s.bias}</span>}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  )
}

function TradingFloorSidebar({ user }) {
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
      if (data) { setUsername(data.username || ''); setUsernameColor(data.username_color || '#e8c84a') }
    }
    fetchProfile()
  }, [])

  useEffect(() => {
    const fetchMessages = async () => {
      const since = new Date()
      since.setHours(0, 0, 0, 0)
      const { data } = await supabase.from('messages').select('*').gte('created_at', since.toISOString()).order('created_at', { ascending: true })
      if (data) {
        setMessages(data)
        const userIds = [...new Set(data.map(m => m.user_id))]
        if (userIds.length > 0) {
          const { data: profiles } = await supabase.from('profiles').select('id, username_color').in('id', userIds)
          if (profiles) {
            const colorMap = {}
            profiles.forEach(p => { colorMap[p.id] = p.username_color || '#e8c84a' })
            setUserColors(colorMap)
          }
        }
      }
    }
    fetchMessages()
    const channel = supabase.channel('trading-floor-sidebar')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, async (payload) => {
        setMessages(prev => [...prev, payload.new])
        const { data } = await supabase.from('profiles').select('id, username_color').eq('id', payload.new.user_id).single()
        if (data) setUserColors(prev => ({ ...prev, [data.id]: data.username_color || '#e8c84a' }))
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const handleSend = async () => {
    if (!input.trim() || loading) return
    if (!username) { alert('Set a username in Profile first.'); return }
    setLoading(true)
    const content = input.trim()
    setInput('')
    await supabase.from('messages').insert({ user_id: user.id, username, content })
    setLoading(false)
  }

  const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }
  const formatTime = (ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
      style={{ background: 'rgba(13,13,13,0.8)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '520px' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.3)' }}>
        <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 6px var(--green)' }} />
        <span style={{ fontWeight: '700', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--gold)', flex: 1 }}>Trading Floor</span>
        <span style={{ color: 'var(--text-muted)', fontSize: '10px', fontFamily: 'monospace' }}>{timeUntilReset}</span>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px', display: 'flex', flexDirection: 'column' }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: '13px' }}>🕯️ The floor is quiet.</div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} style={{ fontSize: '13px', lineHeight: '1.6', wordBreak: 'break-word', padding: '2px 0' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '10px', marginRight: '6px' }}>{formatTime(msg.created_at)}</span>
              <span style={{ fontWeight: '700', color: userColors[msg.user_id] || '#e8c84a' }}>{msg.username}</span>
              <span style={{ color: 'var(--text-muted)', margin: '0 3px' }}>:</span>
              <span style={{ color: '#e0e0e0' }}>{msg.content}</span>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
      <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border)', background: 'rgba(0,0,0,0.3)', display: 'flex', gap: '8px', alignItems: 'center' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0 10px', gap: '6px' }}>
          <span style={{ color: usernameColor, fontWeight: '700', fontSize: '12px', whiteSpace: 'nowrap' }}>{username || 'you'}</span>
          <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>:</span>
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown}
            placeholder="Share your thoughts..." maxLength={500}
            style={{ flex: 1, padding: '8px 0', background: 'transparent', border: 'none', color: 'var(--text)', fontSize: '13px', outline: 'none', fontFamily: 'Inter, sans-serif' }} />
        </div>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleSend} disabled={loading || !input.trim()}
          style={{ width: '34px', height: '34px', background: input.trim() ? 'var(--gold)' : 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: input.trim() ? 'pointer' : 'not-allowed', flexShrink: 0 }}>
          <Send size={13} color={input.trim() ? '#000' : 'var(--text-muted)'} />
        </motion.button>
      </div>
    </motion.div>
  )
}

function LeaderboardSidebar() {
  const [leaders, setLeaders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('profiles').select('username, xp, avatar_url, username_color').order('xp', { ascending: false }).limit(5)
      if (data) setLeaders(data)
      setLoading(false)
    }
    fetch()
  }, [])

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
      style={{ background: 'rgba(13,13,13,0.8)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)', borderRadius: '16px', padding: '16px', marginBottom: '12px' }}>
      <h3 style={{ fontSize: '13px', fontWeight: '700', marginBottom: '14px', color: 'var(--text-dim)' }}>🏆 Top Traders</h3>
      {loading ? <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Loading...</p> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {leaders.map((l, i) => {
            const icons = ['🥇', '🥈', '🥉', '4', '5']
            return (
              <div key={l.username || i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: i < 3 ? '14px' : '11px', width: '18px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: '700' }}>{icons[i]}</span>
                <div style={{ width: '26px', height: '26px', borderRadius: '50%', overflow: 'hidden', background: 'linear-gradient(135deg, #7c5cfc, #e8c84a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '800', color: '#fff', flexShrink: 0 }}>
                  {l.avatar_url ? <img src={l.avatar_url} alt="av" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : l.username?.[0]?.toUpperCase()}
                </div>
                <span style={{ flex: 1, fontSize: '12px', fontWeight: '600', color: l.username_color || 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.username}</span>
                <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--gold)' }}>{(l.xp || 0).toLocaleString()}</span>
              </div>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}

function StatsBar({ sessions, xp }) {
  const wins = sessions.filter(s => s.outcome === 'win').length
  const losses = sessions.filter(s => s.outcome === 'loss').length
  const winRate = sessions.length > 0 ? Math.round((wins / (wins + losses || 1)) * 100) : 0
  const totalPnl = sessions.reduce((sum, s) => sum + (s.pnl || 0), 0)
  const rank = getRank(xp)

  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
      style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', marginBottom: '20px' }}>
      {[
        { label: 'Sessions', value: sessions.length },
        { label: 'Win Rate', value: `${winRate}%` },
        { label: 'Total P&L', value: `$${totalPnl.toFixed(0)}`, color: totalPnl >= 0 ? 'var(--green)' : 'var(--red)' },
        { label: 'XP', value: xp.toLocaleString(), color: 'var(--gold)' },
        { label: 'Rank', value: `${rank.icon} ${rank.name}`, color: rank.color },
      ].map((stat) => (
        <div key={stat.label} style={{ background: 'rgba(13,13,13,0.8)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)', borderRadius: '12px', padding: '14px 16px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{stat.label}</p>
          <p style={{ fontSize: '15px', fontWeight: '800', color: stat.color || 'var(--text)', letterSpacing: '-0.3px' }}>{stat.value}</p>
        </div>
      ))}
    </motion.div>
  )
}

export default function HomePage({ user, sessions, onSessionSaved, xp }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <StatsBar sessions={sessions} xp={xp} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px', alignItems: 'start' }}>
        <div>
          <SessionLogForm user={user} onSessionSaved={onSessionSaved} />
          <ReportCard user={user} />
          <div style={{ marginTop: '24px' }}>
            <SessionFeed sessions={sessions} />
          </div>
        </div>
        <div style={{ position: 'sticky', top: '80px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <LeaderboardSidebar />
          <TradingFloorSidebar user={user} />
        </div>
      </div>
    </motion.div>
  )
}