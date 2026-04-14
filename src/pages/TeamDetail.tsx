// src/pages/TeamDetail.tsx
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useState } from 'react'
import { useTeamDetail } from '../hooks/useTeam'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabaseClient'
import type { TeamMemberPublic } from '../services/teamService'
import '../styles/global.css'

const MBTI_COLORS: Record<string,string> = {
  INTJ:'#7C3AED',INTP:'#6D28D9',ENTJ:'#7C3AED',ENTP:'#8B5CF6',
  INFJ:'#DB2777',INFP:'#EC4899',ENFJ:'#F472B6',ENFP:'#F9A8D4',
  ISTJ:'#0369A1',ISFJ:'#0284C7',ESTJ:'#0EA5E9',ESFJ:'#38BDF8',
  ISTP:'#059669',ISFP:'#10B981',ESTP:'#34D399',ESFP:'#6EE7B7',
}

function StatusBadge({status}:{status:string}) {
  const map: Record<string,{bg:string;color:string;label:string}> = {
    open:{bg:'#D1FAE5',color:'#065F46',label:'모집중'},
    matched:{bg:'#FDE8EB',color:'#C0394B',label:'매칭됨'},
    closed:{bg:'#F3F4F6',color:'#6B7280',label:'마감'},
  }
  const s = map[status]??map.open
  return <span style={{padding:'3px 10px',borderRadius:'var(--radius-full)',fontSize:11,fontWeight:600,background:s.bg,color:s.color}}>{s.label}</span>
}

function MemberCard({member,index}:{member:TeamMemberPublic;index:number}) {
  const mc = member.mbti?MBTI_COLORS[member.mbti]??'var(--color-primary)':'var(--color-primary)'
  return (
    <div style={{background:'var(--color-surface)',border:'1px solid var(--color-border)',borderRadius:'var(--radius-lg)',padding:'18px 12px 14px',display:'flex',flexDirection:'column',alignItems:'center',gap:8,boxShadow:'var(--shadow-sm)'}} className={`fade-up fade-up-${index+1}`}>
      <div style={{width:44,height:44,borderRadius:'50%',background:`${mc}22`,color:mc,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,fontWeight:700}}>{member.nickname.charAt(0).toUpperCase()}</div>
      <p style={{fontSize:13,fontWeight:600,color:'var(--color-text)',textAlign:'center'}}>{member.nickname}</p>
      <div style={{display:'flex',flexWrap:'wrap',gap:4,justifyContent:'center'}}>
        {member.mbti&&<span style={{padding:'2px 7px',borderRadius:'var(--radius-full)',fontSize:10,fontWeight:700,background:`${mc}18`,color:mc}}>{member.mbti}</span>}
        <span style={{padding:'2px 7px',borderRadius:'var(--radius-full)',fontSize:10,background:'var(--color-bg)',border:'1px solid var(--color-border)',color:'var(--color-text-muted)'}}>{member.is_smoker?'흡연':'비흡연'}</span>
      </div>
    </div>
  )
}

export default function TeamDetail() {
  const { teamId } = useParams<{teamId:string}>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { team, loading, error } = useTeamDetail(teamId)
  const [matchLoading, setMatchLoading] = useState(false)
  const [matchError, setMatchError] = useState<string|null>(null)
  const [matchDone, setMatchDone] = useState(false)

  const isMyTeam = team?.members.some(m=>m.user_id===user?.id)??false
  const isOwner  = team?.created_by===user?.id
  const isFull   = (team?.member_count??0)>=3
  const canApply = !isMyTeam&&user?.gender==='female'&&team?.gender==='male'&&team?.status==='open'&&isFull

  const handleApply = async () => {
    if(!user||!team) return
    setMatchLoading(true); setMatchError(null)
    const { data: myMember } = await supabase.from('team_members').select('team_id').eq('user_id',user.id).maybeSingle()
    if(!myMember?.team_id) { setMatchError('소속된 팀이 없습니다. 먼저 팀을 만들어주세요.'); setMatchLoading(false); return }
    const { error: insertErr } = await supabase.from('matches').insert({ female_team_id:myMember.team_id, male_team_id:team.id, requested_by:user.id })
    setMatchLoading(false)
    if(insertErr) {
      if(insertErr.code==='23505') { setMatchError('이미 이 팀에 과팅을 신청했습니다.'); return }
      setMatchError('신청 중 오류가 발생했습니다.'); return
    }
    setMatchDone(true)
  }

  if(loading) return <div style={{display:'flex',justifyContent:'center',alignItems:'center',minHeight:'60vh'}}><div className="spinner"/></div>
  if(error||!team) return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'60vh',padding:24}}>
      <span style={{fontSize:40}}>😕</span>
      <p style={{fontSize:16,fontWeight:600,color:'var(--color-text-muted)',marginTop:12}}>{error??'팀을 찾을 수 없어요'}</p>
      <button className="btn-ghost" onClick={()=>navigate('/teams')} style={{marginTop:16}}>목록으로</button>
    </div>
  )

  const mc = team.member_count??0

  return (
    <div style={{minHeight:'100dvh',background:'var(--color-bg)',paddingBottom:48,position:'relative',overflow:'hidden'}}>
      <div style={{position:'absolute',width:280,height:280,borderRadius:'50%',background:'var(--color-primary-light)',opacity:0.3,top:-60,right:-60,pointerEvents:'none'}} aria-hidden/>
      <main style={{maxWidth:520,margin:'0 auto',padding:'16px 16px 24px',display:'flex',flexDirection:'column',gap:20,position:'relative',zIndex:1}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}} className="fade-up fade-up-1">
          <button onClick={()=>navigate(-1)} style={{background:'none',border:'none',fontSize:22,cursor:'pointer',color:'var(--color-text-muted)',padding:4,fontFamily:'var(--font-body)'}}>←</button>
          {isOwner&&<Link to={`/team/${team.id}/manage`} style={{padding:'8px 16px',background:'var(--color-surface)',border:'1.5px solid var(--color-border)',borderRadius:'var(--radius-full)',fontSize:13,fontWeight:500,color:'var(--color-text-muted)',textDecoration:'none'}}>팀 관리</Link>}
        </div>

        <section style={{background:'var(--color-surface)',borderRadius:'var(--radius-xl)',border:'1px solid var(--color-border)',padding:'24px 22px',boxShadow:'var(--shadow-md)',display:'flex',flexDirection:'column',gap:14}} className="fade-up fade-up-2">
          <div style={{display:'flex',alignItems:'flex-start',gap:14}}>
            <div style={{width:52,height:52,borderRadius:'var(--radius-lg)',background:'var(--color-primary-light)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:26,flexShrink:0}}>{team.gender==='female'?'👩':'👨'}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',marginBottom:6}}>
                <h1 style={{fontFamily:'var(--font-display)',fontSize:22,fontWeight:400,color:'var(--color-text)'}}>{team.name}</h1>
                <StatusBadge status={team.status}/>
              </div>
              <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                {[team.university, team.gender==='female'?'여성 팀':'남성 팀'].map(t=>(
                  <span key={t} style={{display:'inline-block',padding:'3px 10px',background:'var(--color-bg)',border:'1px solid var(--color-border)',borderRadius:'var(--radius-full)',fontSize:12,color:'var(--color-text-muted)'}}>{t}</span>
                ))}
              </div>
            </div>
          </div>
          {team.description&&<p style={{fontSize:14,color:'var(--color-text-muted)',lineHeight:1.65,padding:'12px 14px',background:'var(--color-bg)',borderRadius:'var(--radius-md)',border:'1px solid var(--color-border)'}}>{team.description}</p>}
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span style={{fontSize:13,color:'var(--color-text-muted)'}}>팀원</span>
              <span style={{fontSize:13,fontWeight:600,color:isFull?'var(--color-primary)':'var(--color-text)'}}>{mc}/3명 {isFull&&'✓ 완성'}</span>
            </div>
            <div style={{width:'100%',height:8,background:'var(--color-border)',borderRadius:'var(--radius-full)',overflow:'hidden'}}>
              <div style={{height:'100%',background:'var(--color-primary)',borderRadius:'var(--radius-full)',width:`${(mc/3)*100}%`,transition:'width 0.5s ease'}}/>
            </div>
          </div>
        </section>

        <section className="fade-up fade-up-3">
          <h2 style={{fontSize:13,fontWeight:600,color:'var(--color-text-muted)',letterSpacing:'0.04em',marginBottom:12,paddingLeft:2}}>팀원 소개</h2>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
            {team.members.map((m,i)=><MemberCard key={m.user_id} member={m} index={i}/>)}
            {Array.from({length:3-mc}).map((_,i)=>(
              <div key={`e${i}`} style={{border:'1.5px dashed var(--color-border)',borderRadius:'var(--radius-lg)',padding:'18px 12px 14px',display:'flex',flexDirection:'column',alignItems:'center',gap:8}}>
                <div style={{width:44,height:44,borderRadius:'50%',border:'1.5px dashed var(--color-border)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,color:'var(--color-text-hint)'}}>+</div>
                <p style={{fontSize:11,color:'var(--color-text-hint)'}}>팀원 모집 중</p>
              </div>
            ))}
          </div>
        </section>

        {isMyTeam&&(
          <section style={{display:'flex',alignItems:'center',gap:12,background:'var(--color-primary-light)',border:'1px solid #F4A3AC',borderRadius:'var(--radius-lg)',padding:'14px 16px'}} className="fade-up fade-up-4">
            <span style={{fontSize:18}}>👋</span>
            <div style={{flex:1}}>
              <p style={{fontSize:14,fontWeight:600,color:'var(--color-primary)'}}>내 팀이에요</p>
              <p style={{fontSize:12,color:'var(--color-text-muted)',marginTop:2}}>팀원을 추가하거나 소개글을 수정할 수 있어요.</p>
            </div>
            {isOwner&&<Link to={`/team/${team.id}/manage`} style={{padding:'8px 16px',background:'var(--color-primary)',color:'#fff',borderRadius:'var(--radius-full)',fontSize:12,fontWeight:600,textDecoration:'none',flexShrink:0}}>관리</Link>}
          </section>
        )}

        {!isMyTeam&&(
          <section style={{display:'flex',flexDirection:'column',gap:10}} className="fade-up fade-up-4">
            {matchDone&&(
              <div style={{display:'flex',alignItems:'center',gap:12,background:'#F0FDF4',border:'1px solid #A7F3D0',borderRadius:'var(--radius-lg)',padding:'14px 16px'}}>
                <span style={{fontSize:20}}>🎉</span>
                <div>
                  <p style={{fontSize:14,fontWeight:600,color:'#065F46'}}>과팅 신청 완료!</p>
                  <p style={{fontSize:12,color:'#047857',marginTop:2}}>상대 팀이 수락하면 연락처가 공개됩니다.</p>
                </div>
              </div>
            )}
            {matchError&&<p role="alert" style={{fontSize:13,color:'var(--color-error)',textAlign:'center'}}>{matchError}</p>}
            {!matchDone&&(
              <>
                <button className="btn-primary" onClick={handleApply} disabled={!canApply||matchLoading} style={{fontSize:15}}>
                  {matchLoading?<span className="spinner" style={{margin:'0 auto',width:20,height:20,borderWidth:2}}/>:'과팅 신청하기'}
                </button>
                {!canApply&&!matchDone&&(
                  <p style={{fontSize:12,color:'var(--color-text-hint)',textAlign:'center'}}>
                    {team.status!=='open'?'현재 매칭을 받지 않는 팀입니다.':!isFull?'팀원이 3명이 되어야 신청 가능합니다.':user?.gender!=='female'?'여성 팀만 남성 팀에게 신청할 수 있습니다.':''}
                  </p>
                )}
              </>
            )}
            <Link to={`/report?teamId=${team.id}`} style={{textAlign:'center',display:'block',fontSize:12,color:'var(--color-text-hint)',textDecoration:'underline',padding:'4px 0'}}>이 팀 신고하기</Link>
          </section>
        )}

        <p style={{textAlign:'center',fontSize:11,color:'var(--color-text-hint)'}} className="fade-up">등록일 {new Date(team.created_at).toLocaleDateString('ko-KR')}</p>
      </main>
    </div>
  )
}
