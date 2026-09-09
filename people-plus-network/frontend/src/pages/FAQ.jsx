import React, { useState } from 'react'

const faqs = [
  { q: 'Is my payment secure?', a: 'Yes. Orders are only marked as paid after your payment is verified by our payment provider server-side. No frontend action can mark a payment complete.' },
  { q: 'How are referral rewards calculated?', a: 'Every product has a published commission rule (a percentage or fixed amount). Rewards are calculated automatically on the server when a referred purchase completes — never on the frontend.' },
  { q: 'What happens if an order is refunded?', a: 'If an order tied to a referral reward is refunded, the associated reward is reversed according to our refund policy.' },
  { q: 'How do I withdraw my earnings?', a: 'Go to Withdraw in your dashboard, enter your bank details and amount above the minimum threshold. Requests are reviewed by our team before payout.' },
  { q: 'Can I change my referral code after registering?', a: 'You can remove or change the referral code you entered before completing registration, but once registration is complete, referral attribution is fixed.' },
  { q: 'Do you guarantee income?', a: 'No. We never guarantee income or profit. Referral rewards depend on genuine purchases made through your link and are subject to our published rules.' },
]

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null)
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-semibold text-slate-900">Frequently Asked Questions</h1>
      <div className="mt-8 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
        {faqs.map((f, i) => (
          <div key={f.q} className="p-5">
            <button
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="flex w-full items-center justify-between text-left text-sm font-medium text-slate-900"
            >
              {f.q}
              <span className="ml-4 text-slate-400">{openIndex === i ? '−' : '+'}</span>
            </button>
            {openIndex === i && <p className="mt-2 text-sm text-slate-500">{f.a}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}
