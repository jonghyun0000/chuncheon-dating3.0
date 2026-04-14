// src/components/common/AdminLayout.tsx
import { useState } from 'react'
import { NavLink, useNavigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { logoutUser } from '../../services/authService'
import '../../styles/global.css'

const NAV_ITEMS = [
  { to: '/admin',               label: '대시보드',  icon: '📊', end: true  },
  { to: '/admin/users',         label: '회원 관리', icon: '👥', end: false },
  { to: '/admin/verifications', label: '인증 관리', icon: '🪪', end: false },
  { to: '/admin/teams',         label: '팀 관리',   icon: '🏷️', end: false },
  { to: '/admin/reports',       label: '신고 관리', icon: '🚨', end: false },
  { to: '/admin/reviews',       label: '후기 관리', icon: '📝', end: false },
  { to: '/admin/payments',      label: '입금 관리', icon: '💳', end: false },
  { to: '/admin/settings',      label: '설정',      icon: '⚙️', end: false },
] as const

export default function AdminLayout() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [sideOpen, setSideOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async () => {
    setLoggingOut(true)
    await logoutUser()
    navigate('/', { replace: true })
  }

  return (
    <div style={{ display: 'flex', minHeight: '100dvh', background: 'var(--color-bg)' }}>
      {sideOpen && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 49 }} onClick={() => setSideOpen(false)} />}

      <aside style={{ width: 240, flexShrink: 0, background: 'var(--color-surface)', borderRight: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', padding: '20px 0', position: 'sticky', top: 0, height: '100dvh', overflowY: 'auto', zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 20px 16px' }}>
          <span style={{ fontSize: 20 }}>🌸</span>
          <div>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--color-primary)', lineHeight: 1.2 }}>춘천과팅</p>
            <p style={{ fontSize: 10, color: 'var(--color-text-hint)', marginTop: 1 }}>관리자</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 20px', margin: '0 12px', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, flexShrink: 0 }}>
            {user?.nickname?.charAt(0) ?? 'A'}
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>{user?.nickname ?? '관리자'}</p>
            <p style={{ fontSize: 11, color: 'var(--color-text-hint)', marginTop: 2 }}>최고 관리자</p>
          </div>
        </div>

        <div style={{ height: 1, background: 'var(--color-border)', margin: '12px 20px' }} />

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '0 12px' }}>
          {NAV_ITEMS.map(item => (
            <NavLink key={item.to} to={item.to} end={item.end}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                borderRadius: 'var(--radius-md)', textDecoration: 'none', fontSize: 14,
                background: isActive ? 'rgba(244,113,127,0.1)' : 'transparent',
                color:      isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
                fontWeight: isActive ? 600 : 400,
                borderLeft: isActive ? '3px solid var(--color-primary)' : '3px solid transparent',
              })}
            >
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div style={{ flex: 1 }} />
        <div style={{ height: 1, background: 'var(--color-border)', margin: '12px 20px' }} />

        <NavLink to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 20px', textDecoration: 'none', fontSize: 13, color: 'var(--color-text-muted)' }}>
          <span>🔗</span><span>사이트 바로가기</span>
        </NavLink>
        <button onClick={handleLogout} disabled={loggingOut}
          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 20px', background: 'none', border: 'none', fontSize: 13, color: 'var(--color-text-muted)', cursor: 'pointer', fontFamily: 'var(--font-body)', textAlign: 'left', width: '100%' }}>
          <span>🚪</span><span>{loggingOut ? '로그아웃 중...' : '로그아웃'}</span>
        </button>
      </aside>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: '100dvh' }}>
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', height: 52, background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', position: 'sticky', top: 0, zIndex: 10 }}>
          <button onClick={() => setSideOpen(v => !v)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', padding: 8, color: 'var(--color-text-muted)', width: 40 }}>☰</button>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--color-primary)' }}>관리자</span>
          <div style={{ width: 40 }} />
        </header>
        <div style={{ flex: 1, padding: '28px 24px', maxWidth: 1100, width: '100%', margin: '0 auto' }}>
          <Outlet />
        </div>
      </div>
    </div>
  )
}
