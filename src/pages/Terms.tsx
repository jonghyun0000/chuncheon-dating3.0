// src/pages/Terms.tsx
import { Link } from 'react-router-dom'
import '../styles/global.css'

export default function Terms() {
  return (
    <div style={{ minHeight: '100dvh', background: 'var(--color-bg)', padding: '32px 16px 64px' }}>
      <main style={{ maxWidth: 640, margin: '0 auto', background: 'var(--color-surface)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border)', padding: '36px 32px', boxShadow: 'var(--shadow-sm)' }}>
        <Link to="/" style={{ display: 'inline-block', marginBottom: 24, fontSize: 13, color: 'var(--color-text-muted)', textDecoration: 'none' }}>← 홈으로</Link>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 400, color: 'var(--color-text)', marginBottom: 6 }}>서비스 이용약관</h1>
        <p style={{ fontSize: 12, color: 'var(--color-text-hint)', marginBottom: 32, paddingBottom: 24, borderBottom: '1px solid var(--color-border)' }}>최종 업데이트: 2025년 1월 1일</p>
        {[
          { t: '제1조 (목적)', b: '본 약관은 춘천과팅(이하 "서비스")이 제공하는 3:3 과팅 매칭 서비스의 이용에 관한 조건 및 절차, 기타 필요한 사항을 규정함을 목적으로 합니다.' },
          { t: '제2조 (서비스 대상)', b: '본 서비스는 강원대학교, 한림대학교, 성심대학교 재학생을 대상으로 하며, 만 19세 미만인 자는 이용할 수 없습니다.' },
          { t: '제3조 (이용자 의무)', b: '허위 정보 입력, 타인 정보 도용, 상대방 개인정보 무단 유포, 비매너 행동, 영리 목적 이용 등을 금지합니다.' },
          { t: '제4조 (개인정보 보호)', b: '연락처는 매칭이 성사된 경우에 한하여 상대 팀에게 공개됩니다. 매칭 성사 전에는 어떠한 경우에도 연락처가 외부에 노출되지 않습니다.' },
          { t: '제5조 (서비스 이용 제한)', b: '허위 학생 인증 제출, 타 이용자 신고 사실 확인, 서비스 운영 방해, 관계 법령 위반 시 이용이 제한될 수 있습니다.' },
          { t: '제6조 (책임 한계)', b: '서비스는 이용자 간 만남의 기회를 제공하는 플랫폼으로, 만남 이후 발생하는 사안에 대해 직접적인 책임을 지지 않습니다.' },
          { t: '제7조 (약관 변경)', b: '서비스는 필요한 경우 약관을 변경할 수 있으며, 변경 시 7일 이전에 공지합니다.' },
        ].map(({ t, b }) => (
          <div key={t} style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text)', marginBottom: 10 }}>{t}</h2>
            <p style={{ fontSize: 14, color: 'var(--color-text-muted)', lineHeight: 1.8 }}>{b}</p>
          </div>
        ))}
        <div style={{ marginTop: 32, paddingTop: 20, borderTop: '1px solid var(--color-border)' }}>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>약관 관련 문의: <a href="mailto:john_1217@naver.com" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>john_1217@naver.com</a></p>
        </div>
      </main>
    </div>
  )
}
