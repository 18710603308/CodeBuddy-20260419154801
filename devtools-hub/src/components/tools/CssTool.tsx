import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { ContentTextarea } from '@/components/shared/ContentTextarea'
import { ContentOutput } from '@/components/shared/ContentOutput'
import { AlignLeft } from 'lucide-react'

export function CssTool() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')

  const format = () => {
    try {
      let result = ''
      const rules = input.split(/\{|\}/g).filter(s => s.trim())
      
      for (let i = 0; i < rules.length - 1; i += 2) {
        const selector = rules[i].trim()
        const properties = rules[i + 1].trim()
        if (selector && properties) {
          result += selector + ' {\n'
          properties.split(';').filter(p => p.trim()).forEach(prop => {
            result += '  ' + prop.trim() + ';\n'
          })
          result += '}\n\n'
        }
      }
      
      setOutput(result)
    } catch {
      setOutput('错误：格式化失败')
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 flex-1 h-full">
      {/* 左侧输入区域 */}
      <div className="flex-1 flex flex-col gap-3 min-w-0">
        <label className="text-sm text-muted">输入 CSS</label>
        <div className="flex-1">
          <ContentTextarea value={input} onChange={setInput} placeholder="输入 CSS 代码..." />
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
