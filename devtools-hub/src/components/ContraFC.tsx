import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Home, RotateCcw, ChevronRight, Volume2, VolumeX, Save } from 'lucide-react'
import { getContraROM } from '../contraRom'

// 魂斗罗 - 原汁原味FC复刻版
const ContraFC: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const nesRef = useRef<any>(null)
  const animationRef = useRef<number>(0)
  const isRunningRef = useRef(false)
  const canvasContainerRef = useRef<HTMLDivElement>(null)
  const [gameState, setGameState] = useState<'loading' | 'start' | 'playing' | 'paused'>('loading')
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [isDark, setIsDark] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [screenWidth, setScreenWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 375)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [showSave, setShowSave] = useState(false)
  const [gameSpeed, setGameSpeed] = useState(1.0)
  const speedRef = useRef(1.0)
  
  // 音频相关 refs
  const audioContextRef = useRef<AudioContext | null>(null)
  const soundEnabledRef = useRef(true)
  
  // 同步 soundEnabled 到 ref
  useEffect(() => {
    soundEnabledRef.current = soundEnabled
  }, [soundEnabled])

  // 同步 gameSpeed 到 ref
  useEffect(() => {
    speedRef.current = gameSpeed
  }, [gameSpeed])
  
  // 按键状态
  const keysRef = useRef<{ [key: string]: boolean }>({})

  // 主题
  const theme = {
    bg: isDark ? 'from-red-950 via-red-900 to-orange-900' : 'from-red-200 via-orange-200 to-yellow-200',
    headerBg: isDark ? 'bg-black/40' : 'bg-white/80',
    text: isDark ? 'text-white' : 'text-red-900',
    textSubtle: isDark ? 'text-white/60' : 'text-red-700/70',
  }

  // 检测移动端
  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768 || 'ontouchstart' in window
      setIsMobile(mobile)
      setScreenWidth(window.innerWidth)
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // 主题检测
  useEffect(() => {
    setIsDark(localStorage.getItem('devtools-theme') !== 'light')
  }, [])

  // 停止游戏循环
  const stopGameLoop = useCallback(() => {
    isRunningRef.current = false
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = 0
    }
  }, [])

  // 初始化NES模拟器
  const initNES = useCallback(async () => {
    const canvas = canvasRef.current
    if (!canvas) return

    stopGameLoop()
    
    try {
      setGameState('loading')
      
      const jsnes = await import('jsnes')
      const NES = jsnes.NES
      const Controller = jsnes.Controller
      
      // 高保真音频设置：48000Hz 采样率
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
      const audioCtx = new AudioContextClass({ sampleRate: 48000 })
      audioContextRef.current = audioCtx
      
      // 添加压缩器减少刺耳
      const compressor = audioCtx.createDynamicsCompressor()
      compressor.threshold.value = -24
      compressor.knee.value = 30
      compressor.ratio.value = 12
      compressor.attack.value = 0.003
      compressor.release.value = 0.25
      
      // 添加增益节点
      const gainNode = audioCtx.createGain()
      gainNode.gain.value = 0.5
      
      gainNode.connect(compressor)
      compressor.connect(audioCtx.destination)
      
      // 高保真缓冲区大小
      const sampleRate = 48000
      const bufferSize = 4096  // 更大的缓冲区减少杂音
      
      // 音频样本缓冲区
      const audioSamples: { left: number; right: number }[] = []
      let isPlaying = false
      
      // 音频播放循环
      const playAudio = () => {
        if (!isPlaying) return
        if (audioCtx.state === 'suspended') {
          audioCtx.resume()
        }
        
        const currentTime = audioCtx.currentTime
        const buffer = audioCtx.createBuffer(2, bufferSize, sampleRate)
        const leftChannel = buffer.getChannelData(0)
        const rightChannel = buffer.getChannelData(1)
        
        // 清零缓冲区
        leftChannel.fill(0)
        rightChannel.fill(0)
        
        // 将音频样本填充到缓冲区
        let bufferIndex = 0
        while (bufferIndex < bufferSize && audioSamples.length > 0) {
          const sample = audioSamples.shift()!
          // 应用软限制避免削波
          const leftSample = Math.tanh(sample.left * 0.6)
          const rightSample = Math.tanh(sample.right * 0.6)
          leftChannel[bufferIndex] = leftSample
          rightChannel[bufferIndex] = rightSample
          bufferIndex++
        }
        
        // 清空多余的样本
        while (audioSamples.length > 0) {
          audioSamples.shift()
        }
        
        const source = audioCtx.createBufferSource()
        source.buffer = buffer
        source.connect(gainNode)
        source.start(currentTime)
        
        setTimeout(playAudio, (bufferSize / sampleRate) * 1000 - 30)
      }
      
      const nes = new NES({
        onFrame: (frameBuffer: any) => {
          const ctx = canvas.getContext('2d')
          if (!ctx) return

          const imageData = ctx.createImageData(256, 240)
          for (let i = 0; i < 256 * 240; i++) {
            const pixel = frameBuffer[i]
            imageData.data[i * 4] = (pixel & 0xFF) || 0
            imageData.data[i * 4 + 1] = (pixel >> 8) & 0xFF || 0
            imageData.data[i * 4 + 2] = (pixel >> 16) & 0xFF || 0
            imageData.data[i * 4 + 3] = 255
          }
          ctx.putImageData(imageData, 0, 0)
        },
        onAudioSample: (left: number, right: number) => {
          if (!soundEnabledRef.current) return
          // 收集音频样本到缓冲区
          audioSamples.push({ left, right })
          // 限制缓冲区大小（1秒的样本）
          if (audioSamples.length > 48000) {
            audioSamples.splice(0, 4800)
          }
          // 开始播放（如果还没开始）
          if (!isPlaying && audioSamples.length > 2048) {
            isPlaying = true
            playAudio()
          }
        },
        onStatusUpdate: (status: string) => {
          if (status.includes('Score')) {
            const match = status.match(/Score:\s*(\d+)/)
            if (match) setScore(parseInt(match[1]))
          }
          if (status.includes('Lives')) {
            const match = status.match(/Lives:\s*(\d+)/)
            if (match) setLives(parseInt(match[1]))
          }
        },
      })

      nesRef.current = { nes, Controller, audioSamples, isPlaying: () => isPlaying }
      setGameState('start')
    } catch (e) {
      console.error('NES init error:', e)
      setGameState('start')
    }
  }, [stopGameLoop])

  // 游戏循环
  const startGameLoop = useCallback(() => {
    const nesWrapper = nesRef.current
    if (!nesWrapper?.nes) return
    const { nes, Controller } = nesWrapper

    isRunningRef.current = true

    // 时间累积器（FC帧率约60fps，每帧16.67ms）
    const FRAME_TIME = 1000 / 60
    let timeAccumulator = 0
    let lastTime = performance.now()

    const loop = () => {
      if (!isRunningRef.current) return

      const keys = keysRef.current
      
      // 跳跃 (C) -> A按钮
      if (keys['c'] || keys['C']) {
        nes.buttonDown(1, Controller.BUTTON_A)
      } else {
        nes.buttonUp(1, Controller.BUTTON_A)
      }
      
      // 射击 (X) -> B按钮
      if (keys['x'] || keys['X']) {
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
      if (keys['Shift']) {
        nes.buttonDown(1, Controller.BUTTON_SELECT)
      } else {
        nes.buttonUp(1, Controller.BUTTON_SELECT)
      }
      
      // 方向键
      if (keys['ArrowUp'] || keys['w'] || keys['W']) {
        nes.buttonDown(1, Controller.BUTTON_UP)
      } else {
        nes.buttonUp(1, Controller.BUTTON_UP)
      }
      
      if (keys['ArrowDown'] || keys['s'] || keys['S']) {
        nes.buttonDown(1, Controller.BUTTON_DOWN)
      } else {
        nes.buttonUp(1, Controller.BUTTON_DOWN)
      }
      
      if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
        nes.buttonDown(1, Controller.BUTTON_LEFT)
      } else {
        nes.buttonUp(1, Controller.BUTTON_LEFT)
      }
      
      if (keys['ArrowRight'] || keys['d'] || keys['D']) {
        nes.buttonDown(1, Controller.BUTTON_RIGHT)
      } else {
        nes.buttonUp(1, Controller.BUTTON_RIGHT)
      }
      
      // 速度控制：使用时间累积器，保证不同设备速度一致
      const speed = speedRef.current
      const currentTime = performance.now()
      const deltaTime = currentTime - lastTime
      lastTime = currentTime

      timeAccumulator += deltaTime * speed

      while (timeAccumulator >= FRAME_TIME) {
        nes.frame()
        timeAccumulator -= FRAME_TIME
      }

      animationRef.current = requestAnimationFrame(loop)
    }

    animationRef.current = requestAnimationFrame(loop)
  }, [])

  // 恢复音频上下文（浏览器要求用户交互后才能播放）
  const resumeAudioContext = useCallback(() => {
    const audioCtx = audioContextRef.current
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume()
    }
  }, [])

  // 加载ROM并运行
  const loadAndRunROM = useCallback(async () => {
    stopGameLoop()
    setGameState('loading')
    
    try {
      // 使用内嵌的 ROM 数据，避免网络加载问题
      const romData = getContraROM()
      const nesWrapper = nesRef.current
      
      // 恢复音频上下文（浏览器要求）
      resumeAudioContext()
      
      if (nesWrapper?.nes) {
        nesWrapper.nes.loadROM(new Uint8Array(romData))
        setGameState('playing')
        keysRef.current = {}
        startGameLoop()
      } else {
        console.error('NES not initialized')
        setGameState('start')
      }
    } catch (error) {
      console.error('ROM load error:', error)
      setGameState('start')
    }
  }, [startGameLoop, stopGameLoop, resumeAudioContext])

  // 重新开始
  const restartGame = useCallback(async () => {
    await initNES()
    setTimeout(async () => {
      await loadAndRunROM()
    }, 100)
  }, [initNES, loadAndRunROM])

  // 键盘控制
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault()
      }
      keysRef.current[e.key] = true
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key] = false
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  // 触摸控制 - a=跳跃(C键), b=射击(X键)
  const handleTouchControl = useCallback((action: string, pressed: boolean) => {
    const keyMap: Record<string, string> = {
      up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight',
      a: 'c', b: 'x', start: 'Enter',
    }
    keysRef.current[keyMap[action]] = pressed
  }, [])

  // 全屏功能
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.()
    } else {
      document.exitFullscreen?.()
    }
  }, [])

  // 存档
  const saveGame = useCallback((slot: number) => {
    const nesWrapper = nesRef.current
    if (!nesWrapper?.nes) return
    
    try {
      const state = nesWrapper.nes.save()
      localStorage.setItem(`contra-save-${slot}`, JSON.stringify(Array.from(state)))
      alert(`存档 ${slot + 1} 保存成功！`)
    } catch (e) {
      console.error('Save failed:', e)
    }
  }, [])

  // 读档
  const loadGame = useCallback((slot: number) => {
    const nesWrapper = nesRef.current
    if (!nesWrapper?.nes) return
    
    try {
      const saved = localStorage.getItem(`contra-save-${slot}`)
      if (saved) {
        const state = new Uint8Array(JSON.parse(saved))
        nesWrapper.nes.load(state)
        setGameState('playing')
        keysRef.current = {}
        if (!isRunningRef.current) {
          startGameLoop()
        }
      } else {
        alert('该存档位为空')
      }
    } catch (e) {
      console.error('Load failed:', e)
    }
  }, [startGameLoop])

  // 暂停/恢复
  const togglePause = useCallback(() => {
    if (gameState === 'playing') {
      stopGameLoop()
      setGameState('paused')
    } else if (gameState === 'paused') {
      setGameState('playing')
      startGameLoop()
    }
  }, [gameState, startGameLoop, stopGameLoop])

  // 初始化 - 禁用长按菜单和复制
  useEffect(() => {
    initNES()
    
    const preventDefaults = (e: Event) => {
      e.preventDefault()
      e.stopPropagation()
      return false
    }
    
    document.addEventListener('contextmenu', preventDefaults)
    document.addEventListener('selectstart', preventDefaults)
    
    return () => {
      stopGameLoop()
      document.removeEventListener('contextmenu', preventDefaults)
      document.removeEventListener('selectstart', preventDefaults)
    }
  }, [initNES, stopGameLoop])

  // 点击画布自动获取焦点
  const handleCanvasClick = useCallback(() => {
    canvasRef.current?.focus()
    resumeAudioContext()
  }, [resumeAudioContext])

  const canvasWidth = isMobile ? Math.min(screenWidth - 32, 480) : 512

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.bg} overflow-x-hidden`}
      style={{ WebkitUserSelect: 'none', userSelect: 'none', WebkitTouchCallout: 'none' }}
      onContextMenu={(e) => e.preventDefault()}
      onTouchMove={() => {}}
    >
      {/* Header */}
      <div className={`sticky top-0 z-50 ${theme.headerBg} backdrop-blur-lg border-b ${isDark ? 'border-white/10' : 'border-red-200/30'} safe-area-top`}>
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
                <span className="text-sm">命: <b className="text-red-400">{lives}</b></span>
              </div>
              
              {gameState === 'playing' && (
                <button onClick={togglePause}
                  className={`p-2 rounded-lg ${isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-red-100/50'} transition-colors`}>
                  <span className={theme.text}>⏸</span>
                </button>
              )}

              <button onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-2 rounded-lg ${isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-red-100/50'} transition-colors`}>
                {soundEnabled ? <Volume2 className={`w-4 h-4 ${theme.text}`} /> : <VolumeX className={`w-4 h-4 ${theme.text}`} />}
              </button>

              {/* 速度控制 */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setGameSpeed(prev => Math.max(0.25, Math.round((prev - 0.25) * 100) / 100))}
                  className={`px-2 py-1 rounded text-xs ${isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-red-100/50'} ${theme.text} transition-colors`}
                >
                  -
                </button>
                <span className={`text-xs ${theme.text} min-w-[40px] text-center`}>{gameSpeed.toFixed(2)}x</span>
                <button
                  onClick={() => setGameSpeed(prev => Math.min(2.0, Math.round((prev + 0.25) * 100) / 100))}
                  className={`px-2 py-1 rounded text-xs ${isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-red-100/50'} ${theme.text} transition-colors`}
                >
                  +
                </button>
              </div>

              <button onClick={() => setShowSave(!showSave)}
                className={`p-2 rounded-lg ${isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-red-100/50'} transition-colors`}>
                <Save className={`w-4 h-4 ${theme.text}`} />
              </button>

              <button onClick={toggleFullscreen}
                className={`p-2 rounded-lg ${isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-red-100/50'} transition-colors`}
                title="全屏">
                <span className={`text-lg ${theme.text}`}>⛶</span>
              </button>

              <button onClick={restartGame}
                className={`flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-2 rounded-lg bg-gradient-to-r from-red-600 to-orange-600 text-white font-medium transition-all active:scale-95`}>
                <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm">重开</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center p-4">
        {/* Title */}
        <h1 className={`font-bold mb-2 ${isMobile ? 'text-2xl' : 'text-4xl'} ${theme.text}`}>
          🎮 魂斗罗 CONTRA
        </h1>
        <p className={`${theme.textSubtle} text-sm mb-4`}>原汁原味FC经典复刻</p>

        {/* Game Canvas */}
        <div ref={canvasContainerRef} className="relative select-none" style={{ WebkitUserSelect: 'none', userSelect: 'none', WebkitTouchCallout: 'none' }}>
          <canvas
            ref={canvasRef}
            width={256}
            height={240}
            tabIndex={0}
            onClick={handleCanvasClick}
            className="rounded-lg border-4 border-white/20 shadow-2xl cursor-pointer outline-none"
            style={{
              width: canvasWidth,
              height: canvasWidth * (240 / 256),
              imageRendering: 'pixelated',
            }}
          />

          {/* Loading */}
          {gameState === 'loading' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 rounded-lg">
              <div className="text-center">
                <div className="animate-spin text-4xl mb-4">🎮</div>
                <p className={theme.text}>加载中...</p>
              </div>
            </div>
          )}

          {/* Paused */}
          {gameState === 'paused' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-lg">
              <div className="text-center">
                <div className="text-6xl mb-4">⏸️</div>
                <p className={`text-2xl font-bold ${theme.text}`}>暂停</p>
                <button onClick={togglePause} className={`mt-4 px-6 py-2 rounded-lg bg-red-600 text-white font-bold`}>
                  继续
                </button>
              </div>
            </div>
          )}

          {/* Start Screen */}
          {gameState === 'start' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 rounded-lg">
              <div className="text-center">
                <div className="text-6xl mb-4">🎮</div>
                <h2 className={`text-3xl font-bold mb-4 ${theme.text}`}>魂斗罗</h2>
                <p className={`${theme.textSubtle} text-sm mb-4`}>CONTRA</p>
                
                <div className={`${theme.textSubtle} text-xs mb-6 space-y-1`}>
                  <p>← → 移动 | ↑ 跳跃 | ↓ 下蹲</p>
                  <p><span className="text-green-400">C</span> 跳跃 | <span className="text-yellow-400">X</span> 射击 | Enter 开始</p>
                </div>

                <button
                  onClick={loadAndRunROM}
                  className={`px-8 py-3 rounded-lg bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold text-lg active:scale-95 transition-transform mb-3`}
                >
                  开始游戏
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Save/Load Panel */}
        {showSave && (
          <div className={`mt-4 p-4 rounded-xl ${isDark ? 'bg-white/10' : 'bg-white/80'} backdrop-blur-lg`}>
            <h3 className={`font-bold mb-3 ${theme.text}`}>存档/读档</h3>
            <div className="flex gap-4">
              {[0, 1, 2].map(slot => (
                <div key={slot} className="text-center">
                  <p className={`text-xs ${theme.textSubtle} mb-2`}>存档 {slot + 1}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveGame(slot)}
                      className={`px-3 py-1 rounded text-sm ${isDark ? 'bg-green-600/50 hover:bg-green-600' : 'bg-green-400'} text-white`}
                    >
                      保存
                    </button>
                    <button
                      onClick={() => loadGame(slot)}
                      className={`px-3 py-1 rounded text-sm ${isDark ? 'bg-blue-600/50 hover:bg-blue-600' : 'bg-blue-400'} text-white`}
                    >
                      读取
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mobile Controls - 始终显示在移动端 */}
        {(isMobile || true) && gameState === 'playing' && (
          <div 
            className="mt-4 flex justify-between w-full px-2 select-none"
          >
            {/* D-Pad */}
            <div className="flex flex-col items-center gap-1">
              <button
                onTouchStart={(e) => { e.preventDefault(); handleTouchControl('up', true) }}
                onTouchEnd={(e) => { e.preventDefault(); handleTouchControl('up', false) }}
                onTouchCancel={() => handleTouchControl('up', false)}
                className={`w-14 h-14 rounded-xl ${isDark ? 'bg-white/20 active:bg-white/40' : 'bg-white/60 active:bg-white/80'} flex items-center justify-center text-2xl ${theme.text} transition-colors active:scale-95`}
                style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
              >
                ↑
              </button>
              <div className="flex gap-1">
                {(['left', 'down', 'right'] as const).map(dir => (
                  <button
                    key={dir}
                    onTouchStart={(e) => { e.preventDefault(); handleTouchControl(dir, true) }}
                    onTouchEnd={(e) => { e.preventDefault(); handleTouchControl(dir, false) }}
                    onTouchCancel={() => handleTouchControl(dir, false)}
                    className={`w-14 h-14 rounded-xl ${isDark ? 'bg-white/20 active:bg-white/40' : 'bg-white/60 active:bg-white/80'} flex items-center justify-center text-2xl ${theme.text} transition-colors active:scale-95`}
                    style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
                  >
                    {dir === 'left' ? '←' : dir === 'right' ? '→' : '↓'}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 items-center">
              {/* B按钮 - 射击 */}
              <button
                onTouchStart={(e) => { e.preventDefault(); handleTouchControl('b', true) }}
                onTouchEnd={(e) => { e.preventDefault(); handleTouchControl('b', false) }}
                onTouchCancel={() => handleTouchControl('b', false)}
                className="w-16 h-16 rounded-full bg-red-600/80 active:bg-red-500 flex items-center justify-center text-white font-bold text-lg shadow-lg active:scale-95"
                style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
              >
                射击
              </button>
              {/* A按钮 - 跳跃 */}
              <button
                onTouchStart={(e) => { e.preventDefault(); handleTouchControl('a', true) }}
                onTouchEnd={(e) => { e.preventDefault(); handleTouchControl('a', false) }}
                onTouchCancel={() => handleTouchControl('a', false)}
                className="w-20 h-20 rounded-full bg-green-600/80 active:bg-green-500 flex items-center justify-center text-white font-bold text-xl shadow-lg active:scale-95"
                style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
              >
                跳跃
              </button>
              {/* START按钮 */}
              <button
                onTouchStart={(e) => { e.preventDefault(); handleTouchControl('start', true) }}
                onTouchEnd={(e) => { e.preventDefault(); handleTouchControl('start', false) }}
                onTouchCancel={() => handleTouchControl('start', false)}
                className="w-12 h-12 rounded-xl bg-gray-600/80 active:bg-gray-500 flex items-center justify-center text-white text-xs font-bold shadow-lg active:scale-95"
                style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
              >
                开始
              </button>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-6 text-center max-w-md">
          <h3 className={`${theme.text} font-semibold mb-1`}>操作说明</h3>
          <p className={`${theme.textSubtle} text-xs leading-relaxed`}>
            键盘：← → 移动 | ↑ 跳跃 | ↓ 下蹲<br/>
            <span className="text-green-400">C</span> 跳跃 | <span className="text-yellow-400">X</span> 射击 | Enter 开始
          </p>
        </div>
      </div>
    </div>
  )
}

export default ContraFC
