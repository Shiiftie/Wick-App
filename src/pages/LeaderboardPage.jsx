import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../supabase'
import { Crown, Medal } from 'lucide-react'

export default function LeaderboardPage() {
  const [leaders, setLeaders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('username, xp')
        .order('xp', { ascending: false })
        .limit(20)
      if (data) setLeaders(data)
      setLoading(false)
    }
    fetch()
  }, [])

  const getRankIcon = (i) => {
    if (i === 0) return <Crown size={16} color="#FFD700" />
    if (i === 1) return <Medal size={16} color="#C0C0C0" />
    if (i === 2) return <Medal size={16} color="#CD7F32" />
    return <span style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: '600' }}>#{i + 1}</span>
  }

  const getRankBg = (i) => {
    if (i === 0) return 'linear-gradient(135deg, rgba(255,215,0,0.08), rgba(255,215,0,0.02))'
    if (i === 1) return 'linear-gradient(135deg, rgba(192,192,192,0.06), rgba(192,192,192,0.01))'
    if (i === 2) return 'linear-gradient(135deg, rgba(205,127,50,0.06), rgba(205,127,50,0.01))'
    return 'var(--bg-2)'
  }

  const getRankBorder = (i) => {
    if (i === 0) return '1px solid rgba(255,215,0,0.2)'
    if (i === 1) return '1px solid rgba(192,192,192,0.15)'
    if (i === 2) return '1px solid rgba(205,127,50,0.15)'
    return '1px solid var(--border)'
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px', marginBottom: '6px' }}>Leaderboard</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>Top traders ranked by XP. Log sessions to climb.</p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>Loading...</div>
      ) : leaders.length === 0 ? (
        <div style={{
          background: 'var(--bg-2)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '48px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏆</div>
          <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>No traders yet</h3>
          <p style={{ color: 'var(--text-muted)' }}>Set a username in your profile to appear here.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {leaders.map((l, i) => (
            <motion.div
              key={l.username}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              style={{
                background: getRankBg(i),
                border: getRankBorder(i),
                borderRadius: '14px',
                padding: '16px 24px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
              }}
            >
              <div style={{ width: '32px', display: 'flex', justifyContent: 'center' }}>
                {getRankIcon(i)}
              </div>

              <div style={{
                width: '36px', height: '36px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--purple), var(--gold))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px', fontWeight: '800', color: '#fff'
              }}>
                {l.username?.[0]?.toUpperCase() || '?'}
              </div>

              <span style={{ flex: 1, fontWeight: '600', fontSize: '15px' }}>{l.username}</span>

              <div style={{ textAlign: 'right' }}>
                <p style={{
                  fontSize: '18px',
                  fontWeight: '800',
                  color: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : 'var(--gold)',
                  letterSpacing: '-0.5px'
                }}>{l.xp} XP</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  )
}