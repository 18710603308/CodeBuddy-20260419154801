import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { ContentTextarea } from '@/components/shared/ContentTextarea'
import { ContentOutput } from '@/components/shared/ContentOutput'
import { AlignLeft, FileText, Gauge, ShieldCheck } from 'lucide-react'

export function JsonTool() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')

  const formatJson = () => {
    try {
      const parsed = JSON.parse(input)
      setOutput(JSON.stringify(parsed, null, 2))
      setError('')
    } catch (e) {
      setError((e as Error).message)
      setOutput('')
    }
  }

  const compressJson = () => {
    try {
      const parsed = JSON.parse(input)
      setOutput(JSON.stringify(parsed))
      setError('')
    } catch (e) {
      setError((e as Error).message)
      setOutput('')
    }
  }

  const validateJson = () => {
    try {
      JSON.parse(input)
      setError('')
      setOutput('✓ JSON 格式正确')
    } catch (e) {
      setError((e as Error).message)
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 flex-1 h-full">
      {/* 左侧输入区域 */}
      <div className="flex-1 flex flex-col gap-3 min-w-0">
        <label className="text-sm text-muted flex items-center gap-2">
          <FileText className="w-4 h-4" /> 输入 JSON
        </label>
        <div className="flex-1">
          <ContentTextarea value={input} onChange={setInput} placeholder="粘贴 JSON 数据..." />
        </div>
        <div className="flex gap-3 flex-wrap">
          <button onClick={formatJson} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors">
            <AlignLeft className="w-4 h-4" /> 美化
          </button>
          <button onClick={compressJson} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-tertiary hover:bg-border-primary text-white font-medium transition-colors">
            <Gauge className="w-4 h-4" /> 压缩
          </button>
          <button onClick={validateJson} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-tertiary hover:bg-border-primary text-white font-medium transition-colors">
            <ShieldCheck className="w-4 h-4" /> 校验
          </button>
        </div>
        {error && <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-sm">{error}</div>}
      </div>

      {/* 右侧输出区域 */}
      <div className="flex-1 flex flex-col gap-3 min-w-0">
        <label className="text-sm text-muted flex items-center gap-2">
          <FileText className="w-4 h-4" /> 输出结果
        </label>
        <div className="flex-1">
          <ContentOutput value={output} />
        </div>
      </div>
    </div>
  )
}
