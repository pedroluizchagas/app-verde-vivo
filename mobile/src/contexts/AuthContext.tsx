import React, { createContext, useContext, useState, useEffect } from 'react'
import { AppState, type AppStateStatus } from 'react-native'
import { supabase } from '../supabase'
import type { User as SupabaseUser } from '@supabase/supabase-js'

interface AuthContextType {
  user: SupabaseUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    ;(async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (!active) return
        if (error) throw error
        setUser(data.session?.user ?? null)
      } catch (e: any) {
        const msg = String(e?.message || "")
        if (msg.toLowerCase().includes("invalid refresh token")) {
          try { await supabase.auth.signOut() } catch {}
        }
        if (!active) return
        setUser(null)
      } finally {
        if (!active) return
        setLoading(false)
      }
    })()

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
    })

    // Supabase recommendation for React Native: start/stop auto-refresh based on AppState
    // Without this, the internal timer can stop when the app goes to background,
    // causing the access_token to expire without being renewed.
    supabase.auth.startAutoRefresh()
    const handleAppStateChange = (state: AppStateStatus) => {
      if (state === 'active') {
        supabase.auth.startAutoRefresh()
      } else {
        supabase.auth.stopAutoRefresh()
      }
    }
    const appStateListener = AppState.addEventListener('change', handleAppStateChange)

    return () => {
      active = false
      authListener.subscription.unsubscribe()
      appStateListener.remove()
      supabase.auth.stopAutoRefresh()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })
    if (error) throw error
  }

  const value = {
    user,
    loading,
    signIn,
    signOut,
    signUp,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
