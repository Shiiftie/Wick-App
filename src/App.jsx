import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from './supabase'
import Navbar from './components/Navbar'
import DashboardPage from './pages/DashboardPage'
import LogSessionPage from './pages/LogSessionPage'
import HistoryPage from './pages/HistoryPage'
import LeaderboardPage from './pages/LeaderboardPage'
import ProfilePage from './pages/ProfilePage'

function AuthPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState('login')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
    }
    setLoading(false)
  }

  const inputStyle = {
    width: '100%',
    padding: '13px 16px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    color: '#fff',
    fontSize: '15px',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'Inter, sans-serif',
    transition: 'border-color 0.2s'
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Inter, sans-serif',
      position: 'relative',
    }}>
      {/* Background glow */}
      <div style={{
        position: 'absolute',
        top: '20%', left: '50%',
        transform: 'translateX(-50%)',
        width: '600px', height: '400px',
        background: 'radial-gradient(ellipse, rgba(232,200,74,0.06) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          width: '100%',
          maxWidth: '420px',
          padding: '0 24px'
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginTop: '40px', marginBottom: '40px' }}>
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{
              fontSize: '48px',
              fontWeight: '900',
              background: 'linear-gradient(135deg, #e8c84a, #f5e07a)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-1px',
              padding: '8px 0',
              marginBottom: '8px',
              lineHeight: '1.1'
            }}
          >
            Wick
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            style={{ color: 'var(--text-muted)', fontSize: '15px' }}
          >
            Trade. Reflect. Improve.
          </motion.p>
        </div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            background: 'var(--bg-2)',
            border: '1px solid var(--border)',
            borderRadius: '20px',
            padding: '32px',
          }}
        >
          {/* Toggle */}
          <div style={{
            display: 'flex',
            background: 'var(--bg-3)',
            borderRadius: '10px',
            padding: '4px',
            marginBottom: '28px'
          }}>
            {['login', 'signup'].map((m) => (
              <motion.button
                key={m}
                onClick={() => setMode(m)}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '8px',
                  border: 'none',
                  background: mode === m ? 'var(--bg-2)' : 'transparent',
                  color: mode === m ? 'var(--text)' : 'var(--text-muted)',
                  fontSize: '14px',
                  fontWeight: mode === m ? '600' : '400',
                  cursor: 'pointer',
                  boxShadow: mode === m ? '0 1px 4px rgba(0,0,0,0.3)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                {m === 'login' ? 'Log In' : 'Sign Up'}
              </motion.button>
            ))}
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{
                  background: 'rgba(255,68,102,0.08)',
                  border: '1px solid rgba(255,68,102,0.3)',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  marginBottom: '20px',
                  color: 'var(--red)',
                  fontSize: '13px'
                }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputStyle}
                required
              />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={inputStyle}
                required
              />
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                width: '100%',
                padding: '14px',
                background: 'linear-gradient(135deg, #e8c84a, #d4b030)',
                color: '#000',
                border: 'none',
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: '700',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'Loading...' : mode === 'login' ? 'Log In' : 'Create Account'}
            </motion.button>
          </form>
        </motion.div>

        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', marginTop: '24px', marginBottom: '40px' }}>
          The trading journal built for serious traders.
        </p>
      </motion.div>
    </div>
  )
}

function AppShell({ user }) {
  const [view, setView] = useState('dashboard')
  const [sessions, setSessions] = useState([])

  const fetchSessions = async () => {
    const { data } = await supabase.from('sessions').select('*').order('date', { ascending: false })
    if (data) setSessions(data)
  }

  useEffect(() => { fetchSessions() }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  const pageVariants = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'Inter, sans-serif' }}>
      <Navbar view={view} setView={setView} user={user} onLogout={handleLogout} />

      <main style={{ paddingTop: '64px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 32px' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.25 }}
            >
              {view === 'dashboard' && <DashboardPage sessions={sessions} setView={setView} />}
              {view === 'log' && <LogSessionPage user={user} onSessionSaved={() => { fetchSessions(); setView('dashboard') }} />}
              {view === 'history' && <HistoryPage sessions={sessions} />}
              {view === 'leaderboard' && <LeaderboardPage />}
              {view === 'profile' && <ProfilePage user={user} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        style={{ color: 'var(--gold)', fontSize: '24px', fontWeight: '800', letterSpacing: '-1px' }}
      >
        Wick
      </motion.div>
    </div>
  )

  if (!user) return <AuthPage />
  return <AppShell user={user} />
}