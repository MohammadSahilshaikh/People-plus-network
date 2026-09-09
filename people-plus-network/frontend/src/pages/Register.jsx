import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { registerUser } from '../services/auth'

export default function Register() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name: '', phone: '', email: '', password: '', confirmPassword: '',
    referralCode: searchParams.get('ref') || '',
  })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [confirmationSent, setConfirmationSent] = useState(false)

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      setError('Please enter a valid email address.')
      return
    }
    if (!/^[0-9]{10}$/.test(form.phone)) {
      setError('Please enter a valid 10-digit phone number.')
      return
    }

    setLoading(true)
    try {
      const result = await registerUser({
        name: form.name,
        phone: form.phone,
        email: form.email,
        password: form.password,
        referralCode: form.referralCode.trim() || null,
      })
      if (result.needsEmailConfirmation) {
        setConfirmationSent(true)
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (confirmationSent) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center sm:px-6">
        <h1 className="text-xl font-semibold text-slate-900">Check your email</h1>
        <p className="mt-2 text-sm text-slate-500">
          We've sent a confirmation link to {form.email}. Confirm your email to finish creating
          your account.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-semibold text-slate-900">Create your account</h1>
      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <Field label="Full name" value={form.name} onChange={(v) => update('name', v)} required />
        <Field label="Phone" value={form.phone} onChange={(v) => update('phone', v)} required inputMode="numeric" />
        <Field label="Email" type="email" value={form.email} onChange={(v) => update('email', v)} required />
        <Field label="Password" type="password" value={form.password} onChange={(v) => update('password', v)} required />
        <Field label="Confirm password" type="password" value={form.confirmPassword} onChange={(v) => update('confirmPassword', v)} required />
        <Field
          label="Referral code (optional)"
          value={form.referralCode}
          onChange={(v) => update('referralCode', v)}
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-brand-600">Log in</Link>
      </p>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', required = false, inputMode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        type={type}
        value={value}
        required={required}
        inputMode={inputMode}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500"
      />
    </label>
  )
}
