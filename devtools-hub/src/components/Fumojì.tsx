import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Home, ChevronRight, RotateCcw } from 'lucide-react'
import { EmulatorJS } from 'react-emulatorjs'

// 声明EmulatorJS全局变量
declare global {
  interface Window {
    EJS_emulator: any
  }
}

const Fumojì: React.FC = () => {
  const [isDark, setIsDark] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [isRestarting, setIsRestarting] = useState(false)

  // 检测设备类型
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => { setIsDark(localStorage.getItem('devtools-theme') !== 'light') }, [])

  // 阻止移动端手势
  useEffect(() => {
    if (!isMobile) return
    const preventGestures = (e: TouchEvent) => {
      if (e.touches.length > 1) e.preventDefault()
    }
    document.body.style.overscrollBehavior = 'none'
    document.addEventListener('touchmove', preventGestures, { passive: false })
    return () => {
      document.removeEventListener('touchmove', preventGestures)
      document.body.style.overscrollBehavior = ''
    }
  }, [isMobile])

  const handleRestart = () => {
    if (isRestarting) return
    setIsRestarting(true)
    // 重新加载模拟器
    window.location.reload()
  }

  const theme = {
    bg: isDark ? 'from-slate-900 via-purple-900/50 to-indigo-900' : 'from-green-100 via-emerald-100 to-teal-100',
    headerBg: isDark ? 'bg-black/40 backdrop-blur-lg border-white/10' : 'bg-white/80 backdrop-blur-lg border-gray-200',
    text: isDark ? 'text-white' : 'text-gray-900',
    btn: isDark ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-indigo-500 hover:bg-indigo-600 text-white',
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.bg}`}>
      {/* Header */}
      <div className={`sticky top-0 z-50 ${theme.headerBg} border-b`}>
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link to="/" className={`flex items-center gap-2 ${isDark ? 'text-white/60 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>
              <ChevronRight className="w-5 h-5 rotate-180" />
              <Home className="w-5 h-5" />
              <span>返回首页</span>
            </Link>
            <span className="font-bold text-xl">🏯 伏魔记</span>
            <button
              onClick={handleRestart}
              disabled={isRestarting}
              className={`px-3 py-1.5 rounded-lg ${theme.btn} font-medium active:scale-95 transition-all text-sm flex items-center gap-1`}
            >
              <RotateCcw className="w-4 h-4" />
              {isRestarting ? '重启中...' : '重启'}
            </button>
          </div>
        </div>
      </div>

      {/* 操作提示 */}
      <div className={`max-w-6xl mx-auto px-4 py-2 text-center text-sm ${isDark ? 'text-white/50' : 'text-gray-600'}`}>
        方向键移动 · Enter 确认/对话 · Z 攻击 · X 跳跃 · ESC 菜单
      </div>

      {/* 游戏区域 */}
      <div className={`max-w-6xl mx-auto px-4 pb-6 ${isMobile ? 'min-h-[calc(100vh-120px)] flex flex-col justify-center' : ''}`}>
        <div
          className="flex justify-center"
          style={{ aspectRatio: '256/240' }}
        >
          <EmulatorJS
            EJS_pathtodata="https://cdn.emulatorjs.org/stable/data"
            EJS_core="nes"
            EJS_gameUrl="/roms/Fumoj%C3%AC.nes"
            EJS_startOnLoaded={true}
            EJS_volume={0.5}
            EJS_gameName="Fumojì"
          />
        </div>
      </div>

      {/* 底部说明 */}
      <div className={`sticky bottom-0 ${theme.headerBg} border-t py-2 px-4`}>
        <div className="max-w-6xl mx-auto text-center text-xs ${isDark ? 'text-white/40' : 'text-gray-500'}">
          《伏魔记》改编自许仲琳神话小说《封神演义》，台湾全崴资讯1995年发行，经典步步高电子词典移植版
        </div>
      </div>
    </div>
  )
}

export default Fumojì
