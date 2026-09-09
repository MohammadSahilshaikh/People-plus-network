import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchProductById } from '../services/products'
import { createPendingOrder } from '../services/orders'
import { useAuth } from '../hooks/useAuth'

// IMPORTANT: this page never marks an order as paid. It creates a 'pending'
// order, then hands off to your payment gateway's checkout. The order is
// only marked 'paid' once your gateway's webhook hits api/payments/webhook
// and is verified server-side (see api/payments/webhook.js). Wire up your
// actual gateway (Razorpay, Stripe, etc.) in that handler.
export default function Checkout() {
  const { id } = useParams()
  const { user, profile } = useAuth()
  const navigate = useNavigate()

  const [product, setProduct] = useState(null)
  const [referralCode, setReferralCode] = useState('')
  const [order, setOrder] = useState(null)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchProductById(id).then(setProduct).catch((e) => setError(e.message))
  }, [id])

  useEffect(() => {
    const stored = new URLSearchParams(window.location.search).get('ref')
    if (stored) setReferralCode(stored)
  }, [])

  async function handlePlaceOrder() {
    if (!product) return
    setSubmitting(true)
    setError(null)
    try {
      const newOrder = await createPendingOrder({
        userId: user.id,
        productId: product.id,
        amount: product.price,
        referralCode: referralCode.trim() || null,
      })
      setOrder(newOrder)
      // Hand off to your payment gateway here, e.g.:
      // window.location.href = await startGatewayCheckout(newOrder)
    } catch (err) {
      setError(err.message || 'Could not create order.')
    } finally {
      setSubmitting(false)
    }
  }

  if (error) return <p className="mx-auto max-w-lg px-4 py-16 text-sm text-red-600 sm:px-6">{error}</p>
  if (!product) return <p className="mx-auto max-w-lg px-4 py-16 text-sm text-slate-500 sm:px-6">Loading…</p>

  if (order) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">
        <h1 className="text-xl font-semibold text-slate-900">Order created</h1>
        <p className="mt-2 text-sm text-slate-500">
          Your order for {product.name} (₹{Number(product.price).toLocaleString('en-IN')}) is pending
          payment. Complete payment through the payment provider to confirm it. Your order will
          automatically update once payment is verified.
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          className="mt-6 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Go to dashboard
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">
      <h1 className="text-xl font-semibold text-slate-900">Checkout</h1>
      <div className="mt-6 rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between">
          <p className="font-medium text-slate-900">{product.name}</p>
          <p className="font-semibold text-slate-900">₹{Number(product.price).toLocaleString('en-IN')}</p>
        </div>
      </div>

      <label className="mt-6 block">
        <span className="text-sm font-medium text-slate-700">Referral code (optional)</span>
        <input
          value={referralCode}
          onChange={(e) => setReferralCode(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500"
          placeholder="PPN123456"
        />
      </label>

      <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-medium text-slate-700">Payment method</p>
        <p className="mt-1 text-sm text-slate-500">Configured payment gateway (set up by admin)</p>
      </div>

      <button
        onClick={handlePlaceOrder}
        disabled={submitting}
        className="mt-8 w-full rounded-lg bg-brand-600 px-6 py-3 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {submitting ? 'Placing order…' : 'Place order'}
      </button>
    </div>
  )
}
