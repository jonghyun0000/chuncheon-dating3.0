// src/pages/MatchApply.tsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useMatch } from '../hooks/useMatch'
import { getMatchContact } from '../services/matchService'
import type { MatchListItem, MemberContact } from '../services/matchService'
import '../styles/global.css'

type TabKey = 'pending'|'accepted'|'closed'
const TABS: {key:TabKey;label:string}[] = [{key:'pending',label:'진행중'},{key:'accepted',label:'매칭 성사'},{key:'closed',label:'종료'}]
const STATUS_META: Record<string,{label:string;bg:string;color:string}> = {
  pending:  {label:'검토중',   bg:'#FEF3C7',color:'#92400E'},
  accepted: {label:'매칭 성사',bg:'#D1FAE5',color:'#065F46'},
  rejected: {label:'거절됨',  bg:'#FEE2E2',color:'#991B1B'},
  cancelled:{label:'취소됨',  bg:'#F3F4F6',color:'#6B7280'},
}

function MatchCard({match,isActionLoading,onAccept,onReject,onCancel}:{match:MatchListItem;isActionLoading:boolean;onAccept:()=>Promise<string|null>;onReject:()=>Promise<string|null>;onCancel:()=>Promise<string|null>}) {
  const navigate = useNavigate()
  const sm = STATUS_META[match.status]
  const isSender   = match.my_role==='sender'
  const isReceiver = match.my_role==='receiver'
  const [actionError, setActionError] = useState<string|null>(null)
  const [contacts, setContacts] = useState<MemberContact[]|null>(null)
  const [contactLoad, setContactLoad] = useState(false)
  const [contactError, setContactError] = useState<string|null>(null)
  const [showContacts, setShowContacts] = useState(false)

  const doAction = async (fn:()=>Promise<string|null>) => {
    setActionError(null)
    const err = await fn()
    if(err) setActionError(err)
  }

  const handleShowContacts = async () => {
    if(contacts) { setShowContacts(v=>!v); return }
    setContactLoad(true); setContactError(null)
    const { data, error } = await getMatchContact(match.id)
    setContactLoad(false)
    if(error) { setContactError(error); return }
    setContacts(data); setShowContacts(true)
  }

  return (
    <div style={{background:'var(--color-surface)',border:'1px solid var(--color-border)',borderRadius:'var(--radius-lg)',padding:'18px',display:'flex',flexDirection:'column',gap:12,boxShadow:'var(--shadow-sm)'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        {isSender
          ? <span style={{fontSize:11,fontWeight:600,color:'var(--color-text-hint)',background:'var(--color-bg)',border:'1px solid var(--color-border)',borderRadius:'var(--radius-full)',padding:'2px 9px'}}>신청한 매칭</span>
          : <span style={{fontSize:11,fontWeight:600,color:'var(--color-primary)',background:'var(--color-primary-light)',borderRadius:'var(--radius-full)',padding:'2px 9px'}}>받은 신청</span>
        }
        <span style={{padding:'3px 10px',borderRadius:'var(--radius-full)',fontSize:11,fontWeight:600,background:sm.bg,color:sm.color}}>{sm.label}</span>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:12,padding:'10px 12px',background:'var(--color-bg)',border:'1px solid var(--color-border)',borderRadius:'var(--radius-md)',cursor:'pointer'}} onClick={()=>navigate(`/team/${match.opponent_team.id}`)} role="button" tabIndex={0} onKeyDown={e=>e.key==='Enter'&&navigate(`/team/${match.opponent_team.id}`)}>
        <div style={{width:40,height:40,borderRadius:'var(--radius-md)',background:'var(--color-primary-light)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>{match.opponent_team.gender==='female'?'👩':'👨'}</div>
        <div style={{flex:1,minWidth:0}}>
          <p style={{fontSize:15,fontWeight:600,color:'var(--color-text)'}}>{match.opponent_team.name}</p>
          <p style={{fontSize:12,color:'var(--color-text-muted)',marginTop:2}}>{match.opponent_team.university} · {match.opponent_team.gender==='female'?'여성 팀':'남성 팀'} · {match.opponent_team.member_count}명</p>
        </div>
        <span style={{fontSize:20,color:'var(--color-text-hint)'}}>›</span>
      </div>
      <p style={{fontSize:11,color:'var(--color-text-hint)'}}>신청일 {new Date(match.created_at).toLocaleDateString('ko-KR')}{match.matched_at&&` · 성사일 ${new Date(match.matched_at).toLocaleDateString('ko-KR')}`}</p>
      {actionError&&<p role="alert" style={{fontSize:12,color:'var(--color-error)'}}>{actionError}</p>}
      {match.status==='pending'&&isReceiver&&(
        <div style={{display:'flex',gap:10}}>
          <button style={{flex:1,padding:'11px 0',background:'none',border:'1.5px solid var(--color-border)',borderRadius:'var(--radius-md)',fontSize:14,cursor:'pointer',fontFamily:'var(--font-body)',color:'var(--color-text-muted)',display:'flex',alignItems:'center',justifyContent:'center'}} onClick={()=>doAction(onReject)} disabled={isActionLoading}>
            {isActionLoading?<span className="spinner" style={{width:14,height:14,borderWidth:2}}/>:'거절'}
          </button>
          <button className="btn-primary" style={{flex:2,padding:'11px 0'}} onClick={()=>doAction(onAccept)} disabled={isActionLoading}>
            {isActionLoading?<span className="spinner" style={{margin:'0 auto',width:16,height:16,borderWidth:2}}/>:'수락하기'}
          </button>
        </div>
      )}
      {match.status==='pending'&&isSender&&(
        <button style={{width:'100%',padding:'11px 0',background:'none',border:'1.5px solid var(--color-border)',borderRadius:'var(--radius-md)',fontSize:14,cursor:'pointer',fontFamily:'var(--font-body)',color:'var(--color-text-muted)',display:'flex',alignItems:'center',justifyContent:'center',gap:6}} onClick={()=>doAction(onCancel)} disabled={isActionLoading}>
          {isActionLoading?<span className="spinner" style={{width:14,height:14,borderWidth:2}}/>:'신청 취소'}
        </button>
      )}
      {match.status==='accepted'&&(
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          <button style={{width:'100%',padding:'12px 0',background:'var(--color-primary-light)',border:'1.5px solid var(--color-primary)',borderRadius:'var(--radius-md)',fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:'var(--font-body)',color:'var(--color-primary)',display:'flex',alignItems:'center',justifyContent:'center',gap:6}} onClick={handleShowContacts} disabled={contactLoad}>
            {contactLoad?<span className="spinner" style={{width:14,height:14,borderWidth:2}}/>:showContacts?'연락처 숨기기':'연락처 확인하기 🎉'}
          </button>
          {contactError&&<p role="alert" style={{fontSize:12,color:'var(--color-error)'}}>{contactError}</p>}
          {showContacts&&contacts&&contacts.length>0&&(
            <div style={{background:'#F0FDF4',border:'1px solid #A7F3D0',borderRadius:'var(--radius-lg)',padding:'16px',display:'flex',flexDirection:'column',gap:12}} role="region" aria-label="상대 팀 연락처" className="fade-up">
              <p style={{fontSize:13,fontWeight:600,color:'#065F46'}}>상대 팀 연락처</p>
              {contacts.map((c,i)=>(
                <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderBottom:'1px solid #BBF7D0'}}>
                  <div style={{width:34,height:34,borderRadius:'50%',background:'#D1FAE5',color:'#065F46',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:700,flexShrink:0}}>{c.nickname.charAt(0)}</div>
                  <div>
                    <p style={{fontSize:13,fontWeight:600,color:'#065F46'}}>{c.nickname}</p>
                    <p style={{fontSize:14,fontWeight:500,color:'#047857',marginTop:2,display:'flex',alignItems:'center',gap:6}}>
                      <span style={{fontSize:10,fontWeight:700,background:'#A7F3D0',color:'#047857',padding:'1px 6px',borderRadius:'var(--radius-full)'}}>{c.contact_type==='kakao'?'카카오':'인스타'}</span>
                      {c.contact_value}
                    </p>
                  </div>
                </div>
              ))}
              <p style={{fontSize:11,color:'#6B7280',textAlign:'center',lineHeight:1.6,marginTop:4}}>연락처는 본인과 상대방만 확인할 수 있습니다. 매너 있는 만남 부탁드려요 🌸</p>
            </div>
          )}
          <Link to={`/review/${match.id}`} style={{textAlign:'center',display:'block',fontSize:13,fontWeight:500,color:'var(--color-primary)',textDecoration:'underline',padding:'4px 0'}}>후기 작성하기</Link>
        </div>
      )}
    </div>
  )
}

export default function MatchApply() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { myTeam, pending, accepted, closed, loading, error, actionLoading, refresh, handleAccept, handleReject, handleCancel } = useMatch(user?.id)
  const [activeTab, setActiveTab] = useState<TabKey>('pending')

  if(!loading&&!myTeam?.teamId) return (
    <div style={{minHeight:'100dvh',background:'var(--color-bg)',display:'flex',justifyContent:'center',alignItems:'center',padding:'32px 16px'}}>
      <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'70vh',textAlign:'center',gap:12}}>
        <span style={{fontSize:48}}>🌸</span>
        <h1 style={{fontFamily:'var(--font-display)',fontSize:22,color:'var(--color-primary)',marginTop:12}}>팀이 없어요</h1>
        <p style={{fontSize:14,color:'var(--color-text-muted)',marginTop:6,textAlign:'center',lineHeight:1.6}}>먼저 팀을 만들거나 팀에 합류해야<br/>매칭 현황을 볼 수 있어요.</p>
        <Link to="/team/create" style={{marginTop:20,padding:'12px 28px',background:'var(--color-primary)',color:'#fff',borderRadius:'var(--radius-full)',textDecoration:'none',fontSize:15,fontWeight:600}}>팀 만들기</Link>
      </div>
    </div>
  )

  const tabData: Record<TabKey,MatchListItem[]> = { pending, accepted, closed }
  const currentList = tabData[activeTab]

  return (
    <div style={{minHeight:'100dvh',background:'var(--color-bg)',paddingBottom:48,position:'relative',overflow:'hidden'}}>
      <div style={{position:'absolute',width:280,height:280,borderRadius:'50%',background:'var(--color-primary-light)',opacity:0.28,top:-60,right:-60,pointerEvents:'none'}} aria-hidden/>
      <main style={{maxWidth:520,margin:'0 auto',padding:'24px 16px',display:'flex',flexDirection:'column',gap:16,position:'relative',zIndex:1}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12}} className="fade-up fade-up-1">
          <div>
            <h1 style={{fontFamily:'var(--font-display)',fontSize:26,fontWeight:400,color:'var(--color-text)',marginBottom:4}}>매칭 현황</h1>
            <p style={{fontSize:13,color:'var(--color-text-hint)'}}>
              {myTeam?.teamName?<><strong style={{color:'var(--color-primary)'}}>{myTeam.teamName}</strong> 팀의 매칭 현황이에요</>:'내 팀의 매칭 현황'}
            </p>
          </div>
          <Link to="/teams" style={{flexShrink:0,padding:'9px 16px',background:'var(--color-surface)',border:'1.5px solid var(--color-border)',borderRadius:'var(--radius-full)',textDecoration:'none',fontSize:13,fontWeight:500,color:'var(--color-text-muted)',alignSelf:'center'}}>팀 둘러보기</Link>
        </div>

        {myTeam?.teamId&&(
          <div style={{background:'var(--color-surface)',border:'1px solid var(--color-border)',borderRadius:'var(--radius-lg)',padding:'14px 18px',display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,boxShadow:'var(--shadow-sm)'}} className="fade-up fade-up-2">
            <div style={{display:'flex',alignItems:'center',gap:12,minWidth:0}}>
              <span style={{fontSize:20}}>{myTeam.gender==='female'?'👩':'👨'}</span>
              <div>
                <p style={{fontSize:15,fontWeight:600,color:'var(--color-text)'}}>{myTeam.teamName}</p>
                <p style={{fontSize:12,color:'var(--color-text-hint)',marginTop:2}}>{myTeam.gender==='female'?'여성 팀':'남성 팀'} · {myTeam.memberCount}/3명</p>
              </div>
            </div>
            <div style={{display:'flex',gap:8}}>
              <Link to={`/team/${myTeam.teamId}/manage`} style={{padding:'7px 14px',background:'none',border:'1.5px solid var(--color-border)',borderRadius:'var(--radius-full)',fontSize:12,fontWeight:500,color:'var(--color-text-muted)',textDecoration:'none'}}>팀 관리</Link>
              {myTeam.memberCount<3&&<span style={{padding:'6px 12px',borderRadius:'var(--radius-full)',background:'#FEF3C7',color:'#92400E',fontSize:11,fontWeight:600,alignSelf:'center'}}>{3-myTeam.memberCount}명 부족</span>}
            </div>
          </div>
        )}

        {loading&&<div style={{display:'flex',justifyContent:'center',padding:'40px 0'}}><div className="spinner"/></div>}
        {!loading&&error&&(
          <div style={{background:'var(--color-primary-light)',border:'1px solid #F4A3AC',borderRadius:'var(--radius-md)',padding:'14px 16px',display:'flex',flexDirection:'column',alignItems:'center'}} role="alert">
            <p style={{fontSize:13,color:'var(--color-error)'}}>{error}</p>
            <button className="btn-ghost" onClick={refresh} style={{marginTop:8,fontSize:13}}>다시 시도</button>
          </div>
        )}

        {!loading&&!error&&(
          <>
            <div style={{display:'flex',borderBottom:'1px solid var(--color-border)',gap:0}} role="tablist" className="fade-up fade-up-3">
              {TABS.map(tab=>{
                const count = tabData[tab.key].length
                return (
                  <button key={tab.key} role="tab" aria-selected={activeTab===tab.key} onClick={()=>setActiveTab(tab.key)}
                    style={{flex:1,padding:'12px 0',background:'none',border:'none',cursor:'pointer',fontSize:14,fontFamily:'var(--font-body)',display:'flex',alignItems:'center',justifyContent:'center',gap:6,transition:'color 0.15s',borderBottom:activeTab===tab.key?'2px solid var(--color-primary)':'2px solid transparent',color:activeTab===tab.key?'var(--color-primary)':'var(--color-text-muted)',fontWeight:activeTab===tab.key?600:400}}>
                    {tab.label}
                    {count>0&&<span style={{minWidth:18,height:18,borderRadius:'var(--radius-full)',fontSize:10,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',padding:'0 5px',background:activeTab===tab.key?'var(--color-primary)':'var(--color-border)',color:activeTab===tab.key?'#fff':'var(--color-text-muted)'}}>{count}</span>}
                  </button>
                )
              })}
            </div>
            {currentList.length===0&&(
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',padding:'48px 16px',textAlign:'center'}} className="fade-up">
                <span style={{fontSize:36}}>{activeTab==='pending'?'💌':activeTab==='accepted'?'🎉':'📭'}</span>
                <p style={{fontSize:15,fontWeight:500,color:'var(--color-text-muted)',marginTop:12}}>{activeTab==='pending'?'진행중인 매칭이 없어요':activeTab==='accepted'?'아직 성사된 매칭이 없어요':'종료된 매칭이 없어요'}</p>
                {activeTab==='pending'&&<Link to="/teams" style={{marginTop:16,padding:'9px 16px',background:'var(--color-surface)',border:'1.5px solid var(--color-border)',borderRadius:'var(--radius-full)',textDecoration:'none',fontSize:13,fontWeight:500,color:'var(--color-text-muted)'}}>팀 둘러보기</Link>}
              </div>
            )}
            <div style={{display:'flex',flexDirection:'column',gap:12}} className="fade-up fade-up-4">
              {currentList.map(match=>(
                <MatchCard key={match.id} match={match} isActionLoading={actionLoading===match.id}
                  onAccept={()=>handleAccept(match.id)} onReject={()=>handleReject(match.id)} onCancel={()=>handleCancel(match.id)}/>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
