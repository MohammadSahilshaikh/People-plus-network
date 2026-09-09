import React, { useEffect, useState } from 'react'
import { Copy, Share2 } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { fetchReferralStats } from '../services/referrals'

export default function Referrals() {
  const { user, profile } = useAuth()
  const [stats, setStats] = useState({ referrals: [], total: 0, eligible: 0, earnings: 0 })
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!user) return
    fetchReferralStats(user.id).then(setStats).finally(() => setLoading(false))
  }, [user])

  const referralLink = `${window.location.origin}/register?ref=${profile?.referral_code || ''}`

  function handleCopy() {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'People Plus Network', url: referralLink })
      } catch {
        // user cancelled share sheet — no action needed
      }
    } else {
      handleCopy()
    }
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Referrals</h1>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
        <p className="text-sm text-slate-500">My Referral Code</p>
        <p className="mt-1 text-lg font-semibold text-slate-900">{profile?.referral_code}</p>

        <p className="mt-4 text-sm text-slate-500">My Referral Link</p>
        <div className="mt-1 flex flex-col gap-2 sm:flex-row">
          <input readOnly value={referralLink} className="flex-1 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm" />
          <div className="flex gap-2">
            <button onClick={handleCopy} className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              <Copy size={16} /> {copied ? 'Copied' : 'Copy'}
            </button>
            <button onClick={handleShare} className="flex items-center gap-2 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700">
              <Share2 size={16} /> Share
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Referrals" value={stats.total} />
        <StatCard label="Eligible Referrals" value={stats.eligible} />
        <StatCard label="Referral Earnings" value={`₹${Number(stats.earnings).toLocaleString('en-IN')}`} />
      </div>

      <h2 className="mt-10 text-base font-semibold text-slate-900">My Referrals</h2>
      {loading && <p className="mt-3 text-sm text-slate-500">Loading…</p>}
      {!loading && stats.referrals.length === 0 && <p className="mt-3 text-sm text-slate-500">No referrals yet — share your link to get started.</p>}

      <div className="mt-3 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
        {stats.referrals.map((r) => (
          <div key={r.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-medium text-slate-900">{r.referred?.full_name || 'Member'}</p>
              <p className="text-xs text-slate-500">{new Date(r.created_at).toLocaleDateString()}</p>
            </div>
            <StatusBadge status={r.status} />
          </div>
        ))}
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

const statusStyles = {
  pending: 'bg-amber-50 text-amber-700',
  eligible: 'bg-emerald-50 text-emerald-700',
  rejected: 'bg-red-50 text-red-700',
  reversed: 'bg-slate-100 text-slate-600',
}

function StatusBadge({ status }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusStyles[status] || 'bg-slate-100 text-slate-700'}`}>
      {status}
    </span>
  )
}
