// src/pages/Home.tsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabaseClient'
import '../styles/global.css'

export default function Home() {
  const { user, isVerified } = useAuth()
  const [notice, setNotice] = useState('')
  const [stats, setStats] = useState({ teams: 0, matches: 0 })
  const [statsLoad, setStatsLoad] = useState(true)

  useEffect(() => {
    const load = async () => {
      const [n, t, m] = await Promise.all([
        supabase.from('site_settings').select('value').eq('key', 'service_notice').maybeSingle(),
        supabase.from('teams').select('id', { count: 'exact', head: true }).eq('status', 'open').eq('is_hidden', false),
        supabase.from('matches').select('id', { count: 'exact', head: true }).eq('status', 'accepted'),
      ])
      setNotice(n.data?.value ?? '')
      setStats({ teams: t.count ?? 0, matches: m.count ?? 0 })
      setStatsLoad(false)
    }
    load()
  }, [])

  const S: Record<string, React.CSSProperties> = {
    page: { minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--color-bg)' },
    notice: { display: 'flex', alignItems: 'flex-start', gap: 10, background: '#FEF3C7', borderBottom: '1px solid #FDE68A', padding: '10px 20px' },
    hero: { position: 'relative', overflow: 'hidden', padding: '64px 16px 80px', textAlign: 'center' },
    bg1: { position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'var(--color-primary-light)', opacity: 0.5, top: -120, right: -80, pointerEvents: 'none' },
    bg2: { position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: '#EDE9FE', opacity: 0.4, bottom: -80, left: -60, pointerEvents: 'none' },
    inner: { maxWidth: 520, margin: '0 auto', position: 'relative', zIndex: 1 },
    title: { fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 400, color: 'var(--color-text)', lineHeight: 1.3, marginBottom: 16 },
    desc: { fontSize: 16, color: 'var(--color-text-muted)', lineHeight: 1.7, marginBottom: 28 },
    statsRow: { display: 'inline-flex', justifyContent: 'center', alignItems: 'center', gap: 32, marginBottom: 32, padding: '20px 24px', background: 'var(--color-surface)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' },
    statItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 },
    statNum: { fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 400, color: 'var(--color-primary)' },
    statLabel: { fontSize: 12, color: 'var(--color-text-hint)' },
    ctaRow: { display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' },
    ctaP: { padding: '13px 28px', background: 'var(--color-primary)', color: '#fff', borderRadius: 'var(--radius-full)', textDecoration: 'none', fontSize: 15, fontWeight: 600, boxShadow: 'var(--shadow-md)' },
    ctaS: { padding: '13px 28px', background: 'var(--color-surface)', color: 'var(--color-text-muted)', borderRadius: 'var(--radius-full)', textDecoration: 'none', fontSize: 15, fontWeight: 500, border: '1.5px solid var(--color-border)' },
    how: { padding: '56px 16px', background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)' },
    secTitle: { fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 400, color: 'var(--color-text)', textAlign: 'center', marginBottom: 36 },
    steps: { display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center', maxWidth: 720, margin: '0 auto' },
    step: { display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: 120, gap: 8 },
    stepNum: { width: 40, height: 40, borderRadius: '50%', background: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 14 },
    feat: { padding: '56px 16px', background: 'var(--color-bg)' },
    featGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, maxWidth: 720, margin: '0 auto' },
    featCard: { background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', padding: '24px 20px', textAlign: 'center', boxShadow: 'var(--shadow-sm)' },
    footer: { background: 'var(--color-bg)', borderTop: '1px solid var(--color-border)', padding: '28px 16px' },
    footerInner: { maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 },
  }

  return (
    <div style={S.page}>
      {notice && (
        <div style={S.notice} role="banner" className="fade-up">
          <span style={{ fontSize: 14 }}>📢</span>
          <p style={{ fontSize: 13, color: '#92400E', flex: 1 }}>{notice}</p>
        </div>
      )}

      <section style={S.hero}>
        <div style={S.bg1} aria-hidden /><div style={S.bg2} aria-hidden />
        <div style={S.inner}>
          <span style={{ fontSize: 52, display: 'block', marginBottom: 16 }} className="fade-up">🌸</span>
          <h1 style={S.title} className="fade-up fade-up-1">춘천 대학생<br />3:3 과팅 매칭</h1>
          <p style={S.desc} className="fade-up fade-up-2">강원대 · 한림대 · 성심대 학생들을 위한<br />설레는 만남의 시작</p>
          <div style={S.statsRow} className="fade-up fade-up-3">
            <div style={S.statItem}>
              <span style={S.statNum}>{statsLoad ? '...' : stats.teams}</span>
              <span style={S.statLabel}>모집중인 팀</span>
            </div>
            <div style={{ width: 1, height: 40, background: 'var(--color-border)' }} />
            <div style={S.statItem}>
              <span style={S.statNum}>{statsLoad ? '...' : stats.matches}</span>
              <span style={S.statLabel}>매칭 성사</span>
            </div>
          </div>
          <div style={S.ctaRow} className="fade-up fade-up-4">
            {!user ? (
              <><Link to="/register" style={S.ctaP}>무료로 시작하기</Link><Link to="/login" style={S.ctaS}>로그인</Link></>
            ) : !isVerified ? (
              <><Link to="/verify" style={S.ctaP}>학생 인증하기</Link><Link to="/teams" style={S.ctaS}>팀 둘러보기</Link></>
            ) : (
              <><Link to="/teams" style={S.ctaP}>팀 둘러보기</Link><Link to="/team/create" style={S.ctaS}>팀 만들기</Link></>
            )}
          </div>
        </div>
      </section>

      <section style={S.how}>
        <h2 style={S.secTitle} className="fade-up">이용 방법</h2>
        <div style={S.steps}>
          {[['01','회원가입','학교 이메일 없이\n아이디로 간편 가입'],['02','학생 인증','학생증 사진 업로드\n관리자 승인 (1~2일)'],['03','팀 구성','3명이 모여 팀을\n만들고 소개 작성'],['04','과팅 신청','마음에 드는 팀에\n과팅 신청하기'],['05','매칭 성사','상대 팀 수락 시\n연락처 공개']].map(([num, title, desc], i) => (
            <div key={num} style={S.step} className={`fade-up fade-up-${Math.min(i+1,5)}`}>
              <div style={S.stepNum}>{num}</div>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)' }}>{title}</h3>
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={S.feat}>
        <h2 style={S.secTitle} className="fade-up">춘천과팅의 특징</h2>
        <div style={S.featGrid}>
          {[['🔒','안전한 인증','학생증 인증으로\n재학생만 이용 가능'],['👁️','매칭 전 비공개','연락처는 매칭 성사 후에만\n상대방에게 공개'],['🌸','3:3 과팅','어색함 없이\n친구들과 함께'],['🏫','춘천 3개 대학','강원대·한림대·성심대\n학생 전용 서비스']].map(([icon, title, desc], i) => (
            <div key={title} style={S.featCard} className={`fade-up fade-up-${Math.min(i+1,5)}`}>
              <span style={{ fontSize: 32, display: 'block', marginBottom: 12 }}>{icon}</span>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text)', marginBottom: 8 }}>{title}</h3>
              <p style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.65, whiteSpace: 'pre-line' }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer style={S.footer}>
        <div style={S.footerInner}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--color-primary)' }}>🌸 춘천과팅</p>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link to="/terms"   style={{ fontSize: 12, color: 'var(--color-text-muted)', textDecoration: 'none' }}>이용약관</Link>
            <span style={{ color: 'var(--color-border)' }}>|</span>
            <Link to="/privacy" style={{ fontSize: 12, color: 'var(--color-text-muted)', textDecoration: 'none' }}>개인정보처리방침</Link>
            <span style={{ color: 'var(--color-border)' }}>|</span>
            <a href="mailto:john_1217@naver.com" style={{ fontSize: 12, color: 'var(--color-text-muted)', textDecoration: 'none' }}>문의</a>
          </div>
          <p style={{ fontSize: 11, color: 'var(--color-text-hint)', textAlign: 'center' }}>© 2025 춘천과팅. 강원대 · 한림대 · 성심대 재학생 전용 서비스.</p>
        </div>
      </footer>
    </div>
  )
}
