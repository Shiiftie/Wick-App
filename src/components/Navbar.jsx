import { motion } from 'framer-motion'
import { Home, Trophy, Users, User, LogOut, MessageSquare } from 'lucide-react'

const navItems = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
  { id: 'floor', label: 'Trading Floor', icon: MessageSquare },
  { id: 'friends', label: 'Friends', icon: Users },
  { id: 'profile', label: 'Profile', icon: User },
]

export default function Navbar({ view, setView, user, onLogout }) {
  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      borderBottom: '1px solid var(--border)',
      background: 'rgba(5,5,5,0.9)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      padding: '0 32px', height: '60px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between'
    }}>
      <motion.div whileHover={{ scale: 1.05 }} style={{ cursor: 'pointer' }} onClick={() => setView('home')}>
        <span style={{ fontSize: '22px', fontWeight: '900', background: 'linear-gradient(135deg, #e8c84a, #f5e07a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.5px' }}>Wick</span>
      </motion.div>

      <div style={{ display: 'flex', gap: '4px' }}>
        {navItems.map(({ id, label, icon: Icon }) => {
          const active = view === id
          return (
            <motion.button key={id} onClick={() => setView(id)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '8px', border: 'none', background: active ? 'rgba(232,200,74,0.12)' : 'transparent', color: active ? 'var(--gold)' : 'var(--text-dim)', fontSize: '13px', fontWeight: active ? '700' : '400', cursor: 'pointer', transition: 'all 0.2s' }}>
              <Icon size={15} />
              {label}
            </motion.button>
          )
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</span>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onLogout}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-dim)', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}>
          <LogOut size={12} /> Log out
        </motion.button>
      </div>
    </nav>
  )
}