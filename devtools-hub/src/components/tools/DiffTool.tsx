import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useContentConfig, ContentConfigContext } from '@/contexts/ContentConfigContext'
import { ArrowLeftRight, GitCompare, Minus, Plus } from 'lucide-react'

export function DiffTool() {
  const { contentHeight, fontSize, isFullscreen } = useContentConfig()
  const [original, setOriginal] = useState('')
  const [modified, setModified] = useState('')
  const [diffLines, setDiffLines] = useState<Array<{
    type: 'equal' | 'delete' | 'insert' | 'modify'
    oldLine: string | null
    newLine: string | null
    oldLineNum: number | null
    newLineNum: number | null
  }>>([])
  
  // 同步高度状态 - 两个文本框共享同一个高度
  const [syncedHeight, setSyncedHeight] = useState(200)
  const leftContainerRef = useRef<HTMLDivElement>(null)
  const rightContainerRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // 根据字体大小计算行高
  const lineHeight = Math.max(fontSize * 1.5, 24)

  // 同步两个容器的高度
  useEffect(() => {
    const leftContainer = leftContainerRef.current
    const rightContainer = rightContainerRef.current
    
    if (!leftContainer || !rightContainer) return
    
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const height = entry.contentRect.height
        // 同步另一个容器的高度
        if (entry.target === leftContainer) {
          rightContainer.style.height = `${height}px`
          setSyncedHeight(height)
        } else if (entry.target === rightContainer) {
          leftContainer.style.height = `${height}px`
          setSyncedHeight(height)
        }
      }
    })
    
    resizeObserver.observe(leftContainer)
    resizeObserver.observe(rightContainer)
    
    return () => resizeObserver.disconnect()
  }, [])

  // 同步高度计算样式
  const getSyncedTextareaStyle = () => {
    const minHeight = 120
    const maxHeight = isFullscreen ? window.innerHeight - 300 : 600
    return {
      fontSize: `${fontSize}px`,
      lineHeight: `${lineHeight}px`,
      minHeight: `${minHeight}px`,
      maxHeight: `${maxHeight}px`
    }
  }

  // 计算 Myers 差分算法生成 Git 风格对比
  const computeGitDiff = () => {
    const oldLines = original.split('\n')
    const newLines = modified.split('\n')
    
    if (!original.trim() && !modified.trim()) {
      setDiffLines([])
      return
    }
    
    // 使用 LCS 计算差异
    const lcs = computeLCS(oldLines, newLines)
    const result: typeof diffLines = []
    
    let oldIdx = 0
    let newIdx = 0
    let lcsIdx = 0
    
    while (oldIdx < oldLines.length || newIdx < newLines.length) {
      // 找到 LCS 中的下一个匹配行
      if (lcsIdx < lcs.length) {
        const lcsLine = lcs[lcsIdx]
        
        // 处理删除的行（原文中有但不在当前位置）
        while (oldIdx < oldLines.length && oldLines[oldIdx] !== lcsLine) {
          result.push({
            type: 'delete',
            oldLine: oldLines[oldIdx],
            newLine: null,
            oldLineNum: oldIdx + 1,
            newLineNum: null
          })
          oldIdx++
        }
        
        // 处理新增的行（新文中有的但不在当前位置）
        while (newIdx < newLines.length && newLines[newIdx] !== lcsLine) {
          result.push({
            type: 'insert',
            oldLine: null,
            newLine: newLines[newIdx],
            oldLineNum: null,
            newLineNum: newIdx + 1
          })
          newIdx++
        }
        
        // 相同行
        if (oldIdx < oldLines.length && newIdx < newLines.length) {
          result.push({
            type: 'equal',
            oldLine: oldLines[oldIdx],
            newLine: newLines[newIdx],
            oldLineNum: oldIdx + 1,
            newLineNum: newIdx + 1
          })
          oldIdx++
          newIdx++
          lcsIdx++
        }
      } else {
        // LCS 已处理完，剩余的都是差异
        while (oldIdx < oldLines.length) {
          result.push({
            type: 'delete',
            oldLine: oldLines[oldIdx],
            newLine: null,
            oldLineNum: oldIdx + 1,
            newLineNum: null
          })
          oldIdx++
        }
        while (newIdx < newLines.length) {
          result.push({
            type: 'insert',
            oldLine: null,
            newLine: newLines[newIdx],
            oldLineNum: null,
            newLineNum: newIdx + 1
          })
          newIdx++
        }
      }
    }
    
    setDiffLines(result)
  }

  // LCS 计算函数 (优化版，支持大文件)
  const computeLCS = (arr1: string[], arr2: string[]): string[] => {
    const m = arr1.length
    const n = arr2.length
    
    // 空数组处理
    if (m === 0 || n === 0) return []
    
    // 如果行数太多，使用简化算法避免内存溢出
    if (m > 1000 || n > 1000) {
      // 简化的行对行比较
      const result: string[] = []
      const maxLen = Math.max(arr1.length, arr2.length)
      for (let i = 0; i < maxLen; i++) {
        if (i < arr1.length && i < arr2.length && arr1[i] === arr2[i]) {
          result.push(arr1[i])
        }
      }
      return result
    }
    
    const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0))
    
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (arr1[i - 1] === arr2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
        }
      }
    }
    
    const lcs: string[] = []
    let i = m, j = n
    while (i > 0 && j > 0) {
      if (arr1[i - 1] === arr2[j - 1]) {
        lcs.unshift(arr1[i - 1])
        i--
        j--
      } else if (dp[i - 1][j] > dp[i][j - 1]) {
        i--
      } else {
        j--
      }
    }
    
    return lcs
  }

  // 输入变化时自动对比
  const handleInputChange = (type: 'original' | 'modified', value: string) => {
    if (type === 'original') {
      setOriginal(value)
    } else {
      setModified(value)
    }
    // 延迟执行对比，等待两个输入都更新
    setTimeout(() => computeGitDiff(), 0)
  }

  // 处理 blur 事件
  const handleBlur = () => {
    computeGitDiff()
  }

  // 获取行样式
  const getLineClass = (type: string) => {
    switch (type) {
      case 'delete': return 'bg-red-500/20 border-l-4 border-red-500'
      case 'insert': return 'bg-emerald-500/20 border-l-4 border-emerald-500'
      case 'modify': return 'bg-amber-500/20 border-l-4 border-amber-500'
      default: return 'border-l-4 border-transparent hover:bg-slate-700/30'
    }
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* 输入区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
        <div 
          ref={leftContainerRef}
          className="rounded-xl bg-input border border-primary overflow-hidden flex flex-col min-h-[120px]"
        >
          <div className="px-4 py-2 text-sm text-red-400 border-b border-slate-700 bg-slate-900/50 font-medium flex items-center gap-2 shrink-0">
            <Minus className="w-4 h-4" /> 原文
          </div>
          <textarea
            value={original}
            onChange={(e) => handleInputChange('original', e.target.value)}
            onBlur={handleBlur}
            placeholder="粘贴原始文本..."
            style={getSyncedTextareaStyle()}
            className="w-full p-4 bg-background text-primary caret-primary font-mono resize-none focus:outline-none text-left whitespace-pre break-words box-border flex-1"
          />
        </div>
        <div 
          ref={rightContainerRef}
          className="rounded-xl bg-input border border-primary overflow-hidden flex flex-col min-h-[120px]"
        >
          <div className="px-4 py-2 text-sm text-emerald-400 border-b border-slate-700 bg-slate-900/50 font-medium flex items-center gap-2 shrink-0">
            <Plus className="w-4 h-4" /> 新文
          </div>
          <textarea
            value={modified}
            onChange={(e) => handleInputChange('modified', e.target.value)}
            onBlur={handleBlur}
            placeholder="粘贴新文本..."
            style={getSyncedTextareaStyle()}
            className="w-full p-4 bg-background text-primary caret-primary font-mono resize-none focus:outline-none text-left whitespace-pre break-words box-border flex-1"
          />
        </div>
      </div>

      {/* 对比结果 - Git 风格 */}
      {diffLines.length > 0 && (
        <div className="flex-1 rounded-xl bg-input border border-primary overflow-hidden flex flex-col">
          <div className="px-4 py-2 text-sm text-muted border-b border-primary bg-secondary/80 font-medium flex items-center gap-4 transition-theme">
            <GitCompare className="w-4 h-4" /> 对比结果
            <span className="text-xs text-muted">
              共 {diffLines.length} 行 | 
              <span className="text-red-500 ml-2">{diffLines.filter(l => l.type === 'delete').length} 删除</span> | 
              <span className="text-emerald-600 ml-2">{diffLines.filter(l => l.type === 'insert').length} 新增</span>
            </span>
          </div>
          
          <div 
            ref={scrollRef}
            className="flex-1 overflow-auto bg-input"
            style={{ maxHeight: isFullscreen ? window.innerHeight - 350 : contentHeight - 50 }}
          >
            {/* 表头 */}
            <div className="sticky top-0 z-10 flex bg-secondary border-b border-primary transition-theme">
              <div className="w-16 px-2 py-1 text-xs text-muted font-mono text-center border-r border-primary transition-theme">状态</div>
              <div className="w-16 px-2 py-1 text-xs text-muted font-mono text-center border-r border-primary transition-theme">原文</div>
              <div className="w-16 px-2 py-1 text-xs text-muted font-mono text-center border-r border-primary transition-theme">新文</div>
              <div className="flex-1 px-4 py-1 text-xs text-muted font-mono transition-theme">内容</div>
            </div>
            
            {/* 差异行 */}
            <div className="font-mono bg-input transition-theme" style={{ fontSize: `${fontSize}px`, lineHeight: `${lineHeight}px` }}>
              {diffLines.map((line, idx) => (
                <div key={idx} className={`flex ${getLineClass(line.type)}`}>
                  <div className="w-16 px-2 text-center border-r border-primary/50 flex-shrink-0 flex items-center justify-center transition-theme">
                    {line.type === 'delete' && <Minus className="w-4 h-4 text-red-500" />}
                    {line.type === 'insert' && <Plus className="w-4 h-4 text-emerald-600" />}
                    {line.type === 'equal' && <span className="text-muted"> </span>}
                  </div>
                  <div className="w-16 px-2 text-right text-muted border-r border-primary/50 flex-shrink-0 transition-theme">
                    {line.oldLineNum || ' '}
                  </div>
                  <div className="w-16 px-2 text-right text-muted border-r border-primary/50 flex-shrink-0 transition-theme">
                    {line.newLineNum || ' '}
                  </div>
                  <div className="flex-1 px-4 whitespace-pre break-words transition-theme">
                    <span className={line.type === 'delete' ? 'text-red-600 dark:text-red-300' : line.type === 'insert' ? 'text-emerald-600 dark:text-emerald-300' : 'text-secondary'}>
                      {line.type === 'delete' ? line.oldLine : line.newLine}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 操作提示 */}
      <div className="flex gap-3 flex-wrap items-center">
        <button onClick={computeGitDiff} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors">
          <ArrowLeftRight className="w-4 h-4" /> 手动对比
        </button>
        <span className="text-sm text-subtle">
          输入内容后自动对比
        </span>
      </div>
    </div>
  )
}
