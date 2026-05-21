import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../supabase'
import { Shield, Plus, Trash2, CheckCircle, AlertTriangle } from 'lucide-react'

export default function TradingRulesPage({ user }) {
  const [rules, setRules] = useState([])
  const [newRule, setNewRule] = useState('')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [acknowledged, setAcknowledged] = useState(false)
  const [showAck, setShowAck] = useState(false)

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

  const handleDeleteRule = (id) => {
    setRules(prev => prev.filter(r => r.id !== id))
  }

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

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); handleAddRule() }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Daily Acknowledgement Modal */}
      <AnimatePresence>
        {showAck && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              style={{ background: 'var(--bg-2)', border: '1px solid rgba(232,200,74,0.3)', borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '480px' }}>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <p style={{ fontSize: '40px', marginBottom: '12px' }}>⚔️</p>
                <h2 style={{ fontSize: '22px', fontWeight: '900', marginBottom: '8px' }}>Your Trading Rules</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Read these before you trade today. Non-negotiable.</p>
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
                <CheckCircle size={18} />
                I've read my rules. I'm ready to trade.
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px', marginBottom: '6px' }}>Trading Rules</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>Your non-negotiables. Read them before every session.</p>
      </div>

      {acknowledged && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.3)', borderRadius: '12px', padding: '14px 18px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CheckCircle size={16} color="var(--green)" />
          <span style={{ color: 'var(--green)', fontSize: '14px', fontWeight: '600' }}>Rules acknowledged for today. Trade with discipline.</span>
        </motion.div>
      )}

      {/* Warning if no rules */}
      {rules.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ background: 'rgba(255,140,0,0.08)', border: '1px solid rgba(255,140,0,0.3)', borderRadius: '12px', padding: '14px 18px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertTriangle size={16} color="#ff8c00" />
          <span style={{ color: '#ff8c00', fontSize: '14px' }}>No rules set yet. Add your trading rules below to stay disciplined.</span>
        </motion.div>
      )}

      {/* Rules List */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <Shield size={18} color="var(--gold)" />
          <h3 style={{ fontSize: '15px', fontWeight: '700' }}>My Rules ({rules.length})</h3>
        </div>

        {rules.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center', padding: '24px 0' }}>No rules yet. Add your first rule below.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            <AnimatePresence>
              {rules.map((rule, i) => (
                <motion.div key={rule.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', background: 'var(--bg-3)', borderRadius: '10px', padding: '14px 16px', borderLeft: '3px solid var(--gold)' }}>
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

        {/* Add Rule Input */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            value={newRule}
            onChange={(e) => setNewRule(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. Never trade during news events"
            maxLength={200}
            style={{ flex: 1, padding: '12px 14px', background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text)', fontSize: '14px', outline: 'none', fontFamily: 'Inter, sans-serif' }}
          />
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleAddRule} disabled={!newRule.trim()}
            style={{ padding: '12px 16px', background: newRule.trim() ? 'var(--bg-3)' : 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: '10px', color: newRule.trim() ? 'var(--gold)' : 'var(--text-muted)', cursor: newRule.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '700' }}>
            <Plus size={14} /> Add
          </motion.button>
        </div>
      </motion.div>

      <div style={{ display: 'flex', gap: '12px' }}>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleSave} disabled={loading}
          style={{ padding: '12px 24px', background: 'var(--gold)', color: '#000', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
          {loading ? 'Saving...' : saved ? '✅ Saved!' : 'Save Rules'}
        </motion.button>

        {rules.length > 0 && (
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowAck(true)}
            style={{ padding: '12px 24px', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: '10px', fontSize: '14px', fontWeight: '700', color: 'var(--text-dim)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={14} /> Review Rules
          </motion.button>
        )}
      </div>
    </motion.div>
  )
}