import { createContext, useContext } from 'react'

/**
 * 全局内容配置 Context
 * 为工具组件提供统一的内容高度、字体大小、全屏状态等配置
 */
export interface ContentConfig {
  contentHeight: number
  setContentHeight: (h: number) => void
  fontSize: number
  setFontSize: (s: number) => void
  increaseHeight: () => void
  decreaseHeight: () => void
  increaseFontSize: () => void
  decreaseFontSize: () => void
  isFullscreen: boolean
  setFullscreen: (v: boolean) => void
}

export const ContentConfigContext = createContext<ContentConfig | null>(null)

export const useContentConfig = () => {
  const ctx = useContext(ContentConfigContext)
  if (!ctx) throw new Error('useContentConfig must be used within ContentConfigProvider')
  return ctx
}
