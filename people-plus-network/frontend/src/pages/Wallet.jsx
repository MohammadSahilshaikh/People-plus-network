import React, { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { fetchWalletBalance, fetchTransactions, fetchPendingWithdrawalsTotal } from '../services/wallet'

export default function Wallet() {
  const { user } = useAuth()
  const [balance, setBalance] = useState(0)
  const [pending, setPending] = useState(0)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    Promise.all([
      fetchWalletBalance(user.id),
      fetchPendingWithdrawalsTotal(user.id),
      fetchTransactions(user.id),
    ]).then(([bal, pend, txns]) => {
      setBalance(bal)
      setPending(pend)
      setTransactions(txns)
    }).finally(() => setLoading(false))
  }, [user])

  const totalEarned = transactions.filter((t) => t.amount > 0).reduce((s, t) => s + Number(t.amount), 0)
  const totalWithdrawn = Math.abs(
    transactions.filter((t) => t.type === 'withdrawal').reduce((s, t) => s + Number(t.amount), 0)
  )

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Wallet</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Available Balance" value={balance} highlight />
        <StatCard label="Pending Withdrawals" value={pending} />
        <StatCard label="Total Earned" value={totalEarned} />
        <StatCard label="Total Withdrawn" value={totalWithdrawn} />
      </div>

      <h2 className="mt-10 text-base font-semibold text-slate-900">Transaction History</h2>
      {loading && <p className="mt-3 text-sm text-slate-500">Loading…</p>}
      {!loading && transactions.length === 0 && <p className="mt-3 text-sm text-slate-500">No transactions yet.</p>}

      <div className="mt-3 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
        {transactions.map((t) => (
          <div key={t.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-medium capitalize text-slate-900">{t.type.replace('_', ' ')}</p>
              <p className="text-xs text-slate-500">{new Date(t.created_at).toLocaleString()} · {t.description}</p>
            </div>
            <p className={`text-sm font-semibold ${t.amount >= 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
              {t.amount >= 0 ? '+' : ''}₹{Number(t.amount).toLocaleString('en-IN')}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

function StatCard({ label, value, highlight }) {
  return (
    <div className={`rounded-xl border p-4 ${highlight ? 'border-brand-200 bg-brand-50' : 'border-slate-200 bg-white'}`}>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-900">₹{Number(value).toLocaleString('en-IN')}</p>
    </div>
  )
}
