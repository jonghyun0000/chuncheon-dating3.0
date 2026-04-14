// src/pages/admin/Reports.tsx
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabaseClient'
import '../../styles/global.css'

type ReportStatus = 'pending'|'reviewed'|'resolved'|'dismissed'
const TABS: {key:ReportStatus|'all';label:string}[] = [{key:'all',label:'전체'},{key:'pending',label:'대기중'},{key:'reviewed',label:'검토중'},{key:'resolved',label:'처리완료'},{key:'dismissed',label:'기각'}]
const STATUS_META: Record<string,{bg:string;color:string;label:string}> = {
  pending: {bg:'#FEF3C7',color:'#92400E',label:'대기중'},
  reviewed:{bg:'#EDE9FE',color:'#5B21B6',label:'검토중'},
  resolved:{bg:'#D1FAE5',color:'#065F46',label:'처리완료'},
  dismissed:{bg:'#F3F4F6',color:'#6B7280',label:'기각'},
}

interface ReportRow {
  id: string; reporter_id: string; reason: string; status: ReportStatus
  admin_note: string|null; created_at: string
  target_user: {id:string;nickname:string;username:string}|null
  target_team: {id:string;name:string}|null
  reporter: {nickname:string;username:string}
}

export default function Reports() {
  const { user: adminUser } = useAuth()
  const [rows, setRows] = useState<ReportRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string|null>(null)
  const [tab, setTab] = useState<ReportStatus|'all'>('pending')
  const [selected, setSelected] = useState<ReportRow|null>(null)
  const [adminNote, setAdminNote] = useState('')
  const [processing, setProcessing] = useState(false)
  const [actionMsg, setActionMsg] = useState<{type:'ok'|'err';text:string}|null>(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    let q = supabase.from('reports')
      .select('id, reporter_id, reason, status, admin_note, created_at, target_user:users!reports_target_user_id_fkey(id,nickname,username), target_team:teams!reports_target_team_id_fkey(id,name), reporter:users!reports_reporter_id_fkey(nickname,username)')
      .order('created_at', {ascending:false}).limit(100)
    if(tab!=='all') q = q.eq('status', tab)
    const { data, error } = await q
    if(error) { setError('신고 목록을 불러오지 못했습니다.'); setLoading(false); return }
    setRows((data??[]) as unknown as ReportRow[])
    setLoading(false)
  }, [tab])

  useEffect(() => { load() }, [load])

  const updateStatus = async (id: string, status: ReportStatus) => {
    if(!adminUser) return
    setProcessing(true); setActionMsg(null)
    const { error } = await supabase.from('reports').update({ status, admin_note: adminNote.trim()||null }).eq('id', id)
    setProcessing(false)
    if(error) { setActionMsg({type:'err',text:'처리에 실패했습니다.'}); return }
    setActionMsg({type:'ok',text:`신고를 ${STATUS_META[status].label}로 처리했습니다.`})
    setSelected(null); setAdminNote(''); load()
  }

  const thS: React.CSSProperties = {padding:'10px 14px',textAlign:'left',fontSize:12,fontWeight:600,color:'var(--color-text-muted)',borderBottom:'1px solid var(--color-border)',background:'var(--color-bg)',whiteSpace:'nowrap'}

  return (
    <div style={{display:'flex',flexDirection:'column',gap:20}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:16}} className="fade-up fade-up-1">
        <div><h1 style={{fontFamily:'var(--font-display)',fontSize:24,fontWeight:400,color:'var(--color-text)',marginBottom:4}}>신고 관리</h1><p style={{fontSize:13,color:'var(--color-text-hint)'}}>접수된 신고를 검토하고 처리합니다.</p></div>
        <button style={{padding:'8px 14px',background:'none',border:'1.5px solid var(--color-border)',borderRadius:'var(--radius-full)',fontSize:16,color:'var(--color-text-muted)',cursor:'pointer',fontFamily:'var(--font-body)'}} onClick={load} disabled={loading}>{loading?'...':'↻'}</button>
      </div>
      {actionMsg&&<div role={actionMsg.type==='ok'?'status':'alert'} style={{border:'1px solid',borderRadius:'var(--radius-md)',padding:'10px 14px',fontSize:13,fontWeight:500,background:actionMsg.type==='ok'?'#F0FDF4':'var(--color-primary-light)',borderColor:actionMsg.type==='ok'?'#A7F3D0':'#F4A3AC',color:actionMsg.type==='ok'?'#065F46':'#C0394B'}} className="fade-up">{actionMsg.type==='ok'?'✓':'!'} {actionMsg.text}</div>}
      <div style={{display:'flex',flexWrap:'wrap',gap:8}} role="tablist" className="fade-up fade-up-2">
        {TABS.map(t=>(
          <button key={t.key} role="tab" aria-selected={tab===t.key} onClick={()=>{setTab(t.key);setSelected(null)}}
            style={{padding:'7px 14px',border:'1.5px solid',borderRadius:'var(--radius-full)',fontSize:13,fontWeight:500,cursor:'pointer',fontFamily:'var(--font-body)',transition:'all 0.15s',background:tab===t.key?'var(--color-primary)':'var(--color-surface)',color:tab===t.key?'#fff':'var(--color-text-muted)',borderColor:tab===t.key?'var(--color-primary)':'var(--color-border)'}}>
            {t.label}
          </button>
        ))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 300px',gap:16,alignItems:'start'}}>
        <div style={{background:'var(--color-surface)',border:'1px solid var(--color-border)',borderRadius:'var(--radius-lg)',overflow:'hidden',minHeight:300}} className="fade-up fade-up-3">
          {loading?<div style={{display:'flex',justifyContent:'center',alignItems:'center',minHeight:200}}><div className="spinner"/></div>
          :rows.length===0?<div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:200,padding:24,textAlign:'center'}}><span style={{fontSize:32,marginBottom:10}}>🚨</span><p style={{fontSize:13,color:'var(--color-text-muted)'}}>신고가 없습니다.</p></div>
          :(
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                <thead><tr>{['신고 대상','신고자','사유','상태','날짜'].map(h=><th key={h} style={thS}>{h}</th>)}</tr></thead>
                <tbody>
                  {rows.map(row=>{
                    const sm = STATUS_META[row.status]
                    return (
                      <tr key={row.id} onClick={()=>{setSelected(row);setAdminNote(row.admin_note??'');setActionMsg(null)}} style={{borderBottom:'1px solid var(--color-border)',cursor:'pointer',background:selected?.id===row.id?'var(--color-primary-light)':'transparent'}}>
                        <td style={{padding:'10px 14px'}}>
                          {row.target_user?<div><div style={{fontWeight:600,color:'var(--color-text)'}}>{row.target_user.nickname}</div><div style={{fontSize:11,color:'var(--color-text-hint)'}}>회원</div></div>
                          :row.target_team?<div><div style={{fontWeight:600,color:'var(--color-text)'}}>{row.target_team.name}</div><div style={{fontSize:11,color:'var(--color-text-hint)'}}>팀</div></div>
                          :<span style={{color:'var(--color-text-hint)',fontSize:12}}>삭제됨</span>}
                        </td>
                        <td style={{padding:'10px 14px',fontSize:12,color:'var(--color-text-muted)'}}>{row.reporter?.nickname??'-'}</td>
                        <td style={{padding:'10px 14px',fontSize:12,color:'var(--color-text)',maxWidth:200}}><span style={{display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{row.reason}</span></td>
                        <td style={{padding:'10px 14px'}}><span style={{padding:'2px 8px',borderRadius:'var(--radius-full)',fontSize:11,fontWeight:700,background:sm.bg,color:sm.color}}>{sm.label}</span></td>
                        <td style={{padding:'10px 14px',fontSize:11,color:'var(--color-text-hint)'}}>{new Date(row.created_at).toLocaleDateString('ko-KR',{month:'short',day:'numeric'})}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div style={{background:'var(--color-surface)',border:'1px solid var(--color-border)',borderRadius:'var(--radius-lg)',minHeight:300,position:'sticky',top:20}}>
          {!selected?(
            <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:200,padding:20,textAlign:'center'}}><span style={{fontSize:28,marginBottom:10}}>👈</span><p style={{fontSize:13,color:'var(--color-text-hint)'}}>항목을 클릭하면 상세 내용을 확인합니다.</p></div>
          ):(
            <div style={{padding:'20px',display:'flex',flexDirection:'column',gap:14}} className="fade-up">
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <h2 style={{fontSize:15,fontWeight:600,color:'var(--color-text)'}}>신고 상세</h2>
                <button onClick={()=>{setSelected(null);setActionMsg(null)}} style={{background:'none',border:'none',fontSize:16,cursor:'pointer',color:'var(--color-text-muted)',fontFamily:'var(--font-body)'}}>✕</button>
              </div>
              <div style={{background:'var(--color-bg)',border:'1px solid var(--color-border)',borderRadius:'var(--radius-md)',padding:'12px 14px',display:'flex',flexDirection:'column',gap:8}}>
                <div style={{display:'flex',justifyContent:'space-between'}}>
                  <span style={{fontSize:12,color:'var(--color-text-muted)'}}>신고 대상</span>
                  <span style={{fontSize:13,fontWeight:600,color:'var(--color-text)'}}>{selected.target_user?.nickname??selected.target_team?.name??'삭제됨'} ({selected.target_user?'회원':'팀'})</span>
                </div>
                <div style={{display:'flex',justifyContent:'space-between'}}>
                  <span style={{fontSize:12,color:'var(--color-text-muted)'}}>신고자</span>
                  <span style={{fontSize:13,color:'var(--color-text)'}}>{selected.reporter?.nickname??'-'}</span>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{fontSize:12,color:'var(--color-text-muted)'}}>상태</span>
                  <span style={{padding:'2px 8px',borderRadius:'var(--radius-full)',fontSize:11,fontWeight:700,background:STATUS_META[selected.status].bg,color:STATUS_META[selected.status].color}}>{STATUS_META[selected.status].label}</span>
                </div>
              </div>
              <div>
                <p style={{fontSize:12,fontWeight:600,color:'var(--color-text-muted)',marginBottom:6}}>신고 사유</p>
                <p style={{fontSize:13,color:'var(--color-text)',lineHeight:1.65,background:'var(--color-bg)',border:'1px solid var(--color-border)',borderRadius:'var(--radius-md)',padding:'10px 12px'}}>{selected.reason}</p>
              </div>
              <div className="field">
                <label htmlFor="admin-note" className="field-label">처리 메모 <span style={{fontSize:10,color:'var(--color-text-hint)'}}>(선택)</span></label>
                <textarea id="admin-note" className="input" placeholder="처리 내용, 조치 사항 등을 기록하세요" value={adminNote} onChange={e=>setAdminNote(e.target.value)} rows={3} maxLength={500} style={{resize:'none',fontSize:13,lineHeight:1.6}}/>
              </div>
              {selected.status==='pending'&&(
                <div style={{display:'flex',gap:8}}>
                  <button style={{flex:1,padding:'10px 0',background:'#F3F4F6',border:'1.5px solid var(--color-border)',borderRadius:'var(--radius-md)',fontSize:13,fontWeight:600,color:'#6B7280',cursor:'pointer',fontFamily:'var(--font-body)',display:'flex',alignItems:'center',justifyContent:'center'}} onClick={()=>updateStatus(selected.id,'dismissed')} disabled={processing}>
                    {processing?<span className="spinner" style={{width:14,height:14,borderWidth:2}}/>:'기각'}
                  </button>
                  <button className="btn-primary" style={{flex:2}} onClick={()=>updateStatus(selected.id,'resolved')} disabled={processing}>
                    {processing?<span className="spinner" style={{margin:'0 auto',width:16,height:16,borderWidth:2}}/>:'처리 완료'}
                  </button>
                </div>
              )}
              {actionMsg&&<p role={actionMsg.type==='ok'?'status':'alert'} style={{fontSize:12,color:actionMsg.type==='ok'?'var(--color-success)':'var(--color-error)'}}>{actionMsg.text}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
