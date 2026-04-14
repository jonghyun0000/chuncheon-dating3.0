// src/hooks/useTeam.ts
import { useState, useEffect, useCallback } from 'react'
import { fetchTeamList, fetchTeamDetail } from '../services/teamService'
import type { TeamListItem, UniversityType, GenderType } from '../lib/types'
import type { TeamDetail } from '../services/teamService'

interface TeamListFilters {
  university?: UniversityType
  gender?:     GenderType
  status?:     string
}

export function useTeamList(initialFilters?: TeamListFilters) {
  const [teams,   setTeams]   = useState<TeamListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)
  const [filters, setFilters] = useState<TeamListFilters>(initialFilters ?? {})

  const load = useCallback(async (f?: TeamListFilters) => {
    setLoading(true)
    setError(null)
    const { data, error } = await fetchTeamList(f ?? filters)
    setTeams(data)
    if (error) setError(error)
    setLoading(false)
  }, [filters])

  useEffect(() => { load() }, [])

  const applyFilter = (next: TeamListFilters) => {
    setFilters(next)
    load(next)
  }

  return { teams, loading, error, filters, applyFilter, refresh: () => load(filters) }
}

export function useTeamDetail(teamId: string | undefined) {
  const [team,    setTeam]    = useState<TeamDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!teamId) { setLoading(false); return }
    setLoading(true)
    setError(null)
    const { data, error } = await fetchTeamDetail(teamId)
    setTeam(data)
    if (error) setError(error)
    setLoading(false)
  }, [teamId])

  useEffect(() => { load() }, [load])

  return { team, loading, error, refresh: load }
}
