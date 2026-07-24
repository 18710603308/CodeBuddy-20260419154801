import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import Peer from 'peerjs'
import type { DataConnection } from 'peerjs'
import {
  Users, Wifi, WifiOff, Copy, LogOut, RefreshCw, Eraser, Download,
  Send, Grid3x3, Crown, MessageSquare, User as UserIcon, Palette, Trash2,
  Image as ImageIcon, Plus, X, Upload, Save, FolderOpen,
} from 'lucide-react'

// ==================== 类型 ====================
interface BoardState {
  gridSize: number
  cells: number[]
}
interface Player {
  id: string
  name: string
  color: string
  isHost: boolean
}
interface RemoteCursor {
  id: string
  name: string
  color: string
  row: number
  col: number
}
interface CustomColor {
  hex: string
  name: string
}
interface RefImage {
  image: string
  name: string
  by: string
}
type Msg =
  | { t: 'hello'; name: string }
  | { t: 'welcome'; gridSize: number; cellsRLE: [number, number][]; players: Player[]; yourColor: string; customColors: CustomColor[]; refCount: number }
  | { t: 'players'; players: Player[] }
  | { t: 'batch'; ops: number[]; by: string }
  | { t: 'clear'; by: string }
  | { t: 'cursor'; row: number; col: number; by: string }
  | { t: 'chat'; name: string; color: string; text: string }
  | { t: 'newboard'; gridSize: number; cellsRLE: [number, number][] }
  | { t: 'palette'; customColors: CustomColor[] }
  | { t: 'addcolor'; hex: string; name: string }
  | { t: 'delcolor'; index: number }
  | { t: 'addref'; image: string; name: string; by: string }
  | { t: 'delref'; index: number }
  | { t: 'requestref'; index: number }
  | { t: 'hostmigrate'; newHostId: string }

// ==================== 常量 ====================
const BEAD_COLORS = [
  '#ffffff', '#d4d4d4', '#9ca3af', '#525252', '#000000',
  '#dc2626', '#f97316', '#facc15', '#84cc16', '#22c55e',
  '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6',
  '#d946ef', '#ec4899', '#f43f5e', '#795548', '#fde68a',
]
const BEAD_NAMES = [
  '白', '浅灰', '灰', '深灰', '黑',
  '红', '橙', '黄', '青柠', '绿',
  '青', '天蓝', '蓝', '靛蓝', '紫',
  '品红', '粉', '玫红', '棕', '米',
]
const PLAYER_COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']
const NAME_KEY = 'perler_player_name'
const PEER_PREFIX = 'perlercoop-'
const SAVE_KEY = 'perler_saves'
const AUTOSAVE_KEY = 'perler_autosave'
const BOARD_SIZES = [
  { label: '16', size: 16 },
  { label: '24', size: 24 },
  { label: '32', size: 32 },
  { label: '48', size: 48 },
  { label: '64', size: 64 },
  { label: '128', size: 128 },
  { label: '256', size: 256 },
]

const randCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let s = ''
  for (let i = 0; i < 4; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return s
}

// RLE 编解码 —— 压缩 cells 数组，避免大画板 welcome 消息超过 WebRTC DataChannel 限制
function rleEncode(cells: number[]): [number, number][] {
  if (cells.length === 0) return []
  const result: [number, number][] = []
  let i = 0
  while (i < cells.length) {
    const val = cells[i]
    let count = 1
    while (i + count < cells.length && cells[i + count] === val) count++
    result.push([val, count])
    i += count
  }
  return result
}
function rleDecode(encoded: [number, number][]): number[] {
  const result: number[] = []
  for (const [val, count] of encoded) {
    for (let i = 0; i < count; i++) result.push(val)
  }
  return result
}

const compressImage = (file: File, maxDim = 400, quality = 0.6): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let { width, height } = img
        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width)
          width = maxDim
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height)
          height = maxDim
        }
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.onerror = reject
      img.src = reader.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// ==================== 图片导入豆图 ====================
function colorDist(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number) {
  // 加权 RGB 距离，更接近人眼感知
  return Math.sqrt(2 * (r1 - r2) ** 2 + 4 * (g1 - g2) ** 2 + 3 * (b1 - b2) ** 2)
}

function findClosestColor(r: number, g: number, b: number, palette: string[]): number {
  let best = 0
  let bestDist = Infinity
  for (let i = 0; i < palette.length; i++) {
    const hex = palette[i]
    const pr = parseInt(hex.slice(1, 3), 16)
    const pg = parseInt(hex.slice(3, 5), 16)
    const pb = parseInt(hex.slice(5, 7), 16)
    const d = colorDist(r, g, b, pr, pg, pb)
    if (d < bestDist) { bestDist = d; best = i }
  }
  return best
}

function smoothArray(arr: Float32Array, radius = 2) {
  const res = new Float32Array(arr.length)
  for (let i = 0; i < arr.length; i++) {
    let sum = 0, count = 0
    for (let j = Math.max(0, i - radius); j <= Math.min(arr.length - 1, i + radius); j++) {
      sum += arr[j]; count++
    }
    res[i] = sum / count
  }
  return res
}

function findPeaks(arr: Float32Array, minProminence = 0.15): number[] {
  const max = Math.max(...arr)
  if (max === 0) return []
  const threshold = max * minProminence
  const peaks: number[] = []
  for (let i = 2; i < arr.length - 2; i++) {
    if (arr[i] > threshold && arr[i] > arr[i - 1] && arr[i] > arr[i + 1] &&
        arr[i] >= arr[i - 2] && arr[i] >= arr[i + 2]) {
      peaks.push(i)
    }
  }
  return peaks
}

function findDominantGap(peaks: number[], minGap = 2): number | null {
  if (peaks.length < 2) return null
  const gaps: number[] = []
  for (let i = 1; i < peaks.length; i++) {
    const g = peaks[i] - peaks[i - 1]
    if (g >= minGap) gaps.push(g)
  }
  if (gaps.length === 0) return null
  const counts = new Map<number, number>()
  for (const g of gaps) {
    const rounded = Math.round(g)
    counts.set(rounded, (counts.get(rounded) || 0) + 1)
  }
  // 优先选择出现次数最多的间距，同时过滤掉过小（1px）和过大（>80）的异常值
  let best = 0, bestCount = 0
  counts.forEach((count, gap) => {
    if (gap >= 3 && gap <= 80 && count > bestCount) { bestCount = count; best = gap }
  })
  return best > 0 ? best : null
}

function detectGridSize(imageData: ImageData, maxSize = 256): { gridSize: number; cellSize: number; confidence: 'high' | 'low' } | null {
  const { width, height, data } = imageData
  const gray = new Float32Array(width * height)
  for (let i = 0; i < width * height; i++) {
    gray[i] = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2]
  }

  // 1. 梯度投影：网格线处梯度大，沿 x/y 投影后会出现周期性峰值
  const hGrad = new Float32Array(width).fill(0)
  const vGrad = new Float32Array(height).fill(0)
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x
      const gx = Math.abs(gray[idx] - gray[idx - 1]) + Math.abs(gray[idx + 1] - gray[idx])
      const gy = Math.abs(gray[idx] - gray[(y - 1) * width + x]) + Math.abs(gray[(y + 1) * width + x] - gray[idx])
      hGrad[x] += gx + gy * 0.5
      vGrad[y] += gy + gx * 0.5
    }
  }
  const hSmooth = smoothArray(hGrad, 2)
  const vSmooth = smoothArray(vGrad, 2)

  const hGap = findDominantGap(findPeaks(hSmooth))
  const vGap = findDominantGap(findPeaks(vSmooth))
  let cellSize = 0
  if (hGap && vGap) {
    cellSize = Math.round((hGap + vGap) / 2)
  } else if (hGap) {
    cellSize = hGap
  } else if (vGap) {
    cellSize = vGap
  }

  if (cellSize >= 3 && cellSize <= 80) {
    const gridSize = Math.round(Math.min(width, height) / cellSize)
    if (gridSize >= 4 && gridSize <= maxSize) {
      return { gridSize, cellSize, confidence: (hGap && vGap) ? 'high' : 'low' }
    }
  }

  // 2. 兜底：边缘变化频率的 30% 分位
  const hChanges = new Map<number, number>()
  const scanStep = Math.max(1, Math.floor(height / 60))
  for (let y = 0; y < height; y += scanStep) {
    for (let x = 1; x < width; x++) {
      const idx = (y * width + x) * 4
      const pidx = (y * width + x - 1) * 4
      if (colorDist(data[idx], data[idx + 1], data[idx + 2], data[pidx], data[pidx + 1], data[pidx + 2]) > 50) {
        hChanges.set(x, (hChanges.get(x) || 0) + 1)
      }
    }
  }
  const vChanges = new Map<number, number>()
  for (let x = 0; x < width; x += scanStep) {
    for (let y = 1; y < height; y++) {
      const idx = (y * width + x) * 4
      const pidx = ((y - 1) * width + x) * 4
      if (colorDist(data[idx], data[idx + 1], data[idx + 2], data[pidx], data[pidx + 1], data[pidx + 2]) > 50) {
        vChanges.set(y, (vChanges.get(y) || 0) + 1)
      }
    }
  }
  const collectPositions = (map: Map<number, number>) => {
    return Array.from(map.entries()).filter(([, c]) => c > 2).map(([p]) => p).sort((a, b) => a - b)
  }
  const positions = [...collectPositions(hChanges), ...collectPositions(vChanges)]
  const fallbackGap = findDominantGap(positions, 2)
  if (fallbackGap && fallbackGap >= 3 && fallbackGap <= 80) {
    const gridSize = Math.round(Math.min(width, height) / fallbackGap)
    if (gridSize >= 4 && gridSize <= maxSize) return { gridSize, cellSize: fallbackGap, confidence: 'low' }
  }

  return null
}

function getBackgroundColor(imageData: ImageData, gridSize: number): [number, number, number] {
  const { width, height, data } = imageData
  // 取四个角附近的中位数颜色作为背景色
  const samples: [number, number, number][] = []
  const addSample = (cx: number, cy: number) => {
    const idx = (cy * width + cx) * 4
    samples.push([data[idx], data[idx + 1], data[idx + 2]])
  }
  const r = Math.floor(Math.min(width, height) / gridSize / 4)
  for (let y = r; y < Math.min(height / 2, r * 4); y += r || 1) {
    for (let x = r; x < Math.min(width / 2, r * 4); x += r || 1) {
      addSample(x, y)
      addSample(width - 1 - x, y)
      addSample(x, height - 1 - y)
      addSample(width - 1 - x, height - 1 - y)
    }
  }
  if (samples.length === 0) return [255, 255, 255]
  const rs = samples.map(s => s[0]).sort((a, b) => a - b)
  const gs = samples.map(s => s[1]).sort((a, b) => a - b)
  const bs = samples.map(s => s[2]).sort((a, b) => a - b)
  const mid = Math.floor(samples.length / 2)
  return [rs[mid], gs[mid], bs[mid]]
}

function medianSample(samples: [number, number, number][]): [number, number, number] {
  if (samples.length === 0) return [255, 255, 255]
  const rs = samples.map(s => s[0]).sort((a, b) => a - b)
  const gs = samples.map(s => s[1]).sort((a, b) => a - b)
  const bs = samples.map(s => s[2]).sort((a, b) => a - b)
  const mid = Math.floor(samples.length / 2)
  return [rs[mid], gs[mid], bs[mid]]
}

function buildCellsFromImage(imageData: ImageData, gridSize: number, palette: string[]): number[] {
  const { width, height, data } = imageData
  const cells = new Array(gridSize * gridSize).fill(-1)
  const cellW = width / gridSize
  const cellH = height / gridSize
  const bg = getBackgroundColor(imageData, gridSize)
  const bgLum = 0.299 * bg[0] + 0.587 * bg[1] + 0.114 * bg[2]

  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      // 采样中心 30% 区域，最大化避开网格线边缘
      const x0 = Math.round(c * cellW + cellW * 0.35)
      const x1 = Math.round(c * cellW + cellW * 0.65)
      const y0 = Math.round(r * cellH + cellH * 0.35)
      const y1 = Math.round(r * cellH + cellH * 0.65)
      const samples: [number, number, number][] = []
      for (let y = Math.max(0, y0); y < Math.min(height, y1); y += Math.max(1, Math.floor((y1 - y0) / 4))) {
        for (let x = Math.max(0, x0); x < Math.min(width, x1); x += Math.max(1, Math.floor((x1 - x0) / 4))) {
          const idx = (y * width + x) * 4
          samples.push([data[idx], data[idx + 1], data[idx + 2]])
        }
      }
      const [sr, sg, sb] = medianSample(samples)
      const lum = 0.299 * sr + 0.587 * sg + 0.114 * sb
      // 背景/空白判定：接近图片背景色或极浅/极深的颜色当作空
      const distToBg = colorDist(sr, sg, sb, bg[0], bg[1], bg[2])
      if (distToBg < 35 || lum > 245 || lum < 12) {
        cells[r * gridSize + c] = -1
      } else {
        cells[r * gridSize + c] = findClosestColor(sr, sg, sb, palette)
      }
    }
  }
  return cells
}

function imageToBeadBoard(imageUrl: string, palette: string[], maxSize = 256, fixedGridSize?: number): Promise<{ gridSize: number; cells: number[]; detected: boolean; confidence: 'high' | 'low' }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        const ctx = canvas.getContext('2d')
        if (!ctx) throw new Error('Canvas 2D context unavailable')
        ctx.drawImage(img, 0, 0)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const detected = detectGridSize(imageData, maxSize)
        const gridSize = fixedGridSize ?? (detected ? detected.gridSize : Math.min(maxSize, Math.max(16, Math.round(Math.min(canvas.width, canvas.height) / 16))))
        const cells = buildCellsFromImage(imageData, gridSize, palette)
        resolve({ gridSize, cells, detected: !!detected && !fixedGridSize, confidence: detected ? detected.confidence : 'low' })
      } catch (e) {
        reject(e)
      }
    }
    img.onerror = () => reject(new Error('Image load failed'))
    img.src = imageUrl
  })
}
const PRESETS: { name: string; size: number; data: number[] }[] = [
  {
    name: '爱心', size: 16,
    data: (() => {
      const a = new Array(256).fill(-1)
      const heart = [
        '................',
        '..RR....RR......',
        '.RPPR..RPPR.....',
        'RPPPPRRPPPPR....',
        'RPPPPPPPPPPR....',
        'RPPPPPPPPPPR....',
        '.RPPPPPPPPR.....',
        '..RPPPPPPR......',
        '...RPPPPR.......',
        '....RPPR........',
        '.....RR.........',
        '................',
      ]
      const cm: Record<string, number> = { R: 5, P: 16, '.': -1 }
      for (let r = 0; r < heart.length; r++)
        for (let c = 0; c < heart[r].length; c++)
          a[r * 16 + c] = cm[heart[r][c]] ?? -1
      return a
    })(),
  },
  {
    name: '蘑菇', size: 16,
    data: (() => {
      const a = new Array(256).fill(-1)
      const m = [
        '................',
        '.....RRRR.......',
        '...RRWWWWRR.....',
        '..RWWWWWWWWRR...',
        '.RWWRRWWWWWRR...',
        '.RWWRRWWWWWR....',
        'RWWWWWWWWWWWR...',
        'RWWWWWWWWWWWR...',
        'RWWWWWWWWWWWR...',
        '.RWWWWWWWWWR....',
        '..KKKKKKKKK.....',
        '..KFFFFFFFK.....',
        '..KFFFFFFFK.....',
        '..KKKKKKKKK.....',
        '................',
      ]
      const cm: Record<string, number> = { R: 5, W: 0, K: 4, F: 19, '.': -1 }
      for (let r = 0; r < m.length; r++)
        for (let c = 0; c < m[r].length; c++)
          a[r * 16 + c] = cm[m[r][c]] ?? -1
      return a
    })(),
  },
  {
    name: '笑脸', size: 16,
    data: (() => {
      const a = new Array(256).fill(-1)
      const s = [
        '................',
        '....YYYYYYYY....',
        '..YYYYYYYYYYYY..',
        '.YYYYYYYYYYYYYY.',
        'YYYYYYYYYYYYYYYY',
        'YYKKYYYYYYYYKKYY',
        'YYKKYYYYYYYYKKYY',
        'YYYYYYYYYYYYYYYY',
        'YYYYYYYYYYYYYYYY',
        'YYKYYYYYYYYYYKYY',
        'YYYKYYYYYYYYKYYY',
        'YYYYKKKKKKKKYYYY',
        '.YYYYYYYYYYYYYY.',
        '..YYYYYYYYYYYY..',
        '....YYYYYYYY....',
        '................',
      ]
      const cm: Record<string, number> = { Y: 2, K: 4, '.': -1 }
      for (let r = 0; r < s.length; r++)
        for (let c = 0; c < s[r].length; c++)
          a[r * 16 + c] = cm[s[r][c]] ?? -1
      return a
    })(),
  },
  {
    name: '棋盘', size: 32,
    data: (() => {
      const a = new Array(1024).fill(-1)
      for (let r = 0; r < 32; r++)
        for (let c = 0; c < 32; c++)
          a[r * 32 + c] = (Math.floor(r / 4) + Math.floor(c / 4)) % 2 === 0 ? 0 : 4
      return a
    })(),
  },
  {
    name: '彩虹', size: 32,
    data: (() => {
      const a = new Array(1024).fill(-1)
      const cols = [5, 6, 2, 9, 11, 14, 16]
      for (let r = 0; r < 32; r++)
        for (let c = 0; c < 32; c++)
          a[r * 32 + c] = cols[Math.floor(r / (32 / cols.length))]
      return a
    })(),
  },
  {
    name: '同心圆', size: 32,
    data: (() => {
      const a = new Array(1024).fill(-1)
      const cols = [5, 6, 2, 9, 11, 14, 16, 4]
      for (let r = 0; r < 32; r++)
        for (let c = 0; c < 32; c++) {
          const d = Math.sqrt((r - 16) ** 2 + (c - 16) ** 2)
          a[r * 32 + c] = cols[Math.min(cols.length - 1, Math.floor(d / 2))]
        }
      return a
    })(),
  },
  {
    name: '大爱心', size: 32,
    data: (() => {
      const a = new Array(1024).fill(-1)
      for (let r = 0; r < 32; r++)
        for (let c = 0; c < 32; c++) {
          const x = (c - 16) / 14
          const y = (16 - r) / 14
          const val = Math.pow(x * x + y * y - 1, 3) - x * x * y * y * y
          if (val <= 0) {
            const dist = Math.sqrt(x * x + y * y)
            a[r * 32 + c] = dist > 0.75 ? 5 : 16
          }
        }
      return a
    })(),
  },
  {
    name: '渐变', size: 64,
    data: (() => {
      const a = new Array(4096).fill(-1)
      const cols = [0, 1, 2, 3, 4, 5, 6, 2, 9, 10, 11, 12, 13, 14, 16, 17]
      for (let r = 0; r < 64; r++)
        for (let c = 0; c < 64; c++) {
          const idx = Math.floor((r + c) / 8) % cols.length
          a[r * 64 + c] = cols[idx]
        }
      return a
    })(),
  },
  {
    name: '星空', size: 32,
    data: (() => {
      const a = new Array(1024).fill(11)
      const stars = [[5, 8], [12, 3], [20, 15], [3, 22], [25, 7], [15, 25], [8, 17], [28, 20], [10, 10], [22, 22]]
      for (let r = 0; r < 32; r++)
        for (let c = 0; c < 32; c++) {
          let isStar = false
          for (const [sr, sc] of stars) {
            const d = Math.sqrt((r - sr) ** 2 + (c - sc) ** 2)
            if (d < 1.5) { a[r * 32 + c] = 0; isStar = true; break }
            if (d < 2.5) { a[r * 32 + c] = 2; isStar = true; break }
          }
          if (!isStar && Math.random() > 0.85) a[r * 32 + c] = 1
        }
      return a
    })(),
  },
]

function makeBoard(gridSize: number): BoardState {
  return { gridSize, cells: new Array(gridSize * gridSize).fill(-1) }
}

// ==================== 组件 ====================
export default function PerlerBeadsCoop() {
  const [screen, setScreen] = useState<'menu' | 'game'>('menu')
  const [multiplayer, setMultiplayer] = useState(false)
  const [role, setRole] = useState<'host' | 'join' | null>(null)

  const [myName, setMyName] = useState(() => localStorage.getItem(NAME_KEY) || '')
  const [myId, setMyId] = useState('')
  const [myColor, setMyColor] = useState(PLAYER_COLORS[0])

  const [connStatus, setConnStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle')
  const [roomCode, setRoomCode] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [connError, setConnError] = useState('')

  const [gridSize, setGridSize] = useState(24)
  const [board, setBoard] = useState<BoardState | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [cursors, setCursors] = useState<Record<string, RemoteCursor>>({})
  const [chats, setChats] = useState<{ name: string; color: string; text: string }[]>([])
  const [chatInput, setChatInput] = useState('')

  const [activeColor, setActiveColor] = useState(5)
  const [tool, setTool] = useState<'place' | 'erase'>('place')
  const [customColors, setCustomColors] = useState<CustomColor[]>([])
  const [references, setReferences] = useState<RefImage[]>([])
  const [viewRef, setViewRef] = useState<number | null>(null)
  const [importPreview, setImportPreview] = useState<{
    image: string
    name: string
    gridSize: number
    editSize: number
    cells: number[]
    detected: boolean
    confidence: 'high' | 'low'
  } | null>(null)

  // refs
  const peerRef = useRef<Peer | null>(null)
  const connsRef = useRef<Map<string, DataConnection>>(new Map())
  const hostConnRef = useRef<DataConnection | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const importPreviewCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const isDrawingRef = useRef(false)
  const drawModeRef = useRef<'place' | 'erase'>('place')
  const activeColorRef = useRef(5)
  const batchOpsRef = useRef<{ row: number; col: number; color: number }[]>([])
  const lastSendRef = useRef(0)
  const nameRef = useRef(myName)
  const myIdRef = useRef('')
  const boardRef = useRef<BoardState | null>(null)
  const toolRef = useRef<'place' | 'erase'>('place')
  const playersRef = useRef<Player[]>([])
  const cursorsRef = useRef<Record<string, RemoteCursor>>({})
  const handleMsgRef = useRef<(fromId: string, data: Msg) => void>(() => {})
  const roleRef = useRef<'host' | 'join' | null>(null)
  const multiplayerRef = useRef(false)
  const customColorsRef = useRef<CustomColor[]>([])
  const referencesRef = useRef<RefImage[]>([])
  const allColorsRef = useRef<string[]>(BEAD_COLORS)
  const pendingColorRef = useRef<string | null>(null)
  const roomCodeRef = useRef('')
  const migratingRef = useRef(false)
  const welcomeReceivedRef = useRef(false)
  const becomeHostRef = useRef<() => void>(() => {})
  const reconnectToHostRef = useRef<(retryCount: number) => void>(() => {})

  useEffect(() => { nameRef.current = myName }, [myName])
  useEffect(() => { myIdRef.current = myId }, [myId])
  useEffect(() => { activeColorRef.current = activeColor }, [activeColor])
  useEffect(() => { toolRef.current = tool; drawModeRef.current = tool }, [tool])
  useEffect(() => { playersRef.current = players }, [players])
  useEffect(() => { roleRef.current = role }, [role])
  useEffect(() => { multiplayerRef.current = multiplayer }, [multiplayer])
  useEffect(() => {
    customColorsRef.current = customColors
    allColorsRef.current = [...BEAD_COLORS, ...customColors.map(c => c.hex)]
  }, [customColors])
  useEffect(() => { referencesRef.current = references }, [references])
  useEffect(() => { roomCodeRef.current = roomCode }, [roomCode])

  const allColors = useMemo(() => [...BEAD_COLORS, ...customColors.map(c => c.hex)], [customColors])
  const allNames = useMemo(() => [...BEAD_NAMES, ...customColors.map(c => c.name)], [customColors])

  // ==================== Canvas 渲染 ====================
  const render = useCallback(() => {
    const canvas = canvasRef.current
    const b = boardRef.current
    if (!canvas || !b) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width
    const cell = W / b.gridSize
    const gs = b.gridSize
    const colors = allColorsRef.current

    if (gs > 64) {
      // 中等网格：简化圆，无钉子/高光/边框
      ctx.fillStyle = '#16213e'
      ctx.fillRect(0, 0, W, W)
      const radius = cell * 0.42
      for (let r = 0; r < gs; r++) {
        const y = r * cell + cell / 2
        const rowBase = r * gs
        for (let c = 0; c < gs; c++) {
          const idx = b.cells[rowBase + c]
          if (idx < 0) continue
          ctx.beginPath()
          ctx.arc(c * cell + cell / 2, y, radius, 0, Math.PI * 2)
          ctx.fillStyle = colors[idx] ?? '#ff00ff'
          ctx.fill()
        }
      }
    } else {
      // 小网格：完整渲染（钉子+豆子+高光+边框）
      ctx.fillStyle = '#16213e'
      ctx.fillRect(0, 0, W, W)
      ctx.fillStyle = '#0f3460'
      for (let r = 0; r < gs; r++) {
        for (let c = 0; c < gs; c++) {
          ctx.beginPath()
          ctx.arc(c * cell + cell / 2, r * cell + cell / 2, cell * 0.08, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      for (let r = 0; r < gs; r++) {
        const y = r * cell + cell / 2
        const rowBase = r * gs
        for (let c = 0; c < gs; c++) {
          const idx = b.cells[rowBase + c]
          if (idx < 0) continue
          const x = c * cell + cell / 2
          const radius = cell * 0.42
          ctx.beginPath()
          ctx.arc(x, y, radius, 0, Math.PI * 2)
          ctx.fillStyle = colors[idx] ?? '#ff00ff'
          ctx.fill()
          ctx.beginPath()
          ctx.arc(x - radius * 0.3, y - radius * 0.3, radius * 0.3, 0, Math.PI * 2)
          ctx.fillStyle = 'rgba(255,255,255,0.35)'
          ctx.fill()
          ctx.beginPath()
          ctx.arc(x, y, radius, 0, Math.PI * 2)
          ctx.strokeStyle = 'rgba(0,0,0,0.15)'
          ctx.lineWidth = 1
          ctx.stroke()
        }
      }
    }

    // 远程光标
    Object.values(cursorsRef.current).forEach(cur => {
      if (cur.row < 0 || cur.col < 0) return
      const x = cur.col * cell
      const y = cur.row * cell
      ctx.strokeStyle = cur.color
      ctx.lineWidth = 2.5
      ctx.strokeRect(x + 1, y + 1, cell - 2, cell - 2)
      if (gs <= 64) {
        ctx.fillStyle = cur.color
        ctx.font = `bold ${Math.max(9, cell * 0.35)}px sans-serif`
        const label = cur.name.slice(0, 6)
        const tw = ctx.measureText(label).width
        ctx.fillRect(x + 2, y - cell * 0.4, tw + 6, cell * 0.35)
        ctx.fillStyle = '#fff'
        ctx.fillText(label, x + 5, y - cell * 0.13)
      }
    })
  }, [])

  useEffect(() => {
    boardRef.current = board
    render()
  }, [board, render])

  // cursor 更新仅小网格触发重渲染，大网格跳过避免卡顿
  useEffect(() => {
    cursorsRef.current = cursors
    if (boardRef.current) render()
  }, [cursors, render])

  // 单格重绘（大网格拖拽时跳过全量渲染）
  const drawSingleCell = useCallback((row: number, col: number, colorIdx: number) => {
    const canvas = canvasRef.current
    const b = boardRef.current
    if (!canvas || !b) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = canvas.width
    const cell = W / b.gridSize
    const gs = b.gridSize
    const x = col * cell
    const y = row * cell
    if (colorIdx < 0) {
      ctx.fillStyle = '#16213e'
      ctx.fillRect(x, y, cell, cell)
      if (gs <= 64) {
        ctx.fillStyle = '#0f3460'
        ctx.beginPath()
        ctx.arc(x + cell / 2, y + cell / 2, cell * 0.08, 0, Math.PI * 2)
        ctx.fill()
      }
    } else {
      const color = allColorsRef.current[colorIdx] ?? '#ff00ff'
      ctx.fillStyle = '#16213e'
      ctx.fillRect(x, y, cell, cell)
      const radius = cell * 0.42
      ctx.beginPath()
      ctx.arc(x + cell / 2, y + cell / 2, radius, 0, Math.PI * 2)
      ctx.fillStyle = color
      ctx.fill()
      if (gs <= 64) {
        ctx.beginPath()
        ctx.arc(x + cell / 2 - radius * 0.3, y + cell / 2 - radius * 0.3, radius * 0.3, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(255,255,255,0.35)'
        ctx.fill()
        ctx.beginPath()
        ctx.arc(x + cell / 2, y + cell / 2, radius, 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(0,0,0,0.15)'
        ctx.lineWidth = 1
        ctx.stroke()
      }
    }
  }, [])

  // ==================== 联机 ====================
  const broadcast = useCallback((msg: Msg) => {
    if (roleRef.current === 'host') {
      connsRef.current.forEach(c => { try { c.send(msg) } catch {} })
    } else if (hostConnRef.current) {
      try { hostConnRef.current.send(msg) } catch {}
    }
  }, [])

  const relayToOthers = useCallback((fromId: string, msg: Msg) => {
    connsRef.current.forEach((c, id) => { if (id !== fromId) { try { c.send(msg) } catch {} } })
  }, [])

  const applyOps = useCallback((ops: { row: number; col: number; color: number }[]) => {
    const b = boardRef.current
    if (!b) return
    const cells = b.cells.slice()
    for (const op of ops) {
      if (op.row >= 0 && op.row < b.gridSize && op.col >= 0 && op.col < b.gridSize)
        cells[op.row * b.gridSize + op.col] = op.color
    }
    const nb = { ...b, cells }
    boardRef.current = nb
    setBoard(nb)
  }, [])

  const handleMsg = useCallback((fromId: string, data: Msg) => {
    const isHost = roleRef.current === 'host'
    switch (data.t) {
      case 'hello': {
        if (!isHost) return
        const existing = playersRef.current.find(p => p.id === fromId)
        let newPlayers: Player[]
        let color: string
        if (existing) {
          // 玩家重连（房主迁移后），不重复添加
          newPlayers = playersRef.current
          color = existing.color
        } else {
          color = PLAYER_COLORS[playersRef.current.length % PLAYER_COLORS.length]
          const np: Player = { id: fromId, name: data.name || '匿名', color, isHost: false }
          newPlayers = [...playersRef.current, np]
          setPlayers(newPlayers)
          playersRef.current = newPlayers
          relayToOthers(fromId, { t: 'players', players: newPlayers })
        }
        const conn = connsRef.current.get(fromId)
        if (conn && boardRef.current) {
          conn.send({ t: 'welcome', gridSize: boardRef.current.gridSize, cellsRLE: rleEncode(boardRef.current.cells), players: newPlayers, yourColor: color, customColors: customColorsRef.current, refCount: referencesRef.current.length } as Msg)
        }
        break
      }
      case 'welcome': {
        welcomeReceivedRef.current = true
        const board = { gridSize: data.gridSize, cells: rleDecode(data.cellsRLE) }
        setBoard(board)
        boardRef.current = board
        setPlayers(data.players)
        playersRef.current = data.players
        setMyColor(data.yourColor)
        const cc = data.customColors || []
        setCustomColors(cc)
        customColorsRef.current = cc
        allColorsRef.current = [...BEAD_COLORS, ...cc.map(c => c.hex)]
        setReferences([])
        referencesRef.current = []
        setConnStatus('connected')
        // 分张请求参考图，避免单个 welcome 消息过大
        for (let i = 0; i < data.refCount; i++) {
          broadcast({ t: 'requestref', index: i })
        }
        break
      }
      case 'players': {
        setPlayers(data.players)
        playersRef.current = data.players
        break
      }
      case 'batch': {
        const ops: { row: number; col: number; color: number }[] = []
        for (let i = 0; i < data.ops.length; i += 3) {
          ops.push({ row: data.ops[i], col: data.ops[i + 1], color: data.ops[i + 2] })
        }
        applyOps(ops)
        if (isHost) relayToOthers(fromId, data)
        break
      }
      case 'clear': {
        const b = boardRef.current
        if (b) {
          const nb = { ...b, cells: new Array(b.cells.length).fill(-1) }
          boardRef.current = nb
          setBoard(nb)
        }
        if (isHost) relayToOthers(fromId, data)
        break
      }
      case 'cursor': {
        if (data.by !== myIdRef.current) {
          const b = boardRef.current
          if (b) {
            const player = playersRef.current.find(p => p.id === data.by)
            setCursors(prev => ({ ...prev, [data.by]: { id: data.by, name: player?.name || '?', color: player?.color || '#fff', row: data.row, col: data.col } }))
          }
        }
        if (isHost) relayToOthers(fromId, data)
        break
      }
      case 'chat': {
        setChats(prev => [...prev.slice(-50), { name: data.name, color: data.color, text: data.text }])
        if (isHost) relayToOthers(fromId, data)
        break
      }
      case 'newboard': {
        const board = { gridSize: data.gridSize, cells: rleDecode(data.cellsRLE) }
        setBoard(board)
        boardRef.current = board
        break
      }
      case 'palette': {
        setCustomColors(data.customColors)
        customColorsRef.current = data.customColors
        allColorsRef.current = [...BEAD_COLORS, ...data.customColors.map(c => c.hex)]
        if (activeColorRef.current >= BEAD_COLORS.length + data.customColors.length) {
          setActiveColor(0)
        }
        if (pendingColorRef.current) {
          const idx = BEAD_COLORS.length + data.customColors.findIndex(c => c.hex.toLowerCase() === pendingColorRef.current!.toLowerCase())
          if (idx >= BEAD_COLORS.length) { setActiveColor(idx); setTool('place') }
          pendingColorRef.current = null
        }
        break
      }
      case 'addcolor': {
        if (!isHost) return
        const exists = customColorsRef.current.some(c => c.hex.toLowerCase() === data.hex.toLowerCase())
        if (!exists) {
          const nc = [...customColorsRef.current, { hex: data.hex, name: data.name }]
          setCustomColors(nc)
          customColorsRef.current = nc
          allColorsRef.current = [...BEAD_COLORS, ...nc.map(c => c.hex)]
          broadcast({ t: 'palette', customColors: nc })
        }
        break
      }
      case 'delcolor': {
        if (!isHost) return
        const nc = customColorsRef.current.filter((_, i) => i !== data.index)
        setCustomColors(nc)
        customColorsRef.current = nc
        allColorsRef.current = [...BEAD_COLORS, ...nc.map(c => c.hex)]
        broadcast({ t: 'palette', customColors: nc })
        break
      }
      case 'addref': {
        if (referencesRef.current.length >= 3) return
        if (referencesRef.current.some(r => r.image === data.image && r.name === data.name)) return
        const nr = [...referencesRef.current, { image: data.image, name: data.name, by: data.by }]
        setReferences(nr)
        referencesRef.current = nr
        if (isHost) relayToOthers(fromId, data)
        break
      }
      case 'delref': {
        if (data.index < 0 || data.index >= referencesRef.current.length) return
        const nr = referencesRef.current.filter((_, i) => i !== data.index)
        setReferences(nr)
        referencesRef.current = nr
        if (isHost) relayToOthers(fromId, data)
        break
      }
      case 'requestref': {
        if (!isHost) return
        const ref = referencesRef.current[data.index]
        if (ref) {
          const conn = connsRef.current.get(fromId)
          if (conn) conn.send({ t: 'addref', image: ref.image, name: ref.name, by: ref.by } as Msg)
        }
        break
      }
      case 'hostmigrate': {
        migratingRef.current = true
        if (data.newHostId === myIdRef.current) {
          // 我成为新房主
          becomeHostRef.current()
        } else {
          // 等待新房主上线后重连
          setConnStatus('connecting')
          setConnError('')
          setTimeout(() => reconnectToHostRef.current(0), 3000)
        }
        break
      }
    }
  }, [applyOps, relayToOthers, broadcast])

  useEffect(() => { handleMsgRef.current = handleMsg }, [handleMsg])

  // ==================== 房主迁移 ====================
  const becomeHost = useCallback(() => {
    // 销毁当前 peer（随机 ID）
    peerRef.current?.destroy()
    peerRef.current = null
    hostConnRef.current = null
    connsRef.current.clear()

    // 切换角色
    setRole('host')
    roleRef.current = 'host'

    // 更新玩家列表：移除旧房主，标记自己为房主
    const oldMyId = myIdRef.current
    const updatedPlayers = playersRef.current
      .filter(p => !p.isHost)
      .map(p => p.id === oldMyId ? { ...p, isHost: true } : p)
    playersRef.current = updatedPlayers

    setConnStatus('connecting')

    const code = roomCodeRef.current
    if (!code) {
      setConnStatus('error')
      setConnError('房间码丢失，无法迁移房主')
      return
    }

    // 用房间码注册新 peer，允许新玩家通过房间码加入
    const tryCreatePeer = (retryCount: number) => {
      const peer = new Peer(PEER_PREFIX + code, { debug: 1 })
      peerRef.current = peer
      peer.on('open', (id) => {
        setMyId(id)
        myIdRef.current = id
        // 更新自己的 player 条目（ID 已变）
        const finalPlayers = updatedPlayers.map(p =>
          p.id === oldMyId ? { ...p, id } : p
        )
        setPlayers(finalPlayers)
        playersRef.current = finalPlayers
        setConnStatus('connected')
        migratingRef.current = false
      })
      peer.on('connection', (conn) => {
        conn.on('open', () => { connsRef.current.set(conn.peer, conn) })
        conn.on('data', (data) => handleMsgRef.current(conn.peer, data as Msg))
        conn.on('close', () => {
          connsRef.current.delete(conn.peer)
          setPlayers(prev => {
            const np = prev.filter(p => p.id !== conn.peer)
            playersRef.current = np
            relayToOthers(conn.peer, { t: 'players', players: np })
            return np
          })
          setCursors(prev => { const n = { ...prev }; delete n[conn.peer]; return n })
        })
      })
      peer.on('error', (err) => {
        if ((String(err).includes('unavailable-id') || String(err).includes('taken')) && retryCount < 5) {
          // 旧房主的 ID 尚未释放，重试
          peer.destroy()
          peerRef.current = null
          setTimeout(() => tryCreatePeer(retryCount + 1), 2000)
        } else {
          setConnError(String(err))
          setConnStatus('error')
          migratingRef.current = false
        }
      })
    }
    tryCreatePeer(0)
  }, [relayToOthers])

  const reconnectToHost = useCallback((retryCount: number) => {
    if (retryCount > 8) {
      setConnStatus('error')
      setConnError('无法连接到新房主，请退出重试')
      migratingRef.current = false
      return
    }
    const code = roomCodeRef.current
    if (!code || !peerRef.current) {
      setConnStatus('error')
      setConnError('无法重连')
      migratingRef.current = false
      return
    }
    setConnStatus('connecting')
    welcomeReceivedRef.current = false
    const conn = peerRef.current.connect(PEER_PREFIX + code, { reliable: true })
    hostConnRef.current = conn
    conn.on('open', () => {
      conn.send({ t: 'hello', name: nameRef.current } as Msg)
    })
    conn.on('data', (data) => handleMsgRef.current('host', data as Msg))
    conn.on('close', () => {
      if (welcomeReceivedRef.current) {
        // 已连接后断开，尝试再次迁移
        if (migratingRef.current) return
        const joiners = playersRef.current.filter(p => !p.isHost)
        if (joiners.length > 0 && joiners[0].id === myIdRef.current) {
          becomeHostRef.current()
        } else if (joiners.length > 0) {
          setConnStatus('connecting')
          setConnError('')
          setTimeout(() => reconnectToHostRef.current(0), 3000)
        } else {
          setConnStatus('error')
          setConnError('与房主的连接已断开')
          migratingRef.current = false
        }
      } else {
        // 尚未收到 welcome，重试
        setTimeout(() => reconnectToHostRef.current(retryCount + 1), 3000)
      }
    })
    conn.on('error', () => {
      if (!welcomeReceivedRef.current) {
        setTimeout(() => reconnectToHostRef.current(retryCount + 1), 3000)
      }
    })
  }, [])

  useEffect(() => { becomeHostRef.current = becomeHost }, [becomeHost])
  useEffect(() => { reconnectToHostRef.current = reconnectToHost }, [reconnectToHost])

  // ==================== 创建房间 ====================
  const createRoom = useCallback(() => {
    const name = myName.trim() || '房主'
    localStorage.setItem(NAME_KEY, name)
    const code = randCode()
    setRoomCode(code)
    roomCodeRef.current = code
    setRole('host')
    roleRef.current = 'host'
    setMultiplayer(true)
    multiplayerRef.current = true
    setConnStatus('connecting')
    setConnError('')
    const initBoard = makeBoard(gridSize)
    setBoard(initBoard)
    boardRef.current = initBoard
    setCustomColors([])
    customColorsRef.current = []
    allColorsRef.current = [...BEAD_COLORS]
    setReferences([])
    referencesRef.current = []
    const peer = new Peer(PEER_PREFIX + code, { debug: 1 })
    peerRef.current = peer
    peer.on('open', (id) => {
      setMyId(id)
      myIdRef.current = id
      setMyColor(PLAYER_COLORS[0])
      const ps: Player[] = [{ id, name, color: PLAYER_COLORS[0], isHost: true }]
      setPlayers(ps)
      playersRef.current = ps
      setConnStatus('connected')
      setScreen('game')
    })
    peer.on('connection', (conn) => {
      conn.on('open', () => { connsRef.current.set(conn.peer, conn) })
      conn.on('data', (data) => handleMsgRef.current(conn.peer, data as Msg))
      conn.on('close', () => {
        connsRef.current.delete(conn.peer)
        setPlayers(prev => {
          const np = prev.filter(p => p.id !== conn.peer)
          playersRef.current = np
          relayToOthers(conn.peer, { t: 'players', players: np })
          return np
        })
        setCursors(prev => { const n = { ...prev }; delete n[conn.peer]; return n })
      })
    })
    peer.on('error', (err) => {
      if (String(err).includes('unavailable-id') || String(err).includes('taken')) {
        setConnError('房间码被占用，重试中...')
        peer.destroy()
        setTimeout(createRoom, 300)
      } else {
        setConnError(String(err))
        setConnStatus('error')
      }
    })
  }, [myName, gridSize, relayToOthers])

  // ==================== 加入房间 ====================
  const joinRoom = useCallback(() => {
    const name = myName.trim() || '玩家'
    localStorage.setItem(NAME_KEY, name)
    const code = joinCode.trim().toUpperCase()
    if (code.length !== 4) { setConnError('请输入 4 位房间码'); return }
    setRole('join')
    roleRef.current = 'join'
    setMultiplayer(true)
    multiplayerRef.current = true
    setConnStatus('connecting')
    setConnError('')
    setRoomCode(code)
    roomCodeRef.current = code
    welcomeReceivedRef.current = false
    migratingRef.current = false
    const peer = new Peer({ debug: 1 })
    peerRef.current = peer
    peer.on('open', (id) => {
      setMyId(id)
      myIdRef.current = id
      const conn = peer.connect(PEER_PREFIX + code, { reliable: true })
      hostConnRef.current = conn
      conn.on('open', () => {
        conn.send({ t: 'hello', name } as Msg)
        setScreen('game')
      })
      conn.on('data', (data) => handleMsgRef.current('host', data as Msg))
      conn.on('close', () => {
        if (migratingRef.current) return // 房主迁移中，由 hostmigrate 处理
        if (welcomeReceivedRef.current) {
          // 已连接后断开，尝试房主迁移
          const joiners = playersRef.current.filter(p => !p.isHost)
          if (joiners.length > 0 && joiners[0].id === myIdRef.current) {
            // 我是最早加入的玩家，成为新房主
            becomeHostRef.current()
          } else if (joiners.length > 0) {
            // 等待新房主上线后重连
            setConnStatus('connecting')
            setConnError('')
            setTimeout(() => reconnectToHostRef.current(0), 3000)
          } else {
            setConnStatus('error')
            setConnError('与房主的连接已断开')
          }
        } else {
          setConnStatus('error')
          setConnError('与房主的连接已断开')
        }
      })
    })
    peer.on('error', (err) => {
      setConnError(String(err).includes('could not') ? '找不到该房间，请检查房间码' : String(err))
      setConnStatus('error')
    })
  }, [myName, joinCode])

  // ==================== 单人 ====================
  const startSingle = useCallback(() => {
    const name = myName.trim() || '玩家1'
    localStorage.setItem(NAME_KEY, name)
    setRole(null)
    setMultiplayer(false)
    setMyId('single')
    myIdRef.current = 'single'
    setMyColor(PLAYER_COLORS[0])
    const ps: Player[] = [{ id: 'single', name, color: PLAYER_COLORS[0], isHost: true }]
    setPlayers(ps)
    playersRef.current = ps
    const b = makeBoard(gridSize)
    setBoard(b)
    boardRef.current = b
    setConnStatus('connected')
    setScreen('game')
  }, [myName, gridSize])

  // ==================== 操作 ====================
  const clearBoard = useCallback(() => {
    const b = boardRef.current
    if (!b) return
    const nb = { ...b, cells: new Array(b.cells.length).fill(-1) }
    boardRef.current = nb
    setBoard(nb)
    if (multiplayerRef.current) broadcast({ t: 'clear', by: myIdRef.current })
  }, [broadcast])

  const loadPreset = useCallback((preset: typeof PRESETS[0]) => {
    const b: BoardState = { gridSize: preset.size, cells: [...preset.data] }
    setBoard(b)
    boardRef.current = b
    setGridSize(preset.size)
    if (multiplayerRef.current && roleRef.current === 'host') broadcast({ t: 'newboard', gridSize: b.gridSize, cellsRLE: rleEncode(b.cells) })
  }, [broadcast])

  const changeSize = useCallback((size: number) => {
    const b = makeBoard(size)
    setBoard(b)
    boardRef.current = b
    setGridSize(size)
    if (multiplayerRef.current && roleRef.current === 'host') broadcast({ t: 'newboard', gridSize: b.gridSize, cellsRLE: rleEncode(b.cells) })
  }, [broadcast])

  const exportPNG = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `perler-${Date.now()}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }, [])

  const leave = useCallback(() => {
    const doCleanup = () => {
      peerRef.current?.destroy()
      peerRef.current = null
      connsRef.current.clear()
      hostConnRef.current = null
      setScreen('menu')
      setConnStatus('idle')
      setRole(null)
      roleRef.current = null
      setMultiplayer(false)
      multiplayerRef.current = false
      setPlayers([])
      playersRef.current = []
      setCursors({})
      setChats([])
      setBoard(null)
      boardRef.current = null
      setCustomColors([])
      customColorsRef.current = []
      allColorsRef.current = [...BEAD_COLORS]
      setReferences([])
      referencesRef.current = []
      setViewRef(null)
      pendingColorRef.current = null
      setRoomCode('')
      roomCodeRef.current = ''
      setJoinCode('')
      setConnError('')
      migratingRef.current = false
      welcomeReceivedRef.current = false
    }

    // 房主退出且有其他玩家：转移房主给最先进来的在线玩家
    if (roleRef.current === 'host' && connsRef.current.size > 0) {
      const joiners = playersRef.current.filter(p => !p.isHost)
      if (joiners.length > 0) {
        const newHost = joiners[0]
        broadcast({ t: 'hostmigrate', newHostId: newHost.id })
        setTimeout(doCleanup, 500)
        return
      }
    }
    doCleanup()
  }, [broadcast])

  useEffect(() => () => { peerRef.current?.destroy() }, [])

  // ==================== 本地保存 / 导出 / 导入 ====================
  const saveProgress = useCallback(() => {
    if (!board) return
    try {
      const saves = JSON.parse(localStorage.getItem(SAVE_KEY) || '[]')
      const name = `${board.gridSize}x${board.gridSize} ${new Date().toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}`
      saves.unshift({ name, gridSize: board.gridSize, cells: board.cells, customColors, timestamp: Date.now() })
      if (saves.length > 20) saves.length = 20
      localStorage.setItem(SAVE_KEY, JSON.stringify(saves))
    } catch (e) {
      console.error('Save failed:', e)
    }
  }, [board, customColors])

  const exportJSON = useCallback(() => {
    if (!board) return
    const data = { gridSize: board.gridSize, cells: board.cells, customColors, version: 1 }
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.download = `perler-${board.gridSize}x${board.gridSize}-${Date.now()}.json`
    link.href = url
    link.click()
    URL.revokeObjectURL(url)
  }, [board, customColors])

  const importJSON = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string)
        if (data.gridSize && Array.isArray(data.cells)) {
          const b: BoardState = { gridSize: data.gridSize, cells: data.cells }
          setBoard(b)
          boardRef.current = b
          setGridSize(data.gridSize)
          if (data.customColors) {
            setCustomColors(data.customColors)
            customColorsRef.current = data.customColors
            allColorsRef.current = [...BEAD_COLORS, ...data.customColors.map((c: CustomColor) => c.hex)]
          }
          if (multiplayerRef.current && roleRef.current === 'host') {
            broadcast({ t: 'newboard', gridSize: b.gridSize, cellsRLE: rleEncode(b.cells) })
          }
        }
      } catch (e) {
        console.error('Import failed:', e)
      }
    }
    reader.readAsText(file)
  }, [broadcast])

  const loadSave = useCallback((save: { gridSize: number; cells: number[]; customColors?: CustomColor[] }) => {
    const b: BoardState = { gridSize: save.gridSize, cells: save.cells }
    setBoard(b)
    boardRef.current = b
    setGridSize(save.gridSize)
    if (save.customColors) {
      setCustomColors(save.customColors)
      customColorsRef.current = save.customColors
      allColorsRef.current = [...BEAD_COLORS, ...save.customColors.map(c => c.hex)]
    }
    setScreen('game')
    setConnStatus('connected')
    setRole(null)
    roleRef.current = null
    setMultiplayer(false)
    multiplayerRef.current = false
    setMyId('single')
    myIdRef.current = 'single'
    setMyColor(PLAYER_COLORS[0])
    const name = myName.trim() || '玩家1'
    const ps: Player[] = [{ id: 'single', name, color: PLAYER_COLORS[0], isHost: true }]
    setPlayers(ps)
    playersRef.current = ps
  }, [myName])

  const deleteSave = useCallback((index: number) => {
    try {
      const saves = JSON.parse(localStorage.getItem(SAVE_KEY) || '[]')
      saves.splice(index, 1)
      localStorage.setItem(SAVE_KEY, JSON.stringify(saves))
      // 触发刷新
      setSavesVersion(v => v + 1)
    } catch (e) {
      console.error('Delete save failed:', e)
    }
  }, [])

  // 自动保存（30 秒）
  const [savesVersion, setSavesVersion] = useState(0)
  useEffect(() => {
    if (screen !== 'game' || !board) return
    const interval = setInterval(() => {
      try {
        localStorage.setItem(AUTOSAVE_KEY, JSON.stringify({
          gridSize: board.gridSize,
          cells: board.cells,
          customColors,
          timestamp: Date.now(),
        }))
      } catch {}
    }, 30000)
    return () => clearInterval(interval)
  }, [screen, board, customColors])

  // ==================== 自定义颜色 ====================
  const addCustomColor = useCallback((hex: string) => {
    const name = hex.toUpperCase()
    const exists = customColorsRef.current.some(c => c.hex.toLowerCase() === hex.toLowerCase())
    if (multiplayerRef.current && roleRef.current !== 'host') {
      if (!exists) pendingColorRef.current = hex
      broadcast({ t: 'addcolor', hex, name })
      return
    }
    if (!exists) {
      const newIdx = BEAD_COLORS.length + customColorsRef.current.length
      const nc = [...customColorsRef.current, { hex, name }]
      setCustomColors(nc)
      customColorsRef.current = nc
      allColorsRef.current = [...BEAD_COLORS, ...nc.map(c => c.hex)]
      setActiveColor(newIdx)
      setTool('place')
      if (multiplayerRef.current) broadcast({ t: 'palette', customColors: nc })
    } else {
      const idx = BEAD_COLORS.length + customColorsRef.current.findIndex(c => c.hex.toLowerCase() === hex.toLowerCase())
      setActiveColor(idx)
      setTool('place')
    }
  }, [broadcast])

  const removeCustomColor = useCallback((index: number) => {
    if (multiplayerRef.current && roleRef.current !== 'host') {
      broadcast({ t: 'delcolor', index })
      return
    }
    const nc = customColorsRef.current.filter((_, i) => i !== index)
    setCustomColors(nc)
    customColorsRef.current = nc
    allColorsRef.current = [...BEAD_COLORS, ...nc.map(c => c.hex)]
    if (multiplayerRef.current) broadcast({ t: 'palette', customColors: nc })
    const actualIdx = BEAD_COLORS.length + index
    if (activeColorRef.current >= actualIdx) {
      setActiveColor(Math.max(0, activeColorRef.current - 1))
    }
  }, [broadcast])

  // ==================== 参考图纸 ====================
  const uploadReference = useCallback(async (file: File) => {
    if (referencesRef.current.length >= 3) return
    try {
      const image = await compressImage(file)
      const fname = file.name.replace(/\.[^.]+$/, '').slice(0, 20) || '参考图'
      const nr = [...referencesRef.current, { image, name: fname, by: nameRef.current }]
      setReferences(nr)
      referencesRef.current = nr
      if (multiplayerRef.current) broadcast({ t: 'addref', image, name: fname, by: nameRef.current })
    } catch (e) {
      console.error('Image compress failed:', e)
    }
  }, [broadcast])

  const deleteReference = useCallback((index: number) => {
    const nr = referencesRef.current.filter((_, i) => i !== index)
    setReferences(nr)
    referencesRef.current = nr
    if (multiplayerRef.current) broadcast({ t: 'delref', index })
    if (viewRef !== null && viewRef >= nr.length) setViewRef(null)
  }, [broadcast, viewRef])

  const startImportReference = useCallback(async (image: string, name: string) => {
    try {
      const palette = allColorsRef.current.length > 0 ? allColorsRef.current : [...BEAD_COLORS]
      const result = await imageToBeadBoard(image, palette, 256)
      setImportPreview({ image, name, gridSize: result.gridSize, editSize: result.gridSize, cells: result.cells, detected: result.detected, confidence: result.confidence })
    } catch (e) {
      console.error('Import reference failed:', e)
      alert('导入失败：' + (e instanceof Error ? e.message : '未知错误'))
    }
  }, [])

  const applyImport = useCallback(() => {
    if (!importPreview) return
    const b: BoardState = { gridSize: importPreview.gridSize, cells: importPreview.cells }
    setBoard(b)
    boardRef.current = b
    setGridSize(importPreview.gridSize)
    if (multiplayerRef.current && roleRef.current === 'host') {
      broadcast({ t: 'newboard', gridSize: b.gridSize, cellsRLE: rleEncode(b.cells) })
    }
    setImportPreview(null)
    setViewRef(null)
  }, [broadcast, importPreview])

  const drawImportPreview = useCallback(() => {
    const canvas = importPreviewCanvasRef.current
    const p = importPreview
    if (!canvas || !p) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const size = 280
    canvas.width = size
    canvas.height = size
    const cell = size / p.gridSize
    ctx.fillStyle = '#16213e'
    ctx.fillRect(0, 0, size, size)
    const palette = allColorsRef.current
    for (let r = 0; r < p.gridSize; r++) {
      for (let c = 0; c < p.gridSize; c++) {
        const idx = p.cells[r * p.gridSize + c]
        if (idx < 0) continue
        ctx.fillStyle = palette[idx] ?? '#ff00ff'
        ctx.fillRect(c * cell, r * cell, cell + 0.5, cell + 0.5)
      }
    }
  }, [importPreview])

  const regenerateImportPreview = useCallback(async () => {
    if (!importPreview) return
    const size = Math.max(4, Math.min(256, Math.round(importPreview.editSize)))
    if (size === importPreview.gridSize) return
    try {
      const result = await imageToBeadBoard(importPreview.image, allColorsRef.current, 256, size)
      setImportPreview({ ...importPreview, gridSize: result.gridSize, cells: result.cells, detected: false, confidence: 'low' })
    } catch (e) {
      console.error('Regenerate import preview failed:', e)
    }
  }, [importPreview])

  useEffect(() => {
    drawImportPreview()
  }, [importPreview, drawImportPreview])

  // ==================== Canvas 交互 ====================
  const getCell = (e: React.PointerEvent): { row: number; col: number } | null => {
    const canvas = canvasRef.current
    const b = boardRef.current
    if (!canvas || !b) return null
    const rect = canvas.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height
    const cell = canvas.width / b.gridSize
    const col = Math.floor(x / cell)
    const row = Math.floor(y / cell)
    if (row < 0 || row >= b.gridSize || col < 0 || col >= b.gridSize) return null
    return { row, col }
  }

  const placeCell = (row: number, col: number) => {
    const b = boardRef.current
    if (!b) return
    const color = drawModeRef.current === 'erase' ? -1 : activeColorRef.current
    const idx = row * b.gridSize + col
    if (b.cells[idx] === color) return
    // 大网格拖拽：直接突变 + 单格重绘，跳过全量 React 状态更新
    if (b.gridSize > 128 && isDrawingRef.current) {
      b.cells[idx] = color
      drawSingleCell(row, col, color)
      batchOpsRef.current.push({ row, col, color })
      return
    }
    applyOps([{ row, col, color }])
    batchOpsRef.current.push({ row, col, color })
  }

  const onCanvasDown = (e: React.PointerEvent) => {
    e.preventDefault()
    const cell = getCell(e)
    if (!cell) return
    isDrawingRef.current = true
    drawModeRef.current = e.button === 2 || toolRef.current === 'erase' ? 'erase' : 'place'
    placeCell(cell.row, cell.col)
  }

  const onCanvasMove = (e: React.PointerEvent) => {
    const cell = getCell(e)
    if (!cell) return
    // 大网格不发 cursor，避免接收方全量重渲染卡顿
    if (multiplayerRef.current && boardRef.current && Date.now() - lastSendRef.current > 100) {
      lastSendRef.current = Date.now()
      broadcast({ t: 'cursor', row: cell.row, col: cell.col, by: myIdRef.current })
    }
    if (!isDrawingRef.current) return
    placeCell(cell.row, cell.col)
  }

  const onCanvasUp = () => {
    if (!isDrawingRef.current) return
    isDrawingRef.current = false
    const b = boardRef.current
    if (b && b.gridSize > 128 && batchOpsRef.current.length > 0) {
      const nb = { ...b, cells: b.cells.slice() }
      boardRef.current = nb
      setBoard(nb)
    }
    if (multiplayerRef.current && batchOpsRef.current.length > 0) {
      const flatOps: number[] = []
      for (const op of batchOpsRef.current) {
        flatOps.push(op.row, op.col, op.color)
      }
      broadcast({ t: 'batch', ops: flatOps, by: myIdRef.current })
      batchOpsRef.current = []
    } else if (batchOpsRef.current.length > 0) {
      batchOpsRef.current = []
    }
  }

  const sendChat = () => {
    const text = chatInput.trim()
    if (!text) return
    setChats(prev => [...prev.slice(-50), { name: myName || '我', color: myColor, text }])
    if (multiplayerRef.current) broadcast({ t: 'chat', name: myName || '玩家', color: myColor, text })
    setChatInput('')
  }

  const filledCount = useMemo(() => board ? board.cells.reduce((acc, c) => acc + (c >= 0 ? 1 : 0), 0) : 0, [board])
  const totalCells = board ? board.cells.length : 0
  const pct = totalCells ? Math.round((filledCount / totalCells) * 100) : 0

  const savedProjects = useMemo(() => {
    try {
      void savesVersion // 触发刷新
      return JSON.parse(localStorage.getItem(SAVE_KEY) || '[]')
    } catch { return [] }
  }, [savesVersion])

  const autoSave = useMemo(() => {
    try {
      void savesVersion
      return JSON.parse(localStorage.getItem(AUTOSAVE_KEY) || 'null')
    } catch { return null }
  }, [savesVersion])

  // ==================== 菜单 ====================
  if (screen === 'menu') {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-400 to-rose-600 mb-4 shadow-lg shadow-pink-500/30">
              <Grid3x3 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-primary mb-2">拼豆联机</h1>
            <p className="text-muted">在线拼豆 · 多人实时创作 · P2P 无需服务器</p>
          </div>

          <div className="bg-secondary border border-primary rounded-2xl p-6 space-y-4 shadow-xl">
            <div>
              <label className="text-sm text-muted mb-1.5 block">你的昵称</label>
              <input
                value={myName}
                onChange={e => setMyName(e.target.value)}
                placeholder="输入昵称"
                maxLength={12}
                className="w-full px-4 py-2.5 rounded-xl bg-tertiary border border-primary text-primary text-sm focus:outline-none focus:border-pink-500"
              />
            </div>

            <div>
              <label className="text-sm text-muted mb-1.5 block">画板尺寸</label>
              <div className="flex flex-wrap gap-2">
                {BOARD_SIZES.map(s => (
                  <button
                    key={s.size}
                    onClick={() => setGridSize(s.size)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${gridSize === s.size
                      ? 'bg-pink-500 text-white' : 'bg-tertiary text-muted hover:text-primary'}`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="pt-2 space-y-2">
              <button
                onClick={startSingle}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 text-white font-bold hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
              >
                <UserIcon className="w-5 h-5" /> 单人创作
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={createRoom}
                  className="py-3 rounded-xl bg-blue-500 text-white font-bold hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Wifi className="w-4 h-4" /> 创建房间
                </button>
                <div className="flex gap-1">
                  <input
                    value={joinCode}
                    onChange={e => setJoinCode(e.target.value.toUpperCase().slice(0, 4))}
                    placeholder="房间码"
                    className="w-20 px-2 py-3 rounded-xl bg-tertiary border border-primary text-primary text-center font-mono text-sm uppercase focus:outline-none focus:border-pink-500"
                  />
                  <button
                    onClick={joinRoom}
                    className="flex-1 py-3 rounded-xl bg-violet-500 text-white font-bold hover:bg-violet-600 transition-colors flex items-center justify-center gap-1"
                  >
                    <Users className="w-4 h-4" /> 加入
                  </button>
                </div>
              </div>
            </div>

            {connStatus === 'connecting' && (
              <div className="text-center text-sm text-amber-500 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" /> 连接中...
              </div>
            )}
            {connError && (
              <div className="text-center text-sm text-red-500">{connError}</div>
            )}
          </div>

          {/* 自动保存恢复 */}
          {autoSave && (
            <div className="mt-3 bg-secondary border border-primary rounded-2xl p-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <Save className="w-4 h-4 text-emerald-500 shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm text-primary font-medium truncate">自动保存 · {autoSave.gridSize}x{autoSave.gridSize}</div>
                  <div className="text-xs text-muted">{new Date(autoSave.timestamp).toLocaleString('zh-CN')}</div>
                </div>
              </div>
              <button
                onClick={() => loadSave(autoSave)}
                className="px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 shrink-0"
              >继续</button>
            </div>
          )}

          {/* 已保存项目 */}
          {savedProjects.length > 0 && (
            <div className="mt-3 bg-secondary border border-primary rounded-2xl p-3 space-y-2">
              <div className="text-sm font-bold text-primary flex items-center gap-2">
                <FolderOpen className="w-4 h-4" /> 已保存项目
              </div>
              <div className="max-h-40 overflow-y-auto space-y-1.5">
                {savedProjects.map((s: { name: string; gridSize: number; cells: number[]; customColors?: CustomColor[] }, i: number) => (
                  <div key={i} className="flex items-center justify-between gap-2 bg-tertiary rounded-lg px-3 py-1.5">
                    <div className="text-xs text-primary truncate flex-1">{s.name}</div>
                    <button onClick={() => loadSave(s)} className="text-xs text-pink-500 hover:text-pink-400 shrink-0">载入</button>
                    <button onClick={() => deleteSave(i)} className="text-xs text-red-500 hover:text-red-400 shrink-0">删除</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-center text-xs text-subtle mt-4">
            联机基于 WebRTC P2P，创建房间后把 4 位房间码分享给好友即可一起拼豆
          </p>
        </div>
      </div>
    )
  }

  // ==================== 游戏界面 ====================
  const canvasSize = board ? Math.max(640, board.gridSize * 4) : 640

  return (
    <div className="min-h-screen bg-primary flex flex-col">
      {/* 顶栏 */}
      <div className="border-b border-primary bg-secondary px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Grid3x3 className="w-5 h-5 text-pink-500" />
            <span className="font-bold text-primary">拼豆联机</span>
          </div>
          {multiplayer && roomCode && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-pink-500/10 border border-pink-500/30">
              <span className="text-xs text-muted">房间</span>
              <span className="font-mono font-bold text-pink-500 tracking-wider">{roomCode}</span>
              <button
                onClick={() => navigator.clipboard?.writeText(roomCode)}
                className="text-muted hover:text-pink-500"
                title="复制房间码"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="text-sm text-muted">{filledCount}/{totalCells} 豆</div>
          <div className="w-24 h-2 rounded-full bg-tertiary overflow-hidden">
            <div className="h-full bg-gradient-to-r from-pink-500 to-rose-500 transition-all" style={{ width: `${pct}%` }} />
          </div>
          <button onClick={leave} className="px-3 py-1.5 rounded-lg bg-tertiary text-muted hover:text-red-500 text-sm flex items-center gap-1">
            <LogOut className="w-4 h-4" /> 退出
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-3 p-3">
        {/* 画板区 */}
        <div className="flex-1 overflow-auto flex flex-col items-center gap-3">
          {/* 工具栏 */}
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <div className="flex items-center gap-1 bg-secondary border border-primary rounded-xl p-1.5">
              <button
                onClick={() => setTool('place')}
                className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 transition-all ${tool === 'place' ? 'bg-pink-500 text-white' : 'text-muted hover:text-primary'}`}
              >
                <Palette className="w-4 h-4" /> 放置
              </button>
              <button
                onClick={() => setTool('erase')}
                className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 transition-all ${tool === 'erase' ? 'bg-red-500 text-white' : 'text-muted hover:text-primary'}`}
              >
                <Eraser className="w-4 h-4" /> 擦除
              </button>
            </div>
            <button
              onClick={exportPNG}
              className="px-3 py-1.5 rounded-xl bg-secondary border border-primary text-muted hover:text-blue-500 text-sm flex items-center gap-1.5"
              title="导出 PNG 图片"
            >
              <Download className="w-4 h-4" /> PNG
            </button>
            <button
              onClick={saveProgress}
              className="px-3 py-1.5 rounded-xl bg-secondary border border-primary text-muted hover:text-emerald-500 text-sm flex items-center gap-1.5"
              title="保存到本地"
            >
              <Save className="w-4 h-4" /> 保存
            </button>
            <button
              onClick={exportJSON}
              className="px-3 py-1.5 rounded-xl bg-secondary border border-primary text-muted hover:text-blue-500 text-sm flex items-center gap-1.5"
              title="导出 JSON 数据文件"
            >
              <FolderOpen className="w-4 h-4" /> 导出
            </button>
            <label className="px-3 py-1.5 rounded-xl bg-secondary border border-primary text-muted hover:text-blue-500 text-sm flex items-center gap-1.5 cursor-pointer" title="导入 JSON 数据文件">
              <Upload className="w-4 h-4" /> 导入
              <input
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) importJSON(f); e.target.value = '' }}
              />
            </label>
            <button
              onClick={clearBoard}
              className="px-3 py-1.5 rounded-xl bg-secondary border border-primary text-muted hover:text-red-500 text-sm flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" /> 清空
            </button>
          </div>

          {/* 调色板 */}
          <div className="flex items-center gap-1.5 flex-wrap justify-center bg-secondary border border-primary rounded-xl p-2.5">
            {allColors.map((color, i) => (
              <div key={i} className="relative group">
                <button
                  onClick={() => { setActiveColor(i); setTool('place') }}
                  title={allNames[i]}
                  className={`w-7 h-7 rounded-full border-2 transition-all hover:scale-110 ${activeColor === i && tool === 'place'
                    ? 'border-white scale-110 ring-2 ring-pink-500' : 'border-gray-600'}`}
                  style={{ background: color }}
                />
                {i >= BEAD_COLORS.length && (
                  <button
                    onClick={(e) => { e.stopPropagation(); removeCustomColor(i - BEAD_COLORS.length) }}
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            ))}
            <label className="relative w-7 h-7 rounded-full border-2 border-dashed border-gray-500 flex items-center justify-center cursor-pointer hover:border-pink-500 transition-colors overflow-hidden" title="添加自定义颜色">
              <Plus className="w-3.5 h-3.5 text-gray-500 pointer-events-none" />
              <input
                type="color"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={e => addCustomColor(e.target.value)}
                value="#ff0000"
              />
            </label>
          </div>

          {/* Canvas */}
          <div className="overflow-auto rounded-xl" style={{ maxHeight: '65vh' }}>
            <canvas
              ref={canvasRef}
              width={canvasSize}
              height={canvasSize}
              onPointerDown={onCanvasDown}
              onPointerMove={onCanvasMove}
              onPointerUp={onCanvasUp}
              onPointerLeave={onCanvasUp}
              onContextMenu={e => e.preventDefault()}
              className="rounded-xl border-2 border-primary shadow-2xl touch-none cursor-crosshair"
              style={{ maxWidth: '100%', height: 'auto' }}
            />
          </div>
        </div>

        {/* 侧栏 */}
        <div className="lg:w-72 flex flex-col gap-3">
          {/* 玩家列表 */}
          <div className="bg-secondary border border-primary rounded-2xl p-3">
            <div className="flex items-center gap-2 text-sm font-bold text-primary mb-2">
              <Users className="w-4 h-4" /> 玩家 {multiplayer && `(${players.length})`}
            </div>
            <div className="space-y-1.5">
              {players.map(p => (
                <div key={p.id} className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full" style={{ background: p.color }} />
                  <span className="text-primary truncate flex-1">{p.name}{p.id === myId && ' (我)'}</span>
                  {p.isHost && <Crown className="w-3.5 h-3.5 text-amber-500" />}
                  {multiplayer && connStatus === 'connected' && p.id === myId && <Wifi className="w-3.5 h-3.5 text-emerald-500" />}
                </div>
              ))}
            </div>
            {multiplayer && connStatus !== 'connected' && (
              <div className="text-xs text-amber-500 mt-2 flex items-center gap-1">
                <WifiOff className="w-3 h-3" /> {connStatus === 'connecting' ? '连接中...' : connError || '未连接'}
              </div>
            )}
          </div>

          {/* 预设 & 设置 */}
          {(!multiplayer || role === 'host') && (
            <div className="bg-secondary border border-primary rounded-2xl p-3 space-y-2.5">
              <div className="text-sm font-bold text-primary">预设图案</div>
              <div className="grid grid-cols-3 gap-1.5 max-h-36 overflow-y-auto">
                {PRESETS.map(p => (
                  <button
                    key={p.name}
                    onClick={() => loadPreset(p)}
                    className="py-2 rounded-lg bg-tertiary text-muted hover:text-pink-500 hover:bg-pink-500/10 text-xs font-medium transition-all"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
              <div className="text-sm font-bold text-primary pt-1">画板尺寸</div>
              <div className="flex flex-wrap gap-1">
                {BOARD_SIZES.map(s => (
                  <button
                    key={s.size}
                    onClick={() => changeSize(s.size)}
                    className={`px-2 py-1.5 rounded text-xs font-medium ${board?.gridSize === s.size ? 'bg-pink-500 text-white' : 'bg-tertiary text-muted'}`}
                  >{s.label}</button>
                ))}
              </div>
            </div>
          )}

          {/* 参考图纸 */}
          <div className="bg-secondary border border-primary rounded-2xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold text-primary flex items-center gap-2">
                <ImageIcon className="w-4 h-4" /> 参考图纸
              </div>
              <span className="text-xs text-muted">{references.length}/3</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {references.map((ref, i) => (
                <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border border-primary bg-tertiary">
                  <img src={ref.image} alt={ref.name} className="w-full h-full object-cover cursor-pointer" onClick={() => setViewRef(i)} />
                  <button
                    onClick={() => deleteReference(i)}
                    className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                  <button
                    onClick={() => startImportReference(ref.image, ref.name)}
                    className={`absolute bottom-0.5 left-0.5 right-0.5 py-0.5 rounded bg-black/60 text-white text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${!multiplayer || role === 'host' ? '' : 'hidden'}`}
                    title="导入为豆图"
                  >
                    导入为豆图
                  </button>
                </div>
              ))}
              {references.length < 3 && (
                <label className="aspect-square rounded-lg border-2 border-dashed border-gray-500 flex items-center justify-center cursor-pointer hover:border-pink-500 transition-colors bg-tertiary">
                  <Upload className="w-4 h-4 text-gray-500 pointer-events-none" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) uploadReference(f); e.target.value = '' }}
                  />
                </label>
              )}
            </div>
            {references.length === 0 && (
              <div className="text-xs text-subtle text-center py-0.5">上传图纸供房间成员参考</div>
            )}
          </div>

          {/* 当前颜色预览 */}
          <div className="bg-secondary border border-primary rounded-2xl p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-gray-600" style={{ background: tool === 'erase' ? '#333' : allColors[activeColor] }} />
            <div className="text-sm">
              <div className="text-primary font-medium">{tool === 'erase' ? '擦除模式' : allNames[activeColor]}</div>
              <div className="text-xs text-muted">{tool === 'erase' ? '点击移除豆子' : '点击放置豆子'}</div>
            </div>
          </div>

          {/* 聊天 */}
          {multiplayer && (
            <div className="bg-secondary border border-primary rounded-2xl p-3 flex-1 flex flex-col min-h-[160px]">
              <div className="flex items-center gap-2 text-sm font-bold text-primary mb-2">
                <MessageSquare className="w-4 h-4" /> 聊天
              </div>
              <div className="flex-1 overflow-y-auto space-y-1.5 mb-2 text-sm">
                {chats.length === 0 && <div className="text-xs text-subtle text-center py-4">暂无消息</div>}
                {chats.map((c, i) => (
                  <div key={i} className="text-xs">
                    <span style={{ color: c.color }} className="font-bold">{c.name}:</span>{' '}
                    <span className="text-muted">{c.text}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-1">
                <input
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') sendChat() }}
                  placeholder="发消息..."
                  className="flex-1 px-2.5 py-1.5 rounded-lg bg-tertiary border border-primary text-primary text-xs focus:outline-none focus:border-pink-500"
                />
                <button onClick={sendChat} className="px-2.5 rounded-lg bg-pink-500 text-white hover:bg-pink-600">
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 参考图查看器 */}
      {viewRef !== null && references[viewRef] && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setViewRef(null)}
        >
          <div className="relative max-w-2xl max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <img src={references[viewRef].image} alt={references[viewRef].name} className="max-w-full max-h-[85vh] rounded-xl" />
            <button
              onClick={() => setViewRef(null)}
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="absolute bottom-2 left-2 px-3 py-1 rounded-lg bg-black/60 text-white text-xs">
              {references[viewRef].name} · 上传: {references[viewRef].by}
            </div>
          </div>
        </div>
      )}
      {/* 参考图导入预览 */}
      {importPreview && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setImportPreview(null)}
        >
          <div
            className="bg-secondary border border-primary rounded-2xl p-4 max-w-2xl w-full max-h-[90vh] overflow-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-primary">导入参考图为豆图</h3>
              <button
                onClick={() => setImportPreview(null)}
                className="w-8 h-8 rounded-lg bg-tertiary text-muted hover:text-primary flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div>
                <div className="text-xs text-muted mb-1">原图</div>
                <img src={importPreview.image} alt={importPreview.name} className="w-full rounded-lg border border-primary bg-tertiary" />
              </div>
              <div>
                <div className="text-xs text-muted mb-1">识别预览</div>
                <canvas
                  ref={importPreviewCanvasRef}
                  className="w-full rounded-lg border border-primary bg-tertiary"
                  style={{ imageRendering: 'pixelated' }}
                />
              </div>
            </div>

            <div className="mb-4">
              <div className="text-xs text-muted mb-1.5">常用尺寸</div>
              <div className="flex flex-wrap gap-1.5">
                {[16, 24, 32, 40, 48, 56, 64, 80, 96, 128].map(s => (
                  <button
                    key={s}
                    onClick={() => setImportPreview(p => p ? { ...p, editSize: s } : p)}
                    className={`px-2 py-1 rounded-md text-xs border transition-colors ${
                      importPreview.editSize === s
                        ? 'bg-pink-500/20 border-pink-500 text-pink-400'
                        : 'bg-tertiary border-primary text-muted hover:text-primary'
                    }`}
                  >
                    {s}×{s}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 mb-4">
              <div className="flex items-center gap-2">
                <label className="text-sm text-muted">画板尺寸</label>
                <input
                  type="number"
                  min={4}
                  max={256}
                  value={importPreview.editSize}
                  onChange={e => setImportPreview(p => p ? { ...p, editSize: Number(e.target.value) } : p)}
                  onKeyDown={e => { if (e.key === 'Enter') regenerateImportPreview() }}
                  className="w-20 px-2 py-1.5 rounded-lg bg-tertiary border border-primary text-primary text-sm text-center focus:outline-none focus:border-pink-500"
                />
                <button
                  onClick={regenerateImportPreview}
                  className="px-2.5 py-1.5 rounded-lg bg-tertiary text-muted hover:text-primary text-xs border border-primary"
                >
                  重新识别
                </button>
              </div>
              <div className="text-xs">
                {importPreview.detected ? (
                  <span className={`flex items-center gap-1 ${importPreview.confidence === 'high' ? 'text-emerald-500' : 'text-amber-500'}`}>
                    {importPreview.confidence === 'high' ? '✓ 已自动识别网格尺寸' : '◐ 已识别网格尺寸（置信度低）'}
                  </span>
                ) : (
                  <span className="text-amber-500 flex items-center gap-1">⚠ 未识别到网格，使用估算尺寸</span>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setImportPreview(null)}
                className="px-4 py-2 rounded-lg bg-tertiary text-muted hover:text-primary text-sm font-medium"
              >
                取消
              </button>
              <button
                onClick={applyImport}
                className="px-4 py-2 rounded-lg bg-pink-500 text-white hover:bg-pink-600 text-sm font-medium"
              >
                应用到画板
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
