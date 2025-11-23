import React, { createContext, useContext, useEffect, useMemo, useState } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { ThemeColors, ThemeMode, themes } from "../theme"

type ThemeContextValue = {
  mode: ThemeMode
  colors: ThemeColors
  isDark: boolean
  setMode: (mode: ThemeMode) => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("dark")

  useEffect(() => {
    ;(async () => {
      try {
        const stored = await AsyncStorage.getItem("pref_theme")
        if (stored === "light" || stored === "dark") setModeState(stored)
      } catch {}
    })()
  }, [])

  const setMode = async (m: ThemeMode) => {
    setModeState(m)
    try {
      await AsyncStorage.setItem("pref_theme", m)
    } catch {}
  }

  const value = useMemo<ThemeContextValue>(() => {
    const colors = themes[mode]
    return {
      mode,
      colors,
      isDark: mode === "dark",
      setMode,
    }
  }, [mode])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider")
  return ctx
}