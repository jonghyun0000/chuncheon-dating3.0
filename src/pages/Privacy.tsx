// src/pages/Privacy.tsx
import { Link } from 'react-router-dom'
import '../styles/global.css'

export default function Privacy() {
  return (
    <div style={{ minHeight: '100dvh', background: 'var(--color-bg)', padding: '32px 16px 64px' }}>
      <main style={{ maxWidth: 640, margin: '0 auto', background: 'var(--color-surface)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border)', padding: '36px 32px', boxShadow: 'var(--shadow-sm)' }}>
        <Link to="/" style={{ display: 'inline-block', marginBottom: 24, fontSize: 13, color: 'var(--color-text-muted)', textDecoration: 'none' }}>← 홈으로</Link>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 400, color: 'var(--color-text)', marginBottom: 6 }}>개인정보처리방침</h1>
        <p style={{ fontSize: 12, color: 'var(--color-text-hint)', marginBottom: 32, paddingBottom: 24, borderBottom: '1px solid var(--color-border)' }}>최종 업데이트: 2025년 1월 1일</p>
        {[
          { t: '1. 수집하는 개인정보', b: '아이디·비밀번호, 성별·대학교·학번·닉네임, 출생년도(만 19세 확인용), 카카오톡ID 또는 인스타그램ID(매칭 성사 후 연락수단), 학생증 이미지(재학생 인증), 접속 로그 등을 수집합니다.' },
          { t: '2. 처리 목적', b: '회원 가입 및 본인 확인, 재학생 인증, 3:3 과팅 매칭 서비스 제공, 매칭 성사 시 연락처 공개, 서비스 운영 및 보안 유지.' },
          { t: '3. 제3자 제공', b: '매칭 성사 시 상대 팀에게 연락 수단(카카오톡ID 또는 인스타그램ID)만 공개됩니다. 이름·학번·학생증 이미지 등 기타 정보는 제공되지 않습니다.' },
          { t: '4. 보안 조치', b: '학생증 이미지는 비공개 스토리지에 저장되며 관리자만 접근 가능합니다. 연락처 정보는 매칭 성사 전 시스템적으로 노출이 불가능합니다. 모든 통신은 HTTPS로 암호화됩니다.' },
          { t: '5. 이용자의 권리', b: '개인정보 조회·수정·삭제 요청, 동의 철회, 탈퇴 및 삭제 요청이 가능합니다. john_1217@naver.com으로 문의해 주세요.' },
          { t: '6. 보유 기간', b: '회원 정보는 탈퇴 시까지, 학생증 이미지는 인증 완료 후 6개월, 접속 로그는 1년간 보유합니다.' },
        ].map(({ t, b }) => (
          <div key={t} style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text)', marginBottom: 10 }}>{t}</h2>
            <p style={{ fontSize: 14, color: 'var(--color-text-muted)', lineHeight: 1.8 }}>{b}</p>
          </div>
        ))}
        <div style={{ marginTop: 32, paddingTop: 20, borderTop: '1px solid var(--color-border)', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', marginBottom: 6 }}>개인정보 보호 책임자</p>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>이메일: <a href="mailto:john_1217@naver.com" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>john_1217@naver.com</a></p>
        </div>
      </main>
    </div>
  )
}
