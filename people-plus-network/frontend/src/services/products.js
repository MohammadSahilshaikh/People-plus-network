import { supabase } from '../lib/supabaseClient'

export async function fetchActiveProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('status', 'active')
    .order('price', { ascending: true })
  if (error) throw error
  return data
}

export async function fetchProductById(id) {
  const { data, error } = await supabase.from('products').select('*').eq('id', id).single()
  if (error) throw error
  return data
}
