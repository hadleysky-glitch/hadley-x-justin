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
          `events?select=*&from_user=neq.${identity}&created_at=gt.${encodeURIComponent(since)}&order=created_at.a
