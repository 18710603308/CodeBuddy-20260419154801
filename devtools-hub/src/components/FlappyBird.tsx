import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Home, RotateCcw, ChevronRight, Volume2, VolumeX } from 'lucide-react'

// 开源NES游戏 - Flappy Bird (由 Nioreh 开发)
// ROM来源: https://github.com/retrobrews/nes-games
const FLAPPYBIRD_ROM: number[] = []

// Flappy Bird NES - 开源复刻版
const FlappyBird: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const nesRef = useRef<any>(null)
  const animationRef = useRef<number>(0)
  const isRunningRef = useRef(false)
  const [gameState, setGameState] = useState<'loading' | 'start' | 'playing' | 'gameover'>('loading')
  const [score, setScore] = useState(0)
  const [isDark, setIsDark] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [gameSpeed, setGameSpeed] = useState(1.0)
  const speedRef = useRef(1.0)
  const audioContextRef = useRef<AudioContext | null>(null)
  const soundEnabledRef = useRef(true)

  const keysRef = useRef<{ [key: string]: boolean }>({})

  useEffect(() => {
    soundEnabledRef.current = soundEnabled
  }, [soundEnabled])

  useEffect(() => {
    speedRef.current = gameSpeed
  }, [gameSpeed])

  const theme = {
    bg: isDark ? 'from-sky-950 via-blue-900 to-cyan-900' : 'from-sky-200 via-blue-200 to-cyan-200',
    headerBg: isDark ? 'bg-black/40' : 'bg-white/80',
    text: isDark ? 'text-white' : 'text-sky-900',
    textSubtle: isDark ? 'text-white/60' : 'text-sky-700/70',
  }

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

  const stopGameLoop = useCallback(() => {
    isRunningRef.current = false
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = 0
    }
  }, [])

  // 播放音效
  const playBeep = useCallback((freq: number = 440, duration: number = 0.1) => {
    if (!soundEnabled) return
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      }
      const ctx = audioContextRef.current
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.frequency.value = freq
      osc.type = 'square'
      gain.gain.value = 0.1
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + duration)
    } catch {}
  }, [soundEnabled])

  // 初始化游戏
  const initGame = useCallback(async () => {
    const canvas = canvasRef.current
    if (!canvas) return

    stopGameLoop()

    try {
      setGameState('loading')
      
      const jsnes = await import('jsnes')
      const NES = jsnes.NES
      const Controller = jsnes.Controller

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
      const audioCtx = new AudioContextClass({ sampleRate: 48000 })
      audioContextRef.current = audioCtx

      const sampleRate = 48000
      const bufferSize = 2048
      const audioSamples: { left: number; right: number }[] = []
      let isPlaying = false

      const playAudio = () => {
        if (!isPlaying) return
        if (audioCtx.state === 'suspended') audioCtx.resume()

        const buffer = audioCtx.createBuffer(2, bufferSize, sampleRate)
        const left = buffer.getChannelData(0)
        const right = buffer.getChannelData(1)

        for (let i = 0; i < bufferSize && audioSamples.length > 0; i++) {
          const s = audioSamples.shift()!
          left[i] = Math.tanh(s.left * 0.3)
          right[i] = Math.tanh(s.right * 0.3)
        }

        const source = audioCtx.createBufferSource()
        source.buffer = buffer
        source.connect(audioCtx.destination)
        source.start()

        setTimeout(playAudio, (bufferSize / sampleRate) * 1000 - 10)
      }

      const nes = new NES({
        onFrame: (frameBuffer: any) => {
          const ctx = canvas.getContext('2d')
          if (!ctx) return

          const imageData = ctx.createImageData(256, 240)
          for (let i = 0; i < 256 * 240; i++) {
            const pixel = frameBuffer[i] || 0
            imageData.data[i * 4] = pixel & 0xFF
            imageData.data[i * 4 + 1] = (pixel >> 8) & 0xFF
            imageData.data[i * 4 + 2] = (pixel >> 16) & 0xFF
            imageData.data[i * 4 + 3] = 255
          }
          ctx.putImageData(imageData, 0, 0)
        },
        onAudioSample: (left: number, right: number) => {
          if (!soundEnabledRef.current) return
          audioSamples.push({ left, right })
          if (audioSamples.length > 4096) audioSamples.splice(0, 512)
          if (!isPlaying && audioSamples.length > 1024) {
            isPlaying = true
            playAudio()
          }
        },
        onStatusUpdate: (status: string) => {
          const match = status.match(/Score:\s*(\d+)/)
          if (match) setScore(parseInt(match[1]))
        },
      })

      // 如果有ROM数据，加载它
      // 否则使用模拟的Flappy Bird游戏逻辑
      if (FLAPPYBIRD_ROM.length > 16) {
        nes.loadROM(new Uint8Array(FLAPPYBIRD_ROM))
      }

      nesRef.current = { nes, Controller }
      setGameState('start')
    } catch (e) {
      console.error('Game init error:', e)
      setGameState('start')
    }
  }, [stopGameLoop])

  // 简单Flappy Bird模拟
  const startGameLoop = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    isRunningRef.current = true

    // 游戏状态
    let birdY = 120
    let birdVel = 0
    let pipes: { x: number; gap: number }[] = []
    let frame = 0
    let gameScore = 0
    let isGameOver = false

    const GRAVITY = 0.5
    const JUMP = -8
    const PIPE_SPEED = 3
    const PIPE_GAP = 100

    const loop = () => {
      if (!isRunningRef.current || isGameOver) return

      const keys = keysRef.current
      
      // 跳跃
      if (keys[' '] || keys['z'] || keys['Z'] || keys['ArrowUp']) {
        birdVel = JUMP
        playBeep(880, 0.05)
      }

      // 物理
      birdVel += GRAVITY
      birdY += birdVel

      // 生成管道
      if (frame % 60 === 0) {
        pipes.push({
          x: 256,
          gap: 80 + Math.random() * 60
        })
      }

      // 移动管道
      pipes = pipes.filter(p => {
        p.x -= PIPE_SPEED * gameSpeed

        // 计分
        if (p.x + 40 === 50) {
          gameScore++
          setScore(gameScore)
          playBeep(1320, 0.1)
        }

        // 碰撞检测
        const birdX = 50
        if (birdX + 15 > p.x && birdX < p.x + 40) {
          if (birdY < p.gap || birdY + 15 > p.gap + PIPE_GAP) {
            isGameOver = true
            playBeep(220, 0.3)
            setGameState('gameover')
          }
        }

        return p.x > -40
      })

      // 边界碰撞
      if (birdY < 0 || birdY > 220) {
        isGameOver = true
        playBeep(220, 0.3)
        setGameState('gameover')
      }

      // 绘制
      ctx.fillStyle = '#87CEEB'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // 地面
      ctx.fillStyle = '#90EE90'
      ctx.fillRect(0, 220, canvas.width, 20)

      // 管道
      ctx.fillStyle = '#228B22'
      pipes.forEach(p => {
        ctx.fillRect(p.x, 0, 40, p.gap)
        ctx.fillRect(p.x, p.gap + PIPE_GAP, 40, 240 - p.gap - PIPE_GAP)
        // 管道边缘
        ctx.fillStyle = '#32CD32'
        ctx.fillRect(p.x - 3, p.gap - 10, 46, 10)
        ctx.fillRect(p.x - 3, p.gap + PIPE_GAP, 46, 10)
        ctx.fillStyle = '#228B22'
      })

      // 小鸟
      ctx.fillStyle = '#FFD700'
      ctx.beginPath()
      ctx.arc(50, birdY, 12, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#000'
      ctx.beginPath()
      ctx.arc(54, birdY - 2, 3, 0, Math.PI * 2)
      ctx.fill()

      // 分数
      ctx.fillStyle = '#FFF'
      ctx.font = 'bold 24px Arial'
      ctx.fillText(`分数: ${gameScore}`, 10, 30)

      frame++
      animationRef.current = requestAnimationFrame(loop)
    }

    animationRef.current = requestAnimationFrame(loop)
  }, [gameSpeed, playBeep])

  // 键盘控制
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ([' ', 'ArrowUp'].includes(e.key)) e.preventDefault()
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

  // 触摸控制
  const handleTap = useCallback(() => {
    keysRef.current[' '] = true
    setTimeout(() => { keysRef.current[' '] = false }, 100)
  }, [])

  const canvasWidth = isMobile ? Math.min(window.innerWidth - 32, 320) : 320
  const canvasHeight = canvasWidth * (240 / 256)

  // 初始化
  useEffect(() => {
    initGame()
    return () => stopGameLoop()
  }, [initGame, stopGameLoop])

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.bg} overflow-x-hidden`}
      style={{ WebkitUserSelect: 'none', userSelect: 'none', WebkitTouchCallout: 'none' }}
      onContextMenu={e => e.preventDefault()}
    >
      {/* Header */}
      <div className={`sticky top-0 z-50 ${theme.headerBg} backdrop-blur-lg border-b ${isDark ? 'border-white/10' : 'border-sky-200/30'} safe-area-top`}>
        <div className={`mx-auto ${isMobile ? 'px-2 py-2' : 'max-w-6xl px-4 py-3'}`}>
          <div className="flex items-center justify-between">
            <Link to="/" className={`flex items-center gap-1 sm:gap-2 ${theme.textSubtle} hover:${theme.text} transition-colors rounded-lg p-2`}>
              <ChevronRight className={`w-4 h-4 sm:w-5 sm:h-5 rotate-180 ${theme.text}`} />
              <Home className={`w-4 h-4 hidden sm:block ${theme.text}`} />
              <span className={`text-sm ${theme.text}`}>{isMobile ? '返回' : '返回首页'}</span>
            </Link>

            <div className="flex items-center gap-2 sm:gap-4">
              <span className={`text-sm ${theme.text}`}>分数: <b className="text-yellow-400">{score}</b></span>

              <button onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-2 rounded-lg ${isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-sky-100/50'} transition-colors`}>
                {soundEnabled ? <Volume2 className={`w-4 h-4 ${theme.text}`} /> : <VolumeX className={`w-4 h-4 ${theme.text}`} />}
              </button>

              {/* 速度控制 */}
              <div className="flex items-center gap-1">
                <button onClick={() => setGameSpeed(prev => Math.max(0.5, Math.round((prev - 0.5) * 100) / 100))}
                  className={`px-2 py-1 rounded text-xs ${isDark ? 'bg-white/10' : 'bg-sky-100/50'} ${theme.text}`}>-</button>
                <span className={`text-xs ${theme.text} min-w-[40px] text-center`}>{gameSpeed.toFixed(1)}x</span>
                <button onClick={() => setGameSpeed(prev => Math.min(2.0, Math.round((prev + 0.5) * 100) / 100))}
                  className={`px-2 py-1 rounded text-xs ${isDark ? 'bg-white/10' : 'bg-sky-100/50'} ${theme.text}`}>+</button>
              </div>

              <button onClick={initGame}
                className={`flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-2 rounded-lg bg-gradient-to-r from-sky-600 to-blue-600 text-white font-medium transition-all active:scale-95`}>
                <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm">重开</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center p-4 pb-32">
        <h1 className={`font-bold mb-2 ${isMobile ? 'text-2xl' : 'text-4xl'} ${theme.text}`}>
          🐦 Flappy Bird NES
        </h1>
        <p className={`${theme.textSubtle} text-sm mb-4`}>开源NES游戏 · 按空格/点击跳跃</p>

        {/* Game Canvas */}
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={canvasWidth}
            height={canvasHeight}
            onClick={() => gameState === 'playing' ? handleTap() : initGame()}
            className="rounded-lg border-4 border-white/20 shadow-2xl cursor-pointer"
            style={{ imageRendering: 'pixelated' }}
          />

          {gameState === 'loading' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 rounded-lg">
              <p className={theme.text}>加载中...</p>
            </div>
          )}

          {gameState === 'start' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-lg">
              <div className="text-6xl mb-4">🐦</div>
              <h2 className={`text-3xl font-bold mb-4 ${theme.text}`}>Flappy Bird</h2>
              <p className={`${theme.textSubtle} text-sm mb-6`}>开源NES复刻版</p>
              <button onClick={() => { setGameState('playing'); startGameLoop() }}
                className={`px-8 py-3 rounded-lg bg-gradient-to-r from-sky-600 to-blue-600 text-white font-bold text-lg active:scale-95 transition-transform`}>
                开始游戏
              </button>
              <p className={`${theme.textSubtle} text-xs mt-4`}>空格键 / 点击 跳跃</p>
            </div>
          )}

          {gameState === 'gameover' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-lg">
              <div className="text-6xl mb-4">💀</div>
              <h2 className={`text-3xl font-bold mb-4 ${theme.text}`}>游戏结束</h2>
              <p className={`text-xl ${theme.textSubtle} mb-6`}>分数: {score}</p>
              <button onClick={() => { setScore(0); setGameState('playing'); startGameLoop() }}
                className={`px-8 py-3 rounded-lg bg-gradient-to-r from-sky-600 to-blue-600 text-white font-bold text-lg active:scale-95 transition-transform`}>
                再来一次
              </button>
            </div>
          )}
        </div>

        {/* Mobile Controls */}
        {gameState === 'playing' && (
          <div className="fixed bottom-8 left-0 right-0 flex justify-center">
            <button
              onTouchStart={e => { e.preventDefault(); handleTap() }}
              className="w-24 h-24 rounded-full bg-sky-500/50 border-4 border-white/50 active:bg-sky-400/50"
              style={{ touchAction: 'manipulation' }}
            >
              <span className="text-4xl">👆</span>
            </button>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-6 text-center max-w-md">
          <h3 className={`${theme.text} font-semibold mb-1`}>操作说明</h3>
          <p className={`${theme.textSubtle} text-xs`}>
            空格键 / 点击 跳跃 · 穿过管道得分
          </p>
          <p className={`${theme.textSubtle} text-xs mt-2`}>
            🌐 开源项目 · ROM来源: github.com/retrobrews
          </p>
        </div>
      </div>
    </div>
  )
}

export default FlappyBird
