import { useState, useEffect, useRef } from 'react'
import { useContentConfig } from '@/contexts/ContentConfigContext'
import { AlertCircle, Copy, CheckCircle2 } from 'lucide-react'

interface LintIssue {
  line: number
  col: number
  severity: 'error' | 'warning'
  rule: string
  message: string
}

/**
 * 简易 JS/TS 规则检查器
 * 不依赖 ESLint，避免引入庞大依赖；用正则 + 启发式检测常见问题
 */
function lintCode(source: string): LintIssue[] {
  const issues: LintIssue[] = []
  const lines = source.split('\n')

  // 1. 未使用的变量 / 函数（识别 const/let/function 声明后从未引用）
  const declared = new Map<string, number>() // name -> line
  const referenced = new Set<string>()
  const declRe = /^\s*(?:const|let|var|function)\s+([A-Za-z_$][\w$]*)\b/g
  const refRe = /\b([A-Za-z_$][\w$]*)\b/g
  lines.forEach((line, i) => {
    let m: RegExpExecArray | null
    const dRe = new RegExp(declRe.source, 'g')
    while ((m = dRe.exec(line))) {
      // 跳过 import / export 形式
      if (/^\s*(import|export)\b/.test(line)) continue
      const name = m[1]
      if (!declared.has(name)) declared.set(name, i + 1)
    }
  })
  // 找引用（去掉声明行再扫）
  lines.forEach((line) => {
    const stripped = line.replace(/\/\/.*$/, '')
    let m: RegExpExecArray | null
    const rRe = new RegExp(refRe.source, 'g')
    while ((m = rRe.exec(stripped))) {
      if (declared.has(m[1])) referenced.add(m[1])
    }
  })
  declared.forEach((line, name) => {
    if (!referenced.has(name)) {
      issues.push({
        line,
        col: 1,
        severity: 'warning',
        rule: 'no-unused-vars',
        message: `未使用的变量 "${name}"`,
      })
    }
  })

  // 2. 缺少分号（启发式：以 [)\]w]/ 结尾的语句缺少 ;）
  lines.forEach((line, i) => {
    const stripped = line.replace(/\/\/.*$/, '').trim()
    if (!stripped || stripped.startsWith('//') || stripped.startsWith('/*')) return
    if (/^(import|export|if|for|while|function|class|const|let|var|\{|\}|return|else)\b/.test(stripped)) return
    if (/[\{\}\(\[]$/.test(stripped)) return
    if (/[+\-*/%=<>!&|]$/.test(stripped)) return
    if (/\b(continue|break|throw|do|try)\b\s*$/.test(stripped)) return
    // 命中启发式规则
    if (/[\)\]a-zA-Z0-9_'"]$/.test(stripped) && !stripped.endsWith(';') && !stripped.endsWith(',')) {
      issues.push({
        line: i + 1,
        col: stripped.length,
        severity: 'warning',
        rule: 'semi',
        message: '可能缺少分号',
      })
    }
  })

  // 3. console.log / debugger 残留
  lines.forEach((line, i) => {
    if (/\bconsole\.(log|debug|info|warn)\s*\(/.test(line)) {
      issues.push({
        line: i + 1,
        col: line.indexOf('console') + 1,
        severity: 'warning',
        rule: 'no-console',
        message: 'console 残留（生产代码建议移除）',
      })
    }
    if (/\bdebugger\s*;?\s*$/.test(line.trim())) {
      issues.push({
        line: i + 1,
        col: 1,
        severity: 'error',
        rule: 'no-debugger',
        message: '发现 debugger 语句',
      })
    }
  })

  // 4. var 关键字
  lines.forEach((line, i) => {
    if (/\bvar\s+/.test(line)) {
      issues.push({
        line: i + 1,
        col: line.indexOf('var') + 1,
        severity: 'warning',
        rule: 'no-var',
        message: '建议使用 let/const 替代 var',
      })
    }
  })

  // 5. == / != 警告
  lines.forEach((line, i) => {
    const m = line.match(/[^=!<>]([=!]=)(?!=)/g)
    if (m) {
      m.forEach(() => {
        issues.push({
          line: i + 1,
          col: 1,
          severity: 'warning',
          rule: 'eqeqeq',
          message: '建议使用 === / !== 替代 == / !=',
        })
      })
    }
  })

  // 6. 空 catch 块
  lines.forEach((line, i) => {
    if (/\bcatch\s*\(.*\)\s*\{\s*\}/.test(line)) {
      issues.push({
        line: i + 1,
        col: 1,
        severity: 'warning',
        rule: 'no-empty',
        message: '空的 catch 块（应至少记录错误）',
      })
    }
  })

  // 7. 行长度
  lines.forEach((line, i) => {
    if (line.length > 120) {
      issues.push({
        line: i + 1,
        col: 121,
        severity: 'warning',
        rule: 'max-len',
        message: `行长度 ${line.length} 超过 120 字符`,
      })
    }
  })

  return issues
}

export function CodeLintTool() {
  const { contentHeight, fontSize, isFullscreen } = useContentConfig()
  const editorRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<any>(null)
  const [output, setOutput] = useState('')
  const [issues, setIssues] = useState<LintIssue[]>([])

  const defaultCode = `// 代码检查示例
const fetchData = async (url) => {
  const response = await fetch(url);
  const data = await response.json();
  return data;
}

// 未使用的变量
const unused = 'hello'

// == 的不安全比较
if (data == null) return

// 行长度警告这是一行故意写得很长的代码以触发 max-len 规则它超过了 120 个字符的限制不报错才怪对吧就是这样
function greet(name) {
  return "Hello, " + name + "!"
}

console.log('debug message')
`

  useEffect(() => {
    let view: any = null

    const initEditor = async () => {
      if (!editorRef.current) return

      const { EditorState } = await import('@codemirror/state')
      const { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } = await import('@codemirror/view')
      const { defaultKeymap, history, historyKeymap, indentWithTab } = await import('@codemirror/commands')
      const { bracketMatching, foldGutter, indentOnInput, syntaxHighlighting, defaultHighlightStyle } = await import('@codemirror/language')
      const { closeBrackets, closeBracketsKeymap } = await import('@codemirror/autocomplete')
      const { searchKeymap, highlightSelectionMatches } = await import('@codemirror/search')
      const { oneDark } = await import('@codemirror/theme-one-dark')
      const { javascript } = await import('@codemirror/lang-javascript')
      const { linter, lintGutter, setDiagnostics } = await import('@codemirror/lint')

      const editorTheme = EditorView.theme({
        '&': {
          height: isFullscreen ? `${Math.min(contentHeight, window.innerHeight - 200)}px` : `${contentHeight}px`,
          fontSize: `${fontSize}px`,
        },
        '.cm-scroller': {
          fontFamily: '"Fira Code", "JetBrains Mono", Consolas, monospace',
          overflow: 'auto',
        },
        '.cm-gutters': {
          backgroundColor: 'var(--bg-secondary)',
          color: 'var(--text-muted)',
          border: 'none',
        },
        '.cm-lintRange-error': {
          backgroundImage: 'none',
          borderBottom: '2px wavy #ef4444',
        },
        '.cm-lintRange-warning': {
          backgroundImage: 'none',
          borderBottom: '2px wavy #f59e0b',
        },
        '.cm-diagnostic-error': {
          borderLeftColor: '#ef4444',
        },
        '.cm-diagnostic-warning': {
          borderLeftColor: '#f59e0b',
        },
      })

      const lintExt = linter(() => {
        const code = view?.state?.doc?.toString() ?? ''
        return lintCode(code).map((it) => ({
          from: (() => {
            // 简单定位：取该行前 line-1 行长度
            const lines = code.split('\n')
            let pos = 0
            for (let i = 0; i < it.line - 1; i++) pos += lines[i].length + 1
            return pos + Math.max(0, it.col - 1)
          })(),
          to: (() => {
            const lines = code.split('\n')
            let pos = 0
            for (let i = 0; i < it.line - 1; i++) pos += lines[i].length + 1
            return pos + (lines[it.line - 1]?.length ?? 1)
          })(),
          severity: it.severity,
          message: `[${it.rule}] ${it.message}`,
        }))
      }, { delay: 250 })

      const state = EditorState.create({
        doc: defaultCode,
        extensions: [
          lineNumbers(),
          highlightActiveLine(),
          highlightActiveLineGutter(),
          history(),
          foldGutter(),
          indentOnInput(),
          bracketMatching(),
          closeBrackets(),
          highlightSelectionMatches(),
          syntaxHighlighting(defaultHighlightStyle),
          oneDark,
          editorTheme,
          keymap.of([
            ...closeBracketsKeymap,
            ...defaultKeymap,
            ...searchKeymap,
            ...historyKeymap,
            indentWithTab,
          ]),
          EditorView.lineWrapping,
          javascript(),
          lintGutter(),
          lintExt,
        ],
      })

      view = new EditorView({
        state,
        parent: editorRef.current,
      })

      viewRef.current = view
    }

    initEditor()

    return () => {
      if (viewRef.current) {
        viewRef.current.destroy()
        viewRef.current = null
      }
    }
  }, [isFullscreen, contentHeight, fontSize])

  const handleLint = () => {
    if (!viewRef.current) return
    const code = viewRef.current.state.doc.toString()
    const found = lintCode(code)
    setIssues(found)
    const errors = found.filter((i) => i.severity === 'error').length
    const warnings = found.filter((i) => i.severity === 'warning').length
    setOutput(
      found.length === 0
        ? '代码检查完成：未发现问题 ✓'
        : `代码检查完成：发现 ${errors} 个错误, ${warnings} 个警告`,
    )
    // 强制编辑器刷新 diagnostic
    import('@codemirror/lint').then(({ setDiagnostics }) => {
      setDiagnostics(viewRef.current.state, [])
      // 触发 linter 重新跑：通过 dispatch 让 state 变化
      viewRef.current.dispatch({ changes: [] })
    })
  }

  const handleCopy = () => {
    if (viewRef.current) {
      const code = viewRef.current.state.doc.toString()
      navigator.clipboard.writeText(code)
      setOutput('代码已复制')
      setTimeout(() => setOutput(''), 2000)
    }
  }

  return (
    <div className="flex flex-col gap-4 flex-1">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="px-4 py-2 rounded-lg bg-secondary border border-primary text-primary font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500" /> 代码检查
        </div>
        <button
          onClick={handleLint}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition-colors"
        >
          <AlertCircle className="w-4 h-4" /> 运行检查
        </button>
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors"
        >
          <Copy className="w-4 h-4" /> 复制代码
        </button>
        {output && <span className="text-sm text-muted">{output}</span>}
      </div>

      <div className="flex-1 min-h-[400px] border border-primary rounded-lg overflow-hidden bg-input">
        <div ref={editorRef} className="h-full" />
      </div>

      {issues.length > 0 ? (
        <div className="border border-primary rounded-lg bg-secondary/50 p-4 max-h-40 overflow-auto">
          <h4 className="text-sm font-medium text-primary mb-2">检查结果（{issues.length}）:</h4>
          {issues.map((it, idx) => (
            <div
              key={idx}
              className={`text-sm mb-1 ${it.severity === 'error' ? 'text-red-400' : 'text-amber-400'}`}
            >
              {it.severity === 'error' ? '❌' : '⚠️'} 第 {it.line} 行 [{it.rule}] {it.message}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> 未发现问题
        </div>
      )}

      <div className="text-xs text-muted flex gap-4 flex-wrap">
        <span>规则: no-unused-vars</span>
        <span>semi</span>
        <span>no-console</span>
        <span>no-var</span>
        <span>eqeqeq</span>
        <span>max-len</span>
      </div>
    </div>
  )
}
