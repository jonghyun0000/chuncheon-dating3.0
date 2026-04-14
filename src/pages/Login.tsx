// src/pages/Login.tsx
import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { loginUser } from '../services/authService'
import { useAuth } from '../hooks/useAuth'
import '../styles/global.css'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, loading: authLoading } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!authLoading && user) {
      if (user.role === 'admin') { navigate('/admin', { replace: true }); return }
      const from = (location.state as any)?.from?.pathname ?? '/my'
      navigate(from, { replace: true })
    }
  }, [user, authLoading, navigate, location])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error: loginError } = await loginUser(username, password)
    setLoading(false)
    if (loginError) setError(loginError)
  }

  if (authLoading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100dvh' }}><div className="spinner" /></div>

  const S: Record<string, React.CSSProperties> = {
    page: { minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', position: 'relative', overflow: 'hidden', background: 'var(--color-bg)' },
    c1: { position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'var(--color-primary-light)', opacity: 0.45, top: -120, right: -100, pointerEvents: 'none' },
    c2: { position: 'absolute', width: 280, height: 280, borderRadius: '50%', background: '#EDE9FE', opacity: 0.35, bottom: -80, left: -60, pointerEvents: 'none' },
    card: { width: '100%', maxWidth: 400, background: 'var(--color-surface)', borderRadius: 'var(--radius-xl)', padding: '40px 32px 32px', boxShadow: 'var(--shadow-lg)', position: 'relative', zIndex: 1, border: '1px solid var(--color-border)' },
    errBox: { background: 'var(--color-primary-light)', border: '1px solid #F4A3AC', borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: 13, color: '#C0394B', textAlign: 'center' },
  }

  return (
    <div style={S.page}>
      <div style={S.c1} aria-hidden /><div style={S.c2} aria-hidden />
      <main style={S.card} className="fade-up">
        <div style={{ textAlign: 'center', marginBottom: 32 }} className="fade-up fade-up-1">
          <span style={{ fontSize: 36, display: 'block', marginBottom: 8 }}>🌸</span>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 400, color: 'var(--color-primary)', marginBottom: 4 }}>춘천과팅</h1>
          <p style={{ fontSize: 13, color: 'var(--color-text-hint)' }}>대학생 3:3 과팅 매칭 서비스</p>
        </div>
        <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="field fade-up fade-up-2">
            <label htmlFor="username" className="field-label">아이디</label>
            <input id="username" type="text" className={`input${error ? ' error' : ''}`} placeholder="아이디 입력" value={username} onChange={e => { setUsername(e.target.value); setError(null) }} autoComplete="username" autoFocus maxLength={20} disabled={loading} />
          </div>
          <div className="field fade-up fade-up-3">
            <label htmlFor="password" className="field-label">비밀번호</label>
            <input id="password" type="password" className={`input${error ? ' error' : ''}`} placeholder="비밀번호 입력" value={password} onChange={e => { setPassword(e.target.value); setError(null) }} autoComplete="current-password" disabled={loading} />
          </div>
          {error && <p role="alert" style={S.errBox}>{error}</p>}
          <button type="submit" className="btn-primary fade-up fade-up-4" disabled={loading || !username || !password} style={{ marginTop: 4 }}>
            {loading ? <span className="spinner" style={{ margin: '0 auto', width: 20, height: 20, borderWidth: 2 }} /> : '로그인'}
          </button>
        </form>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 24 }} className="fade-up fade-up-5">
          <span style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>아직 회원이 아닌가요?</span>
          <Link to="/register" style={{ color: 'var(--color-primary)', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>회원가입</Link>
        </div>
        <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--color-text-hint)', marginTop: 16, lineHeight: 1.6 }}>
          로그인 시 <Link to="/terms" style={{ color: 'var(--color-text-muted)', textDecoration: 'underline' }}>이용약관</Link> 및 <Link to="/privacy" style={{ color: 'var(--color-text-muted)', textDecoration: 'underline' }}>개인정보처리방침</Link>에 동의한 것으로 간주합니다.
        </p>
      </main>
    </div>
  )
}
