// src/lib/types.ts
// Database 타입 제거 (supabaseClient.ts 제네릭 제거로 불필요)
// 도메인 타입만 유지

export type GenderType       = 'male' | 'female'
export type UniversityType   = '강원대학교' | '한림대학교' | '성심대학교'
export type ContactType      = 'kakao' | 'instagram'
export type VerifStatus      = 'none' | 'pending' | 'verified' | 'rejected'
export type TeamStatus       = 'open' | 'matched' | 'closed'
export type MatchStatus      = 'pending' | 'accepted' | 'rejected' | 'cancelled'
export type PaymentStatus    = 'pending' | 'completed' | 'failed' | 'refunded'
export type ReviewStatus     = 'pending' | 'approved' | 'rejected'
export type ReportStatus     = 'pending' | 'reviewed' | 'resolved' | 'dismissed'

export interface UserRow {
  id:                  string
  username:            string
  gender:              GenderType
  university:          UniversityType
  student_id:          string
  nickname:            string
  birth_year:          number
  mbti:                string | null
  is_smoker:           boolean
  contact_type:        ContactType
  contact_value:       string
  role:                string
  verification_status: VerifStatus
  is_active:           boolean
  agreed_terms:        boolean
  agreed_privacy:      boolean
  agreed_adult:        boolean
  created_at:          string
  updated_at:          string
}

export interface TeamListItem {
  id:           string
  name:         string
  university:   UniversityType
  gender:       GenderType
  description:  string | null
  status:       TeamStatus
  created_at:   string
  member_count?: number
}

export interface StudentVerification {
  id:            string
  user_id:       string
  status:        VerifStatus
  reject_reason: string | null
  created_at:    string
}

export interface RegisterFormData {
  username:       string
  password:       string
  passwordCheck:  string
  gender:         GenderType | ''
  university:     UniversityType | ''
  student_id:     string
  nickname:       string
  birth_year:     string
  mbti:           string
  is_smoker:      boolean
  contact_type:   ContactType | ''
  contact_value:  string
  agreed_terms:   boolean
  agreed_privacy: boolean
  agreed_adult:   boolean
}
