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
  const touchX = useRef<number | null>(null)
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
      onTouchStart={(e) => {
        // 多指（双指缩放）一开始就标记，避免后续被识别为 swipe
        if (e.touches.length > 1) {
          multiTouchRef.current = true
          touchX.current = null
          return
        }
        touchX.current = e.touches[0].clientX
        multiTouchRef.current = false
        pauseBriefly()
      }}
      onTouchMove={(e) => {
        // 中途加入第二根手指（单→多指缩放）也标记为多指
        if (e.touches.length > 1) {
          multiTouchRef.current = true
          touchX.current = null
        }
      }}
      onTouchEnd={(e) => {
        // 多指手势（缩放/旋转）不触发左右翻页
        if (multiTouchRef.current) {
          multiTouchRef.current = false
          touchX.current = null
          return
        }
        if (touchX.current !== null) {
          const dx = e.changedTouches[0].clientX - touchX.current
          if (Math.abs(dx) > 40) (dx < 0 ? next : prev)()
          touchX.current = null
        }
        pauseBriefly()
      }}
      onTouchCancel={() => {
        // 系统中断触摸（来电/手势冲突）时也清理
        multiTouchRef.current = false
        touchX.current = null
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
