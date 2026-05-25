import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Home, Trophy, Users, User, LogOut, MessageSquare, BarChart2, Newspaper, Menu, X, FlaskConical, Bot } from 'lucide-react'
import { supabase } from '../supabase'

const navItems = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'charts', label: 'Charts', icon: BarChart2 },
  { id: 'news', label: 'News', icon: Newspaper },
  { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
  { id: 'floor', label: 'Trading Floor', icon: MessageSquare },
  { id: 'simulator', label: 'Simulator', icon: FlaskConical },
  { id: 'friends', label: 'Friends', icon: Users },
  { id: 'profile', label: 'Profile', icon: User },
]

const bottomTabItems = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'charts', label: 'Charts', icon: BarChart2 },
  { id: 'simulator', label: 'Sim', icon: FlaskConical },
  { id: 'floor', label: 'Floor', icon: MessageSquare },
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
    <div style={{ position: 'relative', zIndex: 101, borderBottom: '1px solid rgba(232,200,74,0.12)', background: 'rgba(10,10,10,0.95)', overflow: 'hidden', height: '30px', display: 'flex', alignItems: 'center' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '40px', zIndex: 2, background: 'linear-gradient(to right, rgba(10,10,10,1), transparent)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '40px', zIndex: 2, background: 'linear-gradient(to left, rgba(10,10,10,1), transparent)', pointerEvents: 'none' }} />
      <div style={{ display: 'flex', gap: '48px', animation: 'tickerScroll 40s linear infinite', whiteSpace: 'nowrap', willChange: 'transform' }}
        onMouseEnter={e => e.currentTarget.style.animationPlayState = 'paused'}
        onMouseLeave={e => e.currentTarget.style.animationPlayState = 'running'}>
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

export default function Navbar({ view, setView, user, onLogout, onOpenVega }) {
  const [profile, setProfile] = useState(null)
  const [tickerItems, setTickerItems] = useState([])
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [menuOpen, setMenuOpen] = useState(false)

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
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

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
        if (topTraders?.[2]) liveItems.push({ text: `${topTraders[2].username} is climbing fast`, highlight: `#3 this week` })
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
    <>
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100 }}>
        <LiveTicker items={displayItems} />
        <nav style={{ borderBottom: '1px solid rgba(232,200,74,0.08)', background: 'rgba(5,5,5,0.92)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', padding: isMobile ? '0 16px' : '0 32px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <motion.div whileHover={{ scale: 1.05 }} style={{ cursor: 'pointer', flexShrink: 0 }} onClick={() => setView('home')}>
            <span style={{ fontSize: '24px', fontWeight: '900', background: 'linear-gradient(135deg, #e8c84a, #f5e07a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-1px' }}>Wick</span>
          </motion.div>
          {!isMobile && (
            <div style={{ display: 'flex', gap: '2px' }}>
              {navItems.map(({ id, label, icon: Icon }) => {
                const active = view === id
                const isSimulator = id === 'simulator'
                return (
                  <motion.button key={id} onClick={() => setView(id)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '8px', border: 'none', background: active ? (isSimulator ? 'rgba(0,255,136,0.1)' : 'rgba(232,200,74,0.1)') : 'transparent', color: active ? (isSimulator ? '#00ff88' : '#e8c84a') : 'rgba(255,255,255,0.35)', fontSize: '13px', fontWeight: active ? '700' : '400', cursor: 'pointer', transition: 'color 0.2s, background 0.2s' }}
                    onMouseEnter={e => { if (!active) { e.currentTarget.style.color = isSimulator ? 'rgba(0,255,136,0.7)' : 'rgba(232,200,74,0.7)'; e.currentTarget.style.background = isSimulator ? 'rgba(0,255,136,0.05)' : 'rgba(232,200,74,0.05)' } }}
                    onMouseLeave={e => { if (!active) { e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; e.currentTarget.style.background = 'transparent' } }}>
                    {active && <div style={{ position: 'absolute', inset: 0, borderRadius: '8px', background: isSimulator ? 'radial-gradient(ellipse at 50% 100%, rgba(0,255,136,0.15) 0%, transparent 70%)' : 'radial-gradient(ellipse at 50% 100%, rgba(232,200,74,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />}
                    <Icon size={14} strokeWidth={active ? 2.5 : 1.8} />
                    {label}
                    {active && <motion.div layoutId="activeTab" style={{ position: 'absolute', bottom: '0px', left: '8px', right: '8px', height: '2px', borderRadius: '2px 2px 0 0', background: isSimulator ? 'linear-gradient(90deg, transparent, #00ff88, transparent)' : 'linear-gradient(90deg, transparent, #e8c84a, transparent)', boxShadow: isSimulator ? '0 0 10px 2px rgba(0,255,136,0.6)' : '0 0 10px 2px rgba(232,200,74,0.6)' }} transition={{ type: 'spring', stiffness: 380, damping: 30 }} />}
                  </motion.button>
                )
              })}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            <motion.div whileHover={{ scale: 1.03 }} onClick={() => { setView('profile'); setMenuOpen(false) }}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '4px 8px', borderRadius: '8px' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: profile?.avatar_url ? 'transparent' : 'linear-gradient(135deg, #e8c84a, #d4b030)', border: '1.5px solid rgba(232,200,74,0.3)', boxShadow: '0 0 8px rgba(232,200,74,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '800', color: '#000', overflow: 'hidden', flexShrink: 0 }}>
                {profile?.avatar_url ? <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : displayName.charAt(0).toUpperCase()}
              </div>
              {!isMobile && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text)', lineHeight: 1 }}>{displayName}</span>
                  {rank && <span style={{ fontSize: '10px', color: 'var(--gold)', fontWeight: '500', lineHeight: 1 }}>{rank}</span>}
                </div>
              )}
            </motion.div>
            {!isMobile && (
              <>
                <div style={{ width: '1px', height: '20px', background: 'var(--border)' }} />
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onLogout}
                  style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 10px', background: 'transparent', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '7px', color: 'var(--text-muted)', fontSize: '12px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,80,80,0.3)'; e.currentTarget.style.color = '#ff6b6b' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'var(--text-muted)' }}>
                  <LogOut size={12} /> Log out
                </motion.button>
              </>
            )}
            {isMobile && (
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => setMenuOpen(!menuOpen)}
                style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}>
                {menuOpen ? <X size={18} /> : <Menu size={18} />}
              </motion.button>
            )}
          </div>
        </nav>
      </div>

      <AnimatePresence>
        {isMobile && menuOpen && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            style={{ position: 'fixed', top: '90px', left: '12px', right: '12px', zIndex: 99, background: 'rgba(10,10,10,0.97)', backdropFilter: 'blur(20px)', border: '1px solid rgba(232,200,74,0.12)', borderRadius: '16px', padding: '8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {navItems.map(({ id, label, icon: Icon }) => {
              const active = view === id
              const isSimulator = id === 'simulator'
              return (
                <motion.button key={id} whileTap={{ scale: 0.97 }} onClick={() => { setView(id); setMenuOpen(false) }}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '10px', border: 'none', background: active ? (isSimulator ? 'rgba(0,255,136,0.1)' : 'rgba(232,200,74,0.1)') : 'transparent', color: active ? (isSimulator ? '#00ff88' : '#e8c84a') : 'rgba(255,255,255,0.6)', fontSize: '14px', fontWeight: active ? '700' : '400', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
                  <Icon size={16} strokeWidth={active ? 2.5 : 1.8} />
                  {label}
                  {active && <div style={{ marginLeft: 'auto', width: '6px', height: '6px', borderRadius: '50%', background: isSimulator ? '#00ff88' : '#e8c84a' }} />}
                </motion.button>
              )
            })}
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => { if (onOpenVega) onOpenVega(); setMenuOpen(false) }}
              style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '10px', border: '1px solid rgba(232,200,74,0.25)', background: 'rgba(232,200,74,0.06)', color: '#e8c84a', fontSize: '14px', fontWeight: '700', cursor: 'pointer', textAlign: 'left', width: '100%', marginTop: '4px' }}>
              <Bot size={16} />
              VEGA — AI Assistant
              <motion.div animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }} style={{ marginLeft: 'auto', width: '7px', height: '7px', borderRadius: '50%', background: '#e8c84a', boxShadow: '0 0 6px rgba(232,200,74,0.8)' }} />
            </motion.button>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: '4px', paddingTop: '4px' }}>
              <motion.button whileTap={{ scale: 0.97 }} onClick={onLogout}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '10px', border: 'none', background: 'transparent', color: 'rgba(255,100,100,0.7)', fontSize: '14px', fontWeight: '400', cursor: 'pointer', width: '100%' }}>
                <LogOut size={16} /> Log out
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isMobile && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100, background: 'rgba(5,5,5,0.95)', backdropFilter: 'blur(24px)', borderTop: '1px solid rgba(232,200,74,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-around', height: '64px', paddingBottom: 'env(safe-area-inset-bottom)' }}>
          {bottomTabItems.map(({ id, label, icon: Icon }) => {
            const active = view === id
            const isSimulator = id === 'simulator'
            return (
              <motion.button key={id} whileTap={{ scale: 0.9 }} onClick={() => { setView(id); setMenuOpen(false) }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '3px', flex: 1, height: '100%', background: 'transparent', border: 'none', cursor: 'pointer', color: active ? (isSimulator ? '#00ff88' : '#e8c84a') : 'rgba(255,255,255,0.3)', position: 'relative' }}>
                {active && <motion.div layoutId="bottomTab" style={{ position: 'absolute', top: 0, left: '20%', right: '20%', height: '2px', borderRadius: '0 0 2px 2px', background: isSimulator ? 'linear-gradient(90deg, transparent, #00ff88, transparent)' : 'linear-gradient(90deg, transparent, #e8c84a, transparent)', boxShadow: isSimulator ? '0 0 8px rgba(0,255,136,0.6)' : '0 0 8px rgba(232,200,74,0.6)' }} transition={{ type: 'spring', stiffness: 380, damping: 30 }} />}
                <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
                <span style={{ fontSize: '10px', fontWeight: active ? '700' : '400' }}>{label}</span>
              </motion.button>
            )
          })}
        </div>
      )}
    </>
  )
}