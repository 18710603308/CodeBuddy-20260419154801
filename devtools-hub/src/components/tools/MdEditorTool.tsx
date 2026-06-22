import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { Copy, FileText } from 'lucide-react'
import { useContentConfig, ContentConfigContext } from '@/contexts/ContentConfigContext'

export function MdEditorTool() {
  const { contentHeight, fontSize, isFullscreen } = useContentConfig()
  const editorRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<any>(null)
  const [output, setOutput] = useState('')

  const defaultCode = `# Markdown 编辑器

## 特性

- **实时预览** - 所见即所得
- **语法高亮** - 代码块自动着色
- **快捷键支持** - 常用操作一键完成

## 代码示例

\`\`\`javascript
function hello(name) {
  return \`Hello, \${name}!\`;
}
\`\`\`

## 表格

| 功能 | 状态 |
|------|------|
| 标题 | ✅ |
| 列表 | ✅ |
| 链接 | ✅ |

## 引用

> 这是一段引用文字
> 可以多行

## 列表

1. 第一项
2. 第二项
3. 第三项
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
      const { markdown } = await import('@codemirror/lang-markdown')

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
            indentWithTab
          ]),
          EditorView.lineWrapping,
          markdown(),
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
          <FileText className="w-4 h-4 text-slate-400" /> Markdown
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors"
        >
          <Copy className="w-4 h-4" /> 复制代码
        </button>
        {output && <span className="text-sm text-emerald-400">{output}</span>}
      </div>

      <div className="flex-1 min-h-[400px] border border-primary rounded-lg overflow-hidden bg-input">
        <div ref={editorRef} className="h-full" />
      </div>

      <div className="text-xs text-muted flex gap-4">
        <span>Markdown 语法</span>
        <span>代码块高亮</span>
        <span>链接支持</span>
      </div>
    </div>
  )
}
