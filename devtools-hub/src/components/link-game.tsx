import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Home, Sun, Moon, RotateCcw, Trophy, Clock, Zap, ChevronRight, Shuffle, Eye, Settings, Grid3X3, ArrowUp } from 'lucide-react'

// 图标颜色
const ICON_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#F8B500', '#FF6F61', '#6C5CE7', '#00B894', '#E17055',
  '#A29BFE', '#FD79A8', '#00CEC9', '#E84393', '#FDCB6E',
  '#74B9FF', '#55EFC4', '#D63031', '#636E72', '#B2BEC3',
]

// 地图大小配置 - 移动端优先
const MAP_SIZES = [
  { id: 'tiny', name: '微型', cols: 4, rows: 4, iconPairs: 8 },
  { id: 'small', name: '小', cols: 6, rows: 4, iconPairs: 12 },
  { id: 'medium', name: '中', cols: 8, rows: 6, iconPairs: 24 },
  { id: 'large', name: '大', cols: 10, rows: 8, iconPairs: 40 },
  { id: 'xlarge', name: '超大', cols: 12, rows: 8, iconPairs: 48 },
]

// 关卡配置 - 递进式难度
const LEVELS: { cols: number; rows: number; iconPairs: number; name: string }[] = [
  { name: '入门', cols: 4, rows: 4, iconPairs: 8 },
  { name: '基础', cols: 6, rows: 4, iconPairs: 12 },
  { name: '进阶', cols: 6, rows: 6, iconPairs: 18 },
  { name: '熟练', cols: 8, rows: 6, iconPairs: 24 },
  { name: '精通', cols: 8, rows: 8, iconPairs: 32 },
  { name: '专家', cols: 10, rows: 8, iconPairs: 40 },
  { name: '大师', cols: 10, rows: 10, iconPairs: 50 },
  { name: '宗师', cols: 12, rows: 10, iconPairs: 60 },
  { name: '传说', cols: 12, rows: 12, iconPairs: 72 },
  { name: '噩梦', cols: 14, rows: 12, iconPairs: 84 },
  { name: '地狱', cols: 14, rows: 14, iconPairs: 98 },
  { name: '极限', cols: 16, rows: 14, iconPairs: 112 },
]

// 根据关卡获取地图配置
const getMapSizeByLevel = (level: number) => {
  if (level <= LEVELS.length) {
    return LEVELS[level - 1]
  }
  // 超过预设关卡后继续扩展
  const extra = level - LEVELS.length
  const base = LEVELS[LEVELS.length - 1]
  return {
    id: `level-${level}`,
    name: `关卡 ${level}`,
    cols: Math.min(20, base.cols + extra),
    rows: Math.min(16, base.rows + Math.floor(extra / 2)),
    iconPairs: Math.min(base.cols * base.rows - 4, base.iconPairs + extra * 8)
  }
}

type IconType = number
type GameState = 'playing' | 'won'

export function LinkGame() {
  const [tiles, setTiles] = useState<IconType[]>([])
  const [selected, setSelected] = useState<number | null>(null)
  const [matched, setMatched] = useState<Set<number>>(new Set())
  const [hintTiles, setHintTiles] = useState<number[]>([])
  const [score, setScore] = useState(0)
  const [time, setTime] = useState(0)
  const [gameState, setGameState] = useState<GameState>('playing')
  const [isDark, setIsDark] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [level, setLevel] = useState(1)
  const [mapSize, setMapSize] = useState(getMapSizeByLevel(1))
  const [message, setMessage] = useState<string | null>(null)
  const [pathLine, setPathLine] = useState<{ x: number, y: number }[]>([])
  const [isMobile, setIsMobile] = useState(false)
  const [screenWidth, setScreenWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 375)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const tileCanvasesRef = useRef<Map<number, HTMLCanvasElement>>(new Map())

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

  // 计算格子大小 - 移动端响应式
  const TILE_SIZE = isMobile
    ? Math.max(28, Math.min(44, Math.floor((screenWidth - 32) / mapSize.cols)))
    : 50

  const GAP = isMobile ? 2 : 4
  const PADDING = isMobile ? 8 : 16

  // 主题同步
  useEffect(() => {
    const theme = localStorage.getItem('devtools-theme')
    setIsDark(theme !== 'light')
  }, [])

  const toggleTheme = () => {
    const n = isDark ? 'light' : 'dark'
    setIsDark(!isDark)
    localStorage.setItem('devtools-theme', n)
    document.documentElement.setAttribute('data-theme', n)
  }

  // 主题样式
  const T = {
    bg: isDark ? 'from-indigo-900 via-purple-900 to-pink-800' : 'from-indigo-200 via-purple-200 to-pink-300',
    hdrBg: isDark ? 'bg-black/30 backdrop-blur-lg' : 'bg-white/70 backdrop-blur-md',
    hdrBrd: isDark ? 'border-white/10' : 'border-purple-300/30',
    txt: isDark ? 'text-white' : 'text-purple-900',
    txtSub: isDark ? 'text-white/60' : 'text-purple-700/70',
    txtSub2: isDark ? 'text-white/80' : 'text-purple-800/80',
    cardBg: isDark ? 'bg-white/10' : 'bg-purple-200/60',
    cardBg2: isDark ? 'bg-white/10' : 'bg-purple-300/50',
    cardHv: isDark ? 'hover:bg-white/20 active:bg-white/30' : 'hover:bg-purple-300/70 active:bg-purple-400/80',
    boardBg: isDark ? 'bg-black/30 backdrop-blur-sm' : 'bg-purple-300/30 backdrop-blur-sm',
    selBg: isDark ? 'rgba(255,215,0,0.3)' : 'rgba(253,230,138,0.6)',
    btnGrad: isDark ? 'from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600' : 'from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600',
    btnActive: isDark ? 'bg-pink-500' : 'bg-purple-600',
    btnSec: isDark ? 'from-blue-500/30 to-blue-500/30 hover:from-blue-500/50 hover:to-blue-500/50' : 'from-blue-300/40 to-blue-300/40 hover:from-blue-400/50 hover:to-blue-400/50',
    btnThird: isDark ? 'from-purple-500/30 to-purple-500/30 hover:from-purple-500/50 hover:to-purple-500/50' : 'from-purple-300/40 to-purple-300/40 hover:from-purple-400/50 hover:to-purple-400/50',
    modalBg: isDark ? 'bg-gradient-to-br from-yellow-400 to-orange-500' : 'bg-gradient-to-br from-amber-300 to-orange-400',
  }

  // 获取可用的图标数量
  const getAvailableIcons = useCallback(() => {
    return Math.min(mapSize.iconPairs, ICON_COLORS.length)
  }, [mapSize])

  // 检查阻挡
  const hasBlockAt = useCallback((x: number, y: number, currentTiles: IconType[], currentMatched: Set<number>, skipIdx1?: number, skipIdx2?: number): boolean => {
    if (x < 0 || x >= mapSize.cols || y < 0 || y >= mapSize.rows) return false
    const idx = y * mapSize.cols + x
    if (idx === skipIdx1 || idx === skipIdx2) return false
    if (currentMatched.has(idx) || currentTiles[idx] === -1) return false
    return true
  }, [mapSize])

  // 检查两点是否可连接（BFS）
  const canDirectConnect = useCallback((idx1: number, idx2: number, currentTiles: IconType[], currentMatched: Set<number>) => {
    if (currentTiles[idx1] !== currentTiles[idx2]) return { can: false }
    const x1 = idx1 % mapSize.cols, y1 = Math.floor(idx1 / mapSize.cols)
    const x2 = idx2 % mapSize.cols, y2 = Math.floor(idx2 / mapSize.cols)

    const hasBlock = (x: number, y: number) => hasBlockAt(x, y, currentTiles, currentMatched, idx1, idx2)
    const inBounds = (x: number, y: number) => x >= -1 && x <= mapSize.cols && y >= -1 && y <= mapSize.rows

    interface State { x: number; y: number; dir: number; turns: number; path: { x: number, y: number }[] }
    const visited = new Map<string, boolean>()
    const queue: State[] = [{ x: x1, y: y1, dir: -1, turns: 0, path: [{ x: x1, y: y1 }] }]
    visited.set(`${x1},${y1},-1,0`, true)

    while (queue.length > 0) {
      const cur = queue.shift()!
      if (cur.x === x2 && cur.y === y2) return { can: true, path: cur.path }

      const dirs = [{ dx: 1, dy: 0, nd: 0 }, { dx: -1, dy: 0, nd: 0 }, { dx: 0, dy: 1, nd: 1 }, { dx: 0, dy: -1, nd: 1 }]
      for (const { dx, dy, nd } of dirs) {
        const nx = cur.x + dx, ny = cur.y + dy
        if (!inBounds(nx, ny)) continue
        let nt = cur.turns
        if (cur.dir !== -1 && cur.dir !== nd) { nt++; if (nt > 2) continue }
        const key = `${nx},${ny},${nd},${nt}`
        if (visited.has(key)) continue
        if ((nx !== x2 || ny !== y2) && hasBlock(nx, ny)) continue
        visited.set(key, true)
        queue.push({ x: nx, y: ny, dir: nd, turns: nt, path: [...cur.path, { x: nx, y: ny }] })
      }
    }
    return { can: false }
  }, [mapSize, hasBlockAt])

  // 初始化游戏
  const initGame = useCallback(() => {
    const pairs = mapSize.iconPairs
    const availableIcons = getAvailableIcons()
    const newTiles: IconType[] = []
    for (let i = 0; i < pairs; i++) {
      const iconType = i % availableIcons
      newTiles.push(iconType, iconType)
    }
    for (let i = newTiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newTiles[i], newTiles[j]] = [newTiles[j], newTiles[i]]
    }
    setTiles(newTiles)
    setSelected(null)
    setMatched(new Set())
    setScore(0)
    setTime(0)
    setGameState('playing')
    setHintTiles([])
    setShowSettings(false)
    setMessage(null)
    setPathLine([])
    tileCanvasesRef.current.clear()
  }, [mapSize, getAvailableIcons])

  // 下一关
  const nextLevel = useCallback(() => {
    const newLevel = level + 1
    setLevel(newLevel)
    setMapSize(getMapSizeByLevel(newLevel))
  }, [level])

  // 重新开始当前关卡
  const restartLevel = useCallback(() => {
    initGame()
  }, [initGame])

  // 重新开始第一关
  const restartFromFirst = useCallback(() => {
    setLevel(1)
    setMapSize(getMapSizeByLevel(1))
  }, [])

  useEffect(() => { initGame() }, [initGame])

  // 计时器
  useEffect(() => {
    if (gameState === 'playing') {
      timerRef.current = setInterval(() => setTime(t => t + 1), 1000)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [gameState])

  // 绘制路径
  const drawPath = useCallback((pathPoints: { x: number, y: number }[]) => { setPathLine(pathPoints) }, [])
  const clearPath = useCallback(() => { setPathLine([]) }, [])

  // 点击方块
  const handleTileClick = useCallback((idx: number) => {
    if (gameState !== 'playing') return
    if (matched.has(idx)) return
    if (tiles[idx] === -1) return

    setHintTiles([])
    clearPath()

    if (selected === null) {
      setSelected(idx)
    } else if (selected === idx) {
      setSelected(null)
    } else {
      const result = canDirectConnect(selected, idx, tiles, matched)
      if (result.can) {
        setMatched(prev => {
          const next = new Set(prev)
          next.add(selected)
          next.add(idx)
          return next
        })
        setScore(prev => prev + 10)
        drawPath(result.path || [])
        setTimeout(clearPath, 400)
        setSelected(null)
      } else {
        setSelected(idx)
      }
    }
  }, [gameState, matched, tiles, selected, canDirectConnect, drawPath, clearPath])

  // 检查胜利
  useEffect(() => {
    if (matched.size === tiles.length && tiles.length > 0) {
      setGameState('won')
      // 自动进入下一关
      setTimeout(() => {
        nextLevel()
        initGame()
      }, 1500)
    }
  }, [matched, tiles, nextLevel, initGame])

  // 检查死局
  const checkDeadLock = useCallback(() => {
    const unmatched: number[] = tiles.map((t, i) => t !== -1 && !matched.has(i) ? i : -1).filter(i => i !== -1) as number[]
    for (let i = 0; i < unmatched.length; i++) {
      for (let j = i + 1; j < unmatched.length; j++) {
        if (canDirectConnect(unmatched[i], unmatched[j], tiles, matched).can) return false
      }
    }
    return unmatched.length > 0
  }, [tiles, matched, canDirectConnect])

  // 提示
  const showHint = useCallback(() => {
    if (gameState !== 'playing') return
    const unmatched: number[] = tiles.map((t, i) => t !== -1 && !matched.has(i) ? i : -1).filter(i => i !== -1) as number[]
    for (let i = 0; i < unmatched.length; i++) {
      for (let j = i + 1; j < unmatched.length; j++) {
        if (tiles[unmatched[i]] === tiles[unmatched[j]] && canDirectConnect(unmatched[i], unmatched[j], tiles, matched).can) {
          setHintTiles([unmatched[i], unmatched[j]])
          setTimeout(() => setHintTiles([]), 2000)
          return
        }
      }
    }
    setMessage('没有可连接的对了！')
    setTimeout(() => setMessage(null), 2000)
  }, [gameState, tiles, matched, canDirectConnect])

  // 洗牌
  const shuffleTiles = useCallback(() => {
    if (gameState !== 'playing') return
    setTiles(prev => {
      const unmatchedIdx = prev.map((t, i) => (!matched.has(i) && t !== -1) ? i : -1).filter(i => i !== -1) as number[]
      const unmatched = unmatchedIdx.map(i => prev[i])
      for (let i = unmatched.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [unmatched[i], unmatched[j]] = [unmatched[j], unmatched[i]]
      }
      const next = [...prev]
      unmatchedIdx.forEach((idx, k) => { next[idx] = unmatched[k] })
      unmatchedIdx.forEach(idx => tileCanvasesRef.current.delete(idx))
      return next
    })
    setSelected(null)
    setHintTiles([])
    setMessage(null)
    clearPath()
  }, [gameState, matched, clearPath])

  // 绘制 canvas
  const renderTileCanvas = useCallback((idx: number, tile: IconType) => {
    const canvas = tileCanvasesRef.current.get(idx)
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const size = TILE_SIZE
    ctx.clearRect(0, 0, size, size)
    const color = ICON_COLORS[tile % ICON_COLORS.length]
    ctx.fillStyle = color
    ctx.font = `${size * 0.55}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const icons = ['🌸', '🌺', '🌻', '🌷', '🌹', '🍀', '🌈', '⭐', '🌙', '☀️', '🔥', '💎', '🎯', '🎪', '🎨', '🎭', '🎬', '🎮', '🎲', '🎸', '🎺', '🎻', '🏆', '🎁', '❤️']
    ctx.fillText(icons[tile % icons.length], size / 2, size / 2 + 1)
  }, [TILE_SIZE])

  useEffect(() => {
    tiles.forEach((tile, idx) => {
      if (!matched.has(idx) && tile !== -1) renderTileCanvas(idx, tile)
    })
  }, [tiles, matched, renderTileCanvas])

  const remaining = mapSize.cols * mapSize.rows - matched.size
  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
  const gridW = mapSize.cols * TILE_SIZE + (mapSize.cols - 1) * GAP + PADDING * 2
  const gridH = mapSize.rows * TILE_SIZE + (mapSize.rows - 1) * GAP + PADDING * 2

  const m = isMobile
  const hdrP = m ? 'px-2 py-2' : 'max-w-6xl px-4 py-3'
  const hdrG = m ? 'gap-1.5' : 'gap-4'

  return (
    <div className={`min-h-screen bg-gradient-to-br ${T.bg} overflow-x-hidden`}>
      {/* Header */}
      <div className={`sticky top-0 z-50 ${T.hdrBg} border-b ${T.hdrBrd} safe-area-top`}>
        <div className={`mx-auto ${hdrP}`}>
          <div className="flex items-center justify-between">
            <Link to="/" className={`flex items-center gap-1 sm:gap-2 ${T.txtSub} hover:${T.txt} transition-colors rounded-lg p-2`}>
              <ChevronRight className={`w-4 h-4 sm:w-5 sm:h-5 rotate-180 ${T.txt}`} />
              <Home className={`w-4 h-4 hidden sm:block ${T.txt}`} />
              <span className={`text-sm ${T.txt}`}>{m ? '返回' : '返回首页'}</span>
            </Link>

            <div className={`flex items-center ${hdrG}`}>
              <div className={`hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg ${T.cardBg} ${T.txt}`}>
                <span className={`${T.txtSub} text-xs`}>关卡</span>
                <span className="font-bold text-xs">{level}</span>
              </div>
              <div className={`flex items-center gap-1 ${T.txt}`}>
                <Trophy className={`w-4 h-4 sm:w-5 sm:h-5 ${m ? '' : 'text-yellow-400'}`} style={m ? { color: '#FBBF24' } : {}} />
                <span className="font-bold text-xs sm:text-sm">{score}</span>
              </div>
              <div className={`flex items-center gap-1 ${T.txtSub2}`}>
                <Clock className={`w-4 h-4 sm:w-5 sm:h-5 ${T.txtSub}`} />
                <span className="text-xs sm:text-sm">{fmt(time)}</span>
              </div>
              <button onClick={() => setShowSettings(!showSettings)}
                className={`p-2 rounded-lg ${T.cardBg} ${T.cardHv} transition-colors`}>
                <Settings className={`w-4 h-4 sm:w-5 sm:h-5 ${T.txt} ${showSettings ? 'rotate-45' : ''} transition-transform`} />
              </button>
              <button onClick={toggleTheme}
                className={`p-2 rounded-lg ${T.cardBg} ${T.cardHv} transition-colors`}>
                {isDark ? <Sun className={`w-4 h-4 sm:w-5 sm:h-5 ${T.txt}`} /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`${T.txt} text-center py-2 px-4 font-medium text-sm animate-pulse ${isDark ? 'bg-yellow-500/80' : 'bg-amber-400/80'}`}>
          {message}
        </div>
      )}

      {/* Settings */}
      {showSettings && (
        <div className={`${T.hdrBg} border-b ${T.hdrBrd} p-2 sm:p-4`}>
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-wrap gap-2 items-center justify-center">
              <div className="flex items-center gap-1 sm:gap-2">
                <Grid3X3 className={`w-4 h-4 sm:w-5 sm:h-5 ${T.txtSub}`} />
                <span className={`${T.txtSub} text-xs sm:text-sm`}>关卡:</span>
                <div className="flex flex-wrap gap-1">
                  {LEVELS.slice(0, 12).map((lvl, idx) => (
                    <button key={idx} onClick={() => { setLevel(idx + 1); setMapSize(lvl); setShowSettings(false) }}
                      className={`px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                        level === idx + 1 ? `${T.btnActive} text-white` : `${T.cardBg} ${T.txtSub2} ${T.cardHv}`
                      }`}>
                      {lvl.name}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={restartLevel}
                className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg bg-gradient-to-r ${T.btnGrad} text-white font-medium transition-all active:scale-95`}>
                <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm">重玩本关</span>
              </button>
            </div>
          </div>
        </div>
      )}

        {/* Game Area */}
        <div className={`flex flex-col items-center ${m ? 'pt-2 px-2 pb-4' : 'p-4'}`}>
        {/* Title */}
        <h1 className={`font-bold mb-1 ${m ? 'text-xl' : 'text-2xl sm:text-3xl'} ${T.txt}`}>连连看</h1>
        <p className={`${T.txtSub} text-xs sm:text-sm mb-1`}>找出相同的图案并连接消除 · 第 {level} 关</p>
        <p className={`${T.txtSub} text-xs sm:text-sm mb-2`}>{mapSize.name} · {mapSize.iconPairs} 对</p>

        {/* Stats */}
        <div className="flex gap-2 mb-2 flex-wrap justify-center">
          <div className={`px-2 py-1 rounded-lg ${T.cardBg2} ${T.txt} text-xs sm:text-sm`}>
            <span className={T.txtSub}>剩余: </span>
            <span className="font-bold">{remaining}</span>
          </div>
          <button onClick={showHint} disabled={gameState !== 'playing'}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg bg-gradient-to-r ${T.btnSec} ${T.txt} disabled:opacity-40 transition-colors text-xs sm:text-sm`}>
            <Eye className="w-3 h-3 sm:w-4 sm:h-4" />提示
          </button>
          <button onClick={shuffleTiles} disabled={gameState !== 'playing'}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg bg-gradient-to-r ${T.btnThird} ${T.txt} disabled:opacity-40 transition-colors text-xs sm:text-sm`}>
            <Shuffle className="w-3 h-3 sm:w-4 sm:h-4" />洗牌
          </button>
        </div>

        {/* Board */}
        <div className="relative overflow-x-auto w-full flex justify-center" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className="relative flex-shrink-0">
            {/* SVG Path */}
            <svg className="absolute top-0 left-0 pointer-events-none z-20"
              width={gridW} height={gridH}
              viewBox={`0 0 ${gridW} ${gridH}`}>
              {pathLine.length >= 2 && (
                <polyline
                  points={pathLine.map(p => {
                    const px = p.x * (TILE_SIZE + GAP) + TILE_SIZE / 2 + PADDING
                    const py = p.y * (TILE_SIZE + GAP) + TILE_SIZE / 2 + PADDING
                    return `${px},${py}`
                  }).join(' ')}
                  fill="none" stroke={isDark ? '#4ECDC4' : '#0891B2'}
                  strokeWidth={m ? 3 : 4} strokeLinecap="round" strokeLinejoin="round"
                  style={{ filter: `drop-shadow(0 0 6px ${isDark ? '#4ECDC4' : '#0891B2'})` }}
                />
              )}
            </svg>

            {/* Grid */}
            <div className={`grid rounded-xl sm:rounded-2xl ${T.boardBg}`}
              style={{ gridTemplateColumns: `repeat(${mapSize.cols}, ${TILE_SIZE}px)`, gap: `${GAP}px`, padding: `${PADDING}px` }}>
              {tiles.map((tile, idx) => {
                const isSelected = selected === idx
                const isHint = hintTiles.includes(idx)
                const isMatched = matched.has(idx)
                return (
                  <button key={idx} onClick={() => handleTileClick(idx)}
                    disabled={isMatched || gameState !== 'playing'}
                    className={`relative rounded-lg sm:rounded-xl transition-all duration-200 touch-manipulation ${isMatched ? 'opacity-0 pointer-events-none' : 'opacity-100'} ${isSelected ? `ring-2 ring-yellow-400 scale-105 z-10` : ''} ${isHint ? 'ring-2 ring-blue-400 animate-pulse' : ''} active:scale-95`}
                    style={{
                      width: TILE_SIZE, height: TILE_SIZE,
                      backgroundColor: isMatched ? 'transparent' : (isSelected ? T.selBg : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.4)')),
                    }}
                  >
                    {tile !== -1 && !isMatched && (
                      <canvas width={TILE_SIZE} height={TILE_SIZE}
                        ref={el => {
                          if (el) { tileCanvasesRef.current.set(idx, el); renderTileCanvas(idx, tile) }
                        }}
                      />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="mt-4 sm:mt-6">
          <button onClick={initGame}
            className={`flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-xl bg-gradient-to-r ${T.btnGrad} text-white font-bold shadow-lg transition-all active:scale-95`}>
            <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-sm sm:text-base">{gameState === 'won' ? '再来一局' : '重新开始'}</span>
          </button>
        </div>

        {/* Win Modal */}
        {gameState === 'won' && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className={`${T.modalBg} rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-center shadow-2xl max-w-xs w-full`}
              style={{ animation: 'scaleIn 0.3s ease-out' }}>
              <Trophy className={`w-12 h-12 sm:w-20 sm:h-20 mx-auto mb-2 sm:mb-4 ${T.txt}`} />
              <h2 className={`text-2xl sm:text-4xl font-bold ${T.txt} mb-2`}>恭喜通关！</h2>
              <p className={`${T.txt} text-sm sm:text-xl mb-2`}>用时: {fmt(time)} | 得分: {score}</p>
              <p className={`${T.txtSub2} text-xs sm:text-sm mb-4`}>即将进入第 {level + 1} 关...</p>
              <div className={`${T.txtSub2} flex items-center justify-center gap-2 mb-4 text-xs sm:text-sm`}>
                <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>效率: {time > 0 ? Math.round((mapSize.cols * mapSize.rows / 2) / (time / 60)) : 0} 对/分钟</span>
              </div>
              <div className="flex gap-2 justify-center flex-wrap">
                <button onClick={restartLevel}
                  className={`px-3 sm:px-4 py-2 rounded-lg ${isDark ? 'bg-white/20 hover:bg-white/30 active:bg-white/40' : 'bg-white/40 hover:bg-white/50 active:bg-white/60'} ${T.txt} font-medium transition-colors text-xs sm:text-sm`}>
                  重玩本关
                </button>
                <button onClick={restartFromFirst}
                  className={`px-3 sm:px-4 py-2 rounded-lg ${isDark ? 'bg-white/20 hover:bg-white/30 active:bg-white/40' : 'bg-white/40 hover:bg-white/50 active:bg-white/60'} ${T.txt} font-medium transition-colors text-xs sm:text-sm`}>
                  从头开始
                </button>
                <button onClick={initGame}
                  className={`px-3 sm:px-4 py-2 rounded-lg ${isDark ? 'bg-white text-orange-500' : 'bg-white/90 text-purple-600'} font-bold hover:bg-white/90 active:bg-white transition-colors text-xs sm:text-sm`}>
                  继续
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-6 sm:mt-8 text-center px-2">
          <h3 className={`${T.txt} font-semibold mb-1 text-sm sm:text-base`}>游戏规则</h3>
          <p className={`${T.txtSub} text-xs sm:text-sm leading-relaxed`}>
            点击两个相同的图案，直线连接（最多2次拐弯）即可消除。<br />
            出现死局会自动调整布局！
          </p>
        </div>
      </div>
    </div>
  )
}
