import { useState } from 'react'
import { ContentTextarea } from '@/components/shared/ContentTextarea'
import { ContentOutput } from '@/components/shared/ContentOutput'
import { AlignLeft, Minimize2, ShieldCheck } from 'lucide-react'

const KEYWORDS = [
  'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'NOT', 'ORDER BY', 'GROUP BY', 'HAVING',
  'LIMIT', 'OFFSET',
  'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'OUTER JOIN', 'FULL JOIN', 'CROSS JOIN', 'JOIN', 'ON', 'USING',
  'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE FROM',
  'CREATE TABLE', 'ALTER TABLE', 'DROP TABLE', 'CREATE INDEX', 'DROP INDEX',
  'UNION ALL', 'UNION', 'INTERSECT', 'EXCEPT',
  'CASE', 'WHEN', 'THEN', 'ELSE', 'END',
  'BEGIN', 'COMMIT', 'ROLLBACK', 'TRANSACTION',
  'INNER', 'OUTER', 'LEFT', 'RIGHT', 'FULL', 'CROSS',
  'ASC', 'DESC', 'DISTINCT', 'AS',
  'IN', 'EXISTS', 'BETWEEN', 'LIKE', 'IS', 'NULL',
  'PRIMARY KEY', 'FOREIGN KEY', 'REFERENCES', 'UNIQUE', 'INDEX', 'DEFAULT', 'CHECK', 'CONSTRAINT',
]

function formatSql(input: string): string {
  // 去掉行注释
  const noComments = input.replace(/--[^\n]*/g, '')
  let result = noComments
  KEYWORDS.forEach((kw) => {
    const regex = new RegExp(`\\b${kw}\\b`, 'g')
    result = result.replace(regex, `\n${kw}`)
  })
  // 括号处理
  result = result
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      if (line.endsWith('(') || line === '(') return line
      if (line.startsWith('(') && line.endsWith(')')) return '  ' + line
      if (line.startsWith(')')) return line
      return '  ' + line
    })
    .join('\n')
  // 简单缩进
  return result
    .split('\n')
    .reduce<string[]>((acc, line) => {
      const opens = (line.match(/\(/g) ?? []).length
      const closes = (line.match(/\)/g) ?? []).length
      acc.push(line)
      if (closes > opens) {
        // 下一个 token 缩进降一级
        acc.push('')
      }
      return acc
    }, [])
    .join('\n')
}

function minifySql(input: string): string {
  return input
    .replace(/--[^\n]*/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([,;()])\s*/g, '$1')
    .replace(/\(\s+/g, '(')
    .replace(/\s+\)/g, ')')
    .trim()
}

interface SqlCheck {
  ok: boolean
  issues: string[]
  stats: { tables: string[]; keywords: string[]; statements: number }
}

function validateSql(input: string): SqlCheck {
  const issues: string[] = []
  // 1. 括号配对
  const opens = (input.match(/\(/g) ?? []).length
  const closes = (input.match(/\)/g) ?? []).length
  if (opens !== closes) {
    issues.push(`括号不配对: ${opens} 个 ( vs ${closes} 个 )`)
  }
  // 2. 引号配对
  const singleQuotes = (input.match(/'/g) ?? []).length
  if (singleQuotes % 2 !== 0) {
    issues.push('单引号未配对（数量为奇数）')
  }
  // 3. 语句结束符
  const statements = input.split(/;\s*(?:\n|$)/).filter((s) => s.trim())
  if (statements.length === 0 && input.trim()) {
    issues.push('未发现以 ; 结束的 SQL 语句')
  }
  // 4. 关键字大写一致性检查
  const upperKeywords = input.match(/\b(SELECT|FROM|WHERE|INSERT|VALUES|UPDATE|SET|DELETE|CREATE|DROP|ALTER)\b/g) ?? []
  const mixedKeywords = input.match(/\b(SELECT|FROM|WHERE|INSERT|VALUES|UPDATE|SET|DELETE|CREATE|DROP|ALTER)\b/gi) ?? []
  if (upperKeywords.length !== mixedKeywords.length) {
    issues.push(`关键字大小写不统一（建议全部大写）`)
  }
  // 5. 提取表名
  const tableMatches: string[] = []
  const fromRe = /\bFROM\s+([A-Za-z_]\w*)/gi
  const joinRe = /\bJOIN\s+([A-Za-z_]\w*)/gi
  const intoRe = /\bINTO\s+([A-Za-z_]\w*)/gi
  const updateRe = /\bUPDATE\s+([A-Za-z_]\w*)/gi
  let m: RegExpExecArray | null
  while ((m = fromRe.exec(input))) tableMatches.push(m[1]!)
  while ((m = joinRe.exec(input))) tableMatches.push(m[1]!)
  while ((m = intoRe.exec(input))) tableMatches.push(m[1]!)
  while ((m = updateRe.exec(input))) tableMatches.push(m[1]!)
  // 6. 提取用到的关键字
  const usedKeywords = new Set<string>()
  for (const kw of KEYWORDS) {
    const r = new RegExp(`\\b${kw}\\b`, 'gi')
    if (r.test(input)) usedKeywords.add(kw)
  }
  return {
    ok: issues.length === 0,
    issues,
    stats: {
      tables: Array.from(new Set(tableMatches)),
      keywords: Array.from(usedKeywords).slice(0, 10),
      statements: statements.length,
    },
  }
}

export function SqlTool() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')

  const beautify = () => {
    if (!input.trim()) {
      setError('请输入 SQL')
      setOutput('')
      return
    }
    try {
      setOutput(formatSql(input))
      setError('')
    } catch (e) {
      setError(`SQL 美化失败: ${(e as Error).message}`)
      setOutput('')
    }
  }

  const minify = () => {
    if (!input.trim()) {
      setError('请输入 SQL')
      setOutput('')
      return
    }
    try {
      setOutput(minifySql(input))
      setError('')
    } catch (e) {
      setError(`SQL 压缩失败: ${(e as Error).message}`)
      setOutput('')
    }
  }

  const validate = () => {
    if (!input.trim()) {
      setError('请输入 SQL')
      setOutput('')
      return
    }
    const result = validateSql(input)
    if (!result.ok) {
      setError(`SQL 校验发现问题:\n${result.issues.map((i) => `  - ${i}`).join('\n')}`)
      setOutput('')
      return
    }
    setError('')
    setOutput(
      `✓ SQL 校验通过\n` +
        `语句数: ${result.stats.statements}\n` +
        `涉及表: ${result.stats.tables.length ? result.stats.tables.join(', ') : '(无)'}\n` +
        `使用关键字: ${result.stats.keywords.join(', ')}`,
    )
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 flex-1 h-full">
      {/* 左侧输入区域 */}
      <div className="flex-1 flex flex-col gap-3 min-w-0">
        <label className="text-sm text-muted">输入 SQL</label>
        <div className="flex-1">
          <ContentTextarea value={input} onChange={setInput} placeholder="粘贴 SQL 语句..." />
        </div>
        <div className="flex gap-3 flex-wrap">
          <button onClick={beautify} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors">
            <AlignLeft className="w-4 h-4" /> 美化
          </button>
          <button onClick={minify} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-medium transition-colors">
            <Minimize2 className="w-4 h-4" /> 压缩
          </button>
          <button onClick={validate} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors">
            <ShieldCheck className="w-4 h-4" /> 校验
          </button>
        </div>
        {error && <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-sm whitespace-pre-wrap">{error}</div>}
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
