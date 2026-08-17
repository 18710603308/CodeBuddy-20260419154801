import { useMemo } from 'react'

export type ParticleShape = 'petal' | 'heart' | 'star' | 'bubble'

interface Particle {
  left: number
  size: number
  duration: number
  delay: number
  sway: number
  opacity: number
  shape: ParticleShape
  emoji: string
}

const EMOJI: Record<Exclude<ParticleShape, 'petal'>, string[]> = {
  heart: ['💗', '💖', '🩷', '💕'],
  star: ['✨', '⭐', '🌟', '💫'],
  bubble: ['🫧', '💧', '🌸', '🦋'],
}

/**
 * 漂浮粒子背景：可组合花瓣（纯色 CSS 形状）、爱心、星星、泡泡。
 * 婚礼纪式请柬的青春系动效核心组件。
 */
export function PetalRain({
  count = 20,
  color = 'rgba(255,255,255,0.65)',
  shapes = ['petal'],
}: {
  count?: number
  color?: string
  /** 粒子类型组合，如 ['heart', 'star']，默认纯花瓣 */
  shapes?: ParticleShape[]
}) {
  const shapeKey = shapes.join(',')
  const particles = useMemo<Particle[]>(
    () => {
      const pool: ParticleShape[] = shapes.length ? shapes : ['petal']
      return Array.from({ length: count }, () => {
        const shape = pool[Math.floor(Math.random() * pool.length)]
        const emojiPool = shape === 'petal' ? [] : EMOJI[shape]
        return {
          left: Math.random() * 100,
          size: 10 + Math.random() * 14,
          duration: 8 + Math.random() * 11,
          delay: -Math.random() * 20,
          sway: 24 + Math.random() * 60,
          opacity: 0.3 + Math.random() * 0.45,
          shape,
          emoji: emojiPool.length ? emojiPool[Math.floor(Math.random() * emojiPool.length)] : '',
        }
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [count, shapeKey]
  )

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {particles.map((p, i) =>
        p.shape === 'petal' ? (
          <span
            key={i}
            className="petal"
            style={{
              left: `${p.left}%`,
              width: p.size,
              height: p.size * 0.75,
              background: color,
              opacity: p.opacity,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
              ['--sway' as string]: `${p.sway}px`,
            }}
          />
        ) : (
          <span
            key={i}
            className="particle-float"
            style={{
              left: `${p.left}%`,
              fontSize: p.size * 1.1,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
              ['--sway' as string]: `${p.sway}px`,
              ['--pop' as string]: p.opacity,
            }}
          >
            {p.emoji}
          </span>
        )
      )}
    </div>
  )
}
