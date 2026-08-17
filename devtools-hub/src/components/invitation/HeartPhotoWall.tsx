import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, Image as ImageIcon, X } from 'lucide-react'

type Pt = { x: number; y: number }

const VIEW_W = 32
const VIEW_H = 28.92 // 心形参数方程真实高度：y ∈ [-17, 11.92]
const CONTAINER_W = 448 // 心形容器最大宽度（max-w-md），用于估算缩略图归一化尺寸

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

const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y)

/** 按照片数量自适应缩略图尺寸（正方形 1:1，单位 px） */
function getThumbSize(n: number): number {
  if (n <= 6) return 88
  if (n <= 10) return 68
  if (n <= 16) return 54
  if (n <= 24) return 44
  if (n <= 40) return 36
  return 30
}

/**
 * 在心形内部生成 N 个互不重叠的位置。
 * 思路：高密度网格 + 轮廓合并成候选池，从顶部中心出发贪心选点，
 * 每次选"距离已选集合最近距离最大"的点，并把离新点 < minDist 的候选剔出池子，
 * 保证最终已选点两两间距 >= minDist（缩略图不会重叠）。
 */
function heartPositions(n: number, thumbSize: number): Pt[] {
  if (n <= 0) return []
  if (n === 1) return [{ x: 0.5, y: 0.45 }]

  // 缩略图在归一化坐标的"半径"（X 方向按宽归一化、Y 方向按高归一化）
  // 容器宽 = CONTAINER_W（448px），高 = CONTAINER_W * VIEW_H/VIEW_W ≈ 405px
  const rx = thumbSize / CONTAINER_W
  const ry = thumbSize / (CONTAINER_W * (VIEW_H / VIEW_W))
  // 中心距 >= 缩略图最长边（保证不重叠，留 0.003 缓冲）
  const minDist = Math.max(rx, ry) + 0.003

  const raw = heartOutline(320)
  const outline = raw.map(norm)

  // 起始点：顶部中心（y 最小）
  let top = outline[0]
  for (const p of outline) if (p.y < top.y) top = p

  // 内部候选点（高密度网格）
  const inside: Pt[] = []
  const GRID = Math.max(96, Math.ceil(Math.sqrt(n * 18)))
  for (let i = 0; i < GRID; i++) {
    for (let j = 0; j < GRID; j++) {
      const x = -16 + (VIEW_W * (i + 0.5)) / GRID
      const y = -17 + (VIEW_H * (j + 0.5)) / GRID
      if (pointInPolygon(x, y, raw)) inside.push(norm({ x, y }))
    }
  }
  const pool: Pt[] = [...outline, ...inside]

  // 贪心：每次选"距离已选集合最近距离最大"的点，并把离新点 < minDist 的候选剔出
  const chosen: Pt[] = [top]
  let working = pool.filter((p) => dist(p, top) >= minDist)

  while (chosen.length < n && working.length > 0) {
    let best: Pt | null = null
    let bestD = -1
    for (const p of working) {
      let minD = Infinity
      for (const c of chosen) {
        const d = dist(p, c)
        if (d < minD) minD = d
      }
      if (minD > bestD) {
        bestD = minD
        best = p
      }
    }
    if (!best) break
    chosen.push(best)
    working = working.filter((p) => dist(p, best) >= minDist)
  }

  return chosen
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

interface HeartPhotoWallProps {
  photos: string[]
  accent: string
  fallbackEmoji?: string
  /** 每张照片简介（与 photos 下标对齐），Lightbox 中展示 */
  captions?: string[]
  /**
   * 心形墙精选展示的照片下标（不限数量，按下标顺序展示）。
   * - 未传或空数组 → 默认所有 photos 都进心形铺满
   * - 显式传入时按数组下标展示
   * 缩略图尺寸会按精选数量自适应，保证互不重叠、可点击。
   */
  featuredIndexes?: number[]
}

export function HeartPhotoWall({
  photos,
  accent,
  fallbackEmoji = '💐',
  captions,
  featuredIndexes,
}: HeartPhotoWallProps) {
  const MAX = 60 // 心形 + 平铺总展示上限

  // 心形展示下标：featuredIndexes 为空时默认全选（铺满心形）
  const featured = useMemo(() => {
    const arr = Array.isArray(featuredIndexes)
      ? featuredIndexes.filter((i) => i >= 0 && i < photos.length)
      : []
    return arr.length > 0 ? arr : photos.map((_, i) => i).slice(0, MAX)
  }, [featuredIndexes, photos.length])

  // 全部展示的照片（用于 Lightbox 浏览 + 下方平铺）
  const display = photos.slice(0, MAX)

  // 心形缩略图尺寸 = 自适应
  const thumbSize = getThumbSize(featured.length)

  // 心形位置数 = 精选照片数
  const positions = useMemo(
    () => heartPositions(featured.length, thumbSize),
    [featured.length, thumbSize]
  )

  // 其余未进心形的（featured 未覆盖到的）
  const rest = useMemo(
    () => display.map((_, i) => i).filter((i) => !featured.includes(i)),
    [display, featured]
  )

  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const [broken, setBroken] = useState<Set<number>>(new Set())
  const [lightboxError, setLightboxError] = useState(false)
  const touchX = useRef<number | null>(null)

  // 当前打开照片的 caption（按 photos 原下标取）
  const openOrigIndex = openIndex === null ? -1 : openIndex
  const openCaption =
    openOrigIndex >= 0 && captions ? (captions[openOrigIndex] || '').trim() : ''

  // 把简介按中文标点 / 换行拆成多行（每行一句，诗意排版）
  const captionLines = useMemo(() => {
    if (!openCaption) return [] as string[]
    return openCaption
      .split(/[，。！？；\n]+/)
      .map((s) => s.trim())
      .filter(Boolean)
  }, [openCaption])

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

  const renderThumb = (origIdx: number, sizePx: number, radius = 'rounded-xl') => (
    <span
      className={`block overflow-hidden ${radius} transition-transform duration-300 hover:scale-105 active:scale-95`}
      style={{
        width: sizePx,
        height: sizePx,
        boxShadow: '0 4px 14px rgba(0,0,0,0.28)',
      }}
    >
      {!broken.has(origIdx) && display[origIdx] ? (
        <img
          src={display[origIdx]}
          alt={`照片 ${origIdx + 1}`}
          className="block h-full w-full object-cover"
          loading="lazy"
          draggable={false}
          onError={() => setBroken((s) => new Set(s).add(origIdx))}
        />
      ) : (
        <span
          className="flex h-full w-full items-center justify-center text-2xl"
          style={{ background: `linear-gradient(145deg, ${accent}66, ${accent}22)` }}
        >
          {fallbackEmoji}
        </span>
      )}
    </span>
  )

  return (
    <div className="w-full max-w-md mx-auto">
      {/* ============ 心形墙（所有精选照片铺满、互不重叠） ============ */}
      {featured.length > 0 && positions.length > 0 && (
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
            <path d={HEART_PATH} fill={`${accent}10`} />
            <path
              d={HEART_PATH}
              stroke={`${accent}50`}
              strokeWidth={0.45}
              strokeLinejoin="round"
            />
          </svg>

          {positions.map((p, i) => {
            const origIdx = featured[i]
            if (origIdx === undefined) return null
            return (
              <button
                key={origIdx}
                onClick={() => setOpenIndex(origIdx)}
                aria-label={`查看照片 ${origIdx + 1}`}
                className="absolute cursor-pointer"
                style={{
                  left: `calc(10% + ${p.x * 80}%)`,
                  top: `calc(14% + ${p.y * 72}%)`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                {renderThumb(origIdx, thumbSize, 'rounded-2xl')}
              </button>
            )
          })}
        </div>
      )}

      {/* ============ 其余照片平铺（精选未覆盖到的，也都可点开大图） ============ */}
      {rest.length > 0 && (
        <div className="mt-4">
          <div className="mb-2 flex items-center gap-2 px-1">
            <ImageIcon className="h-4 w-4" style={{ color: accent }} />
            <span
              className="text-xs font-medium tracking-wide"
              style={{ color: accent }}
            >
              更多照片 · 共 {rest.length} 张
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {rest.map((i) => (
              <button
                key={i}
                onClick={() => setOpenIndex(i)}
                className="cursor-pointer"
                aria-label={`查看照片 ${i + 1}`}
              >
                {renderThumb(i, Math.min(thumbSize, 110))}
                {captions?.[i] ? (
                  <span
                    className="mt-1 block truncate text-center text-[10px]"
                    style={{ color: '#8a6a3a' }}
                  >
                    {captions[i]}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ============ Lightbox：左大图 + 右侧"爱的旁白"（复刻商业版详情页） ============ */}
      {openIndex !== null &&
        createPortal(
          <div
            className="fixed inset-0 z-[80] flex items-center justify-center px-3 sm:px-6 py-6"
            style={{
              background:
                'radial-gradient(ellipse at center, rgba(255,240,235,0.97) 0%, rgba(252,222,210,0.97) 100%)',
              backdropFilter: 'blur(6px)',
            }}
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
            {/* 关闭按钮 */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                close()
              }}
              className="absolute top-4 right-4 sm:top-5 sm:right-5 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/70 text-stone-700 backdrop-blur transition-colors hover:bg-white"
              aria-label="关闭大图"
            >
              <X className="h-5 w-5" />
            </button>

            {/* 上下张切换 */}
            {display.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    step(-1)
                  }}
                  className="absolute left-2 sm:left-5 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/70 text-stone-700 backdrop-blur transition-colors hover:bg-white"
                  aria-label="上一张"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    step(1)
                  }}
                  className="absolute right-2 sm:right-5 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/70 text-stone-700 backdrop-blur transition-colors hover:bg-white"
                  aria-label="下一张"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}

            {/* 主体：左大图 + 右侧文案（PC）；移动端上下 */}
            <div
              className="relative w-full max-w-5xl flex flex-col md:flex-row items-center md:items-center justify-center gap-4 md:gap-8"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 左侧大图 */}
              <div className="flex-shrink-0 flex items-center justify-center w-full md:w-auto">
                {!lightboxError && display[openIndex] ? (
                  <img
                    key={openIndex}
                    src={display[openIndex]}
                    alt={`照片 ${openIndex + 1}`}
                    className="rounded-2xl object-contain shadow-2xl"
                    style={{
                      maxHeight: 'min(70vh, 620px)',
                      maxWidth: 'min(92vw, 480px)',
                      border: '6px solid #fffbf5',
                      boxShadow: '0 18px 50px rgba(120,60,40,0.35)',
                    }}
                    onError={() => setLightboxError(true)}
                  />
                ) : (
                  <div
                    className="flex flex-col items-center gap-3 rounded-2xl px-12 py-16"
                    style={{
                      background: '#fffbf5',
                      boxShadow: '0 18px 50px rgba(120,60,40,0.35)',
                    }}
                  >
                    <span className="text-5xl">{fallbackEmoji}</span>
                    <span className="text-sm text-stone-500">这张照片暂时无法显示</span>
                  </div>
                )}
              </div>

              {/* 右侧文案（爱的旁白，仅 PC 显示） */}
              {captionLines.length > 0 && (
                <div
                  className="hidden md:flex flex-col items-center justify-center text-center max-w-[320px] flex-1"
                  style={{ color: '#7a4f2b' }}
                >
                  <div
                    className="text-[11px] tracking-[0.4em] mb-3 font-medium"
                    style={{ color: '#c08560' }}
                  >
                    LOVE · WHISPER
                  </div>
                  <div
                    className="text-2xl mb-4"
                    style={{ color: '#c4765a' }}
                  >
                    ❤
                  </div>
                  <div
                    className="text-[15px] leading-[2.1] tracking-wide"
                    style={{ fontFamily: "'Noto Serif SC', 'Songti SC', serif" }}
                  >
                    {captionLines.map((line, i) => (
                      <p key={i} className="my-0.5">
                        {line}
                      </p>
                    ))}
                  </div>
                  <div
                    className="text-[11px] tracking-[0.3em] mt-4 opacity-70"
                    style={{ color: '#a07654' }}
                  >
                    · {openOrigIndex + 1} / {display.length} ·
                  </div>
                </div>
              )}

              {/* 移动端：简介放在大图下方（多行诗意） */}
              {captionLines.length > 0 && (
                <div
                  className="md:hidden mt-1 w-full max-w-[92vw] rounded-2xl px-5 py-3 text-center"
                  style={{
                    background:
                      'linear-gradient(180deg, rgba(255,251,240,0.96), rgba(255,247,230,0.96))',
                    color: '#7a4f2b',
                    boxShadow: '0 6px 18px rgba(120,60,40,0.18)',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div
                    className="text-sm leading-relaxed"
                    style={{ fontFamily: "'Noto Serif SC', 'Songti SC', serif" }}
                  >
                    {captionLines.map((line, i) => (
                      <p key={i} className="my-0.5">
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}
