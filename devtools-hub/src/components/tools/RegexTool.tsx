import { useState, useMemo } from 'react'
import { Type, Wand2, Copy } from 'lucide-react'
import { ContentTextarea } from '@/components/shared/ContentTextarea'
import { ContentOutput } from '@/components/shared/ContentOutput'

interface PresetPattern {
  name: string
  pattern: string
  description: string
  example: string
}

const PRESETS: PresetPattern[] = [
  { name: '手机号（中国大陆）', pattern: '^1[3-9]\\d{9}$', description: '匹配 11 位手机号', example: '13812345678' },
  { name: '电子邮箱', pattern: '^[\\w.+-]+@[\\w-]+\\.[\\w.-]+$', description: '匹配邮箱地址', example: 'user@example.com' },
  { name: '身份证号（18 位）', pattern: '^\\d{17}[\\dXx]$', description: '18 位身份证号', example: '110101199003078811' },
  { name: 'IPv4 地址', pattern: '^(\\d{1,3}\\.){3}\\d{1,3}$', description: '匹配 IPv4', example: '192.168.1.1' },
  { name: 'URL（http/https）', pattern: '^https?://[\\w.-]+(?:\\.[\\w.-]+)+[\\w\\-._~:/?#[\\]@!$&\'()*+,;=%]*$', description: '匹配 URL', example: 'https://example.com/path?q=1' },
  { name: '数字', pattern: '^-?\\d+(?:\\.\\d+)?$', description: '匹配整数或小数', example: '-3.14' },
  { name: '整数', pattern: '^-?\\d+$', description: '匹配整数', example: '42' },
  { name: '中文', pattern: '^[\\u4e00-\\u9fa5]+$', description: '纯中文字符', example: '你好世界' },
  { name: '十六进制颜色', pattern: '^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$', description: 'HEX 颜色', example: '#3498db' },
  { name: '日期（YYYY-MM-DD）', pattern: '^\\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])$', description: 'ISO 日期格式', example: '2026-06-18' },
  { name: '时间（HH:MM:SS）', pattern: '^([01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d$', description: '24 小时制时间', example: '13:45:30' },
  { name: '正整数', pattern: '^[1-9]\\d*$', description: '正整数（不含 0）', example: '100' },
  { name: '空白行', pattern: '^\\s*$', description: '匹配空行或纯空白行', example: '' },
  { name: 'HTML 标签', pattern: '<\\/?[\\w\\s="/.\':;#-\\/?&]+>', description: '匹配 HTML 标签', example: '<div class="x">' },
  { name: '车牌号（中国）', pattern: '^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领][A-Z][A-Z0-9]{5,6}$', description: '中国车牌', example: '京A12345' },
]

export function RegexTool() {
  const [pattern, setPattern] = useState('')
  const [flags, setFlags] = useState('g')
  const [testString, setTestString] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')

  const matches = useMemo(() => {
    if (!pattern) return []
    try {
      const re = new RegExp(pattern, flags)
      const out: { value: string; index: number; groups: string[] }[] = []
      if (flags.includes('g')) {
        let m: RegExpExecArray | null
        while ((m = re.exec(testString)) !== null) {
          out.push({
            value: m[0],
            index: m.index,
            groups: m.slice(1),
          })
          if (m.index === re.lastIndex) re.lastIndex++
        }
      } else {
        const m = re.exec(testString)
        if (m) {
          out.push({ value: m[0], index: m.index, groups: m.slice(1) })
        }
      }
      return out
    } catch {
      return []
    }
  }, [pattern, flags, testString])

  const highlightedText = useMemo(() => {
    if (!pattern || matches.length === 0) return testString
    let result = ''
    let lastIdx = 0
    matches.forEach((m) => {
      result += testString.slice(lastIdx, m.index)
      result += `⟨${m.value}⟩`
      lastIdx = m.index + m.value.length
    })
    result += testString.slice(lastIdx)
    return result
  }, [matches, testString, pattern])

  const handleTest = () => {
    if (!pattern) {
      setError('请输入正则表达式')
      setOutput('')
      return
    }
    try {
      new RegExp(pattern, flags) // 验证
      const lines: string[] = []
      lines.push(`正则: /${pattern}/${flags}`)
      lines.push(`匹配: ${matches.length} 个`)
      matches.slice(0, 50).forEach((m, i) => {
        const ctxBefore = testString.slice(Math.max(0, m.index - 10), m.index)
        const ctxAfter = testString.slice(m.index + m.value.length, m.index + m.value.length + 10)
        lines.push(
          `[${i + 1}] @${m.index} "${m.value}" 上下文: ...${ctxBefore}⟨${m.value}⟩${ctxAfter}...`,
        )
        if (m.groups.length > 0) {
          m.groups.forEach((g, gi) => {
            lines.push(`     分组 ${gi + 1}: ${g}`)
          })
        }
      })
      if (matches.length > 50) lines.push(`... 还有 ${matches.length - 50} 个匹配`)
      setOutput(lines.join('\n'))
      setError('')
    } catch (e) {
      setError('正则错误: ' + (e as Error).message)
      setOutput('')
    }
  }

  const applyPreset = (p: PresetPattern) => {
    setPattern(p.pattern)
    setFlags('g')
    if (p.example) setTestString((cur) => (cur ? cur : p.example))
  }

  return (
    <div className="flex flex-col gap-4 flex-1 h-full overflow-hidden">
      <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">
        {/* 左侧输入区域 */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          <div className="space-y-2">
            <label className="text-sm text-muted">正则表达式</label>
            <div className="flex gap-2 items-center">
              <span className="text-muted font-mono">/</span>
              <input
                type="text"
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                placeholder="\d+"
                className="flex-1 px-4 py-3 rounded-xl bg-input border border-primary text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
              />
              <span className="text-muted font-mono">/</span>
              <input
                type="text"
                value={flags}
                onChange={(e) => setFlags(e.target.value)}
                placeholder="g"
                className="w-16 px-2 py-3 rounded-xl bg-input border border-primary text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="text-xs text-muted">
              flags: g 全局 / i 忽略大小写 / m 多行 / s 单行 / u Unicode / y 粘性
            </div>
          </div>

          <div className="flex-1 min-h-[180px]">
            <label className="text-sm text-muted block mb-2">测试文本</label>
            <ContentTextarea value={testString} onChange={setTestString} placeholder="输入要测试的文本..." />
          </div>

          <div className="flex gap-3 flex-wrap">
            <button
              onClick={handleTest}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors"
            >
              <Type className="w-4 h-4" /> 测试
            </button>
            <button
              onClick={() => {
                if (highlightedText) {
                  navigator.clipboard.writeText(highlightedText)
                }
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-600 hover:bg-slate-500 text-white font-medium transition-colors"
            >
              <Copy className="w-4 h-4" /> 复制高亮结果
            </button>
          </div>

          {error && <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-sm">{error}</div>}

          {/* 常用模式预设 */}
          <div className="space-y-2 max-h-56 overflow-auto border border-primary rounded-lg p-3">
            <div className="text-xs text-muted flex items-center gap-1">
              <Wand2 className="w-3 h-3" /> 常用正则模式（点击使用）
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
              {PRESETS.map((p) => (
                <button
                  key={p.name}
                  onClick={() => applyPreset(p)}
                  className="text-left text-xs px-2 py-1 rounded hover:bg-tertiary text-secondary hover:text-primary transition-colors"
                  title={p.description}
                >
                  <span className="font-medium text-rose-400">{p.name}</span>
                  <span className="text-muted ml-1">· {p.description}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 右侧输出区域 */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          <label className="text-sm text-muted">高亮结果（⟨⟩ 内为匹配）</label>
          <div className="flex-1 min-h-[180px]">
            <ContentOutput value={highlightedText} />
          </div>
          {matches.length > 0 && (
            <div className="text-xs text-emerald-400">✓ 共 {matches.length} 个匹配</div>
          )}
        </div>
      </div>
    </div>
  )
}
