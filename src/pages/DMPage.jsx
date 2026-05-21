import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../supabase'
import { Send, ArrowLeft } from 'lucide-react'

export default function DMPage({ user, recipient, onBack }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [recipientProfile, setRecipientProfile] = useState(null)
  const bottomRef = useRef(null)

  useEffect(() => {
    const fetchRecipient = async () => {
      const { data } = await supabase.from('profiles').select('username, avatar_url, username_color').eq('id', recipient.id).single()
      if (data) setRecipientProfile(data)
    }
    fetchRecipient()
  }, [recipient.id])

  useEffect(() => {
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('direct_messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${recipient.id}),and(sender_id.eq.${recipient.id},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true })
      if (data) setMessages(data)

      // Mark messages as read
      await supabase.from('direct_messages')
        .update({ read: true })
        .eq('receiver_id', user.id)
        .eq('sender_id', recipient.id)
    }

    fetchMessages()

    const channel = supabase
      .channel(`dm-${user.id}-${recipient.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'direct_messages' }, (payload) => {
        const msg = payload.new
        if (
          (msg.sender_id === user.id && msg.receiver_id === recipient.id) ||
          (msg.sender_id === recipient.id && msg.receiver_id === user.id)
        ) {
          setMessages(prev => [...prev, msg])
        }
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [recipient.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || loading) return
    setLoading(true)
    const content = input.trim()
    setInput('')
    await supabase.from('direct_messages').insert({
      sender_id: user.id,
      receiver_id: recipient.id,
      content
    })
    setLoading(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const formatTime = (timestamp) => new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onBack}
          style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '8px 14px', color: 'var(--text-dim)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600' }}>
          <ArrowLeft size={14} /> Back
        </motion.button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden', background: 'linear-gradient(135deg, var(--purple), var(--gold))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '800', color: '#fff' }}>
            {recipientProfile?.avatar_url ? (
              <img src={recipientProfile.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              recipientProfile?.username?.[0]?.toUpperCase() || '?'
            )}
          </div>
          <div>
            <p style={{ fontWeight: '700', fontSize: '16px', color: recipientProfile?.username_color || 'var(--text)' }}>
              {recipientProfile?.username || 'Loading...'}
            </p>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Direct Message</p>
          </div>
        </div>
      </div>

      <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '600px' }}>
        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {messages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
              <p style={{ fontSize: '32px', marginBottom: '12px' }}>💬</p>
              <p style={{ fontSize: '15px' }}>No messages yet. Say hi!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.sender_id === user.id
              return (
                <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '70%',
                    background: isMe ? 'rgba(232,200,74,0.15)' : 'var(--bg-3)',
                    border: isMe ? '1px solid rgba(232,200,74,0.2)' : '1px solid var(--border)',
                    borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    padding: '10px 14px'
                  }}>
                    <p style={{ fontSize: '14px', color: isMe ? 'var(--gold)' : 'var(--text)', lineHeight: '1.5', wordBreak: 'break-word' }}>{msg.content}</p>
                    <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', textAlign: isMe ? 'right' : 'left' }}>{formatTime(msg.created_at)}</p>
                  </div>
                </motion.div>
              )
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', background: 'var(--bg-3)', display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${recipientProfile?.username || ''}...`}
            maxLength={1000}
            style={{ flex: 1, padding: '10px 14px', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '14px', outline: 'none', fontFamily: 'Inter, sans-serif' }}
          />
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleSend} disabled={loading || !input.trim()}
            style={{ width: '40px', height: '40px', background: input.trim() ? 'var(--gold)' : 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: input.trim() ? 'pointer' : 'not-allowed', flexShrink: 0 }}>
            <Send size={15} color={input.trim() ? '#000' : 'var(--text-muted)'} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}