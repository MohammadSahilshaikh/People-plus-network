// Example payment gateway webhook handler.
//
// This is a TEMPLATE: plug in your actual gateway's signature verification
// (Razorpay, Stripe, Cashfree, etc.) where marked below. The core rule this
// file exists to enforce: an order is NEVER marked "paid" except from here,
// after the signature has been verified, using an idempotency key derived
// from the gateway's own event/payment id so a retried webhook can't double
// -credit anyone.
//
// Vercel serverless function: POST /api/payments/webhook
import { getSupabaseAdmin } from '../_supabaseAdmin.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // --------------------------------------------------------------------
  // 1. Verify the webhook signature using your gateway's SDK/shared secret.
  //    Do not proceed past this point unless verification succeeds.
  //
  //    const isValid = verifyGatewaySignature(req.headers, req.body, process.env.PAYMENT_WEBHOOK_SECRET)
  //    if (!isValid) return res.status(400).json({ error: 'Invalid signature' })
  // --------------------------------------------------------------------

  const { order_id: orderId, payment_id: providerPaymentId, status } = req.body || {}

  if (!orderId || !providerPaymentId) {
    return res.status(400).json({ error: 'Missing order_id or payment_id' })
  }

  const supabase = getSupabaseAdmin()
  const idempotencyKey = `webhook:${providerPaymentId}`

  try {
    if (status === 'succeeded' || status === 'captured') {
      const { error } = await supabase.rpc('mark_order_paid', {
        p_order_id: orderId,
        p_provider: 'example_gateway',
        p_provider_payment_id: providerPaymentId,
        p_idempotency_key: idempotencyKey,
      })
      if (error) throw error
    } else if (status === 'failed') {
      await supabase.from('orders').update({ status: 'failed' }).eq('id', orderId).eq('status', 'pending')
    }

    return res.status(200).json({ received: true })
  } catch (err) {
    console.error('Webhook processing failed:', err.message)
    return res.status(500).json({ error: 'Webhook processing failed' })
  }
}
