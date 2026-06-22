import { useState, useEffect, useRef } from 'react'
import { useContentConfig } from '@/contexts/ContentConfigContext'
import { AlignLeft, Search } from 'lucide-react'

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function countMatches(doc: string, query: string, useRegex: boolean): number {
  if (!query) return 0
  try {
    if (useRegex) {
      const re = new RegExp(query, 'g')
      return (doc.match(re) ?? []).length
    }
    const needle = query
    let count = 0
    let idx = 0
    while ((idx = doc.indexOf(needle, idx)) !== -1) {
      count++
      idx += needle.length
    }
    return count
  } catch {
    return -1
  }
}

function doReplace(doc: string, query: string, replacement: string, useRegex: boolean): { text: string; count: number } {
  if (!query) return { text: doc, count: 0 }
  try {
    if (useRegex) {
      const re = new RegExp(query, 'g')
      const m = doc.match(re)
      return { text: doc.replace(re, replacement), count: m ? m.length : 0 }
    }
    const needle = query
    let count = 0
    const text = doc.split(needle).reduce((acc, part, i, arr) => {
      acc.push(part)
      if (i < arr.length - 1) {
        count++
        acc.push(replacement)
      }
      return acc
    }, [] as string[]).join('')
    return { text, count }
  } catch {
    return { text: doc, count: -1 }
  }
}

export function CodeSearchTool() {
  const { contentHeight, fontSize, isFullscreen } = useContentConfig()
  const editorRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [replaceQuery, setReplaceQuery] = useState('')
  const [useRegex, setUseRegex] = useState(false)
  const [caseSensitive, setCaseSensitive] = useState(false)
  const [output, setOutput] = useState('')
  const [matchCount, setMatchCount] = useState(0)

  const defaultCode = `// 代码搜索与替换示例
const users = [
  { id: 1, name: '张三', email: 'zhang@example.com' },
  { id: 2, name: '李四', email: 'li@example.com' },
  { id: 3, name: '王五', email: 'wang@example.com' },
];

function findUserById(id) {
  return users.find(user => user.id === id);
}

function findUserByName(name) {
  return users.find(user => user.name === name);
}

console.log(findUserById(1));
console.log(findUserByName('李四'));

const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);
console.log(doubled);
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
      const { searchKeymap, highlightSelectionMatches, openSearchPanel } = await import('@codemirror/search')
      const { oneDark } = await import('@codemirror/theme-one-dark')

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
        '.cm-searchMatch': {
          backgroundColor: 'rgba(251, 191, 36, 0.3)',
        },
        '.cm-searchMatch-selected': {
          backgroundColor: 'rgba(251, 191, 36, 0.6)',
        },
      })

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
        ],
      })

      view = new EditorView({
        state,
        parent: editorRef.current,
      })

      // Open search panel
      setTimeout(() => {
        openSearchPanel(view)
      }, 100)

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

  const handleFind = () => {
    if (!viewRef.current) return
    const query = searchQuery.trim()
    if (!query) {
      setMatchCount(0)
      setOutput('')
      return
    }
    const doc = viewRef.current.state.doc.toString()
    const haystack = caseSensitive ? doc : doc.toLowerCase()
    const needle = useRegex ? query : (caseSensitive ? query : query.toLowerCase())
    let count: number
    if (useRegex) {
      try {
        const flags = caseSensitive ? 'g' : 'gi'
        const re = new RegExp(query, flags)
        count = (haystack.match(re) ?? []).length
      } catch (e) {
        setOutput('正则表达式错误: ' + (e as Error).message)
        setMatchCount(0)
        return
      }
    } else {
      count = countMatches(haystack, needle, false)
    }
    setMatchCount(count)
    setOutput(count > 0 ? `找到 ${count} 个匹配` : '无匹配')
  }

  const handleReplace = () => {
    if (!viewRef.current) return
    const query = searchQuery.trim()
    if (!query) {
      setOutput('请输入要替换的内容')
      return
    }
    const doc = viewRef.current.state.doc.toString()
    const flags = caseSensitive ? 'g' : 'gi'
    let count: number
    let newText: string
    try {
      if (useRegex) {
        const re = new RegExp(query, flags)
        const matches = doc.match(re)
        count = matches ? matches.length : 0
        newText = doc.replace(re, replaceQuery)
      } else {
        const result = doReplace(doc, query, replaceQuery, false)
        newText = result.text
        count = result.count
      }
    } catch (e) {
      setOutput('替换失败: ' + (e as Error).message)
      return
    }
    viewRef.current.dispatch({
      changes: { from: 0, to: doc.length, insert: newText },
    })
    setMatchCount(count)
    setOutput(`已将 "${query}" 替换为 "${replaceQuery}",共 ${count} 处`)
  }

  return (
    <div className="flex flex-col gap-4 flex-1">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="px-4 py-2 rounded-lg bg-secondary border border-primary text-primary font-medium flex items-center gap-2">
          <Search className="w-4 h-4 text-teal-500" /> 代码搜索
        </div>
        <input
          type="text"
          placeholder="搜索内容..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleFind()}
          className="px-4 py-2 rounded-lg bg-input border border-primary text-primary focus:border-emerald-500 outline-none"
        />
        <input
          type="text"
          placeholder="替换为..."
          value={replaceQuery}
          onChange={(e) => setReplaceQuery(e.target.value)}
          className="px-4 py-2 rounded-lg bg-input border border-primary text-primary focus:border-emerald-500 outline-none"
        />
        <label className="flex items-center gap-1 text-xs text-muted cursor-pointer select-none">
          <input type="checkbox" checked={useRegex} onChange={(e) => setUseRegex(e.target.checked)} />
          正则
        </label>
        <label className="flex items-center gap-1 text-xs text-muted cursor-pointer select-none">
          <input type="checkbox" checked={caseSensitive} onChange={(e) => setCaseSensitive(e.target.checked)} />
          区分大小写
        </label>
        <button
          onClick={handleFind}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors"
        >
          <Search className="w-4 h-4" /> 查找
        </button>
        <button
          onClick={handleReplace}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-medium transition-colors"
        >
          <AlignLeft className="w-4 h-4" /> 替换
        </button>
        {matchCount > 0 && <span className="text-sm text-emerald-400">找到 {matchCount} 个匹配</span>}
        {output && <span className="text-sm text-muted">{output}</span>}
      </div>

      <div className="flex-1 min-h-[400px] border border-primary rounded-lg overflow-hidden bg-input">
        <div ref={editorRef} className="h-full" />
      </div>

      <div className="text-xs text-muted flex gap-4 flex-wrap">
        <span>快捷键: Ctrl/Cmd + F 搜索</span>
        <span>Ctrl/Cmd + H 替换</span>
        <span>支持正则表达式</span>
      </div>
    </div>
  )
}
