import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'devtools-theme'

interface UseThemeReturn {
  isDark: boolean
  setIsDark: (v: boolean) => void
  toggleTheme: () => void
}

/**
 * 统一主题 Hook
 * - 持久化到 localStorage (key: devtools-theme)
 * - 同步到 document.documentElement[data-theme]
 * - 监听 storage 事件,跨标签页同步
 *
 * 取代之前散落在 game.tsx / retro-games.tsx 里的重复实现
 */
export function useTheme(): UseThemeReturn {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? saved === 'dark' : true
  })

  useEffect(() => {
    const theme = isDark ? 'dark' : 'light'
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem(STORAGE_KEY, theme)
  }, [isDark])

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        document.documentElement.setAttribute('data-theme', e.newValue)
        setIsDark(e.newValue === 'dark')
      }
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const toggleTheme = useCallback(() => setIsDark((v) => !v), [])

  return { isDark, setIsDark, toggleTheme }
}
