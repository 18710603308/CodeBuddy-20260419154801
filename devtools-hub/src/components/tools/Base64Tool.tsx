import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { Terminal } from 'lucide-react'
import { ContentTextarea } from '@/components/shared/ContentTextarea'
import { ContentOutput } from '@/components/shared/ContentOutput'

export function Base64Tool() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [mode, setMode] = useState<'encode' | 'decode'>('encode')

  const process = () => {
    try {
      if (mode === 'encode') {
        setOutput(btoa(unescape(encodeURIComponent(input))))
      } else {
        setOutput(decodeURIComponent(escape(atob(input))))
      }
    } catch {
      setOutput('错误：输入无效')
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 flex-1 h-full">
      {/* 左侧输入区域 */}
      <div className="flex-1 flex flex-col gap-3 min-w-0">
        <label className="text-sm text-muted">输入内容</label>
        <div className="flex-1">
          <ContentTextarea value={input} onChange={setInput} placeholder="输入要编码/解码的内容..." />
        </div>
        <div className="flex gap-3 flex-wrap">
          <div className="flex rounded-lg overflow-hidden">
            <button 
              onClick={() => setMode('encode')} 
              className={`px-4 py-2 font-medium transition-colors ${mode === 'encode' ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-secondary hover:bg-slate-600'}`}
            >
              编码
            </button>
            <button 
              onClick={() => setMode('decode')} 
              className={`px-4 py-2 font-medium transition-colors ${mode === 'decode' ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-secondary hover:bg-slate-600'}`}
            >
              解码
            </button>
          </div>
          <button onClick={process} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors">
            <Terminal className="w-4 h-4" /> {mode === 'encode' ? '编码' : '解码'}
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
