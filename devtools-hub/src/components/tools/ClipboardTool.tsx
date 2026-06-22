import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { Copy } from 'lucide-react'
import { ContentTextarea } from '@/components/shared/ContentTextarea'

export function ClipboardTool() {
  const [copiedText, setCopiedText] = useState('')
  const [history, setHistory] = useState<string[]>([])

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(copiedText)
    setHistory(prev => [copiedText, ...prev.slice(0, 9)])
  }

  const copyFromHistory = async (text: string) => {
    await navigator.clipboard.writeText(text)
  }

  return (
    <div className="flex flex-col gap-4 flex-1">
      <div className="space-y-2">
        <label className="text-sm text-muted">输入内容并复制</label>
        <ContentTextarea value={copiedText} onChange={setCopiedText} placeholder="输入要复制到剪贴板的内容..." />
      </div>

      <div className="flex gap-3">
        <button onClick={copyToClipboard} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors">
          <Copy className="w-4 h-4" /> 复制
        </button>
      </div>

      {history.length > 0 && (
        <div className="space-y-2 flex-1">
          <label className="text-sm text-muted">复制历史 (点击复制)</label>
          <div className="space-y-2 max-h-48 overflow-auto">
            {history.map((text, i) => (
              <div 
                key={i}
                onClick={() => copyFromHistory(text)}
                className="p-3 rounded-lg bg-input border border-primary text-secondary text-sm cursor-pointer hover:bg-slate-700 transition-colors truncate"
              >
                {text}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
