// src/services/teamService.ts
import { supabase } from '../lib/supabaseClient'
import type { TeamListItem, UniversityType, GenderType } from '../lib/types'

export interface TeamMemberPublic {
  user_id:    string
  nickname:   string
  university: UniversityType
  gender:     GenderType
  mbti:       string | null
  is_smoker:  boolean
}

export interface TeamDetail extends TeamListItem {
  created_by: string
  members:    TeamMemberPublic[]
}

export interface CreateTeamInput {
  name:        string
  university:  UniversityType
  gender:      GenderType
  description: string
}

export async function fetchTeamList(filters?: {
  university?: UniversityType; gender?: GenderType; status?: string
}): Promise<{ data: TeamListItem[]; error: string | null }> {
  let query = supabase
    .from('teams')
    .select('id, name, university, gender, description, status, created_at, team_members(count)')
    .eq('is_hidden', false)
    .order('created_at', { ascending: false })
    .limit(50)

  if (filters?.university) query = query.eq('university', filters.university)
  if (filters?.gender)     query = query.eq('gender',     filters.gender)
  if (filters?.status)     query = query.eq('status',     filters.status)

  const { data, error } = await query
  if (error) return { data: [], error: '팀 목록을 불러오지 못했습니다.' }

  const normalized: TeamListItem[] = (data ?? []).map((row: any) => ({
    id: row.id, name: row.name, university: row.university, gender: row.gender,
    description: row.description, status: row.status, created_at: row.created_at,
    member_count: row.team_members?.[0]?.count ?? 0,
  }))
  return { data: normalized, error: null }
}

export async function fetchTeamDetail(teamId: string): Promise<{ data: TeamDetail | null; error: string | null }> {
  const { data, error } = await supabase
    .from('teams')
    .select(`
      id, name, university, gender, description, status, created_by, created_at,
      team_members ( user_id, users ( nickname, university, gender, mbti, is_smoker ) )
    `)
    .eq('id', teamId)
    .eq('is_hidden', false)
    .maybeSingle()

  if (error) return { data: null, error: '팀 정보를 불러오지 못했습니다.' }
  if (!data)  return { data: null, error: '존재하지 않는 팀입니다.' }

  const members: TeamMemberPublic[] = (data.team_members ?? []).map((tm: any) => ({
    user_id: tm.user_id, nickname: tm.users?.nickname ?? '', university: tm.users?.university ?? '',
    gender: tm.users?.gender ?? '', mbti: tm.users?.mbti ?? null, is_smoker: tm.users?.is_smoker ?? false,
  }))

  return {
    data: {
      id: data.id, name: data.name, university: data.university, gender: data.gender,
      description: data.description, status: data.status, created_by: data.created_by,
      created_at: data.created_at, member_count: members.length, members,
    },
    error: null,
  }
}

export async function createTeam(userId: string, input: CreateTeamInput): Promise<{ teamId: string | null; error: string | null }> {
  if (!input.name.trim() || input.name.trim().length < 2) return { teamId: null, error: '팀명은 2자 이상이어야 합니다.' }
  if (input.name.trim().length > 20) return { teamId: null, error: '팀명은 20자 이하여야 합니다.' }
  if (input.description && input.description.length > 300) return { teamId: null, error: '소개글은 300자 이하여야 합니다.' }

  const { count } = await supabase.from('team_members').select('id', { count: 'exact', head: true }).eq('user_id', userId)
  if ((count ?? 0) > 0) return { teamId: null, error: '이미 소속된 팀이 있습니다. 팀을 먼저 탈퇴해주세요.' }

  const { data: team, error: teamErr } = await supabase
    .from('teams')
    .insert({ created_by: userId, name: input.name.trim(), university: input.university, gender: input.gender, description: input.description?.trim() || null })
    .select('id').single()

  if (teamErr || !team) return { teamId: null, error: teamErr?.message ?? '팀 생성에 실패했습니다.' }

  const { error: memberErr } = await supabase.from('team_members').insert({ team_id: team.id, user_id: userId })
  if (memberErr) return { teamId: null, error: '팀원 등록에 실패했습니다. 다시 시도해주세요.' }

  return { teamId: team.id, error: null }
}

export async function searchMemberCandidate(university: UniversityType, studentId: string): Promise<{
  data: { user_id: string; nickname: string; university: string } | null; error: string | null
}> {
  const { data, error } = await supabase
    .from('users')
    .select('id, nickname, university, verification_status, is_active')
    .eq('university', university)
    .eq('student_id', studentId.trim())
    .eq('is_active', true)
    .maybeSingle()

  if (error) return { data: null, error: '조회 중 오류가 발생했습니다.' }
  if (!data)  return { data: null, error: '해당 학번의 가입 회원을 찾을 수 없습니다.' }
  if (data.verification_status !== 'verified') return { data: null, error: '학생 인증이 완료된 회원만 팀원으로 추가할 수 있습니다.' }

  const { count } = await supabase.from('team_members').select('id', { count: 'exact', head: true }).eq('user_id', data.id)
  if ((count ?? 0) > 0) return { data: null, error: '이미 다른 팀에 소속된 회원입니다.' }

  return { data: { user_id: data.id, nickname: data.nickname, university: data.university }, error: null }
}
