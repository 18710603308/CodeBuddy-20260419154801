import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { Key } from 'lucide-react'
import { ContentOutput } from '@/components/shared/ContentOutput'

export function UuidTool() {
  const [output, setOutput] = useState('')
  const [count, setCount] = useState(1)

  const generate = () => {
    const uuids = Array.from({ length: count }, () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
      })
    })
    setOutput(uuids.join('\n'))
  }

  return (
    <div className="flex flex-col gap-4 flex-1">
      <div className="flex gap-3 flex-wrap items-center">
        <label className="flex items-center gap-2">
          <span className="text-sm text-muted">数量:</span>
          <input 
            type="number" 
            min={1} 
            max={100}
            value={count}
            onChange={(e) => setCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
            className="w-20 px-3 py-2 rounded-lg bg-input border border-primary text-slate-200 text-center"
          />
        </label>
        <button onClick={generate} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors">
          <Key className="w-4 h-4" /> 生成
        </button>
      </div>

      <div className="space-y-2 flex-1">
        <label className="text-sm text-muted">生成的 UUID</label>
        <ContentOutput value={output} placeholder="点击生成按钮创建 UUID..." />
      </div>
    </div>
  )
}
