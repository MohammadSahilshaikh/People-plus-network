import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchActiveProducts } from '../services/products'

export default function Products() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchActiveProducts().then(setProducts).catch((e) => setError(e.message)).finally(() => setLoading(false))
  }, [])

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-semibold text-slate-900">Products</h1>
      {loading && <p className="mt-4 text-sm text-slate-500">Loading products…</p>}
      {error && <p className="mt-4 text-sm text-red-600">Could not load products: {error}</p>}
      {!loading && !error && products.length === 0 && (
        <p className="mt-4 text-sm text-slate-500">No products are available right now.</p>
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
            <Link to={`/products/${p.id}`} className="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-brand-700">
              View Product
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
