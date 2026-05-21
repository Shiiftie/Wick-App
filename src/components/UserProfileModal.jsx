import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../supabase'
import { X, UserPlus, MessageCircle, Check } from 'lucide-react'

const RANKS = [
  { name: 'Stone Hands', min: 0, max: 499, color: '#888', icon: '🪨' },
  { name: 'Bronze Wick', min: 500, max: 1499, color: '#CD7F32', icon: '🥉' },
  { name: 'Silver Wick', min: 1500, max: 2999, color: '#C0C0C0', icon: '🥈' },
  { name: 'Gold Wick', min: 3000, max: 5999, color: '#FFD700', icon: '🥇' },
  { name: 'Platinum Wick', min: 6000, max: 9999, color: '#00c8ff', icon: '⚡' },
  { name: 'Diamond Wick', min: 10000, max: 14999, color: '#b9f2ff', icon: '💠' },
  { name: 'Obsidian Wick', min: 15000, max: 24999, color: '#7c5cfc', icon: '🌑' },
  { name: 'Crimson Wick', min: 25000, max: 39999, color: '#ff4466', icon: '🔴' },
  { name: 'Phantom Wick', min: 40000, max: 59999, color: '#e0aaff', icon: '👻' },
  { name: 'Titan Wick', min: 60000, max: 99999, color: '#ff8c00', icon: '⚔️' },
  { name: 'Legend Wick', min: 100000, max: 199999, color: '#e8c84a', icon: '🏆' },
  { name: 'Wick God', min: 200000, max: Infinity, color: '#fff', icon: '👁️' },
]

const ALL_BADGES = [
  { id: 'first_blood', name: 'First Blood', icon: '🩸' },
  { id: 'iron_hands', name: 'Iron Hands', icon: '🤜' },
  { id: 'grinder', name: 'The Grinder', icon: '⚙️' },
  { id: 'century', name: 'Century Club', icon: '💯' },
  { id: 'first_win', name: 'First W', icon: '🏆' },
  { id: 'win_streak_3', name: 'Hot Streak', icon: '🔥' },
  { id: 'win_streak_7', name: 'On Fire', icon: '🌋' },
  { id: 'patience', name: 'Patience Pays', icon: '🧘' },
  { id: 'thousand', name: 'Four Figures', icon: '💰' },
  { id: 'ten_thousand', name: 'Ten Bagger', icon: '💎' },
  { id: 'floor_rat', name: 'Floor Rat', icon: '🐀' },
  { id: 'og', name: 'OG Wick', icon: '👑' },
  { id: 'bronze_badge', name: 'Bronze Wick', icon: '🥉' },
  { id: 'silver_badge', name: 'Silver Wick', icon: '🥈' },
  { id: 'gold_badge', name: 'Gold Wick', icon: '🥇' },
  { id: 'diamond_badge', name: 'Diamond Wick', icon: '💠' },
  { id: 'consistency', name: 'Consistent', icon: '📅' },
  { id: 'night_owl', name: 'Night Owl', icon: '🦉' },
  { id: 'early_bird', name: 'Early Bird', icon: '🐦' },
  { id: 'self_aware', name: 'Self Aware', icon: '🧠' },
]

function getRank(xp) {
  return RANKS.find(r => xp >= r.min && xp <= r.max) || RANKS[0]
}

export default function UserProfileModal({ userId, currentUserId, onClose, onStartDM }) {
  const [profile, setProfile] = useState(null)
  const [badges, setBadges] = useState([])
  const [friendStatus, setFriendStatus] = useState(null) // null, 'pending', 'friends'
  const [loading, setLoading] = useState(true)
  const [friendLoading, setFriendLoading] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
      if (data) setProfile(data)

      const { data: badgeData } = await supabase.from('user_badges').select('badge_id').eq('user_id', userId)
      if (badgeData) setBadges(badgeData.map(b => b.badge_id))

      const { data: friendData } = await supabase.from('friends')
        .select('*')
        .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      
      if (friendData?.length > 0) {
        const rel = friendData.find(f =>
          (f.sender_id === currentUserId && f.receiver_id === userId) ||
          (f.sender_id === userId && f.receiver_id === currentUserId)
        )
        if (rel) setFriendStatus(rel.status)
      }

      setLoading(false)
    }
    fetchProfile()
  }, [userId])

  const handleAddFriend = async () => {
    setFriendLoading(true)
    await supabase.from('friends').insert({ sender_id: currentUserId, receiver_id: userId, status: 'pending' })
    setFriendStatus('pending')
    setFriendLoading(false)
  }

  if (!profile && !loading) return null

  const rank = profile ? getRank(profile.xp || 0) : null
  const earnedBadges = ALL_BADGES.filter(b => badges.includes(b.id))

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9 }}
          onClick={(e) => e.stopPropagation()}
          style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '420px', position: 'relative' }}
        >
          <button onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={18} />
          </button>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>Loading...</div>
          ) : (
            <>
              {/* Avatar + Info */}
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: `2px solid ${rank?.color}40` }}>
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, var(--purple), var(--gold))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: '900', color: '#fff' }}>
                      {profile.username?.[0]?.toUpperCase() || '?'}
                    </div>
                  )}
                </div>
                <div>
                  <p style={{ fontSize: '18px', fontWeight: '800', color: profile.username_color || 'var(--text)' }}>{profile.username || 'Unknown'}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                    <span style={{ fontSize: '16px' }}>{rank?.icon}</span>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: rank?.color }}>{rank?.name}</span>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{profile.xp || 0} XP</p>
                </div>
              </div>

              {/* Bio */}
              {profile.bio && (
                <div style={{ background: 'var(--bg-3)', borderRadius: '10px', padding: '12px 14px', marginBottom: '20px' }}>
                  <p style={{ fontSize: '14px', color: 'var(--text-dim)', lineHeight: '1.5' }}>{profile.bio}</p>
                </div>
              )}

              {/* Badges */}
              {earnedBadges.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>Badges</p>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {earnedBadges.map(badge => (
                      <div key={badge.id} title={badge.name} style={{ width: '36px', height: '36px', background: 'var(--bg-3)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', cursor: 'default' }}>
                        {badge.icon}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              {currentUserId !== userId && (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={handleAddFriend} disabled={friendLoading || friendStatus !== null}
                    style={{ flex: 1, padding: '10px', background: friendStatus === 'friends' ? 'rgba(0,255,136,0.1)' : friendStatus === 'pending' ? 'var(--bg-3)' : 'var(--gold)', color: friendStatus ? 'var(--text-dim)' : '#000', border: friendStatus ? '1px solid var(--border)' : 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: friendStatus ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    {friendStatus === 'friends' ? <><Check size={14} /> Friends</> : friendStatus === 'pending' ? 'Request Sent' : <><UserPlus size={14} /> Add Friend</>}
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => onStartDM(profile)}
                    style={{ flex: 1, padding: '10px', background: 'var(--bg-3)', color: 'var(--text-dim)', border: '1px solid var(--border)', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <MessageCircle size={14} /> Message
                  </motion.button>
                </div>
              )}
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}