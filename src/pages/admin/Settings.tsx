// src/pages/admin/Settings.tsx
import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabaseClient'
import { togglePaymentMode } from '../../services/adminService'
import '../../styles/global.css'

export default function Settings() {
  const { user: adminUser } = useAuth()
  const [settings, setSettings] = useState({ payment_mode:'free', service_notice:'' })
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState('')
  const [noticeSaving, setNoticeSaving] = useState(false)
  const [noticeMsg, setNoticeMsg] = useState<{type:'ok'|'err';text:string}|null>(null)
  const [modeToggling, setModeToggling] = useState(false)
  const [modeMsg, setModeMsg] = useState<{type:'ok'|'err';text:string}|null>(null)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('site_settings').select('key,value')
      if(!data) { setLoading(false); return }
      const map = Object.fromEntries(data.map(r=>[r.key,r.value]))
      setSettings({ payment_mode:map.payment_mode??'free', service_notice:map.service_notice??'' })
      setNotice(map.service_notice??'')
      setLoading(false)
    }
    load()
  }, [])

  const handleSaveNotice = async () => {
    if(!adminUser) return
    setNoticeSaving(true); setNoticeMsg(null)
    const { error } = await supabase.from('site_settings').update({ value:notice.trim(), updated_at:new Date().toISOString(), updated_by:adminUser.id }).eq('key','service_notice')
    setNoticeSaving(false)
    if(error) { setNoticeMsg({type:'err',text:'저장에 실패했습니다.'}); return }
    setSettings(prev=>({...prev,service_notice:notice.trim()}))
    setNoticeMsg({type:'ok',text:'공지가 저장되었습니다.'})
    setTimeout(()=>setNoticeMsg(null),3000)
  }

  const handleToggleMode = async () => {
    if(!adminUser) return
    const next = settings.payment_mode==='free'?'paid':'free'
    if(!window.confirm(`${next==='paid'?'유료':'무료'} 모드로 전환할까요?`)) return
    setModeToggling(true); setModeMsg(null)
    const { error } = await togglePaymentMode(next, adminUser.id)
    setModeToggling(false)
    if(error) { setModeMsg({type:'err',text:error}); return }
    setSettings(prev=>({...prev,payment_mode:next}))
    setModeMsg({type:'ok',text:`${next==='paid'?'유료':'무료'} 모드로 전환되었습니다.`})
    setTimeout(()=>setModeMsg(null),3000)
  }

  if(loading) return <div style={{display:'flex',justifyContent:'center',alignItems:'center',minHeight:300}}><div className="spinner"/></div>
  const isPaid = settings.payment_mode==='paid'

  const cardStyle: React.CSSProperties = {background:'var(--color-surface)',border:'1px solid var(--color-border)',borderRadius:'var(--radius-lg)',padding:'24px',display:'flex',flexDirection:'column',gap:16,boxShadow:'var(--shadow-sm)'}

  return (
    <div style={{display:'flex',flexDirection:'column',gap:24}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}} className="fade-up fade-up-1">
        <div>
          <h1 style={{fontFamily:'var(--font-display)',fontSize:24,fontWeight:400,color:'var(--color-text)',marginBottom:4}}>설정</h1>
          <p style={{fontSize:13,color:'var(--color-text-hint)'}}>서비스 전반 설정을 관리합니다.</p>
        </div>
      </div>

      <div style={{display:'flex',flexDirection:'column',gap:16,maxWidth:640}}>
        {/* 결제 모드 */}
        <section style={cardStyle} className="fade-up fade-up-2">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:16}}>
            <div>
              <h2 style={{fontSize:16,fontWeight:600,color:'var(--color-text)',marginBottom:6}}>결제 모드</h2>
              <p style={{fontSize:13,color:'var(--color-text-muted)',lineHeight:1.6}}>유료 전환 시 과팅 신청에 이용권이 필요합니다.</p>
            </div>
            <div style={{width:12,height:12,borderRadius:'50%',flexShrink:0,marginTop:4,transition:'background 0.3s',background:isPaid?'#16A34A':'var(--color-text-hint)'}}/>
          </div>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:16,border:'1px solid',borderRadius:'var(--radius-md)',padding:'16px',transition:'all 0.3s',background:isPaid?'#F0FDF4':'var(--color-bg)',borderColor:isPaid?'#A7F3D0':'var(--color-border)'}}>
            <div>
              <p style={{fontSize:15,fontWeight:700,color:isPaid?'#065F46':'var(--color-text-muted)'}}>현재: {isPaid?'유료 모드':'무료 모드'}</p>
              <p style={{fontSize:12,color:'var(--color-text-muted)',marginTop:4}}>{isPaid?'과팅 신청 시 이용권이 차감됩니다.':'결제 없이 누구나 과팅을 신청할 수 있습니다.'}</p>
            </div>
            <button onClick={handleToggleMode} disabled={modeToggling} style={{flexShrink:0,padding:'10px 18px',borderRadius:'var(--radius-full)',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'var(--font-body)',display:'flex',alignItems:'center',gap:6,transition:'opacity 0.15s',whiteSpace:'nowrap',background:isPaid?'#F3F4F6':'var(--color-primary)',color:isPaid?'var(--color-text-muted)':'#fff',border:isPaid?'1.5px solid var(--color-border)':'none'}}>
              {modeToggling?<span className="spinner" style={{width:16,height:16,borderWidth:2}}/>:isPaid?'무료로 전환':'유료로 전환'}
            </button>
          </div>
          {modeMsg&&<p role={modeMsg.type==='ok'?'status':'alert'} style={{fontSize:13,color:modeMsg.type==='ok'?'var(--color-success)':'var(--color-error)',marginTop:4}}>{modeMsg.type==='ok'?'✓':'!'} {modeMsg.text}</p>}
          <div style={{background:'var(--color-bg)',border:'1px solid var(--color-border)',borderRadius:'var(--radius-md)',padding:'14px 16px'}}>
            <p style={{fontSize:12,fontWeight:600,color:'var(--color-text-muted)',marginBottom:8}}>유료 전환 시 구조</p>
            <ul style={{fontSize:12,color:'var(--color-text-muted)',lineHeight:1.8,paddingLeft:16}}>
              <li>신규 매칭 신청 시 이용권 1개 차감</li>
              <li>이용권은 결제 후 지급 (관리자 수동 확인)</li>
              <li>기존 진행 중인 매칭은 영향 없음</li>
            </ul>
          </div>
        </section>

        {/* 서비스 공지 */}
        <section style={cardStyle} className="fade-up fade-up-3">
          <div>
            <h2 style={{fontSize:16,fontWeight:600,color:'var(--color-text)',marginBottom:6}}>서비스 공지</h2>
            <p style={{fontSize:13,color:'var(--color-text-muted)',lineHeight:1.6}}>홈 화면 상단에 표시될 공지사항입니다. 비워두면 공지 배너가 숨겨집니다.</p>
          </div>
          <div style={{position:'relative'}}>
            <textarea className="input" placeholder="점검 안내, 이벤트, 주의사항 등을 입력하세요" value={notice} onChange={e=>{setNotice(e.target.value);setNoticeMsg(null)}} rows={4} maxLength={200} style={{resize:'none',paddingBottom:28,lineHeight:1.6}}/>
            <span style={{position:'absolute',bottom:10,right:12,fontSize:11,color:notice.length>180?'var(--color-error)':'var(--color-text-hint)'}}>{notice.length}/200</span>
          </div>
          {noticeMsg&&<p role={noticeMsg.type==='ok'?'status':'alert'} style={{fontSize:13,color:noticeMsg.type==='ok'?'var(--color-success)':'var(--color-error)'}}>{noticeMsg.type==='ok'?'✓':'!'} {noticeMsg.text}</p>}
          <div style={{display:'flex',gap:8}}>
            <button className="btn-ghost" style={{flex:1}} onClick={()=>{setNotice(settings.service_notice);setNoticeMsg(null)}} disabled={notice===settings.service_notice||noticeSaving}>되돌리기</button>
            <button className="btn-primary" style={{flex:2}} onClick={handleSaveNotice} disabled={noticeSaving||notice===settings.service_notice}>
              {noticeSaving?<span className="spinner" style={{margin:'0 auto',width:18,height:18,borderWidth:2}}/>:'저장'}
            </button>
          </div>
        </section>

        {/* 시스템 정보 */}
        <section style={cardStyle} className="fade-up fade-up-4">
          <h2 style={{fontSize:16,fontWeight:600,color:'var(--color-text)'}}>시스템 정보</h2>
          <div style={{display:'flex',flexDirection:'column',border:'1px solid var(--color-border)',borderRadius:'var(--radius-md)',overflow:'hidden'}}>
            {[['서비스명','춘천과팅'],['대상 학교','강원대학교, 한림대학교, 성심대학교'],['매칭 방식','3:3 과팅 (여성 팀이 남성 팀에게 신청)'],['관리자',adminUser?.nickname??'-'],['문의 이메일','john_1217@naver.com']].map(([label,value])=>(
              <div key={label} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'11px 14px',borderBottom:'1px solid var(--color-border)'}}>
                <span style={{fontSize:13,color:'var(--color-text-muted)'}}>{label}</span>
                <span style={{fontSize:13,fontWeight:500,color:'var(--color-text)',textAlign:'right'}}>{value}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
