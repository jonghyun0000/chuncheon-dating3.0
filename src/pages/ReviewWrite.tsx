// src/pages/ReviewWrite.tsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabaseClient'
import '../styles/global.css'

const STAR_LABELS = ['','별로였어요','아쉬웠어요','괜찮았어요','좋았어요','최고였어요!']
const STAR_COLORS = ['','#EF4444','#F97316','#EAB308','#22C55E','#10B981']

export default function ReviewWrite() {
  const { matchId } = useParams<{ matchId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [match, setMatch] = useState<{id:string;status:string;matched_at:string|null;female_team:{id:string;name:string};male_team:{id:string;name:string}}|null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string|null>(null)
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitErr, setSubmitErr] = useState<string|null>(null)
  const [done, setDone] = useState(false)
  const [alreadyWrote, setAlreadyWrote] = useState(false)

  useEffect(() => {
    if (!matchId||!user) return
    const load = async () => {
      setLoading(true)
      const { data: md, error: me } = await supabase
        .from('matches')
        .select('id, status, matched_at, female_team:teams!matches_female_team_id_fkey(id,name), male_team:teams!matches_male_team_id_fkey(id,name)')
        .eq('id', matchId).maybeSingle()
      if(me||!md) { setError('매칭 정보를 불러올 수 없습니다.'); setLoading(false); return }
      if(md.status!=='accepted') { setError('매칭이 성사된 경우에만 후기를 작성할 수 있습니다.'); setLoading(false); return }
      const { count: mc } = await supabase.from('team_members').select('id',{count:'exact',head:true}).eq('user_id',user.id).in('team_id',[(md.female_team as any)?.id??'',(md.male_team as any)?.id??''])
      if(!mc||mc===0) { setError('이 매칭의 팀원만 후기를 작성할 수 있습니다.'); setLoading(false); return }
      const { count: rc } = await supabase.from('reviews').select('id',{count:'exact',head:true}).eq('match_id',matchId).eq('author_id',user.id)
      if(rc&&rc>0) setAlreadyWrote(true)
      setMatch({ id:md.id, status:md.status, matched_at:md.matched_at, female_team:{id:(md.female_team as any)?.id??'',name:(md.female_team as any)?.name??''}, male_team:{id:(md.male_team as any)?.id??'',name:(md.male_team as any)?.name??''} })
      setLoading(false)
    }
    load()
  }, [matchId, user])

  const handleSubmit = async () => {
    if(!user||!match) return
    if(rating===0) { setSubmitErr('별점을 선택해주세요.'); return }
    if(content.trim().length<10) { setSubmitErr('후기는 10자 이상 작성해주세요.'); return }
    setSubmitting(true); setSubmitErr(null)
    const { error } = await supabase.from('reviews').insert({ match_id:match.id, author_id:user.id, content:content.trim(), rating, status:'pending' })
    setSubmitting(false)
    if(error) { if(error.code==='23505') { setSubmitErr('이미 이 매칭에 후기를 작성했습니다.'); return } setSubmitErr('후기 저장에 실패했습니다.'); return }
    setDone(true)
  }

  if(loading) return <div style={{display:'flex',justifyContent:'center',alignItems:'center',minHeight:'60vh'}}><div className="spinner"/></div>

  if(error) return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'60vh',padding:24,textAlign:'center'}}>
      <span style={{fontSize:40}}>😕</span>
      <p style={{fontSize:15,fontWeight:600,color:'var(--color-text-muted)',marginTop:12}}>{error}</p>
      <button className="btn-ghost" onClick={()=>navigate('/match')} style={{marginTop:16}}>매칭 현황으로</button>
    </div>
  )

  const DoneBox = ({icon,title,desc}: {icon:string;title:string;desc:string}) => (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',textAlign:'center',padding:'20px 0',gap:12}}>
      <span style={{fontSize:44}}>{icon}</span>
      <h1 style={{fontFamily:'var(--font-display)',fontSize:22,fontWeight:400,color:'var(--color-text)',marginTop:4}}>{title}</h1>
      <p style={{fontSize:14,color:'var(--color-text-muted)',lineHeight:1.6}}>{desc}</p>
      <Link to="/match" style={{marginTop:8,padding:'12px 28px',background:'var(--color-primary)',color:'#fff',borderRadius:'var(--radius-full)',textDecoration:'none',fontSize:14,fontWeight:600}}>매칭 현황으로</Link>
    </div>
  )

  if(alreadyWrote) return (
    <div style={{minHeight:'100dvh',display:'flex',justifyContent:'center',alignItems:'flex-start',padding:'32px 16px 48px',background:'var(--color-bg)'}}>
      <main style={{width:'100%',maxWidth:480,background:'var(--color-surface)',borderRadius:'var(--radius-xl)',padding:'36px 28px 32px',boxShadow:'var(--shadow-lg)',border:'1px solid var(--color-border)'}} className="fade-up">
        <DoneBox icon="✅" title="이미 후기를 작성하셨어요" desc="이 매칭에 대한 후기는 이미 작성되었습니다."/>
      </main>
    </div>
  )

  if(done) return (
    <div style={{minHeight:'100dvh',display:'flex',justifyContent:'center',alignItems:'flex-start',padding:'32px 16px 48px',background:'var(--color-bg)'}}>
      <main style={{width:'100%',maxWidth:480,background:'var(--color-surface)',borderRadius:'var(--radius-xl)',padding:'36px 28px 32px',boxShadow:'var(--shadow-lg)',border:'1px solid var(--color-border)'}} className="fade-up">
        <DoneBox icon="🌸" title="후기가 등록되었습니다!" desc="관리자 검토 후 공개됩니다. 감사합니다."/>
      </main>
    </div>
  )

  const dRating = hovered||rating
  const starColor = STAR_COLORS[dRating]||'var(--color-border)'

  return (
    <div style={{minHeight:'100dvh',display:'flex',justifyContent:'center',alignItems:'flex-start',padding:'32px 16px 48px',background:'var(--color-bg)',position:'relative',overflow:'hidden'}}>
      <div style={{position:'absolute',width:280,height:280,borderRadius:'50%',background:'var(--color-primary-light)',opacity:0.3,top:-60,right:-60,pointerEvents:'none'}} aria-hidden/>
      <main style={{width:'100%',maxWidth:480,background:'var(--color-surface)',borderRadius:'var(--radius-xl)',padding:'36px 28px 32px',boxShadow:'var(--shadow-lg)',border:'1px solid var(--color-border)',position:'relative',zIndex:1,display:'flex',flexDirection:'column',gap:20}} className="fade-up">
        <div style={{display:'flex',alignItems:'center',gap:16}} className="fade-up fade-up-1">
          <button onClick={()=>navigate(-1)} style={{background:'none',border:'none',fontSize:22,cursor:'pointer',color:'var(--color-text-muted)',padding:4,fontFamily:'var(--font-body)'}} aria-label="뒤로가기">←</button>
          <div>
            <h1 style={{fontFamily:'var(--font-display)',fontSize:24,fontWeight:400,color:'var(--color-primary)',marginBottom:2}}>후기 작성</h1>
            <p style={{fontSize:13,color:'var(--color-text-hint)'}}>매칭 경험을 솔직하게 남겨주세요</p>
          </div>
        </div>
        {match&&(
          <div style={{border:'1px solid var(--color-border)',borderRadius:'var(--radius-lg)',padding:'16px 18px',background:'var(--color-bg)',display:'flex',flexDirection:'column',gap:8,alignItems:'center'}} className="fade-up fade-up-2">
            <div style={{display:'flex',alignItems:'center',gap:12,flexWrap:'wrap',justifyContent:'center'}}>
              {[{icon:'👩',name:match.female_team.name},{icon:'👨',name:match.male_team.name}].map((t,i)=>(
                <div key={i} style={{display:'flex',alignItems:'center',gap:6,background:'var(--color-surface)',border:'1px solid var(--color-border)',borderRadius:'var(--radius-full)',padding:'6px 14px'}}>
                  <span style={{fontSize:16}}>{t.icon}</span>
                  <span style={{fontSize:14,fontWeight:600,color:'var(--color-text)'}}>{t.name}</span>
                </div>
              ))}
            </div>
            {match.matched_at&&<p style={{fontSize:12,color:'var(--color-text-hint)'}}>매칭 성사일 {new Date(match.matched_at).toLocaleDateString('ko-KR')}</p>}
          </div>
        )}
        <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:12}} className="fade-up fade-up-3">
          <p style={{fontSize:13,fontWeight:600,color:'var(--color-text-muted)',letterSpacing:'0.03em',alignSelf:'flex-start'}}>전체적인 만족도 <span style={{color:'var(--color-primary)'}}>*</span></p>
          <div style={{display:'flex',gap:8}} role="radiogroup" aria-label="별점 선택">
            {[1,2,3,4,5].map(n=>(
              <button key={n} type="button" role="radio" aria-checked={rating===n} aria-label={`${n}점`}
                onClick={()=>setRating(n)} onMouseEnter={()=>setHovered(n)} onMouseLeave={()=>setHovered(0)}
                style={{background:'none',border:'none',fontSize:40,cursor:'pointer',padding:'0 4px',lineHeight:1,transition:'color 0.15s, transform 0.15s',fontFamily:'var(--font-body)',color:n<=dRating?starColor:'var(--color-border)',transform:n===dRating?'scale(1.2)':'scale(1)'}}>
                ★
              </button>
            ))}
          </div>
          <p style={{fontSize:13,fontWeight:600,color:starColor,textAlign:'center',minHeight:20,transition:'color 0.2s'}}>
            {STAR_LABELS[dRating]||'별점을 선택해주세요'}
          </p>
        </div>
        <div className="field fade-up fade-up-4">
          <label htmlFor="review-content" style={{fontSize:13,fontWeight:600,color:'var(--color-text-muted)',letterSpacing:'0.03em'}}>후기 내용 <span style={{color:'var(--color-primary)'}}>*</span></label>
          <p style={{fontSize:12,color:'var(--color-text-hint)',marginBottom:8}}>상대방에 대한 구체적인 후기를 남겨주세요. 비방·욕설은 반려될 수 있습니다.</p>
          <div style={{position:'relative'}}>
            <textarea id="review-content" className={`input${submitErr&&content.trim().length<10?' error':''}`} placeholder="만남은 어땠나요? 분위기, 대화, 전반적인 경험을 자유롭게 작성해주세요. (최소 10자)" value={content} onChange={e=>{setContent(e.target.value);setSubmitErr(null)}} maxLength={1000} rows={6} style={{resize:'none',paddingBottom:28,lineHeight:1.7}}/>
            <span style={{position:'absolute',bottom:10,right:12,fontSize:11,color:content.length>900?'var(--color-error)':'var(--color-text-hint)'}}>{content.length}/1000</span>
          </div>
        </div>
        <div style={{background:'var(--color-primary-light)',border:'1px solid #F4A3AC',borderRadius:'var(--radius-md)',padding:'12px 14px'}} className="fade-up fade-up-4">
          <p style={{fontSize:12,color:'var(--color-text-muted)',lineHeight:1.7}}>작성된 후기는 관리자 검토 후 공개됩니다. 개인정보가 포함된 내용은 반려될 수 있습니다.</p>
        </div>
        {submitErr&&<p role="alert" style={{fontSize:13,color:'var(--color-error)',textAlign:'center'}}>{submitErr}</p>}
        <button type="button" className="btn-primary fade-up fade-up-5" onClick={handleSubmit} disabled={submitting||rating===0||content.trim().length<10}>
          {submitting?<span className="spinner" style={{margin:'0 auto',width:20,height:20,borderWidth:2}}/>:'후기 제출하기'}
        </button>
      </main>
    </div>
  )
}
