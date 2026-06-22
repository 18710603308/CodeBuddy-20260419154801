import {
  StretchHorizontal,
  ChevronsUpDown,
  AArrowDown,
  AArrowUp,
  Maximize2,
  Minimize2,
} from 'lucide-react'
import { useContentConfig } from '@/contexts/ContentConfigContext'

/**
 * 全局设置条 - 内容高度/字体大小/全屏切换
 * 工具面板 modal 中始终可见
 */
export function GlobalControls() {
  const {
    contentHeight,
    fontSize,
    increaseHeight,
    decreaseHeight,
    increaseFontSize,
    decreaseFontSize,
    isFullscreen,
    setFullscreen,
  } = useContentConfig()

  return (
    <div className="px-6 py-3 bg-tertiary/80 border-b border-primary flex items-center gap-4 flex-wrap transition-theme">
      <span className="text-sm text-muted flex items-center gap-2">
        <StretchHorizontal className="w-4 h-4" />
        全局设置:
      </span>
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted">高度:</span>
        <button
          onClick={decreaseHeight}
          className="p-1.5 rounded bg-secondary hover:bg-border-primary text-secondary transition-colors"
          title="减小高度"
        >
          <ChevronsUpDown className="w-4 h-4" />
        </button>
        <span className="px-2 py-1 bg-secondary rounded text-xs text-secondary min-w-[50px] text-center">
          {contentHeight}px
        </span>
        <button
          onClick={increaseHeight}
          className="p-1.5 rounded bg-secondary hover:bg-border-primary text-secondary transition-colors"
          title="增大高度"
        >
          <ChevronsUpDown className="w-4 h-4 rotate-180" />
        </button>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted">字号:</span>
        <button
          onClick={decreaseFontSize}
          className="p-1.5 rounded bg-secondary hover:bg-border-primary text-secondary transition-colors"
          title="减小字体"
        >
          <AArrowDown className="w-4 h-4" />
        </button>
        <span className="px-2 py-1 bg-secondary rounded text-xs text-secondary min-w-[35px] text-center">
          {fontSize}px
        </span>
        <button
          onClick={increaseFontSize}
          className="p-1.5 rounded bg-secondary hover:bg-border-primary text-secondary transition-colors"
          title="增大字体"
        >
          <AArrowUp className="w-4 h-4" />
        </button>
      </div>
      <div className="ml-auto">
        <button
          onClick={() => setFullscreen(!isFullscreen)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-primary hover:bg-accent-hover text-white font-medium transition-colors"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          {isFullscreen ? '缩小' : '全屏'}
        </button>
      </div>
    </div>
  )
}
