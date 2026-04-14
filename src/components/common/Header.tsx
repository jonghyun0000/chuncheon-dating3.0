// src/components/common/Header.tsx
import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { logoutUser } from '../../services/authService'

const NAV_ITEMS = [
  { to: '/teams', label: '팀 목록' },
  { to: '/match', label: '매칭'   },
  { to: '/my',    label: '마이페이지' },
]

export default function Header() {
  const { user, loading, isVerified, isPending } = useAuth()
  const navigate   = useNavigate()
  const location   = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async () => {
    setLoggingOut(true)
    await logoutUser()
    setLoggingOut(false)
    setMenuOpen(false)
    navigate('/', { replace: true })
  }

  const isActive = (path: string) => location.pathname.startsWith(path)

  const verifBadge = () => {
    if (!user || isVerified) return null
    if (isPending) return <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 9999, background: '#FEF3C7', color: '#92400E' }}>검토중</span>
    return <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 9999, background: '#FEE2E2', color: '#991B1B' }}>미인증</span>
  }

  return (
    <>
      <header style={{ position: 'sticky', top: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', height: 56, background: 'rgba(255,251,252,0.92)', backdropFilter: 'blur(10px)', borderBottom: '1px solid var(--color-border)' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flexShrink: 0 }}>
          <span style={{ fontSize: 20 }}>🌸</span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--color-primary)' }}>춘천과팅</span>
        </Link>

        <nav style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {user && NAV_ITEMS.map(item => (
            <Link key={item.to} to={item.to} style={{ textDecoration: 'none', fontSize: 14, padding: '4px 10px', color: isActive(item.to) ? 'var(--color-primary)' : 'var(--color-text-muted)', fontWeight: isActive(item.to) ? 600 : 400 }}>
              {item.label}
            </Link>
          ))}
          {!user && !loading && (
            <>
              <Link to="/login" style={{ textDecoration: 'none', fontSize: 14, padding: '4px 10px', color: 'var(--color-text-muted)' }}>로그인</Link>
              <Link to="/register" style={{ marginLeft: 8, padding: '8px 16px', background: 'var(--color-primary)', color: '#fff', borderRadius: 9999, textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>회원가입</Link>
            </>
          )}
        </nav>

        <button style={{ display: 'flex', flexDirection: 'column', gap: 5, background: 'none', border: 'none', cursor: 'pointer', padding: 8 }} onClick={() => setMenuOpen(v => !v)} aria-label="메뉴">
          <span style={{ display: 'block', width: 22, height: 2, background: 'var(--color-text-muted)', borderRadius: 2 }} />
          <span style={{ display: 'block', width: 22, height: 2, background: 'var(--color-text-muted)', borderRadius: 2 }} />
          <span style={{ display: 'block', width: 22, height: 2, background: 'var(--color-text-muted)', borderRadius: 2 }} />
        </button>
      </header>

      {menuOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex' }}>
          <div style={{ width: '75vw', maxWidth: 300, background: 'var(--color-surface)', height: '100%', display: 'flex', flexDirection: 'column', padding: '24px 20px', gap: 4, overflowY: 'auto', boxShadow: '4px 0 24px rgba(0,0,0,0.12)', zIndex: 201 }}>
            {user ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 0 16px' }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700 }}>
                    {user.nickname?.charAt(0)}
                  </div>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 600 }}>{user.nickname}</p>
                    <p style={{ fontSize: 12, color: 'var(--color-text-hint)', marginTop: 2 }}>{user.university}</p>
                    <div style={{ marginTop: 4 }}>{verifBadge()}</div>
                  </div>
                </div>
                <div style={{ height: 1, background: 'var(--color-border)', margin: '8px 0' }} />
                {NAV_ITEMS.map(item => (
                  <Link key={item.to} to={item.to} onClick={() => setMenuOpen(false)} style={{ display: 'block', padding: '11px 8px', textDecoration: 'none', fontSize: 15, color: 'var(--color-text)', borderRadius: 'var(--radius-md)' }}>
                    {item.label}
                  </Link>
                ))}
                {!isVerified && <Link to="/verify" onClick={() => setMenuOpen(false)} style={{ display: 'block', padding: '11px 8px', textDecoration: 'none', fontSize: 15, color: 'var(--color-text)', borderRadius: 'var(--radius-md)' }}>학생 인증</Link>}
                {user.role === 'admin' && <Link to="/admin" onClick={() => setMenuOpen(false)} style={{ display: 'block', padding: '11px 8px', textDecoration: 'none', fontSize: 15, color: 'var(--color-primary)', fontWeight: 600, borderRadius: 'var(--radius-md)' }}>관리자</Link>}
                <div style={{ height: 1, background: 'var(--color-border)', margin: '8px 0' }} />
                <button onClick={handleLogout} disabled={loggingOut} style={{ display: 'flex', alignItems: 'center', padding: '11px 8px', background: 'none', border: 'none', fontSize: 15, color: 'var(--color-text-muted)', cursor: 'pointer', fontFamily: 'var(--font-body)', borderRadius: 'var(--radius-md)' }}>
                  {loggingOut ? '로그아웃 중...' : '로그아웃'}
                </button>
              </>
            ) : (
              <>
                <Link to="/login"    onClick={() => setMenuOpen(false)} style={{ display: 'block', padding: '11px 8px', textDecoration: 'none', fontSize: 15, color: 'var(--color-text)' }}>로그인</Link>
                <Link to="/register" onClick={() => setMenuOpen(false)} style={{ display: 'block', padding: '11px 8px', textDecoration: 'none', fontSize: 15, color: 'var(--color-text)' }}>회원가입</Link>
              </>
            )}
          </div>
          <div style={{ flex: 1, background: 'rgba(0,0,0,0.3)' }} onClick={() => setMenuOpen(false)} />
        </div>
      )}
    </>
  )
}
