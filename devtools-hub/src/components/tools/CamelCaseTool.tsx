import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { Shuffle } from 'lucide-react'
import { ContentTextarea } from '@/components/shared/ContentTextarea'
import { ContentOutput } from '@/components/shared/ContentOutput'

export function CamelCaseTool() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')

  const convert = () => {
    const words = input.split(/[\s_-]+/)
    
    const camel = words.map((w, i) => 
      i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
    ).join('')
    
    const pascal = words.map(w => 
      w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
    ).join('')
    
    const snake = words.map(w => w.toLowerCase()).join('_')
    
    const kebab = words.map(w => w.toLowerCase()).join('-')
    
    setOutput(
      `camelCase: ${camel}\n` +
      `PascalCase: ${pascal}\n` +
      `snake_case: ${snake}\n` +
      `kebab-case: ${kebab}`
    )
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 flex-1 h-full">
      {/* 左侧输入区域 */}
      <div className="flex-1 flex flex-col gap-3 min-w-0">
        <label className="text-sm text-muted">输入文本</label>
        <div className="flex-1">
          <ContentTextarea value={input} onChange={setInput} placeholder="输入要转换的文本，如：user_name 或 user-name" />
        </div>
        <button onClick={convert} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors self-start">
          <Shuffle className="w-4 h-4" /> 转换
        </button>
      </div>

      {/* 右侧输出区域 */}
      <div className="flex-1 flex flex-col gap-3 min-w-0">
        <label className="text-sm text-muted">转换结果</label>
        <div className="flex-1">
          <ContentOutput value={output} />
        </div>
      </div>
    </div>
  )
}
