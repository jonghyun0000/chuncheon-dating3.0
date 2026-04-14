// src/services/verificationService.ts
import { supabase } from '../lib/supabaseClient'
import { uploadStudentIdImage } from '../utils/fileUpload'
import type { StudentVerification } from '../lib/types'

export async function submitVerification(userId: string, file: File): Promise<{ error: string | null }> {
  const { path, error: uploadError } = await uploadStudentIdImage(userId, file)
  if (uploadError) return { error: uploadError }

  const { error: dbError } = await supabase
    .from('student_verifications')
    .upsert(
      { user_id: userId, image_path: path, status: 'pending', reject_reason: null, reviewed_by: null, reviewed_at: null },
      { onConflict: 'user_id' }
    )

  if (dbError) {
    console.error('[verificationService] DB 저장 실패:', dbError.message)
    return { error: '인증 정보 저장에 실패했습니다. 다시 시도해주세요.' }
  }

  await supabase.from('users').update({ verification_status: 'pending' }).eq('id', userId)
  return { error: null }
}

export async function getMyVerification(userId: string): Promise<StudentVerification | null> {
  const { data } = await supabase
    .from('student_verifications')
    .select('id, user_id, status, reject_reason, created_at')
    .eq('user_id', userId)
    .maybeSingle()
  return data
}
