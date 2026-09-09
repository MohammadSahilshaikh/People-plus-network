import React, { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { fetchTransactions } from '../services/wallet'

const filters = [
  { key: 'all', label: 'All' },
  { key: 'referral_reward', label: 'Referral' },
  { key: 'reward', label: 'Rewards' },
  { key: 'withdrawal', label: 'Withdrawal' },
  { key: 'refund', label: 'Refund' },
]

export default function IncomeHistory() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    setLoading(true)
    fetchTransactions(user.id, { type: filter }).then(setTransactions).finally(() => setLoading(false))
  }, [user, filter])

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Income History</h1>

      <div className="mt-4 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium ${
              filter === f.key ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading && <p className="mt-6 text-sm text-slate-500">Loading…</p>}
      {!loading && transactions.length === 0 && <p className="mt-6 text-sm text-slate-500">No records found.</p>}

      {/* Desktop table */}
      <div className="mt-6 hidden overflow-hidden rounded-xl border border-slate-200 bg-white sm:block">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs text-slate-500">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {transactions.map((t) => (
              <tr key={t.id}>
                <td className="px-4 py-3 text-slate-600">{new Date(t.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3 capitalize text-slate-900">{t.type.replace('_', ' ')}</td>
                <td className="px-4 py-3 text-slate-500">{t.description}</td>
                <td className={`px-4 py-3 text-right font-medium ${t.amount >= 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                  {t.amount >= 0 ? '+' : ''}₹{Number(t.amount).toLocaleString('en-IN')}
                </td>
                <td className="px-4 py-3 capitalize text-slate-500">{t.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="mt-6 space-y-3 sm:hidden">
        {transactions.map((t) => (
          <div key={t.id} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium capitalize text-slate-900">{t.type.replace('_', ' ')}</p>
              <p className={`text-sm font-semibold ${t.amount >= 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                {t.amount >= 0 ? '+' : ''}₹{Number(t.amount).toLocaleString('en-IN')}
              </p>
            </div>
            <p className="mt-1 text-xs text-slate-500">{t.description}</p>
            <p className="mt-1 text-xs text-slate-400">{new Date(t.created_at).toLocaleDateString()} · {t.status}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
