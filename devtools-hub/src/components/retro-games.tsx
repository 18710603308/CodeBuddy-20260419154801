import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Home, Sun, Moon, Gamepad2, ExternalLink } from 'lucide-react'

export function RetroGames() {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('devtools-theme')
    return saved ? saved === 'dark' : true
  })

  useEffect(() => {
    const theme = isDark ? 'dark' : 'light'
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('devtools-theme', theme)
  }, [isDark])

  const openGameCenter = () => {
    window.open('https://www.yikm.net', '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-secondary/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                to="/" 
                className="flex items-center gap-2 text-muted hover:text-primary transition-colors"
              >
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">返回首页</span>
              </Link>
              <div className="flex items-center gap-2">
                <Gamepad2 className="w-6 h-6 text-amber-500" />
                <h1 className="text-lg font-bold text-primary">小霸王其乐无穷</h1>
              </div>
            </div>
            <button
              onClick={() => setIsDark(!isDark)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary hover:bg-accent transition-colors"
            >
              {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-muted" />}
            </button>
          </div>
        </div>
      </header>

      {/* 跳转页面 */}
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-65px)] px-4">
        <div className="text-center max-w-lg">
          <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <Gamepad2 className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-primary mb-4">小霸王其乐无穷</h2>
          <p className="text-muted mb-8">
            FC、街机、GBA 等经典游戏在线玩，重温童年回忆
          </p>
          <button
            onClick={openGameCenter}
            className="inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold text-lg transition-all hover:scale-105 hover:shadow-lg hover:shadow-amber-500/25"
          >
            <span>进入游戏中心</span>
            <ExternalLink className="w-5 h-5" />
          </button>
          <p className="text-sm text-muted mt-4">
            点击按钮将在新窗口打开游戏中心
          </p>
        </div>
      </div>
    </div>
  )
}
