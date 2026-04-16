// src/services/adminService.ts
import { supabase } from '../lib/supabaseClient'

export interface DashboardStats {
  totalUsers: number; pendingVerif: number; activeTeams: number
  pendingMatches: number; acceptedMatches: number; pendingReviews: number
  pendingReports: number; recentPayments: number; paymentMode: string
}

export interface VerifRow {
  id: string; user_id: string; status: string; reject_reason: string | null
  created_at: string; reviewed_at: string | null
  user: { username: string; nickname: string; university: string; student_id: string; gender: string }
}

export interface AdminUserRow {
  id: string; username: string; nickname: string; university: string
  gender: string; verification_status: string; is_active: boolean; role: string; created_at: string
}

export interface AuditPayload {
  action: string; target_table: string; target_id: string
  before_data?: Record<string, unknown>; after_data?: Record<string, unknown>
}

async function writeAuditLog(adminId: string, payload: AuditPayload): Promise<void> {
  await supabase.from('admin_audit_logs').insert({
    admin_id: adminId, action: payload.action, target_table: payload.target_table,
    target_id: payload.target_id, before_data: payload.before_data ?? null, after_data: payload.after_data ?? null,
  })
}

export async function fetchDashboardStats(): Promise<{ data: DashboardStats | null; error: string | null }> {
  const [usersRes, pendingVerifRes, activeTeamsRes, pendingMatchRes, acceptedMatchRes,
    pendingReviewRes, pendingReportRes, recentPayRes, settingsRes] = await Promise.all([
    supabase.from('users').select('id', { count: 'exact', head: true }),
    supabase.from('student_verifications').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('teams').select('id', { count: 'exact', head: true }).eq('status', 'open').eq('is_hidden', false),
    supabase.from('matches').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('matches').select('id', { count: 'exact', head: true }).eq('status', 'accepted'),
    supabase.from('reviews').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('payments').select('id', { count: 'exact', head: true }).eq('status', 'completed').gte('paid_at', new Date(Date.now() - 30 * 86400_000).toISOString()),
    supabase.from('site_settings').select('value').eq('key', 'payment_mode').maybeSingle(),
  ])
  const anyError = [usersRes, pendingVerifRes, activeTeamsRes, pendingMatchRes, acceptedMatchRes, pendingReviewRes, pendingReportRes, recentPayRes].find(r => r.error)
  if (anyError?.error) return { data: null, error: '통계를 불러오지 못했습니다.' }
  return {
    data: {
      totalUsers: usersRes.count ?? 0, pendingVerif: pendingVerifRes.count ?? 0,
      activeTeams: activeTeamsRes.count ?? 0, pendingMatches: pendingMatchRes.count ?? 0,
      acceptedMatches: acceptedMatchRes.count ?? 0, pendingReviews: pendingReviewRes.count ?? 0,
      pendingReports: pendingReportRes.count ?? 0, recentPayments: recentPayRes.count ?? 0,
      paymentMode: settingsRes.data?.value ?? 'free',
    },
    error: null,
  }
}

export async function fetchVerifications(status?: string): Promise<{ data: VerifRow[]; error: string | null }> {
  let query = supabase.from('student_verifications')
    .select('id, user_id, status, reject_reason, created_at, reviewed_at, users ( username, nickname, university, student_id, gender )')
    .order('created_at', { ascending: false }).limit(100)
  if (status && status !== 'all') query = query.eq('status', status)
  const { data, error } = await query
  if (error) return { data: [], error: '인증 목록을 불러오지 못했습니다.' }
  return {
    data: (data ?? []).map((row: any) => ({
      id: row.id, user_id: row.user_id, status: row.status, reject_reason: row.reject_reason,
      created_at: row.created_at, reviewed_at: row.reviewed_at,
      user: { username: row.users?.username ?? '', nickname: row.users?.nickname ?? '', university: row.users?.university ?? '', student_id: row.users?.student_id ?? '', gender: row.users?.gender ?? '' },
    })),
    error: null,
  }
}

export async function getVerifImageUrl(imagePath: string): Promise<{ url: string | null; error: string | null }> {
  const { data, error } = await supabase.storage.from('student-id').createSignedUrl(imagePath, 3600)
  if (error || !data?.signedUrl) return { url: null, error: '이미지를 불러오지 못했습니다.' }
  return { url: data.signedUrl, error: null }
}

export async function approveVerification(verifId: string, userId: string, adminId: string): Promise<{ error: string | null }> {
  const { error: verifErr } = await supabase.from('student_verifications')
    .update({ status: 'verified', reviewed_by: adminId, reviewed_at: new Date().toISOString(), reject_reason: null })
    .eq('id', verifId)
  if (verifErr) return { error: '승인 처리에 실패했습니다.' }
  await supabase.from('users').update({ verification_status: 'verified' }).eq('id', userId)
  await writeAuditLog(adminId, { action: 'approve_verification', target_table: 'student_verifications', target_id: verifId, after_data: { status: 'verified', user_id: userId } })
  return { error: null }
}

export async function rejectVerification(verifId: string, userId: string, adminId: string, rejectReason: string): Promise<{ error: string | null }> {
  if (!rejectReason.trim()) return { error: '반려 사유를 입력해주세요.' }
  const { error: verifErr } = await supabase.from('student_verifications')
    .update({ status: 'rejected', reviewed_by: adminId, reviewed_at: new Date().toISOString(), reject_reason: rejectReason.trim() })
    .eq('id', verifId)
  if (verifErr) return { error: '반려 처리에 실패했습니다.' }
  await supabase.from('users').update({ verification_status: 'rejected' }).eq('id', userId)
  await writeAuditLog(adminId, { action: 'reject_verification', target_table: 'student_verifications', target_id: verifId, after_data: { status: 'rejected', reason: rejectReason, user_id: userId } })
  return { error: null }
}

export async function fetchUsers(opts?: { search?: string; university?: string; role?: string; isActive?: boolean }): Promise<{ data: AdminUserRow[]; error: string | null }> {
  let query = supabase.from('users')
    .select('id, username, nickname, university, gender, verification_status, is_active, role, created_at')
    .order('created_at', { ascending: false }).limit(200)
  if (opts?.university) query = query.eq('university', opts.university)
  if (opts?.role)       query = query.eq('role', opts.role)
  if (opts?.isActive !== undefined) query = query.eq('is_active', opts.isActive)
  if (opts?.search) query = query.or(`username.ilike.%${opts.search}%,nickname.ilike.%${opts.search}%`)
  const { data, error } = await query
  if (error) return { data: [], error: '회원 목록을 불러오지 못했습니다.' }
  return { data: (data ?? []) as AdminUserRow[], error: null }
}

export async function toggleUserActive(targetUserId: string, isActive: boolean, adminId: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('users').update({ is_active: isActive }).eq('id', targetUserId)
  if (error) return { error: '상태 변경에 실패했습니다.' }
  await writeAuditLog(adminId, { action: isActive ? 'activate_user' : 'deactivate_user', target_table: 'users', target_id: targetUserId, after_data: { is_active: isActive } })
  return { error: null }
}

export async function togglePaymentMode(mode: 'free' | 'paid', adminId: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('site_settings')
    .update({ value: mode, updated_at: new Date().toISOString(), updated_by: adminId })
    .eq('key', 'payment_mode')
  if (error) return { error: '설정 변경에 실패했습니다.' }
  await writeAuditLog(adminId, { action: 'toggle_payment_mode', target_table: 'site_settings', target_id: 'payment_mode', after_data: { mode } })
  return { error: null }
}
