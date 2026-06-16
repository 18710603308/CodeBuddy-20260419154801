import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { EmulatorJS } from 'react-emulatorjs'
import { NES_CONTROLS } from '../nesControls'
import {
  Home, Menu, X, Gamepad2, Search, ChevronDown,
  Monitor, Cpu, AlertCircle, RotateCcw, Moon, Sun,
  Coins, Play
} from 'lucide-react'

// ==================== 类型定义 ====================

interface GameConfig {
  id: string
  title: string
  subtitle?: string
  romPath?: string
  category: 'nes' | 'arcade' | 'arcade-variant' | 'web'
  core?: 'nes' | 'fbneo' | 'mame2003' | 'mame2003_plus'
  biosPath?: string
  parentGame?: string
  iframeUrl?: string  // Web/HTML5 游戏用 iframe 嵌入
  broken?: string     // 游戏不可用原因说明
}

// ==================== 游戏库配置 ====================

const GAME_LIBRARY: GameConfig[] = [
  // ---- FC/NES ----
  { id: 'contra', title: '魂斗罗', subtitle: 'Contra', romPath: '/roms/contra.nes', category: 'nes', core: 'nes' },
  { id: 'tank-battle', title: '坦克大战', subtitle: 'Battle City', romPath: '/roms/tank_battle.nes', category: 'nes', core: 'nes' },
  { id: 'super-mario', title: '超级马里奥', subtitle: 'Super Mario Bros', romPath: '/roms/super_mario.nes', category: 'nes', core: 'nes' },
  { id: 'lode-runner', title: '淘金者', subtitle: 'Lode Runner', romPath: '/roms/LodeRunner.nes', category: 'nes', core: 'nes' },
  { id: 'river-city', title: '热血街头', subtitle: 'River City Ransom', romPath: '/roms/nes/river_city.nes', category: 'nes', core: 'nes' },
  { id: 'battle-city-nes', title: '坦克要塞', subtitle: 'Battle City', romPath: '/roms/nes/battle_city.nes', category: 'nes', core: 'nes' },
  { id: 'adventure-island', title: '恐龙冒险岛', subtitle: 'Adventure Island', romPath: '/roms/nes/adventure_island.nes', category: 'nes', core: 'nes' },
  { id: 'chip-dale', title: '松鼠大战', subtitle: "Chip 'n Dale", romPath: '/roms/nes/chip_dale.nes', category: 'nes', core: 'nes' },
  { id: 'lode-runner-nes', title: '淘金者(FC)', subtitle: 'Lode Runner', romPath: '/roms/nes/lode_runner.nes', category: 'nes', core: 'nes' },
  { id: 'pooyan-nes', title: '猪小弟', subtitle: 'Pooyan', romPath: '/roms/nes/pooyan.nes', category: 'nes', core: 'nes' },
  { id: 'sanmo', title: '三目童子', subtitle: 'Mitsume ga Tooru', romPath: '/roms/Sanmo.nes', category: 'nes', core: 'nes' },
  { id: 'fumoji', title: '伏魔记', subtitle: '封神榜之伏魔三太子', romPath: '/roms/Fumojì.nes', category: 'nes', core: 'nes' },
  { id: 'gunnac', title: '加纳战机', subtitle: 'Gun-Nac', romPath: '/roms/nes/gun_nac.nes', category: 'nes', core: 'nes' },

  // ---- 街机 ----
  { id: 'snowbros', title: '雪人兄弟', subtitle: 'Snow Bros', romPath: '/roms/arcade/snowbros.zip', category: 'arcade', core: 'fbneo' },
  { id: 'pooyan-arcade', title: '猪小弟', subtitle: 'Pooyan (Arcade)', romPath: '/roms/arcade/pooyan.zip', category: 'arcade', core: 'fbneo' },
  { id: 'gberet', title: '绿色兵团', subtitle: 'Green Beret', romPath: '/roms/arcade/gberet.zip', category: 'arcade', core: 'fbneo' },
  { id: 'dino', title: '恐龙快打', subtitle: 'Cadillacs and Dinosaurs', romPath: '/roms/arcade/dino.zip', category: 'arcade', core: 'fbneo', biosPath: '/roms/arcade/neogeo.zip' },
  { id: 'punisher', title: '惩罚者', subtitle: 'The Punisher', romPath: '/roms/arcade/punisher.zip', category: 'arcade', core: 'fbneo', biosPath: '/roms/arcade/neogeo.zip' },
  { id: 'kof97', title: '拳皇97', subtitle: 'The King of Fighters 97', romPath: '/roms/arcade/kof97.zip', category: 'arcade', core: 'fbneo' },
  { id: 'kof2002', title: '拳皇2002', subtitle: 'The King of Fighters 2002', romPath: '/roms/arcade/kof2002.zip', category: 'arcade', core: 'fbneo' },
  { id: 'orlegend', title: '西游释厄传', subtitle: 'Oriental Legend', romPath: '/roms/arcade/orlegend.zip', category: 'arcade', core: 'fbneo', biosPath: '/roms/arcade/pgm.zip', broken: 'ROM 版本与核心不兼容，需更新 ROM' },
  { id: 'sangokushi', title: '三国战纪', subtitle: 'Knights of Valour', romPath: '/roms/arcade/kov.zip', category: 'arcade', core: 'fbneo', biosPath: '/roms/arcade/pgm.zip', broken: 'ROM 版本与核心不兼容，需更新 ROM' },
  { id: 'ldrun-arcade', title: '淘金者(街机)', subtitle: 'Lode Runner Arcade', romPath: '/roms/arcade/ldrun.zip', category: 'arcade', core: 'fbneo' },
  { id: 'ddragon', title: '双截龙', subtitle: 'Double Dragon', romPath: '/roms/arcade/ddragon.zip', category: 'arcade', core: 'mame2003_plus' },

  // ---- 街机变体版 ----
  { id: 'kovplus', title: '三国战纪 Plus', subtitle: 'KOV Plus', romPath: '/roms/arcade/kovplus.zip', category: 'arcade-variant', core: 'fbneo', biosPath: '/roms/arcade/pgm.zip', parentGame: 'sangokushi', broken: 'ROM 版本与核心不兼容，需更新 ROM' },
  { id: 'kovsh', title: '三国战纪 超级英雄', subtitle: 'KOV Super Heroes', romPath: '/roms/arcade/kovsh.zip', category: 'arcade-variant', core: 'fbneo', biosPath: '/roms/arcade/pgm.zip', parentGame: 'sangokushi', broken: 'ROM 版本与核心不兼容，需更新 ROM' },
  { id: 'kovqhsgs', title: '三国战纪 群雄争霸', subtitle: 'KOV Qunxiong', romPath: '/roms/arcade/kovqhsgs.zip', category: 'arcade-variant', core: 'fbneo', biosPath: '/roms/arcade/pgm.zip', parentGame: 'sangokushi', broken: 'ROM 版本与核心不兼容，需更新 ROM' },
  { id: 'orlegendc', title: '西游释厄传 中国版', subtitle: 'Oriental Legend CN v112', romPath: '/roms/arcade/orlegendc.zip', category: 'arcade-variant', core: 'fbneo', biosPath: '/roms/arcade/pgm.zip', parentGame: 'orlegend', broken: 'ROM 版本与核心不兼容，需更新 ROM' },
  { id: 'orlegende', title: '西游释厄传 另一版', subtitle: 'Oriental Legend Alt', romPath: '/roms/arcade/orlegende.zip', category: 'arcade-variant', core: 'fbneo', biosPath: '/roms/arcade/pgm.zip', parentGame: 'orlegend', broken: 'ROM 版本与核心不兼容，需更新 ROM' },
  { id: 'kof97pls', title: '拳皇97 Plus', subtitle: 'KOF 97 Plus', romPath: '/roms/arcade/kof97pls.zip', category: 'arcade-variant', core: 'fbneo', parentGame: 'kof97' },
  { id: 'kof2002b', title: '拳皇2002 第二版', subtitle: 'KOF 2002 Version B', romPath: '/roms/arcade/kof2002b.zip', category: 'arcade-variant', core: 'fbneo', parentGame: 'kof2002' },
  { id: 'ddragonu', title: '双截龙 美版', subtitle: 'Double Dragon US', romPath: '/roms/arcade/ddragonu.zip', category: 'arcade-variant', core: 'fbneo', parentGame: 'ddragon' },
  { id: 'ddragonb', title: '双截龙 Bootleg', subtitle: 'Double Dragon Bootleg', romPath: '/roms/arcade/ddragonb.zip', category: 'arcade-variant', core: 'fbneo', parentGame: 'ddragon' },
  { id: 'kovplusa', title: '三国战纪 Plus 另一版', subtitle: 'KOV Plus Alt', romPath: '/roms/arcade/kovplusa.zip', category: 'arcade-variant', core: 'fbneo', biosPath: '/roms/arcade/pgm.zip', parentGame: 'sangokushi', broken: 'ROM 版本与核心不兼容，需更新 ROM' },

  // ---- Web/HTML5 游戏 ----
  { id: 'link-game', title: '连连看', subtitle: '经典的连连看消消乐', category: 'web', iframeUrl: '/link-game' },
  { id: 'spider-solitaire', title: '蜘蛛纸牌', subtitle: '经典Windows蜘蛛纸牌', category: 'web', iframeUrl: '/spider-solitaire' },
  { id: 'minesweeper', title: '扫雷', subtitle: '经典扫雷，挑战最高难度', category: 'web', iframeUrl: '/minesweeper' },
  { id: 'game2048', title: '2048', subtitle: '经典数字合成游戏', category: 'web', iframeUrl: '/game2048' },
  { id: 'gold-miner', title: '黄金矿工', subtitle: '经典益智小游戏', category: 'web', iframeUrl: '/gold-miner' },
  { id: 'fumoji-bbk', title: '伏魔记 BBK', subtitle: '步步高电子词典原版网页移植', category: 'web', iframeUrl: '/fumojì-bbk' },
]

// ==================== 分类定义 ====================

const CATEGORIES = [
  { key: 'nes' as const, label: 'FC/NES', icon: '🎮' },
  { key: 'arcade' as const, label: '街机', icon: '🕹️' },
  { key: 'arcade-variant' as const, label: '变体版', icon: '📦' },
  { key: 'web' as const, label: 'HTML5', icon: '🌐' },
]

// ==================== GameHub 组件 ====================

const GameHub: React.FC = () => {
  const [selectedGame, setSelectedGame] = useState<GameConfig>(GAME_LIBRARY[0])
  const [gameKey, setGameKey] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isDark, setIsDark] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [search, setSearch] = useState('')
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set())
  const [romValid, setRomValid] = useState<Record<string, boolean>>({})

  // 检测移动端
  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768 || 'ontouchstart' in window
      setIsMobile(mobile)
      if (mobile) setSidebarOpen(false)
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // 切换游戏
  const switchGame = useCallback((game: GameConfig) => {
    if (game.id === selectedGame.id) return
    setSelectedGame(game)
    setGameKey(prev => prev + 1)
    if (isMobile) setSidebarOpen(false)
  }, [selectedGame.id, isMobile])

  // 重启当前游戏
  const restartGame = useCallback(() => {
    setGameKey(prev => prev + 1)
  }, [])

  // 通过 iframe 内的 EmulatorJS 实例发送输入
  const sendArcadeButton = useCallback((player: number, buttonId: number) => {
    const iframe = document.querySelector('iframe') as HTMLIFrameElement | null
    const emu = iframe?.contentWindow?.EJS_emulator as any
    if (!emu?.gameManager?.simulateInput) return
    emu.gameManager.simulateInput(player, buttonId, 1)
    setTimeout(() => {
      emu.gameManager?.simulateInput(player, buttonId, 0)
    }, 100)
  }, [])

  // 切换分类折叠
  const toggleCategory = useCallback((key: string) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  // 预检 ROM 文件
  useEffect(() => {
    const checkRom = async (game: GameConfig) => {
      if (!game.romPath) return // Web 游戏无需 ROM 校验
      try {
        const resp = await fetch(game.romPath, { method: 'HEAD' })
        setRomValid(prev => ({ ...prev, [game.id]: resp.ok }))
      } catch {
        setRomValid(prev => ({ ...prev, [game.id]: false }))
      }
    }
    checkRom(selectedGame)
  }, [selectedGame.id])

  // 搜索过滤
  const filteredGames = useMemo(() => {
    if (!search.trim()) return GAME_LIBRARY
    const q = search.toLowerCase()
    return GAME_LIBRARY.filter(g =>
      g.title.includes(q) ||
      (g.subtitle && g.subtitle.toLowerCase().includes(q))
    )
  }, [search])

  // 按分类分组
  const groupedGames = useMemo(() => {
    const groups: Record<string, GameConfig[]> = {}
    for (const cat of CATEGORIES) {
      groups[cat.key] = filteredGames.filter(g => g.category === cat.key)
    }
    return groups
  }, [filteredGames])

  const theme = {
    bg: isDark ? 'bg-slate-950' : 'bg-gray-50',
    sidebar: isDark ? 'bg-slate-900 border-r border-white/10' : 'bg-white border-r border-gray-200',
    text: isDark ? 'text-white' : 'text-gray-900',
    textSubtle: isDark ? 'text-white/60' : 'text-gray-500',
    card: isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50 hover:bg-gray-100',
    cardActive: isDark ? 'bg-blue-600/20 border-blue-500/50' : 'bg-blue-50 border-blue-400',
    input: isDark ? 'bg-white/10 border-white/10 focus:border-white/30' : 'bg-gray-100 border-gray-200 focus:border-gray-400',
  }

  const currentRomValid = romValid[selectedGame.id]

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} flex`}>
      {/* ====== 侧边栏 ====== */}
      {sidebarOpen && (
        <>
          {/* 移动端遮罩 */}
          {isMobile && (
            <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setSidebarOpen(false)} />
          )}

          <aside className={`
            ${theme.sidebar} 
            ${isMobile ? 'fixed inset-y-0 left-0 z-50 w-72' : 'w-64 flex-shrink-0'}
            flex flex-col h-screen overflow-hidden
          `}>
            {/* 侧边栏头部 */}
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Gamepad2 className="w-5 h-5 text-blue-400" />
                  <h2 className="font-bold text-lg">游戏合集</h2>
                </div>
                <div className="flex items-center gap-1">
                  <Link to="/" className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}>
                    <Home className="w-4 h-4" />
                  </Link>
                  {isMobile && (
                    <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              {/* 搜索框 */}
              <div className="relative">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${theme.textSubtle}`} />
                <input
                  type="text"
                  placeholder="搜索游戏..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className={`w-full pl-9 pr-3 py-2 rounded-lg text-sm border outline-none transition-colors ${theme.input} ${theme.text}`}
                />
              </div>
            </div>

            {/* 游戏列表 */}
            <div className="flex-1 overflow-y-auto p-2">
              {CATEGORIES.map(cat => {
                const games = groupedGames[cat.key]
                if (games.length === 0) return null
                const collapsed = collapsedCategories.has(cat.key)

                return (
                  <div key={cat.key} className="mb-2">
                    <button
                      onClick={() => toggleCategory(cat.key)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium ${theme.textSubtle} hover:opacity-80`}
                    >
                      <span>{cat.icon} {cat.label} <span className="opacity-50">({games.length})</span></span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${collapsed ? '' : 'rotate-180'}`} />
                    </button>
                    {!collapsed && (
                      <div className="space-y-0.5">
                        {games.map(game => (
                          <button
                            key={game.id}
                            onClick={() => switchGame(game)}
                            className={`
                              w-full text-left px-3 py-2 rounded-lg text-sm transition-colors
                              ${game.id === selectedGame.id ? theme.cardActive : theme.card}
                              ${game.broken ? 'opacity-50' : ''}
                            `}
                          >
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium truncate">{game.title}</span>
                              {game.broken && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 shrink-0">待修复</span>
                              )}
                            </div>
                            {game.subtitle && (
                              <div className={`text-xs ${theme.textSubtle} truncate`}>{game.subtitle}</div>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </aside>
        </>
      )}

      {/* ====== 主内容区 ====== */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* 顶部栏 */}
        <header className={`border-b backdrop-blur-xl sticky top-0 z-30 ${isDark ? 'border-white/10 bg-slate-900/80' : 'border-gray-200 bg-white/80'}`}>
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {!sidebarOpen && (
                <button
                  onClick={() => setSidebarOpen(true)}
                  className={`p-2 rounded-lg ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
                >
                  <Menu className="w-5 h-5" />
                </button>
              )}
              <div>
                <h1 className="text-lg font-bold">{selectedGame.title}</h1>
                {selectedGame.subtitle && (
                  <p className={`text-xs ${theme.textSubtle}`}>{selectedGame.subtitle}</p>
                )}
              </div>
              <div className="flex items-center gap-2 ml-2">
                <span className={`px-2 py-0.5 rounded text-xs ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}>
                  {selectedGame.category === 'nes' ? 'NES' : selectedGame.category === 'arcade-variant' ? '街机·变体' : selectedGame.category === 'web' ? 'HTML5' : '街机'}
                </span>
                {selectedGame.core && (
                  <span className={`px-2 py-0.5 rounded text-xs ${isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                    {selectedGame.core.toUpperCase()}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={restartGame} className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`} title="重新开始">
                <RotateCcw className="w-5 h-5" />
              </button>
              <button
                onClick={() => setIsDark(!isDark)}
                className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </header>

        {/* 游戏区域 */}
        <main className="flex-1 flex flex-col items-center justify-center p-4">
          {/* 快速切换栏（非移动端） */}
          {!isMobile && (
            <div className="mb-4 flex items-center gap-2 flex-wrap justify-center max-w-4xl">
              {CATEGORIES.map(cat => (
                <div key={cat.key} className="flex items-center gap-1">
                  <span className={`text-xs ${theme.textSubtle}`}>{cat.label}:</span>
                  {groupedGames[cat.key].slice(0, 8).map(g => (
                    <button
                      key={g.id}
                      onClick={() => switchGame(g)}
                      className={`px-2 py-1 rounded text-xs whitespace-nowrap transition-colors
                        ${g.id === selectedGame.id ? 'bg-blue-600 text-white' : theme.card}`}
                    >
                      {g.title}
                    </button>
                  ))}
                  {groupedGames[cat.key].length > 8 && (
                    <span className={`text-xs ${theme.textSubtle}`}>+{groupedGames[cat.key].length - 8}</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 播放器 */}
          <div className={`rounded-2xl overflow-hidden border ${isDark ? 'border-white/10 bg-black' : 'border-gray-200 bg-gray-900'}`}
            style={{ maxWidth: selectedGame.category === 'nes' ? '640px' : selectedGame.category === 'web' ? '100%' : '800px', width: '100%' }}
          >
            {/* Web 游戏用 iframe */}
            {selectedGame.category === 'web' ? (
              <div className="relative bg-gray-100 dark:bg-gray-800" style={{ height: '70vh', minHeight: '500px' }}>
                <iframe
                  key={gameKey}
                  src={selectedGame.iframeUrl}
                  className="w-full h-full border-0"
                  title={selectedGame.title}
                  sandbox="allow-scripts allow-same-origin allow-forms"
                />
              </div>
            ) : selectedGame.romPath && currentRomValid === false ? (
              <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                <h3 className="text-xl font-bold mb-2">ROM 文件不存在</h3>
                <p className="text-sm opacity-70 mb-4">{selectedGame.romPath}</p>
                <button onClick={restartGame}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">
                  重试
                </button>
              </div>
            ) : selectedGame.broken ? (
              <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                <AlertCircle className="w-16 h-16 text-amber-500 mb-4" />
                <h3 className="text-xl font-bold mb-2">游戏暂不可用</h3>
                <p className="text-sm opacity-70 mb-2 max-w-md">{selectedGame.broken}</p>
                <p className="text-xs opacity-50">需要更新 ROM 文件后才能运行</p>
              </div>
            ) : (
              <>
                {/* 街机投币/开始按钮 */}
                {selectedGame.category.startsWith('arcade') && (
                  <div className={`flex items-center justify-center gap-3 mb-3`}>
                    <button
                      onClick={() => sendArcadeButton(0, 2)}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 bg-yellow-600 hover:bg-yellow-500 text-white shadow-lg shadow-yellow-600/20"
                      title="按 V 或点击此按钮投币"
                    >
                      <Coins className="w-4 h-4" />
                      投币 (V)
                    </button>
                    <button
                      onClick={() => sendArcadeButton(0, 3)}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-600/20"
                      title="按 Enter 或点击此按钮开始"
                    >
                      <Play className="w-4 h-4" />
                      开始 (Enter)
                    </button>
                  </div>
                )}
                <div
                  key={gameKey}
                  className="relative select-none overflow-hidden bg-black"
                  style={{
                    width: '100%',
                    aspectRatio: selectedGame.category === 'nes' ? '256/240' : '4/3'
                  }}
                >
                <EmulatorJS {...({
                  EJS_pathtodata: '/emulatorjs/data',
                  EJS_core: selectedGame.core,
                  EJS_gameUrl: selectedGame.romPath || '',
                  EJS_startOnLoaded: true,
                  ...(selectedGame.biosPath && { EJS_biosUrl: selectedGame.biosPath }),
                  EJS_gameName: selectedGame.title,
                  ...(selectedGame.category.startsWith('arcade') ? {
                    EJS_controlScheme: 'arcade',
                  } : selectedGame.category === 'nes' ? {
                    EJS_controlScheme: 'default',
                    EJS_defaultControls: NES_CONTROLS,
                    EJS_gameID: `nes-${selectedGame.romPath}`,
                  } : {}),
                } as any)} />
              </div>
              </>
            )}
          </div>

          {/* 操作说明 */}
          <div className={`mt-4 rounded-xl p-4 border max-w-lg w-full text-sm ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-white'}`}>
            <h4 className="font-bold mb-2">🎮 操作说明</h4>
            {selectedGame.category === 'web' ? (
              <p className="text-xs opacity-70">该游戏为 HTML5 网页游戏，在原游戏窗口内直接操作即可。</p>
            ) : selectedGame.category === 'nes' ? (
              <div className="grid grid-cols-4 gap-2">
                <div className={`p-2 rounded ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                  <span className="font-medium text-xs">移动</span><p className="text-xs opacity-70 mt-0.5">↑↓←→</p>
                </div>
                <div className={`p-2 rounded ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                  <span className="font-medium text-xs">A键</span><p className="text-xs opacity-70 mt-0.5">Z</p>
                </div>
                <div className={`p-2 rounded ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                  <span className="font-medium text-xs">B键</span><p className="text-xs opacity-70 mt-0.5">X</p>
                </div>
                <div className={`p-2 rounded ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                  <span className="font-medium text-xs">开始/选择</span><p className="text-xs opacity-70 mt-0.5">Enter/Shift</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <h5 className="font-medium text-xs mb-1">1P 按键</h5>
                  <ul className="space-y-0.5 text-xs opacity-70">
                    <li>• 方向: ↑↓←→</li>
                    <li>• 投币: <kbd className={`px-1 rounded ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>V</kbd>　开始: <kbd className={`px-1 rounded ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>Enter</kbd></li>
                    <li>• B <kbd className={`px-1 rounded ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>X</kbd>　Y <kbd className={`px-1 rounded ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>S</kbd></li>
                    <li className="text-xs mt-1 opacity-50">更多按键可在游戏中设置面板调整</li>
                  </ul>
                </div>
                <div>
                  <h5 className="font-medium text-xs mb-1">2P 按键</h5>
                  <ul className="space-y-0.5 text-xs opacity-70">
                    <li>• 方向: WASD</li>
                    <li>• 投币: <kbd className={`px-1 rounded ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>6</kbd>　开始: <kbd className={`px-1 rounded ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>2</kbd></li>
                    <li>• 动作: 小键盘</li>
                    <li>• 1 2 4 5 7 8</li>
                    <li className="text-xs mt-1">⚠️ 先投币再开始</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

export default GameHub
