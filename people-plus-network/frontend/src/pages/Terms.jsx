import React from 'react'

export default function Terms() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-sm leading-relaxed text-slate-600 sm:px-6">
      <h1 className="text-2xl font-semibold text-slate-900">Terms of Service</h1>
      <p className="mt-2 text-xs text-slate-400">Last updated: [date]</p>

      <p className="mt-6">
        This is placeholder content. Replace it with terms reviewed by a qualified lawyer before
        launch — this is a starting structure, not legal advice.
      </p>

      <Section title="1. Products">
        Products sold on People Plus Network are described accurately, including price and
        specifications, on each product page. Prices are shown in INR and may change for future
        purchases; a completed order is priced at the amount shown at checkout.
      </Section>
      <Section title="2. Payments">
        Payments are processed through our payment provider. An order is only confirmed once
        payment has been verified. We do not store your full payment card details.
      </Section>
      <Section title="3. Referral Program">
        Registered users receive a unique referral code. Referral rewards are calculated
        automatically according to the commission rules published for each product and are paid
        only on valid, completed purchases. We do not reward fake registrations, duplicate
        accounts, or self-referrals. We do not guarantee any level of income from participation in
        the referral program.
      </Section>
      <Section title="4. Reward Eligibility">
        A referral reward becomes eligible once the referred purchase is marked paid. If that order
        is later refunded or cancelled, any associated reward is reversed.
      </Section>
      <Section title="5. Refunds">
        See our Refund Policy for full details on eligibility and process.
      </Section>
      <Section title="6. Withdrawals">
        Withdrawal requests are reviewed before payout and are subject to a minimum amount and
        valid bank details. We reserve the right to request additional verification before
        processing a withdrawal.
      </Section>
      <Section title="7. Account Suspension">
        We may suspend an account that we reasonably believe is involved in fraud, abuse of the
        referral system, or violation of these terms, pending investigation.
      </Section>
      <Section title="8. Data Handling">
        See our Privacy Policy for how we collect, use, and protect your data.
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
