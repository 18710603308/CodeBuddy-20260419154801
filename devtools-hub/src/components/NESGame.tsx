import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Home, RotateCcw, ChevronRight, Volume2, VolumeX, AlertCircle } from 'lucide-react'
import { EmulatorJS } from 'react-emulatorjs'
import { NES_CONTROLS } from '../nesControls'

interface NESGameProps {
  title: string
  romPath: string
}

// 声明EmulatorJS全局变量
declare global {
  interface Window {
    EJS_emulator: any
  }
}

const NESGame: React.FC<NESGameProps> = ({
  title,
  romPath,
}) => {
  const [isDark, setIsDark] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [romUrl, setRomUrl] = useState<string | null>(null)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [gameKey, setGameKey] = useState(0)

  useEffect(() => {
    const check = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window)
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    setIsDark(localStorage.getItem('devtools-theme') !== 'light')
  }, [])

  // 检测本地ROM
  useEffect(() => {
    const checkRom = async () => {
      try {
        const response = await fetch(romPath, { method: 'HEAD' })
        if (response.ok) {
          setRomUrl(romPath)
        } else {
          setError(`ROM 文件不存在: ${romPath}`)
        }
      } catch (e) {
        setError(`无法加载 ROM: ${romPath}`)
      }
    }
    checkRom()
  }, [romPath])

  const restartGame = useCallback(() => {
    setGameKey(prev => prev + 1)
    setError(null)
  }, [])

  const theme = {
    bg: isDark ? 'from-slate-950 via-gray-900 to-zinc-900' : 'from-gray-100 via-slate-100 to-zinc-100',
    headerBg: isDark ? 'bg-black/40' : 'bg-white/80',
    text: isDark ? 'text-white' : 'text-gray-900',
    textSubtle: isDark ? 'text-white/60' : 'text-gray-700/70',
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.bg}`}
      style={{ WebkitUserSelect: 'none', userSelect: 'none', WebkitTouchCallout: 'none' }}
      onContextMenu={e => e.preventDefault()}
    >
      {/* Header */}
      <div className={`sticky top-0 z-50 ${theme.headerBg} backdrop-blur-lg border-b ${isDark ? 'border-white/10' : 'border-gray-200/30'}`}>
        <div className={`mx-auto ${isMobile ? 'px-2 py-2' : 'max-w-6xl px-4 py-3'}`}>
          <div className="flex items-center justify-between">
            <Link to="/" className={`flex items-center gap-1 sm:gap-2 ${theme.textSubtle} hover:opacity-100 transition-opacity rounded-lg p-2`}>
              <ChevronRight className={`w-4 h-4 sm:w-5 sm:h-5 rotate-180 ${theme.text}`} />
              <Home className={`w-4 h-4 hidden sm:block ${theme.text}`} />
              <span className={`text-sm ${theme.text}`}>{isMobile ? '返回' : '返回首页'}</span>
            </Link>

            <div className="flex items-center gap-2">
              <span className={`font-bold text-lg ${theme.text}`}>{title}</span>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-2 rounded-lg ${isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-100/50'} transition-colors`}>
                {soundEnabled ? <Volume2 className={`w-4 h-4 ${theme.text}`} /> : <VolumeX className={`w-4 h-4 ${theme.text}`} />}
              </button>
              <button onClick={restartGame}
                className="p-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white active:scale-95 transition-transform">
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex flex-col items-center justify-center min-h-[calc(100vh-60px)] ${isMobile ? 'p-2' : 'p-4 pb-8'}`}>
        {!isMobile && (
          <div className="text-center mb-4">
            <h1 className={`font-bold text-3xl sm:text-4xl ${theme.text}`}>{title}</h1>
            <p className={`${theme.textSubtle} text-sm mt-1`}>经典FC · EmulatorJS (NES核心)</p>
          </div>
        )}
        {isMobile && (
          <div className="text-center mb-2">
            <h1 className={`font-bold text-2xl ${theme.text}`}>{title}</h1>
            <p className={`${theme.textSubtle} text-xs mt-1`}>经典FC · EmulatorJS (NES核心)</p>
          </div>
        )}

        {error && (
          <div className={`flex items-center gap-2 p-4 rounded-xl mb-4 ${isDark ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-700'}`} style={{ maxWidth: '640px', width: '100%' }}>
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* EmulatorJS Container */}
        <div 
          className="relative select-none overflow-hidden bg-black flex items-center justify-center"
          style={{ 
            maxWidth: '640px',
            width: '100%',
            aspectRatio: '256/240'
          }}
        >
          {romUrl && (
            <EmulatorJS {...({
              key: gameKey,
              EJS_pathtodata: '/emulatorjs/data',
              EJS_core: 'nes',
              EJS_gameUrl: romUrl,
              EJS_startOnLoaded: true,
              EJS_volume: soundEnabled ? 0.5 : 0,
              EJS_gameName: title,
              EJS_controlScheme: 'default',
              EJS_defaultControls: NES_CONTROLS,
              EJS_gameID: `nes-${romPath}`,
            } as any)} />
          )}
        </div>

        {/* 操作说明 - PC端显示 */}
        {!isMobile && (
          <div className={`mt-4 p-4 rounded-xl ${isDark ? 'bg-white/5' : 'bg-white/60'}`} style={{ maxWidth: '640px', width: '100%' }}>
              <h3 className={`font-semibold mb-2 ${theme.text}`}>操作说明</h3>
            <div className={`grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm ${theme.textSubtle}`}>
              <div className={`p-2 rounded ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                <span className="font-medium">移动</span>
                <p className="text-xs mt-1">↑ ↓ ← →</p>
              </div>
              <div className={`p-2 rounded ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                <span className="font-medium">A键</span>
                <p className="text-xs mt-1">Z</p>
              </div>
              <div className={`p-2 rounded ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                <span className="font-medium">B键</span>
                <p className="text-xs mt-1">X</p>
              </div>
              <div className={`p-2 rounded ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                <span className="font-medium">开始/选择</span>
                <p className="text-xs mt-1">Enter / Shift</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default NESGame
