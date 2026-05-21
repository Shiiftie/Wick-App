import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../supabase'

const RANKS = [
  { name: 'Stone Hands', min: 0, max: 499, color: '#888', icon: '🪨' },
  { name: 'Bronze Wick', min: 500, max: 1499, color: '#CD7F32', icon: '⚔️' },
  { name: 'Silver Wick', min: 1500, max: 2999, color: '#C0C0C0', icon: '🛡️' },
  { name: 'Gold Wick', min: 3000, max: 5999, color: '#FFD700', icon: '👑' },
  { name: 'Platinum Wick', min: 6000, max: 9999, color: '#00c8ff', icon: '⚡' },
  { name: 'Diamond Wick', min: 10000, max: 24999, color: '#b9f2ff', icon: '💎' },
  { name: 'Wick Elite', min: 25000, max: Infinity, color: '#e8c84a', icon: '🔥' },
]

function getRank(xp) {
  return RANKS.find(r => xp >= r.min && xp <= r.max) || RANKS[0]
}

function LeaderboardCard({ title, period, leaders, loading }) {
  const maxXp = leaders[0]?.xp || 1

  const getRankIcon = (i) => {
    if (i === 0) return '🥇'
    if (i === 1) return '🥈'
    if (i === 2) return '🥉'
    return `${i + 1}`
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      style={{ background: 'rgba(13,13,13,0.8)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden', marginBottom: '16px' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: '700', fontSize: '14px' }}>{title}</span>
        <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>{period}</span>
      </div>
      <div style={{ padding: '8px 0' }}>
        {loading ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', padding: '20px', textAlign: 'center' }}>Loading...</p>
        ) : leaders.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', padding: '20px', textAlign: 'center' }}>No traders yet. Be the first.</p>
        ) : (
          leaders.map((l, i) => {
            const rank = getRank(l.xp || 0)
            const barWidth = ((l.xp || 0) / maxXp) * 100
            return (
              <motion.div key={l.username || i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: i < leaders.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                <div style={{ width: '28px', textAlign: 'center', fontSize: i < 3 ? '16px' : '13px', fontWeight: '700', color: 'var(--text-muted)', flexShrink: 0 }}>
                  {getRankIcon(i)}
                </div>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: `2px solid ${rank.color}40`, background: 'linear-gradient(135deg, #7c5cfc, #e8c84a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '800', color: '#fff' }}>
                  {l.avatar_url ? <img src={l.avatar_url} alt="av" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : l.username?.[0]?.toUpperCase() || '?'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                    <div>
                      <span style={{ fontWeight: '700', fontSize: '14px', color: l.username_color || 'var(--text)' }}>{l.username || 'Anonymous'}</span>
                      <span style={{ fontSize: '11px', color: rank.color, fontWeight: '600', marginLeft: '8px' }}>{rank.name}</span>
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--gold)', flexShrink: 0 }}>{(l.xp || 0).toLocaleString()} XP</span>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '999px', height: '4px', overflow: 'hidden' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${barWidth}%` }}
                      transition={{ delay: 0.3 + i * 0.05, duration: 0.8, ease: 'easeOut' }}
                      style={{ height: '100%', background: `linear-gradient(90deg, ${rank.color}, var(--gold))`, borderRadius: '999px' }}
                    />
                  </div>
                </div>
              </motion.div>
            )
          })
        )}
      </div>
    </motion.div>
  )
}

export default function LeaderboardPage() {
  const [leaders, setLeaders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('profiles').select('username, xp, avatar_url, username_color').order('xp', { ascending: false }).limit(20)
      if (data) setLeaders(data)
      setLoading(false)
    }
    fetch()
  }, [])

  const top10 = leaders.slice(0, 10)
  const top20 = leaders.slice(0, 20)

  const xpItems = [
    { icon: '📋', label: 'Log a Session', sub: 'Any outcome counts', xp: '+50 XP' },
    { icon: '✅', label: 'Followed Your Plan', sub: 'Full discipline score', xp: '+100 XP' },
    { icon: '🏆', label: 'Winning Session', sub: 'P&L in the green', xp: '+75 XP' },
    { icon: '👀', label: 'No Trade Taken', sub: 'Patience is a skill', xp: '+60 XP' },
    { icon: '🔥', label: '7-Day Streak', sub: 'Log 7 sessions in a row', xp: '+500 XP' },
    { icon: '💬', label: 'Active in the Floor', sub: 'Daily chat contribution', xp: '+25 XP' },
  ]

  const rankTiers = [
    { icon: '🪨', name: 'Stone Hands', xp: '0 — 499 XP', color: '#888' },
    { icon: '⚔️', name: 'Bronze Wick', xp: '500 — 1,499 XP', color: '#CD7F32' },
    { icon: '🛡️', name: 'Silver Wick', xp: '1,500 — 2,999 XP', color: '#C0C0C0' },
    { icon: '👑', name: 'Gold Wick', xp: '3,000 — 5,999 XP', color: '#FFD700' },
    { icon: '⚡', name: 'Platinum Wick', xp: '6,000 — 9,999 XP', color: '#00c8ff' },
    { icon: '💎', name: 'Diamond Wick', xp: '10,000 — 24,999 XP', color: '#b9f2ff' },
    { icon: '🌑', name: 'Obsidian Wick', xp: '25,000 — 39,999 XP', color: '#7c5cfc' },
    { icon: '🔴', name: 'Crimson Wick', xp: '40,000 — 59,999 XP', color: '#ff4466' },
    { icon: '👻', name: 'Phantom Wick', xp: '60,000 — 99,999 XP', color: '#e0aaff' },
    { icon: '⚔️', name: 'Titan Wick', xp: '100,000 — 199,999 XP', color: '#ff8c00' },
    { icon: '🏆', name: 'Legend Wick', xp: '200,000+ XP', color: '#e8c84a' },
    { icon: '👁️', name: 'Wick God', xp: '500,000+ XP', color: '#fff' },
  ]

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px', marginBottom: '6px' }}>The Leaderboard.</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>Every session you log earns XP. Climb the ranks. Prove your consistency.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Left — Leaderboards */}
        <div>
          <LeaderboardCard title="⚡ Top Traders — This Week" period="Weekly XP" leaders={top10} loading={loading} />
          <LeaderboardCard title="🏆 Top Traders — This Month" period="Monthly XP" leaders={top20} loading={loading} />
        </div>

        {/* Right — XP System + Ranks */}
        <div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            style={{ background: 'rgba(13,13,13,0.8)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '4px' }}>How You Earn XP</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '20px' }}>Every action inside Wick rewards you. Discipline pays more than profits.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {xpItems.map((item) => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)' }}>
                  <span style={{ fontSize: '20px', flexShrink: 0 }}>{item.icon}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text)' }}>{item.label}</p>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.sub}</p>
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--gold)', flexShrink: 0 }}>{item.xp}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            style={{ background: 'rgba(13,13,13,0.8)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '4px' }}>Rank Tiers</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '20px' }}>Every trader starts at the bottom. Where you end up depends on how consistent you are.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {rankTiers.map((r) => (
                <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ fontSize: '16px', flexShrink: 0 }}>{r.icon}</span>
                  <span style={{ flex: 1, fontSize: '13px', fontWeight: '700', color: r.color }}>{r.name}</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{r.xp}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}