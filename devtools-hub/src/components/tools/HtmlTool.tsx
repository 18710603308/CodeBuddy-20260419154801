import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { ContentTextarea } from '@/components/shared/ContentTextarea'
import { ContentOutput } from '@/components/shared/ContentOutput'
import { AlignLeft } from 'lucide-react'

export function HtmlTool() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')

  const format = () => {
    try {
      let result = ''
      let indent = 0
      const tokens = input.split(/(<[^>]+>)/g).filter(Boolean)
      
      tokens.forEach(token => {
        if (token.match(/^<\/\w/)) {
          indent--
        }
        
        if (token.trim()) {
          result += '  '.repeat(Math.max(0, indent)) + token.trim() + '\n'
        }
        
        if (token.match(/^<\w[^>]*[^\/]>$/)) {
          indent++
        }
      })
      
      setOutput(result)
    } catch {
      setOutput('错误：格式化失败')
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 flex-1 h-full">
      {/* 左侧输入区域 */}
      <div className="flex-1 flex flex-col gap-3 min-w-0">
        <label className="text-sm text-muted">输入 HTML</label>
        <div className="flex-1">
          <ContentTextarea value={input} onChange={setInput} placeholder="输入 HTML 代码..." />
        </div>
        <button onClick={format} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors self-start">
          <AlignLeft className="w-4 h-4" /> 格式化
        </button>
      </div>

      {/* 右侧输出区域 */}
      <div className="flex-1 flex flex-col gap-3 min-w-0">
        <label className="text-sm text-muted">输出结果</label>
        <div className="flex-1">
          <ContentOutput value={output} />
        </div>
      </div>
    </div>
  )
}
