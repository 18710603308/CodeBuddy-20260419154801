import { useState, useRef, useMemo } from 'react'
import { Table2, FileJson, FileSpreadsheet, FileText, Download } from 'lucide-react'
import { ContentTextarea } from '@/components/shared/ContentTextarea'
import { ContentOutput } from '@/components/shared/ContentOutput'

/**
 * 增强版 CSV 解析：支持双引号字段、换行符、逗号转义
 * 参考 RFC 4180
 */
function parseCsv(text: string, delimiter = ','): { headers: string[]; rows: string[][] } {
  const trimmed = text.replace(/^\uFEFF/, '').trim()
  if (!trimmed) return { headers: [], rows: [] }
  const rows: string[][] = []
  let cur: string[] = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < trimmed.length; i++) {
    const c = trimmed[i]
    if (inQuotes) {
      if (c === '"') {
        if (trimmed[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += c
      }
    } else {
      if (c === '"') {
        inQuotes = true
      } else if (c === delimiter) {
        cur.push(field)
        field = ''
      } else if (c === '\n' || c === '\r') {
        if (c === '\r' && trimmed[i + 1] === '\n') i++
        cur.push(field)
        rows.push(cur)
        cur = []
        field = ''
      } else {
        field += c
      }
    }
  }
  if (field !== '' || cur.length > 0) {
    cur.push(field)
    rows.push(cur)
  }
  if (rows.length === 0) return { headers: [], rows: [] }
  const headers = rows[0]!
  const data = rows.slice(1)
  return { headers, rows: data }
}

function rowsToCsv(headers: string[], rows: string[][], delimiter = ','): string {
  const esc = (s: string) => {
    if (s == null) return ''
    const str = String(s)
    if (str.includes(delimiter) || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return '"' + str.replace(/"/g, '""') + '"'
    }
    return str
  }
  const head = headers.map(esc).join(delimiter)
  const body = rows.map((r) => r.map(esc).join(delimiter)).join('\n')
  return head + '\n' + body
}

function tryInferType(s: string): 'number' | 'boolean' | 'null' | 'string' {
  if (s === '' || s == null) return 'null'
  if (/^-?\d+(\.\d+)?$/.test(s.trim())) return 'number'
  if (/^(true|false)$/i.test(s.trim())) return 'boolean'
  if (/^null$/i.test(s.trim())) return 'null'
  return 'string'
}

function convertRowsToJson(headers: string[], rows: string[][], typed: boolean): string {
  const objects = rows.map((row) => {
    const obj: Record<string, unknown> = {}
    headers.forEach((h, i) => {
      const v = row[i] ?? ''
      if (!typed) {
        obj[h] = v
        return
      }
      const t = tryInferType(v)
      if (t === 'number') obj[h] = Number(v.trim())
      else if (t === 'boolean') obj[h] = /^true$/i.test(v.trim())
      else if (t === 'null') obj[h] = null
      else obj[h] = v
    })
    return obj
  })
  return JSON.stringify(objects, null, 2)
}

export function CsvTool() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [delimiter, setDelimiter] = useState(',')
  const [typed, setTyped] = useState(true)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const parsed = useMemo(() => parseCsv(input, delimiter), [input, delimiter])

  const toJson = () => {
    if (!parsed.headers.length) {
      setError('请先输入 CSV 数据')
      setOutput('')
      return
    }
    try {
      setOutput(convertRowsToJson(parsed.headers, parsed.rows, typed))
      setError('')
    } catch (e) {
      setError('JSON 转换失败: ' + (e as Error).message)
      setOutput('')
    }
  }

  const toTable = () => {
    if (!parsed.headers.length) {
      setError('请先输入 CSV 数据')
      setOutput('')
      return
    }
    try {
      const lines: string[] = []
      const allRows = [parsed.headers, ...parsed.rows]
      const widths = allRows[0]!.map((_, i) =>
        Math.max(...allRows.map((r) => (r[i] ?? '').length), i.toString().length),
      )
      const fmt = (row: string[]) =>
        '| ' + row.map((c, i) => (c ?? '').padEnd(widths[i] ?? 0)).join(' | ') + ' |'
      const sep = '| ' + widths.map((w) => '-'.repeat(w)).join(' | ') + ' |'
      lines.push(fmt(parsed.headers))
      lines.push(sep)
      parsed.rows.forEach((r) => lines.push(fmt(r)))
      setOutput(lines.join('\n'))
      setError('')
    } catch (e) {
      setError('表格转换失败: ' + (e as Error).message)
      setOutput('')
    }
  }

  const toTsv = () => {
    if (!parsed.headers.length) {
      setError('请先输入 CSV 数据')
      setOutput('')
      return
    }
    setOutput(rowsToCsv(parsed.headers, parsed.rows, '\t'))
    setError('')
  }

  const downloadFile = (filename: string, content: string, mime: string) => {
    const blob = new Blob([content], { type: mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const exportCsv = () => {
    if (!parsed.headers.length) {
      setError('请先输入 CSV 数据')
      return
    }
    downloadFile('export.csv', rowsToCsv(parsed.headers, parsed.rows, delimiter), 'text/csv;charset=utf-8')
  }

  const exportJson = () => {
    if (!parsed.headers.length) {
      setError('请先输入 CSV 数据')
      return
    }
    const json = convertRowsToJson(parsed.headers, parsed.rows, typed)
    downloadFile('export.json', json, 'application/json;charset=utf-8')
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = String(ev.target?.result ?? '')
      setInput(text)
    }
    reader.readAsText(file, 'utf-8')
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 flex-1 h-full">
      {/* 左侧输入区域 */}
      <div className="flex-1 flex flex-col gap-3 min-w-0">
        <div className="flex items-center gap-3 flex-wrap">
          <label className="text-sm text-muted">输入 CSV</label>
          <select
            value={delimiter}
            onChange={(e) => setDelimiter(e.target.value)}
            className="px-3 py-1 rounded bg-input border border-primary text-primary text-sm"
          >
            <option value=",">逗号 ,</option>
            <option value=";">分号 ;</option>
            <option value={'\t'}>制表符 \t</option>
            <option value="|">竖线 |</option>
          </select>
          <label className="flex items-center gap-1 text-xs text-muted cursor-pointer select-none">
            <input type="checkbox" checked={typed} onChange={(e) => setTyped(e.target.checked)} />
            推断类型（数字/布尔/空值）
          </label>
        </div>
        <div className="flex-1 min-h-[260px]">
          <ContentTextarea
            value={input}
            onChange={setInput}
            placeholder="name,age,city&#10;张三,25,北京&#10;李四,30,上海"
          />
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          onChange={handleFile}
          className="hidden"
        />
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={toJson}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors"
          >
            <FileJson className="w-4 h-4" /> 转 JSON
          </button>
          <button
            onClick={toTable}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white font-medium transition-colors"
          >
            <Table2 className="w-4 h-4" /> 转表格
          </button>
          <button
            onClick={toTsv}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white font-medium transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" /> 转 TSV
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-600 hover:bg-slate-500 text-white font-medium transition-colors"
          >
            <FileText className="w-4 h-4" /> 上传文件
          </button>
          <button
            onClick={exportCsv}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-medium transition-colors"
          >
            <Download className="w-4 h-4" /> 导出 CSV
          </button>
          <button
            onClick={exportJson}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-500 hover:bg-rose-600 text-white font-medium transition-colors"
          >
            <Download className="w-4 h-4" /> 导出 JSON
          </button>
        </div>
        {error && <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-sm">{error}</div>}
        {parsed.headers.length > 0 && (
          <div className="text-xs text-muted">
            ✓ 已解析 {parsed.rows.length} 行 × {parsed.headers.length} 列
          </div>
        )}
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
