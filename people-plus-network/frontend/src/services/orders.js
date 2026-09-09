import { supabase } from '../lib/supabaseClient'

// Creates a pending order only. Marking an order paid happens exclusively
// server-side (api/payments/*) after a verified payment — never from here.
export async function createPendingOrder({ userId, productId, amount, referralCode }) {
  let referrerId = null
  if (referralCode) {
    const { data: referrer } = await supabase
      .from('profiles')
      .select('id')
      .eq('referral_code', referralCode)
      .maybeSingle()
    if (referrer && referrer.id !== userId) referrerId = referrer.id
  }

  const { data, error } = await supabase
    .from('orders')
    .insert({
      user_id: userId,
      product_id: productId,
      amount,
      referral_code_used: referralCode || null,
      referrer_id: referrerId,
      status: 'pending',
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function fetchUserOrders(userId) {
  const { data, error } = await supabase
    .from('orders')
    .select('*, product:product_id(name)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}
