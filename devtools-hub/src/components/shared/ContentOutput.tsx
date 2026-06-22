import { useEffect, useRef } from 'react'
import { useContentConfig } from '@/contexts/ContentConfigContext'

interface ContentOutputProps {
  value: string
  placeholder?: string
}

/**
 * 只读输出区域,跟随全局字体大小与全屏状态
 */
export function ContentOutput({ value, placeholder = '输出结果...' }: ContentOutputProps) {
  const { fontSize, isFullscreen } = useContentConfig()
  const ref = useRef<HTMLPreElement>(null)

  useEffect(() => {
    if (ref.current) ref.current.style.fontSize = `${fontSize}px`
  }, [fontSize])

  return (
    <pre
      ref={ref}
      className="w-full p-4 rounded-xl bg-input border border-primary text-primary whitespace-pre-wrap break-all overflow-auto transition-colors"
      style={{
        minHeight: isFullscreen ? 'calc(100vh - 200px)' : 120,
      }}
    >
      {value || <span className="text-muted">{placeholder}</span>}
    </pre>
  )
}
