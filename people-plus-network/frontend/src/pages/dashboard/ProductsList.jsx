import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchActiveProducts } from '../../services/products'

export default function DashboardProductsList() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchActiveProducts().then(setProducts).finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Products</h1>
      {loading && <p className="mt-4 text-sm text-slate-500">Loading…</p>}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <div key={p.id} className="flex flex-col rounded-xl border border-slate-200 bg-white p-5">
            <div className="h-28 w-full overflow-hidden rounded-lg bg-slate-100">
              {p.image_url && <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />}
            </div>
            <p className="mt-3 font-semibold text-slate-900">{p.name}</p>
            <p className="mt-1 text-sm text-slate-500 flex-1">{p.description}</p>
            <p className="mt-3 font-semibold text-slate-900">₹{Number(p.price).toLocaleString('en-IN')}</p>
            <button
              onClick={() => navigate(`/checkout/${p.id}`)}
              className="mt-3 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              Buy Now
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
