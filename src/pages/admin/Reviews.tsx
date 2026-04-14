// src/pages/admin/Reviews.tsx
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabaseClient'
import '../../styles/global.css'

type ReviewStatus = 'pending'|'approved'|'rejected'
const TABS: {key:ReviewStatus|'all';label:string}[] = [{key:'all',label:'전체'},{key:'pending',label:'대기중'},{key:'approved',label:'승인됨'},{key:'rejected',label:'반려됨'}]
const STATUS_META: Record<string,{bg:string;color:string;label:string}> = {
  pending: {bg:'#FEF3C7',color:'#92400E',label:'대기중'},
  approved:{bg:'#D1FAE5',color:'#065F46',label:'승인됨'},
  rejected:{bg:'#FEE2E2',color:'#991B1B',label:'반려됨'},
}

interface ReviewRow {
  id: string; content: string; rating: number; status: ReviewStatus; created_at: string
  match_id: string
  author: {nickname:string;username:string}
}

const STARS = ['','★','★★','★★★','★★★★','★★★★★']

export default function Reviews() {
  const { user: adminUser } = useAuth()
  const [rows, setRows] = useState<ReviewRow[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<ReviewStatus|'all'>('pending')
  const [selected, setSelected] = useState<ReviewRow|null>(null)
  const [processing, setProcessing] = useState(false)
  const [actionMsg, setActionMsg] = useState<{type:'ok'|'err';text:string}|null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    let q = supabase.from('reviews')
      .select('id, content, rating, status, created_at, match_id, author:users!reviews_author_id_fkey(nickname,username)')
      .order('created_at', {ascending:false}).limit(100)
    if(tab!=='all') q = q.eq('status', tab)
    const { data } = await q
    setRows((data??[]) as unknown as ReviewRow[])
    setLoading(false)
  }, [tab])

  useEffect(() => { load() }, [load])

  const updateStatus = async (id: string, status: ReviewStatus) => {
    setProcessing(true); setActionMsg(null)
    const { error } = await supabase.from('reviews').update({ status }).eq('id', id)
    setProcessing(false)
    if(error) { setActionMsg({type:'err',text:'처리에 실패했습니다.'}); return }
    setActionMsg({type:'ok',text:`후기를 ${STATUS_META[status].label}로 처리했습니다.`})
    setSelected(null); load()
  }

  const thS: React.CSSProperties = {padding:'10px 14px',textAlign:'left',fontSize:12,fontWeight:600,color:'var(--color-text-muted)',borderBottom:'1px solid var(--color-border)',background:'var(--color-bg)',whiteSpace:'nowrap'}

  return (
    <div style={{display:'flex',flexDirection:'column',gap:20}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:16}} className="fade-up fade-up-1">
        <div><h1 style={{fontFamily:'var(--font-display)',fontSize:24,fontWeight:400,color:'var(--color-text)',marginBottom:4}}>후기 관리</h1><p style={{fontSize:13,color:'var(--color-text-hint)'}}>작성된 후기를 검토하고 승인 또는 반려합니다.</p></div>
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
          :rows.length===0?<div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:200,padding:24,textAlign:'center'}}><span style={{fontSize:32,marginBottom:10}}>📝</span><p style={{fontSize:13,color:'var(--color-text-muted)'}}>후기가 없습니다.</p></div>
          :(
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                <thead><tr>{['작성자','별점','내용 미리보기','상태','날짜'].map(h=><th key={h} style={thS}>{h}</th>)}</tr></thead>
                <tbody>
                  {rows.map(row=>{
                    const sm = STATUS_META[row.status]
                    return (
                      <tr key={row.id} onClick={()=>{setSelected(row);setActionMsg(null)}} style={{borderBottom:'1px solid var(--color-border)',cursor:'pointer',background:selected?.id===row.id?'var(--color-primary-light)':'transparent'}}>
                        <td style={{padding:'10px 14px'}}><div style={{fontWeight:600,color:'var(--color-text)'}}>{row.author?.nickname??'-'}</div><div style={{fontSize:11,color:'var(--color-text-hint)'}}>@{row.author?.username??'-'}</div></td>
                        <td style={{padding:'10px 14px',color:'#F59E0B',fontWeight:700,fontSize:14}}>{STARS[row.rating]??'-'}</td>
                        <td style={{padding:'10px 14px',fontSize:12,color:'var(--color-text)',maxWidth:240}}><span style={{display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{row.content}</span></td>
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
            <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:200,padding:20,textAlign:'center'}}><span style={{fontSize:28,marginBottom:10}}>👈</span><p style={{fontSize:13,color:'var(--color-text-hint)'}}>후기를 클릭하면 전문을 확인합니다.</p></div>
          ):(
            <div style={{padding:'20px',display:'flex',flexDirection:'column',gap:14}} className="fade-up">
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <h2 style={{fontSize:15,fontWeight:600,color:'var(--color-text)'}}>후기 상세</h2>
                <button onClick={()=>{setSelected(null);setActionMsg(null)}} style={{background:'none',border:'none',fontSize:16,cursor:'pointer',color:'var(--color-text-muted)',fontFamily:'var(--font-body)'}}>✕</button>
              </div>
              <div style={{background:'var(--color-bg)',border:'1px solid var(--color-border)',borderRadius:'var(--radius-md)',padding:'12px 14px',display:'flex',flexDirection:'column',gap:8}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{fontSize:13,fontWeight:600,color:'var(--color-text)'}}>{selected.author?.nickname??'-'}</span>
                  <span style={{padding:'2px 8px',borderRadius:'var(--radius-full)',fontSize:11,fontWeight:700,background:STATUS_META[selected.status].bg,color:STATUS_META[selected.status].color}}>{STATUS_META[selected.status].label}</span>
                </div>
                <span style={{color:'#F59E0B',fontWeight:700,fontSize:18,letterSpacing:2}}>{STARS[selected.rating]}</span>
                <p style={{fontSize:11,color:'var(--color-text-hint)'}}>{new Date(selected.created_at).toLocaleString('ko-KR')}</p>
              </div>
              <div>
                <p style={{fontSize:12,fontWeight:600,color:'var(--color-text-muted)',marginBottom:6}}>후기 내용</p>
                <div style={{background:'var(--color-bg)',border:'1px solid var(--color-border)',borderRadius:'var(--radius-md)',padding:'12px 14px',fontSize:14,color:'var(--color-text)',lineHeight:1.7,minHeight:80,whiteSpace:'pre-wrap',wordBreak:'break-word'}}>{selected.content}</div>
              </div>
              {selected.status==='pending'&&(
                <div style={{display:'flex',gap:8}}>
                  <button style={{flex:1,padding:'10px 0',background:'#FEF2F2',border:'1.5px solid #FCA5A5',borderRadius:'var(--radius-md)',fontSize:13,fontWeight:600,color:'#991B1B',cursor:'pointer',fontFamily:'var(--font-body)',display:'flex',alignItems:'center',justifyContent:'center'}} onClick={()=>updateStatus(selected.id,'rejected')} disabled={processing}>
                    {processing?<span className="spinner" style={{width:14,height:14,borderWidth:2}}/>:'반려'}
                  </button>
                  <button className="btn-primary" style={{flex:2}} onClick={()=>updateStatus(selected.id,'approved')} disabled={processing}>
                    {processing?<span className="spinner" style={{margin:'0 auto',width:16,height:16,borderWidth:2}}/>:'✓ 승인'}
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
