import React, { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Home, RotateCcw, ChevronRight, Volume2, VolumeX, FastForward, Rewind } from 'lucide-react'
import { EmulatorJS } from 'react-emulatorjs'

// 声明EmulatorJS全局变量
declare global {
  interface Window {
    EJS_emulator: any
  }
}

// 三目童子 NES - EmulatorJS (RetroArch WASM核心)
const Sanmo: React.FC = () => {
  const [isDark, setIsDark] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isFastForward, setIsFastForward] = useState(false)
  const [isSlowMotion, setIsSlowMotion] = useState(false)
  const [isRestarting, setIsRestarting] = useState(false)

  // 检测设备类型
  useEffect(() => {
    const check = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window)
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => { setIsDark(localStorage.getItem('devtools-theme') !== 'light') }, [])

  // 阻止移动端手势
  useEffect(() => {
    if (!isMobile) return
    
    const preventGestures = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault()
      }
    }
    document.body.style.overscrollBehavior = 'none'
    document.addEventListener('touchmove', preventGestures, { passive: false })
    
    return () => {
      document.removeEventListener('touchmove', preventGestures)
      document.body.style.overscrollBehavior = ''
    }
  }, [isMobile])

  const restartGame = useCallback(() => {
    if (isRestarting) return
    setIsRestarting(true)
    setTimeout(() => window.location.reload(), 100)
  }, [isRestarting])

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev)
  }, [])

  const toggleFastForward = useCallback(() => {
    const emulator = window.EJS_emulator
    if (emulator) {
      emulator.isFastForward = !emulator.isFastForward
      emulator.gameManager?.toggleFastForward(emulator.isFastForward ? 1 : 0)
      setIsFastForward(emulator.isFastForward)
    }
  }, [])

  const toggleSlowMotion = useCallback(() => {
    const emulator = window.EJS_emulator
    if (emulator) {
      emulator.isSlowMotion = !emulator.isSlowMotion
      emulator.gameManager?.toggleSlowMotion(emulator.isSlowMotion ? 1 : 0)
      setIsSlowMotion(emulator.isSlowMotion)
    }
  }, [])

  const theme = {
    bg: isDark ? 'from-blue-950 via-indigo-900 to-purple-900' : 'from-blue-100 via-indigo-200 to-purple-200',
    text: isDark ? 'text-white' : 'text-blue-900',
    textSubtle: isDark ? 'text-white/60' : 'text-blue-700/70',
  }

  // 移动端全屏游戏模式
  if (isMobile && isFullscreen) {
    return (
      <div 
        className="fixed inset-0 bg-black z-[9999]"
        style={{ WebkitUserSelect: 'none', userSelect: 'none', WebkitTouchCallout: 'none' }}
        onContextMenu={e => e.preventDefault()}
      >
        {/* 游戏画面 */}
        <div className="w-full h-full">
          <EmulatorJS
            EJS_pathtodata="https://cdn.emulatorjs.org/stable/data"
            EJS_core="nes"
            EJS_gameUrl="/roms/Sanmo.nes"
            EJS_startOnLoaded={true}
            EJS_volume={soundEnabled ? 0.5 : 0}
            EJS_gameName="Sanmo"
          />
        </div>
        
        {/* 退出全屏按钮 */}
        <button
          onClick={toggleFullscreen}
          className="absolute top-4 right-4 p-3 rounded-full bg-black/70 text-white active:scale-95"
          title="退出全屏"
        >
          ✕
        </button>
      </div>
    )
  }

  // PC端或移动端非全屏模式
  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.bg}`}
      style={{ WebkitUserSelect: 'none', userSelect: 'none', WebkitTouchCallout: 'none' }}
      onContextMenu={e => e.preventDefault()} onTouchMove={() => {}}
    >
      {/* Header */}
      <div className={`sticky top-0 z-50 ${isDark ? 'bg-black/40' : 'bg-white/80'} backdrop-blur-lg border-b ${isDark ? 'border-white/10' : 'border-blue-200/30'}`}>
        <div className={`mx-auto ${isMobile ? 'px-2 py-2' : 'max-w-6xl px-4 py-3'}`}>
          <div className="flex items-center justify-between">
            <Link to="/" className={`flex items-center gap-1 sm:gap-2 ${theme.textSubtle} hover:opacity-100 transition-opacity rounded-lg p-2`}>
              <ChevronRight className={`w-4 h-4 sm:w-5 sm:h-5 rotate-180 ${theme.text}`} />
              <Home className={`w-4 h-4 hidden sm:block ${theme.text}`} />
              <span className={`text-sm ${theme.text}`}>{isMobile ? '返回' : '返回首页'}</span>
            </Link>

            <div className="flex items-center gap-2 sm:gap-4">
              <button onClick={() => setSoundEnabled(!soundEnabled)} 
                className={`p-2 rounded-lg ${isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-blue-100/50'}`}
                title={soundEnabled ? '静音' : '开启声音'}>
                {soundEnabled ? <Volume2 className={`w-4 h-4 ${theme.text}`} /> : <VolumeX className={`w-4 h-4 ${theme.text}`} />}
              </button>

              {isMobile && (
                <button onClick={toggleFullscreen} 
                  className={`p-2 rounded-lg ${isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-blue-100/50'}`} 
                  title="游戏全屏">
                  <span className={`text-lg ${theme.text}`}>⛶</span>
                </button>
              )}

              <button onClick={restartGame} disabled={isRestarting}
                className="flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm">{isRestarting ? '重启中' : '重开'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex flex-col items-center justify-center min-h-[calc(100vh-60px)] ${isMobile ? 'p-2' : 'p-4 pb-8'}`}>
        {!isMobile && (
          <>
            <h1 className="font-bold mb-1 text-3xl sm:text-4xl text-white">👁️ 三目童子</h1>
            <p className={`${theme.textSubtle} text-sm mb-4`}>经典FC三目童子 · EmulatorJS</p>
          </>
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
          <EmulatorJS
            EJS_pathtodata="https://cdn.emulatorjs.org/stable/data"
            EJS_core="nes"
            EJS_gameUrl="/roms/Sanmo.nes"
            EJS_startOnLoaded={true}
            EJS_volume={soundEnabled ? 0.5 : 0}
            EJS_gameName="Sanmo"
          />
        </div>

        {/* 移动端速度控制 */}
        {isMobile && (
          <div className="flex items-center justify-center gap-4 w-full px-4 py-3 mt-2">
            <button
              onClick={toggleSlowMotion}
              className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-all active:scale-95 ${
                isSlowMotion ? 'bg-blue-600 text-white' : 'bg-white/20 text-white'
              }`}
            >
              <Rewind className="w-4 h-4" />
              <span>减速</span>
            </button>
            <button
              onClick={toggleFastForward}
              className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-all active:scale-95 ${
                isFastForward ? 'bg-orange-600 text-white' : 'bg-white/20 text-white'
              }`}
            >
              <FastForward className="w-4 h-4" />
              <span>加速</span>
            </button>
          </div>
        )}

        {/* 操作说明 - PC端 */}
        {!isMobile && (
          <div className="mt-6 text-center max-w-md">
            <h3 className={`${theme.text} font-semibold mb-1 text-base`}>操作说明</h3>
            <p className={`${theme.textSubtle} text-sm leading-relaxed`}>
              键盘：← → ↑ ↓ 移动 | <span className="text-green-400">Z</span> 攻击 | <span className="text-red-400">X</span> 特殊 | Enter 开始<br/>
              <span className="text-xs">三目童子，用第三只眼的能量消灭敌人！</span>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Sanmo
