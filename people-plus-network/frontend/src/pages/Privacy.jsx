import React from 'react'

export default function Privacy() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-sm leading-relaxed text-slate-600 sm:px-6">
      <h1 className="text-2xl font-semibold text-slate-900">Privacy Policy</h1>
      <p className="mt-2 text-xs text-slate-400">Last updated: [date]</p>
      <p className="mt-6">
        This is placeholder content. Replace it with a privacy policy reviewed by a qualified
        lawyer, tailored to the personal data you actually collect (India's DPDP Act and any other
        applicable law) before launch.
      </p>
      <Section title="Information We Collect">
        Name, phone number, email address, referral relationships, order and payment records, and
        support communications you send us.
      </Section>
      <Section title="How We Use It">
        To create and manage your account, process orders and referral rewards, process
        withdrawals, respond to support requests, and comply with legal obligations.
      </Section>
      <Section title="Data Storage">
        Your data is stored in our Supabase (PostgreSQL) database with row-level access controls.
        Payment proof files are stored privately and are never publicly accessible.
      </Section>
      <Section title="Your Rights">
        You may request a copy of your data or request that we delete your account, subject to our
        obligation to retain financial records as required by law.
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
