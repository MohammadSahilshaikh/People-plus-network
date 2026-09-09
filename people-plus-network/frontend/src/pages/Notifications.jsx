import React, { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabaseClient'

export default function Notifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  async function load() {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setNotifications(data || [])
    setLoading(false)
  }

  useEffect(() => { if (user) load() }, [user])

  async function markAsRead(id) {
    await supabase.from('notifications').update({ read: true }).eq('id', id)
    setNotifications((ns) => ns.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  async function markAllAsRead() {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id)
    if (unreadIds.length === 0) return
    await supabase.from('notifications').update({ read: true }).in('id', unreadIds)
    setNotifications((ns) => ns.map((n) => ({ ...n, read: true })))
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Notifications</h1>
        <button onClick={markAllAsRead} className="text-sm font-medium text-brand-600">Mark all as read</button>
      </div>

      {loading && <p className="mt-6 text-sm text-slate-500">Loading…</p>}
      {!loading && notifications.length === 0 && <p className="mt-6 text-sm text-slate-500">No notifications yet.</p>}

      <div className="mt-6 space-y-3">
        {notifications.map((n) => (
          <button
            key={n.id}
            onClick={() => markAsRead(n.id)}
            className={`block w-full rounded-xl border p-4 text-left ${n.read ? 'border-slate-200 bg-white' : 'border-brand-200 bg-brand-50'}`}
          >
            <p className="text-sm font-medium text-slate-900">{n.title}</p>
            <p className="mt-1 text-sm text-slate-500">{n.message}</p>
            <p className="mt-2 text-xs text-slate-400">{new Date(n.created_at).toLocaleString()}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
