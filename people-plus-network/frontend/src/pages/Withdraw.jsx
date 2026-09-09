import React, { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { fetchWalletBalance, fetchPendingWithdrawalsTotal, requestWithdrawal, fetchWithdrawals } from '../services/wallet'

const MIN_WITHDRAWAL = 500

export default function Withdraw() {
  const { user } = useAuth()
  const [balance, setBalance] = useState(0)
  const [pending, setPending] = useState(0)
  const [history, setHistory] = useState([])
  const [form, setForm] = useState({ amount: '', bankName: '', accountNumber: '', ifsc: '' })
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  async function refresh() {
    const [bal, pend, hist] = await Promise.all([
      fetchWalletBalance(user.id),
      fetchPendingWithdrawalsTotal(user.id),
      fetchWithdrawals(user.id),
    ])
    setBalance(bal)
    setPending(pend)
    setHistory(hist)
  }

  useEffect(() => { if (user) refresh() }, [user])

  const available = balance - pending

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    const amount = Number(form.amount)
    if (!amount || amount < MIN_WITHDRAWAL) {
      setError(`Minimum withdrawal amount is ₹${MIN_WITHDRAWAL}.`)
      return
    }
    if (amount > available) {
      setError('This amount exceeds your available balance.')
      return
    }
    if (!form.bankName || !form.accountNumber || !form.ifsc) {
      setError('Please fill in all bank details.')
      return
    }

    setSubmitting(true)
    try {
      // Server-side function re-validates balance atomically — the checks
      // above are only for a responsive UI, not the source of truth.
      await requestWithdrawal({
        userId: user.id, amount, bankName: form.bankName,
        accountNumber: form.accountNumber, ifsc: form.ifsc,
      })
      setSuccess('Your withdrawal request has been submitted and is pending review.')
      setForm({ amount: '', bankName: '', accountNumber: '', ifsc: '' })
      refresh()
    } catch (err) {
      setError(err.message || 'Could not submit withdrawal request.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Withdraw</h1>
      <p className="mt-1 text-sm text-slate-500">
        Available balance: <span className="font-medium text-slate-900">₹{Number(available).toLocaleString('en-IN')}</span>
      </p>

      <form onSubmit={handleSubmit} className="mt-6 max-w-md space-y-4 rounded-xl border border-slate-200 bg-white p-6">
        <Field label="Amount" value={form.amount} onChange={(v) => setForm((f) => ({ ...f, amount: v }))} type="number" />
        <Field label="Bank Name" value={form.bankName} onChange={(v) => setForm((f) => ({ ...f, bankName: v }))} />
        <Field label="Account Number" value={form.accountNumber} onChange={(v) => setForm((f) => ({ ...f, accountNumber: v }))} />
        <Field label="IFSC" value={form.ifsc} onChange={(v) => setForm((f) => ({ ...f, ifsc: v }))} />

        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-emerald-600">{success}</p>}

        <button
          type="submit" disabled={submitting}
          className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {submitting ? 'Submitting…' : 'Request Withdrawal'}
        </button>
      </form>

      <h2 className="mt-10 text-base font-semibold text-slate-900">Withdrawal History</h2>
      <div className="mt-3 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
        {history.length === 0 && <p className="p-4 text-sm text-slate-500">No withdrawal requests yet.</p>}
        {history.map((w) => (
          <div key={w.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-medium text-slate-900">₹{Number(w.amount).toLocaleString('en-IN')}</p>
              <p className="text-xs text-slate-500">{new Date(w.created_at).toLocaleDateString()}</p>
            </div>
            <StatusBadge status={w.status} />
          </div>
        ))}
      </div>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        type={type} value={value} onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500"
      />
    </label>
  )
}

const statusStyles = {
  pending: 'bg-amber-50 text-amber-700',
  approved: 'bg-blue-50 text-blue-700',
  processing: 'bg-blue-50 text-blue-700',
  paid: 'bg-emerald-50 text-emerald-700',
  rejected: 'bg-red-50 text-red-700',
  failed: 'bg-red-50 text-red-700',
}

function StatusBadge({ status }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusStyles[status] || 'bg-slate-100 text-slate-700'}`}>
      {status}
    </span>
  )
}
