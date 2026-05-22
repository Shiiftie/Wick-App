import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../supabase'
import { Shield, Plus, Trash2, CheckCircle, AlertTriangle, ChevronDown } from 'lucide-react'

const PRESET_CATEGORIES = [
  {
    category: 'Risk Management',
    icon: '🛡️',
    rules: [
      'Never risk more than 1% of my account on a single trade.',
      'Always set a stop loss before entering any trade — no exceptions.',
      'Maximum 3 trades per day. After 3 losses, I stop trading for the day.',
      'Never move my stop loss further away once a trade is open.',
      'If I lose 2 trades in a row, I take a 30-minute break before re-entering.',
      'Never risk more than 3% of my account in a single trading session.',
    ],
  },
  {
    category: 'Entry Discipline',
    icon: '🎯',
    rules: [
      'I only enter trades that align with my pre-market bias.',
      'No trading during the first 15 minutes of market open.',
      'I must see confluence from at least 2 timeframes before entering.',
      'Never chase a trade — if I missed the entry, I wait for the next setup.',
      'I will not trade against the higher timeframe trend.',
      'Only trade during my best performing hours — no random entries.',
    ],
  },
  {
    category: 'Emotional Control',
    icon: '🧠',
    rules: [
      'No revenge trading after a loss. The market owes me nothing.',
      'If I feel frustrated, anxious, or emotional — I close the platform.',
      'I do not trade on days where I am sick, tired, or mentally drained.',
      'I will not increase position size after a losing streak to "make it back".',
      'Profits are not an excuse to break my rules. Discipline is permanent.',
      'I trade the plan, not the P&L. Green days do not justify reckless entries.',
    ],
  },
  {
    category: 'News & Events',
    icon: '📰',
    rules: [
      'I do not hold trades through high-impact news events (NFP, CPI, FOMC).',
      'No new entries 5 minutes before a red-folder news event.',
      'I check the economic calendar every morning before the session.',
      'If I am already in a trade and news is approaching, I reduce size or close.',
    ],
  },
  {
    category: 'Journaling',
    icon: '📋',
    rules: [
      'I log every single session — wins, losses, and no-trade days all count.',
      'Before logging I write what I planned vs what actually happened.',
      'I review my last 10 sessions every Sunday before the new trading week.',
      'I note my emotional state in every session log without judgment.',
    ],
  },
  {
    category: 'Funded Account',
    icon: '💰',
    rules: [
      'I treat the funded account as if it is my own capital — not "someone else\'s money".',
      'Daily drawdown limit is non-negotiable — I stop when I hit it.',
      'Consistency is more important than home runs. Small wins compound.',
      'I never trade on the last day of the evaluation period under pressure.',
    ],
  },
]

export default function TradingRulesPage({ user }) {
  const [rules, setRules] = useState([])
  const [newRule, setNewRule] = useState('')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [acknowledged, setAcknowledged] = useState(false)
  const [showAck, setShowAck] = useState(false)
  const [openCategory, setOpenCategory] = useState(null)
  const [showPresets, setShowPresets] = useState(false)

  useEffect(() => {
    const fetchRules = async () => {
      const { data } = await supabase.from('profiles').select('trading_rules').eq('id', user.id).single()
      if (data?.trading_rules) {
        try { setRules(JSON.parse(data.trading_rules)) } catch { setRules([]) }
      }
      const lastAck = localStorage.getItem(`wick_rules_ack_${user.id}`)
      const today = new Date().toDateString()
      if (lastAck !== today && data?.trading_rules) setShowAck(true)
    }
    fetchRules()
  }, [])

  const handleAddRule = () => {
    if (!newRule.trim()) return
    setRules(prev => [...prev, { id: Date.now(), text: newRule.trim() }])
    setNewRule('')
  }

  const handleAddPreset = (text) => {
    if (rules.find(r => r.text === text)) return // no duplicates
    setRules(prev => [...prev, { id: Date.now(), text }])
  }

  const handleDeleteRule = (id) => setRules(prev => prev.filter(r => r.id !== id))

  const handleSave = async () => {
    setLoading(true)
    await supabase.from('profiles').upsert({ id: user.id, trading_rules: JSON.stringify(rules) })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    setLoading(false)
  }

  const handleAcknowledge = () => {
    localStorage.setItem(`wick_rules_ack_${user.id}`, new Date().toDateString())
    setAcknowledged(true)
    setShowAck(false)
  }

  const handleKeyDown = (e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddRule() } }

  const isAdded = (text) => rules.some(r => r.text === text)

  const inputStyle = {
    flex: 1, padding: '12px 14px',
    background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)',
    borderRadius: '10px', color: 'var(--text)', fontSize: '14px', outline: 'none',
    fontFamily: 'Inter, sans-serif'
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

      {/* Daily Acknowledgement Modal */}
      <AnimatePresence>
        {showAck && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
              style={{ background: 'var(--bg-2)', border: '1px solid rgba(232,200,74,0.3)', borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '480px' }}>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <p style={{ fontSize: '40px', marginBottom: '12px' }}>⚔️</p>
                <h2 style={{ fontSize: '22px', fontWeight: '900', marginBottom: '8px' }}>Your Non-Negotiable Rules</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Read these before you trade today. No exceptions.</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px' }}>
                {rules.map((rule, i) => (
                  <div key={rule.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', background: 'var(--bg-3)', borderRadius: '10px', padding: '12px 16px' }}>
                    <span style={{ color: 'var(--gold)', fontWeight: '800', fontSize: '14px', flexShrink: 0 }}>{i + 1}.</span>
                    <p style={{ fontSize: '14px', color: 'var(--text)', lineHeight: '1.5' }}>{rule.text}</p>
                  </div>
                ))}
              </div>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleAcknowledge}
                style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #e8c84a, #d4b030)', color: '#000', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <CheckCircle size={18} /> I've read my rules. I'm ready to trade.
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px', marginBottom: '6px' }}>Trading Rules</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>Your non-negotiables. Write your own or pick from presets.</p>
      </div>

      {acknowledged && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.3)', borderRadius: '12px', padding: '14px 18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CheckCircle size={16} color="var(--green)" />
          <span style={{ color: 'var(--green)', fontSize: '14px', fontWeight: '600' }}>Rules acknowledged for today. Trade with discipline.</span>
        </motion.div>
      )}

      {rules.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ background: 'rgba(255,140,0,0.08)', border: '1px solid rgba(255,140,0,0.3)', borderRadius: '12px', padding: '14px 18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertTriangle size={16} color="#ff8c00" />
          <span style={{ color: '#ff8c00', fontSize: '14px' }}>No rules set yet. Add your own below or pick from our presets.</span>
        </motion.div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '20px', alignItems: 'start' }}>

        {/* Left — My Rules */}
        <div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            style={{ background: 'rgba(13,13,13,0.8)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px', marginBottom: '16px' }}>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <Shield size={18} color="var(--gold)" />
              <h3 style={{ fontSize: '15px', fontWeight: '700' }}>My Rules {rules.length > 0 && <span style={{ color: 'var(--text-muted)', fontWeight: '400' }}>({rules.length})</span>}</h3>
            </div>

            {rules.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center', padding: '24px 0' }}>No rules yet. Write one below or pick from presets →</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                <AnimatePresence>
                  {rules.map((rule, i) => (
                    <motion.div key={rule.id}
                      initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                      style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '14px 16px', borderLeft: '3px solid var(--gold)' }}>
                      <span style={{ color: 'var(--gold)', fontWeight: '800', fontSize: '14px', flexShrink: 0, minWidth: '20px' }}>{i + 1}.</span>
                      <p style={{ flex: 1, fontSize: '14px', color: 'var(--text)', lineHeight: '1.5' }}>{rule.text}</p>
                      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                        onClick={() => handleDeleteRule(rule.id)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px', flexShrink: 0 }}>
                        <Trash2 size={14} />
                      </motion.button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Write your own rule */}
            <div style={{ marginBottom: '8px' }}>
              <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>Write Your Own Rule</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input type="text" value={newRule} onChange={(e) => setNewRule(e.target.value)} onKeyDown={handleKeyDown}
                  placeholder='e.g. Never trade during news events'
                  maxLength={200}
                  style={inputStyle} />
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleAddRule} disabled={!newRule.trim()}
                  style={{ padding: '12px 16px', background: newRule.trim() ? 'rgba(232,200,74,0.1)' : 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: '10px', color: newRule.trim() ? 'var(--gold)' : 'var(--text-muted)', cursor: newRule.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '700', whiteSpace: 'nowrap' }}>
                  <Plus size={14} /> Add
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Save + Review buttons */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleSave} disabled={loading}
              style={{ padding: '12px 24px', background: 'var(--gold)', color: '#000', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
              {loading ? 'Saving...' : saved ? '✅ Saved!' : 'Save Rules'}
            </motion.button>
            {rules.length > 0 && (
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowAck(true)}
                style={{ padding: '12px 24px', background: 'rgba(13,13,13,0.8)', border: '1px solid var(--border)', borderRadius: '10px', fontSize: '14px', fontWeight: '700', color: 'var(--text-dim)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={14} /> Review Rules
              </motion.button>
            )}
          </div>
        </div>

        {/* Right — Preset Rules */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{ background: 'rgba(13,13,13,0.8)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden' }}>

          <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '16px' }}>📚</span>
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '2px' }}>Preset Rules</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Pick rules from our library to get started fast.</p>
            </div>
          </div>

          <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
            {PRESET_CATEGORIES.map((cat, ci) => (
              <div key={cat.category} style={{ borderBottom: ci < PRESET_CATEGORIES.length - 1 ? '1px solid var(--border)' : 'none' }}>
                {/* Category header */}
                <motion.button whileTap={{ scale: 0.99 }}
                  onClick={() => setOpenCategory(openCategory === ci ? null : ci)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 20px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                  <span style={{ fontSize: '16px' }}>{cat.icon}</span>
                  <span style={{ flex: 1, fontSize: '13px', fontWeight: '700', color: 'var(--text)' }}>{cat.category}</span>
                  <motion.div animate={{ rotate: openCategory === ci ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown size={14} color="var(--text-muted)" />
                  </motion.div>
                </motion.button>

                {/* Rules list */}
                <AnimatePresence>
                  {openCategory === ci && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      style={{ overflow: 'hidden' }}>
                      <div style={{ padding: '0 14px 14px' }}>
                        {cat.rules.map((rule, ri) => {
                          const added = isAdded(rule)
                          return (
                            <div key={ri} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px', borderRadius: '8px', marginBottom: '4px', background: added ? 'rgba(232,200,74,0.05)' : 'rgba(255,255,255,0.02)', border: `1px solid ${added ? 'rgba(232,200,74,0.2)' : 'rgba(255,255,255,0.04)'}`, cursor: added ? 'default' : 'pointer', transition: 'all 0.15s' }}
                              onClick={() => !added && handleAddPreset(rule)}
                              onMouseEnter={e => { if (!added) e.currentTarget.style.background = 'rgba(232,200,74,0.06)' }}
                              onMouseLeave={e => { if (!added) e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}>
                              <p style={{ flex: 1, fontSize: '12px', color: added ? 'var(--text-muted)' : 'var(--text-dim)', lineHeight: '1.5', margin: 0 }}>{rule}</p>
                              <div style={{ flexShrink: 0, width: '20px', height: '20px', borderRadius: '50%', background: added ? 'rgba(232,200,74,0.15)' : 'rgba(255,255,255,0.06)', border: `1px solid ${added ? 'var(--gold)' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {added
                                  ? <CheckCircle size={11} color="var(--gold)" />
                                  : <Plus size={11} color="var(--text-muted)" />
                                }
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}