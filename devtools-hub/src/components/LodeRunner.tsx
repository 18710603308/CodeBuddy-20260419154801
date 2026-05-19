import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Home, RotateCcw, ChevronRight, Volume2, VolumeX } from 'lucide-react'

// 淘金者 NES - jsnes模拟器 + 真实ROM (参照Super Mario布局)
const LodeRunner: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const nesRef = useRef<any>(null)
  const animationRef = useRef<number>(0)
  const isRunningRef = useRef(false)
  const [gameState, setGameState] = useState<'loading' | 'start' | 'playing' | 'paused'>('loading')
  const [score, setScore] = useState(0)
  const [isDark, setIsDark] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [screenWidth, setScreenWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 375)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [gameSpeed, setGameSpeed] = useState(1.0)
  const speedRef = useRef(1.0)
  const audioContextRef = useRef<AudioContext | null>(null)
  const soundEnabledRef = useRef(true)

  const keysRef = useRef<{ [key: string]: boolean }>({})

  useEffect(() => { soundEnabledRef.current = soundEnabled }, [soundEnabled])
  useEffect(() => { speedRef.current = gameSpeed }, [gameSpeed])

  const theme = {
    bg: isDark ? 'from-amber-950 via-yellow-900 to-orange-900' : 'from-amber-100 via-yellow-200 to-orange-200',
    headerBg: isDark ? 'bg-black/40' : 'bg-white/80',
    text: isDark ? 'text-white' : 'text-amber-900',
    textSubtle: isDark ? 'text-white/60' : 'text-amber-700/70',
  }

  useEffect(() => {
    const check = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window)
      setScreenWidth(window.innerWidth)
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => { setIsDark(localStorage.getItem('devtools-theme') !== 'light') }, [])

  const stopGameLoop = useCallback(() => {
    isRunningRef.current = false
    if (animationRef.current) { cancelAnimationFrame(animationRef.current); animationRef.current = 0 }
  }, [])

  // 初始化NES模拟器 (参照SuperMario)
  const initNES = useCallback(async () => {
    const canvas = canvasRef.current
    if (!canvas) return

    stopGameLoop()
    setGameState('loading')

    try {
      const jsnes = await import('jsnes')
      const NES = jsnes.NES
      const Controller = jsnes.Controller

      // 高保真音频设置
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
      const audioCtx = new AudioContextClass({ sampleRate: 48000 })
      audioContextRef.current = audioCtx

      const compressor = audioCtx.createDynamicsCompressor()
      compressor.threshold.value = -24; compressor.knee.value = 30
      compressor.ratio.value = 12; compressor.attack.value = 0.003; compressor.release.value = 0.25
      const gainNode = audioCtx.createGain()
      gainNode.gain.value = 0.5
      gainNode.connect(compressor); compressor.connect(audioCtx.destination)

      const sampleRate = 48000
      const bufferSize = 4096
      const audioSamples: { left: number; right: number }[] = []
      let isPlaying = false

      const playAudio = () => {
        if (!isPlaying) return
        if (audioCtx.state === 'suspended') audioCtx.resume()
        const currentTime = audioCtx.currentTime
        const buffer = audioCtx.createBuffer(2, bufferSize, sampleRate)
        const leftChannel = buffer.getChannelData(0)
        const rightChannel = buffer.getChannelData(1)
        leftChannel.fill(0); rightChannel.fill(0)
        let bufferIndex = 0
        while (bufferIndex < bufferSize && audioSamples.length > 0) {
          const sample = audioSamples.shift()!
          leftChannel[bufferIndex] = Math.tanh(sample.left * 0.6)
          rightChannel[bufferIndex] = Math.tanh(sample.right * 0.6)
          bufferIndex++
        }
        while (audioSamples.length > 0) audioSamples.shift()
        const source = audioCtx.createBufferSource()
        source.buffer = buffer; source.connect(gainNode); source.start(currentTime)
        setTimeout(playAudio, (bufferSize / sampleRate) * 1000 - 30)
      }

      // 缓存源帧数据
      const srcPixels = new Uint32Array(256 * 240)

      const nes = new NES({
        onFrame: (frameBuffer: any) => {
          const ctx = canvas.getContext('2d')
          if (!ctx) return
          for (let i = 0; i < 256 * 240; i++) {
            const pixel = frameBuffer[i]
            srcPixels[i] = (255 << 24) | (((pixel >> 16) & 0xFF) << 8) | ((pixel & 0xFF)) | ((((pixel >> 8) & 0xFF) << 16))
          }
          const dstW = canvas.width; const dstH = canvas.height
          const imageData = ctx.createImageData(dstW, dstH)
          const dstData = imageData.data
          const scaleX = 256 / dstW; const scaleY = 240 / dstH
          for (let dy = 0; dy < dstH; dy++) {
            const sy = (dy * scaleY) | 0; const srcRow = sy * 256; const dstRow = dy * dstW
            for (let dx = 0; dx < dstW; dx++) {
              const sx = (dx * scaleX) | 0; const color = srcPixels[srcRow + sx]; const dstIdx = (dstRow + dx) << 2
              dstData[dstIdx] = color & 0xFF; dstData[dstIdx + 1] = (color >> 8) & 0xFF; dstData[dstIdx + 2] = (color >> 16) & 0xFF; dstData[dstIdx + 3] = 255
            }
          }
          ctx.putImageData(imageData, 0, 0)
        },
        onAudioSample: (left: number, right: number) => {
          if (!soundEnabledRef.current) return
          audioSamples.push({ left, right })
          if (audioSamples.length > 48000) audioSamples.splice(0, 4800)
          if (!isPlaying && audioSamples.length > 2048) { isPlaying = true; playAudio() }
        },
        onStatusUpdate: (status: string) => {
          if (status.includes('Score')) {
            const match = status.match(/Score:\s*(\d+)/)
            if (match) setScore(parseInt(match[1]))
          }
        },
      })

      // 加载ROM
      const response = await fetch('/roms/LodeRunner.nes')
      const arrayBuffer = await response.arrayBuffer()
      const romData = new Uint8Array(arrayBuffer)
      nes.loadROM(romData)

      nesRef.current = { nes, Controller, audioSamples, isPlaying: () => isPlaying }
      setGameState('start')
    } catch (e) {
      console.error('NES init error:', e)
      setGameState('start')
    }
  }, [stopGameLoop])

  // 游戏循环 (完全参照SuperMario)
  const startGameLoop = useCallback(() => {
    const nesWrapper = nesRef.current
    if (!nesWrapper?.nes) return
    const { nes, Controller } = nesWrapper

    isRunningRef.current = true
    const FRAME_TIME = 1000 / 60
    let timeAccumulator = 0
    let lastTime = performance.now()

    const loop = () => {
      if (!isRunningRef.current) return
      const keys = keysRef.current

      // 跳跃/挖洞 (Z/A) -> A按钮
      if (keys['z'] || keys['Z'] || keys[' '] || keys['x'] || keys['X']) {
        nes.buttonDown(1, Controller.BUTTON_A)
      } else {
        nes.buttonUp(1, Controller.BUTTON_A)
      }

      // B按钮 (C或Shift) -> 用于某些操作
      if (keys['c'] || keys['C']) {
        nes.buttonDown(1, Controller.BUTTON_B)
      } else {
        nes.buttonUp(1, Controller.BUTTON_B)
      }

      // 开始 (Enter)
      if (keys['Enter']) {
        nes.buttonDown(1, Controller.BUTTON_START)
      } else {
        nes.buttonUp(1, Controller.BUTTON_START)
      }

      // 选关 (Shift)
      if (keys['Shift'] || keys['Tab']) {
        nes.buttonDown(1, Controller.BUTTON_SELECT)
      } else {
        nes.buttonUp(1, Controller.BUTTON_SELECT)
      }

      // 方向键
      if (keys['ArrowUp'] || keys['w'] || keys['W']) nes.buttonDown(1, Controller.BUTTON_UP); else nes.buttonUp(1, Controller.BUTTON_UP)
      if (keys['ArrowDown'] || keys['s'] || keys['S']) nes.buttonDown(1, Controller.BUTTON_DOWN); else nes.buttonUp(1, Controller.BUTTON_DOWN)
      if (keys['ArrowLeft'] || keys['a'] || keys['A']) nes.buttonDown(1, Controller.BUTTON_LEFT); else nes.buttonUp(1, Controller.BUTTON_LEFT)
      if (keys['ArrowRight'] || keys['d'] || keys['D']) nes.buttonDown(1, Controller.BUTTON_RIGHT); else nes.buttonUp(1, Controller.BUTTON_RIGHT)

      // 时间累积器
      const speed = speedRef.current
      const currentTime = performance.now()
      timeAccumulator += (currentTime - lastTime) * speed
      lastTime = currentTime

      while (timeAccumulator >= FRAME_TIME) {
        nes.frame()
        timeAccumulator -= FRAME_TIME
      }

      animationRef.current = requestAnimationFrame(loop)
    }
    animationRef.current = requestAnimationFrame(loop)
  }, [])

  const resumeAudioContext = useCallback(() => {
    const audioCtx = audioContextRef.current
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume()
  }, [])

  const handleCanvasClick = useCallback(() => {
    canvasRef.current?.focus()
    resumeAudioContext()
  }, [resumeAudioContext])

  const togglePause = useCallback(() => {
    if (gameState === 'playing') { stopGameLoop(); setGameState('paused') }
    else if (gameState === 'paused') { setGameState('playing'); startGameLoop() }
  }, [gameState, startGameLoop, stopGameLoop])

  // 触摸控制 (参照SuperMario D-Pad布局)
  const handleTouchControl = useCallback((action: string, pressed: boolean) => {
    const keyMap: Record<string, string> = {
      up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight',
      a: 'z', b: 'c', start: 'Enter',
    }
    keysRef.current[keyMap[action]] = pressed
  }, [])

  useEffect(() => {
    initNES()

    // 禁用长按菜单
    const preventDefaults = (e: Event) => { e.preventDefault(); e.stopPropagation(); return false }
    document.addEventListener('contextmenu', preventDefaults)
    document.addEventListener('selectstart', preventDefaults)

    return () => {
      stopGameLoop()
      document.removeEventListener('contextmenu', preventDefaults)
      document.removeEventListener('selectstart', preventDefaults)
    }
  }, [initNES, stopGameLoop])

  // 键盘控制
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault()
      keysRef.current[e.key] = true
    }
    const handleKeyUp = (e: KeyboardEvent) => { keysRef.current[e.key] = false }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  // 重开游戏
  const restartGame = useCallback(async () => {
    await initNES()
    setTimeout(() => {
      if (nesRef.current?.nes) {
        setGameState('playing')
        startGameLoop()
      }
    }, 200)
  }, [initNES, startGameLoop])

  // 开始游戏
  const startGame = useCallback(() => {
    setGameState('playing')
    startGameLoop()
  }, [startGameLoop])

  // 全屏功能
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.()
    else document.exitFullscreen?.()
  }, [])

  // 画布尺寸 (参照SuperMario)
  const displayWidth = isMobile ? Math.min(screenWidth - 16, 560) : Math.min(window.innerWidth - 64, 640)
  const displayHeight = displayWidth * (240 / 256)

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.bg} overflow-x-hidden`}
      style={{ WebkitUserSelect: 'none', userSelect: 'none', WebkitTouchCallout: 'none' }}
      onContextMenu={e => e.preventDefault()} onTouchMove={() => {}}
    >
      {/* Header */}
      <div className={`sticky top-0 z-50 ${theme.headerBg} backdrop-blur-lg border-b ${isDark ? 'border-white/10' : 'border-amber-200/30'} safe-area-top`}>
        <div className={`mx-auto ${isMobile ? 'px-2 py-2' : 'max-w-6xl px-4 py-3'}`}>
          <div className="flex items-center justify-between">
            <Link to="/" className={`flex items-center gap-1 sm:gap-2 ${theme.textSubtle} hover:${theme.text} transition-colors rounded-lg p-2`}>
              <ChevronRight className={`w-4 h-4 sm:w-5 sm:h-5 rotate-180 ${theme.text}`} />
              <Home className={`w-4 h-4 hidden sm:block ${theme.text}`} />
              <span className={`text-sm ${theme.text}`}>{isMobile ? '返回' : '返回首页'}</span>
            </Link>

            <div className="flex items-center gap-2 sm:gap-4">
              <div className={`hidden sm:flex gap-3 ${theme.text}`}>
                <span className="text-sm">分数: <b className="text-yellow-400">{score}</b></span>
              </div>

              {gameState === 'playing' && (
                <button onClick={togglePause} className={`p-2 rounded-lg ${isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-amber-100/50'}`}>
                  <span className={theme.text}>⏸</span>
                </button>
              )}

              <button onClick={() => setSoundEnabled(!soundEnabled)} className={`p-2 rounded-lg ${isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-amber-100/50'}`}>
                {soundEnabled ? <Volume2 className={`w-4 h-4 ${theme.text}`} /> : <VolumeX className={`w-4 h-4 ${theme.text}`} />}
              </button>

              {/* 速度控制 */}
              <div className="flex items-center gap-1">
                <button onClick={() => setGameSpeed(prev => Math.max(0.25, Math.round((prev - 0.25) * 100) / 100))}
                  className={`px-2 py-1 rounded text-xs ${isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-amber-100/50'} ${theme.text}`}>-</button>
                <span className={`text-xs ${theme.text} min-w-[44px] text-center`}>{gameSpeed.toFixed(2)}x</span>
                <button onClick={() => setGameSpeed(prev => Math.min(2.0, Math.round((prev + 0.25) * 100) / 100))}
                  className={`px-2 py-1 rounded text-xs ${isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-amber-100/50'} ${theme.text}`}>+</button>
              </div>

              <button onClick={toggleFullscreen} className={`p-2 rounded-lg ${isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-amber-100/50'}`} title="全屏">
                <span className={`text-lg ${theme.text}`}>⛶</span>
              </button>

              <button onClick={restartGame}
                className={`flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-2 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 text-white font-medium active:scale-95`}>
                <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm">重开</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center p-4 pb-32">
        {/* Title */}
        <h1 className={`font-bold mb-2 ${isMobile ? 'text-2xl' : 'text-4xl'} ${theme.text}`}>💰 淘金者 Lode Runner</h1>
        <p className={`${theme.textSubtle} text-sm mb-4`}>经典FC淘金者 · jsnes模拟器</p>

        {/* Game Canvas */}
        <div className="relative select-none" style={{ width: displayWidth, height: displayHeight }}>
          <canvas
            ref={canvasRef}
            width={displayWidth}
            height={displayHeight}
            tabIndex={0}
            onClick={handleCanvasClick}
            className="rounded-lg border-4 border-white/20 shadow-2xl cursor-pointer outline-none block"
            style={{ imageRendering: 'pixelated', WebkitUserSelect: 'none', userSelect: 'none' }}
          />

          {/* Loading */}
          {gameState === 'loading' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 rounded-lg">
              <div className="text-center">
                <div className="animate-spin text-4xl mb-4">⛏️</div>
                <p className={theme.text}>加载ROM中...</p>
              </div>
            </div>
          )}

          {/* Start Screen */}
          {gameState === 'start' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 rounded-lg">
              <div className="text-center">
                <div className="text-6xl mb-4">⛏️</div>
                <h2 className={`text-3xl font-bold mb-4 ${theme.text}`}>淘金者</h2>
                <p className={`${theme.textSubtle} text-sm mb-6`}>Lode Runner FC</p>
                <button onClick={startGame}
                  className={`px-8 py-3 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold text-lg active:scale-95 transition-transform`}>
                  开始游戏
                </button>
                <p className={`${theme.textSubtle} text-xs mt-4 space-y-1`}>
                  <p>← → ↑ ↓ 移动 | 空格/Z 挖洞 | Enter 开始</p>
                </p>
              </div>
            </div>
          )}

          {/* Paused */}
          {gameState === 'paused' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-lg">
              <div className="text-center">
                <div className="text-6xl mb-4">⏸️</div>
                <p className={`text-2xl font-bold ${theme.text}`}>暂停</p>
                <button onClick={togglePause} className="mt-4 px-6 py-2 rounded-lg bg-amber-600 text-white font-bold">继续</button>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Controls - 完全参照SuperMario的D-Pad布局 */}
        {gameState === 'playing' && (
          <div
            className="fixed bottom-0 left-0 right-0 pb-4 pt-2 bg-gradient-to-t from-black/80 to-transparent select-none"
            style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))', WebkitUserSelect: 'none', userSelect: 'none', WebkitTouchCallout: 'none', touchAction: 'none' }}
          >
            <div className="flex justify-between items-end px-4 mx-auto max-w-lg">
              {/* D-Pad 方向键 */}
              <div className="flex flex-col items-center gap-1">
                <button
                  onTouchStart={(e) => { e.preventDefault(); handleTouchControl('up', true) }}
                  onTouchEnd={(e) => { e.preventDefault(); handleTouchControl('up', false) }}
                  onTouchCancel={() => handleTouchControl('up', false)}
                  className={`w-12 h-12 rounded-xl ${isDark ? 'bg-white/20 active:bg-white/40' : 'bg-white/60 active:bg-white/80'} flex items-center justify-center text-xl ${theme.text} transition-colors active:scale-95 shadow-lg`}
                  style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
                >↑</button>
                <div className="flex gap-1">
                  {(['left', 'down', 'right'] as const).map(dir => (
                    <button
                      key={dir}
                      onTouchStart={(e) => { e.preventDefault(); handleTouchControl(dir, true) }}
                      onTouchEnd={(e) => { e.preventDefault(); handleTouchControl(dir, false) }}
                      onTouchCancel={() => handleTouchControl(dir, false)}
                      className={`w-12 h-12 rounded-xl ${isDark ? 'bg-white/20 active:bg-white/40' : 'bg-white/60 active:bg-white/80'} flex items-center justify-center text-xl ${theme.text} transition-colors active:scale-95 shadow-lg`}
                      style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
                    >
                      {dir === 'left' ? '←' : dir === 'right' ? '→' : '↓'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons 动作按钮 */}
              <div className="flex gap-3 items-end">
                {/* A按钮 - 挖洞/跳跃 */}
                <button
                  onTouchStart={(e) => { e.preventDefault(); handleTouchControl('a', true) }}
                  onTouchEnd={(e) => { e.preventDefault(); handleTouchControl('a', false) }}
                  onTouchCancel={() => handleTouchControl('a', false)}
                  className="w-16 h-16 rounded-full bg-green-600/90 active:bg-green-500 flex items-center justify-center text-white font-bold text-lg shadow-lg active:scale-95"
                  style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
                >挖</button>
                {/* B按钮 */}
                <button
                  onTouchStart={(e) => { e.preventDefault(); handleTouchControl('b', true) }}
                  onTouchEnd={(e) => { e.preventDefault(); handleTouchControl('b', false) }}
                  onTouchCancel={() => handleTouchControl('b', false)}
                  className="w-14 h-14 rounded-full bg-orange-600/90 active:bg-orange-500 flex items-center justify-center text-white font-bold shadow-lg active:scale-95"
                  style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
                >B</button>
                {/* START按钮 */}
                <button
                  onTouchStart={(e) => { e.preventDefault(); handleTouchControl('start', true) }}
                  onTouchEnd={(e) => { e.preventDefault(); handleTouchControl('start', false) }}
                  onTouchCancel={() => handleTouchControl('start', false)}
                  className="w-12 h-12 rounded-xl bg-gray-600/90 active:bg-gray-500 flex items-center justify-center text-white text-xs font-bold shadow-lg active:scale-95"
                  style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
                >开始</button>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-6 text-center max-w-md">
          <h3 className={`${theme.text} font-semibold mb-1`}>操作说明</h3>
          <p className={`${theme.textSubtle} text-xs leading-relaxed`}>
            键盘：← → ↑ ↓ 移动 | <span className="text-green-400">空格/Z/X</span> 挖洞 | Enter 开始<br/>
            收集所有金块，用挖洞困住敌人！
          </p>
        </div>
      </div>
    </div>
  )
}

export default LodeRunner
