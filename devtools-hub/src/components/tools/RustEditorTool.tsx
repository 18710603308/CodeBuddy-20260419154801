import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { Cog, Copy } from 'lucide-react'
import { useContentConfig, ContentConfigContext } from '@/contexts/ContentConfigContext'

export function RustEditorTool() {
  const { contentHeight, fontSize, isFullscreen } = useContentConfig()
  const editorRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<any>(null)
  const [output, setOutput] = useState('')

  const defaultCode = `// Rust 代码编辑器
use std::collections::HashMap;

struct User {
    name: String,
    email: String,
    age: u32,
}

impl User {
    fn new(name: &str, email: &str, age: u32) -> Self {
        User {
            name: name.to_string(),
            email: email.to_string(),
            age,
        }
    }
    
    fn greet(&self) -> String {
        format!("Hello, {}!", self.name)
    }
}

fn main() {
    let users = vec![
        User::new("张三", "zhang@example.com", 25),
        User::new("李四", "li@example.com", 30),
    ];
    
    for user in &users {
        println!("{}", user.greet());
    }
    
    let mut scores: HashMap<&str, u32> = HashMap::new();
    scores.insert("数学", 95);
    scores.insert("英语", 88);
    
    for (subject, score) in &scores {
        println!("{}: {}", subject, score);
    }
    
    let numbers = vec![1, 2, 3, 4, 5];
    let sum: u32 = numbers.iter().sum();
    println!("Sum: {}", sum);
}
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
      const { rust } = await import('@codemirror/lang-rust')

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
          rust(),
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
          <Cog className="w-4 h-4 text-orange-500" /> Rust
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
        <span>Rust 语法高亮</span>
        <span>生命周期标注</span>
        <span>Trait 支持</span>
      </div>
    </div>
  )
}
