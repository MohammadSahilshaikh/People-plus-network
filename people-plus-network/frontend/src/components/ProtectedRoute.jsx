import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-slate-500">
        Loading…
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  if (adminOnly && !profile?.is_admin) return <Navigate to="/dashboard" replace />

  return children
}
