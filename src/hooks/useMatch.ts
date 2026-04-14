// src/hooks/useMatch.ts
import { useState, useEffect, useCallback } from 'react'
import {
  getMyTeam, fetchMyMatches, acceptMatch,
  rejectMatch, cancelMatch, getMatchContact,
} from '../services/matchService'
import type { MatchListItem, MemberContact } from '../services/matchService'

export function useMatch(userId: string | undefined) {
  const [myTeam, setMyTeam] = useState<{
    teamId: string | null; teamName: string | null
    gender: string | null; status: string | null; memberCount: number
  } | null>(null)
  const [matches,       setMatches]       = useState<MatchListItem[]>([])
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!userId) { setLoading(false); return }
    setLoading(true); setError(null)
    const teamRes = await getMyTeam(userId)
    if (teamRes.error) { setError(teamRes.error); setLoading(false); return }
    setMyTeam({ teamId: teamRes.teamId, teamName: teamRes.teamName, gender: teamRes.gender, status: teamRes.status, memberCount: teamRes.memberCount })
    if (!teamRes.teamId || !teamRes.gender) { setLoading(false); return }
    const matchRes = await fetchMyMatches(teamRes.teamId, teamRes.gender as 'male' | 'female')
    if (matchRes.error) setError(matchRes.error)
    else setMatches(matchRes.data)
    setLoading(false)
  }, [userId])

  useEffect(() => { load() }, [load])

  const handleAccept = async (matchId: string) => {
    setActionLoading(matchId)
    const { error } = await acceptMatch(matchId)
    setActionLoading(null)
    if (!error) setMatches(prev => prev.map(m => m.id === matchId ? { ...m, status: 'accepted', matched_at: new Date().toISOString() } : m))
    return error
  }

  const handleReject = async (matchId: string) => {
    setActionLoading(matchId)
    const { error } = await rejectMatch(matchId)
    setActionLoading(null)
    if (!error) setMatches(prev => prev.map(m => m.id === matchId ? { ...m, status: 'rejected' } : m))
    return error
  }

  const handleCancel = async (matchId: string) => {
    setActionLoading(matchId)
    const { error } = await cancelMatch(matchId)
    setActionLoading(null)
    if (!error) setMatches(prev => prev.map(m => m.id === matchId ? { ...m, status: 'cancelled' } : m))
    return error
  }

  const handleGetContact = async (matchId: string): Promise<{ data: MemberContact[]; error: string | null }> => {
    return getMatchContact(matchId)
  }

  const pending  = matches.filter(m => m.status === 'pending')
  const accepted = matches.filter(m => m.status === 'accepted')
  const closed   = matches.filter(m => m.status === 'rejected' || m.status === 'cancelled')

  return { myTeam, matches, pending, accepted, closed, loading, error, actionLoading, refresh: load, handleAccept, handleReject, handleCancel, handleGetContact }
}
