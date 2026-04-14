// src/pages/admin/Verifications.tsx
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { fetchVerifications, approveVerification, rejectVerification, getVerifImageUrl } from '../../services/adminService'
import { supabase } from '../../lib/supabaseClient'
import type { VerifRow } from '../../services/adminService'
import '../../styles/global.css'

type FilterStatus = 'all'|'pending'|'verified'|'rejected'
const FILTERS: {key:FilterStatus;label:string}[] = [{key:'all',label:'전체'},{key:'pending',label:'대기중'},{key:'verified',label:'승인됨'},{key:'rejected',label:'반려됨'}]
const VERIF_STYLE: Record<string,{bg:string;color:string;label:string}> = {
  pending: {bg:'#FEF3C7',color:'#92400E',label:'대기중'},
  verified:{bg:'#D1FAE5',color:'#065F46',label:'승인됨'},
  rejected:{bg:'#FEE2E2',color:'#991B1B',label:'반려됨'},
  none:    {bg:'#F3F4F6',color:'#6B7280',label:'미제출'},
}

function StatusBadge({status,size='sm'}:{status:string;size?:'sm'|'lg'}) {
  const s = VERIF_STYLE[status]??VERIF_STYLE.none
  return <span style={{padding:size==='lg'?'4px 12px':'2px 8px',borderRadius:'var(--radius-full)',fontSize:size==='lg'?13:11,fontWeight:700,background:s.bg,color:s.color,whiteSpace:'nowrap'}}>{s.label}</span>
}

const cStyle: React.CSSProperties = {display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',minHeight:200,textAlign:'center',padding:20}

export default function Verifications() {
  const { user: adminUser } = useAuth()
  const [rows, setRows] = useState<VerifRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string|null>(null)
  const [filter, setFilter] = useState<FilterStatus>('pending')
  const [selected, setSelected] = useState<VerifRow|null>(null)
  const [imageUrl, setImageUrl] = useState<string|null>(null)
  const [imageLoad, setImageLoad] = useState(false)
  const [imageError, setImageError] = useState<string|null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [showReject, setShowReject] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [actionMsg, setActionMsg] = useState<{type:'ok'|'err';text:string}|null>(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    const { data, error } = await fetchVerifications(filter==='all'?undefined:filter)
    setRows(data); if(error) setError(error); setLoading(false)
  }, [filter])

  useEffect(() => { load() }, [load])

  const handleSelect = async (row: VerifRow) => {
    setSelected(row); setImageUrl(null); setImageError(null); setShowReject(false); setRejectReason(''); setActionMsg(null)
    setImageLoad(true)
    const { data: verifData } = await supabase.from('student_verifications').select('image_path').eq('user_id',row.user_id).maybeSingle()
    if(!verifData?.image_path) { setImageError('이미지 경로를 찾을 수 없습니다.'); setImageLoad(false); return }
    const { url, error } = await getVerifImageUrl(verifData.image_path)
    setImageLoad(false)
    if(error) { setImageError(error); return }
    setImageUrl(url)
  }

  const handleApprove = async () => {
    if(!selected||!adminUser) return
    setProcessing(true); setActionMsg(null)
    const { error } = await approveVerification(selected.id, selected.user_id, adminUser.id)
    setProcessing(false)
    if(error) { setActionMsg({type:'err',text:error}); return }
    setActionMsg({type:'ok',text:`${selected.user.nickname} 님 인증을 승인했습니다.`})
    setSelected(null); load()
  }

  const handleReject = async () => {
    if(!selected||!adminUser||!rejectReason.trim()) { setActionMsg({type:'err',text:'반려 사유를 입력해주세요.'}); return }
    setProcessing(true); setActionMsg(null)
    const { error } = await rejectVerification(selected.id, selected.user_id, adminUser.id, rejectReason)
    setProcessing(false)
    if(error) { setActionMsg({type:'err',text:error}); return }
    setActionMsg({type:'ok',text:`${selected.user.nickname} 님 인증을 반려했습니다.`})
    setSelected(null); setShowReject(false); setRejectReason(''); load()
  }

  return (
    <div style={{display:'flex',flexDirection:'column',gap:20}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:16}} className="fade-up fade-up-1">
        <div><h1 style={{fontFamily:'var(--font-display)',fontSize:24,fontWeight:400,color:'var(--color-text)',marginBottom:4}}>인증 관리</h1><p style={{fontSize:13,color:'var(--color-text-hint)'}}>학생증 제출 현황을 검토하고 승인 또는 반려합니다.</p></div>
        <button style={{padding:'8px 14px',background:'none',border:'1.5px solid var(--color-border)',borderRadius:'var(--radius-full)',fontSize:16,color:'var(--color-text-muted)',cursor:'pointer',fontFamily:'var(--font-body)'}} onClick={load} disabled={loading}>{loading?'...':'↻'}</button>
      </div>
      {actionMsg&&<div role={actionMsg.type==='ok'?'status':'alert'} style={{border:'1px solid',borderRadius:'var(--radius-md)',padding:'10px 14px',fontSize:13,fontWeight:500,background:actionMsg.type==='ok'?'#F0FDF4':'var(--color-primary-light)',borderColor:actionMsg.type==='ok'?'#A7F3D0':'#F4A3AC',color:actionMsg.type==='ok'?'#065F46':'#C0394B'}} className="fade-up">{actionMsg.type==='ok'?'✓':'!'} {actionMsg.text}</div>}
      <div style={{display:'flex',flexWrap:'wrap',gap:8}} role="tablist" className="fade-up fade-up-2">
        {FILTERS.map(f=>(
          <button key={f.key} role="tab" aria-selected={filter===f.key} onClick={()=>{setFilter(f.key);setSelected(null);setActionMsg(null)}}
            style={{display:'flex',alignItems:'center',gap:6,padding:'7px 14px',border:'1.5px solid',borderRadius:'var(--radius-full)',fontSize:13,fontWeight:500,cursor:'pointer',fontFamily:'var(--font-body)',transition:'all 0.15s',background:filter===f.key?'var(--color-primary)':'var(--color-surface)',color:filter===f.key?'#fff':'var(--color-text-muted)',borderColor:filter===f.key?'var(--color-primary)':'var(--color-border)'}}>
            {f.label}
            <span style={{padding:'1px 7px',borderRadius:'var(--radius-full)',fontSize:11,fontWeight:700,background:filter===f.key?'rgba(255,255,255,0.25)':'var(--color-bg)',color:filter===f.key?'#fff':'var(--color-text-muted)'}}>
              {f.key==='all'?rows.length:rows.filter(r=>r.status===f.key).length}
            </span>
          </button>
        ))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 340px',gap:16,alignItems:'start'}}>
        <div style={{background:'var(--color-surface)',border:'1px solid var(--color-border)',borderRadius:'var(--radius-lg)',overflow:'hidden',minHeight:400}}>
          {loading?<div style={cStyle}><div className="spinner"/></div>:!error&&rows.length===0?<div style={cStyle}><span style={{fontSize:32,marginBottom:10}}>📭</span><p style={{fontSize:14,color:'var(--color-text-muted)'}}>{filter==='pending'?'대기중인 인증 요청이 없습니다.':'해당 항목이 없습니다.'}</p></div>:(
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                <thead><tr>{['닉네임','학교','학번','성별','상태','신청일'].map(h=><th key={h} style={{padding:'10px 14px',textAlign:'left',fontSize:12,fontWeight:600,color:'var(--color-text-muted)',borderBottom:'1px solid var(--color-border)',background:'var(--color-bg)',whiteSpace:'nowrap'}}>{h}</th>)}</tr></thead>
                <tbody>
                  {rows.map(row=>(
                    <tr key={row.id} onClick={()=>handleSelect(row)} style={{borderBottom:'1px solid var(--color-border)',cursor:'pointer',background:selected?.id===row.id?'var(--color-primary-light)':'transparent'}}>
                      <td style={{padding:'10px 14px'}}><div style={{fontWeight:600,color:'var(--color-text)'}}>{row.user.nickname}</div><div style={{fontSize:11,color:'var(--color-text-hint)'}}>@{row.user.username}</div></td>
                      <td style={{padding:'10px 14px',fontSize:12,color:'var(--color-text-muted)'}}>{row.user.university.replace('학교','')}</td>
                      <td style={{padding:'10px 14px',fontFamily:'monospace',fontSize:13,color:'var(--color-text-muted)'}}>{row.user.student_id}</td>
                      <td style={{padding:'10px 14px',color:'var(--color-text-muted)'}}>{row.user.gender==='male'?'남':'여'}</td>
                      <td style={{padding:'10px 14px'}}><StatusBadge status={row.status}/></td>
                      <td style={{padding:'10px 14px',fontSize:11,color:'var(--color-text-hint)'}}>{new Date(row.created_at).toLocaleDateString('ko-KR',{month:'short',day:'numeric'})}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div style={{background:'var(--color-surface)',border:'1px solid var(--color-border)',borderRadius:'var(--radius-lg)',minHeight:400,position:'sticky',top:20}}>
          {!selected?(
            <div style={cStyle}><span style={{fontSize:32,marginBottom:10}}>👈</span><p style={{fontSize:13,color:'var(--color-text-hint)',textAlign:'center'}}>목록에서 항목을 클릭하면<br/>상세 내용을 확인할 수 있습니다.</p></div>
          ):(
            <div style={{padding:'20px',display:'flex',flexDirection:'column',gap:16}} className="fade-up">
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <h2 style={{fontSize:16,fontWeight:600,color:'var(--color-text)'}}>인증 상세</h2>
                <button style={{background:'none',border:'none',fontSize:16,cursor:'pointer',color:'var(--color-text-muted)',padding:4,fontFamily:'var(--font-body)'}} onClick={()=>{setSelected(null);setShowReject(false);setActionMsg(null)}} aria-label="닫기">✕</button>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:12,background:'var(--color-bg)',border:'1px solid var(--color-border)',borderRadius:'var(--radius-md)',padding:'14px'}}>
                <div style={{width:44,height:44,borderRadius:'50%',background:'var(--color-primary-light)',color:'var(--color-primary)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,fontWeight:700,flexShrink:0}}>{selected.user.nickname.charAt(0)}</div>
                <div>
                  <p style={{fontSize:16,fontWeight:700,color:'var(--color-text)'}}>{selected.user.nickname}</p>
                  <p style={{fontSize:12,color:'var(--color-text-muted)',marginTop:3}}>@{selected.user.username} · {selected.user.university}</p>
                  <p style={{fontSize:12,color:'var(--color-text-muted)',marginTop:2}}>학번 {selected.user.student_id} · {selected.user.gender==='male'?'남':'여'}</p>
                </div>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 14px',background:'var(--color-bg)',border:'1px solid var(--color-border)',borderRadius:'var(--radius-md)'}}>
                <span style={{fontSize:13,color:'var(--color-text-muted)'}}>현재 상태</span>
                <StatusBadge status={selected.status} size="lg"/>
              </div>
              {selected.status==='rejected'&&selected.reject_reason&&(
                <div style={{background:'#FEF2F2',border:'1px solid #FCA5A5',borderRadius:'var(--radius-md)',padding:'10px 14px'}}>
                  <p style={{fontSize:12,fontWeight:600,color:'#991B1B',marginBottom:4}}>이전 반려 사유</p>
                  <p style={{fontSize:13,color:'#991B1B'}}>{selected.reject_reason}</p>
                </div>
              )}
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                <p style={{fontSize:13,fontWeight:600,color:'var(--color-text-muted)'}}>학생증 이미지</p>
                <div style={{border:'1px solid var(--color-border)',borderRadius:'var(--radius-md)',overflow:'hidden',background:'var(--color-bg)',minHeight:160,display:'flex',alignItems:'center',justifyContent:'center'}}>
                  {imageLoad?<div style={{...cStyle,minHeight:120}}><div className="spinner"/><p style={{fontSize:12,color:'var(--color-text-hint)',marginTop:8}}>보안 URL 생성 중...</p></div>:imageError?<div style={{...cStyle,padding:20}}><span style={{fontSize:28}}>🔒</span><p style={{fontSize:12,color:'var(--color-text-muted)',marginTop:8,textAlign:'center'}}>{imageError}</p></div>:imageUrl?<img src={imageUrl} alt={`${selected.user.nickname} 학생증`} style={{width:'100%',maxHeight:280,objectFit:'contain',display:'block'}}/>:null}
                </div>
                <p style={{fontSize:11,color:'var(--color-text-hint)',textAlign:'center'}}>이미지 URL은 3분 후 만료됩니다.</p>
              </div>
              {selected.status==='pending'&&(
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  {!showReject?(
                    <div style={{display:'flex',gap:10}}>
                      <button style={{flex:1,padding:'11px 0',background:'none',border:'1.5px solid var(--color-border)',borderRadius:'var(--radius-md)',fontSize:14,cursor:'pointer',fontFamily:'var(--font-body)',color:'var(--color-text-muted)',display:'flex',alignItems:'center',justifyContent:'center'}} onClick={()=>setShowReject(true)} disabled={processing}>반려</button>
                      <button className="btn-primary" style={{flex:2}} onClick={handleApprove} disabled={processing}>
                        {processing?<span className="spinner" style={{margin:'0 auto',width:18,height:18,borderWidth:2}}/>:'✓ 승인'}
                      </button>
                    </div>
                  ):(
                    <div style={{display:'flex',flexDirection:'column',gap:10}}>
                      <div className="field">
                        <label htmlFor="reject-reason" className="field-label">반려 사유 <span style={{color:'var(--color-primary)'}}>*</span></label>
                        <textarea id="reject-reason" className="input" placeholder="사용자에게 표시될 반려 사유를 입력하세요" value={rejectReason} onChange={e=>setRejectReason(e.target.value)} rows={3} maxLength={300} style={{resize:'none',fontSize:13}} autoFocus/>
                        <span style={{fontSize:11,color:rejectReason.length>270?'var(--color-error)':'var(--color-text-hint)',textAlign:'right'}}>{rejectReason.length}/300</span>
                      </div>
                      <div style={{display:'flex',gap:8}}>
                        <button style={{flex:1,padding:'11px 0',background:'none',border:'1.5px solid var(--color-border)',borderRadius:'var(--radius-md)',fontSize:14,cursor:'pointer',fontFamily:'var(--font-body)',color:'var(--color-text-muted)',display:'flex',alignItems:'center',justifyContent:'center'}} onClick={()=>{setShowReject(false);setRejectReason('')}} disabled={processing}>취소</button>
                        <button style={{flex:2,padding:'11px 0',background:'#EF4444',border:'none',borderRadius:'var(--radius-md)',fontSize:14,fontWeight:600,color:'#fff',cursor:'pointer',fontFamily:'var(--font-body)',display:'flex',alignItems:'center',justifyContent:'center'}} onClick={handleReject} disabled={processing||!rejectReason.trim()}>
                          {processing?<span className="spinner" style={{width:16,height:16,borderWidth:2}}/>:'반려 처리'}
                        </button>
                      </div>
                    </div>
                  )}
                  {actionMsg&&<p role={actionMsg.type==='ok'?'status':'alert'} style={{fontSize:12,color:actionMsg.type==='ok'?'var(--color-success)':'var(--color-error)',marginTop:4}}>{actionMsg.text}</p>}
                </div>
              )}
              {selected.status!=='pending'&&(
                <div style={{background:'var(--color-bg)',border:'1px solid var(--color-border)',borderRadius:'var(--radius-md)',padding:'12px 14px'}}>
                  <p style={{fontSize:13,color:'var(--color-text-muted)'}}>{selected.status==='verified'?'이미 승인된 인증입니다.':'이미 반려된 인증입니다. 사용자가 재제출하면 다시 검토할 수 있습니다.'}</p>
                  {selected.reviewed_at&&<p style={{fontSize:11,color:'var(--color-text-hint)',marginTop:4}}>처리일: {new Date(selected.reviewed_at).toLocaleString('ko-KR')}</p>}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
