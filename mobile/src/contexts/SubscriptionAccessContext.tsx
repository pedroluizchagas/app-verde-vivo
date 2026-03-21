import React, { createContext, useCallback, useContext, useEffect, useLayoutEffect, useState } from "react"
import { supabase } from "../supabase"
import { useAuth } from "./AuthContext"

type SubscriptionAccessContextType = {
  loading: boolean
  accessAllowed: boolean
  refreshAccess: () => Promise<void>
}

const SubscriptionAccessContext = createContext<SubscriptionAccessContextType | undefined>(undefined)

export function SubscriptionAccessProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [accessAllowed, setAccessAllowed] = useState(false)

  useLayoutEffect(() => {
    if (user?.id) {
      setLoading(true)
    } else {
      setAccessAllowed(false)
      setLoading(false)
    }
  }, [user?.id])

  const refreshAccess = useCallback(async () => {
    if (!user?.id) {
      setAccessAllowed(false)
      setLoading(false)
      return
    }
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("plan, trial_ends_at")
        .eq("id", user.id)
        .maybeSingle()

      const hasPlan = !!profile?.plan
      const trialActive =
        profile?.trial_ends_at != null && new Date(profile.trial_ends_at) > new Date()

      setAccessAllowed(hasPlan || trialActive)
    } catch {
      setAccessAllowed(false)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    void refreshAccess()
  }, [refreshAccess])

  return (
    <SubscriptionAccessContext.Provider value={{ loading, accessAllowed, refreshAccess }}>
      {children}
    </SubscriptionAccessContext.Provider>
  )
}

export function useSubscriptionAccess() {
  const ctx = useContext(SubscriptionAccessContext)
  if (ctx === undefined) {
    throw new Error("useSubscriptionAccess must be used within SubscriptionAccessProvider")
  }
  return ctx
}
