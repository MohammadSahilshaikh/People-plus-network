import React, { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, ShoppingBag, Wallet, ArrowDownToLine, Users,
  History, User, LifeBuoy, LogOut, Menu, X, Bell,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { logoutUser } from '../services/auth'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/dashboard/products', label: 'Products', icon: ShoppingBag },
  { to: '/wallet', label: 'Wallet', icon: Wallet },
  { to: '/withdraw', label: 'Withdraw', icon: ArrowDownToLine },
  { to: '/referrals', label: 'Referrals', icon: Users },
  { to: '/income-history', label: 'Income History', icon: History },
  { to: '/profile', label: 'Profile', icon: User },
  { to: '/support', label: 'Support', icon: LifeBuoy },
]

export default function DashboardLayout() {
  const { profile } = useAuth()
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  async function handleLogout() {
    await logoutUser()
    navigate('/login')
  }

  const SidebarContent = (
    <div className="flex h-full flex-col justify-between">
      <div>
        <div className="px-4 py-5">
          <p className="text-base font-semibold text-slate-900">People Plus Network</p>
        </div>
        <nav className="flex flex-col gap-1 px-2">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="border-t border-slate-200 p-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          <LogOut size={18} /> Logout
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white md:block">
        {SidebarContent}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-white shadow-xl">{SidebarContent}</aside>
        </div>
      )}

      <div className="flex min-h-screen flex-1 flex-col">
        {/* Mobile top header */}
        <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 md:hidden">
          <button onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu size={22} />
          </button>
          <p className="text-sm font-semibold">People Plus Network</p>
          <NavLink to="/notifications" aria-label="Notifications">
            <Bell size={20} />
          </NavLink>
        </header>

        <div className="hidden items-center justify-between border-b border-slate-200 bg-white px-6 py-3 md:flex">
          <p className="text-sm text-slate-500">Welcome back, {profile?.full_name?.split(' ')[0] || 'there'}</p>
          <NavLink to="/notifications" className="text-slate-500 hover:text-slate-900" aria-label="Notifications">
            <Bell size={20} />
          </NavLink>
        </div>

        <main className="flex-1 px-4 py-6 sm:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
