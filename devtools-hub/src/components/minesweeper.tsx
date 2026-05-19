import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Home, Sun, Moon, RotateCcw, Flag, HelpCircle, ChevronRight } from 'lucide-react'

// 关卡配置 - 递进式难度
const LEVELS: { cols: number; rows: number; mines: number; name: string }[] = [
  { name: '入门', cols: 9, rows: 9, mines: 10 },
  { name: '基础', cols: 10, rows: 10, mines: 15 },
  { name: '进阶', cols: 12, rows: 10, mines: 22 },
  { name: '熟练', cols: 14, rows: 12, mines: 32 },
  { name: '精通', cols: 16, rows: 12, mines: 45 },
  { name: '专家', cols: 18, rows: 14, mines: 60 },
  { name: '大师', cols: 20, rows: 14, mines: 78 },
  { name: '宗师', cols: 22, rows: 16, mines: 100 },
  { name: '传说', cols: 26, rows: 16, mines: 130 },
  { name: '噩梦', cols: 28, rows: 18, mines: 160 },
  { name: '地狱', cols: 30, rows: 20, mines: 200 },
  { name: '极限', cols: 32, rows: 20, mines: 240 },
]

type DifficultyType = { id: string; name: string; cols: number; rows: number; mines: number }

// 根据关卡获取难度配置
const getDifficultyByLevel = (level: number): DifficultyType => {
  const config = LEVELS[Math.min(level - 1, LEVELS.length - 1)]
  // 超过预设关卡后继续扩展
  if (level > LEVELS.length) {
    const extra = level - LEVELS.length
    const base = LEVELS[LEVELS.length - 1]
    return {
      id: `level-${level}`,
      name: `关卡 ${level}`,
      cols: Math.min(40, base.cols + extra * 2),
      rows: Math.min(24, base.rows + Math.floor(extra / 2)),
      mines: Math.min(base.mines + extra * 20, base.cols * base.rows - 20)
    }
  }
  return { id: `level-${level}`, ...config }
}

type Cell = {
  isMine: boolean
  isRevealed: boolean
  isFlagged: boolean
  isQuestion: boolean
  neighborMines: number
}

export function Minesweeper() {
  const [level, setLevel] = useState(1)
  const [grid, setGrid] = useState<Cell[][]>([])
  const [gameStatus, setGameStatus] = useState<'idle' | 'playing' | 'won' | 'lost'>('idle')
  const [flagCount, setFlagCount] = useState(0)
  const [time, setTime] = useState(0)
  const [isDark, setIsDark] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [timerActive, setTimerActive] = useState(false)

  const difficulty = getDifficultyByLevel(level)

  // 长按 ref
  const longPressTimer = useRef<number | null>(null)
  const longPressFired = useRef(false)

  // 屏幕尺寸检测
  useEffect(() => {
    const check = () => {
      setIsMobile(window.innerWidth < 640 || 'ontouchstart' in window)
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // 主题同步
  useEffect(() => {
    const saved = localStorage.getItem('devtools-theme')
    setIsDark(saved !== 'light')
  }, [])

  const toggleTheme = () => {
    const n = isDark ? 'light' : 'dark'
    setIsDark(!isDark)
    localStorage.setItem('devtools-theme', n)
    document.documentElement.setAttribute('data-theme', n)
  }

  // 动态格子大小（移动端自适应）
  const getCellSize = () => {
    if (!isMobile) return 28
    const maxW = window.innerWidth - 16 // 左右各8px
    return Math.max(20, Math.min(26, Math.floor(maxW / difficulty.cols)))
  }
  const cellSize = getCellSize()
  const gridWidth = difficulty.cols * cellSize + (difficulty.cols - 1)
  const gridHeight = difficulty.rows * cellSize + (difficulty.rows - 1)

  // 计时器
  useEffect(() => {
    let interval: number | null = null
    if (timerActive && gameStatus === 'playing') interval = window.setInterval(() => setTime(t => t + 1), 1000)
    return () => { if (interval) clearInterval(interval) }
  }, [timerActive, gameStatus])

  // 初始化
  const initGame = useCallback(() => {
    const { cols, rows } = difficulty
    const newGrid: Cell[][] = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => ({
        isMine: false, isRevealed: false, isFlagged: false, isQuestion: false, neighborMines: 0,
      }))
    )
    setGrid(newGrid)
    setFlagCount(0)
    setTime(0)
    setGameStatus('idle')
    setTimerActive(false)
  }, [difficulty])

  // 下一关
  const nextLevel = useCallback(() => {
    setLevel(l => l + 1)
  }, [])

  // 重新开始当前关卡
  const restartLevel = useCallback(() => {
    initGame()
  }, [initGame])

  useEffect(() => { initGame() }, [initGame])

  // 布雷
  const placeMines = useCallback((g: Cell[][], fx: number, fy: number) => {
    const { cols, rows, mines } = difficulty
    let placed = 0
    while (placed < mines) {
      const x = Math.floor(Math.random() * cols), y = Math.floor(Math.random() * rows)
      if (!g[y][x].isMine && Math.abs(x - fx) > 1 || Math.abs(y - fy) > 1) {
        g[y][x].isMine = true; placed++
      }
    }
    for (let y = 0; y < rows; y++)
      for (let x = 0; x < cols; x++)
        if (!g[y][x].isMine) {
          let c = 0
          for (let dy = -1; dy <= 1; dy++)
            for (let dx = -1; dx <= 1; dx++) {
              const nx = x + dx, ny = y + dy
              if (nx >= 0 && nx < cols && ny >= 0 && ny < rows && g[ny][nx].isMine) c++
            }
          g[y][x].neighborMines = c
        }
    return g
  }, [difficulty])

  // 胜利检测
  const checkWin = useCallback((g: Cell[][]) => {
    const { cols, rows, mines } = difficulty
    let revealed = 0
    for (let y = 0; y < rows; y++)
      for (let x = 0; x < cols; x++)
        if (g[y][x].isRevealed && !g[y][x].isMine) revealed++
    if (revealed === cols * rows - mines) {
      setGameStatus('won')
      setTimerActive(false)
      // 自动进入下一关
      setTimeout(() => {
        setLevel(l => l + 1)
        initGame()
      }, 1500)
    }
  }, [difficulty, initGame])

  // 点击处理
  const handleClick = useCallback((x: number, y: number, rightClick: boolean) => {
    if (gameStatus === 'won' || gameStatus === 'lost') return
    const g = grid.map(r => r.map(c => ({ ...c })))
    const cell = g[y][x]

    if (rightClick) {
      if (cell.isRevealed) { setGrid(g); return }
      if (cell.isFlagged) { cell.isFlagged = false; cell.isQuestion = true; setFlagCount(c => c - 1) }
      else if (cell.isQuestion) { cell.isQuestion = false }
      else { cell.isFlagged = true; setFlagCount(c => c + 1) }
      setGrid(g); return
    }

    if (cell.isFlagged || cell.isQuestion || cell.isRevealed) return

    if (gameStatus !== 'playing') {
      placeMines(g, x, y)
      setGameStatus('playing')
      setTimerActive(true)
    }

    if (cell.isMine) {
      for (let ry = 0; ry < difficulty.rows; ry++)
        for (let rx = 0; rx < difficulty.cols; rx++)
          if (g[ry][rx].isMine) g[ry][rx].isRevealed = true
      setGrid(g); setGameStatus('lost'); setTimerActive(false); return
    }

    cell.isRevealed = true
    if (cell.neighborMines === 0) {
      const q: [number, number][] = [[x, y]]
      const visited = new Set([`${x},${y}`])
      while (q.length) {
        const [cx, cy] = q.shift()!
        for (let dy = -1; dy <= 1; dy++)
          for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy) continue
            const nx = cx + dx, ny = cy + dy, k = `${nx},${ny}`
            if (nx >= 0 && nx < difficulty.cols && ny >= 0 && ny < difficulty.rows &&
                !visited.has(k) && !g[ny][nx].isRevealed && !g[ny][nx].isFlagged) {
              visited.add(k); g[ny][nx].isRevealed = true
              if (g[ny][nx].neighborMines === 0) q.push([nx, ny])
            }
          }
      }
    }
    setGrid(g); checkWin(g)
  }, [grid, gameStatus, difficulty, placeMines, checkWin, level])

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`
  const numColor = (n: number) => ['','#3B82F6','#22C55E','#EF4444','#8B5CF6','#F59E0B','#06B6D4','#EC4899','#6B7280'][n] || '#000'

  // 主题
  const T = {
    bg: isDark ? 'from-emerald-900 via-teal-800 to-cyan-700' : 'from-slate-100 via-gray-100 to-zinc-200',
    hdrBg: isDark ? 'bg-black/30 backdrop-blur-lg' : 'bg-white/85 backdrop-blur-md',
    brd: isDark ? 'border-white/10' : 'border-slate-300/50',
    txt: isDark ? 'text-white' : 'text-slate-900',
    txtSub: isDark ? 'text-white/55' : 'text-slate-500',
    cardBg: isDark ? 'bg-white/10' : 'bg-slate-200/80',
    cardHv: isDark ? 'hover:bg-white/20 active:bg-white/30' : 'hover:bg-slate-300/90 active:bg-slate-400/70',
    gridBg: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.12)',
    cellHid: isDark ? 'bg-gradient-to-b from-teal-600/40 to-cyan-700/35 hover:from-teal-500/45 hover:to-cyan-600/40' : 'bg-gradient-to-b from-slate-300 to-slate-400 hover:from-slate-350 hover:to-slate-450',
    cellRev: isDark ? 'bg-slate-800/60' : 'bg-slate-200/70',
    cellMine: 'bg-red-500',
    flag: isDark ? 'text-red-400 drop-shadow-[0_0_2px_rgba(248,113,113,0.8)]' : 'text-red-600 drop-shadow-[0_0_2px_rgba(220,38,38,0.7)]',
    qst: isDark ? 'text-yellow-400' : 'text-yellow-600',
    btn: isDark ? 'from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600' : 'from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700',
    btnAct: isDark ? 'from-emerald-400 to-teal-400' : 'from-emerald-400 to-green-500',
  }

  // 长按
  const startLP = (x: number, y: number) => {
    longPressFired.current = false
    longPressTimer.current = window.setTimeout(() => {
      longPressFired.current = true
      handleClick(x, y, true)
    }, 400)
  }
  const cancelLP = () => {
    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null }
  }

  const mobilePg = isMobile
  const hdrP = mobilePg ? 'px-2 py-2' : 'max-w-6xl px-4 py-3'
  const hdrGap = mobilePg ? 'gap-2' : 'gap-4'

  return (
    <div className={`min-h-screen bg-gradient-to-br ${T.bg} overflow-x-hidden`}>
      {/* Header */}
      <div className={`sticky top-0 z-50 ${T.hdrBg} border-b ${T.brd} safe-area-top`}>
        <div className={`mx-auto ${hdrP}`}>
          <div className="flex items-center justify-between">
            <Link to="/" className={`flex items-center gap-1 sm:gap-2 ${T.txtSub} hover:${T.txt} transition-colors rounded-lg p-2`}>
              <ChevronRight className={`w-4 h-4 sm:w-5 sm:h-5 rotate-180 ${T.txt}`} />
              <Home className={`w-4 h-4 hidden sm:block ${T.txt}`} />
              <span className={`text-sm ${T.txt}`}>{mobilePg ? '返回' : '返回首页'}</span>
            </Link>

            <div className={`flex items-center ${hdrGap}`}>
              <button onClick={restartLevel}
                className={`flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-2 rounded-lg bg-gradient-to-r ${T.btn} text-white font-medium transition-all active:scale-95`}>
                <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm">{mobilePg ? '重开' : '重开'}</span>
              </button>

              {/* 关卡显示 */}
              <div className={`hidden sm:flex items-center gap-1 px-3 py-1 sm:py-2 rounded-lg ${T.cardBg}`}>
                <span className={`${T.txtSub} text-xs`}>关卡</span>
                <span className={`font-bold text-sm ${T.txt}`}>{level}</span>
              </div>

              <button onClick={toggleTheme}
                className={`p-2 rounded-lg ${T.cardBg} ${T.cardHv} transition-colors`}>
                {isDark ? <Sun className={`w-4 h-4 sm:w-5 sm:h-5 ${T.txt}`} /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />}
              </button>
            </div>
          </div>

          {/* 移动端关卡显示 */}
          <div className="flex sm:hidden justify-center items-center gap-2 mt-2">
            <span className={`${T.txtSub} text-xs`}>关卡</span>
            <span className={`font-bold ${T.txt}`}>{level}</span>
          </div>
        </div>
      </div>

      <div className={`mx-auto ${mobilePg}`}>
        <div className="flex flex-col items-center">
          {/* Status Bar */}
          <div className="flex items-center justify-center gap-3 mb-3 mt-2">
            <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${T.cardBg}`}>
              <Flag className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${T.flag}`} />
              <span className={`font-bold text-xs sm:text-sm ${T.txt}`}>{difficulty.mines - flagCount}</span>
            </div>
            <button onClick={initGame}
              className={`px-3 py-1 rounded-lg bg-gradient-to-r ${T.btn} text-white font-bold text-base sm:text-lg transition-all active:scale-95`}>
              {gameStatus === 'won' ? '😎' : gameStatus === 'lost' ? '😵' : '🙂'}
            </button>
            <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${T.cardBg}`}>
              <span className={`font-bold text-xs sm:text-sm ${T.txt}`}>{fmt(time)}</span>
            </div>
          </div>

          {/* Grid */}
          <div className="overflow-x-auto w-full flex justify-center" style={{ WebkitOverflowScrolling: 'touch' }}>
            <div
              className="grid rounded-xl overflow-hidden shadow-2xl flex-shrink-0"
              style={{
                gridTemplateColumns: `repeat(${difficulty.cols}, ${cellSize}px)`,
                gap: '1px',
                backgroundColor: T.gridBg,
              }}
              onContextMenu={e => e.preventDefault()}
            >
              {grid.map((row, y) => row.map((cell, x) => {
                const { isRevealed: rev, isMine: mine, isFlagged: fl, isQuestion: q, neighborMines: nm } = cell
                return (
                  <div key={`${x}-${y}`}
                    onClick={() => handleClick(x, y, false)}
                    onContextMenu={e => { e.preventDefault(); handleClick(x, y, true) }}
                    onMouseDown={e => { if (!mobilePg && e.button === 0) startLP(x, y) }}
                    onMouseUp={cancelLP}
                    onMouseLeave={cancelLP}
                    onTouchStart={() => startLP(x, y)}
                    onTouchEnd={e => {
                      e.preventDefault()
                      cancelLP()
                      if (!longPressFired.current) handleClick(x, y, false)
                    }}
                    onTouchCancel={cancelLP}
                    className={`flex items-center justify-center font-bold select-none cursor-pointer transition-all duration-75 touch-none ${mobilePg ? 'text-xs' : 'text-sm'} ${rev ? (mine ? T.cellMine : T.cellRev) : T.cellHid} ${gameStatus !== 'playing' && mine && !fl ? T.cellMine : ''}`}
                    style={{ width: cellSize, height: cellSize, color: rev && nm > 0 ? numColor(nm) : 'transparent' }}
                  >
                    {rev ? (
                      mine ? <span className="text-xs">💣</span> : nm > 0 ? nm : null
                    ) : fl ? (
                      <span className={`${mobilePg ? 'text-base' : 'text-lg'} ${T.flag}`}>🚩</span>
                    ) : q ? (
                      <HelpCircle className={`w-3 h-3 sm:w-4 sm:h-4 ${T.qst}`} />
                    ) : null}
                  </div>
                )
              }))}
            </div>
          </div>

          {/* Modal */}
          {(gameStatus === 'won' || gameStatus === 'lost') && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className={`rounded-2xl p-6 sm:p-8 text-center shadow-2xl max-w-xs w-full ${isDark ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 'bg-gradient-to-br from-slate-200 to-slate-300'}`}
                style={{ animation: 'scaleIn 0.3s ease-out' }}>
                <div className="text-5xl sm:text-6xl mb-4">{gameStatus === 'won' ? '🎉' : '💥'}</div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">{gameStatus === 'won' ? '恭喜通关！' : '游戏结束'}</h2>
                <p className="text-slate-700 text-sm sm:text-base mb-2">
                  {gameStatus === 'won' ? `你成功避开了所有地雷！` : '踩到地雷了，再接再厉！'}
                </p>
                {gameStatus === 'won' && (
                  <p className="text-slate-600 text-sm mb-4">即将进入第 {level + 1} 关...</p>
                )}
                <div className="text-slate-700 text-sm mb-6">用时：{fmt(time)}</div>
                <div className="flex gap-3 justify-center flex-wrap">
                  <button onClick={restartLevel}
                    className="px-4 py-2 rounded-lg bg-slate-400/30 hover:bg-slate-400/50 text-slate-700 font-medium transition-all active:scale-95">重玩本关</button>
                  {gameStatus === 'lost' && (
                    <button onClick={() => { setLevel(1); initGame() }}
                      className="px-4 py-2 rounded-lg bg-blue-500/30 hover:bg-blue-500/50 text-slate-700 font-medium transition-all active:scale-95">从头开始</button>
                  )}
                  <button onClick={initGame}
                    className="px-4 py-2 rounded-lg bg-slate-900 text-white font-medium hover:bg-slate-800 transition-all active:scale-95">继续</button>
                </div>
              </div>
            </div>
          )}

          {/* Rules */}
          <div className="mt-4 sm:mt-6 text-center">
            <h3 className={`${T.txt} font-semibold mb-1 text-sm sm:text-base`}>游戏规则</h3>
            <p className={`${T.txtSub} text-xs sm:text-sm leading-relaxed`}>
              点击揭开格子，数字表示周围8格的地雷数。<br />
              右键点击或<strong className={T.txt}>长按</strong>旗帜标记地雷，防止误踩。<br />
              揭开所有非地雷格子即可获胜！
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
