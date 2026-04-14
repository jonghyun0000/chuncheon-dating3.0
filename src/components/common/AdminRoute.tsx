// src/components/common/AdminRoute.tsx
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { FullScreenSpinner } from './ProtectedRoute'

export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading)           return <FullScreenSpinner />
  if (!user)             return <Navigate to="/login" replace />
  if (!user.is_active)   return <Navigate to="/" replace />
  if (user.role !== 'admin') return <Navigate to="/" replace />
  return <>{children}</>
}
