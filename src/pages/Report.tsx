// src/pages/Report.tsx
import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabaseClient'
import '../styles/global.css'

const REASONS = ['허위 정보 또는 사기 의심','욕설·비방·혐오 발언','성희롱 또는 부적절한 발언','스팸·광고 목적 이용','개인정보 무단 공유','매칭 후 연락 두절 (잠수)','기타 불쾌한 경험'] as const

export default function Report() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const paramUserId = searchParams.get('userId')
  const paramTeamId = searchParams.get('teamId')
  const [target, setTarget] = useState<{type:'user'|'team';id:string;name:string}|null>(null)
  const [targetLoad, setTargetLoad] = useState(false)
  const [targetError, setTargetError] = useState<string|null>(null)
  const [searchType, setSearchType] = useState<'team'|'user'>('team')
  const [searchInput, setSearchInput] = useState('')
  const [searching, setSearching] = useState(false)
  const [selectedReason, setSelectedReason] = useState('')
  const [customReason, setCustomReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitErr, setSubmitErr] = useState<string|null>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const load = async () => {
      if(paramUserId) {
        setTargetLoad(true)
        const { data } = await supabase.from('users').select('id,nickname').eq('id',paramUserId).neq('id',user?.id??'').maybeSingle()
        setTargetLoad(false)
        if(!data) { setTargetError('해당 회원을 찾을 수 없습니다.'); return }
        setTarget({type:'user',id:data.id,name:data.nickname})
      } else if(paramTeamId) {
        setTargetLoad(true)
        const { data } = await supabase.from('teams').select('id,name').eq('id',paramTeamId).eq('is_hidden',false).maybeSingle()
        setTargetLoad(false)
        if(!data) { setTargetError('해당 팀을 찾을 수 없습니다.'); return }
        setTarget({type:'team',id:data.id,name:data.name})
      }
    }
    if(paramUserId||paramTeamId) load()
  }, [paramUserId, paramTeamId, user])

  const handleSearch = async () => {
    if(!searchInput.trim()) return
    setSearching(true); setTargetError(null); setTarget(null)
    if(searchType==='team') {
      const { data } = await supabase.from('teams').select('id,name').ilike('name',`%${searchInput.trim()}%`).eq('is_hidden',false).limit(1).maybeSingle()
      setSearching(false)
      if(!data) { setTargetError('해당 팀을 찾을 수 없습니다.'); return }
      setTarget({type:'team',id:data.id,name:data.name})
    } else {
      const { data } = await supabase.from('users').select('id,nickname').ilike('nickname',`%${searchInput.trim()}%`).neq('id',user?.id??'').limit(1).maybeSingle()
      setSearching(false)
      if(!data) { setTargetError('해당 닉네임의 회원을 찾을 수 없습니다.'); return }
      setTarget({type:'user',id:data.id,name:data.nickname})
    }
  }

  const handleSubmit = async () => {
    if(!user||!target) return
    const finalReason = selectedReason==='기타 불쾌한 경험' ? customReason.trim() : selectedReason
    if(!selectedReason) { setSubmitErr('신고 사유를 선택해주세요.'); return }
    if(selectedReason==='기타 불쾌한 경험'&&finalReason.length<10) { setSubmitErr('기타 사유는 10자 이상 입력해주세요.'); return }
    setSubmitting(true); setSubmitErr(null)
    const insertData: Record<string,unknown> = { reporter_id:user.id, reason:finalReason, status:'pending' }
    if(target.type==='user') insertData.target_user_id=target.id
    else insertData.target_team_id=target.id
    const { error } = await supabase.from('reports').insert(insertData)
    setSubmitting(false)
    if(error) { setSubmitErr('신고 접수에 실패했습니다.'); return }
    setDone(true)
  }

  if(done) return (
    <div style={{minHeight:'100dvh',display:'flex',justifyContent:'center',alignItems:'flex-start',padding:'32px 16px 48px',background:'var(--color-bg)'}}>
      <main style={{width:'100%',maxWidth:480,background:'var(--color-surface)',borderRadius:'var(--radius-xl)',padding:'36px 28px 32px',boxShadow:'var(--shadow-lg)',border:'1px solid var(--color-border)'}} className="fade-up">
        <div style={{display:'flex',flexDirection:'column',alignItems:'center',textAlign:'center',padding:'24px 0',gap:12}}>
          <span style={{fontSize:44}}>📬</span>
          <h1 style={{fontFamily:'var(--font-display)',fontSize:22,fontWeight:400,color:'var(--color-text)',marginTop:4}}>신고가 접수되었습니다</h1>
          <p style={{fontSize:14,color:'var(--color-text-muted)',lineHeight:1.65,maxWidth:320}}>관리자가 검토 후 적절한 조치를 취하겠습니다. 허위 신고는 서비스 이용이 제한될 수 있습니다.</p>
          <div style={{display:'flex',gap:10,marginTop:8,justifyContent:'center',flexWrap:'wrap'}}>
            <button className="btn-ghost" onClick={()=>navigate(-1)} style={{padding:'11px 20px'}}>이전 페이지로</button>
            <Link to="/teams" style={{padding:'11px 24px',background:'var(--color-primary)',color:'#fff',borderRadius:'var(--radius-full)',textDecoration:'none',fontSize:14,fontWeight:600}}>팀 목록으로</Link>
          </div>
        </div>
      </main>
    </div>
  )

  const isOther = selectedReason==='기타 불쾌한 경험'
  const canSubmit = !!target&&!!selectedReason&&(!isOther||customReason.trim().length>=10)
  const tBtn = (val: string, cur: string) => ({flex:1,padding:'10px 0',borderRadius:'var(--radius-md)',border:'1.5px solid',cursor:'pointer',fontSize:14,fontFamily:'var(--font-body)',transition:'all 0.15s',borderColor:cur===val?'var(--color-primary)':'var(--color-border)',background:cur===val?'var(--color-primary-light)':'transparent',color:cur===val?'var(--color-primary)':'var(--color-text-muted)',fontWeight:cur===val?600:400} as React.CSSProperties)

  return (
    <div style={{minHeight:'100dvh',display:'flex',justifyContent:'center',alignItems:'flex-start',padding:'32px 16px 48px',background:'var(--color-bg)',position:'relative',overflow:'hidden'}}>
      <div style={{position:'absolute',width:260,height:260,borderRadius:'50%',background:'var(--color-primary-light)',opacity:0.28,top:-60,right:-60,pointerEvents:'none'}} aria-hidden/>
      <main style={{width:'100%',maxWidth:480,background:'var(--color-surface)',borderRadius:'var(--radius-xl)',padding:'36px 28px 32px',boxShadow:'var(--shadow-lg)',border:'1px solid var(--color-border)',position:'relative',zIndex:1,display:'flex',flexDirection:'column',gap:22}} className="fade-up">
        <div style={{display:'flex',alignItems:'center',gap:16}} className="fade-up fade-up-1">
          <button onClick={()=>navigate(-1)} style={{background:'none',border:'none',fontSize:22,cursor:'pointer',color:'var(--color-text-muted)',padding:4,fontFamily:'var(--font-body)'}} aria-label="뒤로가기">←</button>
          <div>
            <h1 style={{fontFamily:'var(--font-display)',fontSize:24,fontWeight:400,color:'var(--color-primary)',marginBottom:2}}>신고하기</h1>
            <p style={{fontSize:13,color:'var(--color-text-hint)'}}>불쾌한 경험을 신고해주세요</p>
          </div>
        </div>
        <div style={{display:'flex',alignItems:'flex-start',gap:10,background:'#EFF6FF',border:'1px solid #BFDBFE',borderRadius:'var(--radius-md)',padding:'12px 14px'}} className="fade-up fade-up-2">
          <span style={{fontSize:18,flexShrink:0}}>🛡️</span>
          <p style={{fontSize:13,color:'var(--color-text-muted)',lineHeight:1.6}}>신고 내용은 관리자에게만 전달되며, 신고자의 정보는 상대방에게 공개되지 않습니다.</p>
        </div>

        <section className="fade-up fade-up-2">
          <p style={{fontSize:13,fontWeight:600,color:'var(--color-text-muted)',letterSpacing:'0.03em',marginBottom:10}}>신고 대상 <span style={{color:'var(--color-primary)'}}>*</span></p>
          {targetLoad&&<div style={{display:'flex',alignItems:'center',gap:8,padding:'12px 0'}}><div className="spinner" style={{width:18,height:18,borderWidth:2}}/><span style={{fontSize:13,color:'var(--color-text-hint)'}}>대상 정보 불러오는 중...</span></div>}
          {target&&(
            <div style={{display:'flex',alignItems:'center',gap:12,background:'var(--color-bg)',border:'1.5px solid var(--color-primary)',borderRadius:'var(--radius-lg)',padding:'14px 16px'}}>
              <div style={{width:40,height:40,borderRadius:'var(--radius-md)',background:'var(--color-primary-light)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>{target.type==='team'?'🏷️':'👤'}</div>
              <div style={{flex:1}}>
                <p style={{fontSize:15,fontWeight:600,color:'var(--color-text)'}}>{target.name}</p>
                <p style={{fontSize:12,color:'var(--color-text-muted)',marginTop:2}}>{target.type==='team'?'팀':'회원'}</p>
              </div>
              {!paramUserId&&!paramTeamId&&(
                <button onClick={()=>{setTarget(null);setSearchInput('');setTargetError(null)}} style={{padding:'6px 12px',background:'none',border:'1px solid var(--color-border)',borderRadius:'var(--radius-full)',fontSize:12,cursor:'pointer',fontFamily:'var(--font-body)',color:'var(--color-text-muted)',flexShrink:0}}>변경</button>
              )}
            </div>
          )}
          {!target&&!paramUserId&&!paramTeamId&&(
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              <div style={{display:'flex',gap:8}}>
                {(['team','user'] as const).map(t=>(
                  <button key={t} type="button" onClick={()=>{setSearchType(t);setSearchInput('');setTargetError(null)}} style={tBtn(t,searchType)}>{t==='team'?'팀 신고':'회원 신고'}</button>
                ))}
              </div>
              <div style={{display:'flex',gap:8}}>
                <input type="text" className="input" style={{flex:1}} placeholder={searchType==='team'?'팀명 검색':'닉네임 검색'} value={searchInput} onChange={e=>{setSearchInput(e.target.value);setTargetError(null)}} onKeyDown={e=>e.key==='Enter'&&handleSearch()} maxLength={30}/>
                <button type="button" className="btn-primary" style={{flex:'none',padding:'0 18px',height:46,fontSize:13}} onClick={handleSearch} disabled={searching||!searchInput.trim()}>
                  {searching?<span className="spinner" style={{width:16,height:16,borderWidth:2}}/>:'검색'}
                </button>
              </div>
              {targetError&&<p role="alert" style={{fontSize:13,color:'var(--color-error)'}}>{targetError}</p>}
            </div>
          )}
          {targetError&&(paramUserId||paramTeamId)&&<p role="alert" style={{fontSize:13,color:'var(--color-error)',padding:'8px 0'}}>{targetError}</p>}
        </section>

        <section className="fade-up fade-up-3">
          <p style={{fontSize:13,fontWeight:600,color:'var(--color-text-muted)',letterSpacing:'0.03em',marginBottom:10}}>신고 사유 <span style={{color:'var(--color-primary)'}}>*</span></p>
          <div style={{display:'flex',flexDirection:'column',gap:8}} role="radiogroup">
            {REASONS.map(reason=>(
              <label key={reason} style={{display:'flex',alignItems:'flex-start',gap:10,padding:'12px 14px',border:'1.5px solid',borderRadius:'var(--radius-md)',cursor:'pointer',transition:'all 0.15s',borderColor:selectedReason===reason?'var(--color-primary)':'var(--color-border)',background:selectedReason===reason?'var(--color-primary-light)':'var(--color-bg)'}}>
                <input type="radio" name="reason" value={reason} checked={selectedReason===reason} onChange={()=>{setSelectedReason(reason);setSubmitErr(null);if(reason!=='기타 불쾌한 경험')setCustomReason('')}} style={{accentColor:'var(--color-primary)',flexShrink:0,marginTop:1}}/>
                <span style={{fontSize:14,color:selectedReason===reason?'var(--color-primary)':'var(--color-text)',fontWeight:selectedReason===reason?600:400,flex:1}}>{reason}</span>
              </label>
            ))}
          </div>
          {isOther&&(
            <div style={{marginTop:10}} className="fade-up">
              <div style={{position:'relative'}}>
                <textarea className={`input${submitErr&&customReason.trim().length<10?' error':''}`} placeholder="구체적인 사유를 10자 이상 입력해주세요" value={customReason} onChange={e=>{setCustomReason(e.target.value);setSubmitErr(null)}} rows={3} maxLength={500} style={{resize:'none',paddingBottom:24,lineHeight:1.6}} autoFocus/>
                <span style={{position:'absolute',bottom:8,right:12,fontSize:11,color:customReason.length>450?'var(--color-error)':'var(--color-text-hint)'}}>{customReason.length}/500</span>
              </div>
            </div>
          )}
        </section>

        <div style={{background:'#FFFBEB',border:'1px solid #FDE68A',borderRadius:'var(--radius-md)',padding:'14px 16px'}} className="fade-up fade-up-4">
          <p style={{fontSize:12,fontWeight:600,color:'#92400E',marginBottom:6}}>신고 전 확인해주세요</p>
          <ul style={{fontSize:12,color:'#92400E',lineHeight:1.8,paddingLeft:16}}>
            <li>허위 신고는 본인의 서비스 이용이 제한될 수 있습니다.</li>
            <li>긴급 상황(폭력, 범죄 등)은 경찰(112)에 직접 신고하세요.</li>
          </ul>
        </div>

        {submitErr&&<p role="alert" style={{fontSize:13,color:'var(--color-error)',textAlign:'center'}}>{submitErr}</p>}
        <button type="button" className="btn-primary fade-up fade-up-5" onClick={handleSubmit} disabled={!canSubmit||submitting}>
          {submitting?<span className="spinner" style={{margin:'0 auto',width:20,height:20,borderWidth:2}}/>:'신고 접수하기'}
        </button>
        <p style={{textAlign:'center',fontSize:12,color:'var(--color-text-hint)'}}>신고 외 문의사항은 <a href="mailto:john_1217@naver.com" style={{color:'var(--color-primary)'}}>john_1217@naver.com</a>으로 연락해주세요.</p>
      </main>
    </div>
  )
}
