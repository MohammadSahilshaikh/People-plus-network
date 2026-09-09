// Vercel serverless function: POST /api/withdrawals/admin-update
// Body: { withdrawalId, newStatus, transactionReference, adminNotes }
//
// Every field the client sends here is treated as untrusted input. The
// caller's identity comes from their Supabase Auth token, not from the
// request body, and is checked against admin_users before anything happens.
import { getSupabaseAdmin, getAuthedUser, isAdmin } from '../_supabaseAdmin.js'

const ALLOWED_STATUSES = ['approved', 'rejected', 'processing', 'paid', 'failed']

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const user = await getAuthedUser(req)
  if (!user) return res.status(401).json({ error: 'Not authenticated' })
  if (!(await isAdmin(user.id))) return res.status(403).json({ error: 'Admin access required' })

  const { withdrawalId, newStatus, transactionReference, adminNotes } = req.body || {}
  if (!withdrawalId || !ALLOWED_STATUSES.includes(newStatus)) {
    return res.status(400).json({ error: 'Invalid request' })
  }

  const supabase = getSupabaseAdmin()
  try {
    const { data, error } = await supabase.rpc('admin_update_withdrawal', {
      p_withdrawal_id: withdrawalId,
      p_new_status: newStatus,
      p_admin_id: user.id,
      p_transaction_reference: transactionReference || null,
      p_admin_notes: adminNotes || null,
    })
    if (error) throw error
    return res.status(200).json({ withdrawal: data })
  } catch (err) {
    console.error('admin-update withdrawal failed:', err.message)
    return res.status(500).json({ error: err.message })
  }
}
