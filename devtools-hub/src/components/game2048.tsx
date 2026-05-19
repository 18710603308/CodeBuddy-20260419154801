import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Home, RotateCcw, ChevronRight, Sun, Moon } from 'lucide-react'

// 2048 游戏
export function Game2048() {
  const [grid, setGrid] = useState<number[][]>([])
  const [score, setScore] = useState(0)
  const [bestScore, setBestScore] = useState(0)
  const [isGameOver, setIsGameOver] = useState(false)
  const [isWon, setIsWon] = useState(false)
  const [isDark, setIsDark] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [screenWidth, setScreenWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 375)
  const gameContainerRef = useRef<HTMLDivElement>(null)
  const tileIdRef = useRef(0)

  // 检测移动端
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768 || 'ontouchstart' in window
      setIsMobile(mobile)
      setScreenWidth(window.innerWidth)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // 计算格子大小
  const CELL_SIZE = isMobile
    ? Math.max(48, Math.min(64, Math.floor((screenWidth - 48) / 4)))
    : 100
  const GAP = isMobile ? 8 : 12

  // 主题
  useEffect(() => {
    const theme = localStorage.getItem('devtools-theme')
    setIsDark(theme !== 'light')
  }, [])

  const toggleTheme = () => {
    const newTheme = isDark ? 'light' : 'dark'
    setIsDark(!isDark)
    localStorage.setItem('devtools-theme', newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
  }

  // 主题样式
  const theme = {
    bg: isDark ? 'from-amber-700 via-orange-600 to-red-700' : 'from-amber-200 via-orange-300 to-red-300',
    headerBg: isDark ? 'bg-black/30' : 'bg-white/70',
    border: isDark ? 'border-white/10' : 'border-orange-800/20',
    text: isDark ? 'text-white' : 'text-orange-900',
    textSubtle: isDark ? 'text-white/60' : 'text-orange-700/70',
    cardBg: isDark ? 'bg-orange-800/50' : 'bg-orange-400/60',
    gridBg: isDark ? 'bg-orange-900/50' : 'bg-orange-500/30',
    primaryBtn: isDark ? 'from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600' : 'from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500',
    overlay: isDark ? 'bg-black/60' : 'bg-black/30',
  }

  // 获取格子颜色
  const getTileColor = (value: number) => {
    const colors: Record<number, { bg: string; text: string }> = {
      0: { bg: 'rgba(238, 228, 218, 0.35)', text: '#776e65' },
      2: { bg: '#eee4da', text: '#776e65' },
      4: { bg: '#ede0c8', text: '#776e65' },
      8: { bg: '#f2b179', text: '#f9f6f2' },
      16: { bg: '#f59563', text: '#f9f6f2' },
      32: { bg: '#f67c5f', text: '#f9f6f2' },
      64: { bg: '#f65e3b', text: '#f9f6f2' },
      128: { bg: '#edcf72', text: '#f9f6f2' },
      256: { bg: '#edcc61', text: '#f9f6f2' },
      512: { bg: '#edc850', text: '#f9f6f2' },
      1024: { bg: '#edc53f', text: '#f9f6f2' },
      2048: { bg: '#edc22e', text: '#f9f6f2' },
    }
    if (value > 2048) {
      return { bg: '#3c3a32', text: '#f9f6f2' }
    }
    return colors[value] || colors[0]
  }

  // 获取格子字体大小
  const getTileFontSize = (value: number) => {
    if (value < 100) return CELL_SIZE * 0.45
    if (value < 1000) return CELL_SIZE * 0.38
    if (value < 10000) return CELL_SIZE * 0.32
    return CELL_SIZE * 0.26
  }

  // 初始化游戏
  const initGame = useCallback(() => {
    const newGrid: number[][] = Array(4).fill(null).map(() => Array(4).fill(0))
    addRandomTile(newGrid)
    addRandomTile(newGrid)
    setGrid(newGrid)
    setScore(0)
    setIsGameOver(false)
    setIsWon(false)
    tileIdRef.current = 0
  }, [])

  // 添加随机数字
  const addRandomTile = (grid: number[][]) => {
    const emptyCells: [number, number][] = []
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        if (grid[i][j] === 0) {
          emptyCells.push([i, j])
        }
      }
    }
    if (emptyCells.length > 0) {
      const [row, col] = emptyCells[Math.floor(Math.random() * emptyCells.length)]
      grid[row][col] = Math.random() < 0.9 ? 2 : 4
    }
  }

  // 复制网格
  const copyGrid = (grid: number[][]): number[][] => {
    return grid.map(row => [...row])
  }

  // 移动并合并
  const moveLeft = (grid: number[][]): { newGrid: number[][]; score: number; moved: boolean } => {
    let scoreAdd = 0
    let moved = false
    const newGrid = copyGrid(grid)

    for (let i = 0; i < 4; i++) {
      const row = newGrid[i].filter(v => v !== 0)
      const newRow: number[] = []

      for (let j = 0; j < row.length; j++) {
        if (j < row.length - 1 && row[j] === row[j + 1]) {
          const merged = row[j] * 2
          newRow.push(merged)
          scoreAdd += merged
          j++
          if (merged === 2048) setIsWon(true)
        } else {
          newRow.push(row[j])
        }
      }

      while (newRow.length < 4) newRow.push(0)

      for (let j = 0; j < 4; j++) {
        if (newGrid[i][j] !== newRow[j]) moved = true
        newGrid[i][j] = newRow[j]
      }
    }

    return { newGrid, score: scoreAdd, moved }
  }

  const moveRight = (grid: number[][]): { newGrid: number[][]; score: number; moved: boolean } => {
    let scoreAdd = 0
    let moved = false
    const newGrid = copyGrid(grid)

    for (let i = 0; i < 4; i++) {
      const row = newGrid[i].filter(v => v !== 0).reverse()
      const newRow: number[] = []

      for (let j = 0; j < row.length; j++) {
        if (j < row.length - 1 && row[j] === row[j + 1]) {
          const merged = row[j] * 2
          newRow.push(merged)
          scoreAdd += merged
          j++
          if (merged === 2048) setIsWon(true)
        } else {
          newRow.push(row[j])
        }
      }

      while (newRow.length < 4) newRow.push(0)
      newRow.reverse()

      for (let j = 0; j < 4; j++) {
        if (newGrid[i][j] !== newRow[j]) moved = true
        newGrid[i][j] = newRow[j]
      }
    }

    return { newGrid, score: scoreAdd, moved }
  }

  const moveUp = (grid: number[][]): { newGrid: number[][]; score: number; moved: boolean } => {
    let scoreAdd = 0
    let moved = false
    const newGrid = copyGrid(grid)

    for (let j = 0; j < 4; j++) {
      const col = [newGrid[0][j], newGrid[1][j], newGrid[2][j], newGrid[3][j]].filter(v => v !== 0)
      const newCol: number[] = []

      for (let i = 0; i < col.length; i++) {
        if (i < col.length - 1 && col[i] === col[i + 1]) {
          const merged = col[i] * 2
          newCol.push(merged)
          scoreAdd += merged
          i++
          if (merged === 2048) setIsWon(true)
        } else {
          newCol.push(col[i])
        }
      }

      while (newCol.length < 4) newCol.push(0)

      for (let i = 0; i < 4; i++) {
        if (newGrid[i][j] !== newCol[i]) moved = true
        newGrid[i][j] = newCol[i]
      }
    }

    return { newGrid, score: scoreAdd, moved }
  }

  const moveDown = (grid: number[][]): { newGrid: number[][]; score: number; moved: boolean } => {
    let scoreAdd = 0
    let moved = false
    const newGrid = copyGrid(grid)

    for (let j = 0; j < 4; j++) {
      const col = [newGrid[3][j], newGrid[2][j], newGrid[1][j], newGrid[0][j]].filter(v => v !== 0)
      const newCol: number[] = []

      for (let i = 0; i < col.length; i++) {
        if (i < col.length - 1 && col[i] === col[i + 1]) {
          const merged = col[i] * 2
          newCol.push(merged)
          scoreAdd += merged
          i++
          if (merged === 2048) setIsWon(true)
        } else {
          newCol.push(col[i])
        }
      }

      while (newCol.length < 4) newCol.push(0)
      newCol.reverse()

      for (let i = 0; i < 4; i++) {
        if (newGrid[i][j] !== newCol[i]) moved = true
        newGrid[i][j] = newCol[i]
      }
    }

    return { newGrid, score: scoreAdd, moved }
  }

  // 检查游戏是否结束
  const checkGameOver = (grid: number[][]): boolean => {
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        if (grid[i][j] === 0) return false
      }
    }
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        const current = grid[i][j]
        if (j < 3 && current === grid[i][j + 1]) return false
        if (i < 3 && current === grid[i + 1][j]) return false
      }
    }
    return true
  }

  // 处理移动
  const handleMove = useCallback((direction: 'left' | 'right' | 'up' | 'down') => {
    if (isGameOver) return

    let result: { newGrid: number[][]; score: number; moved: boolean }

    switch (direction) {
      case 'left':
        result = moveLeft(grid)
        break
      case 'right':
        result = moveRight(grid)
        break
      case 'up':
        result = moveUp(grid)
        break
      case 'down':
        result = moveDown(grid)
        break
    }

    if (result.moved) {
      addRandomTile(result.newGrid)
      setGrid(result.newGrid)
      setScore(prev => {
        const newScore = prev + result.score
        if (newScore > bestScore) {
          setBestScore(newScore)
          localStorage.setItem('2048-best-score', String(newScore))
        }
        return newScore
      })

      if (checkGameOver(result.newGrid)) {
        setIsGameOver(true)
      }
    }
  }, [grid, isGameOver, bestScore])

  // 键盘控制
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isGameOver) return

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault()
          handleMove('left')
          break
        case 'ArrowRight':
          e.preventDefault()
          handleMove('right')
          break
        case 'ArrowUp':
          e.preventDefault()
          handleMove('up')
          break
        case 'ArrowDown':
          e.preventDefault()
          handleMove('down')
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleMove, isGameOver])

  // 鼠标拖拽 & 触摸滑动（统一处理）
  useEffect(() => {
    const container = gameContainerRef.current
    if (!container) return

    let startX = 0
    let startY = 0
    let isDragging = false

    const getDirection = (endX: number, endY: number) => {
      const diffX = endX - startX
      const diffY = endY - startY
      const minSwipe = 12

      if (Math.abs(diffX) > Math.abs(diffY)) {
        if (Math.abs(diffX) > minSwipe) {
          return diffX > 0 ? 'right' : 'left'
        }
      } else {
        if (Math.abs(diffY) > minSwipe) {
          return diffY > 0 ? 'down' : 'up'
        }
      }
      return null
    }

    // 鼠标事件 - 使用全局监听确保拖拽不丢失，实时检测方向
    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true
      startX = e.clientX
      startY = e.clientY
      e.preventDefault()
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return
      e.preventDefault()
      // 实时检测：达到阈值就触发并立即停止拖拽（避免连续触发）
      const dir = getDirection(e.clientX, e.clientY)
      if (dir && !isGameOver) {
        handleMove(dir)
        isDragging = false
      }
    }

    const handleMouseUp = () => {
      isDragging = false
    }

    container.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    // 触摸事件
    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX
      startY = e.touches[0].clientY
    }

    const handleTouchEnd = (e: TouchEvent) => {
      if (isGameOver) return
      const endX = e.changedTouches[0].clientX
      const endY = e.changedTouches[0].clientY
      const dir = getDirection(endX, endY)
      if (dir) handleMove(dir)
    }

    container.addEventListener('mousedown', handleMouseDown)
    container.addEventListener('mousemove', handleMouseMove)
    container.addEventListener('mouseup', handleMouseUp)
    container.addEventListener('mouseleave', () => { isDragging = false })
    container.addEventListener('touchstart', handleTouchStart, { passive: true })
    container.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      container.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      container.removeEventListener('mouseleave', () => {})
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handleMove, isGameOver])

  // 初始化
  useEffect(() => {
    initGame()
    const saved = localStorage.getItem('2048-best-score')
    if (saved) setBestScore(parseInt(saved))
  }, [initGame])

  const gridWidth = CELL_SIZE * 4 + GAP * 5

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.bg} overflow-x-hidden`}>
      {/* Header */}
      <div className={`sticky top-0 z-50 ${theme.headerBg} backdrop-blur-lg border-b ${theme.border} safe-area-top`}>
        <div className={`mx-auto ${isMobile ? 'px-2 py-2' : 'max-w-6xl px-4 py-3'}`}>
          <div className="flex items-center justify-between">
            <Link
              to="/"
              className={`flex items-center gap-1 sm:gap-2 ${theme.textSubtle} hover:${theme.text} transition-colors rounded-lg p-2`}
            >
              <ChevronRight className={`w-4 h-4 sm:w-5 sm:h-5 rotate-180 ${theme.text}`} />
              <Home className={`w-4 h-4 hidden sm:block ${theme.text}`} />
              <span className={`text-sm ${theme.text}`}>{isMobile ? '返回' : '返回首页'}</span>
            </Link>

            <div className={`flex items-center ${isMobile ? 'gap-2' : 'gap-4'}`}>
              <button
                onClick={initGame}
                className={`flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-2 rounded-lg bg-gradient-to-r ${theme.primaryBtn} text-white font-medium transition-all active:scale-95`}
              >
                <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm">重开</span>
              </button>

              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg ${isDark ? 'bg-white/10 hover:bg-white/20 active:bg-white/30' : 'bg-orange-700/20 hover:bg-orange-700/30 active:bg-orange-700/40'} transition-colors`}
              >
                {isDark ? <Sun className={`w-4 h-4 sm:w-5 sm:h-5 ${theme.text}`} /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Game Area */}
      <div className={`flex flex-col items-center ${isMobile ? 'pt-3 px-2 pb-4' : 'p-4'}`}>
        {/* Title */}
        <h1 className={`font-bold mb-2 ${isMobile ? 'text-2xl' : 'text-3xl sm:text-4xl'} ${theme.text}`}>
          2048
        </h1>

        {/* Score */}
        <div className="flex gap-3 mb-4">
          <div className={`px-4 py-2 rounded-lg ${theme.cardBg} ${theme.text} text-center min-w-[80px]`}>
            <div className={`text-xs opacity-70 ${isDark ? '' : 'opacity-80'}`}>分数</div>
            <div className="font-bold text-lg">{score}</div>
          </div>
          <div className={`px-4 py-2 rounded-lg ${theme.cardBg} ${theme.text} text-center min-w-[80px]`}>
            <div className={`text-xs opacity-70 ${isDark ? '' : 'opacity-80'}`}>最高</div>
            <div className="font-bold text-lg">{bestScore}</div>
          </div>
        </div>

        {/* Game Container */}
        <div className="overflow-x-auto w-full flex justify-center" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div
            ref={gameContainerRef}
            className={`relative rounded-xl p-2 sm:p-3 backdrop-blur-sm select-none cursor-grab active:cursor-grabbing flex-shrink-0`}
            style={{
              width: gridWidth + 8,
              backgroundColor: isDark ? 'rgba(180, 120, 80, 0.35)' : 'rgba(210, 170, 130, 0.4)',
            }}
          >
          {/* Grid Background */}
          <div
            className="grid"
            style={{
              gridTemplateColumns: `repeat(4, ${CELL_SIZE}px)`,
              gap: `${GAP}px`,
            }}
          >
            {Array(16).fill(null).map((_, i) => (
              <div
                key={i}
                className="rounded-lg"
                style={{
                  width: CELL_SIZE,
                  height: CELL_SIZE,
                  backgroundColor: isDark ? 'rgba(238, 228, 218, 0.25)' : 'rgba(205, 190, 175, 0.5)',
                }}
              />
            ))}
          </div>

          {/* Tiles */}
          {grid.map((row, i) =>
            row.map((value, j) => {
              if (value === 0) return null
              const colors = getTileColor(value)
              return (
                <div
                  key={`${i}-${j}-${tileIdRef.current}`}
                  className="absolute rounded-lg flex items-center justify-center font-bold transition-all duration-100 select-none pointer-events-none"
                  style={{
                    width: CELL_SIZE,
                    height: CELL_SIZE,
                    left: j * (CELL_SIZE + GAP) + GAP,
                    top: i * (CELL_SIZE + GAP) + GAP,
                    backgroundColor: colors.bg,
                    color: colors.text,
                    fontSize: getTileFontSize(value),
                  }}
                >
                  {value}
                </div>
              )
            })
          )}

          {/* Game Over Overlay */}
          {isGameOver && (
            <div
              className={`absolute inset-0 flex items-center justify-center rounded-xl backdrop-blur-sm ${theme.overlay}`}
              style={{ zIndex: 10 }}
            >
              <div className="text-center">
                <div className={`text-2xl sm:text-3xl font-bold mb-2 ${theme.text}`}>
                  {isWon ? '🎉' : '游戏结束'}
                </div>
                <div className={`${isDark ? 'text-white/80' : theme.textSubtle} text-sm sm:text-base mb-3`}>
                  {isWon ? '恭喜达到 2048！' : `得分: ${score}`}
                </div>
                <button
                  onClick={initGame}
                  className={`px-4 py-2 rounded-lg bg-gradient-to-r ${theme.primaryBtn} text-white font-medium active:scale-95 transition-transform`}
                >
                  再来一局
                </button>
              </div>
            </div>
          )}
        </div>
        </div>

        {/* Instructions */}
        <div className="mt-4 sm:mt-6 text-center">
          <h3 className={`${theme.text} font-semibold mb-1 text-sm sm:text-base`}>游戏规则</h3>
          <p className={`${theme.textSubtle} text-xs sm:text-sm leading-relaxed`}>
            使用 <span className="font-bold">方向键</span>、<span className="font-bold">鼠标拖拽</span> 或 <span className="font-bold">滑动屏幕</span> 移动方块。<br />
            相同数字的方块相撞会合并成它们的和。<br />
            达到 <span className="font-bold">2048</span> 即可获胜！
          </p>
        </div>
      </div>
    </div>
  )
}
