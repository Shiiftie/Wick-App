import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Home, Trophy, Users, User, LogOut, MessageSquare, BarChart2, Newspaper } from 'lucide-react'
import { supabase } from '../supabase'

const navItems = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'charts', label: 'Charts', icon: BarChart2 },
  { id: 'news', label: 'News', icon: Newspaper },
  { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
  { id: 'floor', label: 'Trading Floor', icon: MessageSquare },
  { id: 'friends', label: 'Friends', icon: Users },
  { id: 'profile', label: 'Profile', icon: User },
]

const RANK_THRESHOLDS = [
  { name: 'Wick God', min: 200000 },
  { name: 'Grandmaster', min: 100000 },
  { name: 'Master', min: 50000 },
  { name: 'Diamond', min: 20000 },
  { name: 'Platinum', min: 10000 },
  { name: 'Gold', min: 5000 },
  { name: 'Silver', min: 1000 },
  { name: 'Bronze', min: 0 },
]

function getRank(xp) {
  return RANK_THRESHOLDS.find(r => xp >= r.min)?.name || 'Bronze'
}

function LiveTicker({ items }) {
  const doubled = [...items, ...items]
  if (items.length === 0) return null

  return (
    <div style={{
      position: 'relative', zIndex: 101,
      borderBottom: '1px solid rgba(232,200,74,0.12)',
      borderTop: '1px solid rgba(232,200,74,0.06)',
      background: 'rgba(10,10,10,0.95)',
      overflow: 'hidden', height: '30px',
      display: 'flex', alignItems: 'center',
    }}>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '60px', zIndex: 2, background: 'linear-gradient(to right, rgba(10,10,10,1), transparent)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '60px', zIndex: 2, background: 'linear-gradient(to left, rgba(10,10,10,1), transparent)', pointerEvents: 'none' }} />
      <div
        style={{ display: 'flex', gap: '48px', animation: 'tickerScroll 40s linear infinite', whiteSpace: 'nowrap', willChange: 'transform' }}
        onMouseEnter={e => e.currentTarget.style.animationPlayState = 'paused'}
        onMouseLeave={e => e.currentTarget.style.animationPlayState = 'running'}
      >
        {doubled.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'monospace', fontSize: '11px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.5px', flexShrink: 0 }}>
            <div style={{ width: '4px', height: '4px', background: '#e8c84a', borderRadius: '50%', opacity: 0.5, flexShrink: 0 }} />
            <span>{item.text} </span>
            <span style={{ color: '#e8c84a', fontWeight: '600' }}>{item.highlight}</span>
          </div>
        ))}
      </div>
      <style>{`@keyframes tickerScroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }`}</style>
    </div>
  )
}

export default function Navbar({ view, setView, user, onLogout }) {
  const [profile, setProfile] = useState(null)
  const [tickerItems, setTickerItems] = useState([])

  const staticItems = [
    { text: 'RileyWicks just earned the', highlight: '7-Day Warrior badge' },
    { text: 'GoldHunter_J reached', highlight: 'Gold Wick rank' },
    { text: 'MarcoFX just logged their', highlight: '50th session' },
    { text: 'AsianSesh_K earned', highlight: 'Ghost Mode badge' },
    { text: 'FundedUp just got their', highlight: 'first Topstep payout' },
    { text: 'ConsistentK completed', highlight: '30 days no revenge trades' },
    { text: 'PatienceWins unlocked', highlight: 'Iron Discipline badge' },
    { text: 'LevelUpFX climbed to', highlight: 'Silver Wick rank' },
  ]

  useEffect(() => {
    if (!user) return

    const fetchProfile = async () => {
      const { data } = await supabase.from('profiles').select('username, xp, avatar_url').eq('id', user.id).single()
      if (data) setProfile(data)
    }

    const fetchTickerData = async () => {
      const liveItems = [...staticItems]
      try {
        const { data: topTraders } = await supabase.from('profiles').select('username, xp').order('xp', { ascending: false }).limit(3)
        if (topTraders?.[0]) liveItems.push({ text: `${topTraders[0].username} leads the leaderboard with`, highlight: `${topTraders[0].xp.toLocaleString()} XP` })
        if (topTraders?.[1]) liveItems.push({ text: `${topTraders[1].username} is sitting at`, highlight: `#2 on the leaderboard` })
        if (topTraders?.[2]) liveItems.push({ text: `${topTraders[2].username} is climbing fast —`, highlight: `#3 this week` })

        const { data: recentWins } = await supabase.from('sessions').select('pnl, profiles(username)').eq('outcome', 'win').order('created_at', { ascending: false }).limit(4)
        recentWins?.forEach(s => { if (s.profiles?.username && s.pnl) liveItems.push({ text: `${s.profiles.username} just logged a`, highlight: `+$${s.pnl} win` }) })

        const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
        if (count) liveItems.push({ text: 'Join', highlight: `${count} traders already using Wick` })
      } catch (e) {}
      setTickerItems(liveItems)
    }

    fetchProfile()
    fetchTickerData()
    const interval = setInterval(fetchTickerData, 60000)
    return () => clearInterval(interval)
  }, [user])

  const displayItems = tickerItems.length > 0 ? tickerItems : staticItems
  const displayName = profile?.username || user?.email?.split('@')[0] || 'Trader'
  const rank = profile ? getRank(profile.xp || 0) : null

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100 }}>
      <LiveTicker items={displayItems} />

      <nav style={{
        borderBottom: '1px solid rgba(232,200,74,0.08)',
        background: 'rgba(5,5,5,0.92)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        padding: '0 32px', height: '60px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>

        {/* Logo */}
        <motion.div whileHover={{ scale: 1.05 }} style={{ cursor: 'pointer', flexShrink: 0 }} onClick={() => setView('home')}>
          <span style={{ fontSize: '24px', fontWeight: '900', background: 'linear-gradient(135deg, #e8c84a, #f5e07a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-1px' }}>
            Wick
          </span>
        </motion.div>

        {/* Nav Items */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {navItems.map(({ id, label, icon: Icon }) => {
            const active = view === id
            return (
              <motion.button
                key={id}
                onClick={() => setView(id)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  position: 'relative',
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '7px 14px', borderRadius: '8px', border: 'none',
                  background: active
                    ? 'rgba(232,200,74,0.1)'
                    : 'transparent',
                  color: active ? '#e8c84a' : 'rgba(255,255,255,0.35)',
                  fontSize: '13px', fontWeight: active ? '700' : '400',
                  cursor: 'pointer',
                  transition: 'color 0.2s, background 0.2s',
                  boxShadow: active ? 'inset 0 0 12px rgba(232,200,74,0.08)' : 'none',
                }}
                onMouseEnter={e => {
                  if (!active) {
                    e.currentTarget.style.color = 'rgba(232,200,74,0.7)'
                    e.currentTarget.style.background = 'rgba(232,200,74,0.05)'
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    e.currentTarget.style.color = 'rgba(255,255,255,0.35)'
                    e.currentTarget.style.background = 'transparent'
                  }
                }}
              >
                {/* Glow behind icon when active */}
                {active && (
                  <div style={{
                    position: 'absolute', inset: 0, borderRadius: '8px',
                    background: 'radial-gradient(ellipse at 50% 100%, rgba(232,200,74,0.15) 0%, transparent 70%)',
                    pointerEvents: 'none',
                  }} />
                )}

                <Icon size={14} strokeWidth={active ? 2.5 : 1.8} style={{ filter: active ? 'drop-shadow(0 0 4px rgba(232,200,74,0.7))' : 'none' }} />
                {label}

                {/* Glowing underline */}
                {active && (
                  <motion.div
                    layoutId="activeTab"
                    style={{
                      position: 'absolute', bottom: '0px', left: '8px', right: '8px',
                      height: '2px', borderRadius: '2px 2px 0 0',
                      background: 'linear-gradient(90deg, transparent, #e8c84a, transparent)',
                      boxShadow: '0 0 10px 2px rgba(232,200,74,0.6), 0 0 20px 4px rgba(232,200,74,0.3)',
                    }}
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </motion.button>
            )
          })}
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <motion.div
            whileHover={{ scale: 1.03 }}
            onClick={() => setView('profile')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '4px 8px', borderRadius: '8px', transition: 'background 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%',
              background: profile?.avatar_url ? 'transparent' : 'linear-gradient(135deg, #e8c84a, #d4b030)',
              border: '1.5px solid rgba(232,200,74,0.3)',
              boxShadow: '0 0 8px rgba(232,200,74,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '11px', fontWeight: '800', color: '#000', overflow: 'hidden', flexShrink: 0
            }}>
              {profile?.avatar_url
                ? <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : displayName.charAt(0).toUpperCase()
              }
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text)', lineHeight: 1 }}>{displayName}</span>
              {rank && <span style={{ fontSize: '10px', color: 'var(--gold)', fontWeight: '500', lineHeight: 1 }}>{rank}</span>}
            </div>
          </motion.div>

          <div style={{ width: '1px', height: '20px', background: 'var(--border)' }} />

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onLogout}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 10px', background: 'transparent', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '7px', color: 'var(--text-muted)', fontSize: '12px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,80,80,0.3)'; e.currentTarget.style.color = '#ff6b6b' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'var(--text-muted)' }}
          >
            <LogOut size={12} /> Log out
          </motion.button>
        </div>
      </nav>
    </div>
  )
}