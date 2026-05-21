import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../supabase'

const RANKS = [
  { name: 'Stone Hands', min: 0, max: 499, color: '#888', icon: '🪨', description: 'Every legend starts here.' },
  { name: 'Bronze Wick', min: 500, max: 1499, color: '#CD7F32', icon: '🥉', description: 'You showed up. Keep going.' },
  { name: 'Silver Wick', min: 1500, max: 2999, color: '#C0C0C0', icon: '🥈', description: 'Consistency is building.' },
  { name: 'Gold Wick', min: 3000, max: 5999, color: '#FFD700', icon: '🥇', description: 'The market respects you.' },
  { name: 'Platinum Wick', min: 6000, max: 9999, color: '#00c8ff', icon: '⚡', description: 'Elite level discipline.' },
  { name: 'Diamond Wick', min: 10000, max: 14999, color: '#b9f2ff', icon: '💠', description: 'Diamond hands, diamond mind.' },
  { name: 'Obsidian Wick', min: 15000, max: 24999, color: '#7c5cfc', icon: '🌑', description: 'You trade in the dark and win.' },
  { name: 'Crimson Wick', min: 25000, max: 39999, color: '#ff4466', icon: '🔴', description: 'Bloodbath? You thrive.' },
  { name: 'Phantom Wick', min: 40000, max: 59999, color: '#e0aaff', icon: '👻', description: 'Silent. Deadly. Precise.' },
  { name: 'Titan Wick', min: 60000, max: 99999, color: '#ff8c00', icon: '⚔️', description: 'Built different. Proven.' },
  { name: 'Legend Wick', min: 100000, max: 199999, color: '#e8c84a', icon: '🏆', description: 'Your name is known on the floor.' },
  { name: 'Wick God', min: 200000, max: Infinity, color: '#fff', icon: '👁️', description: 'Ascended. There is no ceiling.' },
]

const ALL_BADGES = [
  { id: 'first_blood', name: 'First Blood', description: 'Logged your very first session', icon: '🩸', rarity: 'common' },
  { id: 'iron_hands', name: 'Iron Hands', description: 'Logged 10 sessions total', icon: '🤜', rarity: 'common' },
  { id: 'grinder', name: 'The Grinder', description: 'Logged 25 sessions total', icon: '⚙️', rarity: 'uncommon' },
  { id: 'century', name: 'Century Club', description: 'Logged 100 sessions total', icon: '💯', rarity: 'rare' },
  { id: 'first_win', name: 'First W', description: 'Won your first trade', icon: '🏆', rarity: 'common' },
  { id: 'win_streak_3', name: 'Hot Streak', description: '3 wins in a row', icon: '🔥', rarity: 'uncommon' },
  { id: 'win_streak_7', name: 'On Fire', description: '7 wins in a row', icon: '🌋', rarity: 'rare' },
  { id: 'patience', name: 'Patience Pays', description: 'Logged 5 no-trade sessions', icon: '🧘', rarity: 'uncommon' },
  { id: 'thousand', name: 'Four Figures', description: 'Hit $1,000 total P&L', icon: '💰', rarity: 'uncommon' },
  { id: 'ten_thousand', name: 'Ten Bagger', description: 'Hit $10,000 total P&L', icon: '💎', rarity: 'epic' },
  { id: 'floor_rat', name: 'Floor Rat', description: 'Sent 50 messages on the Trading Floor', icon: '🐀', rarity: 'common' },
  { id: 'og', name: 'OG Wick', description: 'One of the first 100 users', icon: '👑', rarity: 'legendary' },
  { id: 'bronze_badge', name: 'Bronze Wick', description: 'Reached Bronze Wick rank', icon: '🥉', rarity: 'common' },
  { id: 'silver_badge', name: 'Silver Wick', description: 'Reached Silver Wick rank', icon: '🥈', rarity: 'uncommon' },
  { id: 'gold_badge', name: 'Gold Wick', description: 'Reached Gold Wick rank', icon: '🥇', rarity: 'rare' },
  { id: 'diamond_badge', name: 'Diamond Wick', description: 'Reached Diamond Wick rank', icon: '💠', rarity: 'epic' },
  { id: 'consistency', name: 'Consistent', description: 'Logged sessions 7 days in a row', icon: '📅', rarity: 'rare' },
  { id: 'night_owl', name: 'Night Owl', description: 'Logged a session after midnight', icon: '🦉', rarity: 'common' },
  { id: 'early_bird', name: 'Early Bird', description: 'Logged a session before 6am', icon: '🐦', rarity: 'common' },
  { id: 'self_aware', name: 'Self Aware', description: 'Filled out emotions on 10 sessions', icon: '🧠', rarity: 'uncommon' },
]

const RARITY_COLORS = {
  common: { color: '#aaa', bg: 'rgba(170,170,170,0.08)', border: 'rgba(170,170,170,0.2)', label: 'Common' },
  uncommon: { color: '#00ff88', bg: 'rgba(0,255,136,0.08)', border: 'rgba(0,255,136,0.2)', label: 'Uncommon' },
  rare: { color: '#00c8ff', bg: 'rgba(0,200,255,0.08)', border: 'rgba(0,200,255,0.2)', label: 'Rare' },
  epic: { color: '#7c5cfc', bg: 'rgba(124,92,252,0.08)', border: 'rgba(124,92,252,0.2)', label: 'Epic' },
  legendary: { color: '#e8c84a', bg: 'rgba(232,200,74,0.08)', border: 'rgba(232,200,74,0.3)', label: 'Legendary' },
}

export function getRank(xp) {
  return RANKS.find(r => xp >= r.min && xp <= r.max) || RANKS[0]
}

export default function BadgesPage({ user, xp = 0 }) {
  const [earnedBadges, setEarnedBadges] = useState([])
  const [newBadge, setNewBadge] = useState(null)
  const [loading, setLoading] = useState(true)

  const currentRank = getRank(xp)
  const nextRank = RANKS[RANKS.findIndex(r => r.name === currentRank.name) + 1]
  const rankProgress = nextRank ? ((xp - currentRank.min) / (nextRank.min - currentRank.min)) * 100 : 100

  useEffect(() => {
    const fetchBadges = async () => {
      const { data } = await supabase.from('user_badges').select('badge_id, earned_at').eq('user_id', user.id)
      if (data) setEarnedBadges(data.map(b => b.badge_id))
      setLoading(false)
    }
    fetchBadges()
  }, [])

  const earned = ALL_BADGES.filter(b => earnedBadges.includes(b.id))
  const locked = ALL_BADGES.filter(b => !earnedBadges.includes(b.id))

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* New Badge Popup */}
      <AnimatePresence>
        {newBadge && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: -50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: -50 }}
            style={{
              position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)',
              zIndex: 1000, background: 'var(--bg-2)', border: '1px solid var(--gold)',
              borderRadius: '16px', padding: '20px 32px', textAlign: 'center',
              boxShadow: '0 0 40px rgba(232,200,74,0.3)'
            }}
          >
            <p style={{ fontSize: '48px', marginBottom: '8px' }}>{newBadge.icon}</p>
            <p style={{ color: 'var(--gold)', fontWeight: '800', fontSize: '18px' }}>Badge Unlocked!</p>
            <p style={{ color: 'var(--text)', fontWeight: '700' }}>{newBadge.name}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px', marginBottom: '6px' }}>Ranks & Badges</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>Every action earns XP. Every XP point tells a story.</p>
      </div>

      {/* Current Rank Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        style={{
          background: `linear-gradient(135deg, var(--bg-2), var(--bg-3))`,
          border: `1px solid ${currentRank.color}40`,
          borderRadius: '20px', padding: '32px', marginBottom: '24px',
          position: 'relative', overflow: 'hidden'
        }}>
        <div style={{ position: 'absolute', top: 0, right: 0, width: '200px', height: '200px', background: `radial-gradient(circle, ${currentRank.color}15 0%, transparent 70%)`, transform: 'translate(40px, -40px)' }} />
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
          <div style={{ fontSize: '64px', lineHeight: 1 }}>{currentRank.icon}</div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Current Rank</p>
            <p style={{ fontSize: '28px', fontWeight: '900', color: currentRank.color, letterSpacing: '-0.5px' }}>{currentRank.name}</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>{currentRank.description}</p>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <p style={{ fontSize: '36px', fontWeight: '900', color: 'var(--gold)', letterSpacing: '-1px' }}>{xp}</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Total XP</p>
          </div>
        </div>

        {nextRank && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Progress to {nextRank.name}</span>
              <span style={{ color: nextRank.color, fontSize: '12px', fontWeight: '700' }}>{nextRank.min - xp} XP away</span>
            </div>
            <div style={{ background: 'var(--bg-3)', borderRadius: '999px', height: '8px', overflow: 'hidden' }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${rankProgress}%` }} transition={{ delay: 0.3, duration: 1, ease: 'easeOut' }}
                style={{ height: '100%', background: `linear-gradient(90deg, ${currentRank.color}, ${nextRank.color})`, borderRadius: '999px' }} />
            </div>
          </div>
        )}
      </motion.div>

      {/* All Ranks */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px' }}>All Ranks</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          {RANKS.map((rank) => {
            const isCurrentRank = rank.name === currentRank.name
            const isUnlocked = xp >= rank.min
            return (
              <motion.div key={rank.name} whileHover={{ scale: 1.03 }}
                style={{
                  background: isCurrentRank ? `${rank.color}15` : 'var(--bg-3)',
                  border: isCurrentRank ? `1px solid ${rank.color}60` : '1px solid var(--border)',
                  borderRadius: '12px', padding: '16px', textAlign: 'center',
                  opacity: isUnlocked ? 1 : 0.4
                }}>
                <p style={{ fontSize: '28px', marginBottom: '6px' }}>{rank.icon}</p>
                <p style={{ fontSize: '12px', fontWeight: '700', color: rank.color }}>{rank.name}</p>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{rank.min.toLocaleString()} XP</p>
                {isCurrentRank && <p style={{ fontSize: '10px', color: rank.color, fontWeight: '700', marginTop: '4px' }}>YOU ARE HERE</p>}
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* Earned Badges */}
      {earned.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px' }}>Earned Badges <span style={{ color: 'var(--gold)', fontSize: '14px' }}>({earned.length})</span></h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            {earned.map((badge, i) => {
              const rarity = RARITY_COLORS[badge.rarity]
              return (
                <motion.div key={badge.id} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                  whileHover={{ scale: 1.05, y: -4 }}
                  style={{ background: rarity.bg, border: `1px solid ${rarity.border}`, borderRadius: '14px', padding: '20px 16px', textAlign: 'center', cursor: 'default' }}>
                  <p style={{ fontSize: '36px', marginBottom: '8px' }}>{badge.icon}</p>
                  <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text)', marginBottom: '4px' }}>{badge.name}</p>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', lineHeight: '1.4' }}>{badge.description}</p>
                  <span style={{ fontSize: '10px', fontWeight: '700', color: rarity.color, background: `${rarity.color}15`, padding: '2px 8px', borderRadius: '999px' }}>
                    {rarity.label}
                  </span>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* Locked Badges */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px' }}>Locked Badges <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>({locked.length})</span></h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          {locked.map((badge) => {
            const rarity = RARITY_COLORS[badge.rarity]
            return (
              <motion.div key={badge.id} whileHover={{ scale: 1.03 }}
                style={{ background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: '14px', padding: '20px 16px', textAlign: 'center', opacity: 0.5 }}>
                <p style={{ fontSize: '36px', marginBottom: '8px', filter: 'grayscale(1)' }}>{badge.icon}</p>
                <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px' }}>{badge.name}</p>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', lineHeight: '1.4' }}>{badge.description}</p>
                <span style={{ fontSize: '10px', fontWeight: '700', color: rarity.color, background: `${rarity.color}15`, padding: '2px 8px', borderRadius: '999px' }}>
                  {rarity.label}
                </span>
              </motion.div>
            )
          })}
        </div>
      </motion.div>
    </motion.div>
  )
}