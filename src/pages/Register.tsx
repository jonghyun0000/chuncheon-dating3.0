// src/pages/Register.tsx
import { useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { registerUser, checkUsernameAvailable } from '../services/authService'
import {
  validateUsername, validatePassword, validatePasswordCheck,
  validateStudentId, validateNickname, validateBirthYear,
  validateContactValue, UNIVERSITIES, MBTI_LIST,
} from '../utils/validators'
import type { RegisterFormData } from '../lib/types'
import '../styles/global.css'

const STEPS = ['기본 정보', '학교 정보', '약관 동의'] as const
type Step = 0 | 1 | 2

const INITIAL: RegisterFormData = {
  username:'', password:'', passwordCheck:'', gender:'', university:'',
  student_id:'', nickname:'', birth_year:'', mbti:'', is_smoker:false,
  contact_type:'', contact_value:'', agreed_terms:false, agreed_privacy:false, agreed_adult:false,
}

function Required() { return <span style={{color:'var(--color-primary)',marginLeft:2}}>*</span> }

export default function Register() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>(0)
  const [form, setForm] = useState<RegisterFormData>(INITIAL)
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterFormData,string>>>({})
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState<string|null>(null)
  const [usernameOk, setUsernameOk] = useState<boolean|null>(null)

  const set = (key: keyof RegisterFormData, value: string|boolean) => {
    setForm(prev=>({...prev,[key]:value}))
    setErrors(prev=>({...prev,[key]:undefined}))
    setApiError(null)
  }

  const checkUsername = useCallback(async () => {
    const err = validateUsername(form.username)
    if (err) { setErrors(prev=>({...prev,username:err})); return }
    const available = await checkUsernameAvailable(form.username)
    setUsernameOk(available)
    if (!available) setErrors(prev=>({...prev,username:'이미 사용 중인 아이디입니다.'}))
  }, [form.username])

  const validateStep0 = () => {
    const e: typeof errors = {}
    const u=validateUsername(form.username); if(u) e.username=u
    const p=validatePassword(form.password); if(p) e.password=p
    const pc=validatePasswordCheck(form.password,form.passwordCheck); if(pc) e.passwordCheck=pc
    if(!form.gender) e.gender='성별을 선택해주세요.'
    setErrors(e); return Object.keys(e).length===0
  }

  const validateStep1 = () => {
    const e: typeof errors = {}
    if(!form.university) e.university='학교를 선택해주세요.'
    const s=validateStudentId(form.student_id); if(s) e.student_id=s
    const n=validateNickname(form.nickname); if(n) e.nickname=n
    const b=validateBirthYear(form.birth_year); if(b) e.birth_year=b
    const c=validateContactValue(form.contact_type,form.contact_value); if(c) e.contact_value=c
    if(!form.contact_type) e.contact_type='연락수단을 선택해주세요.'
    setErrors(e); return Object.keys(e).length===0
  }

  const validateStep2 = () => {
    const e: typeof errors = {}
    if(!form.agreed_terms) e.agreed_terms='이용약관에 동의해주세요.'
    if(!form.agreed_privacy) e.agreed_privacy='개인정보처리방침에 동의해주세요.'
    if(!form.agreed_adult) e.agreed_adult='만 19세 이상 확인이 필요합니다.'
    setErrors(e); return Object.keys(e).length===0
  }

  const nextStep = () => {
    if(step===0&&!validateStep0()) return
    if(step===1&&!validateStep1()) return
    setStep(s=>(s+1) as Step)
    window.scrollTo({top:0,behavior:'smooth'})
  }

  const prevStep = () => { setStep(s=>(s-1) as Step); window.scrollTo({top:0,behavior:'smooth'}) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if(!validateStep2()) return
    setLoading(true); setApiError(null)
    const { error } = await registerUser(form)
    setLoading(false)
    if(error) { setApiError(error); return }
    navigate('/verify', { replace: true })
  }

  const tBtn = (val: string, cur: string) => ({
    flex:1, padding:'11px 0', borderRadius:'var(--radius-md)', border:'1.5px solid',
    cursor:'pointer', fontSize:14, fontFamily:'var(--font-body)', transition:'all 0.18s',
    borderColor: cur===val ? 'var(--color-primary)' : 'var(--color-border)',
    background:  cur===val ? 'var(--color-primary-light)' : 'transparent',
    color:       cur===val ? 'var(--color-primary)' : 'var(--color-text-muted)',
    fontWeight:  cur===val ? 600 : 400,
  } as React.CSSProperties)

  const contactPH = form.contact_type==='kakao' ? '카카오 ID (예: kakao_id123)' : form.contact_type==='instagram' ? '인스타그램 ID (예: insta_id)' : '위에서 연락수단을 먼저 선택하세요'

  return (
    <div style={{minHeight:'100dvh',display:'flex',justifyContent:'center',alignItems:'flex-start',padding:'32px 16px 48px',background:'var(--color-bg)',position:'relative',overflow:'hidden'}}>
      <div style={{position:'absolute',width:350,height:350,borderRadius:'50%',background:'var(--color-primary-light)',opacity:0.4,top:-100,right:-80,pointerEvents:'none'}} aria-hidden />
      <main style={{width:'100%',maxWidth:440,background:'var(--color-surface)',borderRadius:'var(--radius-xl)',padding:'36px 28px 32px',boxShadow:'var(--shadow-lg)',border:'1px solid var(--color-border)',position:'relative',zIndex:1}} className="fade-up">
        <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:28}} className="fade-up fade-up-1">
          <Link to="/login" style={{fontSize:22,color:'var(--color-text-muted)',textDecoration:'none',padding:4}}>←</Link>
          <div>
            <h1 style={{fontFamily:'var(--font-display)',fontSize:24,fontWeight:400,color:'var(--color-primary)',marginBottom:2}}>회원가입</h1>
            <p style={{fontSize:13,color:'var(--color-text-hint)'}}>춘천 대학생을 위한 과팅 서비스</p>
          </div>
        </div>

        {/* 스텝 인디케이터 */}
        <div style={{display:'flex',alignItems:'center',marginBottom:28}} className="fade-up fade-up-2">
          {STEPS.map((label,i)=>(
            <div key={label} style={{display:'flex',alignItems:'center',flex:1}}>
              <div style={{width:26,height:26,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,flexShrink:0,transition:'background 0.3s',background:i<=step?'var(--color-primary)':'var(--color-border)',color:i<=step?'#fff':'var(--color-text-hint)'}}>
                {i<step?'✓':i+1}
              </div>
              <span style={{fontSize:11,marginLeft:6,whiteSpace:'nowrap',transition:'color 0.3s',color:i===step?'var(--color-primary)':'var(--color-text-hint)',fontWeight:i===step?600:400}}>{label}</span>
              {i<STEPS.length-1&&<div style={{flex:1,height:2,marginLeft:6,transition:'background 0.3s',background:i<step?'var(--color-primary)':'var(--color-border)',minWidth:16}}/>}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {step===0&&(
            <div style={{display:'flex',flexDirection:'column',gap:18}} className="fade-up fade-up-3">
              <div className="field">
                <label htmlFor="username" className="field-label">아이디 <Required /></label>
                <div style={{display:'flex',gap:8}}>
                  <input id="username" type="text" className={`input${errors.username?' error':''}`} placeholder="4~20자 영문·숫자·_" value={form.username} onChange={e=>{set('username',e.target.value);setUsernameOk(null)}} maxLength={20} autoFocus autoComplete="username"/>
                  <button type="button" className="btn-ghost" style={{whiteSpace:'nowrap',padding:'0 14px'}} onClick={checkUsername}>중복 확인</button>
                </div>
                {usernameOk===true&&<span style={{fontSize:12,color:'var(--color-success)'}}>사용 가능한 아이디입니다.</span>}
                <span className="field-error">{errors.username}</span>
              </div>
              <div className="field">
                <label htmlFor="pw" className="field-label">비밀번호 <Required /></label>
                <input id="pw" type="password" className={`input${errors.password?' error':''}`} placeholder="8자 이상, 영문+숫자+특수문자" value={form.password} onChange={e=>set('password',e.target.value)} autoComplete="new-password"/>
                <span className="field-error">{errors.password}</span>
              </div>
              <div className="field">
                <label htmlFor="pwc" className="field-label">비밀번호 확인 <Required /></label>
                <input id="pwc" type="password" className={`input${errors.passwordCheck?' error':''}`} placeholder="비밀번호를 다시 입력하세요" value={form.passwordCheck} onChange={e=>set('passwordCheck',e.target.value)} autoComplete="new-password"/>
                <span className="field-error">{errors.passwordCheck}</span>
              </div>
              <div className="field">
                <span className="field-label">성별 <Required /></span>
                <div style={{display:'flex',gap:10}}>
                  {(['male','female'] as const).map(g=>(
                    <button key={g} type="button" onClick={()=>set('gender',g)} style={tBtn(g,form.gender)}>{g==='male'?'남성':'여성'}</button>
                  ))}
                </div>
                <span className="field-error">{errors.gender}</span>
              </div>
              <button type="button" className="btn-primary" onClick={nextStep} style={{marginTop:8}}>다음 단계</button>
            </div>
          )}

          {step===1&&(
            <div style={{display:'flex',flexDirection:'column',gap:18}} className="fade-up fade-up-3">
              <div className="field">
                <label htmlFor="univ" className="field-label">학교 <Required /></label>
                <select id="univ" className={`input${errors.university?' error':''}`} value={form.university} onChange={e=>set('university',e.target.value)}>
                  <option value="">학교를 선택하세요</option>
                  {UNIVERSITIES.map(u=><option key={u} value={u}>{u}</option>)}
                </select>
                <span className="field-error">{errors.university}</span>
              </div>
              <div className="field">
                <label htmlFor="sid" className="field-label">학번 <Required /></label>
                <input id="sid" type="text" inputMode="numeric" className={`input${errors.student_id?' error':''}`} placeholder="숫자만 입력 (예: 20210001)" value={form.student_id} onChange={e=>set('student_id',e.target.value.replace(/\D/g,''))} maxLength={12}/>
                <span className="field-error">{errors.student_id}</span>
              </div>
              <div className="field">
                <label htmlFor="nick" className="field-label">닉네임 <Required /></label>
                <input id="nick" type="text" className={`input${errors.nickname?' error':''}`} placeholder="2~10자" value={form.nickname} onChange={e=>set('nickname',e.target.value)} maxLength={10}/>
                <span className="field-error">{errors.nickname}</span>
              </div>
              <div className="field">
                <label htmlFor="by" className="field-label">출생년도 <Required /></label>
                <input id="by" type="text" inputMode="numeric" className={`input${errors.birth_year?' error':''}`} placeholder="예: 2000" value={form.birth_year} onChange={e=>set('birth_year',e.target.value.replace(/\D/g,''))} maxLength={4}/>
                <span className="field-error">{errors.birth_year}</span>
              </div>
              <div className="field">
                <label htmlFor="mbti" className="field-label">MBTI <span style={{color:'var(--color-text-hint)',fontSize:11}}>(선택)</span></label>
                <select id="mbti" className="input" value={form.mbti} onChange={e=>set('mbti',e.target.value)}>
                  <option value="">모르겠어요</option>
                  {MBTI_LIST.map(m=><option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="field">
                <span className="field-label">흡연 여부 <Required /></span>
                <div style={{display:'flex',gap:10}}>
                  {[false,true].map(v=>(
                    <button key={String(v)} type="button" onClick={()=>set('is_smoker',v)} style={tBtn(String(v),String(form.is_smoker))}>{v?'흡연':'비흡연'}</button>
                  ))}
                </div>
              </div>
              <div className="field">
                <span className="field-label">연락수단 <Required /></span>
                <p className="field-hint">매칭 성사 후 상대방에게 공개됩니다.</p>
                <div style={{display:'flex',gap:10,marginBottom:8}}>
                  {(['kakao','instagram'] as const).map(t=>(
                    <button key={t} type="button" onClick={()=>{set('contact_type',t);set('contact_value','')}} style={tBtn(t,form.contact_type)}>{t==='kakao'?'카카오톡':'인스타그램'}</button>
                  ))}
                </div>
                <input type="text" className={`input${errors.contact_value?' error':''}`} placeholder={contactPH} value={form.contact_value} onChange={e=>set('contact_value',e.target.value)} disabled={!form.contact_type} maxLength={30}/>
                <span className="field-error">{errors.contact_value||errors.contact_type}</span>
              </div>
              <div style={{display:'flex',gap:10,marginTop:8}}>
                <button type="button" className="btn-ghost" style={{flex:1}} onClick={prevStep}>이전</button>
                <button type="button" className="btn-primary" style={{flex:2}} onClick={nextStep}>다음 단계</button>
              </div>
            </div>
          )}

          {step===2&&(
            <div style={{display:'flex',flexDirection:'column',gap:18}} className="fade-up fade-up-3">
              <p style={{fontSize:14,color:'var(--color-text-muted)',lineHeight:1.7}}>춘천과팅 서비스를 이용하려면 아래 항목에 모두 동의해주세요.</p>
              <div style={{border:'1px solid var(--color-border)',borderRadius:'var(--radius-lg)',padding:'16px 18px',display:'flex',flexDirection:'column',gap:12}}>
                {[
                  {key:'agreed_terms' as const, label:'서비스 이용약관', to:'/terms'},
                  {key:'agreed_privacy' as const, label:'개인정보 수집 및 이용', to:'/privacy'},
                ].map(item=>(
                  <div key={item.key}>
                    <label className="checkbox-row">
                      <input type="checkbox" checked={form[item.key] as boolean} onChange={e=>set(item.key,e.target.checked)}/>
                      <span><strong style={{color:'var(--color-text)'}}>[필수]</strong> <Link to={item.to} target="_blank" style={{color:'var(--color-primary)',textDecoration:'underline'}}>{item.label}</Link>에 동의합니다.</span>
                    </label>
                    {errors[item.key]&&<span className="field-error" style={{marginLeft:28}}>{errors[item.key]}</span>}
                  </div>
                ))}
                <div style={{height:1,background:'var(--color-border)'}}/>
                <div>
                  <label className="checkbox-row">
                    <input type="checkbox" checked={form.agreed_adult} onChange={e=>set('agreed_adult',e.target.checked)}/>
                    <span><strong style={{color:'var(--color-text)'}}>[필수]</strong> 본인은 만 19세 이상임을 확인합니다.</span>
                  </label>
                  {errors.agreed_adult&&<span className="field-error" style={{marginLeft:28}}>{errors.agreed_adult}</span>}
                </div>
              </div>
              <div style={{background:'var(--color-primary-light)',borderRadius:'var(--radius-md)',padding:'12px 16px',border:'1px solid #F4A3AC'}}>
                <p style={{fontSize:12,color:'var(--color-text-muted)',lineHeight:1.7}}>연락처 및 개인정보는 매칭 성사 후에만 상대방에게 제공됩니다. 허위 정보 제공 시 서비스 이용이 제한될 수 있습니다.</p>
              </div>
              {apiError&&<p role="alert" style={{fontSize:13,color:'var(--color-error)',textAlign:'center'}}>{apiError}</p>}
              <div style={{display:'flex',gap:10,marginTop:8}}>
                <button type="button" className="btn-ghost" style={{flex:1}} onClick={prevStep} disabled={loading}>이전</button>
                <button type="submit" className="btn-primary" style={{flex:2}} disabled={loading}>
                  {loading?<span className="spinner" style={{margin:'0 auto',width:20,height:20,borderWidth:2}}/>:'가입하기'}
                </button>
              </div>
            </div>
          )}
        </form>

        <p style={{textAlign:'center',marginTop:20,fontSize:13,color:'var(--color-text-hint)'}}>
          이미 계정이 있나요? <Link to="/login" style={{color:'var(--color-primary)',fontWeight:600,textDecoration:'none'}}>로그인</Link>
        </p>
      </main>
    </div>
  )
}
