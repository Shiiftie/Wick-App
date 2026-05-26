import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../supabase'
import { CheckCircle, AlertCircle, FlaskConical } from 'lucide-react'

const inputStyle = {
  width: '100%',
  padding: '12px 16px',
  background: 'var(--bg-3)',
  border: '1px solid var(--border)',
  borderRadius: '10px',
  color: 'var(--text)',
  fontSize: '14px',
  outline: 'none',
  transition: 'border-color 0.2s',
}

const labelStyle = {
  display: 'block',
  color: 'var(--text-dim)',
  fontSize: '12px',
  fontWeight: '600',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  marginBottom: '8px',
}

export default function LogSessionPage({ user, onSessionSaved }) {
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    outcome: '',
    pnl: '',
    emotions: '',
    bias: '',
    analysis: '',
    lessons: ''
  })
  const [isDemo, setIsDemo] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleOutcomeClick = (value) => {
    setForm({ ...form, outcome: value })
    setIsDemo(value === 'demo')
  }

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
      lessons: form.lessons,
      is_demo: isDemo,
    })

    if (error) {
      setError(error.message)
    } else {
      const xpGain = form.outcome === 'win' ? 100 : form.outcome === 'loss' ? 50 : 25
      await supabase.rpc('increment_xp', { user_id_input: user.id, xp_amount: xpGain })
      setSuccess(true)
      setForm({
        date: new Date().toISOString().split('T')[0],
        outcome: '',
        pnl: '',
        emotions: '',
        bias: '',
        analysis: '',
        lessons: ''
      })
      setIsDemo(false)
      setTimeout(() => { onSessionSaved() }, 1500)
    }
    setLoading(false)
  }

  const outcomes = [
    { value: 'win', label: '🟢 Win', color: 'var(--green)' },
    { value: 'loss', label: '🔴 Loss', color: 'var(--red)' },
    { value: 'no_trade', label: '⚪ No Trade', color: 'var(--text-muted)' },
    { value: 'demo', label: '🧪 Demo', color: '#00c8ff' },
  ]

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px', marginBottom: '6px' }}>Log a Session</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>Document your trade. Build your edge.</p>
      </div>

      <AnimatePresence>
        {success && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            style={{ background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.3)', borderRadius: '12px', padding: '16px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <CheckCircle size={18} color="var(--green)" />
            <span style={{ color: 'var(--green)', fontWeight: '600' }}>Session saved! XP earned.</span>
          </motion.div>
        )}
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            style={{ background: 'rgba(255,68,102,0.08)', border: '1px solid rgba(255,68,102,0.3)', borderRadius: '12px', padding: '16px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertCircle size={18} color="var(--red)" />
            <span style={{ color: 'var(--red)', fontWeight: '600' }}>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        style={{ background: 'var(--bg-2)', border: `1px solid ${isDemo ? 'rgba(0,200,255,0.3)' : 'var(--border)'}`, borderRadius: '16px', padding: '32px', transition: 'border-color 0.3s' }}>

        {/* Demo Toggle Banner */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', padding: '14px 18px', borderRadius: '12px', background: isDemo ? 'rgba(0,200,255,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${isDemo ? 'rgba(0,200,255,0.3)' : 'var(--border)'}`, transition: 'all 0.3s' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: isDemo ? 'rgba(0,200,255,0.15)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.3s' }}>
              <FlaskConical size={16} color={isDemo ? '#00c8ff' : 'var(--text-muted)'} />
            </div>
            <div>
              <p style={{ fontSize: '14px', fontWeight: '700', color: isDemo ? '#00c8ff' : 'var(--text)', margin: 0, transition: 'color 0.3s' }}>
                {isDemo ? 'Demo / Paper Trade' : 'Live Trade'}
              </p>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
                {isDemo ? 'This session will be marked as paper trading' : 'Toggle if this was a demo or paper trade'}
              </p>
            </div>
          </div>
          <motion.button
            type="button"
            onClick={() => setIsDemo(d => !d)}
            whileTap={{ scale: 0.95 }}
            style={{
              width: '48px', height: '26px', borderRadius: '13px',
              background: isDemo ? '#00c8ff' : 'var(--bg-3)',
              border: `1px solid ${isDemo ? '#00c8ff' : 'var(--border)'}`,
              cursor: 'pointer', position: 'relative', transition: 'all 0.3s', flexShrink: 0,
            }}
          >
            <motion.div
              animate={{ x: isDemo ? 22 : 2 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              style={{ position: 'absolute', top: '2px', width: '20px', height: '20px', borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }}
            />
          </motion.button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label style={labelStyle}>Date</label>
              <input type="date" name="date" value={form.date} onChange={handleChange} style={inputStyle} required />
            </div>
            <div>
              <label style={labelStyle}>P&L ($)</label>
              <input type="number" name="pnl" value={form.pnl} onChange={handleChange} placeholder="e.g. 250 or -100" style={inputStyle} />
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Outcome</label>
            <div style={{ display: 'flex', gap: '12px' }}>
              {outcomes.map(({ value, label, color }) => (
                <motion.button key={value} type="button" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => handleOutcomeClick(value)}
                  style={{ flex: 1, padding: '12px', borderRadius: '10px', border: form.outcome === value ? `1px solid ${color}` : '1px solid var(--border)', background: form.outcome === value ? `${color}15` : 'var(--bg-3)', color: form.outcome === value ? color : 'var(--text-dim)', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}>
                  {label}
                </motion.button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label style={labelStyle}>Emotions</label>
              <input type="text" name="emotions" value={form.emotions} onChange={handleChange} placeholder="How were you feeling?" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Bias</label>
              <input type="text" name="bias" value={form.bias} onChange={handleChange} placeholder="Bullish, bearish, neutral?" style={inputStyle} />
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Analysis</label>
            <textarea name="analysis" value={form.analysis} onChange={handleChange} placeholder="What did you see in the market? What was your setup?" rows={4} style={{ ...inputStyle, resize: 'vertical' }} />
          </div>

          <div style={{ marginBottom: '28px' }}>
            <label style={labelStyle}>Lessons</label>
            <textarea name="lessons" value={form.lessons} onChange={handleChange} placeholder="What did you learn? What would you do differently?" rows={4} style={{ ...inputStyle, resize: 'vertical' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <motion.button type="submit" disabled={loading || !form.outcome} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              style={{ padding: '14px 32px', background: loading || !form.outcome ? 'var(--bg-3)' : isDemo ? '#00c8ff' : 'var(--gold)', color: loading || !form.outcome ? 'var(--text-muted)' : '#000', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '700', cursor: loading || !form.outcome ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}>
              {loading ? 'Saving...' : 'Save Session'}
            </motion.button>
            {isDemo && (
              <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#00c8ff', fontWeight: '600' }}>
                <FlaskConical size={14} />
                Demo session
              </motion.div>
            )}
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}