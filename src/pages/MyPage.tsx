// src/pages/MyPage.tsx
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { logoutUser } from '../services/authService'
import { getMyVerification } from '../services/verificationService'
import type { StudentVerification } from '../lib/types'
import '../styles/global.css'

const VERIF_META = {
  none:    {badge:'badge-none',    label:'미제출',   desc:'학생 인증을 완료해야 팀 등록 및 매칭 신청이 가능합니다.',   action:{label:'학생증 인증하기',to:'/verify'}, icon:'📋'},
  pending: {badge:'badge-pending', label:'검토중',   desc:'관리자가 학생증을 검토하고 있습니다. 보통 1~2 영업일 내 처리됩니다.', action:null, icon:'⏳'},
  verified:{badge:'badge-verified',label:'인증 완료',desc:'학생 인증이 완료되었습니다. 모든 서비스를 이용할 수 있습니다.', action:null, icon:'✅'},
  rejected:{badge:'badge-rejected',label:'반려됨',  desc:'인증이 반려되었습니다. 반려 사유를 확인하고 다시 제출해주세요.', action:{label:'다시 제출하기',to:'/verify'}, icon:'❌'},
} as const

const MENU_ITEMS = [
  {icon:'👥', label:'팀 관리',    to:'/team/manage', requireVerif:true },
  {icon:'💌', label:'매칭 현황',  to:'/match',       requireVerif:true },
  {icon:'📝', label:'작성한 후기',to:'/my/reviews',  requireVerif:false},
  {icon:'🚨', label:'신고하기',   to:'/report',      requireVerif:false},
] as const

export default function MyPage() {
  const navigate = useNavigate()
  const { user, loading: authLoading, isVerified } = useAuth()
  const [verif, setVerif] = useState<StudentVerification|null>(null)
  const [verifLoad, setVerifLoad] = useState(true)
  const [logoutOpen, setLogoutOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    if (!user) return
    getMyVerification(user.id).then(data => { setVerif(data); setVerifLoad(false) })
  }, [user])

  const handleLogout = async () => {
    setLoggingOut(true)
    await logoutUser()
    navigate('/', { replace: true })
  }

  if (authLoading) return <div style={{display:'flex',justifyContent:'center',alignItems:'center',minHeight:'100dvh'}}><div className="spinner"/></div>
  if (!user) { navigate('/login', {replace:true}); return null }

  const status    = verif?.status ?? 'none'
  const verifMeta = VERIF_META[status]
  const initial   = user.nickname.charAt(0).toUpperCase()

  return (
    <div style={{minHeight:'100dvh',background:'var(--color-bg)',position:'relative',overflow:'hidden',paddingBottom:48}}>
      <div style={{position:'absolute',width:320,height:320,borderRadius:'50%',background:'var(--color-primary-light)',opacity:0.35,top:-100,right:-80,pointerEvents:'none'}} aria-hidden/>
      <div style={{position:'absolute',width:240,height:240,borderRadius:'50%',background:'#EDE9FE',opacity:0.3,bottom:-60,left:-50,pointerEvents:'none'}} aria-hidden/>

      <main style={{maxWidth:480,margin:'0 auto',padding:'24px 16px',display:'flex',flexDirection:'column',gap:20,position:'relative',zIndex:1}}>

        {/* 프로필 카드 */}
        <section style={{background:'var(--color-surface)',borderRadius:'var(--radius-xl)',border:'1px solid var(--color-border)',padding:'24px 20px',display:'flex',alignItems:'center',gap:20,boxShadow:'var(--shadow-md)'}} className="fade-up fade-up-1">
          <div style={{position:'relative',flexShrink:0}}>
            <div style={{width:64,height:64,borderRadius:'50%',background:'var(--color-primary-light)',color:'var(--color-primary)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:26,fontWeight:700,border:'2px solid var(--color-primary)'}}>{initial}</div>
            {isVerified&&<span style={{position:'absolute',bottom:0,right:0,width:20,height:20,borderRadius:'50%',background:'#16A34A',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,border:'2px solid var(--color-surface)'}} title="인증 완료">✓</span>}
          </div>
          <div style={{flex:1,minWidth:0}}>
            <h1 style={{fontFamily:'var(--font-display)',fontSize:22,fontWeight:400,color:'var(--color-text)',marginBottom:4}}>{user.nickname}</h1>
            <p style={{fontSize:13,color:'var(--color-text-muted)',marginBottom:10}}>{user.university} · {user.student_id.slice(0,4)}학번</p>
            <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
              {[user.gender==='male'?'남성':'여성', user.mbti, user.is_smoker?'흡연':'비흡연'].filter(Boolean).map(tag=>(
                <span key={tag} style={{display:'inline-block',padding:'3px 10px',background:'var(--color-primary-light)',color:'var(--color-primary)',borderRadius:'var(--radius-full)',fontSize:12,fontWeight:500}}>{tag}</span>
              ))}
            </div>
          </div>
        </section>

        {/* 인증 상태 */}
        <section style={{background:'var(--color-surface)',borderRadius:'var(--radius-lg)',border:'1px solid var(--color-border)',padding:'18px 20px',boxShadow:'var(--shadow-sm)'}} className="fade-up fade-up-2">
          {verifLoad ? (
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <div className="spinner" style={{width:18,height:18,borderWidth:2}}/><span style={{fontSize:13,color:'var(--color-text-hint)'}}>인증 상태 확인 중...</span>
            </div>
          ) : (
            <>
              <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:12}}>
                <div style={{display:'flex',alignItems:'flex-start',gap:12,flex:1}}>
                  <span style={{fontSize:22}}>{verifMeta.icon}</span>
                  <div>
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                      <span style={{fontSize:14,fontWeight:600,color:'var(--color-text)'}}>학생 인증</span>
                      <span className={`badge ${verifMeta.badge}`}>{verifMeta.label}</span>
                    </div>
                    <p style={{fontSize:13,color:'var(--color-text-muted)',lineHeight:1.5}}>{verifMeta.desc}</p>
                  </div>
                </div>
                {verifMeta.action&&(
                  <Link to={verifMeta.action.to} style={{flexShrink:0,padding:'8px 14px',background:'var(--color-primary)',color:'#fff',borderRadius:'var(--radius-full)',fontSize:12,fontWeight:600,textDecoration:'none',whiteSpace:'nowrap',alignSelf:'center'}}>{verifMeta.action.label}</Link>
                )}
              </div>
              {status==='rejected'&&verif?.reject_reason&&(
                <div style={{marginTop:12,background:'#FEF2F2',border:'1px solid #FCA5A5',borderRadius:'var(--radius-md)',padding:'10px 14px'}}>
                  <p style={{fontSize:12,fontWeight:600,color:'#991B1B',marginBottom:4}}>반려 사유</p>
                  <p style={{fontSize:13,color:'#991B1B'}}>{verif.reject_reason}</p>
                </div>
              )}
            </>
          )}
        </section>

        {/* 메뉴 */}
        <section className="fade-up fade-up-3">
          <h2 style={{fontSize:13,fontWeight:600,color:'var(--color-text-muted)',letterSpacing:'0.04em',marginBottom:10,paddingLeft:2}}>메뉴</h2>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
            {MENU_ITEMS.map(item=>{
              const blocked = item.requireVerif && !isVerified
              return (
                <button key={item.to} onClick={()=>{if(blocked){navigate('/verify');return}navigate(item.to)}}
                  style={{background:'var(--color-surface)',border:'1px solid var(--color-border)',borderRadius:'var(--radius-lg)',padding:'16px 8px 14px',display:'flex',flexDirection:'column',alignItems:'center',gap:8,cursor:'pointer',fontFamily:'var(--font-body)',opacity:blocked?0.55:1,transition:'box-shadow 0.15s'}}
                  aria-label={blocked?`${item.label} (학생 인증 필요)`:item.label}>
                  <span style={{fontSize:26,display:'block'}}>{item.icon}</span>
                  <span style={{fontSize:13,fontWeight:500,color:'var(--color-text)'}}>{item.label}</span>
                  {blocked&&<span style={{fontSize:10,color:'var(--color-text-hint)'}}>인증 필요</span>}
                </button>
              )
            })}
          </div>
        </section>

        {/* 계정 정보 */}
        <section style={{background:'var(--color-surface)',borderRadius:'var(--radius-lg)',border:'1px solid var(--color-border)',padding:'16px 20px',boxShadow:'var(--shadow-sm)'}} className="fade-up fade-up-4">
          <h2 style={{fontSize:13,fontWeight:600,color:'var(--color-text-muted)',letterSpacing:'0.04em',marginBottom:12,paddingLeft:2}}>계정</h2>
          {[['아이디',user.username],['연락수단',user.contact_type==='kakao'?'카카오톡':'인스타그램'],['연락처','매칭 성사 후 공개'],['가입일',new Date(user.created_at).toLocaleDateString('ko-KR')]].map(([label,value])=>(
            <div key={label} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'11px 0',borderBottom:'1px solid var(--color-border)'}}>
              <span style={{fontSize:14,color:'var(--color-text-muted)'}}>{label}</span>
              <span style={{fontSize:14,fontWeight:500,color:label==='연락처'?'var(--color-text-hint)':'var(--color-text)',fontStyle:label==='연락처'?'italic':'normal'}}>{value}</span>
            </div>
          ))}
        </section>

        {/* 로그아웃 */}
        <button onClick={()=>setLogoutOpen(true)} style={{width:'100%',padding:'13px',background:'none',border:'1.5px solid var(--color-border)',borderRadius:'var(--radius-md)',color:'var(--color-text-muted)',fontSize:15,fontFamily:'var(--font-body)',cursor:'pointer'}} className="fade-up fade-up-5">
          로그아웃
        </button>
      </main>

      {logoutOpen&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',zIndex:300,display:'flex',alignItems:'center',justifyContent:'center',padding:16}} role="dialog" aria-modal aria-label="로그아웃 확인">
          <div style={{background:'var(--color-surface)',borderRadius:'var(--radius-xl)',padding:'28px 24px',width:'100%',maxWidth:320,boxShadow:'var(--shadow-lg)',textAlign:'center'}} className="fade-up">
            <p style={{fontSize:16,fontWeight:600,marginBottom:8}}>로그아웃 할까요?</p>
            <p style={{fontSize:13,color:'var(--color-text-muted)',marginBottom:24}}>언제든지 다시 로그인할 수 있습니다.</p>
            <div style={{display:'flex',gap:10}}>
              <button onClick={()=>setLogoutOpen(false)} disabled={loggingOut} style={{flex:1,padding:'12px',background:'none',border:'1.5px solid var(--color-border)',borderRadius:'var(--radius-md)',fontSize:14,fontFamily:'var(--font-body)',color:'var(--color-text-muted)',cursor:'pointer'}}>취소</button>
              <button onClick={handleLogout} disabled={loggingOut} style={{flex:2,padding:'12px',background:'var(--color-primary)',border:'none',borderRadius:'var(--radius-md)',fontSize:14,fontFamily:'var(--font-body)',color:'#fff',fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
                {loggingOut?<span className="spinner" style={{width:18,height:18,borderWidth:2}}/>:'로그아웃'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
