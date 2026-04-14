// src/hooks/useAuth.ts
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { UserRow } from '../lib/types'

interface AuthState {
  user:    UserRow | null
  loading: boolean
  error:   string | null
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({ user: null, loading: true, error: null })

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) fetchProfile(session.user.id)
      else setState({ user: null, loading: false, error: null })
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) fetchProfile(session.user.id)
      else setState({ user: null, loading: false, error: null })
    })
    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId: string) {
    setState(prev => ({ ...prev, loading: true }))
    const { data, error } = await supabase
      .from('users')
      .select(
        'id, username, gender, university, student_id, nickname, ' +
        'birth_year, mbti, is_smoker, contact_type, role, ' +
        'verification_status, is_active, created_at, updated_at'
      )
      .eq('id', userId)
      .maybeSingle()
    if (error || !data) {
      setState({ user: null, loading: false, error: error?.message ?? '프로필 조회 실패' })
      return
    }
    setState({ user: data as unknown as UserRow, loading: false, error: null })
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setState({ user: null, loading: false, error: null })
  }

  const isAdmin    = state.user?.role === 'admin'
  const isVerified = state.user?.verification_status === 'verified'
  const isPending  = state.user?.verification_status === 'pending'
  const isActive   = state.user?.is_active === true

  return {
    ...state, signOut, isAdmin, isVerified, isPending, isActive,
    refetch: () => state.user && fetchProfile(state.user.id)
  }
}
