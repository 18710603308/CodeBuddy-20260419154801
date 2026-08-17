import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft, Calendar, Check, Clock, ExternalLink, Heart, MapPin,
  Music2, Pause, Play, Share2, SkipBack, SkipForward, Wand2, X,
} from 'lucide-react'
import {
  INVITATION_TYPES, buildMapUrl, buildShareUrl, getTheme,
} from '../../data/invitation'
import type { InvitationData } from '../../data/invitation'
import { INVITATION_PLAYLIST } from '../../data/invitationMusic'
import { HeartPhotoWall } from './HeartPhotoWall'
import { PetalRain } from './PetalRain'

// ==================== 倒计时 Hook ====================
function useCountdown(target: Date) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  if (Number.isNaN(target.getTime())) return null
  const diff = target.getTime() - now
  const abs = Math.max(0, diff)
  return {
    diff,
    days: Math.floor(abs / 86400000),
    hours: Math.floor((abs % 86400000) / 3600000),
    minutes: Math.floor((abs % 3600000) / 60000),
    seconds: Math.floor((abs % 60000) / 1000),
    passed: diff < 0,
  }
}

// ==================== 滚入动画容器 ====================
function Reveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true)
          obs.disconnect()
        }
      },
      { threshold: 0.12 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        shown ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-95'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

// ==================== 装饰分隔线 ====================
function Ornament({ color = '#b45309' }: { color?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 my-6">
      <span className="h-px w-14" style={{ background: `${color}55` }} />
      <Heart className="w-4 h-4 animate-wiggle" style={{ color }} fill="currentColor" />
      <span className="h-px w-14" style={{ background: `${color}55` }} />
    </div>
  )
}

// ==================== 浏览页主组件 ====================
export function InvitationView({
  data,
  onBack,
  views,
}: {
  data: InvitationData
  onBack: () => void
  views?: number
}) {
  const [opened, setOpened] = useState(false)
  const [copied, setCopied] = useState(false)
  const [musicPlaying, setMusicPlaying] = useState(false)
  const playingRef = useRef(false)
  const [musicOff, setMusicOff] = useState<boolean>(() => {
    try {
      return localStorage.getItem('inv-music-off') === '1'
    } catch {
      return false
    }
  })
  const [trackIndex, setTrackIndex] = useState(0)
  const audioRef = useRef<HTMLAudioElement>(null)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [activePage, setActivePage] = useState(0)

  const theme = getTheme(data.themeId)
  const typeInfo = INVITATION_TYPES[data.type]
  const shareUrl = useMemo(() => buildShareUrl(data, window.location.origin), [data])

  const target = useMemo(() => new Date(`${data.date}T${data.time || '00:00'}:00`), [data.date, data.time])
  const countdown = useCountdown(target)

  // 留言板
  const wishesKey = useMemo(() => {
    const raw = `${data.nameA}-${data.nameB}-${data.date}`
    try {
      return 'inv-wishes-' + btoa(unescape(encodeURIComponent(raw)))
    } catch {
      return 'inv-wishes-' + raw
    }
  }, [data.nameA, data.nameB, data.date])
  const [wishes, setWishes] = useState<{ name: string; text: string; time: number }[]>(() => {
    try {
      const raw = localStorage.getItem(wishesKey)
      return raw ? (JSON.parse(raw) as { name: string; text: string; time: number }[]) : []
    } catch {
      return []
    }
  })
  const [wishName, setWishName] = useState('')
  const [wishText, setWishText] = useState('')

  useEffect(() => {
    try {
      localStorage.setItem(wishesKey, JSON.stringify(wishes))
    } catch {
      /* ignore */
    }
  }, [wishes, wishesKey])

  // 滚动时更新当前页指示（按各内容块 offsetTop 计算，适配平铺长区）
  const onScroll = useCallback(() => {
    const el = scrollerRef.current
    if (!el) return
    const threshold = el.scrollTop + el.clientHeight * 0.45
    let cur = 0
    el.querySelectorAll<HTMLElement>('[data-page]').forEach((s, i) => {
      if (threshold >= s.offsetTop) cur = i
    })
    setActivePage(cur)
  }, [])

  const openInvitation = () => {
    setOpened(true)
    if (musicOff) return
    const a = audioRef.current
    if (a) {
      a.play()
        .then(() => setMusicPlaying(true))
        .catch(() => setMusicPlaying(false))
    }
  }

  // ==================== 背景音乐（内置歌单轮播） ====================
  const playlist = useMemo(() => {
    const list = [...INVITATION_PLAYLIST]
    if (data.music) {
      list.push({ name: '自定义音乐', artist: '请柬设置', src: data.music })
    }
    return list
  }, [data.music])

  const current = playlist[trackIndex % playlist.length]

  const syncPlaying = useCallback((v: boolean) => {
    playingRef.current = v
    setMusicPlaying(v)
  }, [])

  const playMusic = useCallback(() => {
    const a = audioRef.current
    if (!a) return
    a.play()
      .then(() => syncPlaying(true))
      .catch(() => syncPlaying(false))
  }, [syncPlaying])

  const pauseMusic = useCallback(() => {
    const a = audioRef.current
    if (a) a.pause()
    syncPlaying(false)
  }, [syncPlaying])

  const toggleMusic = useCallback(() => {
    if (playingRef.current) pauseMusic()
    else playMusic()
  }, [playMusic, pauseMusic])

  const changeTrack = useCallback(
    (dir: number) => {
      setTrackIndex((i) => (i + dir + playlist.length) % playlist.length)
    },
    [playlist.length]
  )

  const turnOffMusic = useCallback(() => {
    pauseMusic()
    setMusicOff(true)
    try {
      localStorage.setItem('inv-music-off', '1')
    } catch {
      /* ignore */
    }
  }, [pauseMusic])

  const turnOnMusic = useCallback(() => {
    setMusicOff(false)
    try {
      localStorage.removeItem('inv-music-off')
    } catch {
      /* ignore */
    }
    playMusic()
  }, [playMusic])

  // 切歌（audio 随 key 重建）后若此前在播放，则自动续播新曲目
  useEffect(() => {
    if (!playingRef.current) return
    const a = audioRef.current
    if (a) {
      a.play()
        .then(() => syncPlaying(true))
        .catch(() => syncPlaying(false))
    }
  }, [trackIndex, syncPlaying])

  // 组件挂载后立即尝试自动播放（多数浏览器会拒绝，需用户手势，但 Safari/iOS 在某些场景可成功）
  useEffect(() => {
    if (musicOff) return
    const a = audioRef.current
    if (!a) return
    a.play().catch(() => {
      /* 浏览器策略拒绝时静默忽略，等用户首次交互兜底 */
    })
  }, [musicOff])

  // 全局首次用户交互（点击/键盘/触摸）兜底播放，覆盖 iOS Safari 等必须手势的场景
  useEffect(() => {
    if (musicOff) return
    const tryAutoPlay = () => {
      const a = audioRef.current
      if (a && a.paused) {
        a.play()
          .then(() => syncPlaying(true))
          .catch(() => syncPlaying(false))
      }
    }
    const opts: AddEventListenerOptions = { once: true, passive: true, capture: true }
    document.addEventListener('pointerdown', tryAutoPlay, opts)
    document.addEventListener('keydown', tryAutoPlay, opts)
    document.addEventListener('touchstart', tryAutoPlay, opts)
    return () => {
      document.removeEventListener('pointerdown', tryAutoPlay, true)
      document.removeEventListener('keydown', tryAutoPlay, true)
      document.removeEventListener('touchstart', tryAutoPlay, true)
    }
  }, [musicOff, syncPlaying])

  const submitWish = () => {
    if (!wishName.trim() || !wishText.trim()) return
    setWishes((w) => [...w, { name: wishName.trim(), text: wishText.trim(), time: Date.now() }])
    setWishText('')
  }

  const share = async () => {
    const payload = {
      title: `${typeInfo.title} - ${data.nameA}${data.nameB ? ' & ' + data.nameB : ''}`,
      text: data.message.slice(0, 60),
      url: shareUrl,
    }
    try {
      if (navigator.share) {
        await navigator.share(payload)
        return
      }
    } catch {
      /* 用户取消分享 */
    }
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* ignore */
    }
  }

  const weekday = useMemo(() => {
    const d = new Date(`${data.date}T00:00:00`)
    return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('zh-CN', { weekday: 'long' })
  }, [data.date])

  const pages = 6 // 相册 / 故事 / 信息 / 流程 / 留言 / 致谢

  // ==================== 封面 ====================
  if (!opened) {
    return (
      <div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center text-center overflow-hidden"
        style={{ background: theme.gradient, color: '#fff' }}
      >
        {/* 渐变流动叠层 */}
        <div
          className="absolute inset-0 animate-gradient-flow opacity-70"
          style={{ background: `linear-gradient(120deg, ${theme.primary}cc 0%, transparent 45%, ${theme.primary}99 100%)` }}
        />
        {/* 光斑 */}
        <div
          className="absolute -top-32 -left-24 w-96 h-96 rounded-full blur-3xl"
          style={{ background: 'rgba(255,255,255,0.16)', animation: 'soft-breathe 7s ease-in-out infinite' }}
        />
        <div
          className="absolute -bottom-40 -right-24 w-[28rem] h-[28rem] rounded-full blur-3xl"
          style={{ background: 'rgba(255,255,255,0.1)', animation: 'soft-breathe 9s ease-in-out infinite' }}
        />
        <PetalRain shapes={['heart', 'star', 'bubble']} color="rgba(255,255,255,0.6)" count={18} />

        <div className="relative z-10 flex flex-col items-center px-8 max-w-md w-full">
          <div
            className="text-xs tracking-[0.5em] text-white/80 mb-4 animate-rise-in"
            style={{ animationDelay: '0.05s', textShadow: '0 2px 6px rgba(0,0,0,0.2)' }}
          >
            INVITATION
          </div>
          <div className="animate-float-y">
            <div className="text-5xl mb-3 drop-shadow-lg animate-pop-in" style={{ animationDelay: '0.15s' }}>
              {typeInfo.emoji}
            </div>
          </div>
          <h1
            className="text-2xl font-semibold tracking-wide mb-8 animate-pop-in"
            style={{ animationDelay: '0.25s', textShadow: '0 2px 8px rgba(0,0,0,0.2)' }}
          >
            {typeInfo.title}
          </h1>

          <div className="animate-pop-in" style={{ animationDelay: '0.35s' }}>
            <Ornament color="rgba(255,255,255,0.5)" />
          </div>

          <div
            className="text-4xl sm:text-5xl font-serif font-bold leading-relaxed drop-shadow-md animate-pop-in"
            style={{ animationDelay: '0.45s' }}
          >
            {data.nameA || 'XXX'}
            {data.nameB && (
              <>
                <span className="text-3xl px-3 align-middle" style={{ animation: 'heart-beat 1.6s ease-in-out infinite' }}>
                  <Heart className="w-8 h-8 inline text-rose-200" fill="currentColor" />
                </span>
                {data.nameB}
              </>
            )}
          </div>

          <p
            className="mt-8 text-white/95 text-sm sm:text-base tracking-wide animate-rise-in"
            style={{ animationDelay: '0.6s', textShadow: '0 2px 8px rgba(0,0,0,0.25)' }}
          >
            {data.date || '____'}
            {weekday && ` · ${weekday}`}
            {data.time && ` · ${data.time}`}
          </p>

          <button
            onClick={openInvitation}
            className="mt-12 px-12 py-4 rounded-full bg-white/15 backdrop-blur-xl border border-white/40 text-lg font-medium tracking-[0.3em] hover:bg-white/25 hover:scale-110 active:scale-95 transition-all shadow-2xl animate-bounce-soft"
          >
            轻触开启
          </button>

          <p className="mt-8 text-xs text-white/70 tracking-widest">一 封 来 自 我 们 的 邀 请 一</p>

          {typeof views === 'number' && views >= 0 && (
            <p className="mt-3 text-[11px] text-white/60 tracking-widest animate-rise-in" style={{ animationDelay: '1s' }}>
              💌 已有 {views} 人看过这份请柬
            </p>
          )}
        </div>
      </div>
    )
  }

  // ==================== 正文（多屏滑动） ====================
  const photoCount = data.photos.length
  const mapUrl = buildMapUrl(data.venue, data.address)

  return (
    <div className="fixed inset-0 z-50" style={{ background: theme.cardBg }}>
      {/* 背景音乐：内置歌单轮播 + 切换/关闭 */}
      <audio
        key={trackIndex}
        ref={audioRef}
        src={current.src}
        preload="auto"
        className="hidden"
        onEnded={() => changeTrack(1)}
        onPlaying={() => syncPlaying(true)}
        onPause={() => syncPlaying(false)}
        onError={() => syncPlaying(false)}
      />
      {musicOff ? (
        <button
          onClick={turnOnMusic}
          className="fixed bottom-6 right-5 z-[60] flex h-10 w-10 items-center justify-center rounded-full shadow-lg opacity-70 transition-opacity hover:opacity-100"
          style={{ background: theme.primary, color: '#fff' }}
          title="开启音乐"
          aria-label="开启音乐"
        >
          <Music2 className="h-4 w-4" />
        </button>
      ) : (
        <div className="fixed bottom-6 right-5 z-[60] flex flex-col items-end gap-2">
          <div
            className="w-60 rounded-2xl p-3.5 text-white shadow-2xl border border-white/20"
            style={{ background: `${theme.primaryDark}e6`, backdropFilter: 'blur(14px)' }}
          >
            <div className="mb-2.5 flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="text-[10px] uppercase tracking-widest text-white/55">♪ 背景音乐</div>
                <div className="truncate text-sm font-semibold">{current.name}</div>
                {current.artist && (
                  <div className="truncate text-[11px] text-white/65">{current.artist}</div>
                )}
              </div>
              <span className={`text-lg ${musicPlaying ? 'animate-wiggle' : 'opacity-60'}`}>🎵</span>
            </div>
            <div className="flex items-center justify-between">
              <button
                onClick={() => changeTrack(-1)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 transition-colors hover:bg-white/25"
                aria-label="上一首"
                title="上一首"
              >
                <SkipBack className="h-4 w-4" />
              </button>
              <button
                onClick={toggleMusic}
                className="flex h-11 w-11 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-105"
                style={{ background: theme.primary, color: '#fff' }}
                aria-label={musicPlaying ? '暂停' : '播放'}
                title={musicPlaying ? '暂停音乐' : '播放音乐'}
              >
                {musicPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </button>
              <button
                onClick={() => changeTrack(1)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 transition-colors hover:bg-white/25"
                aria-label="下一首"
                title="下一首"
              >
                <SkipForward className="h-4 w-4" />
              </button>
              <button
                onClick={turnOffMusic}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white/70 transition-colors hover:bg-white/25 hover:text-white"
                aria-label="关闭音乐"
                title="关闭音乐"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 顶部浮动操作条 */}
      <div
        className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] w-[92%] max-w-md flex items-center justify-between gap-2 rounded-full px-4 py-2 text-white text-sm shadow-lg"
        style={{ background: `${theme.primaryDark}cc`, backdropFilter: 'blur(12px)' }}
      >
        <button onClick={onBack} className="inline-flex items-center gap-1.5 hover:opacity-80 transition-opacity">
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">返回编辑</span>
        </button>
        <button
          onClick={share}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Share2 className="w-4 h-4" />}
          {copied ? '已复制' : '分享请柬'}
        </button>
      </div>

      {/* 右侧页点指示 */}
      <div className="fixed right-3 top-1/2 -translate-y-1/2 z-[60] flex flex-col gap-2">
        {Array.from({ length: pages }).map((_, i) => (
          <span
            key={i}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              activePage === i ? 'scale-125' : 'opacity-40'
            }`}
            style={{
              background: activePage === i ? theme.primary : theme.primaryDark,
              boxShadow: activePage === i ? `0 0 10px ${theme.primary}88` : 'none',
              transform: activePage === i ? 'scale(1.35)' : 'scale(1)',
            }}
          />
        ))}
      </div>

      {/* 滑动容器 */}
      <div
        ref={scrollerRef}
        onScroll={onScroll}
        className="h-full overflow-y-auto"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {/* ============ 屏 1：照片墙（竖排平铺 · 淘宝详情式） ============ */}
        {photoCount > 0 ? (
          <section data-page={0}>
            {/* 吸顶标题 */}
            <div
              className="sticky top-0 z-20 px-6 pt-20 pb-5 text-center"
              style={{
                background: `linear-gradient(to bottom, ${theme.cardBg}, ${theme.cardBg}ee 70%, transparent)`,
              }}
            >
              <div className="text-xs tracking-[0.5em] mb-2 animate-rise-in" style={{ color: theme.primary }}>
                GALLERY
              </div>
              <h2 className="text-2xl font-serif font-bold animate-pop-in" style={{ color: theme.primaryDark }}>
                {typeInfo.emoji} 最美瞬间
              </h2>
              <Ornament color={theme.primary} />
            </div>

            {/* 爱心照片墙：精选照片拼成爱心（互不重叠），其余照片平铺；点击查看大图+简介 */}
            <Reveal>
              <HeartPhotoWall
                photos={data.photos}
                accent={theme.primary}
                captions={data.photoCaptions}
                featuredIndexes={data.featuredIndexes}
              />
            </Reveal>

            <p className="text-center text-xs mt-5 pb-10 animate-float-y" style={{ color: theme.cardSub }}>
              💖 点击照片可查看大图与简介，继续下滑查看故事与更多 ✨
            </p>
          </section>
        ) : (
          <section data-page={0} className="min-h-full flex flex-col justify-center px-6 py-16">
            <div className="max-w-md mx-auto w-full">
              <Reveal>
                <div className="text-center">
                  <div className="text-xs tracking-[0.5em] text-center mb-2 animate-rise-in" style={{ color: theme.primary }}>
                    GALLERY
                  </div>
                  <h2 className="text-2xl font-serif font-bold text-center animate-pop-in" style={{ color: theme.primaryDark }}>
                    {typeInfo.emoji} 最美瞬间
                  </h2>
                  <Ornament color={theme.primary} />
                </div>
              </Reveal>
              <Reveal delay={150}>
                <div
                  className="rounded-3xl p-8 text-center animate-bounce-soft"
                  style={{ background: theme.softBg }}
                >
                  <div className="text-5xl mb-3 animate-float-y">{typeInfo.emoji}</div>
                  <p className="text-sm leading-relaxed" style={{ color: theme.cardText }}>
                    相册尚未添加，可在制作页上传照片墙
                  </p>
                </div>
              </Reveal>
            </div>
          </section>
        )}

        {/* ============ 屏 2：我们的故事 ============ */}
        {data.story && (
          <section data-page={1} className="min-h-full flex flex-col justify-center px-6 py-16">
            <div className="max-w-md mx-auto w-full">
              <Reveal>
                <div className="text-center">
                  <div className="text-xs tracking-[0.5em] mb-2" style={{ color: theme.primary }}>
                    OUR STORY
                  </div>
                  <h2 className="text-2xl font-serif font-bold animate-pop-in" style={{ color: theme.primaryDark }}>
                    {data.nameA && data.nameB ? `${data.nameA} & ${data.nameB} 的故事` : '我们的故事'}
                  </h2>
                  <Ornament color={theme.primary} />
                </div>
              </Reveal>
              <Reveal delay={150}>
                <div
                  className="rounded-3xl p-7 shadow-lg border"
                  style={{ background: '#fff', borderColor: `${theme.primary}22` }}
                >
                  <span className="text-5xl font-serif leading-none" style={{ color: theme.primary }}>
                    “
                  </span>
                  <p
                    className="mt-1 text-[15px] leading-8 whitespace-pre-line font-serif"
                    style={{ color: theme.cardText }}
                  >
                    {data.story}
                  </p>
                  <div className="mt-5 flex items-center justify-end gap-2 text-sm" style={{ color: theme.primary }}>
                    —— {data.nameA || '我们'}
                    {data.nameB && ` & ${data.nameB}`}
                  </div>
                </div>
              </Reveal>
            </div>
          </section>
        )}

        {/* ============ 屏 3：婚礼信息 ============ */}
        <section data-page={2} className="min-h-full flex flex-col justify-center px-6 py-16">
          <div className="max-w-md mx-auto w-full">
            <Reveal>
              <div className="text-center">
                <div className="text-xs tracking-[0.5em] mb-2" style={{ color: theme.primary }}>
                  WEDDING INFO
                </div>
                <h2 className="text-2xl font-serif font-bold animate-pop-in" style={{ color: theme.primaryDark }}>
                  {typeInfo.emoji} {typeInfo.label}信息
                </h2>
                <Ornament color={theme.primary} />
              </div>
            </Reveal>

            <Reveal delay={120}>
              <div
                className="rounded-3xl p-7 shadow-lg border"
                style={{ background: '#fff', borderColor: `${theme.primary}22` }}
              >
                <div className="space-y-5">
                  <div className="flex items-center gap-4">
                    <span
                      className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
                      style={{ background: theme.softBg, color: theme.primary }}
                    >
                      <Calendar className="w-5 h-5" />
                    </span>
                    <div>
                      <div className="text-xs" style={{ color: theme.cardSub }}>
                        良辰吉日
                      </div>
                      <div className="font-semibold" style={{ color: theme.cardText }}>
                        {data.date || '____'}
                        {weekday && <span className="font-normal ml-1 text-sm" style={{ color: theme.cardSub }}>{weekday}</span>}
                      </div>
                    </div>
                  </div>

                  {data.time && (
                    <div className="flex items-center gap-4">
                      <span
                        className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
                        style={{ background: theme.softBg, color: theme.primary }}
                      >
                        <Clock className="w-5 h-5" />
                      </span>
                      <div>
                        <div className="text-xs" style={{ color: theme.cardSub }}>
                          吉时
                        </div>
                        <div className="font-semibold" style={{ color: theme.cardText }}>
                          {data.time}
                        </div>
                      </div>
                    </div>
                  )}

                  {(data.venue || data.address) && (
                    <div className="flex items-center gap-4">
                      <span
                        className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
                        style={{ background: theme.softBg, color: theme.primary }}
                      >
                        <MapPin className="w-5 h-5" />
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs" style={{ color: theme.cardSub }}>
                          婚宴地点
                        </div>
                        <div className="font-semibold truncate" style={{ color: theme.cardText }}>
                          {data.venue || data.address}
                        </div>
                        {data.venue && data.address && (
                          <div className="text-xs mt-0.5 truncate" style={{ color: theme.cardSub }}>
                            {data.address}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {(data.venue || data.address) && (
                  <a
                    href={mapUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-6 w-full inline-flex items-center justify-center gap-2 py-3 rounded-2xl text-white font-semibold hover:opacity-90 transition-opacity"
                    style={{ background: theme.primary }}
                  >
                    查看地图导航
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </Reveal>

            {/* 倒计时 */}
            {data.showCountdown && countdown && (
              <Reveal delay={220}>
                <div className="mt-8">
                  <p className="text-center text-sm mb-3 tracking-widest" style={{ color: theme.cardSub }}>
                    {countdown.passed ? `${typeInfo.label}正在进行中` : `距${typeInfo.label}还有`}
                  </p>
                  {!countdown.passed && (
                    <div className="flex justify-center gap-3">
                      {[
                        { v: countdown.days, label: '天' },
                        { v: countdown.hours, label: '时' },
                        { v: countdown.minutes, label: '分' },
                        { v: countdown.seconds, label: '秒' },
                      ].map((it) => (
                        <div
                          key={it.label}
                          className="w-16 rounded-2xl py-3 shadow-md border text-center"
                          style={{ background: '#fff', borderColor: `${theme.primary}22` }}
                        >
                          <div className="text-2xl font-bold tabular-nums" style={{ color: theme.primaryDark }}>
                            <span key={it.v} className="inline-block animate-tick">{it.v}</span>
                          </div>
                          <div className="text-xs mt-1" style={{ color: theme.cardSub }}>
                            {it.label}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Reveal>
            )}
          </div>
        </section>

        {/* ============ 屏 4：宴会流程 ============ */}
        {data.timeline.length > 0 && (
          <section data-page={3} className="min-h-full flex flex-col justify-center px-6 py-16">
            <div className="max-w-md mx-auto w-full">
              <Reveal>
                <div className="text-center">
                  <div className="text-xs tracking-[0.5em] mb-2" style={{ color: theme.primary }}>
                    SCHEDULE
                  </div>
                  <h2 className="text-2xl font-serif font-bold animate-pop-in" style={{ color: theme.primaryDark }}>
                    🕊 宴会流程
                  </h2>
                  <Ornament color={theme.primary} />
                </div>
              </Reveal>

              <Reveal delay={150}>
                <div className="relative pl-8">
                  {/* 时间轴竖线 */}
                  <span
                    className="absolute left-[11px] top-2 bottom-2 w-px"
                    style={{ background: `${theme.primary}40` }}
                  />
                  <div className="space-y-7">
                    {data.timeline.map((item, i) => (
                      <div key={i} className="relative">
                        <span
                          className="absolute -left-8 top-1.5 w-[23px] h-[23px] rounded-full border-4 flex items-center justify-center"
                          style={{ background: '#fff', borderColor: theme.primary }}
                        />
                        <div
                          className="rounded-2xl p-4 shadow-sm border"
                          style={{ background: '#fff', borderColor: `${theme.primary}1e` }}
                        >
                          <div className="flex items-baseline gap-2">
                            <span className="font-bold text-lg tabular-nums" style={{ color: theme.primary }}>
                              {item.time}
                            </span>
                            <span className="font-semibold text-sm" style={{ color: theme.cardText }}>
                              {item.title}
                            </span>
                          </div>
                          {item.desc && (
                            <p className="mt-1 text-xs leading-relaxed" style={{ color: theme.cardSub }}>
                              {item.desc}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>
            </div>
          </section>
        )}

        {/* ============ 屏 5：留言祝福 ============ */}
        <section data-page={4} className="min-h-full flex flex-col justify-center px-6 py-16">
          <div className="max-w-md mx-auto w-full">
            <Reveal>
              <div className="text-center">
                <div className="text-xs tracking-[0.5em] mb-2" style={{ color: theme.primary }}>
                  BLESSINGS
                </div>
                <h2 className="text-2xl font-serif font-bold animate-pop-in" style={{ color: theme.primaryDark }}>
                  💌 祝福留言
                </h2>
                <Ornament color={theme.primary} />
              </div>
            </Reveal>

            <Reveal delay={120}>
              <div
                className="rounded-3xl p-6 shadow-lg border"
                style={{ background: '#fff', borderColor: `${theme.primary}22` }}
              >
                <div className="space-y-3 mb-5 max-h-52 overflow-y-auto pr-1">
                  {wishes.length === 0 && (
                    <p className="text-sm text-center py-3" style={{ color: theme.cardSub }}>
                      还没有留言，来送上你的祝福吧～
                    </p>
                  )}
                  {wishes.map((w, i) => (
                    <div
                      key={i}
                      className="rounded-xl p-3"
                      style={{ background: theme.softBg }}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-sm font-semibold" style={{ color: theme.cardText }}>
                          <Heart className="w-3.5 h-3.5 inline mr-1" fill="currentColor" style={{ color: theme.primary }} />
                          {w.name}
                        </span>
                        <span className="text-xs" style={{ color: theme.cardSub }}>
                          {new Date(w.time).toLocaleDateString('zh-CN')}
                        </span>
                      </div>
                      <p className="text-sm break-words" style={{ color: theme.cardText }}>
                        {w.text}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="space-y-2.5">
                  <input
                    className="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none"
                    style={{
                      background: theme.softBg,
                      borderColor: `${theme.primary}30`,
                      color: theme.cardText,
                    }}
                    placeholder="你的名字"
                    value={wishName}
                    onChange={(e) => setWishName(e.target.value)}
                    maxLength={20}
                  />
                  <textarea
                    className="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none resize-none"
                    style={{
                      background: theme.softBg,
                      borderColor: `${theme.primary}30`,
                      color: theme.cardText,
                    }}
                    placeholder="送上你的祝福…"
                    value={wishText}
                    onChange={(e) => setWishText(e.target.value)}
                    maxLength={120}
                    rows={2}
                  />
                  <button
                    onClick={submitWish}
                    className="w-full py-2.5 rounded-xl text-white font-semibold text-sm transition-opacity hover:opacity-90"
                    style={{ background: theme.primary }}
                  >
                    送出祝福
                  </button>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ============ 屏 6：致谢 ============ */}
        <section
          data-page={5}
          className="min-h-full flex flex-col justify-center px-6 py-16 text-center relative overflow-hidden"
          style={{ background: theme.gradient, color: '#fff' }}
        >
          {/* 渐变流动叠层 + 光斑 */}
          <div
            className="absolute inset-0 animate-gradient-flow opacity-70"
            style={{ background: `linear-gradient(120deg, ${theme.primary}cc 0%, transparent 45%, ${theme.primary}99 100%)` }}
          />
          <div
            className="absolute -top-24 -right-20 w-72 h-72 rounded-full blur-3xl"
            style={{ background: 'rgba(255,255,255,0.14)', animation: 'soft-breathe 8s ease-in-out infinite' }}
          />
          <div
            className="absolute -bottom-24 -left-20 w-80 h-80 rounded-full blur-3xl"
            style={{ background: 'rgba(255,255,255,0.1)', animation: 'soft-breathe 6s ease-in-out infinite' }}
          />
          <PetalRain shapes={['heart', 'star']} color="rgba(255,255,255,0.5)" count={14} />
          <div className="relative z-10 max-w-md mx-auto w-full">
            <Reveal>
              <div className="text-5xl mb-4 animate-float-y">{typeInfo.emoji}</div>
              <div className="text-xs tracking-[0.5em] text-white/70 mb-3">THANK YOU</div>
              <h2 className="text-2xl font-serif font-bold mb-6 animate-pop-in">感 谢 光 临</h2>
            </Reveal>

            <Reveal delay={150}>
              <p className="text-white/90 leading-8 font-serif whitespace-pre-line mb-8">
                {data.message || typeInfo.invite}
              </p>
              <Ornament color="rgba(255,255,255,0.5)" />
              <p className="text-white/80 text-sm leading-relaxed mb-8">
                {typeInfo.invite}
                {data.host && (
                  <span className="block mt-4 text-white font-semibold text-base">{data.host} 敬邀</span>
                )}
              </p>
            </Reveal>

            <Reveal delay={260}>
              <Link
                to="/invitation"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/15 hover:bg-white/25 text-sm font-semibold transition-colors backdrop-blur"
              >
                <Wand2 className="w-4 h-4" />
                我也要制作电子请柬
              </Link>
              <div className="mt-10 text-xs text-white/40 flex items-center justify-center gap-1">
                Made with <Heart className="w-3 h-3 text-rose-300" fill="currentColor" /> DevTools Hub
              </div>
            </Reveal>
          </div>
        </section>
      </div>
    </div>
  )
}

export default InvitationView
