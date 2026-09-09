import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchProductById } from '../services/products'
import { useAuth } from '../hooks/useAuth'

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [product, setProduct] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchProductById(id).then(setProduct).catch((e) => setError(e.message))
  }, [id])

  function handleBuy() {
    if (!user) {
      navigate(`/login?redirect=/products/${id}`)
      return
    }
    navigate(`/checkout/${id}`)
  }

  if (error) return <p className="mx-auto max-w-3xl px-4 py-16 text-sm text-red-600 sm:px-6">Could not load product: {error}</p>
  if (!product) return <p className="mx-auto max-w-3xl px-4 py-16 text-sm text-slate-500 sm:px-6">Loading…</p>

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="h-56 w-full overflow-hidden rounded-xl bg-slate-100">
        {product.image_url && <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />}
      </div>
      <h1 className="mt-6 text-2xl font-semibold text-slate-900">{product.name}</h1>
      <p className="mt-2 text-2xl font-semibold text-brand-600">₹{Number(product.price).toLocaleString('en-IN')}</p>
      <p className="mt-4 text-sm leading-relaxed text-slate-600">{product.description}</p>
      {product.terms && (
        <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-medium text-slate-900">Terms</p>
          <p className="mt-1 text-sm text-slate-500">{product.terms}</p>
        </div>
      )}
      <button onClick={handleBuy} className="mt-8 w-full rounded-lg bg-brand-600 px-6 py-3 text-sm font-medium text-white hover:bg-brand-700 sm:w-auto">
        Buy Now
      </button>
    </div>
  )
}
