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
  { name: 'Obsidian Wick', min: 25000, max: 39999, color: '#7c5cfc', icon: '🌑' },
  { name: 'Crimson Wick', min: 40000, max: 59999, color: '#ff4466', icon: '🔴' },
  { name: 'Phantom Wick', min: 60000, max: 99999, color: '#e0aaff', icon: '👻' },
  { name: 'Titan Wick', min: 100000, max: 199999, color: '#ff8c00', icon: '⚔️' },
  { name: 'Legend Wick', min: 200000, max: 499999, color: '#e8c84a', icon: '🏆' },
  { name: 'Wick God', min: 500000, max: Infinity, color: '#fff', icon: '👁️' },
]

function getRank(xp) {
  return RANKS.find(r => xp >= r.min && xp <= r.max) || RANKS[0]
}

// XP items sorted by category, least to most XP within each category
const XP_CATEGORIES = [
  {
    category: 'Community',
    icon: '💬',
    color: '#00c8ff',
    items: [
      { icon: '💬', label: 'Active in the Floor', sub: 'Daily chat contribution', xp: '+25 XP', val: 25 },
      { icon: '👤', label: 'Send Your First DM', sub: 'Message another trader', xp: '+20 XP', val: 20 },
      { icon: '🤝', label: 'Add Your First Friend', sub: 'Connect with a trader', xp: '+30 XP', val: 30 },
      { icon: '🗣️', label: 'First Floor Message', sub: 'Break the ice on the Trading Floor', xp: '+50 XP', val: 50 },
    ].sort((a, b) => a.val - b.val),
  },
  {
    category: 'Session Logging',
    icon: '📋',
    color: '#e8c84a',
    items: [
      { icon: '📋', label: 'Log a Session', sub: 'Any outcome counts', xp: '+50 XP', val: 50 },
      { icon: '📸', label: 'Add a Chart Screenshot', sub: 'Attach a chart to your session', xp: '+25 XP', val: 25 },
      { icon: '✍️', label: 'Write a Lesson Learned', sub: 'Fill in the After field', xp: '+30 XP', val: 30 },
      { icon: '👀', label: 'No Trade Taken', sub: 'Patience is a skill', xp: '+60 XP', val: 60 },
      { icon: '🏆', label: 'Winning Session', sub: 'P&L in the green', xp: '+75 XP', val: 75 },
      { icon: '✅', label: 'Followed Your Plan', sub: 'Full discipline score', xp: '+100 XP', val: 100 },
    ].sort((a, b) => a.val - b.val),
  },
  {
    category: 'Goals & Rules',
    icon: '🎯',
    color: '#ff8c00',
    items: [
      { icon: '📜', label: 'Set Your First Trading Goal', sub: 'Define what you are working toward', xp: '+50 XP', val: 50 },
      { icon: '🛡️', label: 'Acknowledge Rules 7 Days Straight', sub: 'Read your rules every morning', xp: '+300 XP', val: 300 },
      { icon: '🏁', label: 'Complete a Trading Goal', sub: 'Hit the target you set', xp: '+150 XP', val: 150 },
    ].sort((a, b) => a.val - b.val),
  },
  {
    category: 'Paper Simulator',
    icon: '🎮',
    color: '#00ff88',
    items: [
      { icon: '🎮', label: 'Complete Your First Paper Trade', sub: 'Execute and close a demo trade', xp: '+50 XP', val: 50 },
      { icon: '📈', label: 'Close a Profitable Paper Trade', sub: 'Finish in the green on demo', xp: '+75 XP', val: 75 },
      { icon: '🔟', label: 'Complete 10 Paper Trades', sub: 'Build real reps on the simulator', xp: '+200 XP', val: 200 },
    ].sort((a, b) => a.val - b.val),
  },
  {
    category: 'Streaks',
    icon: '🔥',
    color: '#ff4466',
    items: [
      { icon: '🔥', label: '5-Day Streak', sub: 'Log sessions 5 days in a row', xp: '+200 XP', val: 200 },
      { icon: '⚔️', label: '7-Day Streak', sub: 'Log 7 sessions in a row', xp: '+500 XP', val: 500 },
      { icon: '🌊', label: '14-Day Streak', sub: 'Log sessions 14 days in a row', xp: '+1,000 XP', val: 1000 },
      { icon: '👑', label: '30-Day Streak', sub: 'Log sessions 30 days in a row', xp: '+2,500 XP', val: 2500 },
    ].sort((a, b) => a.val - b.val),
  },
]

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
  const [openCategory, setOpenCategory] = useState(null)

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

  const rankTiers = [
    { icon: '🪨', name: 'Stone Hands',   xp: '0 — 499 XP',           color: '#888888' },
    { icon: '⚔️',  name: 'Bronze Wick',  xp: '500 — 1,499 XP',       color: '#CD7F32' },
    { icon: '🛡️',  name: 'Silver Wick',  xp: '1,500 — 2,999 XP',     color: '#C0C0C0' },
    { icon: '👑',  name: 'Gold Wick',    xp: '3,000 — 5,999 XP',     color: '#FFD700' },
    { icon: '⚡',  name: 'Platinum Wick',xp: '6,000 — 9,999 XP',     color: '#00c8ff' },
    { icon: '💎',  name: 'Diamond Wick', xp: '10,000 — 24,999 XP',   color: '#b9f2ff' },
    { icon: '🌑',  name: 'Obsidian Wick',xp: '25,000 — 39,999 XP',   color: '#7c5cfc' },
    { icon: '🔴',  name: 'Crimson Wick', xp: '40,000 — 59,999 XP',   color: '#ff4466' },
    { icon: '👻',  name: 'Phantom Wick', xp: '60,000 — 99,999 XP',   color: '#e0aaff' },
    { icon: '⚔️',  name: 'Titan Wick',   xp: '100,000 — 199,999 XP', color: '#ff8c00' },
    { icon: '🏆',  name: 'Legend Wick',  xp: '200,000 — 499,999 XP', color: '#e8c84a' },
    { icon: '👁️',  name: 'Wick God',     xp: '500,000+ XP',          color: '#ffffff' },
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

          {/* How You Earn XP — Categorized */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            style={{ background: 'rgba(13,13,13,0.8)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden', marginBottom: '16px' }}>

            <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '4px' }}>How You Earn XP</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Every action inside Wick rewards you. Sorted least to most XP.</p>
            </div>

            <div>
              {XP_CATEGORIES.map((cat, ci) => (
                <div key={cat.category} style={{ borderBottom: ci < XP_CATEGORIES.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                  {/* Category header */}
                  <button
                    onClick={() => setOpenCategory(openCategory === ci ? null : ci)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 20px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                    <span style={{ fontSize: '16px' }}>{cat.icon}</span>
                    <span style={{ flex: 1, fontSize: '13px', fontWeight: '700', color: cat.color }}>{cat.category}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                      {cat.items[0].xp} — {cat.items[cat.items.length - 1].xp}
                    </span>
                    <motion.span animate={{ rotate: openCategory === ci ? 180 : 0 }} transition={{ duration: 0.2 }}
                      style={{ fontSize: '10px', color: 'var(--text-muted)', marginLeft: '6px' }}>▼</motion.span>
                  </button>

                  {/* Items */}
                  {openCategory === ci && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      style={{ overflow: 'hidden' }}>
                      {cat.items.map((item) => (
                        <div key={item.label} style={{ display: 'grid', gridTemplateColumns: '32px 1fr auto', alignItems: 'center', gap: '12px', padding: '10px 20px', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
                          <span style={{ fontSize: '18px', textAlign: 'center' }}>{item.icon}</span>
                          <div>
                            <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text)' }}>{item.label}</p>
                            <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.sub}</p>
                          </div>
                          <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--gold)', whiteSpace: 'nowrap' }}>{item.xp}</span>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Rank Tiers */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            style={{ background: 'rgba(13,13,13,0.8)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '4px' }}>Rank Tiers</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '20px' }}>Every trader starts at the bottom. Where you end up depends on how consistent you are.</p>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {rankTiers.map((r, i) => (
                <div key={r.name} style={{
                  display: 'grid', gridTemplateColumns: '32px 1fr 160px',
                  alignItems: 'center', gap: '12px', padding: '10px 4px',
                  borderBottom: i < rankTiers.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                }}>
                  <span style={{ fontSize: '18px', textAlign: 'center', lineHeight: 1 }}>{r.icon}</span>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: r.color }}>{r.name}</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'right' }}>{r.xp}</span>
                </div>
              ))}
            </div>
          </motion.div>

        </div>
      </div>
    </motion.div>
  )
}