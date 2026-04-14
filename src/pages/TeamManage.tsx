// src/pages/TeamManage.tsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useTeamDetail } from '../hooks/useTeam'
import { addTeamMember, removeTeamMember, updateTeamDescription } from '../services/matchService'
import { searchMemberCandidate } from '../services/teamService'
import { validateStudentId } from '../utils/validators'
import { UNIVERSITIES } from '../utils/validators'
import type { UniversityType } from '../lib/types'
import '../styles/global.css'

export default function TeamManage() {
  const { teamId } = useParams<{teamId:string}>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { team, loading, error, refresh } = useTeamDetail(teamId)
  const [searchUniv, setSearchUniv] = useState<UniversityType|''>('')
  const [searchSid, setSearchSid] = useState('')
  const [searchResult, setSearchResult] = useState<{user_id:string;nickname:string;university:string}|null>(null)
  const [searchError, setSearchError] = useState<string|null>(null)
  const [searching, setSearching] = useState(false)
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState<string|null>(null)
  const [addSuccess, setAddSuccess] = useState<string|null>(null)
  const [removingId, setRemovingId] = useState<string|null>(null)
  const [removeError, setRemoveError] = useState<string|null>(null)
  const [desc, setDesc] = useState('')
  const [descSaving, setDescSaving] = useState(false)
  const [descError, setDescError] = useState<string|null>(null)
  const [descSuccess, setDescSuccess] = useState(false)

  useEffect(() => { if(team) setDesc(team.description??'') }, [team])
  useEffect(() => { if(!loading&&team&&user&&team.created_by!==user.id) navigate(`/team/${teamId}`,{replace:true}) }, [loading,team,user,teamId,navigate])

  const handleSearch = async () => {
    setSearchResult(null); setSearchError(null); setAddError(null); setAddSuccess(null)
    const sidErr = validateStudentId(searchSid)
    if(sidErr) { setSearchError(sidErr); return }
    if(!searchUniv) { setSearchError('학교를 선택해주세요.'); return }
    setSearching(true)
    const { data, error } = await searchMemberCandidate(searchUniv as UniversityType, searchSid)
    setSearching(false)
    if(error) { setSearchError(error); return }
    setSearchResult(data)
  }

  const handleAdd = async () => {
    if(!teamId||!searchResult) return
    setAdding(true); setAddError(null)
    const { error } = await addTeamMember(teamId, searchResult.user_id)
    setAdding(false)
    if(error) { setAddError(error); return }
    setAddSuccess(`${searchResult.nickname} 님을 팀원으로 추가했습니다.`)
    setSearchResult(null); setSearchSid(''); setSearchUniv(''); refresh()
  }

  const handleRemove = async (userId: string, nickname: string) => {
    if(!teamId||!window.confirm(`${nickname} 님을 팀에서 제거할까요?`)) return
    setRemovingId(userId); setRemoveError(null)
    const { error } = await removeTeamMember(teamId, userId)
    setRemovingId(null)
    if(error) { setRemoveError(error); return }
    refresh()
  }

  const handleSaveDesc = async () => {
    if(!teamId) return
    if(desc.length>300) { setDescError('소개글은 300자 이하여야 합니다.'); return }
    setDescSaving(true); setDescError(null); setDescSuccess(false)
    const { error } = await updateTeamDescription(teamId, desc)
    setDescSaving(false)
    if(error) { setDescError(error); return }
    setDescSuccess(true); setTimeout(()=>setDescSuccess(false),2500); refresh()
  }

  if(loading) return <div style={{display:'flex',justifyContent:'center',alignItems:'center',minHeight:'60vh'}}><div className="spinner"/></div>
  if(error||!team) return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'60vh',padding:24}}>
      <p style={{color:'var(--color-text-muted)'}}>{error??'팀을 찾을 수 없습니다.'}</p>
      <button className="btn-ghost" onClick={()=>navigate('/teams')} style={{marginTop:12}}>목록으로</button>
    </div>
  )

  const mc = team.members.length
  const isFull = mc>=3

  const cardStyle: React.CSSProperties = {background:'var(--color-surface)',borderRadius:'var(--radius-lg)',border:'1px solid var(--color-border)',padding:'20px',boxShadow:'var(--shadow-sm)',display:'flex',flexDirection:'column',gap:12}

  return (
    <div style={{minHeight:'100dvh',background:'var(--color-bg)',paddingBottom:48,position:'relative',overflow:'hidden'}}>
      <div style={{position:'absolute',width:260,height:260,borderRadius:'50%',background:'var(--color-primary-light)',opacity:0.3,top:-60,right:-60,pointerEvents:'none'}} aria-hidden/>
      <main style={{maxWidth:480,margin:'0 auto',padding:'24px 16px',display:'flex',flexDirection:'column',gap:16,position:'relative',zIndex:1}}>
        <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:4}} className="fade-up fade-up-1">
          <Link to={`/team/${teamId}`} style={{fontSize:22,color:'var(--color-text-muted)',textDecoration:'none',padding:4}}>←</Link>
          <div>
            <h1 style={{fontFamily:'var(--font-display)',fontSize:22,fontWeight:400,color:'var(--color-primary)',marginBottom:2}}>{team.name}</h1>
            <p style={{fontSize:13,color:'var(--color-text-hint)'}}>팀 관리 · 팀장 전용</p>
          </div>
        </div>

        {/* 팀원 현황 */}
        <section style={cardStyle} className="fade-up fade-up-2">
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:2}}>
            <h2 style={{fontSize:15,fontWeight:600,color:'var(--color-text)'}}>팀원 현황</h2>
            <span style={{padding:'2px 8px',borderRadius:'var(--radius-full)',fontSize:11,fontWeight:700,background:isFull?'#D1FAE5':'#FEF3C7',color:isFull?'#065F46':'#92400E'}}>{mc}/3명</span>
          </div>
          {removeError&&<p role="alert" style={{fontSize:13,color:'var(--color-error)'}}>{removeError}</p>}
          <div style={{display:'flex',flexDirection:'column',gap:2}}>
            {team.members.map(m=>(
              <div key={m.user_id} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 0',borderBottom:'1px solid var(--color-border)'}}>
                <div style={{width:38,height:38,borderRadius:'50%',background:'var(--color-primary-light)',color:'var(--color-primary)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:700,flexShrink:0}}>{m.nickname.charAt(0)}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:'flex',alignItems:'center',gap:6}}>
                    <span style={{fontSize:14,fontWeight:600,color:'var(--color-text)'}}>{m.nickname}</span>
                    {m.user_id===team.created_by&&<span style={{padding:'2px 7px',borderRadius:'var(--radius-full)',background:'var(--color-primary-light)',color:'var(--color-primary)',fontSize:10,fontWeight:700}}>팀장</span>}
                  </div>
                  <span style={{fontSize:12,color:'var(--color-text-hint)'}}>{m.university}</span>
                </div>
                {user&&m.user_id!==user.id&&(
                  <button onClick={()=>handleRemove(m.user_id,m.nickname)} disabled={removingId===m.user_id} style={{padding:'6px 12px',background:'none',border:'1px solid var(--color-border)',borderRadius:'var(--radius-full)',fontSize:12,color:'var(--color-text-muted)',cursor:'pointer',fontFamily:'var(--font-body)',display:'flex',alignItems:'center',justifyContent:'center',minWidth:48,flexShrink:0}}>
                    {removingId===m.user_id?<span className="spinner" style={{width:14,height:14,borderWidth:2}}/>:'제거'}
                  </button>
                )}
              </div>
            ))}
            {Array.from({length:3-mc}).map((_,i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 0',opacity:0.5}}>
                <div style={{width:38,height:38,borderRadius:'50%',border:'1.5px dashed var(--color-border)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,color:'var(--color-text-hint)'}}>+</div>
                <span style={{fontSize:13,color:'var(--color-text-hint)'}}>팀원 자리 비어있음</span>
              </div>
            ))}
          </div>
        </section>

        {/* 팀원 추가 */}
        {!isFull&&(
          <section style={cardStyle} className="fade-up fade-up-3">
            <h2 style={{fontSize:15,fontWeight:600,color:'var(--color-text)'}}>팀원 추가</h2>
            <p style={{fontSize:13,color:'var(--color-text-muted)',lineHeight:1.6,marginTop:-4}}>추가할 팀원의 학교와 학번을 입력하면 가입·인증 완료된 회원을 찾아드려요.</p>
            <div style={{display:'flex',flexWrap:'wrap',gap:8,alignItems:'center'}}>
              <select className="input" style={{flex:'1 1 140px'}} value={searchUniv} onChange={e=>{setSearchUniv(e.target.value as UniversityType|'');setSearchError(null);setSearchResult(null)}}>
                <option value="">학교 선택</option>
                {UNIVERSITIES.map(u=><option key={u} value={u}>{u}</option>)}
              </select>
              <input type="text" inputMode="numeric" className="input" style={{flex:'1 1 140px'}} placeholder="학번 입력" value={searchSid} onChange={e=>{setSearchSid(e.target.value.replace(/\D/g,''));setSearchError(null);setSearchResult(null)}} maxLength={12} onKeyDown={e=>e.key==='Enter'&&handleSearch()}/>
              <button type="button" className="btn-primary" style={{flex:'none',padding:'0 20px',height:46,fontSize:14}} onClick={handleSearch} disabled={searching}>
                {searching?<span className="spinner" style={{width:16,height:16,borderWidth:2}}/>:'검색'}
              </button>
            </div>
            {searchError&&<p role="alert" style={{fontSize:13,color:'var(--color-error)'}}>{searchError}</p>}
            {searchResult&&(
              <div style={{background:'var(--color-bg)',border:'1px solid var(--color-border)',borderRadius:'var(--radius-lg)',padding:'16px',display:'flex',flexDirection:'column',gap:12}} className="fade-up">
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                  <div style={{width:38,height:38,borderRadius:'50%',background:'var(--color-primary-light)',color:'var(--color-primary)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:700,flexShrink:0}}>{searchResult.nickname.charAt(0)}</div>
                  <div>
                    <p style={{fontSize:15,fontWeight:600,color:'var(--color-text)'}}>{searchResult.nickname}</p>
                    <p style={{fontSize:12,color:'var(--color-text-muted)',marginTop:2}}>{searchResult.university}</p>
                  </div>
                </div>
                {addError&&<p role="alert" style={{fontSize:13,color:'var(--color-error)'}}>{addError}</p>}
                <div style={{display:'flex',gap:8,marginTop:4}}>
                  <button type="button" className="btn-ghost" style={{flex:1}} onClick={()=>{setSearchResult(null);setSearchSid('');setSearchUniv('')}}>취소</button>
                  <button type="button" className="btn-primary" style={{flex:2}} onClick={handleAdd} disabled={adding}>
                    {adding?<span className="spinner" style={{margin:'0 auto',width:18,height:18,borderWidth:2}}/>:`${searchResult.nickname} 님 추가하기`}
                  </button>
                </div>
              </div>
            )}
            {addSuccess&&<div style={{background:'#F0FDF4',border:'1px solid #A7F3D0',borderRadius:'var(--radius-md)',padding:'10px 14px',fontSize:13,color:'#065F46',fontWeight:500,display:'flex',alignItems:'center',gap:6}} role="status" className="fade-up"><span>✓</span>{addSuccess}</div>}
          </section>
        )}

        {isFull&&(
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',background:'#F0FDF4',border:'1px solid #A7F3D0',borderRadius:'var(--radius-lg)',padding:'20px 16px',textAlign:'center',gap:4}} className="fade-up fade-up-3">
            <span style={{fontSize:20}}>🎉</span>
            <p style={{fontSize:14,fontWeight:600,color:'#065F46'}}>팀원 3명 완성!</p>
            <p style={{fontSize:12,color:'#047857',marginTop:2}}>이제 팀 목록에서 마음에 드는 팀에 과팅을 신청할 수 있어요.</p>
          </div>
        )}

        {/* 소개글 수정 */}
        <section style={cardStyle} className="fade-up fade-up-4">
          <h2 style={{fontSize:15,fontWeight:600,color:'var(--color-text)'}}>팀 소개 수정</h2>
          <div style={{position:'relative'}}>
            <textarea className={`input${descError?' error':''}`} placeholder="팀 분위기, 만남의 목적, 선호 스타일 등을 자유롭게 적어주세요" value={desc} onChange={e=>{setDesc(e.target.value);setDescError(null);setDescSuccess(false)}} maxLength={300} rows={4} style={{resize:'none',paddingBottom:28,lineHeight:1.6}}/>
            <span style={{position:'absolute',bottom:10,right:12,fontSize:11,color:desc.length>270?'var(--color-error)':'var(--color-text-hint)'}}>{desc.length}/300</span>
          </div>
          {descError&&<p role="alert" style={{fontSize:13,color:'var(--color-error)'}}>{descError}</p>}
          {descSuccess&&<p role="status" style={{fontSize:12,color:'var(--color-success)'}}>✓ 소개글이 저장되었습니다.</p>}
          <button type="button" className="btn-primary" onClick={handleSaveDesc} disabled={descSaving||desc===(team.description??'')}>
            {descSaving?<span className="spinner" style={{margin:'0 auto',width:18,height:18,borderWidth:2}}/>:'저장'}
          </button>
        </section>

        <Link to="/match" style={{display:'flex',justifyContent:'space-between',alignItems:'center',background:'var(--color-surface)',border:'1px solid var(--color-border)',borderRadius:'var(--radius-lg)',padding:'16px 20px',textDecoration:'none',fontSize:15,fontWeight:500,color:'var(--color-text)',boxShadow:'var(--shadow-sm)'}} className="fade-up fade-up-5">
          <span>💌 매칭 현황 보기</span>
          <span style={{fontSize:18}}>→</span>
        </Link>
      </main>
    </div>
  )
}
