// src/services/matchService.ts
import { supabase } from '../lib/supabaseClient'

export type MatchStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled'

export interface MatchListItem {
  id:             string
  status:         MatchStatus
  created_at:     string
  matched_at:     string | null
  my_role:        'sender' | 'receiver'
  opponent_team: {
    id: string; name: string; university: string
    gender: string; description: string | null; member_count: number
  }
  members_contact: MemberContact[] | null
}

export interface MemberContact {
  nickname:      string
  contact_type:  string
  contact_value: string
}

export async function getMyTeam(userId: string): Promise<{
  teamId: string | null; teamName: string | null; gender: string | null
  status: string | null; memberCount: number; error: string | null
}> {
  const { data, error } = await supabase
    .from('team_members')
    .select('team_id, teams ( id, name, gender, status, team_members(count) )')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) return { teamId: null, teamName: null, gender: null, status: null, memberCount: 0, error: '팀 정보를 불러오지 못했습니다.' }
  if (!data)  return { teamId: null, teamName: null, gender: null, status: null, memberCount: 0, error: null }

  const t = data.teams as any
  return { teamId: t?.id ?? null, teamName: t?.name ?? null, gender: t?.gender ?? null, status: t?.status ?? null, memberCount: t?.team_members?.[0]?.count ?? 0, error: null }
}

export async function fetchMyMatches(teamId: string, myGender: 'male' | 'female'): Promise<{ data: MatchListItem[]; error: string | null }> {
  const senderQ = supabase
    .from('matches')
    .select('id, status, created_at, matched_at, female_team_id, male_team_id, opponent:teams!matches_male_team_id_fkey ( id, name, university, gender, description, team_members(count) )')
    .eq('female_team_id', teamId)
    .order('created_at', { ascending: false })

  const receiverQ = supabase
    .from('matches')
    .select('id, status, created_at, matched_at, female_team_id, male_team_id, opponent:teams!matches_female_team_id_fkey ( id, name, university, gender, description, team_members(count) )')
    .eq('male_team_id', teamId)
    .order('created_at', { ascending: false })

  const [senderRes, receiverRes] = await Promise.all([senderQ, receiverQ])
  if (senderRes.error || receiverRes.error) return { data: [], error: '매칭 목록을 불러오지 못했습니다.' }

  const toItem = (row: any, role: 'sender' | 'receiver'): MatchListItem => ({
    id: row.id, status: row.status, created_at: row.created_at, matched_at: row.matched_at, my_role: role,
    opponent_team: {
      id: row.opponent?.id ?? '', name: row.opponent?.name ?? '', university: row.opponent?.university ?? '',
      gender: row.opponent?.gender ?? '', description: row.opponent?.description ?? null,
      member_count: row.opponent?.team_members?.[0]?.count ?? 0,
    },
    members_contact: null,
  })

  const all = [
    ...(senderRes.data ?? []).map(r => toItem(r, 'sender')),
    ...(receiverRes.data ?? []).map(r => toItem(r, 'receiver')),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return { data: all, error: null }
}

export async function acceptMatch(matchId: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('matches').update({ status: 'accepted', matched_at: new Date().toISOString() }).eq('id', matchId).eq('status', 'pending')
  if (error) return { error: '수락 처리 중 오류가 발생했습니다.' }
  return { error: null }
}

export async function rejectMatch(matchId: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('matches').update({ status: 'rejected' }).eq('id', matchId).eq('status', 'pending')
  if (error) return { error: '거절 처리 중 오류가 발생했습니다.' }
  return { error: null }
}

export async function cancelMatch(matchId: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('matches').update({ status: 'cancelled' }).eq('id', matchId).eq('status', 'pending')
  if (error) return { error: '취소 처리 중 오류가 발생했습니다.' }
  return { error: null }
}

export async function getMatchContact(matchId: string): Promise<{ data: MemberContact[]; error: string | null }> {
  const { data, error } = await supabase.rpc('get_match_contact', { p_match_id: matchId })
  if (error) {
    if (error.message.includes('unauthorized')) return { data: [], error: '매칭 성사 후에만 연락처를 확인할 수 있습니다.' }
    return { data: [], error: '연락처를 불러오지 못했습니다.' }
  }
  return { data: data ?? [], error: null }
}

export async function addTeamMember(teamId: string, userId: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('team_members').insert({ team_id: teamId, user_id: userId })
  if (error) {
    if (error.code === '23505') return { error: '이미 팀에 속한 회원입니다.' }
    if (error.message.includes('정원')) return { error: '팀 정원(3명)이 초과되었습니다.' }
    return { error: '팀원 추가에 실패했습니다.' }
  }
  return { error: null }
}

export async function removeTeamMember(teamId: string, userId: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('team_members').delete().eq('team_id', teamId).eq('user_id', userId)
  if (error) return { error: '팀원 제거에 실패했습니다.' }
  return { error: null }
}

export async function updateTeamDescription(teamId: string, description: string): Promise<{ error: string | null }> {
  if (description.length > 300) return { error: '소개글은 300자 이하여야 합니다.' }
  const { error } = await supabase.from('teams').update({ description: description.trim() || null }).eq('id', teamId)
  if (error) return { error: '소개글 수정에 실패했습니다.' }
  return { error: null }
}
