// src/pages/Verification.tsx
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { submitVerification, getMyVerification } from '../services/verificationService'
import { validateImageFile } from '../utils/validators'
import type { StudentVerification } from '../lib/types'
import '../styles/global.css'

const STATUS_LABEL: Record<string, {text:string;badge:string;desc:string}> = {
  none:    {text:'미제출',  badge:'badge-none',     desc:'아직 학생증 인증을 제출하지 않았습니다.'},
  pending: {text:'검토중',  badge:'badge-pending',  desc:'관리자 검토 중입니다. 보통 1~2 영업일 내 처리됩니다.'},
  verified:{text:'인증 완료',badge:'badge-verified',desc:'학생 인증이 완료되었습니다. 팀 등록과 매칭 신청이 가능합니다.'},
  rejected:{text:'반려',   badge:'badge-rejected', desc:'인증이 반려되었습니다. 반려 사유를 확인하고 다시 제출해주세요.'},
}

export default function Verification() {
  const navigate = useNavigate()
  const { user, loading: authLoading, refetch } = useAuth()
  const fileInput = useRef<HTMLInputElement>(null)
  const [verif, setVerif] = useState<StudentVerification|null>(null)
  const [verifLoad, setVerifLoad] = useState(true)
  const [preview, setPreview] = useState<string|null>(null)
  const [file, setFile] = useState<File|null>(null)
  const [fileError, setFileError] = useState<string|null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [apiError, setApiError] = useState<string|null>(null)

  useEffect(() => {
    if (!user) return
    getMyVerification(user.id).then(data => { setVerif(data); setVerifLoad(false) })
  }, [user])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sel = e.target.files?.[0]
    if (!sel) return
    setFileError(null); setApiError(null)
    const err = validateImageFile(sel)
    if (err) { setFileError(err); return }
    const reader = new FileReader()
    reader.onload = ev => setPreview(ev.target?.result as string)
    reader.readAsDataURL(sel)
    setFile(sel)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const dropped = e.dataTransfer.files[0]
    if (!dropped) return
    const err = validateImageFile(dropped)
    if (err) { setFileError(err); return }
    const reader = new FileReader()
    reader.onload = ev => setPreview(ev.target?.result as string)
    reader.readAsDataURL(dropped)
    setFile(dropped); setFileError(null); setApiError(null)
  }

  const handleSubmit = async () => {
    if (!user || !file) return
    setSubmitting(true); setApiError(null)
    const { error } = await submitVerification(user.id, file)
    setSubmitting(false)
    if (error) { setApiError(error); return }
    setSubmitted(true)
    refetch?.()
    const updated = await getMyVerification(user.id)
    setVerif(updated); setFile(null); setPreview(null)
    if (fileInput.current) fileInput.current.value = ''
  }

  if (authLoading || verifLoad) return <div style={{display:'flex',justifyContent:'center',alignItems:'center',minHeight:'100dvh'}}><div className="spinner"/></div>
  if (!user) { navigate('/login', {replace:true}); return null }

  const status = verif?.status ?? 'none'
  const meta   = STATUS_LABEL[status]
  const canResubmit = status === 'rejected' || status === 'none'

  return (
    <div style={{minHeight:'100dvh',display:'flex',justifyContent:'center',alignItems:'flex-start',padding:'32px 16px 48px',background:'var(--color-bg)',position:'relative',overflow:'hidden'}}>
      <div style={{position:'absolute',width:300,height:300,borderRadius:'50%',background:'#EDE9FE',opacity:0.35,bottom:-60,right:-60,pointerEvents:'none'}} aria-hidden/>
      <main style={{width:'100%',maxWidth:440,background:'var(--color-surface)',borderRadius:'var(--radius-xl)',padding:'36px 28px 32px',boxShadow:'var(--shadow-lg)',border:'1px solid var(--color-border)',position:'relative',zIndex:1,display:'flex',flexDirection:'column',gap:20}} className="fade-up">
        <div style={{display:'flex',alignItems:'center',gap:16}} className="fade-up fade-up-1">
          <button onClick={()=>navigate('/my')} style={{background:'none',border:'none',fontSize:22,cursor:'pointer',color:'var(--color-text-muted)',padding:4,fontFamily:'var(--font-body)'}} aria-label="마이페이지로">←</button>
          <div>
            <h1 style={{fontFamily:'var(--font-display)',fontSize:24,fontWeight:400,color:'var(--color-primary)',marginBottom:2}}>학생 인증</h1>
            <p style={{fontSize:13,color:'var(--color-text-hint)'}}>팀 등록을 위해 학생 인증이 필요합니다</p>
          </div>
        </div>

        <div style={{border:'1px solid var(--color-border)',borderRadius:'var(--radius-lg)',padding:'16px 18px',background:'var(--color-bg)'}} className="fade-up fade-up-2">
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <span style={{fontSize:13,color:'var(--color-text-muted)',fontWeight:600}}>현재 인증 상태</span>
            <span className={`badge ${meta.badge}`}>{meta.text}</span>
          </div>
          <p style={{fontSize:14,color:'var(--color-text-muted)',marginTop:8,lineHeight:1.6}}>{meta.desc}</p>
          {status==='rejected'&&verif?.reject_reason&&(
            <div style={{background:'#FEF2F2',border:'1px solid #FCA5A5',borderRadius:'var(--radius-md)',padding:'10px 14px',marginTop:10}}>
              <strong style={{fontSize:12,color:'#991B1B'}}>반려 사유</strong>
              <p style={{fontSize:13,color:'#991B1B',marginTop:4}}>{verif.reject_reason}</p>
            </div>
          )}
        </div>

        {status==='verified'&&(
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',padding:'24px 16px',background:'#F0FDF4',borderRadius:'var(--radius-lg)',border:'1px solid #A7F3D0',textAlign:'center',gap:8}} className="fade-up fade-up-3">
            <div style={{fontSize:40}}>🎉</div>
            <p style={{fontSize:16,fontWeight:600,color:'var(--color-success)'}}>학생 인증 완료!</p>
            <p style={{fontSize:13,color:'var(--color-text-muted)'}}>이제 팀을 만들고 과팅을 신청할 수 있습니다.</p>
            <button className="btn-primary" style={{marginTop:12,maxWidth:200}} onClick={()=>navigate('/team/create')}>팀 만들기</button>
          </div>
        )}

        {status==='pending'&&(
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',padding:'24px 16px',background:'#FFFBEB',borderRadius:'var(--radius-lg)',border:'1px solid #FDE68A'}} className="fade-up fade-up-3">
            <div className="spinner" style={{margin:'0 auto 12px'}}/>
            <p style={{fontSize:14,color:'var(--color-text-muted)',textAlign:'center'}}>관리자가 학생증을 검토하고 있습니다.<br/>완료 시 알림을 드릴게요.</p>
          </div>
        )}

        {canResubmit&&!submitted&&(
          <div style={{display:'flex',flexDirection:'column',gap:14}} className="fade-up fade-up-3">
            <div style={{background:'var(--color-primary-light)',borderRadius:'var(--radius-md)',padding:'14px 16px',border:'1px solid #F4A3AC'}}>
              <p style={{fontSize:13,fontWeight:600,color:'var(--color-text)',marginBottom:8}}>업로드 전 확인사항</p>
              <ul style={{fontSize:12,color:'var(--color-text-muted)',lineHeight:1.8,paddingLeft:16}}>
                <li>학교명, 학번, 이름이 선명하게 보여야 합니다</li>
                <li>JPG · PNG · WEBP 형식, 최대 5MB</li>
                <li>관리자 외 열람 불가 (공개 URL 미발급)</li>
              </ul>
            </div>
            {!preview?(
              <div style={{border:'2px dashed var(--color-border)',borderRadius:'var(--radius-lg)',padding:'36px 20px',display:'flex',flexDirection:'column',alignItems:'center',cursor:'pointer',background:'var(--color-bg)',userSelect:'none',borderColor:fileError?'var(--color-error)':'var(--color-border)'}}
                onClick={()=>fileInput.current?.click()} onDrop={handleDrop} onDragOver={e=>e.preventDefault()} role="button" tabIndex={0} aria-label="학생증 이미지 업로드">
                <span style={{fontSize:32,display:'block',marginBottom:10}}>📄</span>
                <p style={{fontSize:14,color:'var(--color-text-muted)',fontWeight:500}}>클릭 또는 드래그로 업로드</p>
                <p style={{fontSize:12,color:'var(--color-text-hint)',marginTop:4}}>JPG · PNG · WEBP · 최대 5MB</p>
              </div>
            ):(
              <div style={{position:'relative',display:'flex',flexDirection:'column',alignItems:'center'}}>
                <img src={preview} alt="학생증 미리보기" style={{width:'100%',maxHeight:220,objectFit:'contain',borderRadius:'var(--radius-md)',border:'1px solid var(--color-border)'}}/>
                <button onClick={()=>{setFile(null);setPreview(null);if(fileInput.current)fileInput.current.value=''}} style={{position:'absolute',top:8,right:8,background:'rgba(0,0,0,0.55)',color:'#fff',border:'none',borderRadius:'50%',width:26,height:26,cursor:'pointer',fontSize:13}} aria-label="이미지 제거">✕</button>
                {file&&<p style={{fontSize:11,color:'var(--color-text-hint)',marginTop:6,textAlign:'center'}}>{(file.size/1024/1024).toFixed(2)} MB</p>}
              </div>
            )}
            <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} style={{display:'none'}} aria-hidden/>
            {fileError&&<p role="alert" className="field-error" style={{textAlign:'center'}}>{fileError}</p>}
            {apiError&&<p role="alert" style={{fontSize:13,color:'var(--color-error)',textAlign:'center'}}>{apiError}</p>}
            <button type="button" className="btn-primary" disabled={!file||submitting} onClick={handleSubmit}>
              {submitting?<span className="spinner" style={{margin:'0 auto',width:20,height:20,borderWidth:2}}/>:'학생증 제출하기'}
            </button>
          </div>
        )}

        {submitted&&(
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',padding:'24px 16px',background:'#F0FDF4',borderRadius:'var(--radius-lg)',border:'1px solid #A7F3D0',textAlign:'center',gap:8}} className="fade-up">
            <div style={{fontSize:36}}>✅</div>
            <p style={{fontSize:16,fontWeight:600,color:'var(--color-success)'}}>제출 완료!</p>
            <p style={{fontSize:13,color:'var(--color-text-muted)'}}>검토 후 결과를 알려드리겠습니다.</p>
          </div>
        )}

        <p style={{fontSize:12,color:'var(--color-text-hint)',textAlign:'center'}} className="fade-up">
          인증 관련 문의: <a href="mailto:john_1217@naver.com" style={{color:'var(--color-primary)'}}>john_1217@naver.com</a>
        </p>
      </main>
    </div>
  )
}
