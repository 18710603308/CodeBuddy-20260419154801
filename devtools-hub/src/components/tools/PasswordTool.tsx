import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { ContentOutput } from '@/components/shared/ContentOutput'
import { Download } from '@/components/shared/Download'
import { Wand2 } from 'lucide-react'

export function PasswordTool() {
  const [output, setOutput] = useState('')
  const [length, setLength] = useState(16)
  const [options, setOptions] = useState({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true
  })

  const generate = () => {
    let chars = ''
    if (options.uppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    if (options.lowercase) chars += 'abcdefghijklmnopqrstuvwxyz'
    if (options.numbers) chars += '0123456789'
    if (options.symbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?'

    if (!chars) {
      setOutput('请至少选择一种字符类型')
      return
    }

    const password = Array.from({ length }, () => 
      chars[Math.floor(Math.random() * chars.length)]
    ).join('')
    
    setOutput(password)
  }

  return (
    <div className="flex flex-col gap-4 flex-1">
      <div className="flex gap-3 flex-wrap items-center">
        <label className="flex items-center gap-2">
          <span className="text-sm text-muted">长度:</span>
          <input 
            type="number" 
            min={4} 
            max={128}
            value={length}
            onChange={(e) => setLength(Math.max(4, Math.min(128, parseInt(e.target.value) || 16)))}
            className="w-20 px-3 py-2 rounded-lg bg-input border border-primary text-slate-200 text-center"
          />
        </label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={options.uppercase}
              onChange={(e) => setOptions({...options, uppercase: e.target.checked})}
              className="w-4 h-4 rounded bg-slate-700 border-slate-600"
            />
            <span className="text-sm text-secondary">大写</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={options.lowercase}
              onChange={(e) => setOptions({...options, lowercase: e.target.checked})}
              className="w-4 h-4 rounded bg-slate-700 border-slate-600"
            />
            <span className="text-sm text-secondary">小写</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={options.numbers}
              onChange={(e) => setOptions({...options, numbers: e.target.checked})}
              className="w-4 h-4 rounded bg-slate-700 border-slate-600"
            />
            <span className="text-sm text-secondary">数字</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={options.symbols}
              onChange={(e) => setOptions({...options, symbols: e.target.checked})}
              className="w-4 h-4 rounded bg-slate-700 border-slate-600"
            />
            <span className="text-sm text-secondary">符号</span>
          </label>
        </div>
        <button onClick={generate} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors">
          <Wand2 className="w-4 h-4" /> 生成
        </button>
      </div>

      <div className="space-y-2 flex-1">
        <label className="text-sm text-muted">生成的密码</label>
        <ContentOutput value={output} placeholder="点击生成按钮创建密码..." />
      </div>
    </div>
  )
}
