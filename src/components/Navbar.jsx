import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
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

function LiveTicker({ tickerItems }) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (tickerItems.length === 0) return
    const interval = setInterval(() => {
      setIndex(i => (i + 1) % tickerItems.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [tickerItems.length])

  if (tickerItems.length === 0) return null

  return (
    <div style={{
      height: '28px',
      background: 'rgba(232,200,74,0.06)',
      borderBottom: '1px solid rgba(232,200,74,0.1)',
      display: 'flex',
      alignItems: 'center',
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* LIVE badge */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '5px',
        padding: '0 14px', borderRight: '1px solid rgba(232,200,74,0.15)',
        height: '100%', flexShrink: 0
      }}>
        <motion.div
          animate={{ opacity: [1, 0.2, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#e8c84a' }}
        />
        <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--gold)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Live</span>
      </div>

      {/* Ticker message */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative', height: '100%', display: 'flex', alignItems: 'center' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            style={{ paddingLeft: '16px', fontSize: '12px', color: 'var(--text-dim)', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <span style={{ color: 'var(--gold)' }}>{tickerItems[index]?.icon}</span>
            <span>{tickerItems[index]?.message}</span>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Separator dots */}
      <div style={{ display: 'flex', gap: '4px', paddingRight: '16px' }}>
        {tickerItems.map((_, i) => (
          <div key={i} style={{
            width: i === index ? '16px' : '4px', height: '4px', borderRadius: '2px',
            background: i === index ? 'var(--gold)' : 'rgba(232,200,74,0.2)',
            transition: 'all 0.3s'
          }} />
        ))}
      </div>
    </div>
  )
}

export default function Navbar({ view, setView, user, onLogout }) {
  const [profile, setProfile] = useState(null)
  const [tickerItems, setTickerItems] = useState([])

  useEffect(() => {
    if (!user) return

    // Fetch current user's profile
    const fetchProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('username, xp, avatar_url')
        .eq('id', user.id)
        .single()
      if (data) setProfile(data)
    }

    // Build ticker from live Supabase data
    const fetchTickerData = async () => {
      const items = []

      // Top weekly leaderboard
      const { data: topTraders } = await supabase
        .from('profiles')
        .select('username, xp')
        .order('xp', { ascending: false })
        .limit(3)

      if (topTraders && topTraders.length > 0) {
        items.push({
          icon: '🏆',
          message: `Weekly Leader: ${topTraders[0].username} — ${topTraders[0].xp.toLocaleString()} XP`
        })
        if (topTraders[1]) items.push({
          icon: '🥈',
          message: `#2 on the leaderboard: ${topTraders[1].username} — ${topTraders[1].xp.toLocaleString()} XP`
        })
        if (topTraders[2]) items.push({
          icon: '🥉',
          message: `#3 on the leaderboard: ${topTraders[2].username} — ${topTraders[2].xp.toLocaleString()} XP`
        })
      }

      // Recent sessions (last 5)
      const { data: recentSessions } = await supabase
        .from('sessions')
        .select('user_id, pnl, outcome, profiles(username)')
        .order('created_at', { ascending: false })
        .limit(5)

      if (recentSessions) {
        recentSessions.forEach(s => {
          const username = s.profiles?.username
          if (!username) return
          if (s.outcome === 'win' && s.pnl) {
            items.push({ icon: '📈', message: `${username} just logged a +$${s.pnl} win!` })
          } else if (s.outcome === 'loss' && s.pnl) {
            items.push({ icon: '📉', message: `${username} logged a session — staying disciplined.` })
          }
        })
      }

      // Total user count
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })

      if (count) {
        items.push({ icon: '🔥', message: `${count} traders are actively using Wick` })
      }

      if (items.length > 0) setTickerItems(items)
    }

    fetchProfile()
    fetchTickerData()

    // Refresh ticker every 60 seconds
    const interval = setInterval(fetchTickerData, 60000)
    return () => clearInterval(interval)
  }, [user])

  const displayName = profile?.username || user?.email?.split('@')[0] || 'Trader'
  const rank = profile ? getRank(profile.xp || 0) : null

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100 }}>
      {/* Live Ticker */}
      <LiveTicker tickerItems={tickerItems} />

      {/* Main Navbar */}
      <nav style={{
        borderBottom: '1px solid rgba(232,200,74,0.08)',
        background: 'rgba(5,5,5,0.92)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        padding: '0 32px',
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>

        {/* Logo */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          style={{ cursor: 'pointer', flexShrink: 0 }}
          onClick={() => setView('home')}
        >
          <span style={{
            fontSize: '24px', fontWeight: '900',
            background: 'linear-gradient(135deg, #e8c84a, #f5e07a)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            letterSpacing: '-1px'
          }}>
            Wick
          </span>
        </motion.div>

        {/* Nav Items */}
        <div style={{ display: 'flex', gap: '2px' }}>
          {navItems.map(({ id, label, icon: Icon }) => {
            const active = view === id
            return (
              <motion.button
                key={id}
                onClick={() => setView(id)}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                style={{
                  position: 'relative',
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '7px 13px', borderRadius: '8px', border: 'none',
                  background: active ? 'rgba(232,200,74,0.1)' : 'transparent',
                  color: active ? '#e8c84a' : 'var(--text-dim)',
                  fontSize: '13px', fontWeight: active ? '700' : '400',
                  cursor: 'pointer', transition: 'color 0.2s, background 0.2s',
                }}
              >
                <Icon size={14} strokeWidth={active ? 2.5 : 1.8} />
                {label}
                {/* Gold underline indicator */}
                {active && (
                  <motion.div
                    layoutId="activeTab"
                    style={{
                      position: 'absolute', bottom: '-1px', left: '8px', right: '8px',
                      height: '2px', borderRadius: '2px',
                      background: 'linear-gradient(90deg, #e8c84a, #f5e07a)',
                      boxShadow: '0 0 8px rgba(232,200,74,0.6)',
                    }}
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </motion.button>
            )
          })}
        </div>

        {/* Right side — user info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          {/* Avatar + name */}
          <motion.div
            whileHover={{ scale: 1.03 }}
            onClick={() => setView('profile')}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              cursor: 'pointer', padding: '4px 8px', borderRadius: '8px',
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            {/* Avatar circle */}
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%',
              background: profile?.avatar_url ? 'transparent' : 'linear-gradient(135deg, #e8c84a, #d4b030)',
              border: '1.5px solid rgba(232,200,74,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '11px', fontWeight: '800', color: '#000', overflow: 'hidden',
              flexShrink: 0
            }}>
              {profile?.avatar_url
                ? <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : displayName.charAt(0).toUpperCase()
              }
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text)', lineHeight: 1 }}>
                {displayName}
              </span>
              {rank && (
                <span style={{ fontSize: '10px', color: 'var(--gold)', fontWeight: '500', lineHeight: 1 }}>
                  {rank}
                </span>
              )}
            </div>
          </motion.div>

          {/* Divider */}
          <div style={{ width: '1px', height: '20px', background: 'var(--border)' }} />

          {/* Logout */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '6px 10px',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '7px',
              color: 'var(--text-muted)', fontSize: '12px', fontWeight: '500',
              cursor: 'pointer', transition: 'all 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,80,80,0.3)'; e.currentTarget.style.color = '#ff6b6b' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'var(--text-muted)' }}
          >
            <LogOut size={12} />
            Log out
          </motion.button>
        </div>
      </nav>
    </div>
  )
}