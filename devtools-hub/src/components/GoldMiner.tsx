import { useEffect, useRef, useCallback, useState } from 'react'

interface GameObject {
  type: 'gold' | 'gold_small' | 'gold_medium' | 'gold_large' | 'gold_huge' | 'diamond' | 'stone' | 'bag' | 'mouse' | 'mole' | 'bone' | 'dynamite'
  x: number
  y: number
  width: number
  height: number
  value: number
  weight: number
  color: string
  grabbed: boolean
  speedX?: number  // 用于移动的物品
}

interface Hook {
  x: number
  y: number
  angle: number
  length: number
  state: 'swinging' | 'lowering' | 'raising' | 'retracting'
  speed: number
  caughtObject: GameObject | null
  direction: number  // 1 = right, -1 = left
}

interface GameState {
  score: number
  level: number
  targetScore: number
  timeLeft: number
  isRunning: boolean
  hook: Hook
  objects: GameObject[]
  gameOver: boolean
  paused: boolean
  inventory: {
    dynamite: number
    strengthPotion: number
    luckyClover: number
    diamondPolish: number
    rockCollector: number
  }
}

interface GoldMinerProps {
  onScoreUpdate?: (score: number) => void
}

const GOLD_MINER_CONFIG = {
  canvasWidth: 800,
  canvasHeight: 600,
  groundY: 100,
  hookStartX: 400,
  hookStartY: 60,
  swingSpeed: 0.02,
  lowerSpeed: 5,
  raiseSpeed: 3,
  retractSpeedMultiplier: 0.3,  // 正常拉取速度
  strengthMultiplier: 0.6,       // 力量药水速度
  maxHookLength: 450,
}

// 物品价值表（原始黄金矿工）
const ITEM_VALUES = {
  gold_small: { value: 50, weight: 2 },
  gold_medium: { value: 100, weight: 4 },
  gold_large: { value: 250, weight: 8 },
  gold_huge: { value: 500, weight: 12 },
  diamond: { value: 600, weight: 1 },
  stone: { value: 11, weight: 10 },
  bag: { value: 0, weight: 3 },  // 随机
  mouse: { value: 602, weight: 1 },  // 会移动
  mole: { value: 502, weight: 5 },
  bone: { value: 6, weight: 1 },
  dynamite: { value: 1, weight: 1 },  // 碰到就爆炸
}

// 道具价格
const ITEM_PRICES = {
  dynamite: 8,
  strengthPotion: 142,
  luckyClover: 58,
  diamondPolish: 338,
  rockCollector: 146,
  hourglass: 20,
}

// 关卡目标
const LEVEL_TARGETS = [100, 200, 350, 500, 700, 900, 1200, 1500, 2000, 2500, 3000, 3500, 4000, 5000, 6000]

// 商店道具定义
const SHOP_ITEMS = [
  { id: 'dynamite', name: '炸药', price: ITEM_PRICES.dynamite, description: '炸掉钩子上的物品', icon: '💣' },
  { id: 'strengthPotion', name: '力量饮料', price: ITEM_PRICES.strengthPotion, description: '下关拉取速度加快', icon: '💪' },
  { id: 'luckyClover', name: '幸运四叶草', price: ITEM_PRICES.luckyClover, description: '提高获得好东西几率', icon: '🍀' },
  { id: 'diamondPolish', name: '钻石抛光剂', price: ITEM_PRICES.diamondPolish, description: '钻石价值提升至900', icon: '💎' },
  { id: 'rockCollector', name: '岩石收藏书', price: ITEM_PRICES.rockCollector, description: '岩石价值变为3倍', icon: '📖' },
  { id: 'hourglass', name: '怀表', price: ITEM_PRICES.hourglass, description: '增加15秒时间', icon: '⏰' },
]

export default function GoldMiner({ onScoreUpdate }: GoldMinerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameStateRef = useRef<GameState>({
    score: 0,
    level: 1,
    targetScore: LEVEL_TARGETS[0],
    timeLeft: 60,
    isRunning: false,
    hook: {
      x: GOLD_MINER_CONFIG.hookStartX,
      y: GOLD_MINER_CONFIG.hookStartY,
      angle: 0,
      length: 40,
      state: 'swinging',
      speed: GOLD_MINER_CONFIG.swingSpeed,
      caughtObject: null,
      direction: 1,
    },
    objects: [],
    gameOver: false,
    paused: false,
    inventory: {
      dynamite: 0,
      strengthPotion: 0,
      luckyClover: 0,
      diamondPolish: 0,
      rockCollector: 0,
    },
  })
  
  const [score, setScore] = useState(0)
  const [level, setLevel] = useState(1)
  const [targetScore, setTargetScore] = useState(LEVEL_TARGETS[0])
  const [timeLeft, setTimeLeft] = useState(60)
  const [gameOver, setGameOver] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [showShop, setShowShop] = useState(false)
  const [inventory, setInventory] = useState(gameStateRef.current.inventory)
  const [totalScore, setTotalScore] = useState(0)  // 累计得分

  // 生成关卡物品
  const generateLevel = useCallback((levelNum: number) => {
    const objects: GameObject[] = []
    const width = GOLD_MINER_CONFIG.canvasWidth
    const height = GOLD_MINER_CONFIG.canvasHeight
    const groundY = GOLD_MINER_CONFIG.groundY
    
    // 根据关卡确定物品数量和类型
    const itemCount = 6 + Math.floor(levelNum / 2)
    const hasDiamond = levelNum >= 2
    const hasBag = levelNum >= 4
    const hasMouse = levelNum >= 6
    const hasMole = levelNum >= 3
    const hasDynamite = levelNum >= 5
    
    for (let i = 0; i < itemCount; i++) {
      const x = 50 + Math.random() * (width - 100)
      const y = groundY + 50 + Math.random() * (height - groundY - 100)
      
      let type: GameObject['type']
      let size: number
      let itemValue: { value: number; weight: number }
      
      const rand = Math.random()
      
      if (hasDynamite && rand < 0.05) {
        type = 'dynamite'
        size = 25
        itemValue = ITEM_VALUES.dynamite
      } else if (rand < 0.1 && hasDiamond) {
        type = 'diamond'
        size = 20
        itemValue = ITEM_VALUES.diamond
      } else if (rand < 0.25) {
        type = 'gold_small'
        size = 25 + Math.random() * 15
        itemValue = { value: 50, weight: 2 }
      } else if (rand < 0.4) {
        type = 'gold_medium'
        size = 35 + Math.random() * 10
        itemValue = { value: 100, weight: 4 }
      } else if (rand < 0.55) {
        type = 'gold_large'
        size = 50 + Math.random() * 15
        itemValue = { value: 250, weight: 8 }
      } else if (rand < 0.65) {
        type = 'gold_huge'
        size = 70 + Math.random() * 20
        itemValue = { value: 500, weight: 12 }
      } else if (rand < 0.75 && hasBag) {
        type = 'bag'
        size = 30
        itemValue = ITEM_VALUES.bag
      } else if (rand < 0.85 && hasMouse) {
        type = 'mouse'
        size = 25
        itemValue = ITEM_VALUES.mouse
      } else if (rand < 0.9 && hasMole) {
        type = 'mole'
        size = 30
        itemValue = ITEM_VALUES.mole
      } else {
        type = 'stone'
        size = 30 + Math.random() * 20
        itemValue = ITEM_VALUES.stone
      }
      
      objects.push({
        type,
        x,
        y,
        width: size,
        height: size,
        value: itemValue.value,
        weight: itemValue.weight,
        color: getObjectColor(type),
        grabbed: false,
        speedX: (type === 'mouse' || type === 'mole') ? (Math.random() > 0.5 ? 1 : -1) * 2 : undefined,
      })
    }
    
    return objects
  }, [])
  
  // 获取物品颜色
  const getObjectColor = (type: GameObject['type']): string => {
    switch (type) {
      case 'gold_small':
      case 'gold_medium':
      case 'gold_large':
      case 'gold_huge':
        return '#FFD700'
      case 'diamond':
        return '#00FFFF'
      case 'stone':
        return '#808080'
      case 'bag':
        return '#8B4513'
      case 'mouse':
        return '#A0A0A0'
      case 'mole':
        return '#8B4513'
      case 'bone':
        return '#F5F5DC'
      case 'dynamite':
        return '#FF4500'
      default:
        return '#888888'
    }
  }
  
  // 绘制金块
  const drawGold = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, _subtype: string) => {
    const grad = ctx.createLinearGradient(x - size/2, y - size/2, x + size/2, y + size/2)
    grad.addColorStop(0, '#FFD700')
    grad.addColorStop(0.3, '#FFC125')
    grad.addColorStop(0.5, '#DAA520')
    grad.addColorStop(0.7, '#B8860B')
    grad.addColorStop(1, '#8B6914')
    
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.ellipse(x, y, size / 2, size / 2 * 0.8, 0, 0, Math.PI * 2)
    ctx.fill()
    
    // 高光
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
    ctx.beginPath()
    ctx.ellipse(x - size/4, y - size/4, size/6, size/6, -0.5, 0, Math.PI * 2)
    ctx.fill()
    
    // 边框
    ctx.strokeStyle = '#8B6914'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.ellipse(x, y, size / 2, size / 2 * 0.8, 0, 0, Math.PI * 2)
    ctx.stroke()
  }

  // 绘制钻石
  const drawDiamond = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
    const grad = ctx.createLinearGradient(x - size/2, y - size/2, x + size/2, y + size/2)
    grad.addColorStop(0, '#00FFFF')
    grad.addColorStop(0.3, '#00CED1')
    grad.addColorStop(0.5, '#00BFFF')
    grad.addColorStop(0.7, '#1E90FF')
    grad.addColorStop(1, '#4169E1')
    
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.moveTo(x, y - size/2)
    ctx.lineTo(x + size/2, y)
    ctx.lineTo(x, y + size/2)
    ctx.lineTo(x - size/2, y)
    ctx.closePath()
    ctx.fill()
    
    // 高光
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
    ctx.beginPath()
    ctx.moveTo(x, y - size/2)
    ctx.lineTo(x + size/4, y - size/6)
    ctx.lineTo(x, y)
    ctx.lineTo(x - size/4, y - size/6)
    ctx.closePath()
    ctx.fill()
    
    // 边框
    ctx.strokeStyle = '#4169E1'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(x, y - size/2)
    ctx.lineTo(x + size/2, y)
    ctx.lineTo(x, y + size/2)
    ctx.lineTo(x - size/2, y)
    ctx.closePath()
    ctx.stroke()
    
    // 闪光
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
    ctx.beginPath()
    ctx.arc(x - size/6, y - size/4, size/10, 0, Math.PI * 2)
    ctx.fill()
  }

  // 绘制石头
  const drawStone = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
    const grad = ctx.createLinearGradient(x - size/2, y - size/2, x + size/2, y + size/2)
    grad.addColorStop(0, '#808080')
    grad.addColorStop(0.4, '#696969')
    grad.addColorStop(0.7, '#5A5A5A')
    grad.addColorStop(1, '#4A4A4A')
    
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.ellipse(x, y, size / 2, size / 2 * 0.7, 0, 0, Math.PI * 2)
    ctx.fill()
    
    // 纹理
    ctx.strokeStyle = '#4A4A4A'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.arc(x - size/6, y - size/6, size/8, 0, Math.PI * 2)
    ctx.stroke()
    
    // 边框
    ctx.strokeStyle = '#3A3A3A'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.ellipse(x, y, size / 2, size / 2 * 0.7, 0, 0, Math.PI * 2)
    ctx.stroke()
  }

  // 绘制钱袋
  const drawBag = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
    const grad = ctx.createLinearGradient(x - size/2, y - size/2, x + size/2, y + size/2)
    grad.addColorStop(0, '#8B4513')
    grad.addColorStop(0.5, '#A0522D')
    grad.addColorStop(1, '#654321')
    
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.ellipse(x, y + 5, size/2, size/2.5, 0, 0, Math.PI * 2)
    ctx.fill()
    
    // 袋口
    ctx.fillStyle = '#654321'
    ctx.beginPath()
    ctx.ellipse(x, y - size/3, size/3, size/6, 0, 0, Math.PI * 2)
    ctx.fill()
    
    // 问号
    ctx.fillStyle = '#FFD700'
    ctx.font = `bold ${size/2}px Arial`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('?', x, y + 5)
    
    // 边框
    ctx.strokeStyle = '#3A2A1A'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.ellipse(x, y + 5, size/2, size/2.5, 0, 0, Math.PI * 2)
    ctx.stroke()
  }

  // 绘制老鼠
  const drawMouse = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
    // 身体
    const grad = ctx.createRadialGradient(x, y, 0, x, y, size/2)
    grad.addColorStop(0, '#A0A0A0')
    grad.addColorStop(1, '#808080')
    
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.ellipse(x, y, size/2, size/3, 0, 0, Math.PI * 2)
    ctx.fill()
    
    // 耳朵
    ctx.fillStyle = '#FFB6C1'
    ctx.beginPath()
    ctx.arc(x - size/4, y - size/4, size/8, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(x + size/4, y - size/4, size/8, 0, Math.PI * 2)
    ctx.fill()
    
    // 眼睛
    ctx.fillStyle = '#000'
    ctx.beginPath()
    ctx.arc(x - size/8, y - size/10, size/16, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(x + size/8, y - size/10, size/16, 0, Math.PI * 2)
    ctx.fill()
    
    // 鼻子
    ctx.fillStyle = '#FFB6C1'
    ctx.beginPath()
    ctx.arc(x, y + size/8, size/10, 0, Math.PI * 2)
    ctx.fill()
    
    // 边框
    ctx.strokeStyle = '#606060'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.ellipse(x, y, size/2, size/3, 0, 0, Math.PI * 2)
    ctx.stroke()
  }

  // 绘制鼹鼠
  const drawMole = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
    const grad = ctx.createRadialGradient(x, y, 0, x, y, size/2)
    grad.addColorStop(0, '#8B4513')
    grad.addColorStop(1, '#654321')
    
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.ellipse(x, y, size/2, size/3, 0, 0, Math.PI * 2)
    ctx.fill()
    
    // 眼睛
    ctx.fillStyle = '#000'
    ctx.beginPath()
    ctx.arc(x - size/8, y - size/10, size/20, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(x + size/8, y - size/10, size/20, 0, Math.PI * 2)
    ctx.fill()
    
    // 鼻子
    ctx.fillStyle = '#000'
    ctx.beginPath()
    ctx.arc(x, y + size/8, size/8, 0, Math.PI * 2)
    ctx.fill()
    
    // 门牙
    ctx.fillStyle = '#FFF'
    ctx.fillRect(x - size/8, y + size/5, size/10, size/8)
    ctx.fillRect(x + size/20, y + size/5, size/10, size/8)
    
    // 边框
    ctx.strokeStyle = '#4A2A0A'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.ellipse(x, y, size/2, size/3, 0, 0, Math.PI * 2)
    ctx.stroke()
  }

  // 绘制炸药
  const drawDynamite = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
    // 炸药桶
    const grad = ctx.createLinearGradient(x - size/3, y - size/2, x + size/3, y + size/2)
    grad.addColorStop(0, '#FF4500')
    grad.addColorStop(0.5, '#DC143C')
    grad.addColorStop(1, '#8B0000')
    
    ctx.fillStyle = grad
    ctx.fillRect(x - size/3, y - size/2, size/1.5, size)
    
    // 引线
    ctx.strokeStyle = '#333'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(x, y - size/2)
    ctx.lineTo(x, y - size/2 - 10)
    ctx.stroke()
    
    // 火花
    ctx.fillStyle = '#FFD700'
    ctx.beginPath()
    ctx.arc(x, y - size/2 - 12, 4, 0, Math.PI * 2)
    ctx.fill()
    
    // TNT文字
    ctx.fillStyle = '#FFF'
    ctx.font = 'bold 10px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('TNT', x, y)
    
    // 边框
    ctx.strokeStyle = '#8B0000'
    ctx.lineWidth = 2
    ctx.strokeRect(x - size/3, y - size/2, size/1.5, size)
  }

  // 绘制矿工
  const drawMiner = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
    // 身体
    const bodyGrad = ctx.createLinearGradient(x - size/3, y - size/2, x + size/3, y + size/2)
    bodyGrad.addColorStop(0, '#4169E1')
    bodyGrad.addColorStop(0.5, '#4169E1')
    bodyGrad.addColorStop(1, '#2E4A8E')
    
    ctx.fillStyle = bodyGrad
    ctx.beginPath()
    ctx.roundRect(x - size/3, y - size/4, size/1.5, size/1.5, 5)
    ctx.fill()
    
    // 头部
    const headGrad = ctx.createRadialGradient(x, y - size/3, 0, x, y - size/3, size/3)
    headGrad.addColorStop(0, '#FFE4C4')
    headGrad.addColorStop(1, '#DEB887')
    
    ctx.fillStyle = headGrad
    ctx.beginPath()
    ctx.arc(x, y - size/3, size/3, 0, Math.PI * 2)
    ctx.fill()
    
    // 白色大胡子（经典黄金矿工特征）
    ctx.fillStyle = '#FFFFFF'
    ctx.beginPath()
    ctx.ellipse(x, y - size/8, size/3, size/5, 0, 0, Math.PI * 2)
    ctx.fill()
    
    // 头盔
    const helmetGrad = ctx.createLinearGradient(x - size/3, y - size/2, x + size/3, y - size/3)
    helmetGrad.addColorStop(0, '#FFD700')
    helmetGrad.addColorStop(0.5, '#FFC107')
    helmetGrad.addColorStop(1, '#FFA000')
    
    ctx.fillStyle = helmetGrad
    ctx.beginPath()
    ctx.arc(x, y - size/3, size/3, Math.PI, 0)
    ctx.fill()
    ctx.beginPath()
    ctx.rect(x - size/3, y - size/3, size/1.5, size/8)
    ctx.fill()
    
    // 头盔灯光
    ctx.fillStyle = '#FFF'
    ctx.beginPath()
    ctx.arc(x, y - size/2.5, size/8, 0, Math.PI * 2)
    ctx.fill()
    
    // 灯光效果
    ctx.fillStyle = 'rgba(255, 255, 0, 0.3)'
    ctx.beginPath()
    ctx.moveTo(x, y - size/2.5)
    ctx.lineTo(x - size/2, y + size/2)
    ctx.lineTo(x + size/2, y + size/2)
    ctx.closePath()
    ctx.fill()
    
    // 边框
    ctx.strokeStyle = '#2E4A8E'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.roundRect(x - size/3, y - size/4, size/1.5, size/1.5, 5)
    ctx.stroke()
  }

  // 绘制绳子和钩子
  const drawRopeAndHook = (ctx: CanvasRenderingContext2D, startX: number, startY: number, endX: number, endY: number) => {
    // 绳子
    const ropeGrad = ctx.createLinearGradient(startX, startY, endX, endY)
    ropeGrad.addColorStop(0, '#8B4513')
    ropeGrad.addColorStop(0.5, '#A0522D')
    ropeGrad.addColorStop(1, '#8B4513')
    
    ctx.strokeStyle = ropeGrad
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.moveTo(startX, startY)
    ctx.lineTo(endX, endY)
    ctx.stroke()
    
    // 钩子
    const hookGrad = ctx.createLinearGradient(endX - 10, endY - 10, endX + 10, endY + 10)
    hookGrad.addColorStop(0, '#FFD700')
    hookGrad.addColorStop(0.5, '#FFA500')
    hookGrad.addColorStop(1, '#FF8C00')
    
    ctx.fillStyle = hookGrad
    ctx.strokeStyle = '#8B4513'
    ctx.lineWidth = 2
    
    // 钩子主体
    ctx.beginPath()
    ctx.arc(endX, endY, 10, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    
    // 钩子尖端
    ctx.beginPath()
    ctx.moveTo(endX, endY + 5)
    ctx.lineTo(endX - 8, endY + 15)
    ctx.lineTo(endX + 8, endY + 15)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
    
    // 高光
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
    ctx.beginPath()
    ctx.arc(endX - 3, endY - 3, 3, 0, Math.PI * 2)
    ctx.fill()
  }

  // 绘制背景
  const drawBackground = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // 天空渐变
    const skyGrad = ctx.createLinearGradient(0, 0, 0, GOLD_MINER_CONFIG.groundY)
    skyGrad.addColorStop(0, '#87CEEB')
    skyGrad.addColorStop(1, '#B0E0E6')
    
    ctx.fillStyle = skyGrad
    ctx.fillRect(0, 0, width, GOLD_MINER_CONFIG.groundY)
    
    // 草地
    const grassGrad = ctx.createLinearGradient(0, 0, 0, GOLD_MINER_CONFIG.groundY)
    grassGrad.addColorStop(0, '#228B22')
    grassGrad.addColorStop(1, '#1E7B1E')
    
    ctx.fillStyle = grassGrad
    ctx.fillRect(0, GOLD_MINER_CONFIG.groundY - 30, width, 30)
    
    // 泥土层
    const dirtGrad = ctx.createLinearGradient(0, GOLD_MINER_CONFIG.groundY, 0, height)
    dirtGrad.addColorStop(0, '#8B4513')
    dirtGrad.addColorStop(0.3, '#6B3510')
    dirtGrad.addColorStop(1, '#4A2508')
    
    ctx.fillStyle = dirtGrad
    ctx.fillRect(0, GOLD_MINER_CONFIG.groundY, width, height - GOLD_MINER_CONFIG.groundY)
    
    // 泥土纹理
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'
    for (let i = 0; i < 30; i++) {
      const stoneX = Math.random() * width
      const stoneY = GOLD_MINER_CONFIG.groundY + 20 + Math.random() * (height - GOLD_MINER_CONFIG.groundY - 40)
      const stoneSize = 3 + Math.random() * 8
      ctx.beginPath()
      ctx.arc(stoneX, stoneY, stoneSize, 0, Math.PI * 2)
      ctx.fill()
    }
    
    // 边框线
    ctx.strokeStyle = '#4A2508'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(0, GOLD_MINER_CONFIG.groundY)
    ctx.lineTo(width, GOLD_MINER_CONFIG.groundY)
    ctx.stroke()
  }

  // 绘制UI
  const drawUI = (ctx: CanvasRenderingContext2D, width: number) => {
    // 顶部信息栏背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    ctx.fillRect(0, 0, width, 60)
    
    // 关卡
    ctx.fillStyle = '#FFD700'
    ctx.font = 'bold 18px Arial'
    ctx.textAlign = 'left'
    ctx.fillText(`关卡: ${gameStateRef.current.level}`, 20, 35)
    
    // 目标金额
    ctx.fillStyle = '#FFF'
    ctx.fillText(`目标: $${gameStateRef.current.targetScore}`, 150, 35)
    
    // 当前金额
    ctx.fillStyle = '#00FF00'
    ctx.textAlign = 'center'
    ctx.fillText(`$${gameStateRef.current.score}`, width / 2, 35)
    
    // 剩余时间
    ctx.fillStyle = gameStateRef.current.timeLeft <= 10 ? '#FF0000' : '#FFF'
    ctx.textAlign = 'right'
    ctx.fillText(`时间: ${Math.ceil(gameStateRef.current.timeLeft)}秒`, width - 20, 35)
    
    // 炸药数量
    if (gameStateRef.current.inventory.dynamite > 0) {
      ctx.fillStyle = '#FFD700'
      ctx.textAlign = 'left'
      ctx.font = '14px Arial'
      ctx.fillText(`💣 x${gameStateRef.current.inventory.dynamite}`, 20, 55)
    }
  }

  // 绘制函数
  const draw = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // 清空画布
    ctx.clearRect(0, 0, width, height)
    
    // 绘制背景
    drawBackground(ctx, width, height)
    
    // 绘制矿工
    drawMiner(ctx, GOLD_MINER_CONFIG.hookStartX, 30, 50)
    
    // 绘制物品
    gameStateRef.current.objects.forEach(obj => {
      if (obj.grabbed && gameStateRef.current.hook.state === 'retracting') return
      
      switch (obj.type) {
        case 'gold_small':
        case 'gold_medium':
        case 'gold_large':
        case 'gold_huge':
          drawGold(ctx, obj.x, obj.y, obj.width, obj.type)
          break
        case 'diamond':
          drawDiamond(ctx, obj.x, obj.y, obj.width)
          break
        case 'stone':
          drawStone(ctx, obj.x, obj.y, obj.width)
          break
        case 'bag':
          drawBag(ctx, obj.x, obj.y, obj.width)
          break
        case 'mouse':
          drawMouse(ctx, obj.x, obj.y, obj.width)
          break
        case 'mole':
          drawMole(ctx, obj.x, obj.y, obj.width)
          break
        case 'dynamite':
          drawDynamite(ctx, obj.x, obj.y, obj.width)
          break
        default:
          ctx.fillStyle = obj.color
          ctx.beginPath()
          ctx.arc(obj.x, obj.y, obj.width / 2, 0, Math.PI * 2)
          ctx.fill()
      }
    })
    
    // 绘制绳子和钩子
    const hook = gameStateRef.current.hook
    drawRopeAndHook(ctx, GOLD_MINER_CONFIG.hookStartX, GOLD_MINER_CONFIG.hookStartY, hook.x, hook.y)
    
    // 绘制UI
    drawUI(ctx, width)
  }

  // 初始化游戏
  const initGame = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      setGameStarted(true)
      return
    }
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const gameState = gameStateRef.current
    gameState.objects = generateLevel(gameState.level)
    gameState.score = 0
    gameState.timeLeft = 60
    gameState.isRunning = true
    gameState.hook = {
      x: GOLD_MINER_CONFIG.hookStartX,
      y: GOLD_MINER_CONFIG.hookStartY,
      angle: 0,
      length: 40,
      state: 'swinging',
      speed: GOLD_MINER_CONFIG.swingSpeed,
      caughtObject: null,
      direction: 1,
    }
    
    setScore(0)
    setLevel(gameState.level)
    setTargetScore(gameState.targetScore)
    setTimeLeft(60)
    setGameOver(false)
    setGameStarted(true)
    setIsPaused(false)
  }, [generateLevel])

  // 当 gameStarted 变为 true 但游戏还没真正初始化时，再次调用 initGame
  useEffect(() => {
    if (gameStarted && !gameStateRef.current.isRunning) {
      initGame()
    }
  }, [gameStarted, initGame])

  // 游戏主循环
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    let animationId: number
    let lastTime = 0
    let timerInterval: ReturnType<typeof setInterval> | null = null
    let moveInterval: ReturnType<typeof setInterval> | null = null
    
    const gameLoop = (timestamp: number) => {
      if (!lastTime) lastTime = timestamp
      const deltaTime = (timestamp - lastTime) / 1000
      lastTime = timestamp
      
      const gameState = gameStateRef.current
      
      if (gameState.isRunning && !gameState.paused && !gameState.gameOver) {
        // 更新钩子状态
        updateHook(deltaTime)
        
        // 更新移动的物品（老鼠、鼹鼠）
        updateMovingObjects(deltaTime)
        
        // 检测碰撞
        checkCollisions()
        
        // 检测抓取物品收回
        checkGrabbedObject()
        
        // 绘制
        draw(ctx, GOLD_MINER_CONFIG.canvasWidth, GOLD_MINER_CONFIG.canvasHeight)
      }
      
      animationId = requestAnimationFrame(gameLoop)
    }
    
    // 更新钩子
    const updateHook = (_deltaTime: number) => {
      const hook = gameStateRef.current.hook
      const gameState = gameStateRef.current
      
      switch (hook.state) {
        case 'swinging':
          // 摆动
          hook.angle += hook.speed * hook.direction
          if (hook.angle > Math.PI / 3) {
            hook.direction = -1
          } else if (hook.angle < -Math.PI / 3) {
            hook.direction = 1
          }
          
          hook.x = GOLD_MINER_CONFIG.hookStartX + Math.sin(hook.angle) * 40
          hook.y = GOLD_MINER_CONFIG.hookStartY + Math.cos(hook.angle) * 40
          break
          
        case 'lowering':
          // 放下
          hook.length += GOLD_MINER_CONFIG.lowerSpeed
          
          const targetX = GOLD_MINER_CONFIG.hookStartX + Math.sin(hook.angle) * hook.length
          const targetY = GOLD_MINER_CONFIG.hookStartY + Math.cos(hook.angle) * hook.length
          
          hook.x = targetX
          hook.y = targetY
          
          // 检查是否到达最大长度或碰到边界
          if (hook.length >= GOLD_MINER_CONFIG.maxHookLength || 
              hook.y > GOLD_MINER_CONFIG.canvasHeight - 20 ||
              hook.x < 20 || hook.x > GOLD_MINER_CONFIG.canvasWidth - 20) {
            hook.state = 'raising'
          }
          break
          
        case 'raising':
          // 收回
          hook.length -= GOLD_MINER_CONFIG.raiseSpeed
          
          hook.x = GOLD_MINER_CONFIG.hookStartX + Math.sin(hook.angle) * hook.length
          hook.y = GOLD_MINER_CONFIG.hookStartY + Math.cos(hook.angle) * hook.length
          
          if (hook.length <= 40) {
            hook.length = 40
            hook.state = 'swinging'
            
            // 如果抓到了东西，结算
            if (hook.caughtObject) {
              handleCaughtObject(hook.caughtObject)
              hook.caughtObject = null
            }
          }
          break
          
        case 'retracting':
          // 快速收回（炸药或其他情况）
          const speed = gameState.inventory.strengthPotion > 0 
            ? GOLD_MINER_CONFIG.raiseSpeed * 2 
            : GOLD_MINER_CONFIG.raiseSpeed * 1.5
          
          hook.length -= speed
          
          hook.x = GOLD_MINER_CONFIG.hookStartX + Math.sin(hook.angle) * hook.length
          hook.y = GOLD_MINER_CONFIG.hookStartY + Math.cos(hook.angle) * hook.length
          
          if (hook.length <= 40) {
            hook.length = 40
            hook.state = 'swinging'
            
            if (hook.caughtObject) {
              handleCaughtObject(hook.caughtObject)
              hook.caughtObject = null
            }
          }
          break
      }
    }
    
    // 更新移动的物品
    const updateMovingObjects = (_deltaTime: number) => {
      gameStateRef.current.objects.forEach(obj => {
        if (obj.speedX && !obj.grabbed) {
          obj.x += obj.speedX
          
          // 边界反弹
          if (obj.x < 50 || obj.x > GOLD_MINER_CONFIG.canvasWidth - 50) {
            obj.speedX *= -1
          }
        }
      })
    }
    
    // 检测碰撞
    const checkCollisions = () => {
      const hook = gameStateRef.current.hook
      if (hook.state !== 'lowering' || hook.caughtObject) return
      
      for (const obj of gameStateRef.current.objects) {
        if (obj.grabbed) continue
        
        const dx = hook.x - obj.x
        const dy = hook.y - obj.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        if (distance < obj.width / 2 + 10) {
          // 碰撞检测
          if (obj.type === 'dynamite') {
            // 炸药爆炸
            handleDynamiteExplosion(obj)
          } else {
            // 抓取物品
            obj.grabbed = true
            hook.caughtObject = obj
            hook.state = 'raising'
          }
          break
        }
      }
    }
    
    // 检测抓取的物品
    const checkGrabbedObject = () => {
      const hook = gameStateRef.current.hook
      if (hook.state !== 'retracting' || !hook.caughtObject) return
      
      // 物品跟随钩子
      hook.caughtObject.x = hook.x
      hook.caughtObject.y = hook.y
    }
    
    // 处理抓到的物品
    const handleCaughtObject = (obj: GameObject) => {
      const gameState = gameStateRef.current
      
      if (obj.type === 'bag') {
        // 钱袋随机内容
        const rand = Math.random()
        if (rand < 0.3) {
          obj.value = 50 + Math.floor(Math.random() * 100)
        } else if (rand < 0.5) {
          obj.value = 100 + Math.floor(Math.random() * 200)
        } else if (rand < 0.7) {
          // 获得道具
          const item = Math.random() > 0.5 ? 'dynamite' : 'strengthPotion'
          gameState.inventory[item]++
          obj.value = 0
        } else {
          obj.value = 10 + Math.floor(Math.random() * 50)
        }
      }
      
      // 应用道具效果
      if (obj.type === 'diamond' && gameState.inventory.diamondPolish > 0) {
        obj.value = 900
        gameState.inventory.diamondPolish--
      }
      
      if (obj.type === 'stone' && gameState.inventory.rockCollector > 0) {
        obj.value = 33  // 11 * 3
        gameState.inventory.rockCollector--
      }
      
      // 添加分数
      gameState.score += obj.value
      setScore(gameState.score)
      onScoreUpdate?.(gameState.score)
      
      // 检查是否过关
      if (gameState.score >= gameState.targetScore) {
        // 过关！
        setTotalScore(prev => prev + gameState.score)
        gameState.level++
        gameState.targetScore = LEVEL_TARGETS[Math.min(gameState.level - 1, LEVEL_TARGETS.length - 1)]
        
        // 进入商店
        setShowShop(true)
        setIsPaused(true)
        gameState.isRunning = false
      }
    }
    
    // 处理炸药爆炸
    const handleDynamiteExplosion = (obj: GameObject) => {
      const gameState = gameStateRef.current
      
      // 移除炸药
      gameState.objects = gameState.objects.filter(o => o !== obj)
      
      // 收回钩子
      gameState.hook.state = 'retracting'
      
      // 炸掉周围的物品
      gameState.objects.forEach(o => {
        if (!o.grabbed) {
          const dx = obj.x - o.x
          const dy = obj.y - o.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          
          if (distance < 80 && o.type !== 'dynamite') {
            gameState.score += o.value
            o.grabbed = true
          }
        }
      })
      
      setScore(gameState.score)
    }
    
    // 定时器
    const startTimer = () => {
      timerInterval = setInterval(() => {
        const gameState = gameStateRef.current
        if (gameState.isRunning && !gameState.paused && !gameState.gameOver) {
          gameState.timeLeft -= 1
          setTimeLeft(gameState.timeLeft)
          
          if (gameState.timeLeft <= 0) {
            // 时间结束
            gameState.isRunning = false
            setGameOver(true)
            
            if (timerInterval) clearInterval(timerInterval)
            if (moveInterval) clearInterval(moveInterval)
          }
        }
      }, 1000)
    }
    
    // 开始游戏
    if (gameStateRef.current.isRunning && !gameStateRef.current.paused) {
      startTimer()
    }
    
    animationId = requestAnimationFrame(gameLoop)
    
    return () => {
      cancelAnimationFrame(animationId)
      if (timerInterval) clearInterval(timerInterval)
      if (moveInterval) clearInterval(moveInterval)
    }
  }, [onScoreUpdate])
  
  // 键盘控制
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const gameState = gameStateRef.current
      
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        // 放下钩子
        if (gameState.isRunning && !gameState.paused && gameState.hook.state === 'swinging') {
          gameState.hook.state = 'lowering'
        }
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        // 使用炸药
        if (gameState.isRunning && !gameState.paused && gameState.hook.caughtObject) {
          if (gameState.inventory.dynamite > 0 && gameState.hook.caughtObject.type !== 'dynamite') {
            gameState.inventory.dynamite--
            gameState.hook.state = 'retracting'
          }
        }
      } else if (e.key === ' ' || e.key === 'Escape') {
        // 暂停
        if (gameState.isRunning) {
          gameState.paused = !gameState.paused
          setIsPaused(gameState.paused)
        }
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
  
  // 购买道具
  const buyItem = (itemId: string) => {
    const item = SHOP_ITEMS.find(i => i.id === itemId)
    if (!item) return
    
    const gameState = gameStateRef.current
    if (gameState.score >= item.price) {
      gameState.score -= item.price
      
      if (itemId === 'hourglass') {
        gameState.timeLeft += 15
        setTimeLeft(gameState.timeLeft)
      } else {
        gameState.inventory[itemId as keyof typeof gameState.inventory]++
      }
      
      setScore(gameState.score)
      setInventory({ ...gameState.inventory })
    }
  }
  
  // 继续下一关
  const continueToNextLevel = () => {
    const gameState = gameStateRef.current
    setShowShop(false)
    gameState.isRunning = true
    gameState.objects = generateLevel(gameState.level)
    gameState.hook.state = 'swinging'
    gameState.hook.length = 40
    gameState.timeLeft = 60
    setTimeLeft(60)
    setIsPaused(false)
  }
  
  // 重新开始
  const restartGame = () => {
    const gameState = gameStateRef.current
    gameState.score = 0
    gameState.level = 1
    gameState.targetScore = LEVEL_TARGETS[0]
    gameState.timeLeft = 60
    gameState.isRunning = true
    gameState.gameOver = false
    gameState.hook.state = 'swinging'
    gameState.hook.length = 40
    gameState.hook.caughtObject = null
    gameState.inventory = {
      dynamite: 0,
      strengthPotion: 0,
      luckyClover: 0,
      diamondPolish: 0,
      rockCollector: 0,
    }
    
    setScore(0)
    setLevel(1)
    setTargetScore(LEVEL_TARGETS[0])
    setTimeLeft(60)
    setGameOver(false)
    setInventory(gameState.inventory)
    setIsPaused(false)
    
    gameState.objects = generateLevel(1)
  }

  return (
    <div className="flex flex-col items-center gap-4 p-4 bg-gray-900 min-h-screen">
      {/* 游戏说明 */}
      <div className="text-white text-center mb-2">
        <h2 className="text-2xl font-bold text-yellow-400 mb-2">黄金矿工 - 经典版</h2>
        <p className="text-sm text-gray-300">
          按 <kbd className="px-2 py-1 bg-gray-700 rounded">↓</kbd> 或 <kbd className="px-2 py-1 bg-gray-700 rounded">S</kbd> 放下钩子 | 
          按 <kbd className="px-2 py-1 bg-gray-700 rounded">↑</kbd> 或 <kbd className="px-2 py-1 bg-gray-700 rounded">W</kbd> 使用炸药 | 
          按 <kbd className="px-2 py-1 bg-gray-700 rounded">空格</kbd> 暂停
        </p>
      </div>
      
      {/* 游戏画布 */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={GOLD_MINER_CONFIG.canvasWidth}
          height={GOLD_MINER_CONFIG.canvasHeight}
          className="border-4 border-yellow-600 rounded-lg shadow-2xl"
        />
        
        {/* 开始界面 */}
        {!gameStarted && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-lg">
            <div className="text-center">
              <h3 className="text-4xl font-bold text-yellow-400 mb-6">黄金矿工</h3>
              <p className="text-white mb-4">经典休闲挖矿游戏</p>
              <button
                onClick={initGame}
                className="px-8 py-3 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-lg transition-colors"
              >
                开始游戏
              </button>
              <p className="text-gray-400 text-sm mt-4">按空格键暂停</p>
            </div>
          </div>
        )}
        
        {/* 暂停界面 */}
        {isPaused && !showShop && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-lg">
            <h3 className="text-3xl font-bold text-yellow-400 mb-4">游戏暂停</h3>
            <button
              onClick={() => {
                gameStateRef.current.paused = false
                setIsPaused(false)
              }}
              className="px-8 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg transition-colors"
            >
              继续游戏
            </button>
          </div>
        )}
        
        {/* 商店界面 */}
        {showShop && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-lg p-6">
            <h3 className="text-3xl font-bold text-yellow-400 mb-4">商店</h3>
            <p className="text-white mb-4">当前金币: ${score}</p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-2xl mb-6">
              {SHOP_ITEMS.map(item => (
                <div
                  key={item.id}
                  className={`p-4 rounded-lg ${
                    score >= item.price ? 'bg-gray-700' : 'bg-gray-800'
                  }`}
                >
                  <div className="text-3xl mb-2">{item.icon}</div>
                  <div className="text-white font-bold">{item.name}</div>
                  <div className="text-yellow-400 text-sm">${item.price}</div>
                  <div className="text-gray-400 text-xs mt-1">{item.description}</div>
                  <button
                    onClick={() => buyItem(item.id)}
                    disabled={score < item.price}
                    className={`mt-2 px-4 py-1 rounded ${
                      score >= item.price
                        ? 'bg-green-500 hover:bg-green-600 text-white'
                        : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    购买
                  </button>
                </div>
              ))}
            </div>
            
            <div className="flex gap-4">
              <button
                onClick={continueToNextLevel}
                className="px-8 py-3 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-lg transition-colors"
              >
                继续下一关
              </button>
            </div>
          </div>
        )}
        
        {/* 游戏结束界面 */}
        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-lg">
            <h3 className="text-4xl font-bold text-red-500 mb-4">游戏结束</h3>
            <div className="text-white mb-4">
              <p className="text-xl">本关得分: ${score}</p>
              <p className="text-xl">关卡: {level}</p>
              <p className="text-yellow-400">目标: ${targetScore}</p>
            </div>
            <button
              onClick={restartGame}
              className="px-8 py-3 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-lg transition-colors"
            >
              重新开始
            </button>
          </div>
        )}
      </div>
      
      {/* 物品价值表 */}
      <div className="bg-gray-800 rounded-lg p-4 mt-4">
        <h4 className="text-yellow-400 font-bold mb-2">物品价值表</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
          <div className="text-white">💰 小金块: $50</div>
          <div className="text-white">💰 中金块: $100</div>
          <div className="text-white">💰 大金块: $250</div>
          <div className="text-white">💰 巨型金块: $500</div>
          <div className="text-cyan-400">💎 钻石: $600</div>
          <div className="text-gray-400">🪨 石头: $11</div>
          <div className="text-orange-400">🐭 老鼠: $602</div>
          <div className="text-amber-600">🐹 鼹鼠: $502</div>
          <div className="text-amber-700">💼 钱袋: 随机</div>
          <div className="text-red-500">💣 炸药: 爆炸!</div>
        </div>
      </div>
    </div>
  )
}
