import { Navigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth()
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center text-ink-500 text-sm">
        Đang tải…
      </div>
    )
  }
  if (!profile) return <Navigate to="/login" replace />
  return <>{children}</>
}
