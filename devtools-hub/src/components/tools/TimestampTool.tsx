import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { Clock } from 'lucide-react'
import { ContentOutput } from '@/components/shared/ContentOutput'

export function TimestampTool() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [mode, setMode] = useState<'toDate' | 'toStamp'>('toDate')

  const convert = () => {
    try {
      if (mode === 'toDate') {
        const timestamp = parseInt(input)
        if (isNaN(timestamp)) {
          setOutput('错误：无效的时间戳')
          return
        }
        const ms = timestamp.toString().length === 10 ? timestamp * 1000 : timestamp
        const date = new Date(ms)
        setOutput(
          `秒级: ${Math.floor(ms / 1000)}\n` +
          `毫秒级: ${ms}\n` +
          `日期: ${date.toLocaleString('zh-CN')}\n` +
          `ISO: ${date.toISOString()}`
        )
      } else {
        const date = new Date(input)
        if (isNaN(date.getTime())) {
          setOutput('错误：无效的日期格式')
          return
        }
        setOutput(
          `秒级时间戳: ${Math.floor(date.getTime() / 1000)}\n` +
          `毫秒级时间戳: ${date.getTime()}`
        )
      }
    } catch {
      setOutput('错误：转换失败')
    }
  }

  return (
    <div className="flex flex-col gap-4 flex-1">
      <div className="flex gap-3 flex-wrap">
        <div className="flex rounded-lg overflow-hidden">
          <button 
            onClick={() => setMode('toDate')} 
            className={`px-4 py-2 font-medium transition-colors ${mode === 'toDate' ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-secondary hover:bg-slate-600'}`}
          >
            时间戳 → 日期
          </button>
          <button 
            onClick={() => setMode('toStamp')} 
            className={`px-4 py-2 font-medium transition-colors ${mode === 'toStamp' ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-secondary hover:bg-slate-600'}`}
          >
            日期 → 时间戳
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm text-muted">
          {mode === 'toDate' ? '输入时间戳（秒或毫秒）' : '输入日期时间'}
        </label>
        <input 
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={mode === 'toDate' ? '1716201600 或 1716201600000' : '2024-05-20 12:00:00'}
          className="w-full px-4 py-3 rounded-xl bg-input border border-primary text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
        />
      </div>

      <button onClick={convert} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors self-start">
        <Clock className="w-4 h-4" /> 转换
      </button>

      <div className="space-y-2 flex-1">
        <label className="text-sm text-muted">转换结果</label>
        <ContentOutput value={output} />
      </div>
    </div>
  )
}
