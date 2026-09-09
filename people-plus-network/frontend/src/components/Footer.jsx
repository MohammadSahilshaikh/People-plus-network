import React from 'react'
import { Link } from 'react-router-dom'

const columns = [
  { title: 'Company', links: [['About', '/#about'], ['Products', '/products'], ['How It Works', '/how-it-works'], ['FAQ', '/faq']] },
  { title: 'Support', links: [['Contact', '/contact'], ['Terms', '/terms'], ['Privacy', '/privacy'], ['Refund Policy', '/refund-policy']] },
]

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          <div className="col-span-2 sm:col-span-1">
            <p className="text-base font-semibold text-slate-900">People Plus Network</p>
            <p className="mt-2 text-sm text-slate-500">
              A simple, transparent platform for buying products and sharing referrals.
            </p>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <p className="text-sm font-semibold text-slate-900">{col.title}</p>
              <ul className="mt-3 space-y-2">
                {col.links.map(([label, to]) => (
                  <li key={label}>
                    <Link to={to} className="text-sm text-slate-500 hover:text-slate-900">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-10 border-t border-slate-200 pt-6 text-xs text-slate-400">
          © {new Date().getFullYear()} People Plus Network. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
