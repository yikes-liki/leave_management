import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { Profile, AppRole } from '@/types/leave'
import { MOCK_EMPLOYEE, MOCK_ADMIN } from '@/lib/mockData'

interface AuthContextValue {
  user: User | null
  profile: Profile | null
  session: Session | null
  role: AppRole | null
  loading: boolean
  isAdmin: boolean
  isConfigured: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  /** Demo-only: switch between mock roles without Supabase */
  switchDemoRole: (role: AppRole) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [demoProfile, setDemoProfile] = useState<Profile | null>(null)

  const fetchProfile = useCallback(async (uid: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .single()
    if (!error && data) setProfile(data as Profile)
  }, [])

  useEffect(() => {
    if (!isSupabaseConfigured) {
      // Demo mode — default to employee
      setDemoProfile(MOCK_EMPLOYEE)
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setUser(data.session?.user ?? null)
      if (data.session?.user) fetchProfile(data.session.user.id)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      setUser(s?.user ?? null)
      if (s?.user) fetchProfile(s.user.id)
      else setProfile(null)
    })
    return () => subscription.unsubscribe()
  }, [fetchProfile])

  const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
    if (!isSupabaseConfigured) {
      // Demo login
      if (email === 'admin@demo.com' && password === 'demo') {
        setDemoProfile(MOCK_ADMIN)
        return { error: null }
      }
      if (email === 'employee@demo.com' && password === 'demo') {
        setDemoProfile(MOCK_EMPLOYEE)
        return { error: null }
      }
      return { error: 'Demo mode: use admin@demo.com or employee@demo.com with password "demo"' }
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  }

  const signOut = async () => {
    if (!isSupabaseConfigured) {
      setDemoProfile(null)
      return
    }
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setSession(null)
  }

  const switchDemoRole = (role: AppRole) => {
    setDemoProfile(role === 'admin' ? MOCK_ADMIN : MOCK_EMPLOYEE)
  }

  const activeProfile = isSupabaseConfigured ? profile : demoProfile
  const isLoggedIn = isSupabaseConfigured ? !!user : !!demoProfile

  const value: AuthContextValue = {
    user: isSupabaseConfigured ? user : (demoProfile ? { id: demoProfile.id } as User : null),
    profile: activeProfile,
    session,
    role: activeProfile?.role ?? null,
    loading,
    isAdmin: activeProfile?.role === 'admin',
    isConfigured: isSupabaseConfigured,
    signIn,
    signOut,
    switchDemoRole,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
