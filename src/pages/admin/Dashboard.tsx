// src/pages/admin/Dashboard.tsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { fetchDashboardStats, togglePaymentMode } from '../../services/adminService'
import { useAuth } from '../../hooks/useAuth'
import type { DashboardStats } from '../../services/adminService'
import '../../styles/global.css'

const STAT_CARDS = [
  {key:'totalUsers'     as keyof DashboardStats, label:'전체 회원',     icon:'👥', to:'/admin/users',         urgent:false},
  {key:'pendingVerif'   as keyof DashboardStats, label:'인증 대기',     icon:'🪪', to:'/admin/verifications', urgent:true},
  {key:'activeTeams'    as keyof DashboardStats, label:'활성 팀',       icon:'🏷️', to:'/admin/teams',         urgent:false},
  {key:'pendingMatches' as keyof DashboardStats, label:'매칭 대기',     icon:'💌', to:'/admin/teams',         urgent:false},
  {key:'acceptedMatches'as keyof DashboardStats, label:'매칭 성사',     icon:'🎉', to:'/admin/teams',         urgent:false},
  {key:'pendingReports' as keyof DashboardStats, label:'처리 대기 신고',icon:'🚨', to:'/admin/reports',       urgent:true},
  {key:'pendingReviews' as keyof DashboardStats, label:'승인 대기 후기',icon:'📝', to:'/admin/reviews',       urgent:true},
  {key:'recentPayments' as keyof DashboardStats, label:'30일 결제',     icon:'💳', to:'/admin/payments',      urgent:false},
] as const

const QUICK_ACTIONS = [
  {label:'인증 승인 처리',to:'/admin/verifications',icon:'🪪',color:'#F4717F'},
  {label:'신고 검토',    to:'/admin/reports',      icon:'🚨',color:'#EF4444'},
  {label:'후기 승인',    to:'/admin/reviews',      icon:'📝',color:'#8B5CF6'},
  {label:'회원 관리',    to:'/admin/users',         icon:'👥',color:'#0EA5E9'},
] as const

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats|null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string|null>(null)
  const [modeToggling, setModeToggling] = useState(false)
  const [modeError, setModeError] = useState<string|null>(null)
  const [modeSuccess, setModeSuccess] = useState(false)

  const loadStats = async () => {
    setLoading(true); setError(null)
    const { data, error } = await fetchDashboardStats()
    setStats(data); if(error) setError(error); setLoading(false)
  }
  useEffect(() => { loadStats() }, [])

  const handleToggleMode = async () => {
    if(!user||!stats) return
    const next = stats.paymentMode==='free'?'paid':'free'
    if(!window.confirm(next==='paid'?'유료 모드로 전환합니다. 계속할까요?':'무료 모드로 전환합니다. 계속할까요?')) return
    setModeToggling(true); setModeError(null); setModeSuccess(false)
    const { error } = await togglePaymentMode(next, user.id)
    setModeToggling(false)
    if(error) { setModeError(error); return }
    setStats(prev=>prev?{...prev,paymentMode:next}:prev); setModeSuccess(true)
    setTimeout(()=>setModeSuccess(false),3000)
  }

  const greeting = () => { const h=new Date().getHours(); return h<12?'좋은 아침이에요':h<18?'안녕하세요':'좋은 저녁이에요' }

  return (
    <div style={{display:'flex',flexDirection:'column',gap:28}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:16}} className="fade-up fade-up-1">
        <div>
          <h1 style={{fontFamily:'var(--font-display)',fontSize:26,fontWeight:400,color:'var(--color-text)',marginBottom:4}}>대시보드</h1>
          <p style={{fontSize:14,color:'var(--color-text-muted)'}}>{greeting()}, <strong style={{color:'var(--color-primary)'}}>{user?.nickname??'관리자'}</strong> 님</p>
        </div>
        <button style={{padding:'8px 16px',background:'none',border:'1.5px solid var(--color-border)',borderRadius:'var(--radius-full)',fontSize:13,color:'var(--color-text-muted)',cursor:'pointer',fontFamily:'var(--font-body)',flexShrink:0}} onClick={loadStats} disabled={loading}>{loading?'...':'↻ 새로고침'}</button>
      </div>
      {error&&<div style={{background:'var(--color-primary-light)',border:'1px solid #F4A3AC',borderRadius:'var(--radius-md)',padding:'14px 16px'}} role="alert" className="fade-up"><p style={{fontSize:13,color:'var(--color-error)'}}>{error}</p></div>}
      <section className="fade-up fade-up-2">
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:12}}>
          {STAT_CARDS.map(card=>{
            const value = stats?(stats[card.key] as number):null
            const isUrgent = card.urgent&&value!==null&&value>0
            return (
              <Link key={card.key} to={card.to} style={{background:isUrgent?'var(--color-primary-light)':'var(--color-surface)',border:`1.5px solid ${isUrgent?'var(--color-primary)':'var(--color-border)'}`,borderRadius:'var(--radius-lg)',padding:'16px 16px 14px',textDecoration:'none',display:'flex',flexDirection:'column',gap:6,boxShadow:'var(--shadow-sm)'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{fontSize:22}}>{card.icon}</span>
                  {isUrgent&&<span style={{width:8,height:8,borderRadius:'50%',background:'var(--color-primary)',animation:'pulse 1.5s ease-in-out infinite'}}/>}
                </div>
                <p style={{fontSize:26,fontWeight:700,lineHeight:1.1,fontFamily:'var(--font-display)',minHeight:32,color:isUrgent?'var(--color-primary)':'var(--color-text)'}}>
                  {loading?<span style={{display:'inline-block',width:48,height:28,background:'var(--color-border)',borderRadius:4}}/>:(value??0).toLocaleString()}
                </p>
                <p style={{fontSize:12,color:'var(--color-text-muted)'}}>{card.label}</p>
              </Link>
            )
          })}
        </div>
      </section>
      <div style={{display:'grid',gridTemplateColumns:'1fr 320px',gap:20,alignItems:'start'}}>
        <section className="fade-up fade-up-3">
          <h2 style={{fontSize:14,fontWeight:600,color:'var(--color-text-muted)',marginBottom:12,letterSpacing:'0.03em'}}>빠른 처리</h2>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {QUICK_ACTIONS.map(action=>{
              const count = action.to==='/admin/verifications'?(stats?.pendingVerif??0):action.to==='/admin/reports'?(stats?.pendingReports??0):action.to==='/admin/reviews'?(stats?.pendingReviews??0):0
              return (
                <Link key={action.to} to={action.to} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 16px',background:'var(--color-surface)',border:'1px solid var(--color-border)',borderLeft:`3px solid ${action.color}`,borderRadius:'var(--radius-md)',textDecoration:'none',boxShadow:'var(--shadow-sm)'}}>
                  <div style={{display:'flex',alignItems:'center',gap:10}}>
                    <span style={{fontSize:20}}>{action.icon}</span>
                    <span style={{fontSize:14,fontWeight:500,color:'var(--color-text)'}}>{action.label}</span>
                  </div>
                  {count>0&&<span style={{padding:'3px 10px',borderRadius:'var(--radius-full)',fontSize:11,fontWeight:700,color:'#fff',background:action.color}}>{count}건</span>}
                </Link>
              )
            })}
          </div>
        </section>
        <section className="fade-up fade-up-4">
          <h2 style={{fontSize:14,fontWeight:600,color:'var(--color-text-muted)',marginBottom:12,letterSpacing:'0.03em'}}>결제 모드</h2>
          <div style={{background:'var(--color-surface)',border:'1px solid var(--color-border)',borderRadius:'var(--radius-lg)',padding:'18px 20px',boxShadow:'var(--shadow-sm)'}}>
            <div style={{display:'flex',alignItems:'flex-start',gap:12}}>
              <div style={{width:12,height:12,borderRadius:'50%',marginTop:3,flexShrink:0,transition:'background 0.3s',background:stats?.paymentMode==='paid'?'#16A34A':'var(--color-text-hint)'}}/>
              <div>
                <p style={{fontSize:14,color:'var(--color-text)',marginBottom:4}}>현재: <strong style={{color:stats?.paymentMode==='paid'?'#16A34A':'var(--color-text-muted)'}}>{loading?'...':stats?.paymentMode==='paid'?'유료 모드':'무료 모드'}</strong></p>
                <p style={{fontSize:12,color:'var(--color-text-muted)'}}>{stats?.paymentMode==='paid'?'과팅 신청 시 이용권이 필요합니다.':'결제 없이 누구나 과팅을 신청할 수 있습니다.'}</p>
              </div>
            </div>
            <div style={{height:1,background:'var(--color-border)',margin:'12px 0'}}/>
            {modeError&&<p role="alert" style={{fontSize:12,color:'var(--color-error)',marginBottom:8}}>{modeError}</p>}
            {modeSuccess&&<p role="status" style={{fontSize:12,color:'var(--color-success)',marginBottom:8}}>✓ 모드가 변경되었습니다.</p>}
            <button onClick={handleToggleMode} disabled={loading||modeToggling} style={{width:'100%',padding:'11px',border:'none',borderRadius:'var(--radius-md)',fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:'var(--font-body)',display:'flex',alignItems:'center',justifyContent:'center',transition:'opacity 0.15s',background:stats?.paymentMode==='free'?'var(--color-primary)':'#F3F4F6',color:stats?.paymentMode==='free'?'#fff':'var(--color-text-muted)',marginTop:12}}>
              {modeToggling?<span className="spinner" style={{margin:'0 auto',width:18,height:18,borderWidth:2}}/>:stats?.paymentMode==='free'?'유료 모드로 전환':'무료 모드로 전환'}
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
