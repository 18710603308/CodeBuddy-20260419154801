import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PhotoCarouselProps {
  photos: string[]
  accent: string
  fallbackEmoji?: string
  intervalMs?: number
  /** 全屏沉浸模式：图片铺满整个容器（淘宝详情大图风格） */
  fullscreen?: boolean
}

/**
 * 动态轮播图：自动播放 + 触摸滑动 + 箭头/指示点/缩略图切换。
 * 宾客端查看照片墙的核心组件。
 */
export function PhotoCarousel({
  photos,
  accent,
  fallbackEmoji = '💐',
  intervalMs = 3500,
  fullscreen = false,
}: PhotoCarouselProps) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  // 起始触摸点（identifier + 坐标）：只认同一根手指的抬起，避免双指缩放时另一指位移被误判
  const touchStartRef = useRef<{ id: number; x: number; y: number } | null>(null)
  // 标记本次触摸是否进入过多指（双指缩放手势），若进入过则忽略 swipe 翻页
  const multiTouchRef = useRef(false)
  const pauseTimer = useRef<number | null>(null)

  const total = photos.length

  // 用户主动操作后短暂暂停自动播放，再恢复
  const pauseBriefly = useCallback(() => {
    setPaused(true)
    if (pauseTimer.current) window.clearTimeout(pauseTimer.current)
    pauseTimer.current = window.setTimeout(() => setPaused(false), 6000)
  }, [])

  const go = useCallback(
    (i: number) => {
      if (total === 0) return
      setIndex(((i % total) + total) % total)
      pauseBriefly()
    },
    [total, pauseBriefly]
  )

  const next = useCallback(() => go(index + 1), [go, index])
  const prev = useCallback(() => go(index - 1), [go, index])

  // 自动播放（默认常开，仅用户操作时短暂暂停）
  useEffect(() => {
    if (total <= 1 || paused) return
    const id = setInterval(() => setIndex((i) => (i + 1) % total), intervalMs)
    return () => clearInterval(id)
  }, [total, paused, intervalMs])

  useEffect(() => {
    return () => {
      if (pauseTimer.current) window.clearTimeout(pauseTimer.current)
    }
  }, [])

  if (total === 0) {
    return (
      <div
        className={fullscreen ? 'flex h-full w-full items-center justify-center' : 'flex aspect-[4/5] items-center justify-center rounded-3xl text-7xl shadow-xl'}
        style={{ background: 'linear-gradient(145deg, rgba(255,255,255,0.16), rgba(255,255,255,0.05))' }}
      >
        <span className="animate-float-y">{fallbackEmoji}</span>
      </div>
    )
  }

  return (
    <div
      className={fullscreen ? 'relative h-full w-full' : 'relative'}
      // pan-y：浏览器只处理纵向滚动，横向手势与捏合缩放全部交给 JS 判断，杜绝原生缩放误触
      style={{ touchAction: 'pan-y' }}
      onTouchStart={(e) => {
        // 双指（缩放/旋转）立即标记为多指，彻底禁用本次 swipe
        if (e.touches.length > 1) {
          multiTouchRef.current = true
          touchStartRef.current = null
          return
        }
        const t = e.touches[0]
        // 只记录起始的那根手指，后续只认它的抬起
        touchStartRef.current = { id: t.identifier, x: t.clientX, y: t.clientY }
        multiTouchRef.current = false
        pauseBriefly()
      }}
      onTouchMove={(e) => {
        // 单指→双指（先落一指再上第二指缩放）也标记为多指
        if (e.touches.length > 1) {
          multiTouchRef.current = true
          touchStartRef.current = null
        }
      }}
      onTouchEnd={(e) => {
        const st = touchStartRef.current
        // 多指手势 / 无起始记录 → 不翻页
        if (multiTouchRef.current || !st) {
          multiTouchRef.current = false
          touchStartRef.current = null
          return
        }
        // 只认起始手指的抬起：双指缩放时另一根手指先抬，位移再大也不会误判
        const end = Array.from(e.changedTouches).find((t) => t.identifier === st.id)
        if (end) {
          const dx = end.clientX - st.x
          const dy = end.clientY - st.y
          // 仅水平主导的滑动才翻页：位移 > 60px 且横向显著大于纵向
          // （双指缩放手指位移多为斜向/竖向，被方向过滤拦截）
          if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.2) {
            ;(dx < 0 ? next : prev)()
          }
        }
        touchStartRef.current = null
        multiTouchRef.current = false
        pauseBriefly()
      }}
      onTouchCancel={() => {
        // 系统中断触摸（来电/手势冲突）时也清理
        touchStartRef.current = null
        multiTouchRef.current = false
      }}
    >
      {/* 主图 */}
      <div
        className={
          fullscreen
            ? 'relative h-full w-full overflow-hidden bg-black'
            : 'relative aspect-[4/5] overflow-hidden rounded-3xl shadow-2xl ring-1 ring-white/25'
        }
      >
        {photos.map((src, i) => (
          <div
            key={i}
            className={`absolute inset-0 transition-all duration-700 ${i === index ? 'animate-slide-fade opacity-100' : 'pointer-events-none opacity-0'}`}
            style={{ zIndex: i === index ? 1 : 0 }}
          >
            {src.startsWith('data:') || src.startsWith('http') ? (
              <img
                src={src}
                alt={`照片 ${i + 1}`}
                className="h-full w-full object-cover"
                loading="lazy"
                onError={(e) => {
                  ;(e.currentTarget as HTMLImageElement).style.display = 'none'
                  const parent = (e.currentTarget as HTMLImageElement).parentElement
                  if (parent) parent.classList.add('fallback-photo')
                }}
              />
            ) : (
              <div className="fallback-photo" />
            )}
          </div>
        ))}

        {/* 左右箭头 */}
        {total > 1 && (
          <>
            <button
              aria-label="上一张"
              onClick={prev}
              className={`absolute top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/30 text-white backdrop-blur transition-transform hover:scale-110 active:scale-95 ${
                fullscreen ? 'left-4 p-3' : 'left-3 p-2'
              }`}
              style={{ boxShadow: '0 4px 14px rgba(0,0,0,0.25)' }}
            >
              <ChevronLeft size={fullscreen ? 26 : 18} />
            </button>
            <button
              aria-label="下一张"
              onClick={next}
              className={`absolute top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/30 text-white backdrop-blur transition-transform hover:scale-110 active:scale-95 ${
                fullscreen ? 'right-4 p-3' : 'right-3 p-2'
              }`}
              style={{ boxShadow: '0 4px 14px rgba(0,0,0,0.25)' }}
            >
              <ChevronRight size={fullscreen ? 26 : 18} />
            </button>
          </>
        )}

        {/* 序号角标 */}
        {total > 1 && (
          <div
            className={`absolute rounded-full bg-black/40 font-semibold text-white backdrop-blur ${
              fullscreen ? 'right-4 top-4 px-3.5 py-1.5 text-sm' : 'right-3 top-3 px-2.5 py-1 text-xs'
            }`}
          >
            {index + 1} / {total}
          </div>
        )}

        {/* 指示点（全屏模式浮在底部） */}
        {total > 1 && (
          <div
            className={`flex items-center justify-center gap-2 ${
              fullscreen ? 'absolute bottom-6 left-0 right-0 z-10' : 'mt-3'
            }`}
          >
            {photos.map((_, i) => (
              <button
                key={i}
                aria-label={`切换到第 ${i + 1} 张`}
                onClick={() => go(i)}
                className="h-2 rounded-full transition-all duration-300"
                style={{
                  width: i === index ? (fullscreen ? 26 : 22) : fullscreen ? 10 : 8,
                  background: i === index ? accent : 'rgba(255,255,255,0.5)',
                  boxShadow: i === index ? `0 0 10px ${accent}88` : 'none',
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* 缩略图横排（仅卡片模式显示，全屏沉浸模式隐藏） */}
      {!fullscreen && total > 1 && (
        <div className="mt-3 flex justify-center gap-2.5 overflow-x-auto pb-1">
          {photos.map((src, i) => (
            <button
              key={i}
              aria-label={`缩略图 ${i + 1}`}
              onClick={() => go(i)}
              className="relative h-14 w-12 shrink-0 overflow-hidden rounded-xl transition-all duration-300"
              style={{
                opacity: i === index ? 1 : 0.45,
                transform: i === index ? 'scale(1.08)' : 'scale(1)',
                boxShadow: i === index ? `0 4px 12px ${accent}55` : 'none',
                border: i === index ? `2px solid ${accent}` : '2px solid transparent',
              }}
            >
              {src.startsWith('data:') || src.startsWith('http') ? (
                <img
                  src={src}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    ;(e.currentTarget as HTMLImageElement).style.display = 'none'
                  }}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-white/10 text-lg">
                  {fallbackEmoji}
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
