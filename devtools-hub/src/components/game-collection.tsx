import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Home, Sun, Moon, Gamepad2, ExternalLink, Joystick, Gamepad, Sparkles, Crosshair, Puzzle, Dice6, Trophy } from 'lucide-react'

const gameSites = [
  {
    name: '小霸王其乐无穷',
    url: 'https://www.yikm.net',
    description: 'FC、街机、GBA 等经典游戏',
    icon: Gamepad2,
    color: 'from-amber-500 to-orange-600',
    category: '经典怀旧'
  },
  {
    name: 'Crazy Games',
    url: 'https://www.crazygames.com',
    description: '超多免费网页游戏',
    icon: Joystick,
    color: 'from-green-500 to-emerald-600',
    category: '网页游戏'
  },
  {
    name: 'DOS 游戏',
    url: 'https://dos.zczc.cz',
    description: '经典 DOS 游戏合集',
    icon: Sparkles,
    color: 'from-blue-500 to-cyan-600',
    category: '经典怀旧'
  },
  {
    name: 'Chrono Divide',
    url: 'https://chronodivide.com',
    description: '经典怀旧游戏',
    icon: Gamepad,
    color: 'from-purple-500 to-violet-600',
    category: '经典怀旧'
  },
  {
    name: 'Y8 Games',
    url: 'https://zh.y8.com',
    description: '海量免费在线游戏',
    icon: Crosshair,
    color: 'from-red-500 to-pink-600',
    category: '网页游戏'
  },
  {
    name: '小霸王游戏',
    url: 'http://www.famicn.com',
    description: 'FC 游戏在线玩',
    icon: Puzzle,
    color: 'from-yellow-500 to-amber-600',
    category: '经典怀旧'
  },
  {
    name: 'A10 Games',
    url: 'http://www.agame.com',
    description: '各种类型的在线游戏',
    icon: Dice6,
    color: 'from-indigo-500 to-blue-600',
    category: '网页游戏'
  },
  {
    name: 'Pogo Games',
    url: 'https://www.pogo.com',
    description: '休闲游戏平台',
    icon: Trophy,
    color: 'from-teal-500 to-cyan-600',
    category: '休闲游戏'
  },
]

export function GameCollection() {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('devtools-theme')
    return saved ? saved === 'dark' : true
  })
  const [selectedCategory, setSelectedCategory] = useState('全部')

  useEffect(() => {
    const theme = isDark ? 'dark' : 'light'
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('devtools-theme', theme)
  }, [isDark])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const categories = ['全部', '经典怀旧', '网页游戏', '休闲游戏']
  const filteredGames = selectedCategory === '全部' 
    ? gameSites 
    : gameSites.filter(game => game.category === selectedCategory)

  const openGame = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer')
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
                <h1 className="text-lg font-bold text-primary">欲买桂花同载酒</h1>
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

      {/* 分类筛选 */}
      <div className="border-b border-border bg-secondary/50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  selectedCategory === category
                    ? 'bg-amber-500 text-white'
                    : 'bg-secondary hover:bg-accent text-muted hover:text-primary'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 游戏列表 */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredGames.map((game) => (
            <button
              key={game.url}
              onClick={() => openGame(game.url)}
              className="group relative p-6 rounded-2xl bg-secondary/80 border border-border hover:border-amber-500/50 backdrop-blur-xl transition-all hover:scale-105 hover:shadow-xl text-left overflow-hidden"
            >
              {/* 背景渐变 */}
              <div className={`absolute inset-0 bg-gradient-to-br ${game.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
              
              <div className="relative">
                {/* 图标 */}
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${game.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                  <game.icon className="w-7 h-7 text-white" />
                </div>
                
                {/* 分类标签 */}
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium bg-gradient-to-r ${game.color} text-white mb-2`}>
                  {game.category}
                </span>
                
                {/* 标题 */}
                <h3 className="text-lg font-bold text-primary mb-1 group-hover:text-amber-500 transition-colors">
                  {game.name}
                </h3>
                
                {/* 描述 */}
                <p className="text-sm text-muted mb-4">
                  {game.description}
                </p>
                
                {/* 进入按钮 */}
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r ${game.color} text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0`}>
                  <span>进入</span>
                  <ExternalLink className="w-4 h-4" />
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* 空状态 */}
        {filteredGames.length === 0 && (
          <div className="text-center py-12">
            <Gamepad2 className="w-16 h-16 text-muted mx-auto mb-4 opacity-50" />
            <p className="text-muted">该分类暂无游戏</p>
          </div>
        )}
      </div>

      {/* 底部提示 */}
      <div className="border-t border-border bg-secondary/50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <p className="text-center text-sm text-muted">
            点击卡片将跳转到对应的游戏平台 · 所有游戏均在第三方网站运行
          </p>
        </div>
      </div>
    </div>
  )
}
