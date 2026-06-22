import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { ArrowLeftRight, Copy } from 'lucide-react'
import { useContentConfig, ContentConfigContext } from '@/contexts/ContentConfigContext'

export function CodeMergeTool() {
  const { contentHeight, fontSize, isFullscreen } = useContentConfig()
  const editorRef = useRef<HTMLDivElement>(null)
  const mergeRef = useRef<any>(null)
  const [selectedLang, setSelectedLang] = useState('javascript')
  const [output, setOutput] = useState('')

  const languages = [
    { id: 'javascript', label: 'JavaScript' },
    { id: 'typescript', label: 'TypeScript' },
    { id: 'python', label: 'Python' },
    { id: 'html', label: 'HTML' },
    { id: 'css', label: 'CSS' },
    { id: 'json', label: 'JSON' },
    { id: 'xml', label: 'XML' },
    { id: 'sql', label: 'SQL' },
  ]

  const defaultA = `// 原始代码 A
function hello() {
  console.log("Hello A");
  return true;
}`

  const defaultB = `// 修改后代码 B
function hello() {
  console.log("Hello World");
  return false;
}`

  useEffect(() => {
    let mergeView: any = null

    const initMerge = async () => {
      if (!editorRef.current) {
        // 等待 DOM 渲染完成
        await new Promise(resolve => setTimeout(resolve, 100))
        if (!editorRef.current) return
      }

      const { MergeView } = await import('@codemirror/merge')
      const { EditorView, keymap, lineNumbers, highlightActiveLine } = await import('@codemirror/view')
      const { defaultKeymap, history, historyKeymap, indentWithTab } = await import('@codemirror/commands')
      const { bracketMatching, indentOnInput, syntaxHighlighting, defaultHighlightStyle } = await import('@codemirror/language')
      const { closeBrackets } = await import('@codemirror/autocomplete')
      const { searchKeymap } = await import('@codemirror/search')
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
        case 'sql': {
          const s = await import('@codemirror/lang-sql')
          langExtension = [s.sql()]
          break
        }
      }

      const editorTheme = EditorView.theme({
        '&': {
          height: '100%',
          fontSize: `${fontSize}px`,
        },
        '.cm-scroller': {
          fontFamily: '"Fira Code", "JetBrains Mono", Consolas, monospace',
          overflow: 'auto',
        },
      })

      // Destroy previous instance
      if (mergeRef.current) {
        mergeRef.current.destroy()
        mergeRef.current = null
      }

      const height = isFullscreen ? Math.min(contentHeight, window.innerHeight - 200) : contentHeight

      mergeView = new MergeView({
        a: {
          doc: defaultA,
          extensions: [
            lineNumbers(),
            highlightActiveLine(),
            history(),
            bracketMatching(),
            closeBrackets(),
            syntaxHighlighting(defaultHighlightStyle),
            oneDark,
            editorTheme,
            keymap.of([...defaultKeymap, ...searchKeymap, ...historyKeymap, indentWithTab]),
            EditorView.lineWrapping,
            ...langExtension,
          ],
        },
        b: {
          doc: defaultB,
          extensions: [
            lineNumbers(),
            highlightActiveLine(),
            history(),
            bracketMatching(),
            closeBrackets(),
            syntaxHighlighting(defaultHighlightStyle),
            oneDark,
            editorTheme,
            keymap.of([...defaultKeymap, ...searchKeymap, ...historyKeymap, indentWithTab]),
            EditorView.lineWrapping,
            ...langExtension,
          ],
        },
        parent: editorRef.current,
        orientation: 'a-b',
        revertControls: 'a-to-b',
        highlightChanges: true,
        gutter: true,
      })

      // Apply height
      const mergeDom = mergeView.dom as HTMLElement
      const container = mergeDom.querySelector('.cm-merge-view') as HTMLElement | null
      if (container) {
        container.style.height = `${height}px`
        container.style.backgroundColor = 'var(--bg-primary)'
      }

      mergeRef.current = mergeView
    }

    initMerge()

    return () => {
      if (mergeRef.current) {
        mergeRef.current.destroy()
        mergeRef.current = null
      }
    }
  }, [selectedLang, contentHeight, fontSize, isFullscreen])

  const getMergedContent = () => {
    if (mergeRef.current) {
      const bEditor = mergeRef.current.b
      if (bEditor) {
        return bEditor.state.doc.toString()
      }
    }
    return ''
  }

  const handleCopy = () => {
    const code = getMergedContent()
    navigator.clipboard.writeText(code)
    setOutput('已复制 B 窗口内容到剪贴板')
    setTimeout(() => setOutput(''), 2000)
  }

  const handleSwap = () => {
    if (mergeRef.current) {
      const aContent = mergeRef.current.a.state.doc.toString()
      const bContent = mergeRef.current.b.state.doc.toString()
      
      mergeRef.current.a.dispatch({
        changes: { from: 0, to: mergeRef.current.a.state.doc.length, insert: bContent }
      })
      mergeRef.current.b.dispatch({
        changes: { from: 0, to: mergeRef.current.b.state.doc.length, insert: aContent }
      })
      setOutput('已交换 A/B 内容')
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
          onClick={handleSwap}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-500 hover:bg-violet-600 text-white font-medium transition-colors"
        >
          <ArrowLeftRight className="w-4 h-4" /> 交换 A/B
        </button>
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors"
        >
          <Copy className="w-4 h-4" /> 复制 B
        </button>

        {output && (
          <span className="text-sm text-emerald-400">{output}</span>
        )}
      </div>

      <div className="flex-1 min-h-[400px] border border-slate-700 rounded-lg overflow-hidden">
        <div ref={editorRef} className="h-full" />
      </div>

      <div className="text-xs text-subtle flex gap-4">
        <span>左侧 (A): 原始代码</span>
        <span>右侧 (B): 修改后代码</span>
        <span>高亮显示差异</span>
      </div>
    </div>
  )
}
