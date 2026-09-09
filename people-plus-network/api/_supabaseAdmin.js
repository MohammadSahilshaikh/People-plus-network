// Server-side Supabase client using the SERVICE ROLE key. This file must
// NEVER be imported into any frontend bundle — it belongs only in
// /api routes (Vercel serverless functions), which run server-side.
import { createClient } from '@supabase/supabase-js'

export function getSupabaseAdmin() {
  const url = process.env.VITE_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_URL in server environment.')
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

// Verifies the caller's Supabase Auth JWT (sent as a Bearer token) and
// returns the authenticated user, or null. Use this in every API route that
// needs to know "who is calling", instead of trusting a user_id in the body.
export async function getAuthedUser(req) {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.replace('Bearer ', '')
  if (!token) return null

  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase.auth.getUser(token)
  if (error) return null
  return data.user
}

export async function isAdmin(userId) {
  const supabase = getSupabaseAdmin()
  const { data } = await supabase.from('admin_users').select('id').eq('id', userId).maybeSingle()
  return !!data
}
