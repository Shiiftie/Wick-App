import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export default function HistoryPage({ sessions }) {
  if (sessions.length === 0) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px', marginBottom: '6px' }}>Session History</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>Every session logged is a step forward.</p>
        </div>
        <div style={{
          background: 'var(--bg-2)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '48px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📂</div>
          <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>No sessions yet</h3>
          <p style={{ color: 'var(--text-muted)' }}>Your logged sessions will appear here.</p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px', marginBottom: '6px' }}>Session History</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>{sessions.length} sessions logged</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {sessions.map((s, i) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            style={{
              background: 'var(--bg-2)',
              border: '1px solid var(--border)',
              borderRadius: '14px',
              padding: '20px 24px',
              transition: 'border-color 0.2s'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: s.lessons || s.analysis ? '14px' : '0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '36px', height: '36px',
                  borderRadius: '10px',
                  background: s.outcome === 'win' ? 'rgba(0,255,136,0.1)' : s.outcome === 'loss' ? 'rgba(255,68,102,0.1)' : 'rgba(136,136,136,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {s.outcome === 'win' ? <TrendingUp size={16} color="var(--green)" /> :
                   s.outcome === 'loss' ? <TrendingDown size={16} color="var(--red)" /> :
                   <Minus size={16} color="var(--text-muted)" />}
                </div>
                <div>
                  <p style={{ fontWeight: '700', fontSize: '15px' }}>{s.date}</p>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: '600',
                    textTransform: 'capitalize',
                    background: s.outcome === 'win' ? 'rgba(0,255,136,0.1)' : s.outcome === 'loss' ? 'rgba(255,68,102,0.1)' : 'rgba(136,136,136,0.1)',
                    color: s.outcome === 'win' ? 'var(--green)' : s.outcome === 'loss' ? 'var(--red)' : 'var(--text-muted)'
                  }}>
                    {s.outcome.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <p style={{
                  fontSize: '20px',
                  fontWeight: '800',
                  color: !s.pnl ? 'var(--text-muted)' : s.pnl >= 0 ? 'var(--green)' : 'var(--red)',
                  letterSpacing: '-0.5px'
                }}>
                  {s.pnl ? `${s.pnl >= 0 ? '+' : ''}$${s.pnl}` : '—'}
                </p>
              </div>
            </div>

            {(s.emotions || s.bias) && (
              <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
                {s.emotions && (
                  <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '12px', background: 'var(--bg-3)', color: 'var(--text-dim)', border: '1px solid var(--border)' }}>
                    😶 {s.emotions}
                  </span>
                )}
                {s.bias && (
                  <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '12px', background: 'var(--bg-3)', color: 'var(--text-dim)', border: '1px solid var(--border)' }}>
                    📈 {s.bias}
                  </span>
                )}
              </div>
            )}

            {s.lessons && (
              <div style={{
                background: 'var(--bg-3)',
                borderRadius: '8px',
                padding: '10px 14px',
                borderLeft: '3px solid var(--gold)'
              }}>
                <p style={{ fontSize: '13px', color: 'var(--text-dim)', lineHeight: '1.5' }}>💡 {s.lessons}</p>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}