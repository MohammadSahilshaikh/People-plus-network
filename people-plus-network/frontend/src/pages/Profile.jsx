import React, { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabaseClient'
import { logoutUser } from '../services/auth'
import { useNavigate } from 'react-router-dom'

export default function Profile() {
  const { profile, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState(profile?.full_name || '')
  const [phone, setPhone] = useState(profile?.phone || '')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)

  const [passwords, setPasswords] = useState({ newPassword: '', confirmPassword: '' })
  const [pwMessage, setPwMessage] = useState(null)
  const [pwError, setPwError] = useState(null)

  async function handleSaveProfile(e) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)
    setError(null)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: name, phone })
        .eq('id', profile.id)
      if (error) throw error
      await refreshProfile()
      setMessage('Profile updated.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault()
    setPwMessage(null)
    setPwError(null)
    if (passwords.newPassword.length < 8) {
      setPwError('Password must be at least 8 characters.')
      return
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      setPwError('Passwords do not match.')
      return
    }
    try {
      const { error } = await supabase.auth.updateUser({ password: passwords.newPassword })
      if (error) throw error
      setPwMessage('Password updated.')
      setPasswords({ newPassword: '', confirmPassword: '' })
    } catch (err) {
      setPwError(err.message)
    }
  }

  async function handleLogout() {
    await logoutUser()
    navigate('/login')
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-semibold text-slate-900">Profile</h1>

      <form onSubmit={handleSaveProfile} className="mt-6 space-y-4 rounded-xl border border-slate-200 bg-white p-6">
        <Field label="Name" value={name} onChange={setName} />
        <Field label="Phone" value={phone} onChange={setPhone} />
        <Field label="Email" value={profile?.email || ''} disabled />
        <Field label="Referral Code" value={profile?.referral_code || ''} disabled />
        {message && <p className="text-sm text-emerald-600">{message}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={saving} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60">
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </form>

      <form onSubmit={handleChangePassword} className="mt-6 space-y-4 rounded-xl border border-slate-200 bg-white p-6">
        <p className="text-sm font-semibold text-slate-900">Change Password</p>
        <Field label="New password" type="password" value={passwords.newPassword} onChange={(v) => setPasswords((p) => ({ ...p, newPassword: v }))} />
        <Field label="Confirm new password" type="password" value={passwords.confirmPassword} onChange={(v) => setPasswords((p) => ({ ...p, confirmPassword: v }))} />
        {pwMessage && <p className="text-sm text-emerald-600">{pwMessage}</p>}
        {pwError && <p className="text-sm text-red-600">{pwError}</p>}
        <button type="submit" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          Update password
        </button>
      </form>

      <button onClick={handleLogout} className="mt-6 text-sm font-medium text-red-600">
        Logout
      </button>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', disabled = false }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        type={type} value={value} disabled={disabled}
        onChange={(e) => onChange && onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 disabled:bg-slate-50 disabled:text-slate-500"
      />
    </label>
  )
}
