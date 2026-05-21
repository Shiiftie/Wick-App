import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../supabase'
import { MessageCircle, Check, X, Users } from 'lucide-react'

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

function getRank(xp) {
  return RANKS.find(r => xp >= r.min && xp <= r.max) || RANKS[0]
}

export default function FriendsPage({ user, onStartDM }) {
  const [friends, setFriends] = useState([])
  const [pendingReceived, setPendingReceived] = useState([])
  const [pendingSent, setPendingSent] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('friends')

  const fetchFriends = async () => {
    const { data } = await supabase
      .from('friends')
      .select('*')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)

    if (!data) return

    const friendRelations = data.filter(f => f.status === 'friends')
    const pending = data.filter(f => f.status === 'pending')

    const received = pending.filter(f => f.receiver_id === user.id)
    const sent = pending.filter(f => f.sender_id === user.id)

    // Fetch profiles for friends
    const friendIds = friendRelations.map(f => f.sender_id === user.id ? f.receiver_id : f.sender_id)
    const receivedIds = received.map(f => f.sender_id)
    const sentIds = sent.map(f => f.receiver_id)

    const allIds = [...new Set([...friendIds, ...receivedIds, ...sentIds])]

    if (allIds.length > 0) {
      const { data: profiles } = await supabase.from('profiles').select('id, username, avatar_url, username_color, xp').in('id', allIds)
      const profileMap = {}
      profiles?.forEach(p => { profileMap[p.id] = p })

      setFriends(friendIds.map(id => ({ ...profileMap[id], relationId: friendRelations.find(f => f.sender_id === id || f.receiver_id === id)?.id })))
      setPendingReceived(receivedIds.map(id => ({ ...profileMap[id], relationId: received.find(f => f.sender_id === id)?.id })))
      setPendingSent(sentIds.map(id => ({ ...profileMap[id], relationId: sent.find(f => f.receiver_id === id)?.id })))
    }

    setLoading(false)
  }

  useEffect(() => { fetchFriends() }, [])

  const handleAccept = async (relationId) => {
    await supabase.from('friends').update({ status: 'friends' }).eq('id', relationId)
    fetchFriends()
  }

  const handleDecline = async (relationId) => {
    await supabase.from('friends').delete().eq('id', relationId)
    fetchFriends()
  }

  const tabStyle = (t) => ({
    padding: '8px 20px',
    borderRadius: '8px',
    border: 'none',
    background: tab === t ? 'rgba(232,200,74,0.12)' : 'transparent',
    color: tab === t ? 'var(--gold)' : 'var(--text-muted)',
    fontSize: '13px',
    fontWeight: tab === t ? '700' : '400',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  })

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px', marginBottom: '6px' }}>Friends</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>Your trading circle. Message and connect.</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '6px', width: 'fit-content' }}>
        <button style={tabStyle('friends')} onClick={() => setTab('friends')}>
          <Users size={13} /> Friends {friends.length > 0 && `(${friends.length})`}
        </button>
        <button style={tabStyle('requests')} onClick={() => setTab('requests')}>
          Requests {pendingReceived.length > 0 && (
            <span style={{ background: 'var(--red)', color: '#fff', borderRadius: '999px', padding: '1px 7px', fontSize: '11px', fontWeight: '800' }}>
              {pendingReceived.length}
            </span>
          )}
        </button>
        <button style={tabStyle('sent')} onClick={() => setTab('sent')}>
          Sent {pendingSent.length > 0 && `(${pendingSent.length})`}
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>Loading...</div>
      ) : (
        <AnimatePresence mode="wait">
          {tab === 'friends' && (
            <motion.div key="friends" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {friends.length === 0 ? (
                <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: '16px', padding: '48px', textAlign: 'center' }}>
                  <p style={{ fontSize: '40px', marginBottom: '16px' }}>👥</p>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>No friends yet</h3>
                  <p style={{ color: 'var(--text-muted)' }}>Click on usernames in the Trading Floor to add friends.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {friends.map((friend) => {
                    const rank = getRank(friend.xp || 0)
                    return (
                      <motion.div key={friend.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: '14px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{ width: '44px', height: '44px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: `2px solid ${rank.color}40` }}>
                          {friend.avatar_url ? (
                            <img src={friend.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, var(--purple), var(--gold))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: '900', color: '#fff' }}>
                              {friend.username?.[0]?.toUpperCase() || '?'}
                            </div>
                          )}
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontWeight: '700', fontSize: '15px', color: friend.username_color || 'var(--text)' }}>{friend.username}</p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                            <span style={{ fontSize: '13px' }}>{rank.icon}</span>
                            <span style={{ fontSize: '12px', color: rank.color, fontWeight: '600' }}>{rank.name}</span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>· {friend.xp || 0} XP</span>
                          </div>
                        </div>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                          onClick={() => onStartDM(friend)}
                          style={{ padding: '8px 16px', background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-dim)', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <MessageCircle size={13} /> Message
                        </motion.button>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </motion.div>
          )}

          {tab === 'requests' && (
            <motion.div key="requests" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {pendingReceived.length === 0 ? (
                <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: '16px', padding: '48px', textAlign: 'center' }}>
                  <p style={{ fontSize: '40px', marginBottom: '16px' }}>📭</p>
                  <p style={{ color: 'var(--text-muted)' }}>No pending friend requests.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {pendingReceived.map((req) => (
                    <motion.div key={req.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: '14px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
                        {req.avatar_url ? (
                          <img src={req.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, var(--purple), var(--gold))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: '900', color: '#fff' }}>
                            {req.username?.[0]?.toUpperCase() || '?'}
                          </div>
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: '700', fontSize: '15px', color: req.username_color || 'var(--text)' }}>{req.username}</p>
                        <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Sent you a friend request</p>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                          onClick={() => handleAccept(req.relationId)}
                          style={{ padding: '8px 16px', background: 'var(--green)', border: 'none', borderRadius: '8px', color: '#000', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Check size={13} /> Accept
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                          onClick={() => handleDecline(req.relationId)}
                          style={{ padding: '8px', background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                          <X size={13} />
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {tab === 'sent' && (
            <motion.div key="sent" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {pendingSent.length === 0 ? (
                <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: '16px', padding: '48px', textAlign: 'center' }}>
                  <p style={{ fontSize: '40px', marginBottom: '16px' }}>📤</p>
                  <p style={{ color: 'var(--text-muted)' }}>No pending sent requests.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {pendingSent.map((req) => (
                    <motion.div key={req.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: '14px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
                        {req.avatar_url ? (
                          <img src={req.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, var(--purple), var(--gold))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: '900', color: '#fff' }}>
                            {req.username?.[0]?.toUpperCase() || '?'}
                          </div>
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: '700', fontSize: '15px', color: req.username_color || 'var(--text)' }}>{req.username}</p>
                        <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Request pending...</p>
                      </div>
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={() => handleDecline(req.relationId)}
                        style={{ padding: '8px 14px', background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--red)', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                        Cancel
                      </motion.button>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </motion.div>
  )
}