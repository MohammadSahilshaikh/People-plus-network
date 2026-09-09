import { supabase } from '../lib/supabaseClient'

export async function fetchReferralStats(userId) {
  const { data, error } = await supabase
    .from('referrals')
    .select('*, referred:referred_id(full_name, created_at), order:order_id(product_id, amount)')
    .eq('referrer_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error

  const total = data.length
  const eligible = data.filter((r) => r.status === 'eligible').length
  const earnings = data
    .filter((r) => r.status === 'eligible')
    .reduce((sum, r) => sum + Number(r.reward_amount), 0)

  return { referrals: data, total, eligible, earnings }
}
