// src/pages/admin/Payments.tsx
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabaseClient'
import '../../styles/global.css'

const STATUS_META: Record<string,{bg:string;color:string;label:string}> = {
  pending:  {bg:'#FEF3C7',color:'#92400E',label:'대기중'},
  completed:{bg:'#D1FAE5',color:'#065F46',label:'완료'},
  failed:   {bg:'#FEE2E2',color:'#991B1B',label:'실패'},
  refunded: {bg:'#EDE9FE',color:'#5B21B6',label:'환불'},
}

interface PaymentRow {
  id: string; amount: number; status: string; paid_at: string|null; created_at: string
  user: {nickname:string;username:string}
  plan: {name:string;ticket_count:number}
}

export default function Payments() {
  const { user: adminUser } = useAuth()
  const [rows, setRows] = useState<PaymentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'all'|'pending'|'completed'>('pending')
  const [processing, setProcessing] = useState<string|null>(null)
  const [actionMsg, setActionMsg] = useState<{type:'ok'|'err';text:string}|null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    let q = supabase.from('payments')
      .select('id, amount, status, paid_at, created_at, user:users!payments_user_id_fkey(nickname,username), plan:pricing_plans!payments_plan_id_fkey(name,ticket_count)')
      .order('created_at', {ascending:false}).limit(100)
    if(tab!=='all') q = q.eq('status', tab)
    const { data } = await q
    setRows((data??[]) as unknown as PaymentRow[])
    setLoading(false)
  }, [tab])

  useEffect(() => { load() }, [load])

  const confirmPayment = async (id: string) => {
    if(!adminUser) return
    setProcessing(id); setActionMsg(null)
    const { error } = await supabase.from('payments').update({ status:'completed', paid_at:new Date().toISOString() }).eq('id', id).eq('status','pending')
    setProcessing(null)
    if(error) { setActionMsg({type:'err',text:'처리에 실패했습니다.'}); return }
    setActionMsg({type:'ok',text:'입금을 확인 처리했습니다.'})
    load()
  }

  const thS: React.CSSProperties = {padding:'10px 14px',textAlign:'left',fontSize:12,fontWeight:600,color:'var(--color-text-muted)',borderBottom:'1px solid var(--color-border)',background:'var(--color-bg)',whiteSpace:'nowrap'}

  return (
    <div style={{display:'flex',flexDirection:'column',gap:20}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:16}} className="fade-up fade-up-1">
        <div><h1 style={{fontFamily:'var(--font-display)',fontSize:24,fontWeight:400,color:'var(--color-text)',marginBottom:4}}>입금 관리</h1><p style={{fontSize:13,color:'var(--color-text-hint)'}}>이용권 결제 내역을 확인하고 입금을 수동으로 승인합니다.</p></div>
        <button style={{padding:'8px 14px',background:'none',border:'1.5px solid var(--color-border)',borderRadius:'var(--radius-full)',fontSize:16,color:'var(--color-text-muted)',cursor:'pointer',fontFamily:'var(--font-body)'}} onClick={load} disabled={loading}>{loading?'...':'↻'}</button>
      </div>
      {actionMsg&&<div role={actionMsg.type==='ok'?'status':'alert'} style={{border:'1px solid',borderRadius:'var(--radius-md)',padding:'10px 14px',fontSize:13,fontWeight:500,background:actionMsg.type==='ok'?'#F0FDF4':'var(--color-primary-light)',borderColor:actionMsg.type==='ok'?'#A7F3D0':'#F4A3AC',color:actionMsg.type==='ok'?'#065F46':'#C0394B'}} className="fade-up">{actionMsg.type==='ok'?'✓':'!'} {actionMsg.text}</div>}
      <div style={{background:'#FFFBEB',border:'1px solid #FDE68A',borderRadius:'var(--radius-md)',padding:'12px 16px'}} className="fade-up fade-up-2">
        <p style={{fontSize:13,color:'#92400E',lineHeight:1.6}}>💡 현재는 수동 입금 확인 방식입니다. 결제 요청 후 계좌 이체를 확인하면 아래 '입금 확인' 버튼을 클릭하세요.</p>
      </div>
      <div style={{display:'flex',flexWrap:'wrap',gap:8}} className="fade-up fade-up-3">
        {(['all','pending','completed'] as const).map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{padding:'7px 14px',border:'1.5px solid',borderRadius:'var(--radius-full)',fontSize:13,fontWeight:500,cursor:'pointer',fontFamily:'var(--font-body)',transition:'all 0.15s',background:tab===t?'var(--color-primary)':'var(--color-surface)',color:tab===t?'#fff':'var(--color-text-muted)',borderColor:tab===t?'var(--color-primary)':'var(--color-border)'}}>
            {t==='all'?'전체':t==='pending'?'대기중':'완료'}
          </button>
        ))}
      </div>
      <div style={{background:'var(--color-surface)',border:'1px solid var(--color-border)',borderRadius:'var(--radius-lg)',overflow:'hidden'}} className="fade-up fade-up-4">
        {loading?<div style={{display:'flex',justifyContent:'center',alignItems:'center',minHeight:200}}><div className="spinner"/></div>
        :rows.length===0?<div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:200,padding:24,textAlign:'center'}}><span style={{fontSize:32,marginBottom:10}}>💳</span><p style={{fontSize:13,color:'var(--color-text-muted)'}}>결제 내역이 없습니다.</p></div>
        :(
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
              <thead><tr>{['회원','상품명','금액','상태','신청일','확인일','액션'].map(h=><th key={h} style={thS}>{h}</th>)}</tr></thead>
              <tbody>
                {rows.map(row=>{
                  const sm = STATUS_META[row.status]??STATUS_META.pending
                  return (
                    <tr key={row.id} style={{borderBottom:'1px solid var(--color-border)'}}>
                      <td style={{padding:'10px 14px'}}><div style={{fontWeight:600,color:'var(--color-text)'}}>{row.user?.nickname??'-'}</div><div style={{fontSize:11,color:'var(--color-text-hint)'}}>@{row.user?.username??'-'}</div></td>
                      <td style={{padding:'10px 14px',fontSize:12,color:'var(--color-text)'}}>{row.plan?.name??'-'}<div style={{fontSize:11,color:'var(--color-text-hint)',marginTop:2}}>이용권 {row.plan?.ticket_count??0}개</div></td>
                      <td style={{padding:'10px 14px',fontWeight:700,color:'var(--color-text)'}}>{row.amount.toLocaleString()}원</td>
                      <td style={{padding:'10px 14px'}}><span style={{padding:'2px 8px',borderRadius:'var(--radius-full)',fontSize:11,fontWeight:700,background:sm.bg,color:sm.color}}>{sm.label}</span></td>
                      <td style={{padding:'10px 14px',fontSize:12,color:'var(--color-text-muted)'}}>{new Date(row.created_at).toLocaleDateString('ko-KR',{month:'short',day:'numeric'})}</td>
                      <td style={{padding:'10px 14px',fontSize:12,color:'var(--color-text-muted)'}}>{row.paid_at?new Date(row.paid_at).toLocaleDateString('ko-KR',{month:'short',day:'numeric'}):'-'}</td>
                      <td style={{padding:'10px 14px'}}>
                        {row.status==='pending'&&(
                          <button onClick={()=>confirmPayment(row.id)} disabled={processing===row.id} style={{padding:'6px 14px',background:'var(--color-primary)',border:'none',borderRadius:'var(--radius-full)',fontSize:12,fontWeight:600,color:'#fff',cursor:'pointer',fontFamily:'var(--font-body)',display:'flex',alignItems:'center',justifyContent:'center',minWidth:64}}>
                            {processing===row.id?<span className="spinner" style={{width:12,height:12,borderWidth:2}}/>:'입금 확인'}
                          </button>
                        )}
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
