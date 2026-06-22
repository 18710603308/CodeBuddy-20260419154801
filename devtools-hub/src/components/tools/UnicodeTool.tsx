import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { ArrowRightLeft } from 'lucide-react'
import { ContentTextarea } from '@/components/shared/ContentTextarea'
import { ContentOutput } from '@/components/shared/ContentOutput'

export function UnicodeTool() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [mode, setMode] = useState<'toUnicode' | 'toChinese'>('toUnicode')

  const convert = () => {
    if (mode === 'toUnicode') {
      // 中文转 Unicode
      setOutput(input.split('').map(c => {
        const code = c.charCodeAt(0)
        if (code > 0xFFFF) {
          return '\\u{' + code.toString(16).toUpperCase() + '}'
        }
        return '\\u' + code.toString(16).padStart(4, '0').toUpperCase()
      }).join(''))
    } else {
      // Unicode 转中文
      setOutput(input.replace(/\\u\{([0-9a-fA-F]+)\}|\\u([0-9a-fA-F]{4})/g, (_, p1, p2) => {
        const code = p1 ? parseInt(p1, 16) : parseInt(p2, 16)
        return String.fromCharCode(code)
      }))
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 flex-1 h-full">
      {/* 左侧输入区域 */}
      <div className="flex-1 flex flex-col gap-3 min-w-0">
        <label className="text-sm text-muted">输入内容</label>
        <div className="flex-1">
          <ContentTextarea value={input} onChange={setInput} placeholder={mode === 'toUnicode' ? '输入中文字符...' : '输入 Unicode 编码...'} />
        </div>
        <div className="flex gap-3 flex-wrap">
          <div className="flex rounded-lg overflow-hidden">
            <button 
              onClick={() => setMode('toUnicode')} 
              className={`px-4 py-2 font-medium transition-colors ${mode === 'toUnicode' ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-secondary hover:bg-slate-600'}`}
            >
              中文 → Unicode
            </button>
            <button 
              onClick={() => setMode('toChinese')} 
              className={`px-4 py-2 font-medium transition-colors ${mode === 'toChinese' ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-secondary hover:bg-slate-600'}`}
            >
              Unicode → 中文
            </button>
          </div>
          <button onClick={convert} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors">
            <ArrowRightLeft className="w-4 h-4" /> 转换
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
