import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Home, Sun, Moon, Database, Play, RotateCcw, Eye, CheckCircle2, XCircle,
  Loader2, ChevronRight, BookOpen, Table2, Sparkles, Lightbulb, Terminal, AlertTriangle,
} from 'lucide-react'
import {
  COURSE_CHAPTERS, INIT_SQL, type Chapter, type ContentBlock, type Exercise,
} from '@/data/gaussdb-course'
import type { PGlite } from '@electric-sql/pglite'

/* ================= 类型定义 ================= */

interface QueryResult {
  columns: string[]
  rows: Record<string, unknown>[]
  affectedRows: number | null
}

interface RunOutput {
  results: QueryResult[]
  error?: string
}

interface ExampleState {
  results: QueryResult[] | null
  error: string | null
  running: boolean
}

interface ExerciseState {
  sql: string
  results: QueryResult[] | null
  error: string | null
  running: boolean
  showAnswer: boolean
  answerResults: QueryResult[] | null
  answerError: string | null
  answerRunning: boolean
}

const DEFAULT_EXERCISE_SQL = '-- 在此编写你的 SQL 语句\n'

/* ================= 工具函数 ================= */

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return 'NULL'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function compareResultSets(a: QueryResult[] | null, b: QueryResult[] | null): boolean | null {
  if (!a || !b || a.length === 0 || b.length === 0) return null
  const ra = a[0]
  const rb = b[0]
  const norm = (res: QueryResult) => res.rows.map((r) => JSON.stringify(r)).sort()
  const arrA = norm(ra)
  const arrB = norm(rb)
  if (arrA.length !== arrB.length) return false
  for (let i = 0; i < arrA.length; i++) {
    if (arrA[i] !== arrB[i]) return false
  }
  return true
}

/* ================= 子组件：结果表格 ================= */

function ResultTable({ result, compact }: { result: QueryResult; compact?: boolean }) {
  if (result.rows.length === 0) {
    return <div className="text-xs text-zinc-500 py-2 px-3 italic">（查询返回 0 行）</div>
  }
  return (
    <div className={`overflow-auto ${compact ? 'max-h-56' : 'max-h-96'}`}>
      <table className="w-full text-xs">
        <thead className="sticky top-0">
          <tr className="bg-zinc-800 text-zinc-200">
            <th className="px-3 py-2 text-left font-medium whitespace-nowrap border-b border-zinc-700">#</th>
            {result.columns.map((col) => (
              <th key={col} className="px-3 py-2 text-left font-medium whitespace-nowrap border-b border-zinc-700">{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {result.rows.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-zinc-900/40' : 'bg-zinc-900/80'}>
              <td className="px-3 py-1.5 text-zinc-600 whitespace-nowrap border-b border-zinc-800">{i + 1}</td>
              {result.columns.map((col) => (
                <td key={col} className="px-3 py-1.5 text-zinc-300 whitespace-nowrap border-b border-zinc-800">
                  {formatCell(row[col])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ================= 子组件：SQL 编辑器 (CodeMirror) ================= */

function SqlEditor({ value, onChange, height = 150 }: { value: string; onChange: (v: string) => void; height?: number }) {
  const containerRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const viewRef = useRef<any>(null)
  const onChangeRef = useRef(onChange)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    let cancelled = false
    let view: any = null

    async function init() {
      const [{ EditorState }, { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter }, { defaultKeymap, history, historyKeymap, indentWithTab }, { bracketMatching, indentOnInput, syntaxHighlighting, defaultHighlightStyle }, { closeBrackets, closeBracketsKeymap }, { searchKeymap, highlightSelectionMatches }, { oneDark }, { sql, PostgreSQL }] = await Promise.all([
        import('@codemirror/state'),
        import('@codemirror/view'),
        import('@codemirror/commands'),
        import('@codemirror/language'),
        import('@codemirror/autocomplete'),
        import('@codemirror/search'),
        import('@codemirror/theme-one-dark'),
        import('@codemirror/lang-sql'),
      ])
      if (cancelled || !containerRef.current) return

      const updateListener = EditorView.updateListener.of((u: { docChanged: boolean; state: { doc: { toString: () => string } } }) => {
        if (u.docChanged) onChangeRef.current(u.state.doc.toString())
      })

      const state = EditorState.create({
        doc: value,
        extensions: [
          lineNumbers(),
          highlightActiveLineGutter(),
          history(),
          bracketMatching(),
          closeBrackets(),
          indentOnInput(),
          syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
          keymap.of([...closeBracketsKeymap, ...defaultKeymap, ...searchKeymap, ...historyKeymap, indentWithTab]),
          sql({ dialect: PostgreSQL }),
          EditorView.lineWrapping,
          highlightSelectionMatches(),
          oneDark,
          updateListener,
          EditorView.theme({
            '&': { height: `${height}px`, fontSize: '13px' },
            '.cm-scroller': { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace', lineHeight: '1.5' },
            '.cm-content': { padding: '8px 0' },
          }),
        ],
      })

      view = new EditorView({ state, parent: containerRef.current })
      viewRef.current = view
    }

    init()
    return () => {
      cancelled = true
      viewRef.current?.destroy()
      viewRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    const current = view.state.doc.toString()
    if (value !== current) {
      view.dispatch({ changes: { from: 0, to: current.length, insert: value } })
    }
  }, [value])

  return <div ref={containerRef} className="w-full overflow-hidden rounded-lg border border-zinc-800 bg-[#282c34]" />
}

/* ================= 子组件：运行输出面板 ================= */

function OutputPanel({ output }: { output: RunOutput }) {
  if (output.error) {
    return (
      <div className="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 p-3">
        <div className="flex items-start gap-2">
          <XCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
          <div>
            <div className="text-xs font-medium text-red-300 mb-1">执行出错</div>
            <pre className="text-xs text-red-200/90 whitespace-pre-wrap font-mono">{output.error}</pre>
          </div>
        </div>
      </div>
    )
  }
  if (!output.results.length) return null
  return (
    <div className="mt-3 space-y-2">
      {output.results.map((r, i) => (
        <div key={i} className="rounded-lg border border-zinc-700/60 bg-zinc-900/50 overflow-hidden">
          <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-800/60 border-b border-zinc-700/60">
            <span className="text-[11px] text-zinc-400">
              {r.affectedRows !== null && r.affectedRows >= 0
                ? `✓ 成功，影响 ${r.affectedRows} 行`
                : `结果集 ${r.columns.length} 列 / ${r.rows.length} 行`}
            </span>
          </div>
          <ResultTable result={r} compact />
        </div>
      ))}
    </div>
  )
}

/* ================= 主组件 ================= */

export function GaussDBLearn() {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('devtools-theme')
    return saved ? saved === 'dark' : true
  })
  const [activeChapterId, setActiveChapterId] = useState(COURSE_CHAPTERS[0].id)
  const [dbReady, setDbReady] = useState(false)
  const [dbLoading, setDbLoading] = useState(false)
  const [dbError, setDbError] = useState('')
  const dbRef = useRef<PGlite | null>(null)

  const [exampleStates, setExampleStates] = useState<Record<string, ExampleState>>({})
  const [exerciseStates, setExerciseStates] = useState<Record<string, ExerciseState>>({})

  const activeChapter = COURSE_CHAPTERS.find((c) => c.id === activeChapterId) ?? COURSE_CHAPTERS[0]

  useEffect(() => {
    const theme = isDark ? 'dark' : 'light'
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('devtools-theme', theme)
  }, [isDark])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [activeChapterId])

  /* ---------- 数据库初始化 ---------- */
  const initDb = useCallback(async () => {
    setDbLoading(true)
    setDbError('')
    try {
      const { PGlite } = await import('@electric-sql/pglite')
      const db = new PGlite()
      await db.waitReady
      await db.exec(INIT_SQL)
      dbRef.current = db
      setDbReady(true)
    } catch (e) {
      setDbError((e as Error)?.message || String(e))
    } finally {
      setDbLoading(false)
    }
  }, [])

  useEffect(() => {
    initDb()
  }, [initDb])

  const resetDb = useCallback(async () => {
    const old = dbRef.current
    dbRef.current = null
    if (old) {
      try { await old.close() } catch { /* ignore */ }
    }
    setDbReady(false)
    setExampleStates({})
    setExerciseStates({})
    await initDb()
  }, [initDb])

  /* ---------- SQL 执行 ---------- */
  const runSql = useCallback(async (sql: string): Promise<RunOutput> => {
    const db = dbRef.current
    if (!db) return { results: [], error: '数据库尚未就绪，请稍候…' }
    try {
      const res = await db.exec(sql)
      return {
        results: res.map((r) => ({
          columns: r.fields.map((f) => f.name),
          rows: r.rows as Record<string, unknown>[],
          affectedRows: r.affectedRows ?? null,
        })),
      }
    } catch (e) {
      return { results: [], error: (e as Error)?.message || String(e) }
    }
  }, [])

  /* ---------- 示例运行 ---------- */
  const runExample = useCallback(async (chapterId: string, index: number, sql: string) => {
    const key = `${chapterId}-${index}`
    setExampleStates((prev) => ({ ...prev, [key]: { results: null, error: null, running: true } }))
    const out = await runSql(sql)
    setExampleStates((prev) => ({ ...prev, [key]: { results: out.results, error: out.error ?? null, running: false } }))
  }, [runSql])

  /* ---------- 练习运行 ---------- */
  const runExercise = useCallback(async (exercise: Exercise) => {
    const st = exerciseStates[exercise.id]
    const sql = st?.sql || DEFAULT_EXERCISE_SQL
    setExerciseStates((prev) => ({
      ...prev,
      [exercise.id]: { ...prev[exercise.id], running: true, error: null, results: null, answerResults: null, answerError: null },
    }))
    const out = await runSql(sql)
    setExerciseStates((prev) => ({
      ...prev,
      [exercise.id]: { ...prev[exercise.id], running: false, results: out.results, error: out.error ?? null },
    }))
  }, [exerciseStates, runSql])

  const runAnswer = useCallback(async (exercise: Exercise) => {
    setExerciseStates((prev) => ({
      ...prev,
      [exercise.id]: { ...prev[exercise.id], answerRunning: true, answerError: null, answerResults: null },
    }))
    const out = await runSql(exercise.answer)
    setExerciseStates((prev) => ({
      ...prev,
      [exercise.id]: { ...prev[exercise.id], answerRunning: false, answerResults: out.results, answerError: out.error ?? null },
    }))
  }, [runSql])

  const toggleAnswer = useCallback((exercise: Exercise) => {
    setExerciseStates((prev) => {
      const cur = prev[exercise.id] ?? { sql: DEFAULT_EXERCISE_SQL, showAnswer: false } as ExerciseState
      return { ...prev, [exercise.id]: { ...cur, showAnswer: !cur.showAnswer } }
    })
  }, [])

  /* ---------- 内容渲染 ---------- */
  const renderBlock = (block: ContentBlock, chapterId: string, index: number) => {
    switch (block.type) {
      case 'p':
        return <p key={index} className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">{block.text}</p>
      case 'list':
        return (
          <div key={index}>
            {block.title && <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 mb-2">{block.title}</div>}
            <ul className="space-y-1.5">
              {block.items.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                  <ChevronRight className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="font-mono text-[13px]">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )
      case 'note':
        return (
          <div key={index} className="flex items-start gap-2.5 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-700 dark:text-amber-300">{block.text}</p>
          </div>
        )
      case 'table':
        return (
          <div key={index} className="overflow-auto rounded-lg border border-zinc-700/60">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200">
                  {block.headers.map((h) => (
                    <th key={h} className="px-3 py-2 text-left font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, i) => (
                  <tr key={i} className="border-t border-zinc-200 dark:border-zinc-700/60 bg-white dark:bg-zinc-900/40">
                    {row.map((cell, j) => (
                      <td key={j} className="px-3 py-1.5 text-zinc-600 dark:text-zinc-300 whitespace-nowrap">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      case 'code': {
        const key = `${chapterId}-${index}`
        const st = exampleStates[key]
        return (
          <div key={index} className="rounded-lg border border-zinc-700/70 overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 bg-zinc-800/80 border-b border-zinc-700/70">
              <span className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                {block.title || '示例 SQL'}
              </span>
              <button
                onClick={() => runExample(chapterId, index, block.sql)}
                disabled={!dbReady || st?.running}
                className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-medium transition-colors"
              >
                {st?.running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                运行示例
              </button>
            </div>
            <pre className="px-4 py-3 bg-[#1e2126] text-[13px] leading-relaxed text-emerald-100/90 overflow-auto font-mono whitespace-pre">{block.sql}</pre>
            {block.desc && <div className="px-4 py-2 bg-zinc-900/60 border-t border-zinc-800 text-xs text-zinc-400">{block.desc}</div>}
            {st && (st.results || st.error) && (
              <div className="border-t border-zinc-800">
                <OutputPanel output={{ results: st.results ?? [], error: st.error ?? undefined }} />
                <div className="px-3 pb-3">
                  {!st.error && st.results && st.results.length > 0 && (
                    <button
                      onClick={() => setExampleStates((prev) => ({ ...prev, [key]: { ...prev[key], results: null, error: null } }))}
                      className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      × 收起结果
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )
      }
      default:
        return null
    }
  }

  const renderExercise = (exercise: Exercise, index: number) => {
    const st = exerciseStates[exercise.id] ?? { sql: DEFAULT_EXERCISE_SQL, showAnswer: false } as ExerciseState
    const userOut = st.results ? { results: st.results, error: st.error ?? undefined } : st.error ? { results: [], error: st.error } : null
    const answerOut = st.answerResults ? { results: st.answerResults, error: st.answerError ?? undefined } : st.answerError ? { results: [], error: st.answerError } : null
    const match = compareResultSets(st.results, st.answerResults)
    return (
      <div key={exercise.id} className="rounded-xl border border-zinc-700/60 bg-zinc-900/40 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3 mb-1">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-emerald-600/20 border border-emerald-600/40 text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0">
              {index + 1}
            </span>
            <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{exercise.title}</h4>
          </div>
        </div>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-3 mt-2">{exercise.description}</p>

        {exercise.hint && (
          <div className="flex items-start gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-3 py-2 mb-3">
            <Lightbulb className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
            <span className="text-xs text-emerald-700 dark:text-emerald-300 font-mono">{exercise.hint}</span>
          </div>
        )}

        <SqlEditor
          value={st.sql}
          onChange={(v) => setExerciseStates((prev) => ({
            ...prev,
            [exercise.id]: { ...(prev[exercise.id] ?? { showAnswer: false }), sql: v },
          }))}
          height={140}
        />

        <div className="flex flex-wrap items-center gap-2 mt-3">
          <button
            onClick={() => runExercise(exercise)}
            disabled={!dbReady || st.running}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
          >
            {st.running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            运行
          </button>
          <button
            onClick={() => toggleAnswer(exercise)}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-zinc-200 text-sm font-medium transition-colors"
          >
            <Eye className="w-4 h-4" />
            {st.showAnswer ? '隐藏答案' : '查看答案'}
          </button>
        </div>

        {!dbReady && !dbError && (
          <div className="mt-3 text-xs text-zinc-500 flex items-center gap-1.5">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> 数据库引擎加载中…
          </div>
        )}

        {userOut && <OutputPanel output={userOut} />}

        {st.showAnswer && (
          <div className="mt-4 rounded-lg border border-indigo-500/40 bg-indigo-500/10 overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 bg-indigo-500/15 border-b border-indigo-500/40">
              <span className="text-xs font-medium text-indigo-300">参考答案</span>
              <button
                onClick={() => runAnswer(exercise)}
                disabled={!dbReady || st.answerRunning}
                className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-medium transition-colors"
              >
                {st.answerRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                运行答案
              </button>
            </div>
            <pre className="px-4 py-3 bg-[#1e2126] text-[13px] leading-relaxed text-indigo-100/90 overflow-auto font-mono whitespace-pre">{exercise.answer}</pre>
            {exercise.answerNote && <div className="px-4 py-2 bg-zinc-900/60 border-t border-zinc-800 text-xs text-zinc-400">{exercise.answerNote}</div>}
            {answerOut && <OutputPanel output={answerOut} />}
            {match !== null && (
              <div className={`flex items-center gap-2 px-4 py-2.5 border-t text-sm font-medium ${match ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                {match ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                {match ? '你的结果与参考答案一致，回答正确！' : '你的结果与参考答案不一致，请检查查询逻辑（比对忽略行顺序）。'}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  const completedCount = COURSE_CHAPTERS.reduce((acc, ch) => acc + ch.exercises.filter((ex) => {
    const st = exerciseStates[ex.id]
    return st?.results && !st.error
  }).length, 0)
  const totalExercises = COURSE_CHAPTERS.reduce((acc, ch) => acc + ch.exercises.length, 0)

  /* ================= 页面 ================= */
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/80 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-accent transition-colors text-sm text-muted-foreground">
              <Home className="w-4 h-4" /> 返回首页
            </Link>
            <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-border">
              <Database className="w-5 h-5 text-emerald-500" />
              <div>
                <h1 className="text-sm font-bold leading-tight">GaussDB 在线学习</h1>
                <p className="text-[11px] text-muted-foreground">华为云数据库 · 内置 SQL 练习环境</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-xs text-emerald-500 font-medium">
                {dbReady ? '数据库引擎已就绪' : dbError ? '引擎加载失败' : '数据库引擎加载中…'}
              </span>
            </div>
            {dbReady && (
              <button
                onClick={resetDb}
                title="重置数据库到初始状态"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" /> 重置数据
              </button>
            )}
            <button
              onClick={() => setIsDark((v) => !v)}
              className="p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground"
              title={isDark ? '切换到亮色模式' : '切换到暗色模式'}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {dbError && (
        <div className="max-w-7xl mx-auto px-4 pt-4">
          <div className="flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            <XCircle className="w-4 h-4" /> 数据库引擎初始化失败：{dbError}（请刷新页面重试）
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* 进度提示 */}
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
          <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">共 {COURSE_CHAPTERS.length} 章</span>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground">{totalExercises} 道练习题</span>
          <span className="text-muted-foreground">·</span>
          <span className={completedCount > 0 ? 'text-emerald-500 font-medium' : 'text-muted-foreground'}>
            已完成 {completedCount}/{totalExercises}
          </span>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* 左侧目录 */}
          <aside className="lg:w-64 shrink-0">
            <div className="lg:sticky lg:top-20">
              <div className="rounded-xl border border-border bg-card p-2">
                <div className="px-2 py-2 text-[11px] font-semibold text-muted-foreground tracking-wider uppercase">课程目录</div>
                <nav className="flex lg:flex-col gap-1 overflow-x-auto pb-1 lg:pb-0">
                  {COURSE_CHAPTERS.map((ch, i) => {
                    const active = ch.id === activeChapterId
                    const done = ch.exercises.length > 0 && ch.exercises.every((ex) => {
                      const st = exerciseStates[ex.id]
                      return st?.results && !st.error
                    })
                    return (
                      <button
                        key={ch.id}
                        onClick={() => setActiveChapterId(ch.id)}
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left whitespace-nowrap lg:whitespace-normal transition-colors ${active ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30' : 'hover:bg-accent text-muted-foreground border border-transparent'}`}
                      >
                        <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0 ${active ? 'bg-emerald-500 text-white' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'}`}>{i + 1}</span>
                        <span className="text-[13px] font-medium leading-tight">{ch.title}</span>
                        {done && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 ml-auto" />}
                      </button>
                    )
                  })}
                </nav>
              </div>

              {/* 数据表结构速览 */}
              <div className="mt-4 rounded-xl border border-border bg-card p-4 hidden lg:block">
                <div className="flex items-center gap-2 mb-3">
                  <Table2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-semibold text-foreground">示例数据库结构</span>
                </div>
                <div className="space-y-3 text-[12px]">
                  <div>
                    <div className="font-mono text-emerald-500 mb-1">departments 部门表</div>
                    <div className="text-muted-foreground font-mono">dept_id · dept_name · location</div>
                  </div>
                  <div>
                    <div className="font-mono text-emerald-500 mb-1">jobs 职位表</div>
                    <div className="text-muted-foreground font-mono">job_id · job_title · min_salary · max_salary</div>
                  </div>
                  <div>
                    <div className="font-mono text-emerald-500 mb-1">employees 员工表</div>
                    <div className="text-muted-foreground font-mono">emp_id · emp_name · gender · hire_date · salary · dept_id · job_id</div>
                  </div>
                </div>
                <p className="mt-3 text-[11px] text-muted-foreground leading-relaxed">
                  所有练习在浏览器本地完成，数据不会上传。可随时「重置数据」恢复初始状态。
                </p>
              </div>
            </div>
          </aside>

          {/* 右侧内容 */}
          <main className="flex-1 min-w-0 space-y-6">
            <div className="rounded-xl border border-border bg-card p-5 sm:p-7">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <Database className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">{activeChapter.title}</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">{activeChapter.subtitle}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-5 pb-5 border-b border-border">{activeChapter.intro}</p>
              <div className="space-y-5">
                {activeChapter.blocks.map((block, i) => renderBlock(block, activeChapter.id, i))}
              </div>
            </div>

            {/* 练习题区 */}
            <div className="rounded-xl border border-border bg-card p-5 sm:p-7">
              <div className="flex items-center gap-2.5 mb-1">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <h3 className="text-lg font-bold text-foreground">动手练习</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-5">在本页内置的 GaussDB 兼容数据库中编写 SQL，点击「运行」查看结果；不确定时可用「查看答案」对照参考答案并自动比对。</p>
              <div className="space-y-4">
                {activeChapter.exercises.map((ex, i) => renderExercise(ex, i))}
              </div>
            </div>
          </main>
        </div>
      </div>

      <footer className="border-t border-border py-6 mt-8">
        <p className="text-center text-xs text-muted-foreground">
          本页基于 PGlite (PostgreSQL WASM) 构建，语法兼容 GaussDB · 所有数据仅在本地浏览器运行
        </p>
      </footer>
    </div>
  )
}
