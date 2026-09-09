import { supabase } from '../lib/supabaseClient'

function generateReferralCode() {
  const digits = Math.floor(100000 + Math.random() * 900000)
  return `PPN${digits}`
}

export async function registerUser({ name, phone, email, password, referralCode }) {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  })
  if (authError) throw authError

  const userId = authData.user?.id
  if (!userId) {
    // Email confirmation is required before the session (and thus the
    // profile insert, which needs auth.uid()) exists. Caller should tell
    // the user to check their inbox.
    return { needsEmailConfirmation: true }
  }

  const code = generateReferralCode()
  const { error: profileError } = await supabase.from('profiles').insert({
    id: userId,
    full_name: name,
    phone,
    email,
    referral_code: code,
  })
  if (profileError) throw profileError

  if (referralCode) {
    // Server-validated: invalid codes and self-referrals are silently
    // ignored by this RPC rather than trusted from the client.
    const { error: refError } = await supabase.rpc('register_referral', {
      p_referred_id: userId,
      p_referral_code: referralCode,
    })
    if (refError) console.error('Referral attribution failed:', refError.message)
  }

  return { needsEmailConfirmation: false, userId }
}

export async function loginUser({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function logoutUser() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function requestPasswordReset(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })
  if (error) throw error
}
