import { useEffect, useRef } from 'react'
import { useContentConfig } from '@/contexts/ContentConfigContext'

interface ContentTextareaProps {
  value: string
  onChange?: (v: string) => void
  placeholder?: string
  isInput?: boolean
}

/**
 * 可复用的文本区域组件 - 自动扩展高度,跟随全局字体大小与全屏状态
 */
export function ContentTextarea({
  value,
  onChange,
  placeholder,
}: ContentTextareaProps) {
  const { fontSize, isFullscreen } = useContentConfig()
  const minHeight = 120
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (ref.current) ref.current.style.fontSize = `${fontSize}px`
  }, [fontSize])

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      className="w-full p-4 rounded-xl bg-input border border-primary text-primary placeholder:text-muted focus:outline-none focus:border-emerald-500 transition-colors resize-none"
      style={{
        minHeight: isFullscreen ? 'calc(100vh - 200px)' : minHeight,
      }}
    />
  )
}
