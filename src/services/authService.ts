// src/services/authService.ts
import { supabase } from '../lib/supabaseClient'
import type { RegisterFormData } from '../lib/types'
import {
  validateUsername, validatePassword, validatePasswordCheck,
  validateStudentId, validateNickname, validateBirthYear,
  validateContactValue,
} from '../utils/validators'

export async function registerUser(form: RegisterFormData): Promise<{ error: string | null }> {
  const checks: (string | null)[] = [
    validateUsername(form.username),
    validatePassword(form.password),
    validatePasswordCheck(form.password, form.passwordCheck),
    !form.gender ? '성별을 선택해주세요.' : null,
    !form.university ? '학교를 선택해주세요.' : null,
    validateStudentId(form.student_id),
    validateNickname(form.nickname),
    validateBirthYear(form.birth_year),
    validateContactValue(form.contact_type, form.contact_value),
    !form.agreed_terms   ? '서비스 이용약관에 동의해주세요.' : null,
    !form.agreed_privacy ? '개인정보 처리방침에 동의해주세요.' : null,
    !form.agreed_adult   ? '만 19세 이상 확인에 동의해주세요.' : null,
  ]
  const firstError = checks.find(e => e !== null)
  if (firstError) return { error: firstError }

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email:    `${form.username}@chungang.local`,
    password: form.password,
    options:  { emailRedirectTo: undefined },
  })

  if (authError || !authData.user)
    return { error: authError?.message ?? '계정 생성에 실패했습니다.' }

  const { error: profileError } = await supabase.from('users').insert({
    id:            authData.user.id,
    username:      form.username,
    gender:        form.gender as 'male' | 'female',
    university:    form.university as '강원대학교' | '한림대학교' | '성심대학교',
    student_id:    form.student_id.trim(),
    nickname:      form.nickname.trim(),
    birth_year:    Number(form.birth_year),
    mbti:          form.mbti || null,
    is_smoker:     form.is_smoker,
    contact_type:  form.contact_type as 'kakao' | 'instagram',
    contact_value: form.contact_value.trim(),
    agreed_terms:  form.agreed_terms,
    agreed_privacy:form.agreed_privacy,
    agreed_adult:  form.agreed_adult,
  })

  if (profileError) {
    console.error('[authService] 프로필 저장 실패:', profileError.message)
    return { error: '회원 정보 저장에 실패했습니다. 잠시 후 다시 시도해주세요.' }
  }
  return { error: null }
}

export async function loginUser(username: string, password: string): Promise<{ error: string | null }> {
  if (!username.trim() || !password) return { error: '아이디와 비밀번호를 입력해주세요.' }
  const email = `${username.trim()}@chungang.local`
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    const isCredError = error.message.toLowerCase().includes('invalid') || error.message.toLowerCase().includes('credentials')
    return { error: isCredError ? '아이디 또는 비밀번호가 올바르지 않습니다.' : '로그인에 실패했습니다. 잠시 후 다시 시도해주세요.' }
  }
  return { error: null }
}

export async function logoutUser(): Promise<void> {
  await supabase.auth.signOut()
}

export async function checkUsernameAvailable(username: string): Promise<boolean> {
  const formatErr = validateUsername(username)
  if (formatErr) return false
  const { count } = await supabase
    .from('users')
    .select('id', { count: 'exact', head: true })
    .eq('username', username)
  return count === 0
}
