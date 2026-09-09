import { supabase } from '../lib/supabaseClient'

export async function fetchWalletBalance(userId) {
  const { data, error } = await supabase.rpc('wallet_balance', { p_user_id: userId })
  if (error) throw error
  return data ?? 0
}

export async function fetchTransactions(userId, { type } = {}) {
  let query = supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (type && type !== 'all') query = query.eq('type', type)
  const { data, error } = await query
  if (error) throw error
  return data
}

export async function fetchPendingWithdrawalsTotal(userId) {
  const { data, error } = await supabase
    .from('withdrawals')
    .select('amount')
    .eq('user_id', userId)
    .in('status', ['pending', 'processing', 'approved'])
  if (error) throw error
  return (data ?? []).reduce((sum, w) => sum + Number(w.amount), 0)
}

export async function requestWithdrawal({ userId, amount, bankName, accountNumber, ifsc }) {
  // Balance validation happens server-side inside this RPC (SECURITY
  // DEFINER function) — never trust a client-computed balance for this.
  const { data, error } = await supabase.rpc('request_withdrawal', {
    p_user_id: userId,
    p_amount: amount,
    p_bank_name: bankName,
    p_account_number: accountNumber,
    p_ifsc: ifsc,
  })
  if (error) throw error
  return data
}

export async function fetchWithdrawals(userId) {
  const { data, error } = await supabase
    .from('withdrawals')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}
