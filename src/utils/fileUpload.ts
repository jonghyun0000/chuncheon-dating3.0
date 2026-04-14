// src/utils/fileUpload.ts
import { supabase } from '../lib/supabaseClient'
import { validateImageFile } from './validators'

function generateStoragePath(userId: string, file: File): string {
  const ext = file.type === 'image/png'
    ? 'png'
    : file.type === 'image/webp'
    ? 'webp'
    : 'jpg'
  const uuid = crypto.randomUUID()
  return `${userId}/${uuid}.${ext}`
}

export async function uploadStudentIdImage(
  userId: string,
  file: File
): Promise<{ path: string; error: string | null }> {
  const validationError = validateImageFile(file)
  if (validationError) return { path: '', error: validationError }

  const path = generateStoragePath(userId, file)

  const { error } = await supabase.storage
    .from('student-id')
    .upload(path, file, {
      contentType: file.type,
      upsert: false,
    })

  if (error) {
    console.error('[fileUpload] 업로드 실패:', error.message)
    return { path: '', error: '업로드에 실패했습니다. 다시 시도해주세요.' }
  }

  return { path, error: null }
}
