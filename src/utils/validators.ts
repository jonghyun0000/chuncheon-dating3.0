// src/utils/validators.ts

export const UNIVERSITIES = ['강원대학교', '한림대학교', '성심대학교'] as const
export const MBTI_LIST = [
  'INTJ','INTP','ENTJ','ENTP',
  'INFJ','INFP','ENFJ','ENFP',
  'ISTJ','ISFJ','ESTJ','ESFJ',
  'ISTP','ISFP','ESTP','ESFP',
] as const

export function validateUsername(v: string): string | null {
  if (!v) return '아이디를 입력해주세요.'
  if (!/^[a-zA-Z0-9_]{4,20}$/.test(v))
    return '아이디는 영문·숫자·_만 사용 가능하며 4~20자여야 합니다.'
  return null
}

export function validatePassword(v: string): string | null {
  if (!v) return '비밀번호를 입력해주세요.'
  if (v.length < 8) return '비밀번호는 8자 이상이어야 합니다.'
  if (!/[A-Za-z]/.test(v)) return '비밀번호에 영문자가 포함되어야 합니다.'
  if (!/[0-9]/.test(v)) return '비밀번호에 숫자가 포함되어야 합니다.'
  if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(v))
    return '비밀번호에 특수문자가 포함되어야 합니다.'
  return null
}

export function validatePasswordCheck(pw: string, check: string): string | null {
  if (pw !== check) return '비밀번호가 일치하지 않습니다.'
  return null
}

export function validateStudentId(v: string): string | null {
  if (!v) return '학번을 입력해주세요.'
  if (!/^\d{7,12}$/.test(v)) return '학번은 숫자 7~12자리여야 합니다.'
  return null
}

export function validateNickname(v: string): string | null {
  if (!v) return '닉네임을 입력해주세요.'
  if (v.trim().length < 2 || v.trim().length > 10)
    return '닉네임은 2~10자여야 합니다.'
  if (/\s/.test(v)) return '닉네임에 공백을 사용할 수 없습니다.'
  return null
}

export function validateBirthYear(v: string): string | null {
  const y = Number(v)
  if (!v || isNaN(y)) return '출생년도를 입력해주세요.'
  if (y < 1990 || y > 2010) return '출생년도는 1990~2010 사이여야 합니다.'
  const age = new Date().getFullYear() - y
  if (age < 19) return '만 19세 미만은 가입할 수 없습니다.'
  return null
}

export function validateKakaoId(v: string): string | null {
  if (!v) return '카카오 ID를 입력해주세요.'
  if (!/^[a-zA-Z0-9_.]{4,20}$/.test(v))
    return '카카오 ID는 영문·숫자·_·. 만 사용 가능하며 4~20자여야 합니다.'
  return null
}

export function validateInstagramId(v: string): string | null {
  if (!v) return '인스타그램 ID를 입력해주세요.'
  if (!/^[a-zA-Z0-9_.]{1,30}$/.test(v))
    return '인스타그램 ID 형식이 올바르지 않습니다.'
  return null
}

export function validateContactValue(type: string, value: string): string | null {
  if (type === 'kakao') return validateKakaoId(value)
  if (type === 'instagram') return validateInstagramId(value)
  return '연락수단을 선택해주세요.'
}

export function validateImageFile(file: File): string | null {
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
  const MAX_SIZE = 5 * 1024 * 1024
  if (!ALLOWED_TYPES.includes(file.type))
    return 'JPG, PNG, WEBP 형식의 이미지만 업로드 가능합니다.'
  if (file.size > MAX_SIZE)
    return '파일 크기는 5MB 이하여야 합니다.'
  return null
}
