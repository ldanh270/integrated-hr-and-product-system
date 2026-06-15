import { THEME, type Theme } from "@/config/theme.config.ts"

import { useEffect, useState } from "react"

/**
 * useTheme — Manages dark/light theme toggle.
 * Persists preference in localStorage and applies .dark class to <html>.
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") return THEME.LIGHT
    const stored = localStorage.getItem("theme") as Theme | null
    if (stored === THEME.DARK || stored === THEME.LIGHT) return stored
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? THEME.DARK : THEME.LIGHT
  })

  useEffect(() => {
    const root = document.documentElement
    if (theme === THEME.DARK) {
      root.classList.add(THEME.DARK)
    } else {
      root.classList.remove(THEME.DARK)
    }
    localStorage.setItem("theme", theme)
  }, [theme])

  const toggleTheme = () => {
    setThemeState((t) => (t === THEME.DARK ? THEME.LIGHT : THEME.DARK))
  }
  return { theme, toggleTheme, isDark: theme === THEME.DARK }
}
