import React from 'react'

export default function RefundPolicy() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-sm leading-relaxed text-slate-600 sm:px-6">
      <h1 className="text-2xl font-semibold text-slate-900">Refund Policy</h1>
      <p className="mt-2 text-xs text-slate-400">Last updated: [date]</p>
      <p className="mt-6">
        This is placeholder content. Replace it with refund terms reviewed by a qualified lawyer,
        consistent with applicable consumer protection law, before launch.
      </p>
      <Section title="Refund Eligibility">
        [Define your window, e.g. "within 7 days of purchase"] and the conditions under which a
        product purchase qualifies for a refund.
      </Section>
      <Section title="How Refunds Are Processed">
        Once an admin approves a refund, the order is marked "refunded" and the amount is credited
        back to your original payment method within [timeframe]. If a referral reward was already
        paid on that order, it is reversed as an adjustment to the referrer's wallet.
      </Section>
      <Section title="Non-Refundable Situations">
        [List any exceptions, e.g. after the product/service has been substantially used or after
        the eligibility window has closed.]
      </Section>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="mt-6">
      <p className="font-semibold text-slate-900">{title}</p>
      <p className="mt-2">{children}</p>
    </div>
  )
}
