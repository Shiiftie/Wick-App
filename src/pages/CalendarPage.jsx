import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../supabase'
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, X, Calendar } from 'lucide-react'

export default function CalendarPage({ user }) {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState(null)
  const [selectedSessions, setSelectedSessions] = useState([])

  useEffect(() => {
    const fetchSessions = async () => {
      setLoading(true)
      const { data } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
      if (data) setSessions(data)
      setLoading(false)
    }
    fetchSessions()
  }, [user.id])

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December']
  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()

  // Group sessions by date
  const sessionsByDate = {}
  sessions.forEach(s => {
    if (!s.date) return
    const dateKey = s.date.split('T')[0]
    if (!sessionsByDate[dateKey]) sessionsByDate[dateKey] = []
    sessionsByDate[dateKey].push(s)
  })

  const getDayKey = (d) => {
    const mm = String(month + 1).padStart(2, '0')
    const dd = String(d).padStart(2, '0')
    return `${year}-${mm}-${dd}`
  }

  const getDayData = (d) => {
    const key = getDayKey(d)
    const daySessions = sessionsByDate[key] || []
    const totalPnl = daySessions.reduce((sum, s) => sum + (parseFloat(s.pnl) || 0), 0)
    return { sessions: daySessions, totalPnl, key }
  }

  const handleDayClick = (d) => {
    const { sessions: daySessions, key } = getDayData(d)
    if (daySessions.length === 0) return
    setSelectedDay(key)
    setSelectedSessions(daySessions)
  }

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))

  // Monthly stats
  const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`
  const monthSessions = sessions.filter(s => s.date && s.date.startsWith(monthKey))
  const monthPnl = monthSessions.reduce((sum, s) => sum + (parseFloat(s.pnl) || 0), 0)
  const wins = monthSessions.filter(s => s.outcome === 'win').length
  const losses = monthSessions.filter(s => s.outcome === 'loss').length
  const winRate = monthSessions.length > 0 ? Math.round((wins / monthSessions.length) * 100) : 0
  const greenDays = Object.entries(sessionsByDate).filter(([k, v]) => k.startsWith(monthKey) && v.reduce((sum, s) => sum + (parseFloat(s.pnl) || 0), 0) > 0).length
  const redDays = Object.entries(sessionsByDate).filter(([k, v]) => k.startsWith(monthKey) && v.reduce((sum, s) => sum + (parseFloat(s.pnl) || 0), 0) < 0).length

  const today = new Date()
  const isToday = (d) => d === today.getDate() && month === today.getMonth() && year === today.getFullYear()

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px', color: 'var(--text-muted)' }}>
      Loading calendar...
    </div>
  )

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px', marginBottom: '6px' }}>Trading Calendar</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>Track your P&L and sessions by day.</p>
      </div>

      {/* Monthly Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {[
          { label: 'Monthly P&L', value: `${monthPnl >= 0 ? '+' : ''}$${monthPnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: monthPnl >= 0 ? 'var(--green)' : 'var(--red)' },
          { label: 'Win Rate', value: `${winRate}%`, color: 'var(--gold)' },
          { label: 'Green Days', value: greenDays, color: 'var(--green)' },
          { label: 'Red Days', value: redDays, color: 'var(--red)' },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            style={{ background: 'rgba(13,13,13,0.8)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)', borderRadius: '14px', padding: '16px 20px' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>{stat.label}</p>
            <p style={{ fontSize: '22px', fontWeight: '900', color: stat.color, letterSpacing: '-0.5px' }}>{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Calendar */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        style={{ background: 'rgba(13,13,13,0.8)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)', borderRadius: '20px', padding: '24px', marginBottom: '16px' }}>

        {/* Month navigation */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={prevMonth}
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', cursor: 'pointer', padding: '8px 12px', display: 'flex', alignItems: 'center' }}>
            <ChevronLeft size={16} />
          </motion.button>
          <h3 style={{ fontSize: '20px', fontWeight: '800', letterSpacing: '-0.5px' }}>
            {monthNames[month]} {year}
          </h3>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={nextMonth}
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', cursor: 'pointer', padding: '8px 12px', display: 'flex', alignItems: 'center' }}>
            <ChevronRight size={16} />
          </motion.button>
        </div>

        {/* Day names */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '8px' }}>
          {dayNames.map(d => (
            <div key={d} style={{ textAlign: 'center', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', padding: '8px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
          {/* Previous month days */}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`prev-${i}`} style={{ aspectRatio: '1', padding: '6px', borderRadius: '10px', opacity: 0.2 }}>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{daysInPrevMonth - firstDay + i + 1}</span>
            </div>
          ))}

          {/* Current month days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const d = i + 1
            const { sessions: daySessions, totalPnl } = getDayData(d)
            const hasSessions = daySessions.length > 0
            const isGreen = hasSessions && totalPnl > 0
            const isRed = hasSessions && totalPnl < 0
            const isFlat = hasSessions && totalPnl === 0
            const todayDay = isToday(d)

            return (
              <motion.div key={d}
                whileHover={hasSessions ? { scale: 1.04 } : {}}
                whileTap={hasSessions ? { scale: 0.97 } : {}}
                onClick={() => handleDayClick(d)}
                style={{
                  aspectRatio: '1',
                  padding: '6px',
                  borderRadius: '10px',
                  cursor: hasSessions ? 'pointer' : 'default',
                  background: isGreen ? 'rgba(0,255,136,0.1)' : isRed ? 'rgba(255,68,102,0.1)' : isFlat ? 'rgba(232,200,74,0.08)' : 'transparent',
                  border: todayDay ? '1.5px solid rgba(232,200,74,0.6)' : isGreen ? '1px solid rgba(0,255,136,0.25)' : isRed ? '1px solid rgba(255,68,102,0.25)' : '1px solid transparent',
                  position: 'relative',
                  display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                  transition: 'all 0.15s',
                }}
              >
                <span style={{ fontSize: '13px', fontWeight: todayDay ? '900' : '500', color: todayDay ? 'var(--gold)' : 'var(--text)' }}>{d}</span>
                {hasSessions && (
                  <>
                    <span style={{ fontSize: '10px', fontWeight: '700', color: isGreen ? 'var(--green)' : isRed ? 'var(--red)' : 'var(--gold)', lineHeight: 1 }}>
                      {totalPnl >= 0 ? '+' : ''}${Math.abs(totalPnl).toFixed(0)}
                    </span>
                    <div style={{ display: 'flex', gap: '2px', flexWrap: 'wrap' }}>
                      {daySessions.slice(0, 3).map((_, si) => (
                        <div key={si} style={{ width: '4px', height: '4px', borderRadius: '50%', background: isGreen ? 'var(--green)' : isRed ? 'var(--red)' : 'var(--gold)' }} />
                      ))}
                    </div>
                  </>
                )}
              </motion.div>
            )
          })}

          {/* Next month filler */}
          {Array.from({ length: (7 - ((firstDay + daysInMonth) % 7)) % 7 }).map((_, i) => (
            <div key={`next-${i}`} style={{ aspectRatio: '1', padding: '6px', borderRadius: '10px', opacity: 0.2 }}>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{i + 1}</span>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: '20px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
          {[
            { color: 'rgba(0,255,136,0.15)', border: 'rgba(0,255,136,0.25)', label: 'Profit day' },
            { color: 'rgba(255,68,102,0.15)', border: 'rgba(255,68,102,0.25)', label: 'Loss day' },
            { color: 'rgba(232,200,74,0.08)', border: 'rgba(232,200,74,0.2)', label: 'Breakeven' },
          ].map((l, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '14px', height: '14px', borderRadius: '4px', background: l.color, border: `1px solid ${l.border}` }} />
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{l.label}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Day Detail Modal */}
      <AnimatePresence>
        {selectedDay && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSelectedDay(null)}
            style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)', padding: '16px' }}>
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
              style={{ background: 'rgba(13,13,13,0.98)', border: '1px solid rgba(232,200,74,0.2)', borderRadius: '20px', padding: '24px', width: '100%', maxWidth: '480px', maxHeight: '80vh', overflowY: 'auto' }}>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Calendar size={18} color="var(--gold)" />
                  <h3 style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>
                    {new Date(selectedDay + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </h3>
                </div>
                <button onClick={() => setSelectedDay(null)}
                  style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '8px', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: '8px', display: 'flex' }}>
                  <X size={16} />
                </button>
              </div>

              {/* Day summary */}
              {(() => {
                const dayPnl = selectedSessions.reduce((sum, s) => sum + (parseFloat(s.pnl) || 0), 0)
                const dayWins = selectedSessions.filter(s => s.outcome === 'win').length
                const dayLosses = selectedSessions.filter(s => s.outcome === 'loss').length
                return (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}>
                    <div style={{ background: dayPnl >= 0 ? 'rgba(0,255,136,0.08)' : 'rgba(255,68,102,0.08)', border: `1px solid ${dayPnl >= 0 ? 'rgba(0,255,136,0.2)' : 'rgba(255,68,102,0.2)'}`, borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
                      <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total P&L</p>
                      <p style={{ fontSize: '18px', fontWeight: '900', color: dayPnl >= 0 ? 'var(--green)' : 'var(--red)' }}>{dayPnl >= 0 ? '+' : ''}${dayPnl.toFixed(2)}</p>
                    </div>
                    <div style={{ background: 'rgba(0,255,136,0.06)', border: '1px solid rgba(0,255,136,0.15)', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
                      <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Wins</p>
                      <p style={{ fontSize: '18px', fontWeight: '900', color: 'var(--green)' }}>{dayWins}</p>
                    </div>
                    <div style={{ background: 'rgba(255,68,102,0.06)', border: '1px solid rgba(255,68,102,0.15)', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
                      <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Losses</p>
                      <p style={{ fontSize: '18px', fontWeight: '900', color: 'var(--red)' }}>{dayLosses}</p>
                    </div>
                  </div>
                )
              })()}

              {/* Sessions list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {selectedSessions.map((s, i) => {
                  const pnl = parseFloat(s.pnl) || 0
                  const isWin = s.outcome === 'win' || pnl > 0
                  return (
                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: isWin ? 'var(--green)' : 'var(--red)', boxShadow: `0 0 6px ${isWin ? 'rgba(0,255,136,0.6)' : 'rgba(255,68,102,0.6)'}` }} />
                          <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text)' }}>{s.asset || 'Unknown Asset'}</span>
                          {s.direction && <span style={{ fontSize: '10px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', padding: '2px 6px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{s.direction}</span>}
                        </div>
                        <span style={{ fontSize: '18px', fontWeight: '900', color: isWin ? 'var(--green)' : 'var(--red)' }}>
                          {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                        </span>
                      </div>
                      {s.notes && <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>{s.notes}</p>}
                      <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                        {s.session_type && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>📋 {s.session_type}</span>}
                        {s.duration && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>⏱ {s.duration}m</span>}
                        {s.emotional_state && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>🧠 {s.emotional_state}</span>}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}