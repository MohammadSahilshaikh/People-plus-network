import React, { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabaseClient'

const categories = ['General', 'Payment', 'Withdrawal', 'Referral', 'Account']

export default function Support() {
  const { user } = useAuth()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ subject: '', category: 'General', message: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  async function loadTickets() {
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (!error) setTickets(data)
    setLoading(false)
  }

  useEffect(() => { if (user) loadTickets() }, [user])

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    if (!form.subject || !form.message) {
      setError('Please fill in subject and message.')
      return
    }
    setSubmitting(true)
    try {
      const { data: ticket, error: ticketError } = await supabase
        .from('support_tickets')
        .insert({ user_id: user.id, subject: form.subject, category: form.category })
        .select()
        .single()
      if (ticketError) throw ticketError

      const { error: messageError } = await supabase
        .from('support_messages')
        .insert({ ticket_id: ticket.id, sender_id: user.id, is_admin: false, message: form.message })
      if (messageError) throw messageError

      setForm({ subject: '', category: 'General', message: '' })
      loadTickets()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Support</h1>

      <form onSubmit={handleSubmit} className="mt-6 max-w-lg space-y-4 rounded-xl border border-slate-200 bg-white p-6">
        <p className="text-sm font-semibold text-slate-900">New Ticket</p>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Subject</span>
          <input value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500" />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Category</span>
          <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500">
            {categories.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Message</span>
          <textarea value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} rows={4}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500" />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={submitting} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60">
          {submitting ? 'Submitting…' : 'Submit Ticket'}
        </button>
      </form>

      <h2 className="mt-10 text-base font-semibold text-slate-900">My Tickets</h2>
      {loading && <p className="mt-3 text-sm text-slate-500">Loading…</p>}
      {!loading && tickets.length === 0 && <p className="mt-3 text-sm text-slate-500">No support tickets yet.</p>}
      <div className="mt-3 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
        {tickets.map((t) => (
          <div key={t.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-medium text-slate-900">{t.subject}</p>
              <p className="text-xs text-slate-500">{t.category} · {new Date(t.created_at).toLocaleDateString()}</p>
            </div>
            <StatusBadge status={t.status} />
          </div>
        ))}
      </div>
    </div>
  )
}

const statusStyles = {
  open: 'bg-amber-50 text-amber-700',
  in_progress: 'bg-blue-50 text-blue-700',
  resolved: 'bg-emerald-50 text-emerald-700',
  closed: 'bg-slate-100 text-slate-600',
}

function StatusBadge({ status }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusStyles[status] || 'bg-slate-100 text-slate-700'}`}>
      {status.replace('_', ' ')}
    </span>
  )
}
