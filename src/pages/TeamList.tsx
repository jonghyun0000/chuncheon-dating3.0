// src/pages/TeamList.tsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTeamList } from '../hooks/useTeam'
import { useAuth } from '../hooks/useAuth'
import type { TeamListItem, UniversityType, GenderType } from '../lib/types'
import { UNIVERSITIES } from '../utils/validators'
import '../styles/global.css'

const STATUS_LABEL: Record<string,string>   = { open:'모집중', matched:'매칭됨', closed:'마감' }
const STATUS_BG: Record<string,string>      = { open:'#D1FAE5', matched:'#FDE8EB', closed:'#F3F4F6' }
const STATUS_COLOR: Record<string,string>   = { open:'#065F46', matched:'#C0394B', closed:'#6B7280' }

function MetaPill({children}:{children:React.ReactNode}) {
  return <span style={{display:'inline-block',padding:'3px 9px',background:'var(--color-bg)',border:'1px solid var(--color-border)',borderRadius:'var(--radius-full)',fontSize:12,color:'var(--color-text-muted)'}}>{children}</span>
}

function TeamCard({team,delay,onClick}:{team:TeamListItem;delay:number;onClick:()=>void}) {
  const mc = team.member_count??0
  return (
    <button onClick={onClick} style={{background:'var(--color-surface)',border:'1px solid var(--color-border)',borderRadius:'var(--radius-lg)',padding:'18px 20px',textAlign:'left',cursor:'pointer',transition:'box-shadow 0.18s',display:'flex',flexDirection:'column',gap:10,fontFamily:'var(--font-body)',boxShadow:'var(--shadow-sm)',width:'100%'}} className={`fade-up fade-up-${Math.min(delay+1,5)}`} aria-label={`${team.name} 팀 상세 보기`}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8}}>
        <h2 style={{fontSize:16,fontWeight:600,color:'var(--color-text)',lineHeight:1.3,flex:1}}>{team.name}</h2>
        <span style={{flexShrink:0,padding:'3px 9px',borderRadius:'var(--radius-full)',fontSize:11,fontWeight:600,background:STATUS_BG[team.status],color:STATUS_COLOR[team.status]}}>{STATUS_LABEL[team.status]??team.status}</span>
      </div>
      <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
        <MetaPill>{team.university}</MetaPill>
        <MetaPill>{team.gender==='female'?'여성 팀':'남성 팀'}</MetaPill>
      </div>
      {team.description&&<p style={{fontSize:13,color:'var(--color-text-muted)',lineHeight:1.55,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{team.description}</p>}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:4}}>
        <div style={{display:'flex',alignItems:'center',gap:5}}>
          {Array.from({length:3}).map((_,i)=>(
            <div key={i} style={{width:10,height:10,borderRadius:'50%',background:i<mc?'var(--color-primary)':'var(--color-border)',transition:'background 0.2s'}}/>
          ))}
          <span style={{fontSize:12,color:'var(--color-text-muted)',marginLeft:4}}>{mc}/3명</span>
        </div>
        <span style={{fontSize:11,color:'var(--color-text-hint)'}}>{new Date(team.created_at).toLocaleDateString('ko-KR',{month:'short',day:'numeric'})}</span>
      </div>
    </button>
  )
}

export default function TeamList() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { teams, loading, error, applyFilter, refresh } = useTeamList()
  const [univFilter, setUnivFilter] = useState<UniversityType|''>('')
  const [genderFilter, setGenderFilter] = useState<GenderType|''>('')
  const [statusFilter, setStatusFilter] = useState('')

  const handleFilter = () => applyFilter({ university:univFilter||undefined, gender:genderFilter||undefined, status:statusFilter||undefined })
  const handleReset = () => { setUnivFilter(''); setGenderFilter(''); setStatusFilter(''); applyFilter({}) }

  return (
    <div style={{minHeight:'100dvh',background:'var(--color-bg)',paddingBottom:48}}>
      <div style={{maxWidth:720,margin:'0 auto',padding:'28px 16px'}}>
        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:24,gap:12}} className="fade-up fade-up-1">
          <div>
            <h1 style={{fontFamily:'var(--font-display)',fontSize:26,fontWeight:400,color:'var(--color-text)',marginBottom:4}}>팀 목록</h1>
            <p style={{fontSize:13,color:'var(--color-text-hint)'}}>마음에 드는 팀에 과팅을 신청해보세요</p>
          </div>
          <Link to="/team/create" style={{flexShrink:0,padding:'10px 18px',background:'var(--color-primary)',color:'#fff',borderRadius:'var(--radius-full)',textDecoration:'none',fontSize:13,fontWeight:600,whiteSpace:'nowrap',alignSelf:'center'}}>+ 팀 만들기</Link>
        </div>
        <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:16,alignItems:'center'}} className="fade-up fade-up-2">
          <select className="input" style={{flex:'1 1 140px',minWidth:120,maxWidth:180,height:44,padding:'0 12px',fontSize:13}} value={univFilter} onChange={e=>setUnivFilter(e.target.value as UniversityType|'')}>
            <option value="">전체 학교</option>
            {UNIVERSITIES.map(u=><option key={u} value={u}>{u}</option>)}
          </select>
          <select className="input" style={{flex:'1 1 120px',minWidth:100,maxWidth:160,height:44,padding:'0 12px',fontSize:13}} value={genderFilter} onChange={e=>setGenderFilter(e.target.value as GenderType|'')}>
            <option value="">전체 성별</option>
            <option value="female">여성 팀</option>
            <option value="male">남성 팀</option>
          </select>
          <select className="input" style={{flex:'1 1 120px',minWidth:100,maxWidth:160,height:44,padding:'0 12px',fontSize:13}} value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>
            <option value="">전체 상태</option>
            <option value="open">모집중</option>
            <option value="matched">매칭됨</option>
          </select>
          <button type="button" className="btn-primary" style={{flex:'none',padding:'0 18px',height:44,fontSize:14}} onClick={handleFilter}>검색</button>
          {(univFilter||genderFilter||statusFilter)&&<button type="button" className="btn-ghost" style={{flex:'none',padding:'0 14px',height:44,fontSize:13}} onClick={handleReset}>초기화</button>}
        </div>
        {!loading&&<p style={{fontSize:13,color:'var(--color-text-hint)',marginBottom:12}} className="fade-up">{teams.length}개의 팀</p>}
        {loading&&<div style={{display:'flex',justifyContent:'center',padding:'60px 0'}}><div className="spinner"/></div>}
        {!loading&&error&&(
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',padding:'60px 20px',textAlign:'center'}}>
            <span style={{fontSize:32}}>😕</span>
            <p style={{fontSize:15,fontWeight:500,color:'var(--color-text-muted)',marginTop:12}}>{error}</p>
            <button className="btn-ghost" onClick={refresh} style={{marginTop:12}}>다시 시도</button>
          </div>
        )}
        {!loading&&!error&&teams.length===0&&(
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',padding:'60px 20px',textAlign:'center'}}>
            <span style={{fontSize:40}}>🌸</span>
            <p style={{fontSize:15,fontWeight:500,color:'var(--color-text-muted)',marginTop:12}}>아직 팀이 없어요</p>
            <Link to="/team/create" style={{marginTop:16,padding:'10px 18px',background:'var(--color-primary)',color:'#fff',borderRadius:'var(--radius-full)',textDecoration:'none',fontSize:13,fontWeight:600}}>팀 만들기</Link>
          </div>
        )}
        {!loading&&!error&&teams.length>0&&(
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:14}}>
            {teams.map((team,i)=>(
              <TeamCard key={team.id} team={team} delay={i%6} onClick={()=>navigate(`/team/${team.id}`)}/>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
