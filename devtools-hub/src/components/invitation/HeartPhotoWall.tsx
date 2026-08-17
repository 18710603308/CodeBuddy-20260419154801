import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

type Pt = { x: number; y: number }

const VIEW_W = 32
const VIEW_H = 28.92 // 心形参数方程真实高度：y ∈ [-17, 11.92]

/** 心形参数方程轮廓点（x∈[-16,16]，y∈[-17,11.92]） */
function heartOutline(steps = 320): Pt[] {
  const pts: Pt[] = []
  for (let i = 0; i < steps; i++) {
    const t = (i / steps) * Math.PI * 2
    pts.push({
      x: 16 * Math.pow(Math.sin(t), 3),
      y: 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t),
    })
  }
  return pts
}

/** 归一化到 [0,1]，翻转 y（尖角朝下） */
function norm(p: Pt): Pt {
  return { x: (p.x + 16) / VIEW_W, y: 1 - (p.y + 17) / VIEW_H }
}

/** 射线法：点在多边形内 */
function pointInPolygon(x: number, y: number, poly: Pt[]): boolean {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x
    const yi = poly[i].y
    const xj = poly[j].x
    const yj = poly[j].y
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

const dist2 = (a: Pt, b: Pt) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2

/** 贪心最大-最小距离选点，保证均匀分散 */
function greedyPick(pool: Pt[], count: number, start: Pt): Pt[] {
  const chosen: Pt[] = [start]
  while (chosen.length < count) {
    let best: Pt | null = null
    let bestD = -1
    for (const p of pool) {
      let minD = Infinity
      for (const c of chosen) minD = Math.min(minD, dist2(p, c))
      if (minD > bestD) {
        bestD = minD
        best = p
      }
    }
    if (!best) break
    chosen.push(best)
  }
  return chosen
}

/** 按照片数量生成爱心点位：轮廓优先，内部填充 */
function heartPositions(n: number): Pt[] {
  if (n <= 0) return []
  if (n === 1) return [{ x: 0.5, y: 0.44 }]

  const outline = heartOutline(320).map(norm)
  // 起始点：最靠近顶部中心
  let top = outline[0]
  for (const p of outline) if (p.y < top.y) top = p

  const RIM = Math.min(n, 14) // 轮廓上最多放 14 张
  const rim = greedyPick(outline, RIM, top)
  if (n <= RIM) return rim

  // 内部填充候选点（网格采样 + 心形内部判定）
  const raw = heartOutline(320)
  const inside: Pt[] = []
  const GRID = 56
  for (let i = 0; i < GRID; i++) {
    for (let j = 0; j < GRID; j++) {
      const x = -16 + (VIEW_W * (i + 0.5)) / GRID
      const y = -17 + (VIEW_H * (j + 0.5)) / GRID
      if (pointInPolygon(x, y, raw)) inside.push(norm({ x, y }))
    }
  }
  const rest = greedyPick(inside, n - RIM, rim[rim.length - 1])
  return [...rim, ...rest]
}

/** 爱心轮廓 SVG path（用于淡色底纹） */
const HEART_PATH = (() => {
  return (
    heartOutline(120)
      .map((p, i) => {
        const s = norm(p)
        return `${i === 0 ? 'M' : 'L'}${(s.x * VIEW_W).toFixed(2)} ${(s.y * VIEW_H).toFixed(2)}`
      })
      .join(' ') + ' Z'
  )
})()

/** 缩略图尺寸：照片越多越小，带 vw 兜底适配小屏 */
function thumbSizeCss(n: number): string {
  const base =
    n <= 8 ? 96 : n <= 12 ? 84 : n <= 18 ? 70 : n <= 26 ? 58 : 48
  const vw = Math.max(12, Math.round(base / 4))
  return `min(${base}px, ${vw}vw)`
}

interface HeartPhotoWallProps {
  photos: string[]
  accent: string
  fallbackEmoji?: string
}

export function HeartPhotoWall({
  photos,
  accent,
  fallbackEmoji = '💐',
}: HeartPhotoWallProps) {
  const MAX = 40
  const display = photos.slice(0, MAX)
  const hidden = photos.length - display.length
  const positions = useMemo(() => heartPositions(display.length), [display.length])

  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const [broken, setBroken] = useState<Set<number>>(new Set())
  const [lightboxError, setLightboxError] = useState(false)
  const touchX = useRef<number | null>(null)

  const close = useCallback(() => {
    setOpenIndex(null)
    setLightboxError(false)
  }, [])
  const step = useCallback(
    (d: number) => {
      setOpenIndex((i) =>
        i === null ? i : (i + d + display.length) % display.length
      )
      setLightboxError(false)
    },
    [display.length]
  )

  // 键盘控制
  useEffect(() => {
    if (openIndex === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      else if (e.key === 'ArrowLeft') step(-1)
      else if (e.key === 'ArrowRight') step(1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [openIndex, close, step])

  // 打开 Lightbox 时锁定页面滚动
  useEffect(() => {
    if (openIndex === null) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [openIndex])

  if (display.length === 0) return null

  return (
    <div className="w-full max-w-md mx-auto">
      <div
        className="relative w-full"
        style={{ aspectRatio: `${VIEW_W} / ${VIEW_H}` }}
      >
        {/* 爱心轮廓底纹 */}
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          fill="none"
          preserveAspectRatio="none"
        >
          <path d={HEART_PATH} fill={`${accent}0d`} />
          <path
            d={HEART_PATH}
            stroke={`${accent}45`}
            strokeWidth={0.45}
            strokeLinejoin="round"
          />
        </svg>

        {positions.map((p, i) => (
          <button
            key={i}
            onClick={() => setOpenIndex(i)}
            aria-label={`查看照片 ${i + 1}`}
            className="absolute cursor-pointer"
            style={{
              left: `calc(10% + ${p.x * 80}%)`,
              top: `calc(14% + ${p.y * 72}%)`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <span
              className="block overflow-hidden rounded-2xl transition-transform duration-300 hover:scale-110 active:scale-95"
              style={{
                width: thumbSizeCss(display.length),
                aspectRatio: '1 / 1',
                boxShadow:
                  '0 6px 18px rgba(0,0,0,0.35), 0 0 0 2px rgba(255,255,255,0.28)',
              }}
            >
              {!broken.has(i) && display[i] ? (
                <img
                  src={display[i]}
                  alt={`照片 ${i + 1}`}
                  className="block h-full w-full object-cover"
                  loading="lazy"
                  draggable={false}
                  onError={() => setBroken((s) => new Set(s).add(i))}
                />
              ) : (
                <span
                  className="flex h-full w-full items-center justify-center text-2xl"
                  style={{
                    background: `linear-gradient(145deg, ${accent}66, ${accent}22)`,
                  }}
                >
                  {fallbackEmoji}
                </span>
              )}
            </span>
          </button>
        ))}

        {hidden > 0 && (
          <span
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium text-white shadow-md"
            style={{ background: `${accent}cc` }}
          >
            还有 {hidden} 张
          </span>
        )}
      </div>

      {/* 点击查看原图 Lightbox */}
      {openIndex !== null && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.92)' }}
          onClick={close}
          onTouchStart={(e) => {
            touchX.current = e.touches[0].clientX
          }}
          onTouchEnd={(e) => {
            if (touchX.current !== null) {
              const dx = e.changedTouches[0].clientX - touchX.current
              if (Math.abs(dx) > 40) step(dx < 0 ? 1 : -1)
              touchX.current = null
            }
          }}
        >
          <div className="absolute top-5 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-4 py-1.5 text-sm text-white backdrop-blur">
            {openIndex + 1} / {display.length}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation()
              close()
            }}
            className="absolute top-5 right-5 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20"
            aria-label="关闭大图"
          >
            <X className="h-5 w-5" />
          </button>

          {display.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  step(-1)
                }}
                className="absolute left-3 sm:left-6 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20"
                aria-label="上一张"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  step(1)
                }}
                className="absolute right-3 sm:right-6 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20"
                aria-label="下一张"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          {!lightboxError && display[openIndex] ? (
            <img
              key={openIndex}
              src={display[openIndex]}
              alt={`照片 ${openIndex + 1}`}
              className="max-h-[86vh] max-w-[92vw] rounded-lg object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
              onError={() => setLightboxError(true)}
            />
          ) : (
            <div
              className="flex flex-col items-center gap-3 text-white/80"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="text-5xl">{fallbackEmoji}</span>
              <span className="text-sm">这张照片暂时无法显示</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
