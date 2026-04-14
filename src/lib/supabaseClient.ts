// src/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL  as string
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnon) {
  throw new Error(
    '[supabaseClient] 환경변수 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY 가 설정되지 않았습니다.'
  )
}

// ★ 절대 window 전역에 붙이지 않음
// ★ 서비스롤 키는 이 파일에 존재하지 않음
export const supabase = createClient<Database>(supabaseUrl, supabaseAnon, {
  auth: {
    persistSession:    true,
    autoRefreshToken:  true,
    detectSessionInUrl:true,
  },
})
