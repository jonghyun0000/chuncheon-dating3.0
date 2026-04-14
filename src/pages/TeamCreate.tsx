// src/pages/TeamCreate.tsx
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { createTeam } from '../services/teamService'
import { UNIVERSITIES } from '../utils/validators'
import type { GenderType, UniversityType } from '../lib/types'
import '../styles/global.css'

export default function TeamCreate() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [form, setForm] = useState({ name:'', gender:(user?.gender??'') as GenderType|'', university:(user?.university??'') as UniversityType|'', description:'' })
  const [errors, setErrors] = useState<Record<string,string>>({})
  const [apiError, setApiError] = useState<string|null>(null)
  const [loading, setLoading] = useState(false)

  const set = (k: string, v: string) => { setForm(p=>({...p,[k]:v})); setErrors(p=>({...p,[k]:''})); setApiError(null) }

  const validate = () => {
    const e: Record<string,string> = {}
    if(!form.name.trim()||form.name.trim().length<2) e.name='팀명은 2자 이상 입력해주세요.'
    if(form.name.trim().length>20) e.name='팀명은 20자 이하여야 합니다.'
    if(!form.gender) e.gender='팀 성별을 선택해주세요.'
    if(!form.university) e.university='학교를 선택해주세요.'
    if(form.description.length>300) e.description='소개글은 300자 이하여야 합니다.'
    setErrors(e); return Object.keys(e).length===0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if(!user||!validate()) return
    setLoading(true); setApiError(null)
    const { teamId, error } = await createTeam(user.id, { name:form.name.trim(), gender:form.gender as GenderType, university:form.university as UniversityType, description:form.description.trim() })
    setLoading(false)
    if(error) { setApiError(error); return }
    navigate(`/team/${teamId}`, { replace:true })
  }

  const tBtn = (val: string, cur: string) => ({
    flex:1, padding:'11px 0', borderRadius:'var(--radius-md)', border:'1.5px solid',
    cursor:'pointer', fontSize:14, fontFamily:'var(--font-body)', transition:'all 0.18s',
    borderColor:cur===val?'var(--color-primary)':'var(--color-border)',
    background: cur===val?'var(--color-primary-light)':'transparent',
    color:      cur===val?'var(--color-primary)':'var(--color-text-muted)',
    fontWeight: cur===val?600:400,
  } as React.CSSProperties)

  return (
    <div style={{minHeight:'100dvh',display:'flex',justifyContent:'center',alignItems:'flex-start',padding:'32px 16px 48px',background:'var(--color-bg)',position:'relative',overflow:'hidden'}}>
      <div style={{position:'absolute',width:300,height:300,borderRadius:'50%',background:'var(--color-primary-light)',opacity:0.35,top:-80,right:-60,pointerEvents:'none'}} aria-hidden/>
      <main style={{width:'100%',maxWidth:440,background:'var(--color-surface)',borderRadius:'var(--radius-xl)',padding:'36px 28px 32px',boxShadow:'var(--shadow-lg)',border:'1px solid var(--color-border)',position:'relative',zIndex:1}} className="fade-up">
        <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:20}} className="fade-up fade-up-1">
          <Link to="/teams" style={{fontSize:22,color:'var(--color-text-muted)',textDecoration:'none',padding:4}}>←</Link>
          <div>
            <h1 style={{fontFamily:'var(--font-display)',fontSize:24,fontWeight:400,color:'var(--color-primary)',marginBottom:2}}>팀 만들기</h1>
            <p style={{fontSize:13,color:'var(--color-text-hint)'}}>3명이 모이면 과팅을 신청할 수 있어요</p>
          </div>
        </div>
        <div style={{display:'flex',alignItems:'flex-start',gap:10,background:'var(--color-primary-light)',border:'1px solid #F4A3AC',borderRadius:'var(--radius-md)',padding:'12px 14px',marginBottom:24}} className="fade-up fade-up-2">
          <span style={{fontSize:16}}>💡</span>
          <p style={{fontSize:13,color:'var(--color-text-muted)',lineHeight:1.6}}>팀을 만들면 자동으로 첫 번째 팀원이 됩니다. 팀 관리 페이지에서 학번으로 팀원을 추가하세요.</p>
        </div>
        <form onSubmit={handleSubmit} noValidate style={{display:'flex',flexDirection:'column',gap:18}}>
          <div className="field fade-up fade-up-2">
            <label htmlFor="name" className="field-label">팀명 <span style={{color:'var(--color-primary)'}}>*</span></label>
            <input id="name" type="text" className={`input${errors.name?' error':''}`} placeholder="2~20자로 입력해주세요" value={form.name} onChange={e=>set('name',e.target.value)} maxLength={20} autoFocus/>
            <span className="field-error">{errors.name}</span>
          </div>
          <div className="field fade-up fade-up-3">
            <span className="field-label">팀 성별 <span style={{color:'var(--color-primary)'}}>*</span></span>
            <div style={{display:'flex',gap:10}}>
              {(['female','male'] as GenderType[]).map(g=>(
                <button key={g} type="button" onClick={()=>set('gender',g)} style={tBtn(g,form.gender)}>{g==='female'?'여성 팀':'남성 팀'}</button>
              ))}
            </div>
            <span className="field-hint">여성 팀이 남성 팀에게 과팅을 신청하는 구조입니다.</span>
            <span className="field-error">{errors.gender}</span>
          </div>
          <div className="field fade-up fade-up-3">
            <label htmlFor="univ" className="field-label">학교 <span style={{color:'var(--color-primary)'}}>*</span></label>
            <select id="univ" className={`input${errors.university?' error':''}`} value={form.university} onChange={e=>set('university',e.target.value)}>
              <option value="">학교를 선택하세요</option>
              {UNIVERSITIES.map(u=><option key={u} value={u}>{u}</option>)}
            </select>
            <span className="field-error">{errors.university}</span>
          </div>
          <div className="field fade-up fade-up-4">
            <label htmlFor="desc" className="field-label">팀 소개 <span style={{color:'var(--color-text-hint)',fontSize:11}}>(선택)</span></label>
            <div style={{position:'relative'}}>
              <textarea id="desc" className={`input${errors.description?' error':''}`} placeholder="팀 분위기, 만남의 목적, 선호 스타일 등을 자유롭게 적어주세요" value={form.description} onChange={e=>set('description',e.target.value)} maxLength={300} rows={4} style={{resize:'none',paddingBottom:28,lineHeight:1.6}}/>
              <span style={{position:'absolute',bottom:10,right:12,fontSize:11,color:form.description.length>270?'var(--color-error)':'var(--color-text-hint)'}}>{form.description.length}/300</span>
            </div>
            <span className="field-error">{errors.description}</span>
          </div>
          {apiError&&<div style={{background:'var(--color-primary-light)',border:'1px solid #F4A3AC',borderRadius:'var(--radius-md)',padding:'10px 14px',fontSize:13,color:'#C0394B',textAlign:'center'}} role="alert">{apiError}</div>}
          <button type="submit" className="btn-primary fade-up fade-up-5" disabled={loading||!form.name||!form.gender||!form.university} style={{marginTop:4}}>
            {loading?<span className="spinner" style={{margin:'0 auto',width:20,height:20,borderWidth:2}}/>:'팀 만들기'}
          </button>
        </form>
      </main>
    </div>
  )
}
