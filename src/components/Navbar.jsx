import { motion } from 'framer-motion'
import { LayoutDashboard, PenLine, Clock, Trophy, User, LogOut, MessageSquare, Shield, Users, Target, BookOpen } from 'lucide-react'

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'log', label: 'Log Session', icon: PenLine },
  { id: 'history', label: 'History', icon: Clock },
  { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
  { id: 'floor', label: 'Trading Floor', icon: MessageSquare },
  { id: 'badges', label: 'Ranks & Badges', icon: Shield },
  { id: 'friends', label: 'Friends', icon: Users },
  { id: 'goal', label: 'Goal Tracker', icon: Target },
  { id: 'rules', label: 'Trading Rules', icon: BookOpen },
  { id: 'profile', label: 'Profile', icon: User },
]

export default function Navbar({ view, setView, user, onLogout }) {
  return (
    <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, borderBottom: '1px solid var(--border)', background: 'rgba(5,5,5,0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', padding: '0 24px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', overflow: 'hidden' }}>
        <motion.div whileHover={{ scale: 1.05 }} style={{ cursor: 'pointer', flexShrink: 0 }} onClick={() => setView('dashboard')}>
          <span style={{ fontSize: '20px', fontWeight: '800', background: 'linear-gradient(135deg, #e8c84a, #f5e07a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.5px' }}>Wick</span>
        </motion.div>

        <div style={{ width: '1px', height: '20px', background: 'var(--border)', margin: '0 10px', flexShrink: 0 }} />

        <div style={{ display: 'flex', gap: '1px', overflow: 'hidden' }}>
          {navItems.map(({ id, label, icon: Icon }) => {
            const active = view === id
            return (
              <motion.button key={id} onClick={() => setView(id)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 8px', borderRadius: '8px', border: 'none', background: active ? 'rgba(232,200,74,0.12)' : 'transparent', color: active ? 'var(--gold)' : 'var(--text-dim)', fontSize: '11px', fontWeight: active ? '600' : '400', cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap', flexShrink: 0 }}>
                <Icon size={12} />
                {label}
              </motion.button>
            )
          })}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, marginLeft: '8px' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</span>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onLogout}
          style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px', background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-dim)', fontSize: '12px', fontWeight: '500', flexShrink: 0 }}>
          <LogOut size={12} />
          Log out
        </motion.button>
      </div>
    </nav>
  )
}