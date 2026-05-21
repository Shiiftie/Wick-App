import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../supabase'
import { Target, TrendingUp, Edit2, Check } from 'lucide-react'

export default function GoalTrackerPage({ user, sessions }) {
  const [goal, setGoal] = useState(100000)
  const [editingGoal, setEditingGoal] = useState(false)
  const [goalInput, setGoalInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const fetchGoal = async () => {
      const { data } = await supabase.from('profiles').select('goal_amount').eq('id', user.id).single()
      if (data?.goal_amount) setGoal(data.goal_amount)
    }
    fetchGoal()
  }, [])

  const totalPnl = sessions.reduce((sum, s) => sum + (s.pnl || 0), 0)
  const progress = Math.min((totalPnl / goal) * 100, 100)
  const remaining = Math.max(goal - totalPnl, 0)

  const handleSaveGoal = async () => {
    const amount = parseFloat(goalInput)
    if (!amount || amount <= 0) return
    setLoading(true)
    await supabase.from('profiles').upsert({ id: user.id, goal_amount: amount })
    setGoal(amount)
    setEditingGoal(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    setLoading(false)
  }

  const milestones = [
    { label: '10%', value: goal * 0.1 },
    { label: '25%', value: goal * 0.25 },
    { label: '50%', value: goal * 0.5 },
    { label: '75%', value: goal * 0.75 },
    { label: '100%', value: goal },
  ]

  const winSessions = sessions.filter(s => s.outcome === 'win').length
  const avgWin = sessions.filter(s => s.pnl > 0).reduce((sum, s) => sum + s.pnl, 0) / (sessions.filter(s => s.pnl > 0).length || 1)
  const sessionsToGoal = avgWin > 0 ? Math.ceil(remaining / avgWin) : null

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h2 style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px', marginBottom: '6px' }}>Goal Tracker</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>Your target. Watch it fill up session by session.</p>
        </div>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => { setEditingGoal(true); setGoalInput(goal.toString()) }}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text-dim)', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
          <Edit2 size={13} /> Edit Goal
        </motion.button>
      </div>

      {/* Edit Goal Modal */}
      {editingGoal && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: 'var(--bg-2)', border: '1px solid var(--gold)', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
          <p style={{ fontWeight: '700', marginBottom: '12px' }}>Set Your Goal</p>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '15px' }}>$</span>
              <input type="number" value={goalInput} onChange={(e) => setGoalInput(e.target.value)}
                placeholder="100000"
                style={{ width: '100%', padding: '12px 14px 12px 28px', background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text)', fontSize: '16px', outline: 'none', boxSizing: 'border-box', fontFamily: 'Inter, sans-serif' }} />
            </div>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleSaveGoal} disabled={loading}
              style={{ padding: '12px 20px', background: 'var(--gold)', color: '#000', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Check size={14} /> Save
            </motion.button>
            <button onClick={() => setEditingGoal(false)} style={{ padding: '12px 16px', background: 'transparent', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text-muted)', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
            {[10000, 25000, 50000, 100000, 250000].map(amt => (
              <button key={amt} onClick={() => setGoalInput(amt.toString())}
                style={{ padding: '6px 12px', background: goalInput === amt.toString() ? 'var(--gold)' : 'var(--bg-3)', color: goalInput === amt.toString() ? '#000' : 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                ${amt.toLocaleString()}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Main Progress Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: '20px', padding: '32px', marginBottom: '24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, right: 0, width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(232,200,74,0.05) 0%, transparent 70%)', transform: 'translate(50px, -50px)' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Total P&L</p>
            <p style={{ fontSize: '52px', fontWeight: '900', color: totalPnl >= 0 ? 'var(--green)' : 'var(--red)', letterSpacing: '-2px' }}>
              {totalPnl >= 0 ? '+' : ''} ${totalPnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Goal</p>
            <p style={{ fontSize: '28px', fontWeight: '800', color: 'var(--gold)', letterSpacing: '-1px' }}>${goal.toLocaleString()}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{progress.toFixed(1)}% complete</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>${remaining.toLocaleString()} remaining</span>
          </div>
          <div style={{ background: 'var(--bg-3)', borderRadius: '999px', height: '16px', overflow: 'hidden', position: 'relative' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ delay: 0.3, duration: 1.2, ease: 'easeOut' }}
              style={{
                height: '100%',
                background: progress >= 100 ? 'linear-gradient(90deg, #00ff88, #00c8ff)' : 'linear-gradient(90deg, #e8c84a, #f5e07a)',
                borderRadius: '999px',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <motion.div
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)' }}
              />
            </motion.div>
          </div>
        </div>

        {/* Milestones */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
          {milestones.map((m) => {
            const reached = totalPnl >= m.value
            return (
              <div key={m.label} style={{ flex: 1, textAlign: 'center', padding: '10px 8px', background: reached ? 'rgba(232,200,74,0.1)' : 'var(--bg-3)', border: `1px solid ${reached ? 'rgba(232,200,74,0.3)' : 'var(--border)'}`, borderRadius: '10px' }}>
                <p style={{ fontSize: '16px', marginBottom: '4px' }}>{reached ? '✅' : '🔒'}</p>
                <p style={{ fontSize: '12px', fontWeight: '700', color: reached ? 'var(--gold)' : 'var(--text-muted)' }}>{m.label}</p>
                <p style={{ fontSize: '10px', color: 'var(--text-muted)' }}>${m.value.toLocaleString()}</p>
              </div>
            )
          })}
        </div>
      </motion.div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        {[
          { label: 'Sessions Logged', value: sessions.length, icon: '📊' },
          { label: 'Winning Sessions', value: winSessions, icon: '🏆' },
          { label: 'Est. Sessions to Goal', value: sessionsToGoal ? sessionsToGoal : '—', icon: '🎯' },
        ].map((stat) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: '14px', padding: '20px', textAlign: 'center' }}>
            <p style={{ fontSize: '28px', marginBottom: '8px' }}>{stat.icon}</p>
            <p style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text)', letterSpacing: '-1px' }}>{stat.value}</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '4px' }}>{stat.label}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}