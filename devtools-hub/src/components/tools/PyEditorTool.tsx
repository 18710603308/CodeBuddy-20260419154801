import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useContentConfig, ContentConfigContext } from '@/contexts/ContentConfigContext'
import { Copy, FileJson } from 'lucide-react'

export function PyEditorTool() {
  const { contentHeight, fontSize, isFullscreen } = useContentConfig()
  const editorRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<any>(null)
  const [output, setOutput] = useState('')

  const defaultCode = `# Python 代码编辑器
from typing import List, Optional

class User:
    def __init__(self, name: str, email: str, age: Optional[int] = None):
        self.name = name
        self.email = email
        self.age = age
    
    def greet(self) -> str:
        return f"Hello, {self.name}!"

def fibonacci(n: int) -> List[int]:
    """生成斐波那契数列"""
    if n <= 0:
        return []
    elif n == 1:
        return [0]
    
    fib = [0, 1]
    for i in range(2, n):
        fib.append(fib[i-1] + fib[i-2])
    return fib

users = [
    User("张三", "zhang@example.com", 25),
    User("李四", "li@example.com"),
]

# 列表推导式
squares = [x**2 for x in range(10)]
even_squares = [x**2 for x in range(10) if x % 2 == 0]

print(users[0].greet())
print("斐波那契:", fibonacci(10))
print("平方数:", squares)
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
      const { python } = await import('@codemirror/lang-python')

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
          python(),
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
          <FileJson className="w-4 h-4 text-green-500" /> Python
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
        <span>Python 3 语法</span>
        <span>缩进感知</span>
        <span>智能补全</span>
      </div>
    </div>
  )
}
