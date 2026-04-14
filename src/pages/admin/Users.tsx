// src/pages/admin/Users.tsx
import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { fetchUsers, toggleUserActive } from '../../services/adminService'
import type { AdminUserRow } from '../../services/adminService'
import { UNIVERSITIES } from '../../utils/validators'
import '../../styles/global.css'

const VERIF_STYLE: Record<string,{bg:string;color:string;label:string}> = {
  none:    {bg:'#F3F4F6',color:'#6B7280',label:'미제출'},
  pending: {bg:'#FEF3C7',color:'#92400E',label:'검토중'},
  verified:{bg:'#D1FAE5',color:'#065F46',label:'인증됨'},
  rejected:{bg:'#FEE2E2',color:'#991B1B',label:'반려됨'},
}

export default function Users() {
  const { user: adminUser } = useAuth()
  const [rows, setRows]           = useState<AdminUserRow[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string|null>(null)
  const [search, setSearch]       = useState('')
  const [univFilter, setUnivFilter] = useState('')
  const [verifFilter, setVerifFilter] = useState('')
  const [activeFilter, setActiveFilter] = useState<'all'|'active'|'inactive'>('all')
  const [togglingId, setTogglingId] = useState<string|null>(null)
  const [actionMsg, setActionMsg] = useState<{type:'ok'|'err';text:string}|null>(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    const { data, error } = await fetchUsers({
      search:     search.trim()||undefined,
      university: univFilter||undefined,
      isActive:   activeFilter==='all'?undefined:activeFilter==='active',
    })
    let filtered = data
    if(verifFilter) filtered = data.filter(r=>r.verification_status===verifFilter)
    setRows(filtered)
    if(error) setError(error)
    setLoading(false)
  }, [search, univFilter, verifFilter, activeFilter])

  useEffect(() => { load() }, [])

  const handleToggle = async (row: AdminUserRow) => {
    if(!adminUser) return
    if(!window.confirm(`${row.nickname} 님의 계정을 ${row.is_active?'비활성화':'활성화'}할까요?`)) return
    setTogglingId(row.id); setActionMsg(null)
    const { error } = await toggleUserActive(row.id, !row.is_active, adminUser.id)
    setTogglingId(null)
    if(error) { setActionMsg({type:'err',text:error}); return }
    setActionMsg({type:'ok',text:`${row.nickname} 님 계정을 ${row.is_active?'비활성화':'활성화'}했습니다.`})
    load()
  }

  const thS: React.CSSProperties = {padding:'10px 14px',textAlign:'left',fontSize:12,fontWeight:600,color:'var(--color-text-muted)',borderBottom:'1px solid var(--color-border)',background:'var(--color-bg)',whiteSpace:'nowrap'}

  return (
    <div style={{display:'flex',flexDirection:'column',gap:20}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:16}} className="fade-up fade-up-1">
        <div><h1 style={{fontFamily:'var(--font-display)',fontSize:24,fontWeight:400,color:'var(--color-text)',marginBottom:4}}>회원 관리</h1><p style={{fontSize:13,color:'var(--color-text-hint)'}}>가입 회원 목록 조회 및 계정 활성/비활성 관리</p></div>
        <button style={{padding:'8px 14px',background:'none',border:'1.5px solid var(--color-border)',borderRadius:'var(--radius-full)',fontSize:16,color:'var(--color-text-muted)',cursor:'pointer',fontFamily:'var(--font-body)'}} onClick={load} disabled={loading}>{loading?'...':'↻'}</button>
      </div>

      {actionMsg&&<div role={actionMsg.type==='ok'?'status':'alert'} style={{border:'1px solid',borderRadius:'var(--radius-md)',padding:'10px 14px',fontSize:13,fontWeight:500,background:actionMsg.type==='ok'?'#F0FDF4':'var(--color-primary-light)',borderColor:actionMsg.type==='ok'?'#A7F3D0':'#F4A3AC',color:actionMsg.type==='ok'?'#065F46':'#C0394B'}} className="fade-up">{actionMsg.type==='ok'?'✓':'!'} {actionMsg.text}</div>}

      {/* 필터 */}
      <div style={{display:'flex',flexWrap:'wrap',gap:8,alignItems:'center'}} className="fade-up fade-up-2">
        <input type="text" className="input" style={{flex:'1 1 160px',maxWidth:220,height:42,padding:'0 14px',fontSize:13}} placeholder="닉네임·아이디 검색" value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==='Enter'&&load()}/>
        <select className="input" style={{flex:'1 1 130px',maxWidth:180,height:42,padding:'0 12px',fontSize:13}} value={univFilter} onChange={e=>setUnivFilter(e.target.value)}>
          <option value="">전체 학교</option>
          {UNIVERSITIES.map(u=><option key={u} value={u}>{u}</option>)}
        </select>
        <select className="input" style={{flex:'1 1 120px',maxWidth:160,height:42,padding:'0 12px',fontSize:13}} value={verifFilter} onChange={e=>setVerifFilter(e.target.value)}>
          <option value="">전체 인증</option>
          {Object.entries(VERIF_STYLE).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
        </select>
        <div style={{display:'flex',gap:4}}>
          {(['all','active','inactive'] as const).map(f=>(
            <button key={f} type="button" onClick={()=>setActiveFilter(f)} style={{padding:'8px 14px',borderRadius:'var(--radius-full)',border:'1.5px solid',fontSize:13,fontWeight:activeFilter===f?600:400,cursor:'pointer',fontFamily:'var(--font-body)',transition:'all 0.15s',background:activeFilter===f?'var(--color-primary)':'var(--color-surface)',color:activeFilter===f?'#fff':'var(--color-text-muted)',borderColor:activeFilter===f?'var(--color-primary)':'var(--color-border)'}}>
              {f==='all'?'전체':f==='active'?'활성':'비활성'}
            </button>
          ))}
        </div>
        <button className="btn-primary" style={{flex:'none',padding:'0 18px',height:42,fontSize:13}} onClick={load}>검색</button>
        {(search||univFilter||verifFilter||activeFilter!=='all')&&<button className="btn-ghost" style={{flex:'none',padding:'0 14px',height:42,fontSize:13}} onClick={()=>{setSearch('');setUnivFilter('');setVerifFilter('');setActiveFilter('all')}}>초기화</button>}
      </div>

      {!loading&&<p style={{fontSize:13,color:'var(--color-text-hint)'}} className="fade-up">{rows.length}명</p>}

      <div style={{background:'var(--color-surface)',border:'1px solid var(--color-border)',borderRadius:'var(--radius-lg)',overflow:'hidden'}} className="fade-up fade-up-3">
        {loading?<div style={{display:'flex',justifyContent:'center',alignItems:'center',minHeight:200}}><div className="spinner"/></div>
        :error?<div style={{padding:24,textAlign:'center'}}><p style={{fontSize:13,color:'var(--color-error)'}}>{error}</p><button className="btn-ghost" onClick={load} style={{marginTop:12}}>다시 시도</button></div>
        :rows.length===0?<div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:200,padding:24,textAlign:'center'}}><span style={{fontSize:32,marginBottom:10}}>👥</span><p style={{fontSize:13,color:'var(--color-text-muted)'}}>검색 결과가 없습니다.</p></div>
        :(
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
              <thead><tr>{['닉네임/아이디','학교','성별','인증 상태','가입일','활성','액션'].map(h=><th key={h} style={thS}>{h}</th>)}</tr></thead>
              <tbody>
                {rows.map(row=>{
                  const vs = VERIF_STYLE[row.verification_status]??VERIF_STYLE.none
                  return (
                    <tr key={row.id} style={{borderBottom:'1px solid var(--color-border)'}}>
                      <td style={{padding:'10px 14px'}}>
                        <div style={{fontWeight:600,color:'var(--color-text)'}}>{row.nickname}</div>
                        <div style={{fontSize:11,color:'var(--color-text-hint)'}}>@{row.username}{row.role==='admin'&&<span style={{marginLeft:4,padding:'1px 6px',borderRadius:'var(--radius-full)',background:'var(--color-primary-light)',color:'var(--color-primary)',fontSize:10,fontWeight:700}}>관리자</span>}</div>
                      </td>
                      <td style={{padding:'10px 14px',fontSize:12,color:'var(--color-text-muted)'}}>{row.university.replace('학교','')}</td>
                      <td style={{padding:'10px 14px',color:'var(--color-text-muted)'}}>{row.gender==='male'?'남':'여'}</td>
                      <td style={{padding:'10px 14px'}}><span style={{padding:'2px 8px',borderRadius:'var(--radius-full)',fontSize:11,fontWeight:700,background:vs.bg,color:vs.color}}>{vs.label}</span></td>
                      <td style={{padding:'10px 14px',fontSize:12,color:'var(--color-text-hint)'}}>{new Date(row.created_at).toLocaleDateString('ko-KR',{year:'2-digit',month:'short',day:'numeric'})}</td>
                      <td style={{padding:'10px 14px'}}>
                        <span style={{display:'inline-block',width:8,height:8,borderRadius:'50%',background:row.is_active?'#16A34A':'#DC2626'}}/>
                      </td>
                      <td style={{padding:'10px 14px'}}>
                        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                          <Link to={`/report?userId=${row.id}`} style={{padding:'5px 10px',background:'none',border:'1px solid var(--color-border)',borderRadius:'var(--radius-full)',fontSize:11,color:'var(--color-text-muted)',textDecoration:'none'}}>신고</Link>
                          {row.role!=='admin'&&(
                            <button onClick={()=>handleToggle(row)} disabled={togglingId===row.id} style={{padding:'5px 10px',background:row.is_active?'#FEF2F2':'#F0FDF4',border:`1px solid ${row.is_active?'#FCA5A5':'#A7F3D0'}`,borderRadius:'var(--radius-full)',fontSize:11,color:row.is_active?'#991B1B':'#065F46',cursor:'pointer',fontFamily:'var(--font-body)',display:'flex',alignItems:'center',justifyContent:'center',minWidth:48}}>
                              {togglingId===row.id?<span className="spinner" style={{width:12,height:12,borderWidth:2}}/>:row.is_active?'비활성':'활성화'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
