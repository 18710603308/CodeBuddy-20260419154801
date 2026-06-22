import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { ContentTextarea } from '@/components/shared/ContentTextarea'
import { ContentOutput } from '@/components/shared/ContentOutput'
import { AlignLeft, Minimize2 } from 'lucide-react'

export function JsTool() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [mode, setMode] = useState<'format' | 'compress'>('format')

  const process = () => {
    try {
      if (mode === 'format') {
        // 简单的格式化
        let indent = 0
        let result = ''
        const lines = input.replace(/\{/g, ' {\n').replace(/\}/g, '}\n').replace(/;/g, ';\n').split('\n')
        
        lines.forEach(line => {
          const trimmed = line.trim()
          if (!trimmed) return
          
          if (trimmed.startsWith('}')) indent--
          result += '  '.repeat(Math.max(0, indent)) + trimmed + '\n'
          if (trimmed.endsWith('{')) indent++
        })
        
        setOutput(result)
      } else {
        // 压缩
        setOutput(input.replace(/\s+/g, ' ').replace(/\s*([{};,])\s*/g, '$1').trim())
      }
    } catch {
      setOutput('错误：处理失败')
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 flex-1 h-full">
      {/* 左侧输入区域 */}
      <div className="flex-1 flex flex-col gap-3 min-w-0">
        <label className="text-sm text-muted">输入 JavaScript</label>
        <div className="flex-1">
          <ContentTextarea value={input} onChange={setInput} placeholder="输入 JavaScript 代码..." />
        </div>
        <div className="flex gap-3 flex-wrap">
          <div className="flex rounded-lg overflow-hidden">
            <button 
              onClick={() => setMode('format')} 
              className={`px-4 py-2 font-medium transition-colors ${mode === 'format' ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-secondary hover:bg-slate-600'}`}
            >
              <AlignLeft className="w-4 h-4 inline mr-1" /> 美化
            </button>
            <button 
              onClick={() => setMode('compress')} 
              className={`px-4 py-2 font-medium transition-colors ${mode === 'compress' ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-secondary hover:bg-slate-600'}`}
            >
              <Minimize2 className="w-4 h-4 inline mr-1" /> 压缩
            </button>
          </div>
          <button onClick={process} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors">
            执行
          </button>
        </div>
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
