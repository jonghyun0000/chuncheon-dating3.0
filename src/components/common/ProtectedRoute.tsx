// src/components/common/ProtectedRoute.tsx
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

interface Props {
  children:         React.ReactNode
  requireVerified?: boolean
}

export default function ProtectedRoute({ children, requireVerified = false }: Props) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <FullScreenSpinner />
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  if (!user.is_active) return <Navigate to="/" replace />
  if (requireVerified && user.verification_status !== 'verified') return <Navigate to="/verify" replace />

  return <>{children}</>
}

export function FullScreenSpinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100dvh', background: 'var(--color-bg)' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto 16px' }} />
        <p style={{ fontSize: 13, color: 'var(--color-text-hint)' }}>불러오는 중...</p>
      </div>
    </div>
  )
}
