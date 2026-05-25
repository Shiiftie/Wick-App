import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { supabase } from "./supabase"
import Navbar from "./components/Navbar"
import CandleBackground from "./components/CandleBackground"
import HomePage from "./pages/HomePage"
import ChartsPage from "./pages/ChartsPage"
import NewsPage from "./pages/NewsPage"
import LeaderboardPage from "./pages/LeaderboardPage"
import ProfilePage from "./pages/ProfilePage"
import BadgesPage from "./pages/BadgesPage"
import DMPage from "./pages/DMPage"
import FriendsPage from "./pages/FriendsPage"
import GoalTrackerPage from "./pages/GoalTrackerPage"
import TradingRulesPage from "./pages/TradingRulesPage"
import TradingFloorPage from "./pages/TradingFloorPage"
import SimulatorPage from "./pages/SimulatorPage"
import WickAIButton from "./components/WickAIButton"
import { Zap, CheckCircle } from "lucide-react"

function AuthPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState("login")
  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError("")
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
    }
    setLoading(false)
  }
  const inp = { width: "100%", padding: "13px 16px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "#fff", fontSize: "15px", outline: "none", boxSizing: "border-box", fontFamily: "Inter, sans-serif" }
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter, sans-serif", position: "relative" }}>
      <CandleBackground />
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} style={{ width: "100%", maxWidth: "420px", padding: "0 24px", position: "relative", zIndex: 2 }}>
        <div style={{ textAlign: "center", marginTop: "40px", marginBottom: "40px" }}>
          <h1 style={{ fontSize: "48px", fontWeight: "900", background: "linear-gradient(135deg, #e8c84a, #f5e07a)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: "-1px", padding: "8px 0", marginBottom: "8px" }}>Wick</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "15px" }}>Trade. Reflect. Improve.</p>
        </div>
        <div style={{ background: "rgba(13,13,13,0.85)", backdropFilter: "blur(20px)", border: "1px solid var(--border)", borderRadius: "20px", padding: "32px" }}>
          <div style={{ display: "flex", background: "var(--bg-3)", borderRadius: "10px", padding: "4px", marginBottom: "28px" }}>
            {["login", "signup"].map((m) => (
              <button key={m} onClick={() => setMode(m)} style={{ flex: 1, padding: "8px", borderRadius: "8px", border: "none", background: mode === m ? "var(--bg-2)" : "transparent", color: mode === m ? "var(--text)" : "var(--text-muted)", fontSize: "14px", fontWeight: mode === m ? "600" : "400", cursor: "pointer" }}>
                {m === "login" ? "Log In" : "Sign Up"}
              </button>
            ))}
          </div>
          {error && <div style={{ background: "rgba(255,68,102,0.08)", border: "1px solid rgba(255,68,102,0.3)", borderRadius: "8px", padding: "12px 16px", marginBottom: "20px", color: "var(--red)", fontSize: "13px" }}>{error}</div>}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "16px" }}><input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} style={inp} required /></div>
            <div style={{ marginBottom: "24px" }}><input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={inp} required /></div>
            <button type="submit" disabled={loading} style={{ width: "100%", padding: "14px", background: "linear-gradient(135deg, #e8c84a, #d4b030)", color: "#000", border: "none", borderRadius: "10px", fontSize: "15px", fontWeight: "700", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
              {loading ? "Loading..." : mode === "login" ? "Log In" : "Create Account"}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}

function PaywallPage({ user, onSignOut }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const handleSubscribe = async () => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch("https://hhxxrhtzhfmfudpmznkx.supabase.co/functions/v1/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + session.access_token },
        body: JSON.stringify({ user_id: user.id, email: user.email })
      })
      const { url, error } = await res.json()
      if (error) throw new Error(error)
      window.location.href = url
    } catch (err) { setError(err.message) }
    setLoading(false)
  }
  const features = ["Unlimited session logging","Full P&L tracking and analytics","XP system and rank progression","20+ badges to unlock","Live Trading Floor community chat","Weekly and monthly leaderboards","Live TradingView charts","Economic calendar & news","Paper trading simulator","Priority support"]
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter, sans-serif", position: "relative", overflow: "hidden" }}>
      <CandleBackground />
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} style={{ width: "100%", maxWidth: "480px", padding: "24px", position: "relative", zIndex: 2 }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <p style={{ fontSize: "13px", fontWeight: "700", color: "var(--gold)", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "12px" }}>Get Full Access</p>
          <h1 style={{ fontSize: "36px", fontWeight: "900", letterSpacing: "-1px", marginBottom: "8px" }}>Start Trading Smarter</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "15px" }}>Join traders who log, reflect, and improve every session.</p>
        </div>
        <div style={{ background: "rgba(13,13,13,0.85)", backdropFilter: "blur(20px)", border: "1px solid rgba(232,200,74,0.2)", borderRadius: "20px", padding: "32px", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "4px", marginBottom: "24px" }}>
            <span style={{ fontSize: "48px", fontWeight: "900", color: "var(--gold)", letterSpacing: "-2px" }}>$9.99</span>
            <span style={{ color: "var(--text-muted)", fontSize: "15px" }}>/month</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "28px" }}>
            {features.map((f) => (<div key={f} style={{ display: "flex", alignItems: "center", gap: "10px" }}><CheckCircle size={16} color="var(--green)" /><span style={{ fontSize: "14px", color: "var(--text-dim)" }}>{f}</span></div>))}
          </div>
          {error && <p style={{ color: "var(--red)", fontSize: "13px", marginBottom: "16px" }}>{error}</p>}
          <button onClick={handleSubscribe} disabled={loading} style={{ width: "100%", padding: "16px", background: "linear-gradient(135deg, #e8c84a, #d4b030)", color: "#000", border: "none", borderRadius: "12px", fontSize: "16px", fontWeight: "800", cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
            <Zap size={18} />{loading ? "Loading..." : "Subscribe Now - $9.99/mo"}
          </button>
          <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "12px", marginTop: "12px" }}>Cancel anytime. No hidden fees.</p>
        </div>
        <button onClick={onSignOut} style={{ width: "100%", background: "transparent", border: "none", color: "var(--text-muted)", fontSize: "13px", cursor: "pointer", padding: "8px" }}>Sign out</button>
      </motion.div>
    </div>
  )
}

function AppShell({ user }) {
  const [view, setView] = useState("home")
  const [sessions, setSessions] = useState([])
  const [xp, setXp] = useState(0)
  const [dmRecipient, setDmRecipient] = useState(null)
  const fetchSessions = async () => { const { data } = await supabase.from("sessions").select("*").order("date", { ascending: false }); if (data) setSessions(data) }
  const fetchXp = async () => { const { data } = await supabase.from("profiles").select("xp").eq("id", user.id).single(); if (data) setXp(data.xp || 0) }
  useEffect(() => { fetchSessions(); fetchXp() }, [])
  const handleLogout = async () => { await supabase.auth.signOut() }
  const handleStartDM = (profile) => { setDmRecipient({ id: profile.id, username: profile.username }); setView("dm") }
  const handleSessionSaved = () => { fetchSessions(); fetchXp() }
  const isFullWidth = view === "charts" || view === "news" || view === "simulator"
  const pv = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8 } }
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", fontFamily: "Inter, sans-serif", position: "relative" }}>
      <CandleBackground />
      <div style={{ position: "relative", zIndex: 2 }}>
        <Navbar view={view} setView={setView} user={user} onLogout={handleLogout} />
        <main style={{ paddingTop: "calc(env(safe-area-inset-top) + 88px)" }}>
          <div style={{ maxWidth: isFullWidth ? "100%" : "1100px", margin: "0 auto", padding: isFullWidth ? "0" : "24px" }}>
            <AnimatePresence mode="wait">
              <motion.div key={view} variants={pv} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.2 }}>
                {view === "home" && <HomePage user={user} sessions={sessions} onSessionSaved={handleSessionSaved} xp={xp} setView={setView} />}
                {view === "charts" && <ChartsPage />}
                {view === "news" && <NewsPage />}
                {view === "leaderboard" && <LeaderboardPage />}
                {view === "profile" && <ProfilePage user={user} />}
                {view === "badges" && <BadgesPage user={user} xp={xp} />}
                {view === "friends" && <FriendsPage user={user} onStartDM={handleStartDM} />}
                {view === "goal" && <GoalTrackerPage user={user} sessions={sessions} />}
                {view === "rules" && <TradingRulesPage user={user} />}
                {view === "floor" && <TradingFloorPage user={user} onStartDM={handleStartDM} />}
                {view === "simulator" && <SimulatorPage user={user} />}
                {view === "dm" && dmRecipient && <DMPage user={user} recipient={dmRecipient} onBack={() => setView("friends")} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  )
}

export default function App() {
  const [user, setUser] = useState(null)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const checkSubscription = async (sessionUser) => {
      if (!mounted) return
      if (!sessionUser) {
        setUser(null)
        setIsSubscribed(false)
        setLoading(false)
        return
      }
      setUser(sessionUser)
      try {
        const params = new URLSearchParams(window.location.search)
        if (params.get("subscription") === "success") {
          await supabase.from("profiles").upsert({ id: sessionUser.id, is_subscribed: true })
          if (mounted) { setIsSubscribed(true); setLoading(false) }
          window.history.replaceState({}, "", window.location.pathname)
          return
        }
        const { data } = await supabase.from("profiles").select("is_subscribed").eq("id", sessionUser.id).single()
        if (mounted) setIsSubscribed(data?.is_subscribed === true)
      } catch (err) {
        console.error(err)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    supabase.auth.getSession().then(({ data: { session } }) => checkSubscription(session?.user ?? null))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "INITIAL_SESSION") return
      checkSubscription(session?.user ?? null)
    })
    return () => { mounted = false; subscription.unsubscribe() }
  }, [])

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity }} style={{ color: "var(--gold)", fontSize: "24px", fontWeight: "800", letterSpacing: "-1px" }}>Wick</motion.div>
    </div>
  )

  if (!user) return <AuthPage />
  if (!isSubscribed) return <PaywallPage user={user} onSignOut={async () => { await supabase.auth.signOut(); setUser(null); setIsSubscribed(false) }} />
  return (
    <>
      <AppShell user={user} />
      <WickAIButton user={user} />
    </>
  )
}