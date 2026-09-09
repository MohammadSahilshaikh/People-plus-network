import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { fetchWalletBalance, fetchTransactions } from '../../services/wallet'
import { fetchReferralStats } from '../../services/referrals'
import { fetchUserOrders } from '../../services/orders'

export default function Overview() {
  const { user, profile } = useAuth()
  const [balance, setBalance] = useState(0)
  const [referralStats, setReferralStats] = useState({ total: 0, eligible: 0, earnings: 0 })
  const [transactions, setTransactions] = useState([])
  const [currentOrder, setCurrentOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    Promise.all([
      fetchWalletBalance(user.id),
      fetchReferralStats(user.id),
      fetchTransactions(user.id),
      fetchUserOrders(user.id),
    ])
      .then(([bal, refs, txns, orders]) => {
        setBalance(bal)
        setReferralStats(refs)
        setTransactions(txns.slice(0, 5))
        setCurrentOrder(orders.find((o) => o.status === 'paid') || null)
      })
      .finally(() => setLoading(false))
  }, [user])

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Welcome, {profile?.full_name || 'there'}</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Current Product" value={currentOrder?.product?.name || '—'} />
        <StatCard label="Wallet Balance" value={`₹${Number(balance).toLocaleString('en-IN')}`} />
        <StatCard label="Referral Earnings" value={`₹${Number(referralStats.earnings).toLocaleString('en-IN')}`} />
        <StatCard label="Eligible Referrals" value={referralStats.eligible} />
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <Link to="/dashboard/products" className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-center text-sm font-medium text-slate-700 hover:bg-slate-50">
          Buy Product
        </Link>
        <Link to="/referrals" className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-center text-sm font-medium text-slate-700 hover:bg-slate-50">
          Share Referral
        </Link>
        <Link to="/withdraw" className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-center text-sm font-medium text-slate-700 hover:bg-slate-50">
          Withdraw
        </Link>
      </div>

      <div className="mt-10">
        <h2 className="text-base font-semibold text-slate-900">Recent Transactions</h2>
        {loading && <p className="mt-3 text-sm text-slate-500">Loading…</p>}
        {!loading && transactions.length === 0 && (
          <p className="mt-3 text-sm text-slate-500">No transactions yet.</p>
        )}
        <div className="mt-3 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
          {transactions.map((t) => (
            <div key={t.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium capitalize text-slate-900">{t.type.replace('_', ' ')}</p>
                <p className="text-xs text-slate-500">{new Date(t.created_at).toLocaleDateString()}</p>
              </div>
              <p className={`text-sm font-semibold ${t.amount >= 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                {t.amount >= 0 ? '+' : ''}₹{Number(t.amount).toLocaleString('en-IN')}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-900">{value}</p>
    </div>
  )
}
