import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { ArrowRightLeft } from 'lucide-react'
import { ContentOutput } from '@/components/shared/ContentOutput'

export function BinaryTool() {
  const [input, setInput] = useState('')
  const [fromBase, setFromBase] = useState(10)
  const [output, setOutput] = useState('')

  const convert = () => {
    try {
      const decimal = parseInt(input, fromBase)
      if (isNaN(decimal)) {
        setOutput('错误：无效的数字')
        return
      }
      
      setOutput(
        `2进制: ${decimal.toString(2)}\n` +
        `8进制: ${decimal.toString(8)}\n` +
        `10进制: ${decimal.toString(10)}\n` +
        `16进制: ${decimal.toString(16).toUpperCase()}`
      )
    } catch {
      setOutput('错误：转换失败')
    }
  }

  return (
    <div className="flex flex-col gap-4 flex-1">
      <div className="flex gap-3 flex-wrap items-center">
        <select 
          value={fromBase}
          onChange={(e) => setFromBase(Number(e.target.value))}
          className="px-4 py-2 rounded-lg bg-input border border-primary text-slate-200"
        >
          <option value={2}>从 2 进制</option>
          <option value={8}>从 8 进制</option>
          <option value={10}>从 10 进制</option>
          <option value={16}>从 16 进制</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-sm text-muted">输入数字</label>
        <input 
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="输入数字..."
          className="w-full px-4 py-3 rounded-xl bg-input border border-primary text-slate-200 font-mono text-lg focus:outline-none focus:border-emerald-500"
        />
      </div>

      <button onClick={convert} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors self-start">
        <ArrowRightLeft className="w-4 h-4" /> 转换
      </button>

      <div className="space-y-2 flex-1">
        <label className="text-sm text-muted">转换结果</label>
        <ContentOutput value={output} />
      </div>
    </div>
  )
}
