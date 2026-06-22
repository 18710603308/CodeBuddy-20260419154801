import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useContentConfig, ContentConfigContext } from '@/contexts/ContentConfigContext'
import { AlignLeft, Copy, Minimize2 } from 'lucide-react'

export function CodeMirrorTool() {
  const { contentHeight, fontSize, isFullscreen } = useContentConfig()
  const editorRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<any>(null)
  const [selectedLang, setSelectedLang] = useState('javascript')
  const [output, setOutput] = useState('')

  const languages = [
    { id: 'javascript', label: 'JavaScript', ext: 'js' },
    { id: 'typescript', label: 'TypeScript', ext: 'ts' },
    { id: 'python', label: 'Python', ext: 'py' },
    { id: 'html', label: 'HTML', ext: 'html' },
    { id: 'css', label: 'CSS', ext: 'css' },
    { id: 'json', label: 'JSON', ext: 'json' },
    { id: 'xml', label: 'XML', ext: 'xml' },
    { id: 'markdown', label: 'Markdown', ext: 'md' },
    { id: 'sql', label: 'SQL', ext: 'sql' },
    { id: 'yaml', label: 'YAML', ext: 'yaml' },
  ]

  const defaultCode = `// Welcome to CodeMirror Editor
function greet(name) {
  return \`Hello, \${name}!\`;
}

console.log(greet('World'));
`

// ----- 跨语言格式化辅助函数 -----

function formatJsLike(code: string): string {
  // 移除多行注释保留行数
  let result = code
    .replace(/\/\*[\s\S]*?\*\//g, (m) => ' '.repeat(m.length))
  let indent = 0
  const lines: string[] = []
  const cleaned = result.split('\n')
  for (const raw of cleaned) {
    const line = raw.trim()
    if (!line) { lines.push(''); continue }
    // 缩进下降: 闭合花括号/方括号
    let prefix = ''
    let i = 0
    while (i < line.length && (line[i] === '}' || line[i] === ']' || line[i] === ')')) {
      indent = Math.max(0, indent - 1)
      prefix = '  '.repeat(indent) + ' '.repeat(i + 1)
      i++
    }
    if (!prefix) prefix = '  '.repeat(indent)
    let s = prefix + line.slice(i)
    // 升级: 出现 { 或 [ (不在字符串内)
    let inStr = false, strCh = ''
    let openCount = 0, closeCount = 0
    for (let k = 0; k < line.length; k++) {
      const c = line[k]
      if (inStr) { if (c === strCh && line[k - 1] !== '\\') inStr = false; continue }
      if (c === '"' || c === "'" || c === '`') { inStr = true; strCh = c; continue }
      if (c === '{' || c === '[' || c === '(') openCount++
      else if (c === '}' || c === ']' || c === ')') closeCount++
    }
    // 仅在结尾时的开括号升级
    if (/[{\[\(]\s*$/.test(line)) indent += 1
    lines.push(s)
  }
  return lines.join('\n')
}

function formatHtml(code: string): string {
  // 用 textContent / 简单缩进
  const trimmed = code.replace(/<!--[\s\S]*?-->/g, '').replace(/>\s+</g, '><').trim()
  let indent = 0
  const out: string[] = []
  const re = /(<\/?[A-Za-z][^>]*>|[^<]+)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(trimmed))) {
    const t = m[0]
    if (t.startsWith('</')) {
      indent = Math.max(0, indent - 1)
      out.push('  '.repeat(indent) + t)
    } else if (t.startsWith('<') && !t.endsWith('/>') && !/^<(br|hr|img|input|meta|link)/i.test(t)) {
      out.push('  '.repeat(indent) + t)
      indent++
    } else if (t.startsWith('<')) {
      out.push('  '.repeat(indent) + t)
    } else if (t.trim()) {
      out.push('  '.repeat(indent) + t.trim())
    }
  }
  return out.join('\n')
}

function formatCss(code: string): string {
  return code
    .replace(/\s*([{};,:])\s*/g, '$1 ')
    .replace(/}\s*/g, '}\n\n')
    .replace(/{\s*/g, ' {\n  ')
    .replace(/;\s*/g, ';\n  ')
    .replace(/\n  \n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .split('\n')
    .map((l, i, arr) => {
      if (i === arr.length - 1) return l.replace(/  $/, '')
      return l.replace(/  $/, '')
    })
    .join('\n')
    .trim()
}

function formatXmlGeneric(code: string): string {
  // 复用 XmlTool 的逻辑
  const cleaned = code.replace(/^\uFEFF/, '').replace(/>\s+</g, '><').replace(/\s+/g, ' ').trim()
  const lines: string[] = []
  let indent = 0
  const indentStr = '    '
  let i = 0
  while (i < cleaned.length) {
    if (cleaned[i] === '<') {
      const tagEnd = cleaned.indexOf('>', i)
      if (tagEnd === -1) break
      const tag = cleaned.slice(i, tagEnd + 1)
      if (tag.startsWith('<?') || tag.startsWith('<!')) lines.push(tag)
      else if (tag.startsWith('<!--')) lines.push(indentStr.repeat(indent) + tag)
      else if (tag.startsWith('</')) {
        indent = Math.max(0, indent - 1)
        lines.push(indentStr.repeat(indent) + tag)
      } else if (tag.endsWith('/>')) {
        lines.push(indentStr.repeat(indent) + tag)
      } else {
        const afterTag = cleaned.slice(tagEnd + 1)
        const textMatch = afterTag.match(/^([^<]+)</)
        if (textMatch) {
          const text = textMatch[1].trim()
          lines.push(indentStr.repeat(indent) + tag + text + '</' + tag.slice(1, -1) + '>')
          i = tagEnd + 1 + text.length + ('</' + tag.slice(1, -1) + '>').length
          continue
        } else {
          lines.push(indentStr.repeat(indent) + tag)
          indent++
        }
      }
      i = tagEnd + 1
    } else {
      const nextTag = cleaned.indexOf('<', i)
      const end = nextTag === -1 ? cleaned.length : nextTag
      const text = cleaned.slice(i, end).trim()
      if (text) lines.push(indentStr.repeat(indent) + text)
      i = end
    }
  }
  return lines.join('\n')
}

function formatSqlKeywords(code: string): string {
  const kws = ['SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'ORDER BY', 'GROUP BY', 'HAVING', 'LIMIT',
    'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'JOIN', 'ON', 'INSERT INTO', 'VALUES',
    'UPDATE', 'SET', 'DELETE FROM', 'UNION ALL', 'UNION']
  let r = code.replace(/--[^\n]*/g, '')
  kws.forEach((k) => {
    r = r.replace(new RegExp(`\\b${k}\\b`, 'g'), `\n${k}`)
  })
  return r.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => '  ' + l).join('\n')
}

function formatPython(code: string): string {
  const lines = code.split('\n')
  let indent = 0
  const out: string[] = []
  for (const raw of lines) {
    const line = raw.replace(/\s+$/, '')
    if (!line) { out.push(''); continue }
    if (/^\s*(return|pass|break|continue)\b/.test(line)) {
      out.push('    '.repeat(indent) + line.trim())
      continue
    }
    if (/^\s*(def |class |if |for |while |elif |else|try|except|finally|with ).*:\s*$/.test(line)) {
      out.push('    '.repeat(indent) + line.trim())
      indent++
      continue
    }
    if (/^\s*(return|pass|break|continue)\b/.test(line)) {
      out.push('    '.repeat(indent) + line.trim())
      continue
    }
    if (/^\s*(elif|else|except|finally)\b/.test(line)) {
      indent = Math.max(0, indent - 1)
      out.push('    '.repeat(indent) + line.trim())
      indent++
      continue
    }
    out.push('    '.repeat(indent) + line.trim())
  }
  return out.join('\n')
}

function formatYaml(code: string): string {
  return code
    .split('\n')
    .map((l) => l.replace(/\s+$/, ''))
    .filter((l) => l.trim() !== '')
    .map((l) => {
      // 简单保留原有缩进，仅规范化 key: value
      const m = l.match(/^(\s*)(-\s+)?([^:]+):\s*(.*)$/)
      if (m) {
        const lead = m[1] ?? ''
        const dash = m[2] ?? ''
        const key = m[3]!.trim()
        const val = m[4] ?? ''
        return lead + dash + key + ':' + (val ? ' ' + val.trim() : '')
      }
      return l
    })
    .join('\n')
}

function formatMarkdown(code: string): string {
  // 简单: 段落之间加空行, 列表项一致缩进
  return code
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((l) => l.replace(/[ \t]+$/, ''))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

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

      // Language extensions
      let langExtension: any = []
      switch (selectedLang) {
        case 'javascript': {
          const js = await import('@codemirror/lang-javascript')
          langExtension = [js.javascript()]
          break
        }
        case 'typescript': {
          const ts = await import('@codemirror/lang-javascript')
          langExtension = [ts.javascript({ typescript: true })]
          break
        }
        case 'python': {
          const py = await import('@codemirror/lang-python')
          langExtension = [py.python()]
          break
        }
        case 'html': {
          const ht = await import('@codemirror/lang-html')
          langExtension = [ht.html()]
          break
        }
        case 'css': {
          const cs = await import('@codemirror/lang-css')
          langExtension = [cs.css()]
          break
        }
        case 'json': {
          const j = await import('@codemirror/lang-json')
          langExtension = [j.json()]
          break
        }
        case 'xml': {
          const x = await import('@codemirror/lang-xml')
          langExtension = [x.xml()]
          break
        }
        case 'markdown': {
          const m = await import('@codemirror/lang-markdown')
          langExtension = [m.markdown()]
          break
        }
        case 'sql': {
          const s = await import('@codemirror/lang-sql')
          langExtension = [s.sql()]
          break
        }
        case 'yaml': {
          const y = await import('@codemirror/lang-yaml')
          langExtension = [y.yaml()]
          break
        }
      }

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
          keymap.of([
            ...closeBracketsKeymap,
            ...defaultKeymap,
            ...searchKeymap,
            ...historyKeymap,
            indentWithTab
          ]),
          EditorView.lineWrapping,
          EditorView.theme({
            '&': {
              height: isFullscreen ? `${Math.min(contentHeight, window.innerHeight - 200)}px` : `${contentHeight}px`,
              fontSize: `${fontSize}px`,
            },
            '.cm-scroller': {
              fontFamily: '"Fira Code", "JetBrains Mono", Consolas, monospace',
              overflow: 'auto',
            },
            '.cm-content': {
              caretColor: '#fff',
            },
            '.cm-gutters': {
              backgroundColor: '#1e1e1e',
              color: '#858585',
              border: 'none',
            },
          }),
          ...langExtension,
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
  }, [selectedLang, contentHeight, fontSize, isFullscreen])

  const getCode = () => {
    if (viewRef.current) {
      return viewRef.current.state.doc.toString()
    }
    return ''
  }

  const handleCopy = () => {
    const code = getCode()
    navigator.clipboard.writeText(code)
    setOutput('代码已复制到剪贴板')
    setTimeout(() => setOutput(''), 2000)
  }

  const handleFormat = () => {
    const code = getCode()
    try {
      let formatted: string | null = null
      switch (selectedLang) {
        case 'json':
          formatted = JSON.stringify(JSON.parse(code), null, 2)
          break
        case 'javascript':
        case 'typescript':
          formatted = formatJsLike(code)
          break
        case 'html':
          formatted = formatHtml(code)
          break
        case 'css':
          formatted = formatCss(code)
          break
        case 'xml':
          formatted = formatXmlGeneric(code)
          break
        case 'sql':
          formatted = formatSqlKeywords(code)
          break
        case 'python':
          formatted = formatPython(code)
          break
        case 'yaml':
          formatted = formatYaml(code)
          break
        case 'markdown':
          formatted = formatMarkdown(code)
          break
      }
      if (formatted == null) {
        setOutput(`暂不支持 ${selectedLang} 的格式化`)
        setTimeout(() => setOutput(''), 2000)
        return
      }
      if (viewRef.current) {
        viewRef.current.dispatch({
          changes: { from: 0, to: viewRef.current.state.doc.length, insert: formatted },
        })
        setOutput('已格式化 ✓')
        setTimeout(() => setOutput(''), 2000)
      }
    } catch (e) {
      setOutput('格式化失败: ' + (e as Error).message)
      setTimeout(() => setOutput(''), 2000)
    }
  }

  const handleMinify = () => {
    const code = getCode()
    try {
      let minified: string | null = null
      switch (selectedLang) {
        case 'json':
          minified = JSON.stringify(JSON.parse(code))
          break
        case 'javascript':
        case 'typescript':
          minified = code
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .replace(/(^|[^:])\/\/[^\n]*/g, '$1')
            .replace(/\n\s*\n/g, '\n')
            .replace(/\s+/g, ' ')
            .replace(/\s*([{};:,()=<>+\-*/%])\s*/g, '$1')
            .trim()
          break
        case 'css':
          minified = code
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .replace(/\s+/g, ' ')
            .replace(/\s*([{};:,>])\s*/g, '$1')
            .replace(/;}/g, '}')
            .trim()
          break
        case 'html':
          minified = code
            .replace(/<!--[\s\S]*?-->/g, '')
            .replace(/\s+/g, ' ')
            .replace(/>\s+</g, '><')
            .trim()
          break
        case 'xml':
          minified = code.replace(/>\s+</g, '><').replace(/\s+/g, ' ').trim()
          break
        case 'yaml':
          minified = code
            .split('\n')
            .map((l: string) => l.trimEnd())
            .filter((l: string) => l.trim() && !l.trim().startsWith('#'))
            .join('\n')
            .replace(/\n{2,}/g, '\n')
            .trim()
          break
        case 'sql':
          minified = code
            .replace(/--[^\n]*/g, '')
            .replace(/\s+/g, ' ')
            .replace(/\s*([,;()])\s*/g, '$1')
            .trim()
          break
      }
      if (minified == null) {
        setOutput(`暂不支持 ${selectedLang} 的压缩`)
        setTimeout(() => setOutput(''), 2000)
        return
      }
      if (viewRef.current) {
        viewRef.current.dispatch({
          changes: { from: 0, to: viewRef.current.state.doc.length, insert: minified },
        })
        setOutput('已压缩 ✓')
        setTimeout(() => setOutput(''), 2000)
      }
    } catch (e) {
      setOutput('压缩失败: ' + (e as Error).message)
      setTimeout(() => setOutput(''), 2000)
    }
  }

  return (
    <div className="flex flex-col gap-4 flex-1">
      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={selectedLang}
          onChange={(e) => setSelectedLang(e.target.value)}
          className="px-4 py-2 rounded-lg bg-input border border-primary text-slate-200"
        >
          {languages.map(lang => (
            <option key={lang.id} value={lang.id}>{lang.label}</option>
          ))}
        </select>

        <button
          onClick={handleFormat}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors"
        >
          <AlignLeft className="w-4 h-4" /> 美化
        </button>
        <button
          onClick={handleMinify}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-medium transition-colors"
        >
          <Minimize2 className="w-4 h-4" /> 压缩
        </button>
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors"
        >
          <Copy className="w-4 h-4" /> 复制
        </button>

        {output && (
          <span className="text-sm text-emerald-400">{output}</span>
        )}
      </div>

      <div className="flex-1 min-h-[300px] border border-slate-700 rounded-lg overflow-hidden">
        <div ref={editorRef} className="h-full" />
      </div>
    </div>
  )
}
