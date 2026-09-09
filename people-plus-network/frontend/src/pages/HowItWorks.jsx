import React from 'react'

const steps = [
  { title: 'Create Account', desc: 'Sign up with your name, phone, and email in under a minute.' },
  { title: 'Choose a Product', desc: 'Browse our catalog and pick the product that fits your needs.' },
  { title: 'Complete Purchase', desc: 'Pay through our secure payment provider. Every payment is verified before your order is confirmed — no order is ever marked paid without that verification.' },
  { title: 'Share Your Referral', desc: 'Once registered, you get a unique referral code and link to share.' },
  { title: 'Receive Eligible Rewards', desc: 'When someone completes a purchase through your referral link, you may earn a reward according to our published, database-driven commission rules. Only valid, completed purchases are eligible — fake registrations, duplicate accounts, and self-referrals are never rewarded.' },
]

export default function HowItWorks() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-semibold text-slate-900">How It Works</h1>
      <ol className="mt-8 space-y-6">
        {steps.map((s, i) => (
          <li key={s.title} className="rounded-xl border border-slate-200 p-5">
            <p className="text-sm font-medium text-brand-600">Step {i + 1}</p>
            <p className="mt-1 font-semibold text-slate-900">{s.title}</p>
            <p className="mt-2 text-sm text-slate-500">{s.desc}</p>
          </li>
        ))}
      </ol>
    </div>
  )
}
