import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { ContentTextarea } from '@/components/shared/ContentTextarea'
import { ContentOutput } from '@/components/shared/ContentOutput'
import { AlignLeft, ArrowRightLeft } from 'lucide-react'

export function YamlTool() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')

  const formatYaml = () => {
    try {
      // 简单的 YAML 格式化（保持缩进）
      const lines = input.split('\n')
      setOutput(lines.map(line => line).join('\n'))
      setError('')
    } catch (e) {
      setError((e as Error).message)
      setOutput('')
    }
  }

  const convertToJson = () => {
    try {
      // 简单的 YAML 转 JSON（支持基本格式）
      const lines = input.split('\n')
      const result: Record<string, unknown> = {}
      let currentKey = ''
      
      lines.forEach(line => {
        const match = line.match(/^(\s*)(\w+):\s*(.*)$/)
        if (match) {
          const [, indent, key, value] = match
          if (indent.length === 0) {
            currentKey = key
            result[key] = value ? JSON.parse(value) || value : {}
          }
        }
      })
      
      setOutput(JSON.stringify(result, null, 2))
      setError('')
    } catch (e) {
      setError('YAML 格式错误')
      setOutput('')
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 flex-1 h-full">
      {/* 左侧输入区域 */}
      <div className="flex-1 flex flex-col gap-3 min-w-0">
        <label className="text-sm text-muted">输入 YAML</label>
        <div className="flex-1">
          <ContentTextarea value={input} onChange={setInput} placeholder="输入 YAML 数据..." />
        </div>
        <div className="flex gap-3 flex-wrap">
          <button onClick={formatYaml} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors">
            <AlignLeft className="w-4 h-4" /> 格式化
          </button>
          <button onClick={convertToJson} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-tertiary hover:bg-border-primary text-white font-medium transition-colors">
            <ArrowRightLeft className="w-4 h-4" /> 转 JSON
          </button>
        </div>
        {error && <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-sm">{error}</div>}
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
