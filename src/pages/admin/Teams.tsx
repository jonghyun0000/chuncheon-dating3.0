// src/pages/admin/Teams.tsx
import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { UNIVERSITIES } from '../../utils/validators'
import type { UniversityType } from '../../lib/types'
import '../../styles/global.css'

const STATUS_META: Record<string,{bg:string;color:string;label:string}> = {
  open:   {bg:'#D1FAE5',color:'#065F46',label:'모집중'},
  matched:{bg:'#FDE8EB',color:'#C0394B',label:'매칭됨'},
  closed: {bg:'#F3F4F6',color:'#6B7280',label:'마감'},
}

interface AdminTeamRow {
  id: string; name: string; university: string; gender: string
  status: string; is_hidden: boolean; created_at: string
  creator: {nickname:string}|null
  member_count: number
}

export default function Teams() {
  const [rows, setRows] = useState<AdminTeamRow[]>([])
  const [loading, setLoading] = useState(true)
  const [univFilter, setUnivFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [hiddenFilter, setHiddenFilter] = useState<'all'|'visible'|'hidden'>('all')
  const [togglingId, setTogglingId] = useState<string|null>(null)
  const [actionMsg, setActionMsg] = useState<{type:'ok'|'err';text:string}|null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    let q = supabase.from('teams')
      .select('id, name, university, gender, status, is_hidden, created_at, creator:users!teams_created_by_fkey(nickname), team_members(count)')
      .order('created_at', {ascending:false}).limit(200)
    if(univFilter) q = q.eq('university', univFilter)
    if(statusFilter) q = q.eq('status', statusFilter)
    if(hiddenFilter==='visible') q = q.eq('is_hidden', false)
    if(hiddenFilter==='hidden') q = q.eq('is_hidden', true)
    const { data } = await q
    setRows((data??[]).map((r:any)=>({
      id:r.id, name:r.name, university:r.university, gender:r.gender,
      status:r.status, is_hidden:r.is_hidden, created_at:r.created_at,
      creator:r.creator, member_count:r.team_members?.[0]?.count??0,
    })))
    setLoading(false)
  }, [univFilter, statusFilter, hiddenFilter])

  useEffect(() => { load() }, [load])

  const toggleHidden = async (row: AdminTeamRow) => {
    setTogglingId(row.id); setActionMsg(null)
    const { error } = await supabase.from('teams').update({ is_hidden:!row.is_hidden }).eq('id', row.id)
    setTogglingId(null)
    if(error) { setActionMsg({type:'err',text:'처리에 실패했습니다.'}); return }
    setActionMsg({type:'ok',text:`${row.name} 팀을 ${!row.is_hidden?'숨겼습니다':'공개했습니다'}.`})
    load()
  }

  const thS: React.CSSProperties = {padding:'10px 14px',textAlign:'left',fontSize:12,fontWeight:600,color:'var(--color-text-muted)',borderBottom:'1px solid var(--color-border)',background:'var(--color-bg)',whiteSpace:'nowrap'}

  return (
    <div style={{display:'flex',flexDirection:'column',gap:20}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:16}} className="fade-up fade-up-1">
        <div><h1 style={{fontFamily:'var(--font-display)',fontSize:24,fontWeight:400,color:'var(--color-text)',marginBottom:4}}>팀 관리</h1><p style={{fontSize:13,color:'var(--color-text-hint)'}}>등록된 팀 목록을 확인하고 숨김/공개를 관리합니다.</p></div>
        <button style={{padding:'8px 14px',background:'none',border:'1.5px solid var(--color-border)',borderRadius:'var(--radius-full)',fontSize:16,color:'var(--color-text-muted)',cursor:'pointer',fontFamily:'var(--font-body)'}} onClick={load} disabled={loading}>{loading?'...':'↻'}</button>
      </div>
      {actionMsg&&<div role={actionMsg.type==='ok'?'status':'alert'} style={{border:'1px solid',borderRadius:'var(--radius-md)',padding:'10px 14px',fontSize:13,fontWeight:500,background:actionMsg.type==='ok'?'#F0FDF4':'var(--color-primary-light)',borderColor:actionMsg.type==='ok'?'#A7F3D0':'#F4A3AC',color:actionMsg.type==='ok'?'#065F46':'#C0394B'}} className="fade-up">{actionMsg.type==='ok'?'✓':'!'} {actionMsg.text}</div>}
      <div style={{display:'flex',flexWrap:'wrap',gap:8,alignItems:'center'}} className="fade-up fade-up-2">
        <select className="input" style={{flex:'1 1 130px',maxWidth:180,height:42,padding:'0 12px',fontSize:13}} value={univFilter} onChange={e=>setUnivFilter(e.target.value)}>
          <option value="">전체 학교</option>
          {UNIVERSITIES.map(u=><option key={u} value={u}>{u}</option>)}
        </select>
        <select className="input" style={{flex:'1 1 110px',maxWidth:150,height:42,padding:'0 12px',fontSize:13}} value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>
          <option value="">전체 상태</option>
          <option value="open">모집중</option>
          <option value="matched">매칭됨</option>
          <option value="closed">마감</option>
        </select>
        <div style={{display:'flex',gap:4}}>
          {(['all','visible','hidden'] as const).map(f=>(
            <button key={f} onClick={()=>setHiddenFilter(f)} style={{padding:'8px 14px',borderRadius:'var(--radius-full)',border:'1.5px solid',fontSize:13,fontWeight:hiddenFilter===f?600:400,cursor:'pointer',fontFamily:'var(--font-body)',transition:'all 0.15s',background:hiddenFilter===f?'var(--color-primary)':'var(--color-surface)',color:hiddenFilter===f?'#fff':'var(--color-text-muted)',borderColor:hiddenFilter===f?'var(--color-primary)':'var(--color-border)'}}>
              {f==='all'?'전체':f==='visible'?'공개':'숨김'}
            </button>
          ))}
        </div>
        {(univFilter||statusFilter||hiddenFilter!=='all')&&<button className="btn-ghost" style={{flex:'none',padding:'0 14px',height:42,fontSize:13}} onClick={()=>{setUnivFilter('');setStatusFilter('');setHiddenFilter('all')}}>초기화</button>}
      </div>
      {!loading&&<p style={{fontSize:13,color:'var(--color-text-hint)'}} className="fade-up">{rows.length}개</p>}
      <div style={{background:'var(--color-surface)',border:'1px solid var(--color-border)',borderRadius:'var(--radius-lg)',overflow:'hidden'}} className="fade-up fade-up-3">
        {loading?<div style={{display:'flex',justifyContent:'center',alignItems:'center',minHeight:200}}><div className="spinner"/></div>
        :rows.length===0?<div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:200,padding:24,textAlign:'center'}}><span style={{fontSize:32,marginBottom:10}}>🏷️</span><p style={{fontSize:13,color:'var(--color-text-muted)'}}>팀이 없습니다.</p></div>
        :(
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
              <thead><tr>{['팀명','학교','성별','팀원','상태','공개','생성자','액션'].map(h=><th key={h} style={thS}>{h}</th>)}</tr></thead>
              <tbody>
                {rows.map(row=>{
                  const sm = STATUS_META[row.status]??STATUS_META.open
                  return (
                    <tr key={row.id} style={{borderBottom:'1px solid var(--color-border)',opacity:row.is_hidden?0.6:1}}>
                      <td style={{padding:'10px 14px'}}>
                        <Link to={`/team/${row.id}`} style={{fontWeight:600,color:'var(--color-primary)',textDecoration:'none'}}>{row.name}</Link>
                        {row.is_hidden&&<span style={{marginLeft:6,padding:'1px 6px',borderRadius:'var(--radius-full)',background:'#F3F4F6',color:'#6B7280',fontSize:10,fontWeight:700}}>숨김</span>}
                      </td>
                      <td style={{padding:'10px 14px',fontSize:12,color:'var(--color-text-muted)'}}>{row.university.replace('학교','')}</td>
                      <td style={{padding:'10px 14px',color:'var(--color-text-muted)'}}>{row.gender==='female'?'여성':'남성'}</td>
                      <td style={{padding:'10px 14px',textAlign:'center',fontWeight:600,color:row.member_count>=3?'var(--color-primary)':'var(--color-text)'}}>{row.member_count}/3</td>
                      <td style={{padding:'10px 14px'}}><span style={{padding:'2px 8px',borderRadius:'var(--radius-full)',fontSize:11,fontWeight:700,background:sm.bg,color:sm.color}}>{sm.label}</span></td>
                      <td style={{padding:'10px 14px'}}><span style={{display:'inline-block',width:8,height:8,borderRadius:'50%',background:row.is_hidden?'#DC2626':'#16A34A'}}/></td>
                      <td style={{padding:'10px 14px',fontSize:12,color:'var(--color-text-muted)'}}>{row.creator?.nickname??'-'}</td>
                      <td style={{padding:'10px 14px'}}>
                        <button onClick={()=>toggleHidden(row)} disabled={togglingId===row.id} style={{padding:'6px 12px',background:row.is_hidden?'var(--color-primary-light)':'#F3F4F6',border:`1px solid ${row.is_hidden?'var(--color-primary)':'var(--color-border)'}`,borderRadius:'var(--radius-full)',fontSize:11,fontWeight:600,color:row.is_hidden?'var(--color-primary)':'#6B7280',cursor:'pointer',fontFamily:'var(--font-body)',display:'flex',alignItems:'center',justifyContent:'center',minWidth:48}}>
                          {togglingId===row.id?<span className="spinner" style={{width:12,height:12,borderWidth:2}}/>:row.is_hidden?'공개':'숨김'}
                        </button>
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
