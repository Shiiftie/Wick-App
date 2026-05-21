import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../supabase'
import { User, Zap, CheckCircle, AlertCircle, Camera } from 'lucide-react'

const COLORS = [
  '#e8c84a', '#00ff88', '#ff4466', '#7c5cfc', '#00c8ff',
  '#ff8c00', '#ff69b4', '#00bcd4', '#9c27b0', '#ffffff'
]

export default function ProfilePage({ user }) {
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [xp, setXp] = useState(0)
  const [usernameColor, setUsernameColor] = useState('#e8c84a')
  const [avatarUrl, setAvatarUrl] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [subscribed, setSubscribed] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('subscription') === 'success') setSubscribed(true)

    const fetchProfile = async () => {
      const { data } = await supabase.from('profiles').select('username, xp, username_color, bio, avatar_url').eq('id', user.id).single()
      if (data) {
        setUsername(data.username || '')
        setXp(data.xp || 0)
        setUsernameColor(data.username_color || '#e8c84a')
        setBio(data.bio || '')
        setAvatarUrl(data.avatar_url || null)
      }
    }
    fetchProfile()
  }, [])

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')

    const fileExt = file.name.split('.').pop()
    const filePath = `${user.id}/avatar.${fileExt}`

    const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true })

    if (uploadError) {
      setError(uploadError.message)
    } else {
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
      const url = `${data.publicUrl}?t=${Date.now()}`
      await supabase.from('profiles').upsert({ id: user.id, avatar_url: url })
      setAvatarUrl(url)
    }
    setUploading(false)
  }

  const handleSave = async () => {
    setLoading(true)
    setError('')
    setSuccess(false)
    const { error } = await supabase.from('profiles').upsert({ id: user.id, username, username_color: usernameColor, bio })
    if (error) setError(error.message)
    else setSuccess(true)
    setLoading(false)
  }

  const handleSubscribe = async () => {
    setCheckoutLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`https://hhxxrhtzhfmfudpmznkx.supabase.co/functions/v1/create-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ user_id: user.id, email: user.email })
      })
      const { url, error } = await res.json()
      if (error) throw new Error(error)
      window.location.href = url
    } catch (err) {
      setError(err.message)
    }
    setCheckoutLoading(false)
  }

  const xpLevel = Math.floor(xp / 500) + 1
  const xpProgress = (xp % 500) / 500 * 100

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px', marginBottom: '6px' }}>Profile</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>Manage your account and subscription.</p>
      </div>

      <AnimatePresence>
        {subscribed && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.3)', borderRadius: '12px', padding: '16px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <CheckCircle size={18} color="var(--green)" />
            <span style={{ color: 'var(--green)', fontWeight: '600' }}>🎉 Welcome to Wick Pro! You're all set.</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Avatar + Bio Row */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px', marginBottom: '16px', display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
        
        {/* Avatar */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{ width: '88px', height: '88px', borderRadius: '50%', overflow: 'hidden', background: 'var(--bg-3)', border: '2px solid var(--border)', cursor: 'pointer' }}
            onClick={() => fileInputRef.current?.click()}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, var(--purple), var(--gold))` }}>
                <span style={{ fontSize: '28px', fontWeight: '900', color: '#fff' }}>{username?.[0]?.toUpperCase() || '?'}</span>
              </div>
            )}
          </div>
          <motion.div whileHover={{ scale: 1.1 }} onClick={() => fileInputRef.current?.click()}
            style={{ position: 'absolute', bottom: 0, right: 0, width: '28px', height: '28px', background: 'var(--gold)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '2px solid var(--bg-2)' }}>
            <Camera size={13} color="#000" />
          </motion.div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />
          {uploading && <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px', textAlign: 'center' }}>Uploading...</p>}
        </div>

        {/* Username + Bio */}
        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>Username</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Choose a username"
              style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>Bio</label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell other traders about yourself..." rows={3} maxLength={200}
              style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '14px', outline: 'none', boxSizing: 'border-box', resize: 'none', fontFamily: 'Inter, sans-serif' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '11px', textAlign: 'right' }}>{bio.length}/200</p>
          </div>
        </div>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        {/* XP Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: '120px', height: '120px', background: 'radial-gradient(circle, rgba(232,200,74,0.1) 0%, transparent 70%)', transform: 'translate(20px, -20px)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{ width: '36px', height: '36px', background: 'rgba(232,200,74,0.15)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={18} color="var(--gold)" />
            </div>
            <span style={{ color: 'var(--text-dim)', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>XP & Level</span>
          </div>
          <p style={{ fontSize: '40px', fontWeight: '900', color: 'var(--gold)', letterSpacing: '-2px', marginBottom: '4px' }}>{xp}</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '16px' }}>Level {xpLevel}</p>
          <div style={{ background: 'var(--bg-3)', borderRadius: '999px', height: '6px', overflow: 'hidden' }}>
            <motion.div initial={{ width: 0 }} animate={{ width: `${xpProgress}%` }} transition={{ delay: 0.5, duration: 0.8, ease: 'easeOut' }}
              style={{ height: '100%', background: 'linear-gradient(90deg, var(--gold), #f5e07a)', borderRadius: '999px' }} />
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '6px' }}>{500 - (xp % 500)} XP to level {xpLevel + 1}</p>
        </motion.div>

        {/* Chat Color Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{ width: '36px', height: '36px', background: 'rgba(124,92,252,0.15)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={18} color="var(--purple)" />
            </div>
            <span style={{ color: 'var(--text-dim)', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Chat Color</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '12px' }}>Your username color in the Trading Floor</p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
            {COLORS.map(color => (
              <motion.div key={color} whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }} onClick={() => setUsernameColor(color)}
                style={{ width: '28px', height: '28px', borderRadius: '50%', background: color, cursor: 'pointer', border: usernameColor === color ? '3px solid #fff' : '2px solid transparent', boxSizing: 'border-box' }} />
            ))}
          </div>
          <div style={{ background: 'var(--bg-3)', borderRadius: '8px', padding: '10px 14px' }}>
            <span style={{ fontWeight: '700', color: usernameColor, fontSize: '14px' }}>{username || 'your_username'}</span>
            <span style={{ color: 'var(--text-muted)', margin: '0 4px' }}>:</span>
            <span style={{ color: '#e0e0e0', fontSize: '14px' }}>This is how you'll appear in chat</span>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ background: 'rgba(255,68,102,0.08)', border: '1px solid rgba(255,68,102,0.3)', borderRadius: '12px', padding: '14px 18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertCircle size={16} color="var(--red)" />
            <span style={{ color: 'var(--red)', fontSize: '14px' }}>{error}</span>
          </motion.div>
        )}
        {success && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.3)', borderRadius: '12px', padding: '14px 18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CheckCircle size={16} color="var(--green)" />
            <span style={{ color: 'var(--green)', fontSize: '14px' }}>Profile saved!</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: 'flex', gap: '12px' }}>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleSave} disabled={loading}
          style={{ padding: '12px 24px', background: 'var(--gold)', color: '#000', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
          {loading ? 'Saving...' : 'Save Profile'}
        </motion.button>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleSubscribe} disabled={checkoutLoading}
          style={{ padding: '12px 24px', background: 'linear-gradient(135deg, #7c5cfc, #9d7fff)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Zap size={14} />
          {checkoutLoading ? 'Loading...' : 'Subscribe — $9.99/mo'}
        </motion.button>
      </div>
    </motion.div>
  )
}