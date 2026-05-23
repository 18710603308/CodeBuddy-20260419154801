import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Home, RotateCcw, ChevronRight, AlertCircle, Coins, Play } from 'lucide-react'
import { EmulatorJS } from 'react-emulatorjs'

interface ArcadeGameProps {
  title: string
  romPath: string
  biosPath?: string
  core?: 'fbneo' | 'mame2003' | 'mame2003_plus'
}

// 声明EmulatorJS全局变量
declare global {
  interface Window {
    EJS_emulator: any
  }
}

const ArcadeGame: React.FC<ArcadeGameProps> = ({
  title,
  romPath,
  biosPath,
  core = 'fbneo',
}) => {
  const [isDark, setIsDark] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [gameKey, setGameKey] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [romUrl, setRomUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const check = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window)
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const restartGame = () => {
    setGameKey(prev => prev + 1)
    setError(null)
    setLoading(true)
  }

  // 通过 iframe 内的 EmulatorJS 实例发送输入
  const sendArcadeButton = useCallback((player: number, buttonId: number) => {
    const iframe = document.querySelector('#game')?.closest('iframe') as HTMLIFrameElement | null
    const emu = iframe?.contentWindow?.EJS_emulator as any
    if (!emu?.gameManager?.simulateInput) return
    emu.gameManager.simulateInput(player, buttonId, 1)
    setTimeout(() => {
      emu.gameManager?.simulateInput(player, buttonId, 0)
    }, 100)
  }, [])

  // 检测 ROM 文件
  useEffect(() => {
    const checkRom = async () => {
      try {
        setLoading(true)
        const response = await fetch(romPath, { method: 'HEAD' })
        if (response.ok) {
          setRomUrl(romPath)
        } else {
          setError(`ROM 文件不存在: ${romPath}`)
        }
      } catch (e) {
        setError(`无法加载 ROM 文件`)
      } finally {
        setLoading(false)
      }
    }
    checkRom()
  }, [romPath])

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-slate-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <header className={`border-b backdrop-blur-xl sticky top-0 z-40 ${isDark ? 'border-white/10 bg-slate-900/80' : 'border-gray-200 bg-white/80'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
            >
              <ChevronRight className={`w-5 h-5 rotate-180 ${isDark ? 'text-white' : 'text-gray-900'}`} />
              <Home className="w-5 h-5" />
              <span className="text-sm">返回首页</span>
            </Link>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold">街机游戏</h1>
              <ChevronRight className="w-4 h-4 opacity-50" />
              <span className="text-sm opacity-70">{title}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={restartGame}
              className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
              title="重新开始"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsDark(!isDark)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-100 hover:bg-gray-200'}`}
            >
              {isDark ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </header>

      {/* Game Container */}
      <main className="flex flex-col items-center justify-center min-h-[calc(100vh-60px)] px-4 pb-8">
        {loading ? (
          <div className={`rounded-2xl overflow-hidden border ${isDark ? 'border-white/10 bg-black' : 'border-gray-200 bg-gray-900'}`}>
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-sm opacity-70">正在加载游戏...</p>
            </div>
          </div>
        ) : error ? (
          <div className={`rounded-2xl overflow-hidden border ${isDark ? 'border-white/10 bg-black' : 'border-gray-200 bg-gray-900'}`}>
            <div className="flex flex-col items-center justify-center py-20 px-4">
              <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
              <h3 className="text-xl font-bold mb-2">游戏加载失败</h3>
              <div className="text-sm opacity-70 mb-4 text-center max-w-lg">
                <p className="mb-2">{error}</p>
                <p className="text-xs opacity-60">
                  提示：街机游戏需要特定版本的 ROM 文件。如果看到 FBNeo 错误提示缺少文件，说明 ROM 版本不匹配。
                  请尝试使用与 FBNeo 兼容的 ROM 版本。
                </p>
              </div>
              <button
                onClick={restartGame}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                重试
              </button>
            </div>
          </div>
        ) : romUrl ? (
          <>
            {/* 投币/开始 按钮栏 */}
            <div className={`flex items-center justify-center gap-3 mb-3 ${isDark ? '' : ''}`}>
              <button
                onClick={() => sendArcadeButton(0, 2)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 ${
                  isDark
                    ? 'bg-yellow-600 hover:bg-yellow-500 text-white shadow-lg shadow-yellow-600/20'
                    : 'bg-yellow-500 hover:bg-yellow-400 text-white shadow-lg shadow-yellow-500/20'
                }`}
                title="按 V 或点击此按钮投币"
              >
                <Coins className="w-4 h-4" />
                投币 (V)
              </button>
              <button
                onClick={() => sendArcadeButton(0, 3)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 ${
                  isDark
                    ? 'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-600/20'
                    : 'bg-green-500 hover:bg-green-400 text-white shadow-lg shadow-green-500/20'
                }`}
                title="按 Enter 或点击此按钮开始"
              >
                <Play className="w-4 h-4" />
                开始 (Enter)
              </button>
            </div>
            <div
              key={gameKey}
              className={`relative select-none overflow-hidden rounded-2xl border ${isDark ? 'border-white/10' : 'border-gray-200'} bg-black`}
              style={{
                maxWidth: '800px',
                width: '100%',
                aspectRatio: '4/3'
              }}
            >
              <EmulatorJS {...({
                EJS_pathtodata: '/emulatorjs/data',
                EJS_core: core,
                EJS_gameUrl: romUrl,
                EJS_startOnLoaded: true,
                EJS_controlScheme: 'arcade',
                ...(biosPath && { EJS_biosUrl: biosPath }),
                EJS_gameName: title,
              } as any)} />
            </div>
          </>
          ) : (
            <div className={`rounded-2xl overflow-hidden border ${isDark ? 'border-white/10 bg-black' : 'border-gray-200 bg-gray-900'}`}>
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            </div>
          )}

        {/* Controls Info */}
        <div className={`mt-6 rounded-xl p-6 border max-w-xl w-full ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-white'}`}>
          <h3 className="font-bold text-lg mb-4">🎮 操作说明</h3>
          {!isMobile ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2 opacity-90">1P 按键</h4>
                <ul className="space-y-2 text-sm opacity-70">
                  <li>• <kbd className={`px-2 py-1 rounded ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>↑↓←→</kbd> — 方向</li>
                  <li>• <kbd className={`px-2 py-1 rounded ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>V</kbd> — 投币 / SELECT</li>
                  <li>• <kbd className={`px-2 py-1 rounded ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>Enter</kbd> — 开始 / START</li>
                  <li className="mt-2">动作按钮：</li>
                  <li>• <kbd className={`px-2 py-1 rounded ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>X</kbd> — B / BUTTON_2</li>
                  <li>• <kbd className={`px-2 py-1 rounded ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>S</kbd> — Y / BUTTON_4</li>
                  <li className="text-xs mt-1 opacity-50">点击右上角齿轮可自定义按键映射</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2 opacity-90">2P 按键 / 提示</h4>
                <ul className="space-y-2 text-sm opacity-70">
                  <li>• 2P 方向：<kbd className={`px-2 py-1 rounded ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>WASD</kbd></li>
                  <li>• 2P 投币/开始：<kbd className={`px-2 py-1 rounded ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>6</kbd> / <kbd className={`px-2 py-1 rounded ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>2</kbd></li>
                  <li>• 2P 动作：小键盘 <kbd className={`px-2 py-1 rounded ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>1 2 4 5 7 8</kbd></li>
                  <li className="mt-2">提示：</li>
                  <li>• ⚠️ 先按 <kbd className={`px-2 py-1 rounded ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>V</kbd> 投币，再按 <kbd className={`px-2 py-1 rounded ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>Enter</kbd> 开始</li>
                  <li>• 按 <kbd className={`px-2 py-1 rounded ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>F11</kbd> 全屏，右上角齿轮调整设置</li>
                  <li>• 支持游戏存档和读档功能</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="text-sm opacity-70">
              <p>📱 移动端支持触屏虚拟按键，点击游戏画面即可显示控制器。</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default ArcadeGame
