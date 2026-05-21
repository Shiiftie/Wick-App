import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Target, Zap, Calendar, ArrowRight } from 'lucide-react'

const StatCard = ({ label, value, icon: Icon, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
    style={{
      background: 'var(--bg-2)',
      border: '1px solid var(--border)',
      borderRadius: '16px',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
    }}
  >
    <div style={{
      position: 'absolute',
      top: 0, right: 0,
      width: '100px', height: '100px',
      background: `radial-gradient(circle, ${color}15 0%, transparent 70%)`,
      borderRadius: '50%',
      transform: 'translate(20px, -20px)'
    }} />
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <p style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>{label}</p>
        <p style={{ fontSize: '32px', fontWeight: '800', color: 'var(--text)', letterSpacing: '-1px' }}>{value}</p>
      </div>
      <div style={{
        width: '40px', height: '40px',
        background: `${color}18`,
        borderRadius: '10px',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <Icon size={18} color={color} />
      </div>
    </div>
  </motion.div>
)

export default function DashboardPage({ sessions, setView }) {
  const wins = sessions.filter(s => s.outcome === 'win').length
  const losses = sessions.filter(s => s.outcome === 'loss').length
  const winRate = sessions.length > 0 ? Math.round((wins / (wins + losses || 1)) * 100) : 0
  const totalPnl = sessions.reduce((sum, s) => sum + (s.pnl || 0), 0)

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <div style={{ marginBottom: '32px' }}>
        <motion.h2
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px', marginBottom: '6px' }}
        >
          Good morning, trader. 👋
        </motion.h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>Here's how you're performing.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
        <StatCard label="Total Sessions" value={sessions.length} icon={Calendar} color="#7c5cfc" delay={0} />
        <StatCard label="Win Rate" value={`${winRate}%`} icon={Target} color="#e8c84a" delay={0.1} />
        <StatCard label="Total P&L" value={`$${totalPnl.toFixed(0)}`} icon={totalPnl >= 0 ? TrendingUp : TrendingDown} color={totalPnl >= 0 ? '#00ff88' : '#ff4466'} delay={0.2} />
        <StatCard label="Wins / Losses" value={`${wins}W ${losses}L`} icon={Zap} color="#00c8ff" delay={0.3} />
      </div>

      {sessions.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{
            background: 'var(--bg-2)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '48px',
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
          <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>No sessions yet</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Log your first trading session to start tracking your performance.</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setView('log')}
            style={{
              padding: '12px 24px',
              background: 'var(--gold)',
              color: '#000',
              border: 'none',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: '700',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            Log First Session <ArrowRight size={14} />
          </motion.button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{
            background: 'var(--bg-2)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            overflow: 'hidden'
          }}
        >
          <div style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700' }}>Recent Sessions</h3>
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={() => setView('history')}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--gold)',
                fontSize: '13px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              View all <ArrowRight size={12} />
            </motion.button>
          </div>

          {sessions.slice(0, 5).map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.05 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 24px',
                borderBottom: i < sessions.slice(0, 5).length - 1 ? '1px solid var(--border)' : 'none',
                transition: 'background 0.2s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: s.outcome === 'win' ? 'var(--green)' : s.outcome === 'loss' ? 'var(--red)' : 'var(--text-muted)'
                }} />
                <span style={{ color: 'var(--text-dim)', fontSize: '14px' }}>{s.date}</span>
              </div>
              <span style={{
                padding: '3px 10px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '600',
                textTransform: 'capitalize',
                background: s.outcome === 'win' ? 'rgba(0,255,136,0.1)' : s.outcome === 'loss' ? 'rgba(255,68,102,0.1)' : 'rgba(136,136,136,0.1)',
                color: s.outcome === 'win' ? 'var(--green)' : s.outcome === 'loss' ? 'var(--red)' : 'var(--text-muted)'
              }}>
                {s.outcome.replace('_', ' ')}
              </span>
              <span style={{
                fontSize: '14px',
                fontWeight: '700',
                color: !s.pnl ? 'var(--text-muted)' : s.pnl >= 0 ? 'var(--green)' : 'var(--red)'
              }}>
                {s.pnl ? `${s.pnl >= 0 ? '+' : ''}$${s.pnl}` : '—'}
              </span>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  )
}