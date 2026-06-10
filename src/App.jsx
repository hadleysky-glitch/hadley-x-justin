import { useState, useEffect, useRef } from 'react'

const SUPABASE_URL = 'https://lnvbzvxmshqqwllhxvjt.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxudmJ6dnhtc2hxcXdsbGh4dmp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwNDgwNTYsImV4cCI6MjA5NjYyNDA1Nn0.pzF4EqRMPL7qGvW0kTkQeXkar4mhDpbvtN-hR4fXJDI'

const USERS = {
  hadley: { name: 'Hadley', avatar: '/hadley.png', color: '#f9a8d4' },
  justin: { name: 'Justin', avatar: '/justin.png', color: '#93c5fd' },
}

const ITEMS = [
  { id: 'cheezit', label: 'Cheez-It',  image: '/cheezit.png', type: 'flying' },
  { id: 'heart',   label: 'heart ❤️',  image: '/heart.png',   type: 'reaction', actionDuration: 3000, reactionDuration: 3000 },
  { id: 'hi',      label: 'say hi 👋', image: null, emoji: '👋', type: 'reaction', actionDuration: 3000, reactionDuration: 3000, reactionSameAsAction: true, speechBubble: 'hi! 👋' },
  { id: 'chicken-sandwich', label: 'chicken sandwich 🍗', image: '/chicken-sandwich.png', type: 'reaction', actionDuration: 3000, reactionDuration: 3000, reactionSameAsAction: true },
]

function dbFetch(path, options = {}) {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })
}

export default function App() {
  const [identity, setIdentity] = useState(() => localStorage.getItem('hjx_identity'))
  const [flyingItem, setFlyingItem] = useState(null)
  const [incomingMsg, setIncomingMsg] = useState(null)
  const [pendingReceived, setPendingReceived] = useState([])
  const [gifOverlay, setGifOverlay] = useState(null)
  const [recentlySent, setRecentlySent] = useState(false)
  const [debug, setDebug] = useState('waiting...')
  const lastCheckedRef = useRef(null)

  const me = identity ? USERS[identity] : null
  const them = identity === 'hadley' ? USERS.justin : USERS.hadley

  useEffect(() => {
    if (!identity) return
    lastCheckedRef.current = new Date().toISOString()
    setDebug('polling...')
    const poll = setInterval(async () => {
      const since = lastCheckedRef.current
      const now = new Date().toISOString()
      try {
        const res = await dbFetch(
          `events?select=*&from_user=neq.${identity}&created_at=gt.${encodeURIComponent(since)}&order=created_at.asc`
        )
        const rows = await res.json()
        setDebug(`${new Date().toLocaleTimeString()} | ${res.status} | ${Array.isArray(rows) ? rows.length + ' rows' : JSON.stringify(rows)}`)
        lastCheckedRef.current = now
        if (Array.isArray(rows)) {
          for (const row of rows) {
            const item = ITEMS.find(i => i.id === row.item_id)
            if (!item) continue
            if (item.type === 'flying') {
              triggerFlyAnimation(item)
            } else {
              setPendingReceived(prev => [...prev, { key: row.id, item, fromUser: row.from_user }])
            }
          }
        }
      } catch (e) {
        setDebug('poll error: ' + e.message)
      }
    }, 2000)
    return () => clearInterval(poll)
  }, [identity])

  function triggerFlyAnimation(item) {
    setFlyingItem({ item, fromMe: false, key: Date.now() })
    setIncomingMsg(`${them.name} sent you a Cheez-It! 🧀`)
    setTimeout(() => setIncomingMsg(null), 3000)
    setTimeout(() => setFlyingItem(null), 1200)
  }

  function showGif(src, side, duration, text = null) {
    const key = Date.now()
    setGifOverlay({ src, side, key, text })
    setTimeout(() => {
      setGifOverlay(prev => prev?.key === key ? null : prev)
    }, duration)
  }

  function handleOpenReceived(pending) {
    setPendingReceived(prev => prev.filter(p => p.key !== pending.key))
    const reactionSrc = pending.item.reactionSameAsAction
      ? `/${identity}-${pending.item.id}.gif`
      : `/${identity}-${pending.item.id}-reaction.gif`
    showGif(`/${pending.fromUser}-${pending.item.id}.gif`, 'them', pending.item.actionDuration, pending.item.speechBubble || null)
    setTimeout(() => {
      showGif(reactionSrc, 'me', pending.item.reactionDuration, pending.item.speechBubble || null)
    }, pending.item.actionDuration + 300)
  }

  async function sendItem(item) {
    if (recentlySent) return
    setRecentlySent(true)
    setTimeout(() => setRecentlySent(false), 1500)
    if (item.type === 'flying') {
      setFlyingItem({ item, fromMe: true, key: Date.now() })
      setTimeout(() => setFlyingItem(null), 1200)
    } else if (item.type === 'reaction') {
      showGif(`/${identity}-${item.id}.gif`, 'me', item.actionDuration, item.speechBubble || null)
    }
    try {
      const res = await dbFetch('events', {
        method: 'POST',
        headers: { 'Prefer': 'return=minimal' },
        body: JSON.stringify({ from_user: identity, item_id: item.id }),
      })
      if (!res.ok) {
        const text = await res.text()
        alert(`Send failed (${res.status}): ${text}`)
      } else {
        setDebug('sent! waiting for poll...')
      }
    } catch (e) {
      alert('Network error: ' + e.message)
    }
  }

  function chooseIdentity(id) {
    localStorage.setItem('hjx_identity', id)
    setIdentity(id)
  }

  if (!identity) {
    return (
      <div className="picker-screen">
        <h1>who are you? 🥹</h1>
        <div className="picker-buttons">
          <button className="picker-btn hadley" onClick={() => chooseIdentity('hadley')}>
            <img src={USERS.hadley.avatar} alt="Hadley" />
            <span>Hadley</span>
          </button>
          <button className="picker-btn justin" onClick={() => chooseIdentity('justin')}>
            <img src={USERS.justin.avatar} alt="Justin" />
            <span>Justin</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="top-bar">
        <span className="title">hadley × justin</span>
        <button className="switch-btn" onClick={() => { localStorage.removeItem('hjx_identity'); setIdentity(null) }}>
          switch
        </button>
      </header>
      <div className="stage">
        <div className="avatar-panel me">
          <div className="avatar-wrap">
            {gifOverlay?.side === 'me' && gifOverlay.text && (
              <div className="speech-bubble">{gifOverlay.text}</div>
            )}
            <img src={me.avatar} alt={me.name} className="avatar" />
            {gifOverlay?.side === 'me' && (
              <img key={gifOverlay.key} src={gifOverlay.src} className="gif-overlay" alt="reaction" />
            )}
            <div className="name-tag" style={{ background: me.color }}>{me.name}</div>
          </div>
          <div className="send-area">
            {ITEMS.map(item => (
              <button
                key={item.id}
                className={`send-btn ${recentlySent ? 'sent' : ''}`}
                onClick={() => sendItem(item)}
                disabled={recentlySent}
              >
                {item.image
                  ? <img src={item.image} alt={item.label} className="item-img" />
                  : <span className="item-emoji">{item.emoji}</span>
                }
                <span>send {item.label}</span>
              </button>
            ))}
          </div>
        </div>
        {flyingItem && (
          <div key={flyingItem.key} className={`flying-item ${flyingItem.fromMe ? 'fly-right' : 'fly-left'}`}>
            <img src={flyingItem.item.image} alt={flyingItem.item.label} />
          </div>
        )}
        <div className="avatar-panel them">
          <div className="avatar-wrap">
            {gifOverlay?.side === 'them' && gifOverlay.text && (
              <div className="speech-bubble">{gifOverlay.text}</div>
            )}
            <img src={them.avatar} alt={them.name} className="avatar" />
            {gifOverlay?.side === 'them' && (
              <img key={gifOverlay.key} src={gifOverlay.src} className="gif-overlay" alt="reaction" />
            )}
            <div className="name-tag" style={{ background: them.color }}>{them.name}</div>
          </div>
          {incomingMsg && <div className="incoming-msg">{incomingMsg}</div>}
          {pendingReceived.map(p => (
            <button key={p.key} className="pending-notification" onClick={() => handleOpenReceived(p)}>
              {them.name} sent you a {p.item.label}
              <span className="tap-hint">tap to see ✨</span>
            </button>
          ))}
        </div>
      </div>
      <p className="footer-note">
        {recentlySent ? '✈️ sent!' : `tap to throw something at ${them.name}`}
      </p>
      <p style={{ fontSize: '0.7rem', color: '#aaa', marginTop: '0.25rem', padding: '0 1rem', textAlign: 'center', wordBreak: 'break-all' }}>
        {debug}
      </p>
    </div>
  )
}
