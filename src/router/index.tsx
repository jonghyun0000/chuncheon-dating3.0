// src/router/index.tsx
import { lazy, Suspense } from 'react'
import { createBrowserRouter, RouterProvider, Outlet, Navigate } from 'react-router-dom'
import Header from '../components/common/Header'
import ProtectedRoute, { FullScreenSpinner } from '../components/common/ProtectedRoute'
import AdminLayout from '../components/common/AdminLayout'
import { useAuth } from '../hooks/useAuth'

const Home         = lazy(() => import('../pages/Home'))
const Login        = lazy(() => import('../pages/Login'))
const Register     = lazy(() => import('../pages/Register'))
const Terms        = lazy(() => import('../pages/Terms'))
const Privacy      = lazy(() => import('../pages/Privacy'))
const MyPage       = lazy(() => import('../pages/MyPage'))
const Verification = lazy(() => import('../pages/Verification'))
const TeamCreate   = lazy(() => import('../pages/TeamCreate'))
const TeamList     = lazy(() => import('../pages/TeamList'))
const TeamDetail   = lazy(() => import('../pages/TeamDetail'))
const TeamManage   = lazy(() => import('../pages/TeamManage'))
const MatchApply   = lazy(() => import('../pages/MatchApply'))
const ReviewWrite  = lazy(() => import('../pages/ReviewWrite'))
const Report       = lazy(() => import('../pages/Report'))

const AdminDashboard     = lazy(() => import('../pages/admin/Dashboard'))
const AdminUsers         = lazy(() => import('../pages/admin/Users'))
const AdminVerifications = lazy(() => import('../pages/admin/Verifications'))
const AdminPayments      = lazy(() => import('../pages/admin/Payments'))
const AdminTeams         = lazy(() => import('../pages/admin/Teams'))
const AdminReports       = lazy(() => import('../pages/admin/Reports'))
const AdminReviews       = lazy(() => import('../pages/admin/Reviews'))
const AdminSettings      = lazy(() => import('../pages/admin/Settings'))

function RootLayout() {
  return (
    <>
      <Header />
      <Suspense fallback={<FullScreenSpinner />}>
        <Outlet />
      </Suspense>
    </>
  )
}

// AdminRoute를 AdminGuard로 교체 — Outlet이 Router context 안에서 렌더링되도록 수정
// 기존: <AdminRoute><AdminLayout /></AdminRoute> → AdminLayout 안의 Outlet이 context 밖에서 실행되어 React #426 에러 발생
function AdminGuard() {
  const { user, loading } = useAuth()
  if (loading) return <FullScreenSpinner />
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'admin') return <Navigate to="/" replace />
  return (
    <Suspense fallback={<FullScreenSpinner />}>
      <AdminLayout />
    </Suspense>
  )
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true,                 element: <Home /> },
      { path: 'login',               element: <Login /> },
      { path: 'register',            element: <Register /> },
      { path: 'terms',               element: <Terms /> },
      { path: 'privacy',             element: <Privacy /> },
      { path: 'my',                  element: <ProtectedRoute><MyPage /></ProtectedRoute> },
      { path: 'verify',              element: <ProtectedRoute><Verification /></ProtectedRoute> },
      { path: 'teams',               element: <ProtectedRoute requireVerified><TeamList /></ProtectedRoute> },
      { path: 'team/create',         element: <ProtectedRoute requireVerified><TeamCreate /></ProtectedRoute> },
      { path: 'team/:teamId',        element: <ProtectedRoute requireVerified><TeamDetail /></ProtectedRoute> },
      { path: 'team/:teamId/manage', element: <ProtectedRoute requireVerified><TeamManage /></ProtectedRoute> },
      { path: 'match',               element: <ProtectedRoute requireVerified><MatchApply /></ProtectedRoute> },
      { path: 'review/:matchId',     element: <ProtectedRoute requireVerified><ReviewWrite /></ProtectedRoute> },
      { path: 'report',              element: <ProtectedRoute><Report /></ProtectedRoute> },
    ],
  },
  {
    path: '/admin',
    element: <AdminGuard />,
    children: [
      { index: true,           element: <AdminDashboard /> },
      { path: 'users',         element: <AdminUsers /> },
      { path: 'verifications', element: <AdminVerifications /> },
      { path: 'payments',      element: <AdminPayments /> },
      { path: 'teams',         element: <AdminTeams /> },
      { path: 'reports',       element: <AdminReports /> },
      { path: 'reviews',       element: <AdminReviews /> },
      { path: 'settings',      element: <AdminSettings /> },
    ],
  },
  {
    path: '*',
    element: (
      <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, fontFamily: 'var(--font-body)', color: 'var(--color-text-muted)' }}>
        <span style={{ fontSize: 48 }}>🌸</span>
        <p style={{ fontSize: 18, fontWeight: 600 }}>페이지를 찾을 수 없어요</p>
        <a href="/" style={{ color: 'var(--color-primary)', fontSize: 14 }}>홈으로 돌아가기</a>
      </div>
    ),
  },
])

export default function AppRouter() {
  return <RouterProvider router={router} />
}
