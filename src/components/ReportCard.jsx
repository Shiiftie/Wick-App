import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../supabase'

function getWeekRange(weeksAgo = 0) {
  const now = new Date()
  const day = now.getDay()
  const monday = new Date(now)
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1) - weeksAgo * 7)
  monday.setHours(0, 0, 0, 0)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)
  return { start: monday, end: sunday }
}

function getMonthRange(monthsAgo = 0) {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1)
  const end = new Date(now.getFullYear(), now.getMonth() - monthsAgo + 1, 0, 23, 59, 59)
  return { start, end }
}

function getGrade(winRate, sessions, totalPnl) {
  if (sessions === 0) return { letter: '—', color: 'var(--text-muted)', desc: 'No sessions logged yet.' }
  let score = 0
  if (winRate >= 70) score += 40
  else if (winRate >= 50) score += 25
  else score += 10
  if (sessions >= 5) score += 30
  else if (sessions >= 3) score += 20
  else score += 10
  if (totalPnl > 0) score += 30
  else if (totalPnl === 0) score += 15

  if (score >= 90) return { letter: 'A+', color: '#00ff88', desc: 'Elite performance. You traded with full discipline and consistency.' }
  if (score >= 80) return { letter: 'A', color: '#00ff88', desc: 'Excellent week. Strong win rate and solid discipline.' }
  if (score >= 70) return { letter: 'B+', color: '#e8c84a', desc: 'Strong performance. One or two things held you back from an A.' }
  if (score >= 60) return { letter: 'B', color: '#e8c84a', desc: 'Good week overall. Focus on consistency and win rate improvement.' }
  if (score >= 50) return { letter: 'C+', color: '#ff8c00', desc: 'Average week. More sessions and better discipline will move the needle.' }
  if (score >= 40) return { letter: 'C', color: '#ff8c00', desc: 'Room to grow. Keep logging — the data will guide you.' }
  return { letter: 'D', color: 'var(--red)', desc: 'Tough period. Review your losses and come back stronger next week.' }
}

function getEmotionBreakdown(sessions) {
  const emotionMap = {}
  sessions.forEach(s => {
    if (!s.emotions) return
    const key = s.emotions.toLowerCase().trim()
    emotionMap[key] = (emotionMap[key] || 0) + 1
  })
  const total = Object.values(emotionMap).reduce((a, b) => a + b, 0)
  if (total === 0) return []
  return Object.entries(emotionMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([emotion, count]) => ({
      emotion,
      pct: Math.round((count / total) * 100)
    }))
}

function getInsight(sessions) {
  if (sessions.length === 0) return "Log sessions to receive personalized insights."
  const wins = sessions.filter(s => s.outcome === 'win')
  const losses = sessions.filter(s => s.outcome === 'loss')
  const winRate = sessions.length > 0 ? Math.round((wins.length / sessions.length) * 100) : 0
  const avgPnl = sessions.filter(s => s.pnl).reduce((sum, s) => sum + s.pnl, 0) / (sessions.filter(s => s.pnl).length || 1)
  const calmSessions = sessions.filter(s => s.emotions?.toLowerCase().includes('calm') || s.emotions?.toLowerCase().includes('focus'))
  const calmWinRate = calmSessions.length > 0 ? Math.round((calmSessions.filter(s => s.outcome === 'win').length / calmSessions.length) * 100) : null
  const noTrades = sessions.filter(s => s.outcome === 'no_trade')

  let insight = ''
  if (calmWinRate !== null && calmWinRate > winRate) {
    insight += `Your win rate when calm/focused was ${calmWinRate}% — higher than your overall ${winRate}%. `
  }
  if (losses.length > 0 && wins.length > 0) {
    insight += `You had ${wins.length} wins and ${losses.length} losses. `
  }
  if (noTrades.length > 0) {
    insight += `You showed discipline by skipping ${noTrades.length} session${noTrades.length > 1 ? 's' : ''} when conditions weren't right. `
  }
  if (avgPnl > 0) {
    insight += `Your average P&L was +$${avgPnl.toFixed(0)} per session. Keep it up.`
  } else if (avgPnl < 0) {
    insight += `Focus on cutting losers smaller. Review what caused the drawdown.`
  }
  return insight || "Keep logging consistently. Patterns will emerge over time."
}

export default function ReportCard({ user }) {
  const [period, setPeriod] = useState('week')
  const [sessions, setSessions] = useState([])
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProfile = async () => {
      const { data } = await supabase.from('profiles').select('username').eq('id', user.id).single()
      if (data) setUsername(data.username || user.email)
    }
    fetchProfile()
  }, [])

  useEffect(() => {
    const fetchSessions = async () => {
      setLoading(true)
      const range = period === 'week' ? getWeekRange(0) : getMonthRange(0)
      const { data } = await supabase.from('sessions').select('*')
        .eq('user_id', user.id)
        .gte('date', range.start.toISOString().split('T')[0])
        .lte('date', range.end.toISOString().split('T')[0])
        .order('date', { ascending: false })
      if (data) setSessions(data)
      setLoading(false)
    }
    fetchSessions()
  }, [period])

  const wins = sessions.filter(s => s.outcome === 'win').length
  const losses = sessions.filter(s => s.outcome === 'loss').length
  const noTrades = sessions.filter(s => s.outcome === 'no_trade').length
  const winRate = (wins + losses) > 0 ? Math.round((wins / (wins + losses)) * 100) : 0
  const totalPnl = sessions.reduce((sum, s) => sum + (s.pnl || 0), 0)
  const xpEarned = wins * 100 + losses * 50 + noTrades * 25
  const grade = getGrade(winRate, sessions.length, totalPnl)
  const emotions = getEmotionBreakdown(sessions)
  const insight = getInsight(sessions)

  const now = new Date()
  const weekRange = getWeekRange(0)
  const weekLabel = `${weekRange.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${weekRange.end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
  const monthLabel = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const emotionColors = ['#00ff88', '#00c8ff', '#ff4466', '#888', '#e8c84a', '#ff8c00']

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
      style={{ marginTop: '24px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '2px' }}>📊 Trade Report Card</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
            {period === 'week' ? weekLabel : monthLabel}
          </p>
        </div>
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '3px', border: '1px solid var(--border)' }}>
          {['week', 'month'].map((p) => (
            <motion.button key={p} onClick={() => setPeriod(p)} whileTap={{ scale: 0.95 }}
              style={{ padding: '5px 14px', borderRadius: '6px', border: 'none', background: period === p ? 'var(--bg-2)' : 'transparent', color: period === p ? 'var(--gold)' : 'var(--text-muted)', fontSize: '12px', fontWeight: period === p ? '700' : '400', cursor: 'pointer', transition: 'all 0.2s' }}>
              {p === 'week' ? 'This Week' : 'This Month'}
            </motion.button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={period} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          {loading ? (
            <div style={{ background: 'rgba(13,13,13,0.8)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)', borderRadius: '14px', padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              Loading report...
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>

              {/* Stats Card */}
              <div style={{ background: 'rgba(13,13,13,0.8)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)', borderRadius: '14px', overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: '700' }}>📊 {period === 'week' ? 'Week of' : 'Month of'} {period === 'week' ? weekLabel.split('–')[0].trim() : monthLabel}</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{username}</span>
                </div>
                <div style={{ padding: '8px 0' }}>
                  {[
                    { label: 'Sessions Logged', value: `${sessions.length}`, color: 'var(--gold)' },
                    { label: 'Win Rate', value: `${winRate}%`, color: winRate >= 60 ? 'var(--green)' : winRate >= 40 ? 'var(--gold)' : 'var(--red)' },
                    { label: 'Total P&L', value: `${totalPnl >= 0 ? '+' : ''}$${totalPnl.toFixed(0)}`, color: totalPnl >= 0 ? 'var(--green)' : 'var(--red)' },
                    { label: 'Wins / Losses', value: `${wins} / ${losses}`, color: 'var(--text)' },
                    { label: 'No Trades Taken', value: `${noTrades}`, color: 'var(--text-muted)' },
                    { label: 'XP Earned', value: `+${xpEarned.toLocaleString()} XP`, color: 'var(--gold)' },
                  ].map((stat) => (
                    <div key={stat.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 18px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{stat.label}</span>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: stat.color }}>{stat.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Grade + Insight */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Grade */}
                <div style={{ background: 'rgba(13,13,13,0.8)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)', borderRadius: '14px', overflow: 'hidden' }}>
                  <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700' }}>🎓 {period === 'week' ? 'Weekly' : 'Monthly'} Grade</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Overall Performance</span>
                  </div>
                  <div style={{ padding: '20px 18px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', border: `3px solid ${grade.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: `${grade.color}10` }}>
                      <span style={{ fontSize: '22px', fontWeight: '900', color: grade.color }}>{grade.letter}</span>
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6' }}>{grade.desc}</p>
                  </div>
                </div>

                {/* Emotion Breakdown */}
                {emotions.length > 0 && (
                  <div style={{ background: 'rgba(13,13,13,0.8)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)', borderRadius: '14px', overflow: 'hidden' }}>
                    <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ fontSize: '13px', fontWeight: '700' }}>😤 Emotion Breakdown</span>
                    </div>
                    <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {emotions.map((e, i) => (
                        <div key={e.emotion} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '12px', color: 'var(--text-dim)', width: '90px', flexShrink: 0, textTransform: 'capitalize' }}>{e.emotion}</span>
                          <div style={{ flex: 1, background: 'rgba(255,255,255,0.06)', borderRadius: '999px', height: '6px', overflow: 'hidden' }}>
                            <motion.div initial={{ width: 0 }} animate={{ width: `${e.pct}%` }} transition={{ delay: 0.3 + i * 0.1, duration: 0.6, ease: 'easeOut' }}
                              style={{ height: '100%', background: emotionColors[i] || 'var(--gold)', borderRadius: '999px' }} />
                          </div>
                          <span style={{ fontSize: '12px', fontWeight: '700', color: emotionColors[i] || 'var(--gold)', width: '32px', textAlign: 'right', flexShrink: 0 }}>{e.pct}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Insight */}
                <div style={{ background: 'rgba(13,13,13,0.8)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)', borderRadius: '14px', overflow: 'hidden' }}>
                  <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700' }}>🔍 Wick's Insight</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>AI Feedback</span>
                  </div>
                  <div style={{ padding: '16px 18px' }}>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.8' }}>{insight}</p>
                  </div>
                </div>
              </div>

            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}