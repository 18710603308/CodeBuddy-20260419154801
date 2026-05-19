import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Home, ChevronRight } from 'lucide-react'

const FumojìBBK: React.FC = () => {
  const [isDark, setIsDark] = useState(true)

  useEffect(() => { setIsDark(localStorage.getItem('devtools-theme') !== 'light') }, [])

  const theme = {
    bg: isDark ? 'from-slate-900 via-purple-900/50 to-indigo-900' : 'from-green-100 via-emerald-100 to-teal-100',
    headerBg: isDark ? 'bg-black/40 backdrop-blur-lg border-white/10' : 'bg-white/80 backdrop-blur-lg border-gray-200',
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.bg} flex flex-col`}>
      {/* Header */}
      <div className={`sticky top-0 z-50 ${theme.headerBg} border-b`}>
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link to="/" className={`flex items-center gap-2 ${isDark ? 'text-white/60 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>
              <ChevronRight className="w-5 h-5 rotate-180" />
              <Home className="w-5 h-5" />
              <span>返回首页</span>
            </Link>
            <span className="font-bold text-xl">📖 伏魔记 · 步步高版</span>
            <div className="w-24" />
          </div>
        </div>
      </div>

      {/* 游戏区域 */}
      <div className="flex-1 flex flex-col items-center justify-center min-h-0">
        <div className="relative inline-block select-none" style={{ width: 800, height: 480 }}>
          <iframe
            src="/fm/index.html"
            title="伏魔记 - 步步高电子词典版"
            className="w-full h-full rounded-xl shadow-2xl border border-white/10"
            style={{ width: 800, height: 480 }}
            allow="gamepad; keyboard-map"
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
        <p className={`mt-2 text-xs ${isDark ? 'text-white/40' : 'text-gray-500'}`}>
          方向键/WASD 移动 · Enter 确认 · Space 菜单
        </p>
      </div>
    </div>
  )
}

export default FumojìBBK
