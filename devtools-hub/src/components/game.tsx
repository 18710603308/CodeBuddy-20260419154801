import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Home, Sparkles, Sun, Moon, Sword, Shield, Zap, Heart, Coins, ChevronRight, Skull, Package, User, LogOut } from 'lucide-react'

// 主题 Hook
function useTheme() {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('devtools-theme')
    return saved ? saved === 'dark' : true
  })

  useEffect(() => {
    const theme = isDark ? 'dark' : 'light'
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('devtools-theme', theme)
  }, [isDark])

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'devtools-theme') {
        const newTheme = e.newValue
        if (newTheme) {
          document.documentElement.setAttribute('data-theme', newTheme)
          setIsDark(newTheme === 'dark')
        }
      }
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  return { isDark, toggleTheme: () => setIsDark(!isDark) }
}

// 职业类型
type ClassType = 'warrior' | 'mage' | 'taoist'

// 职业配置
const classConfig = {
  warrior: { name: '战士', icon: Sword, color: 'from-red-500 to-orange-500', hp: 150, mp: 30, attack: 15, defense: 10 },
  mage: { name: '法师', icon: Zap, color: 'from-blue-500 to-purple-500', hp: 80, mp: 120, attack: 20, defense: 5 },
  taoist: { name: '道士', icon: Heart, color: 'from-green-500 to-emerald-500', hp: 100, mp: 80, attack: 12, defense: 8 }
}

// 怪物配置
const monstersConfig = [
  { name: '森林野猪', level: 1, hp: 30, attack: 5, defense: 2, exp: 10, gold: 5, color: '#8B4513' },
  { name: '毒蛇', level: 2, hp: 40, attack: 8, defense: 3, exp: 15, gold: 8, color: '#228B22' },
  { name: '骷髅战士', level: 5, hp: 80, attack: 12, defense: 5, exp: 30, gold: 15, color: '#D3D3D3' },
  { name: '僵尸', level: 8, hp: 120, attack: 15, defense: 8, exp: 50, gold: 25, color: '#556B2F' },
  { name: '骷髅精灵', level: 12, hp: 200, attack: 20, defense: 12, exp: 80, gold: 40, color: '#87CEEB' },
  { name: '祖玛卫士', level: 18, hp: 350, attack: 28, defense: 18, exp: 150, gold: 80, color: '#8B0000' },
  { name: '白野猪', level: 25, hp: 500, attack: 35, defense: 25, exp: 250, gold: 150, color: '#F5F5DC' },
  { name: '虹魔教主', level: 35, hp: 1000, attack: 50, defense: 35, exp: 500, gold: 300, color: '#FF1493' },
]

// 装备配置
const equipTypes = ['武器', '头盔', '衣服', '项链', '手镯', '戒指', '腰带', '鞋子']
const equipNames = {
  '武器': ['木剑', '青铜剑', '铁剑', '炼狱', '裁决', '屠龙刀'],
  '头盔': ['布帽', '皮帽', '青铜头盔', '黑铁头盔', '圣战头盔', '龙盔'],
  '衣服': ['布衣', '轻甲', '中甲', '重甲', '天魔', '凤天甲'],
  '项链': ['蓝翡翠', '生命项链', '幽灵项链', '裁决项链', '圣战项链', '麻痹项链'],
  '手镯': ['银手镯', '力量手镯', '骑士手镯', '圣战手镯', '龙之手镯'],
  '戒指': ['牛角戒指', '珊瑚戒指', '力量戒指', '复活戒指', '护身戒指'],
  '腰带': ['布腰带', '皮革腰带', '钢制腰带', '圣战腰带'],
  '鞋子': ['布鞋', '皮鞋', '钢靴', '圣战靴', '龙靴']
}

const equipColors = ['#C0C0C0', '#FFD700', '#FF6B6B', '#9B59B6', '#3498DB', '#E74C3C', '#2ECC71']

// 角色状态
interface Character {
  name: string
  classType: ClassType
  level: number
  exp: number
  expToNext: number
  hp: number
  maxHp: number
  mp: number
  maxMp: number
  attack: number
  defense: number
  gold: number
  equipment: Record<string, { name: string; bonus: number; color: string } | null>
  skills: string[]
}

// 怪物状态
interface Monster {
  id: number
  name: string
  level: number
  hp: number
  maxHp: number
  attack: number
  defense: number
  exp: number
  gold: number
  color: string
  x: number
  y: number
  isDead: boolean
}

// 战斗日志
interface BattleLog {
  type: 'damage' | 'skill' | 'heal' | 'levelup' | 'loot' | 'death' | 'info'
  text: string
  color: string
}

// 角色选择页面
function CharacterSelect({ onSelect }: { onSelect: (name: string, classType: ClassType) => void }) {
  const { isDark, toggleTheme } = useTheme()
  const [name, setName] = useState('')
  const [selectedClass, setSelectedClass] = useState<ClassType>('warrior')

  const handleSubmit = () => {
    if (name.trim()) {
      onSelect(name.trim(), selectedClass)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-secondary to-primary">
      {/* 头部 */}
      <header className="border-b border-border/50 bg-secondary/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                to="/" 
                className="flex items-center gap-2 text-muted hover:text-primary transition-colors"
              >
                <ChevronRight className="w-5 h-5 rotate-180" />
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">返回首页</span>
              </Link>
              <div className="flex items-center gap-2">
                <Sword className="w-6 h-6 text-red-500" />
                <h1 className="text-lg font-bold text-primary">传奇世界</h1>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary hover:bg-accent transition-colors"
            >
              {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-muted" />}
            </button>
          </div>
        </div>
      </header>

      <main className="flex items-center justify-center p-4">
        <div className="bg-secondary/90 rounded-2xl border border-primary p-8 w-full max-w-2xl shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-red-500 via-amber-500 to-purple-500 bg-clip-text text-transparent mb-2">
            传奇世界
          </h1>
          <p className="text-subtle">经典MMORPG网页版</p>
        </div>

        {/* 输入名字 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-primary mb-2">角色名称</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="请输入角色名称..."
            className="w-full bg-input border border-border rounded-lg px-4 py-3 text-primary placeholder:text-muted focus:outline-none focus:border-purple-500"
            maxLength={10}
          />
        </div>

        {/* 选择职业 */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-primary mb-3">选择职业</label>
          <div className="grid grid-cols-3 gap-4">
            {(Object.keys(classConfig) as ClassType[]).map((cls) => {
              const config = classConfig[cls]
              const Icon = config.icon
              return (
                <button
                  key={cls}
                  onClick={() => setSelectedClass(cls)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedClass === cls
                      ? 'border-purple-500 bg-purple-500/20'
                      : 'border-border hover:border-primary'
                  }`}
                >
                  <div className={`w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br ${config.color} flex items-center justify-center shadow-lg`}>
                    <Icon className="w-8 h-8 text-gray-900 dark:text-white drop-shadow-md" />
                  </div>
                  <h3 className="font-semibold text-primary mb-2">{config.name}</h3>
                  <div className="text-xs text-subtle space-y-1">
                    <div>生命: {config.hp}</div>
                    <div>魔法: {config.mp}</div>
                    <div>攻击: {config.attack}</div>
                    <div>防御: {config.defense}</div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!name.trim()}
          className="w-full py-4 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-700 hover:to-amber-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
        >
          <User className="w-5 h-5" />
          开始冒险
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
      </main>
    </div>
  )
}

// 战斗场景
function BattleScene({ 
  character, 
  onCharacterUpdate,
  onGameOver 
}: { 
  character: Character
  onCharacterUpdate: (char: Character) => void
  onGameOver: () => void
}) {
  const { isDark, toggleTheme } = useTheme()
  const [monsters, setMonsters] = useState<Monster[]>([])
  const [battleLog, setBattleLog] = useState<BattleLog[]>([])
  const [targetMonster, setTargetMonster] = useState<Monster | null>(null)
  const [playerPosition, setPlayerPosition] = useState({ x: 400, y: 300 })
  const [isAttacking, setIsAttacking] = useState(false)
  const [isDead, setIsDead] = useState(false)
  const logRef = useRef<HTMLDivElement>(null)

  const addLog = useCallback((type: BattleLog['type'], text: string) => {
    const colors: Record<BattleLog['type'], string> = {
      damage: 'text-red-400',
      skill: 'text-blue-400',
      heal: 'text-green-400',
      levelup: 'text-amber-400',
      loot: 'text-yellow-400',
      death: 'text-gray-400',
      info: 'text-subtle'
    }
    setBattleLog(prev => [...prev.slice(-20), { type, text, color: colors[type] }])
  }, [])

  // 生成怪物
  const spawnMonsters = useCallback(() => {
    if (!character) return
    const playerLevel = character.level
    const availableMonsters = monstersConfig.filter(m => m.level <= playerLevel + 10)
    if (availableMonsters.length === 0) return
    const newMonsters: Monster[] = []
    const count = Math.min(5, Math.max(3, 8 - Math.floor(playerLevel / 10)))
    
    for (let i = 0; i < count; i++) {
      const monsterTemplate = availableMonsters[Math.floor(Math.random() * availableMonsters.length)]
      newMonsters.push({
        ...monsterTemplate,
        id: Date.now() + i,
        hp: monsterTemplate.hp,
        maxHp: monsterTemplate.hp,
        x: 50 + Math.random() * 700,
        y: 50 + Math.random() * 300,
        isDead: false
      })
    }
    setMonsters(newMonsters)
  }, [character])

  // 初始化
  useEffect(() => {
    if (character && character.name) {
      spawnMonsters()
      addLog('info', `欢迎来到玛法大陆，${character.name}！`)
      addLog('info', `你的等级是 ${character.level} 级，当前地图：比奇省`)
    }
  }, [character?.name, character?.level, spawnMonsters, addLog])

  // 滚动日志
  useEffect(() => {
    logRef.current?.scrollTo(0, logRef.current.scrollHeight)
  }, [battleLog])

  // 攻击怪物
  const attackMonster = () => {
    if (!targetMonster || isAttacking || isDead) return
    setIsAttacking(true)

    // 玩家攻击
    const playerDamage = Math.max(1, character.attack + Math.floor(Math.random() * 10) - targetMonster.defense)
    const newMonsters = monsters.map(m => {
      if (m.id === targetMonster.id) {
        const newHp = m.hp - playerDamage
        addLog('damage', `你对 ${m.name} 造成了 ${playerDamage} 点伤害`)
        if (newHp <= 0) {
          addLog('loot', `击杀 ${m.name}！获得 ${m.exp} 经验，${m.gold} 金币`)
          
          // 升级检查
          let newExp = character.exp + m.exp
          let newLevel = character.level
          let newMaxHp = character.maxHp
          let newMaxMp = character.maxMp
          let newAttack = character.attack
          let newDefense = character.defense
          
          while (newExp >= newLevel * 100) {
            newExp -= newLevel * 100
            newLevel++
            newMaxHp += classConfig[character.classType].hp / 10
            newMaxMp += classConfig[character.classType].mp / 10
            newAttack += classConfig[character.classType].attack / 10
            newDefense += classConfig[character.classType].defense / 10
            addLog('levelup', `升级了！现在是 ${newLevel} 级！`)
          }
          
          onCharacterUpdate({
            ...character,
            exp: newExp,
            level: newLevel,
            expToNext: newLevel * 100,
            maxHp: Math.floor(newMaxHp),
            maxMp: Math.floor(newMaxMp),
            attack: Math.floor(newAttack),
            defense: Math.floor(newDefense),
            gold: character.gold + m.gold
          })
          
          return { ...m, hp: 0, isDead: true }
        }
        return { ...m, hp: newHp }
      }
      return m
    })
    setMonsters(newMonsters)

    // 怪物反击
    setTimeout(() => {
      const aliveMonsters = newMonsters.filter(m => !m.isDead)
      if (aliveMonsters.length > 0) {
        const attacker = aliveMonsters[Math.floor(Math.random() * aliveMonsters.length)]
        const monsterDamage = Math.max(1, attacker.attack - character.defense / 2 + Math.floor(Math.random() * 5))
        
        const newHp = character.hp - monsterDamage
        addLog('damage', `${attacker.name} 对你造成了 ${monsterDamage} 点伤害`)
        
        if (newHp <= 0) {
          addLog('death', '你已死亡...')
          setIsDead(true)
          onCharacterUpdate({ ...character, hp: 0 })
          setTimeout(() => onGameOver(), 2000)
        } else {
          onCharacterUpdate({ ...character, hp: newHp })
        }
      }
      setIsAttacking(false)
    }, 500)
  }

  // 释放技能
  const useSkill = (skillName: string) => {
    if (isAttacking || isDead || character.mp < 10) return
    
    onCharacterUpdate({ ...character, mp: character.mp - 10 })
    
    if (skillName === '治愈术' && character.classType === 'taoist') {
      const healAmount = Math.floor(character.maxHp * 0.2)
      onCharacterUpdate({ ...character, hp: Math.min(character.maxHp, character.hp + healAmount), mp: character.mp - 10 })
      addLog('heal', `使用治愈术，恢复 ${healAmount} 点生命`)
    } else if (skillName === '火球术' && character.classType === 'mage') {
      if (targetMonster && !targetMonster.isDead) {
        const damage = character.attack * 1.5
        setMonsters(monsters.map(m => {
          if (m.id === targetMonster.id) {
            const newHp = m.hp - damage
            addLog('skill', `火球术对 ${m.name} 造成 ${Math.floor(damage)} 点伤害`)
            return { ...m, hp: newHp, isDead: newHp <= 0 }
          }
          return m
        }))
      }
    } else if (skillName === '野蛮冲撞' && character.classType === 'warrior') {
      setPlayerPosition(prev => ({ x: Math.min(750, prev.x + 50), y: prev.y }))
      addLog('skill', '使用野蛮冲撞，向前移动！')
    }
  }

  // 复活
  const resurrect = () => {
    const cost = Math.floor(character.level * 50)
    if (character.gold >= cost) {
      onCharacterUpdate({ ...character, hp: character.maxHp, mp: character.maxMp, gold: character.gold - cost })
      setIsDead(false)
      spawnMonsters()
      addLog('info', `花费 ${cost} 金币原地复活`)
    } else {
      addLog('info', `复活需要 ${cost} 金币，你只有 ${character.gold} 金币`)
    }
  }

  // 刷新地图
  const refreshMap = () => {
    spawnMonsters()
    addLog('info', '刷新地图...')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-secondary to-primary">
      {/* 头部 */}
      <header className="border-b border-border/50 bg-secondary/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                to="/" 
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-tertiary/50 transition-colors text-primary"
              >
                <Home className="w-4 h-4" />
                <span className="text-sm font-medium">返回首页</span>
              </Link>
              <div className="flex items-center gap-2">
                <Sword className="w-6 h-6 text-red-500" />
                <h1 className="text-lg font-bold text-primary">传奇世界</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={toggleTheme} className="p-2 rounded-lg bg-secondary hover:bg-tertiary transition-colors">
                {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-subtle" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* 角色信息 */}
          <div className="bg-secondary/80 rounded-xl border border-primary p-4">
            <h2 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-purple-400" />
              {character.name}
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-subtle">职业</span>
                <span className={`text-sm font-medium px-2 py-0.5 rounded bg-gradient-to-r ${classConfig[character.classType].color} text-white`}>
                  {classConfig[character.classType].name}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-subtle">等级</span>
                <span className="text-amber-400 font-bold">Lv.{character.level}</span>
              </div>
              
              {/* 经验条 */}
              <div>
                <div className="flex justify-between text-xs text-subtle mb-1">
                  <span>经验</span>
                  <span>{character.exp}/{character.level * 100}</span>
                </div>
                <div className="h-2 bg-tertiary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                    style={{ width: `${(character.exp / (character.level * 100)) * 100}%` }}
                  />
                </div>
              </div>

              {/* 血量 */}
              <div>
                <div className="flex justify-between text-xs text-subtle mb-1">
                  <span className="flex items-center gap-1"><Heart className="w-3 h-3 text-red-400" /> 生命</span>
                  <span className="text-red-400">{Math.floor(character.hp)}/{character.maxHp}</span>
                </div>
                <div className="h-2 bg-tertiary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-red-500 to-red-600 transition-all"
                    style={{ width: `${(character.hp / character.maxHp) * 100}%` }}
                  />
                </div>
              </div>

              {/* 魔法 */}
              <div>
                <div className="flex justify-between text-xs text-subtle mb-1">
                  <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-blue-400" /> 魔法</span>
                  <span className="text-blue-400">{Math.floor(character.mp)}/{character.maxMp}</span>
                </div>
                <div className="h-2 bg-tertiary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all"
                    style={{ width: `${(character.mp / character.maxMp) * 100}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-sm text-subtle flex items-center gap-1"><Sword className="w-4 h-4" /> 攻击</span>
                <span className="text-orange-400 font-bold">{character.attack}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-subtle flex items-center gap-1"><Shield className="w-4 h-4" /> 防御</span>
                <span className="text-cyan-400 font-bold">{character.defense}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-subtle flex items-center gap-1"><Coins className="w-4 h-4 text-amber-400" /> 金币</span>
                <span className="text-amber-400 font-bold">{character.gold}</span>
              </div>
            </div>

            {/* 技能 */}
            <div className="mt-4 pt-4 border-t border-border">
              <h3 className="text-sm font-medium text-primary mb-2">技能</h3>
              <div className="space-y-2">
                {character.classType === 'taoist' && (
                  <button
                    onClick={() => useSkill('治愈术')}
                    disabled={character.mp < 10 || isDead}
                    className="w-full px-3 py-2 text-sm bg-green-500/20 hover:bg-green-500/30 disabled:opacity-50 rounded-lg text-green-400 flex items-center gap-2"
                  >
                    <Heart className="w-4 h-4" /> 治愈术 (10MP)
                  </button>
                )}
                {character.classType === 'mage' && (
                  <button
                    onClick={() => useSkill('火球术')}
                    disabled={character.mp < 10 || isDead}
                    className="w-full px-3 py-2 text-sm bg-blue-500/20 hover:bg-blue-500/30 disabled:opacity-50 rounded-lg text-blue-400 flex items-center gap-2"
                  >
                    <Zap className="w-4 h-4" /> 火球术 (10MP)
                  </button>
                )}
                {character.classType === 'warrior' && (
                  <button
                    onClick={() => useSkill('野蛮冲撞')}
                    disabled={character.mp < 10 || isDead}
                    className="w-full px-3 py-2 text-sm bg-red-500/20 hover:bg-red-500/30 disabled:opacity-50 rounded-lg text-red-400 flex items-center gap-2"
                  >
                    <Sword className="w-4 h-4" /> 野蛮冲撞 (10MP)
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 游戏区域 */}
          <div className="lg:col-span-2">
            <div className="bg-secondary/80 rounded-xl border border-primary overflow-hidden">
              {/* 地图标题 */}
              <div className="bg-tertiary/50 px-4 py-2 border-b border-border flex justify-between items-center">
                <span className="text-primary font-medium">比奇省 - 安全区域</span>
                <button
                  onClick={refreshMap}
                  className="text-xs text-subtle hover:text-primary transition-colors"
                >
                  刷新地图
                </button>
              </div>

              {/* 游戏画布 */}
              <div 
                className={`relative ${isDark ? 'bg-gradient-to-br from-slate-800 to-slate-900' : 'bg-gradient-to-br from-green-100 to-green-200'} h-[400px] overflow-hidden`}
                style={{ backgroundImage: isDark ? 'none' : 'radial-gradient(circle at 25% 25%, rgba(34, 139, 34, 0.3) 0%, transparent 50%)' }}
              >
                {/* 网格 */}
                <div className="absolute inset-0 opacity-20" style={{
                  backgroundImage: `linear-gradient(${isDark ? '#374151' : '#9CA3AF'} 1px, transparent 1px), linear-gradient(90deg, ${isDark ? '#374151' : '#9CA3AF'} 1px, transparent 1px)`,
                  backgroundSize: '30px 30px'
                }} />

                {/* 玩家 */}
                <div 
                  className={`absolute transition-all duration-300 ${isAttacking ? 'animate-pulse' : ''}`}
                  style={{ left: playerPosition.x, top: playerPosition.y, transform: 'translate(-50%, -50%)' }}
                >
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${classConfig[character.classType].color} flex items-center justify-center shadow-lg border-2 ${isDead ? 'opacity-50' : 'border-gray-900 dark:border-white'}`}>
                    <span className="text-2xl drop-shadow-md">
                      {character.classType === 'warrior' ? '⚔️' : character.classType === 'mage' ? '🔮' : '📿'}
                    </span>
                  </div>
                  <div className="text-center text-xs mt-1 font-bold drop-shadow-lg text-gray-900 dark:text-white">{character.name}</div>
                </div>

                {/* 怪物 */}
                {monsters.map((monster) => (
                  !monster.isDead && (
                    <div
                      key={monster.id}
                      className={`absolute cursor-pointer transition-all duration-200 ${targetMonster?.id === monster.id ? 'scale-110' : 'hover:scale-105'}`}
                      style={{ left: monster.x, top: monster.y, transform: 'translate(-50%, -50%)' }}
                      onClick={() => setTargetMonster(monster)}
                    >
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg border-2 border-gray-900/50 dark:border-white/50"
                        style={{ backgroundColor: monster.color }}
                      >
                        <Skull className="w-5 h-5 text-gray-900 dark:text-white" />
                      </div>
                      {/* 血条 */}
                      <div className="w-12 h-1.5 bg-gray-700 rounded-full mt-1 mx-auto">
                        <div 
                          className="h-full bg-red-500 rounded-full transition-all"
                          style={{ width: `${(monster.hp / monster.maxHp) * 100}%` }}
                        />
                      </div>
                      <div className="text-center text-xs mt-0.5 font-medium drop-shadow text-gray-900 dark:text-white">{monster.name}</div>
                    </div>
                  )
                ))}

                {/* 死亡遮罩 */}
                {isDead && (
                  <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-10">
                    <div className="text-center">
                      <Skull className="w-16 h-16 text-red-500 mx-auto mb-4" />
                      <p className="text-2xl text-red-500 font-bold mb-4">你已经死亡</p>
                      <button
                        onClick={resurrect}
                        className="px-6 py-3 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white font-bold rounded-lg flex items-center gap-2 mx-auto"
                      >
                        <LogOut className="w-5 h-5" />
                        原地复活 ({Math.floor(character.level * 50)} 金币)
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 操作栏 */}
              <div className="p-4 border-t border-border flex gap-3">
                <button
                  onClick={attackMonster}
                  disabled={!targetMonster || isAttacking || isDead || targetMonster?.isDead}
                  className="flex-1 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-gray-600 disabled:to-gray-600 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  <Sword className="w-5 h-5" />
                  {isAttacking ? '攻击中...' : '攻击'}
                </button>
                <button
                  onClick={refreshMap}
                  className="px-6 py-3 bg-secondary hover:bg-tertiary border border-border text-primary font-medium rounded-lg transition-all flex items-center gap-2"
                >
                  刷新
                </button>
              </div>
            </div>

            {/* 战斗日志 */}
            <div className="mt-4 bg-secondary/80 rounded-xl border border-primary p-4">
              <h3 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                <Package className="w-4 h-4 text-amber-400" />
                战斗日志
              </h3>
              <div 
                ref={logRef}
                className="h-40 overflow-y-auto space-y-1 font-mono text-sm"
              >
                {battleLog.map((log, i) => (
                  <div key={i} className={log.color}>{log.text}</div>
                ))}
              </div>
            </div>
          </div>

          {/* 怪物列表 */}
          <div className="bg-secondary/80 rounded-xl border border-primary p-4">
            <h2 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
              <Skull className="w-5 h-5 text-red-400" />
              附近怪物
            </h2>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {monsters.map((monster) => (
                <button
                  key={monster.id}
                  onClick={() => setTargetMonster(monster)}
                  disabled={monster.isDead}
                  className={`w-full p-3 rounded-lg border transition-all text-left ${
                    targetMonster?.id === monster.id
                      ? 'border-purple-500 bg-purple-500/20'
                      : monster.isDead
                      ? 'border-border opacity-50'
                      : 'border-border hover:border-primary'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: monster.color }}>
                      <Skull className="w-4 h-4 text-gray-900 dark:text-white" />
                    </div>
                    <span className="text-sm font-medium text-primary">{monster.name}</span>
                    <span className="text-xs text-subtle ml-auto">Lv.{monster.level}</span>
                  </div>
                  {!monster.isDead && (
                    <div className="text-xs text-subtle">
                      血量: {monster.hp}/{monster.maxHp} | 攻击: {monster.attack}
                    </div>
                  )}
                  {monster.isDead && <div className="text-xs text-red-400">已击杀</div>}
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

// 主组件
export function Game() {
  const [character, setCharacter] = useState<Character | null>(null)
  const [isDead, setIsDead] = useState(false)

  const startGame = (name: string, classType: ClassType) => {
    const config = classConfig[classType]
    const newChar: Character = {
      name,
      classType,
      level: 1,
      exp: 0,
      expToNext: 100,
      hp: config.hp,
      maxHp: config.hp,
      mp: config.mp,
      maxMp: config.mp,
      attack: config.attack,
      defense: config.defense,
      gold: 100,
      equipment: {},
      skills: classType === 'taoist' ? ['治愈术'] : classType === 'mage' ? ['火球术'] : classType === 'warrior' ? ['野蛮冲撞'] : []
    }
    setCharacter(newChar)
  }

  const handleGameOver = () => {
    setIsDead(true)
  }

  const handleResurrect = () => {
    setIsDead(false)
  }

  if (!character) {
    return <CharacterSelect onSelect={startGame} />
  }

  return (
    <BattleScene 
      character={character} 
      onCharacterUpdate={setCharacter}
      onGameOver={handleGameOver}
    />
  )
}
