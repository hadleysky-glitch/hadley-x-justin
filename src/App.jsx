import { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

const USERS = {
  hadley: { name: 'Hadley', avatar: '/hadley.png', color: '#f9a8d4' },
  justin: { name: 'Justin', avatar: '/justin.png', color: '#93c5fd' },
}

const ITEMS = [
  { id: 'cheezit', emoji: '🧀', label: 'Cheez-It', image: '/cheezit.png' },
]

export default function App() {
  const [identity, setIdentity] = useState(() => localStorage.getItem('hjx_identity'))
  const [flyingItem, setFlyingItem] = useState(null)
  const [incomingMsg, setIncomingMsg] = useState(null)
  const [recentlySent, setRecentlySent] = useState(false)
  const channelRef = useRef(null)

  const me = identity ? USERS[identity] : null
  const them = identity === 'hadley' ? USERS.justin : USERS.hadley

  useEffect(() => {
    if (!identity) return

    const channel = supabase
      .channel('items')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'events',
      }, (payload) => {
        const { from_user, item_id } = payload.new
        if (from_user !== identity) {
          const item = ITEMS.find(i => i.id === item_id)
          if (item) triggerAnimation(item, false)
        }
      })
      .subscribe()

    channelRef.current = channel
    return () => { supabase.removeChannel(channel) }
  }, [identity])

  function triggerAnimation(item, fromMe) {
    setFlyingItem({ item, fromMe, key: Date.now() })
    if (!fromMe) {
      setIncomingMsg(`${them.name} sent you a Cheez-It! 🧀`)
      setTimeout(() => setIncomingMsg(null), 3000)
    }
    setTimeout(() => setFlyingItem(null), 1200)
  }

  async function sendItem(item) {
    if (recentlySent) return
    setRecentlySent(true)
    setTimeout(() => setRecentlySent(false), 1500)

    triggerAnimation(item, true)

    const { error } = await supabase.from('events').insert({
      from_user: identity,
      item_id: item.id,
    })

    if (error) {
      alert('Supabase error: ' + error.message + ' | code: ' + error.code)
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
            <img src={me.avatar} alt={me.name} className="avatar" />
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
                <img src={item.image} alt={item.label} className="item-img" />
                <span>send {item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {flyingItem && (
          <div
            key={flyingItem.key}
            className={`flying-item ${flyingItem.fromMe ? 'fly-right' : 'fly-left'}`}
          >
            <img src={flyingItem.item.image} alt={flyingItem.item.label} />
          </div>
        )}

        <div className="avatar-panel them">
          <div className="avatar-wrap">
            <img src={them.avatar} alt={them.name} className="avatar" />
            <div className="name-tag" style={{ background: them.color }}>{them.name}</div>
          </div>
          {incomingMsg && (
            <div className="incoming-msg">{incomingMsg}</div>
          )}
        </div>
      </div>

      <p className="footer-note">
        {recentlySent ? '✈️ sent!' : `tap to throw something at ${them.name}`}
      </p>
    </div>
  )
}
