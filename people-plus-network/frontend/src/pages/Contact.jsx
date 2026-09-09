import React, { useState } from 'react'
import emailjs from '@emailjs/browser'

// EmailJS is safe to use client-side: it only needs a public key and
// pre-configured template, never a private secret. Configure the three
// VITE_EMAILJS_* values in your .env (see .env.example) and set up a
// matching template in your EmailJS dashboard.
export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [status, setStatus] = useState('idle') // idle | sending | sent | error

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('sending')
    try {
      await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_CONTACT_TEMPLATE_ID,
        { from_name: form.name, from_email: form.email, message: form.message },
        import.meta.env.VITE_EMAILJS_PUBLIC_KEY
      )
      setStatus('sent')
      setForm({ name: '', email: '', message: '' })
    } catch (err) {
      console.error(err)
      setStatus('error')
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-semibold text-slate-900">Contact Us</h1>
      <p className="mt-2 text-sm text-slate-500">Have a question? Send us a message and we'll get back to you.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <Field label="Name" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} />
        <Field label="Email" type="email" value={form.email} onChange={(v) => setForm((f) => ({ ...f, email: v }))} />
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Message</span>
          <textarea
            rows={5} value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500"
          />
        </label>

        {status === 'sent' && <p className="text-sm text-emerald-600">Message sent — thank you!</p>}
        {status === 'error' && <p className="text-sm text-red-600">Could not send your message. Please try again.</p>}

        <button type="submit" disabled={status === 'sending'} className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60">
          {status === 'sending' ? 'Sending…' : 'Send message'}
        </button>
      </form>
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
