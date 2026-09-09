import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchActiveProducts } from '../services/products'

const steps = [
  { title: 'Create Account', desc: 'Sign up in under a minute with your name, phone, and email.' },
  { title: 'Choose a Product', desc: 'Browse the product catalog and pick what fits your needs.' },
  { title: 'Complete Purchase', desc: 'Pay securely; every payment is verified before your order is confirmed.' },
  { title: 'Share Your Referral', desc: 'Get a unique referral link to share with friends and family.' },
  { title: 'Receive Eligible Rewards', desc: 'Earn referral rewards according to our published, transparent rules.' },
]

const faqs = [
  { q: 'Is my payment secure?', a: 'Yes. Payments are verified server-side before any order is marked complete.' },
  { q: 'How are referral rewards calculated?', a: 'Rewards follow published, database-driven rules tied to each product — never a hidden formula.' },
  { q: 'Can I withdraw my earnings anytime?', a: 'You can request a withdrawal any time above the minimum amount; requests are reviewed and processed by our team.' },
]

export default function Home() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchActiveProducts()
      .then(setProducts)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
            Buy. Share. Earn.
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            People Plus Network is a simple product platform: buy a product you value, then
            share your referral link. If someone completes a purchase through it, you earn a
            reward under our published, transparent rules.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/products" className="rounded-lg bg-brand-600 px-6 py-3 text-center text-sm font-medium text-white hover:bg-brand-700">
              View Products
            </Link>
            <Link to="/register" className="rounded-lg border border-slate-300 px-6 py-3 text-center text-sm font-medium text-slate-700 hover:bg-slate-50">
              Create Account
            </Link>
          </div>
        </div>
      </section>

      {/* Products */}
      <section id="products" className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-2xl font-semibold text-slate-900">Products</h2>
          {loading && <p className="mt-4 text-sm text-slate-500">Loading products…</p>}
          {error && <p className="mt-4 text-sm text-red-600">Could not load products: {error}</p>}
          {!loading && !error && products.length === 0 && (
            <p className="mt-4 text-sm text-slate-500">No products are available right now. Please check back soon.</p>
          )}
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <div key={p.id} className="flex flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="h-36 w-full overflow-hidden rounded-lg bg-slate-100">
                  {p.image_url && <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />}
                </div>
                <h3 className="mt-4 text-base font-semibold text-slate-900">{p.name}</h3>
                <p className="mt-1 flex-1 text-sm text-slate-500">{p.description}</p>
                <p className="mt-4 text-lg font-semibold text-slate-900">₹{Number(p.price).toLocaleString('en-IN')}</p>
                <Link
                  to={`/products/${p.id}`}
                  className="mt-4 rounded-lg border border-slate-300 px-4 py-2 text-center text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  View Product
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-2xl font-semibold text-slate-900">How It Works</h2>
        <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {steps.map((s, i) => (
            <li key={s.title} className="rounded-xl border border-slate-200 p-5">
              <p className="text-sm font-medium text-brand-600">Step {i + 1}</p>
              <p className="mt-1 font-semibold text-slate-900">{s.title}</p>
              <p className="mt-2 text-sm text-slate-500">{s.desc}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* FAQ */}
      <section className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <h2 className="text-2xl font-semibold text-slate-900">Frequently Asked Questions</h2>
          <div className="mt-8 space-y-6">
            {faqs.map((f) => (
              <div key={f.q}>
                <p className="font-medium text-slate-900">{f.q}</p>
                <p className="mt-1 text-sm text-slate-500">{f.a}</p>
              </div>
            ))}
          </div>
          <Link to="/faq" className="mt-6 inline-block text-sm font-medium text-brand-600">
            See all FAQs →
          </Link>
        </div>
      </section>
    </div>
  )
}
