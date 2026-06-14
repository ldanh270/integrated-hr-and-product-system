import { useEffect, useState } from "react"

type Theme = "light" | "dark"

/**
 * useTheme — Manages dark/light theme toggle.
 * Persists preference in localStorage and applies .dark class to <html>.
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") return "light"
    const stored = localStorage.getItem("theme") as Theme | null
    if (stored === "dark" || stored === "light") return stored
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
  })

  useEffect(() => {
    const root = document.documentElement
    if (theme === "dark") {
      root.classList.add("dark")
    } else {
      root.classList.remove("dark")
    }
    localStorage.setItem("theme", theme)
  }, [theme])

  const toggleTheme = () => setThemeState((t) => (t === "dark" ? "light" : "dark"))

  return { theme, toggleTheme, isDark: theme === "dark" }
}
