import { useState } from 'react'
import { Type, TextCursorInput } from 'lucide-react'
import { ContentTextarea } from '@/components/shared/ContentTextarea'
import { ContentOutput } from '@/components/shared/ContentOutput'

/**
 * 全角转半角: ASCII 33-126 减去 0xFEE0 得到半角
 * 半角转全角: 半角 ASCII 33-126 加上 0xFEE0 得到全角
 * 空格特殊处理: 全角空格 0x3000 ↔ 半角空格 0x20
 */
function fullToHalf(s: string): string {
  let out = ''
  for (let i = 0; i < s.length; i++) {
    const code = s.charCodeAt(i)
    if (code === 0x3000) out += ' '
    else if (code >= 0xff01 && code <= 0xff5e) out += String.fromCharCode(code - 0xfee0)
    else out += s[i]
  }
  return out
}

function halfToFull(s: string): string {
  let out = ''
  for (let i = 0; i < s.length; i++) {
    const code = s.charCodeAt(i)
    if (code === 0x20) out += String.fromCharCode(0x3000)
    else if (code >= 0x21 && code <= 0x7e) out += String.fromCharCode(code + 0xfee0)
    else out += s[i]
  }
  return out
}

function titleCase(s: string): string {
  return s
    .toLowerCase()
    .split(/(\s+)/)
    .map((w) => (w.trim() ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join('')
}

function sentenceCase(s: string): string {
  return s
    .toLowerCase()
    .replace(/(^\s*\w|[.!?]\s+\w)/g, (m) => m.toUpperCase())
}

function toggleCase(s: string): string {
  let out = ''
  for (let i = 0; i < s.length; i++) {
    const c = s[i]!
    if (c >= 'a' && c <= 'z') out += c.toUpperCase()
    else if (c >= 'A' && c <= 'Z') out += c.toLowerCase()
    else out += c
  }
  return out
}

function camelCase(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+(.)/g, (_, c) => c.toUpperCase())
}

function pascalCase(s: string): string {
  const c = camelCase(s)
  return c.charAt(0).toUpperCase() + c.slice(1)
}

function snakeCase(s: string): string {
  return s
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[\s\-]+/g, '_')
    .toLowerCase()
}

function kebabCase(s: string): string {
  return s
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase()
}

function constantCase(s: string): string {
  return snakeCase(s).toUpperCase()
}

export function CaseTool() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')

  const showAll = () => {
    if (!input) {
      setOutput('')
      return
    }
    setOutput(
      `【原文本】\n${input}\n\n` +
        `【英文大小写】\n` +
        `全大写: ${input.toUpperCase()}\n` +
        `全小写: ${input.toLowerCase()}\n` +
        `首字母大写: ${titleCase(input)}\n` +
        `句首大写: ${sentenceCase(input)}\n` +
        `大小写反转: ${toggleCase(input)}\n\n` +
        `【命名风格】\n` +
        `camelCase: ${camelCase(input)}\n` +
        `PascalCase: ${pascalCase(input)}\n` +
        `snake_case: ${snakeCase(input)}\n` +
        `kebab-case: ${kebabCase(input)}\n` +
        `CONSTANT_CASE: ${constantCase(input)}\n\n` +
        `【全角 / 半角】\n` +
        `全角: ${halfToFull(input)}\n` +
        `半角: ${fullToHalf(input)}`,
    )
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 flex-1 h-full">
      {/* 左侧输入区域 */}
      <div className="flex-1 flex flex-col gap-3 min-w-0">
        <label className="text-sm text-muted">输入文本（支持中英文）</label>
        <div className="flex-1">
          <ContentTextarea value={input} onChange={setInput} placeholder="输入英文或中文文本..." />
        </div>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={showAll}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors"
          >
            <TextCursorInput className="w-4 h-4" /> 全部转换
          </button>
          <button
            onClick={() => setOutput(`全角: ${halfToFull(input)}`)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors"
          >
            <Type className="w-4 h-4" /> 转全角
          </button>
          <button
            onClick={() => setOutput(`半角: ${fullToHalf(input)}`)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-medium transition-colors"
          >
            <Type className="w-4 h-4" /> 转半角
          </button>
        </div>
      </div>

      {/* 右侧输出区域 */}
      <div className="flex-1 flex flex-col gap-3 min-w-0">
        <label className="text-sm text-muted">转换结果</label>
        <div className="flex-1">
          <ContentOutput value={output} />
        </div>
      </div>
    </div>
  )
}
