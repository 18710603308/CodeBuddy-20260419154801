import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Calendar, Check, ChevronDown, ChevronUp, Clock, Download, ExternalLink, Heart, Link2, MapPin,
  Music2, Pause, Play, Share2, SkipBack, SkipForward, Wand2, X,
} from 'lucide-react'
import QRCode from 'qrcode'
import {
  ART_WORDS_DEFAULT, BLESSINGS_DEFAULT, INVITATION_TYPES, buildMapUrl, buildShareUrl, getTheme,
} from '../../data/invitation'
import type { InvitationData } from '../../data/invitation'
import { INVITATION_PLAYLIST } from '../../data/invitationMusic'
import { getInvitationStyle, getRandomInvitationStyle } from '../../data/invitationStyles'
import { getInvitationLayout, getRandomInvitationLayout, getRandomPhotoVariant } from '../../data/invitationLayouts'
import type { InvitationLayout, SectionVariant } from '../../data/invitationLayouts'
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
    let done = false
    const show = () => {
      if (done) return
      done = true
      setShown(true)
    }
    // 兜底②：无论 observer 是否触发，超时后强制显示（彻底杜绝白页）
    const force = setTimeout(show, 1000 + delay)
    // 兜底①：元素已在视口内 → 立即显示（避免「白页」）
    const rect = el.getBoundingClientRect()
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      const t = setTimeout(show, delay)
      return () => {
        clearTimeout(t)
        clearTimeout(force)
      }
    }
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          show()
          obs.disconnect()
        }
      },
      { threshold: 0.05, rootMargin: '0px 0px -5% 0px' }
    )
    obs.observe(el)
    return () => {
      obs.disconnect()
      clearTimeout(force)
    }
  }, [delay])
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        shown ? 'opacity-100' : 'opacity-0 translate-y-10 scale-95'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

// ==================== 照片兜底 ====================
/** 照片加载失败/后端不可用时的占位图（渐变 + 囍），避免白块 */
const PHOTO_FALLBACK =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='500'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#fde8e4'/><stop offset='1' stop-color='#f6c9c0'/></linearGradient></defs><rect width='400' height='500' fill='url(#g)'/><text x='50%' y='52%' font-size='72' text-anchor='middle' fill='#d98a80' font-family='serif'>囍</text></svg>`
  )

function handleImgError(e: React.SyntheticEvent<HTMLImageElement>) {
  const t = e.currentTarget
  if (t.src !== PHOTO_FALLBACK) t.src = PHOTO_FALLBACK
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

/** 区块标题：随布局变体（center 居中 / leftline 左对齐竖线 / chapter 章回序号 / badge 圆点花边） */
function SectionHeading({
  label,
  title,
  style: variant,
  primary,
  titleFont,
  dark = false,
}: {
  label: string
  title: string
  style: SectionVariant
  primary: string
  titleFont: string
  dark?: boolean
}) {
  const titleColor = dark ? '#fff' : primary
  if (variant === 'leftline') {
    return (
      <div className="text-left">
        <div className="text-xs tracking-[0.5em] mb-1 animate-rise-in" style={{ color: primary }}>
          {label}
        </div>
        <div className="flex items-center gap-3">
          <span className="w-1 h-7 rounded-full shrink-0" style={{ background: primary }} />
          <h2 className="text-2xl font-serif font-bold animate-pop-in" style={{ color: titleColor, fontFamily: titleFont }}>
            {title}
          </h2>
        </div>
        <div className="mt-3 h-px w-full" style={{ background: `${primary}40` }} />
      </div>
    )
  }
  if (variant === 'chapter') {
    return (
      <div>
        <div className="text-xs tracking-[0.5em] mb-2 animate-rise-in" style={{ color: primary }}>
          {label}
        </div>
        <div className="flex items-center justify-center gap-3">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold"
            style={{ background: dark ? 'rgba(255,255,255,0.18)' : `${primary}1a`, color: titleColor }}
          >
            <Heart className="h-4 w-4" fill="currentColor" />
          </span>
          <h2 className="text-2xl font-serif font-bold animate-pop-in" style={{ color: titleColor, fontFamily: titleFont }}>
            {title}
          </h2>
        </div>
        <div className="mt-3 flex items-center justify-center gap-2">
          <span className="h-px w-16" style={{ background: `${primary}55` }} />
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: primary }} />
          <span className="h-px w-16" style={{ background: `${primary}55` }} />
        </div>
      </div>
    )
  }
  if (variant === 'badge') {
    return (
      <div>
        <div className="text-xs tracking-[0.5em] mb-2 animate-rise-in" style={{ color: primary }}>
          {label}
        </div>
        <div className="flex items-center justify-center gap-2">
          <span className="h-px flex-1 max-w-12" style={{ background: `${primary}44` }} />
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: primary }} />
          <h2 className="px-2 text-2xl font-serif font-bold animate-pop-in" style={{ color: titleColor, fontFamily: titleFont }}>
            {title}
          </h2>
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: primary }} />
          <span className="h-px flex-1 max-w-12" style={{ background: `${primary}44` }} />
        </div>
        <div className="mt-2 flex items-center justify-center gap-3">
          <span className="h-px w-14" style={{ background: `${primary}44` }} />
          <span className="h-1 w-1 rounded-full" style={{ background: primary }} />
          <span className="h-px w-14" style={{ background: `${primary}44` }} />
        </div>
      </div>
    )
  }
  // center 经典居中
  return (
    <div>
      <div className="text-[10px] tracking-[0.65em] mb-2 animate-rise-in" style={{ color: primary, opacity: 0.8 }}>
        {label}
      </div>
      <div className="flex items-center justify-center gap-3">
        <span className="h-px w-10" style={{ background: `${primary}55` }} />
        <span className="text-sm" style={{ color: primary, opacity: 0.7 }}>❀</span>
        <span className="h-px w-10" style={{ background: `${primary}55` }} />
      </div>
      <h2
        className="mt-3 text-3xl font-bold tracking-[0.18em] animate-pop-in"
        style={{ color: titleColor, fontFamily: titleFont, textShadow: `0 1px 0 ${primary}22` }}
      >
        {title}
      </h2>
    </div>
  )
}

// ==================== 浏览页主组件 ====================
export function InvitationView({
  data,
  views,
}: {
  data: InvitationData
  views?: number
}) {
  const [opened, setOpened] = useState(false)
  const [copied, setCopied] = useState(false)
  const [musicPlaying, setMusicPlaying] = useState(false)
  const playingRef = useRef(false)
  /** 用户手动暂停标记：防止全局交互兜底在用户主动暂停后又自动播放 */
  const userPausedRef = useRef(false)
  const [musicOff, setMusicOff] = useState<boolean>(() => {
    try {
      return localStorage.getItem('inv-music-off') === '1'
    } catch {
      return false
    }
  })
  const [trackIndex, setTrackIndex] = useState(0)
  /** 音乐面板展开状态：默认收起（仅小圆钮，音乐照常播放） */
  const [musicExpanded, setMusicExpanded] = useState(false)
  /** 网格/瀑布流照片墙的大图预览下标（null = 未打开） */
  const [photoPreview, setPhotoPreview] = useState<number | null>(null)
  /** 分享二维码弹层开关与生成的 dataURL */
  const [showQr, setShowQr] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState('')
  const audioRef = useRef<HTMLAudioElement>(null)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [activePage, setActivePage] = useState(0)

  const [searchParams] = useSearchParams()
  // 同一链接每次打开随机进入一种艺术风格（样式随动：色板/字体/装饰/圆角）；?s=<id> 可固定指定
  const artStyle = useMemo(() => {
    const sid = searchParams.get('s')
    return (sid && getInvitationStyle(sid)) || getRandomInvitationStyle()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  // 布局与配色正交随机：10 布局 × 10 配色 = 100 种组合；?l=<id> 可固定布局
  const layout: InvitationLayout = useMemo(() => {
    const lid = searchParams.get('l')
    return (lid && getInvitationLayout(lid)) || getRandomInvitationLayout()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  // 照片墙变体（18 期）：?l= 固定时跟随布局定义，否则独立随机 —— 每次打开照片墙都可能是 14 种之一
  const photoVariant = useMemo(() => {
    const lid = searchParams.get('l')
    return (lid && layout.photo) || getRandomPhotoVariant()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  // 吉祥数照片墙（18 期）：优先展示 6/8/9/10 张，其余折叠，可展开查看全部
  const AUSPICIOUS_COUNTS = [6, 8, 9, 10]
  const maxShow = useMemo(() => {
    const n = data.photos.length
    if (n <= 6) return n
    const ok = AUSPICIOUS_COUNTS.filter((x) => x <= n)
    return ok[ok.length - 1] // 取不超过总张数的最大吉祥数
  }, [data.photos.length])
  const [photosExpanded, setPhotosExpanded] = useState(false)
  const displayPhotos = useMemo(
    () => (photosExpanded ? data.photos : data.photos.slice(0, maxShow)),
    [data.photos, photosExpanded, maxShow]
  )
  const coverText = artStyle.coverText ?? '#fff'
  /** 主题色板：原主题为基础，被随机艺术风格色板覆盖 → 整页颜色随动 */
  const theme = { ...getTheme(data.themeId), ...artStyle.colors }
  /** 封面视频背景（风格绑定素材随机选一，固定一次避免重渲染换视频） */
  const coverVideo = useMemo(() => {
    const v = artStyle.video
    if (!v || v.length === 0) return null
    return v[Math.floor(Math.random() * v.length)]
  }, [artStyle])
  const typeInfo = INVITATION_TYPES[data.type]
  const shareUrl = useMemo(() => buildShareUrl(data, window.location.origin), [data])

  // 分享二维码：打开弹层时异步生成
  // 内容优先短链 /invitation?id=xxx（后端短 ID 模式）；?d= 长链时按长度自适应容错级别
  // （H=1273 / M=2331 / L=2953 字节上限，QRCode.toDataURL 数据超容量会抛错）
  useEffect(() => {
    if (!showQr) return
    let cancelled = false
    const inviteId = searchParams.get('id')
    const target = inviteId
      ? `${window.location.origin}/invitation?id=${inviteId}`
      : shareUrl
    const level: 'L' | 'M' | 'H' =
      target.length <= 200 ? 'H' : target.length <= 1800 ? 'M' : 'L'
    QRCode.toDataURL(target, {
      errorCorrectionLevel: level,
      width: 480,
      margin: 1,
      color: { dark: theme.primaryDark, light: '#ffffff' },
    })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url)
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl('')
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showQr, shareUrl])

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
    userPausedRef.current = false
    const a = audioRef.current
    if (!a) return
    a.play()
      .then(() => syncPlaying(true))
      .catch(() => syncPlaying(false))
  }, [syncPlaying])

  const pauseMusic = useCallback(() => {
    userPausedRef.current = true
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
    setMusicExpanded(false)
    try {
      localStorage.setItem('inv-music-off', '1')
    } catch {
      /* ignore */
    }
  }, [pauseMusic])

  const turnOnMusic = useCallback(() => {
    setMusicOff(false)
    setMusicExpanded(false)
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

  // 全局用户交互（点击/键盘/触摸）兜底播放，覆盖 iOS Safari 等必须手势的场景；
  // 音乐元素始终挂载（封面页也在），首次"轻触开启"点击即在手势内完成播放。
  // 用户手动暂停过（userPausedRef）则不再自动播放，尊重用户意愿。
  useEffect(() => {
    if (musicOff) return
    const tryAutoPlay = () => {
      const a = audioRef.current
      if (a && a.paused && !userPausedRef.current) {
        a.play()
          .then(() => syncPlaying(true))
          .catch(() => syncPlaying(false))
      }
    }
    const opts: AddEventListenerOptions = { passive: true, capture: true }
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

  const weekday = useMemo(() => {
    const d = new Date(`${data.date}T00:00:00`)
    return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('zh-CN', { weekday: 'long' })
  }, [data.date])

  const pages = 6 // 相册 / 故事 / 信息 / 流程 / 留言 / 致谢

  // ==================== 封面（10 种布局变体，与配色随机组合） ====================
  const softBorder = coverText === '#fff' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.32)'
  const softBorderStrong = coverText === '#fff' ? 'rgba(255,255,255,0.72)' : 'rgba(0,0,0,0.45)'
  const coverShadow = coverVideo
    ? '0 2px 14px rgba(0,0,0,0.6), 0 0 30px rgba(0,0,0,0.3)'
    : '0 2px 8px rgba(0,0,0,0.2)'

  const brandEl = (
    <div className="text-xs tracking-[0.5em] animate-rise-in" style={{ color: coverText, opacity: 0.85, animationDelay: '0.05s', textShadow: coverShadow }}>
      INVITATION
    </div>
  )
  const emojiEl = (
    <div className="animate-float-y">
      <div className="text-5xl drop-shadow-lg animate-pop-in" style={{ animationDelay: '0.15s' }}>{typeInfo.emoji}</div>
    </div>
  )
  /** 封面动态标题：用新人名字生成独特 title（二十二期） */
  const dynamicTitle = useMemo(
    () =>
      data.nameB
        ? `${data.nameA} & ${data.nameB} 的${typeInfo.label}`
        : `${data.nameA || 'TA'} 的${typeInfo.label}`,
    [data.nameA, data.nameB, typeInfo.label]
  )

  const titleEl = (
    <h1
      className="max-w-[88vw] text-2xl font-semibold tracking-wide animate-pop-in"
      style={{ fontFamily: artStyle.titleFont, animationDelay: '0.25s', textShadow: coverShadow }}
    >
      {dynamicTitle}
    </h1>
  )
  const namesEl = (
    <div className="text-4xl sm:text-5xl font-bold leading-relaxed animate-pop-in" style={{ fontFamily: artStyle.titleFont, animationDelay: '0.35s', textShadow: coverShadow }}>
      {data.nameA || 'XXX'}
      {data.nameB && (
        <>
          <span className="text-3xl px-3 align-middle" style={{ animation: 'heart-beat 1.6s ease-in-out infinite' }}>
            <Heart className="w-8 h-8 inline" fill="currentColor" style={{ color: coverText === '#fff' ? '#ffe4e6' : coverText }} />
          </span>
          {data.nameB}
        </>
      )}
    </div>
  )
  const namesBigEl = (
    <div className="text-5xl sm:text-6xl font-bold leading-tight animate-pop-in" style={{ fontFamily: artStyle.titleFont, animationDelay: '0.3s', textShadow: coverShadow }}>
      {data.nameA || 'XXX'}
      {data.nameB && (
        <>
          <span className="text-3xl px-3 align-middle" style={{ animation: 'heart-beat 1.6s ease-in-out infinite' }}>
            <Heart className="w-8 h-8 inline" fill="currentColor" style={{ color: coverText === '#fff' ? '#ffe4e6' : coverText }} />
          </span>
          {data.nameB}
        </>
      )}
    </div>
  )
  const taglineEl = (
    <div className="mt-5 font-serif text-sm tracking-[0.28em] animate-rise-in" style={{ fontFamily: artStyle.titleFont, color: coverText, opacity: 0.8, animationDelay: '0.45s' }}>
      {artStyle.tagline}
    </div>
  )
  const ornamentEl = (
    <div className="animate-pop-in" style={{ animationDelay: '0.5s' }}>
      <Ornament color={softBorder} />
    </div>
  )
  const dateText = (
    <>
      {data.date || '____'}
      {weekday && ` · ${weekday}`}
      {data.time && ` · ${data.time}`}
    </>
  )
  const dateEl = (
    <p className="mt-6 text-sm sm:text-base tracking-wide animate-rise-in" style={{ color: coverText, opacity: 0.95, animationDelay: '0.6s', textShadow: coverShadow }}>
      {dateText}
    </p>
  )
  const buttonEl = (withMargin = true) => (
    <button
      onClick={openInvitation}
      className={`${withMargin ? 'mt-12 ' : ''}px-12 py-4 rounded-full text-lg font-medium tracking-[0.3em] hover:scale-110 active:scale-95 transition-all shadow-2xl animate-bounce-soft ${
        artStyle.coverButtonCls ?? 'bg-white/15 backdrop-blur-xl border border-white/40 hover:bg-white/25'
      }`}
    >
      轻触开启
    </button>
  )
  const footerEl = (
    <>
      <p className="mt-8 text-xs tracking-widest" style={{ color: coverText, opacity: 0.75 }}>
        一 封 来 自 我 们 的 邀 请 一
      </p>
      {typeof views === 'number' && views >= 0 && (
        <p className="mt-3 text-[11px] tracking-widest animate-rise-in" style={{ color: coverText, opacity: 0.6, animationDelay: '1s' }}>
          💌 已有 {views} 人看过这份请柬
        </p>
      )}
    </>
  )

  /** 依据布局变体渲染封面主体（各变体排版差异明显） */
  const coverInner = (() => {
    switch (layout.cover) {
      case 'elegant':
        return (
          <div className="flex w-full flex-1 flex-col">
            <div className="flex flex-col items-center gap-3 pt-14">{brandEl}{emojiEl}{titleEl}</div>
            <div className="flex flex-1 flex-col items-center justify-center">
              {namesEl}
              {taglineEl}
              {ornamentEl}
            </div>
            <div className="flex items-end justify-between gap-4 pb-10">
              <p className="text-left text-sm sm:text-base tracking-wide" style={{ color: coverText, opacity: 0.95 }}>
                {dateText}
              </p>
              {buttonEl(false)}
            </div>
            {footerEl}
          </div>
        )
      case 'vertical':
        return (
          <div className="flex w-full flex-1 flex-col items-center">
            <div className="flex flex-col items-center gap-3 pt-12">{brandEl}{titleEl}</div>
            <div className="flex flex-1 items-center justify-center gap-7">
              {data.nameA && (
                <div className="text-3xl font-bold leading-loose" style={{ writingMode: 'vertical-rl', fontFamily: artStyle.titleFont, textShadow: coverShadow }}>
                  {data.nameA}
                </div>
              )}
              <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 text-3xl animate-float-y" style={{ borderColor: softBorderStrong, color: coverText, fontFamily: artStyle.titleFont }}>
                {artStyle.stamp}
              </div>
              {data.nameB && (
                <div className="text-3xl font-bold leading-loose" style={{ writingMode: 'vertical-rl', fontFamily: artStyle.titleFont, textShadow: coverShadow }}>
                  {data.nameB}
                </div>
              )}
            </div>
            {taglineEl}
            <div className="flex flex-col items-center pb-10">{dateEl}{buttonEl()}{footerEl}</div>
          </div>
        )
      case 'minimal':
        return (
          <div className="flex w-full flex-1 flex-col items-center justify-center">
            {namesBigEl}
            {taglineEl}
            {dateEl}
            {buttonEl()}
            {footerEl}
          </div>
        )
      case 'grand':
        return (
          <div className="flex w-full flex-1 flex-col items-center justify-center">
            {brandEl}
            <div className="mt-4">{titleEl}</div>
            <div className="mt-10">{namesBigEl}</div>
            <div className="my-8 w-64 border-t-2 border-b-2 py-1" style={{ borderColor: softBorderStrong }} />
            {taglineEl}
            {dateEl}
            {buttonEl()}
            {footerEl}
          </div>
        )
      case 'frame':
        return (
          <div className="flex w-full flex-1 flex-col items-center justify-center">
            <div className="w-full max-w-sm rounded-3xl border-2 px-6 py-10" style={{ borderColor: softBorder }}>
              <div className="flex flex-col items-center">
                {brandEl}
                <div className="mt-4">{titleEl}</div>
                <div className="mt-6">{namesEl}</div>
                {taglineEl}
                {ornamentEl}
                {dateEl}
                {buttonEl()}
              </div>
            </div>
            {footerEl}
          </div>
        )
      case 'seal':
        return (
          <div className="flex w-full flex-1 flex-col items-center justify-center">
            {brandEl}
            <div className="mt-5">{titleEl}</div>
            <div className="my-6">{namesEl}</div>
            <div className="flex h-28 w-28 items-center justify-center rounded-full border-2 text-5xl animate-float-y" style={{ borderColor: softBorderStrong, color: coverText, fontFamily: artStyle.titleFont }}>
              {artStyle.stamp}
            </div>
            {taglineEl}
            {dateEl}
            {buttonEl()}
            {footerEl}
          </div>
        )
      case 'banner':
        return (
          <div className="flex w-full flex-1 flex-col">
            <div className="flex flex-col items-center gap-2 border-y py-5" style={{ borderColor: softBorder, background: coverText === '#fff' ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.04)' }}>
              {brandEl}{emojiEl}{titleEl}
            </div>
            <div className="flex flex-1 flex-col items-center justify-center">
              {namesEl}
              {taglineEl}
              {ornamentEl}
            </div>
            <div className="flex flex-col items-center border-y py-5" style={{ borderColor: softBorder, background: coverText === '#fff' ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.04)' }}>
              {dateEl}
              {buttonEl(false)}
            </div>
            {footerEl}
          </div>
        )
      case 'split':
        return (
          <div className="flex w-full flex-1 flex-col">
            <div className="flex flex-col items-center gap-2 pt-16">{brandEl}{emojiEl}{titleEl}</div>
            <div className="flex flex-1 flex-col items-center justify-center">
              {namesEl}
              {taglineEl}
              {ornamentEl}
              {dateEl}
            </div>
            <div className="absolute bottom-10 left-0 right-0 flex justify-center">{buttonEl(false)}</div>
          </div>
        )
      case 'letter':
        return (
          <div className="flex w-full flex-1 flex-col">
            <div className="flex flex-col items-center gap-3 pt-16">{brandEl}{titleEl}</div>
            <div className="flex flex-1 flex-col items-center justify-center">
              <p className="mb-8 text-sm tracking-[0.2em]" style={{ color: coverText, opacity: 0.8 }}>
                亲爱的宾客：
              </p>
              {namesEl}
              <div className="mr-4 mt-6 self-end">{taglineEl}</div>
              {ornamentEl}
              {dateEl}
            </div>
            <div className="flex flex-col items-center pb-12">{buttonEl(false)}{footerEl}</div>
          </div>
        )
      case 'diagonal':
        // 斜阳对角：斜切面板承载上半部，按钮/日期悬浮面板外底部
        return (
          <div className="flex w-full flex-1 flex-col">
            <div
              className="flex flex-1 flex-col justify-center px-6 pt-16"
              style={{
                clipPath: 'polygon(0 0, 100% 0, 100% 80%, 0 100%)',
                background: coverText === '#fff' ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
              }}
            >
              <div className="flex flex-col items-center">{brandEl}<div className="mt-4">{titleEl}</div><div className="mt-6">{namesEl}</div>{taglineEl}{ornamentEl}</div>
            </div>
            <div className="flex flex-col items-center gap-5 pb-12 pt-6">
              {dateEl}
              {buttonEl(false)}
              {footerEl}
            </div>
          </div>
        )
      case 'couple':
        // 双人并立：新郎/新娘各占一侧竖牌，中央爱心分隔
        return (
          <div className="flex w-full flex-1 flex-col items-center">
            <div className="flex flex-col items-center gap-2 pt-14">{brandEl}{titleEl}</div>
            <div className="flex flex-1 items-center justify-center gap-7 sm:gap-10">
              <div className="flex flex-col items-center gap-2">
                <span className="text-4xl sm:text-5xl font-bold" style={{ fontFamily: artStyle.titleFont, textShadow: coverShadow }}>
                  {data.nameA || 'XXX'}
                </span>
                <span className="text-[10px] tracking-[0.45em]" style={{ color: coverText, opacity: 0.7 }}>BRIDE</span>
              </div>
              <span className="text-3xl" style={{ animation: 'heart-beat 1.6s ease-in-out infinite' }}>
                <Heart className="h-9 w-9 inline" fill="currentColor" style={{ color: coverText === '#fff' ? '#ffe4e6' : coverText }} />
              </span>
              <div className="flex flex-col items-center gap-2">
                <span className="text-4xl sm:text-5xl font-bold" style={{ fontFamily: artStyle.titleFont, textShadow: coverShadow }}>
                  {data.nameB || 'XXX'}
                </span>
                <span className="text-[10px] tracking-[0.45em]" style={{ color: coverText, opacity: 0.7 }}>GROOM</span>
              </div>
            </div>
            {taglineEl}
            <div className="flex flex-col items-center pb-10">{dateEl}{buttonEl()}{footerEl}</div>
          </div>
        )
      case 'arch':
        // 拱门盛典：内容包在圆拱门框（顶部大圆角）内
        return (
          <div className="flex w-full flex-1 flex-col items-center justify-center">
            <div className="w-full max-w-sm overflow-hidden border-2 pb-8 pt-12" style={{ borderColor: softBorder, borderRadius: '999px 999px 1rem 1rem' }}>
              <div className="flex flex-col items-center">
                {brandEl}
                <div className="mt-4">{titleEl}</div>
                <div className="mt-6">{namesEl}</div>
                {taglineEl}
                {ornamentEl}
                {dateEl}
              </div>
            </div>
            <div className="mt-8">{buttonEl(false)}</div>
            {footerEl}
          </div>
        )
      case 'rings':
        // 双环戒约：两个交叠圆环各嵌一个名字，中央爱心
        return (
          <div className="flex w-full flex-1 flex-col items-center justify-center">
            {brandEl}
            <div className="mt-4">{titleEl}</div>
            <div className="relative my-9 h-44 w-64">
              <div className="absolute left-1/2 top-0 flex h-40 w-40 items-center justify-center rounded-full border-2" style={{ borderColor: softBorderStrong, transform: 'translateX(-76%)' }}>
                <span className="text-xl font-bold" style={{ fontFamily: artStyle.titleFont, textShadow: coverShadow }}>{data.nameA || 'XXX'}</span>
              </div>
              <div className="absolute left-1/2 top-0 flex h-40 w-40 items-center justify-center rounded-full border-2" style={{ borderColor: softBorderStrong, transform: 'translateX(-24%)' }}>
                <span className="text-xl font-bold" style={{ fontFamily: artStyle.titleFont, textShadow: coverShadow }}>{data.nameB || 'XXX'}</span>
              </div>
              <span className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2" style={{ animation: 'heart-beat 1.6s ease-in-out infinite' }}>
                <Heart className="h-7 w-7 inline" fill="currentColor" style={{ color: coverText === '#fff' ? '#ffe4e6' : coverText }} />
              </span>
            </div>
            {taglineEl}
            {dateEl}
            {buttonEl()}
            {footerEl}
          </div>
        )
      case 'ribbon':
        // 红绸结缘：名字横贯燕尾丝带
        return (
          <div className="flex w-full flex-1 flex-col items-center justify-center">
            {brandEl}
            <div className="mt-4">{titleEl}</div>
            <div className="mt-9">
              <div
                className="px-12 py-4"
                style={{
                  clipPath: 'polygon(0 0, 100% 0, 92% 50%, 100% 100%, 0 100%, 8% 50%)',
                  background: coverText === '#fff' ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.12)',
                  border: `1px solid ${softBorder}`,
                }}
              >
                <span className="whitespace-nowrap text-2xl sm:text-3xl font-bold" style={{ fontFamily: artStyle.titleFont, textShadow: coverShadow }}>
                  {data.nameA || 'XXX'}{data.nameB ? ` & ${data.nameB}` : ''}
                </span>
              </div>
            </div>
            {taglineEl}
            {ornamentEl}
            {dateEl}
            {buttonEl()}
            {footerEl}
          </div>
        )
      case 'laurel':
        // 花环雅韵：名字两侧枝叶相映
        return (
          <div className="flex w-full flex-1 flex-col items-center justify-center">
            {brandEl}
            <div className="mt-4">{titleEl}</div>
            <div className="mt-6 flex items-center gap-3">
              <span className="text-2xl" style={{ transform: 'scaleX(-1)' }}>🌿</span>
              <div className="flex flex-col items-center">
                {namesEl}
                <span className="mt-1 text-sm tracking-[0.4em]" style={{ color: coverText, opacity: 0.75 }}>❀ ❀ ❀</span>
              </div>
              <span className="text-2xl">🌿</span>
            </div>
            {taglineEl}
            {ornamentEl}
            {dateEl}
            {buttonEl()}
            {footerEl}
          </div>
        )
      case 'diptych':
        // 对开双联：上下三联卡 + 中间粗分隔（像翻开书页）
        return (
          <div className="flex w-full flex-1 flex-col items-center justify-center px-6">
            <div className="w-full max-w-sm rounded-t-2xl border px-4 pb-7 pt-8" style={{ borderColor: softBorder }}>
              <div className="flex flex-col items-center gap-3">{brandEl}{emojiEl}{titleEl}</div>
            </div>
            <div className="w-full max-w-sm border-x border-t-0 border-b-0 px-4 py-8" style={{ borderColor: softBorder, background: coverText === '#fff' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }}>
              <div className="flex flex-col items-center gap-3">{namesEl}{taglineEl}</div>
            </div>
            <div className="w-full max-w-sm rounded-b-2xl border px-4 pb-8 pt-6" style={{ borderColor: softBorder }}>
              <div className="flex flex-col items-center gap-3">{dateEl}{buttonEl(false)}</div>
            </div>
            {footerEl}
          </div>
        )
      case 'sunburst':
        // 光芒万丈：中央圆形光晕 + 虚线圆环放射
        return (
          <div className="flex w-full flex-1 flex-col items-center justify-center">
            <div className="relative flex h-64 w-64 items-center justify-center" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.16) 0%, transparent 62%)' }}>
              <div className="absolute inset-0 rounded-full border border-dashed" style={{ borderColor: softBorder }} />
              <div className="relative z-10 flex flex-col items-center">
                <div className="text-4xl animate-float-y">{typeInfo.emoji}</div>
                <div className="mt-3">{brandEl}</div>
                <div className="mt-3 text-3xl sm:text-4xl font-bold leading-snug" style={{ fontFamily: artStyle.titleFont, textShadow: coverShadow }}>
                  {data.nameA || 'XXX'}{data.nameB ? ` · ${data.nameB}` : ''}
                </div>
              </div>
            </div>
            {taglineEl}
            {dateEl}
            {buttonEl()}
            {footerEl}
          </div>
        )
      case 'plaque':
        // 金匾之礼：粗边横匾 + 内凹描边
        return (
          <div className="flex w-full flex-1 flex-col items-center justify-center">
            {brandEl}
            <div className="mt-6 w-full max-w-sm px-6 py-9" style={{ border: `4px solid ${softBorderStrong}`, borderRadius: '1rem', background: coverText === '#fff' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.08), 0 4px 20px rgba(0,0,0,0.18)' }}>
              <div className="flex flex-col items-center gap-2">
                <div className="text-[10px] tracking-[0.5em]" style={{ color: coverText, opacity: 0.7 }}>永 结 同 心</div>
                {titleEl}
                <div className="my-3 h-px w-32" style={{ background: softBorderStrong }} />
                {namesBigEl}
                {taglineEl}
                {dateEl}
              </div>
            </div>
            <div className="mt-8">{buttonEl(false)}</div>
            {footerEl}
          </div>
        )
      case 'fan':
        // 花扇迎宾：顶部五片扇形扇骨展开
        return (
          <div className="flex w-full flex-1 flex-col items-center justify-center">
            <div className="mb-5 flex items-end justify-center">
              {[3, 5, 7, 5, 3].map((w, i) => (
                <div
                  key={i}
                  className="rounded-t-full"
                  style={{
                    width: w * 4,
                    height: 34 + (i % 2) * 18,
                    background: coverText === '#fff' ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.1)',
                    border: `1px solid ${softBorder}`,
                    transform: `rotate(${(i - 2) * 12}deg)`,
                    transformOrigin: 'bottom center',
                  }}
                />
              ))}
            </div>
            {brandEl}
            <div className="mt-3">{titleEl}</div>
            <div className="mt-6">{namesEl}</div>
            {taglineEl}
            {ornamentEl}
            {dateEl}
            {buttonEl()}
            {footerEl}
          </div>
        )
      case 'redveil':
        // 红盖头：盖头弧 + 流苏帘（十九期）
        return (
          <div className="flex w-full flex-1 flex-col items-center justify-center">
            {brandEl}
            <div className="mt-3">{titleEl}</div>
            <div className="mt-8">{namesEl}</div>
            {taglineEl}
            {/* 红盖头装饰：半圆盖 + 流苏帘 */}
            <div className="mt-7 flex flex-col items-center">
              <div
                className="h-14 w-44 rounded-t-full"
                style={{
                  background: `linear-gradient(180deg, ${coverText === '#fff' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}, transparent)`,
                  border: `1px solid ${softBorder}`,
                  borderBottom: 'none',
                }}
              />
              <div className="mt-1.5 flex justify-center gap-1.5">
                {Array.from({ length: 11 }).map((_, i) => (
                  <span
                    key={i}
                    className="block w-[3px] rounded-b-full"
                    style={{ height: 8 + (i % 4) * 4, background: softBorderStrong, opacity: 0.8 }}
                  />
                ))}
              </div>
            </div>
            {ornamentEl}
            {dateEl}
            {buttonEl()}
            {footerEl}
          </div>
        )
      case 'knots':
        // 同心结：双环交叠 + 中央结点（十九期）
        return (
          <div className="flex w-full flex-1 flex-col items-center justify-center">
            {brandEl}
            <div className="mt-3">{titleEl}</div>
            {/* 同心结装饰：两方环交叠 + 中央小方 */}
            <div className="relative mt-7 h-16 w-32">
              <span
                className="absolute left-0 top-1/2 h-14 w-14 -translate-y-1/2 rotate-45 rounded-md border-2"
                style={{ borderColor: softBorderStrong, background: `${coverText === '#fff' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'}` }}
              />
              <span
                className="absolute right-0 top-1/2 h-14 w-14 -translate-y-1/2 rotate-45 rounded-md border-2"
                style={{ borderColor: softBorderStrong, background: `${coverText === '#fff' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'}` }}
              />
              <span
                className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rotate-45"
                style={{ background: softBorderStrong }}
              />
            </div>
            <div className="mt-7">{namesEl}</div>
            {taglineEl}
            {ornamentEl}
            {dateEl}
            {buttonEl()}
            {footerEl}
          </div>
        )
      default:
        // classic 经典居中
        return (
          <div className="flex w-full flex-1 flex-col items-center justify-center">
            {brandEl}
            <div className="mt-4">{emojiEl}</div>
            <div className="mt-3">{titleEl}</div>
            <div className="mt-8">{namesEl}</div>
            {taglineEl}
            {ornamentEl}
            {dateEl}
            {buttonEl()}
            {footerEl}
          </div>
        )
    }
  })()

  const coverJsx = (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center text-center overflow-hidden"
      style={{ background: artStyle.coverBg ?? theme.gradient, color: coverText }}
    >
        {/* 视频背景（真实素材，Ken Burns 缓慢推拉） */}
        {coverVideo && (
          <>
            <video
              key={coverVideo}
              className="absolute inset-0 h-full w-full object-cover animate-slow-zoom"
              src={coverVideo}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
            />
            {/* 可读性遮罩：白字风格压暗，深字（浅底）风格提亮 */}
            <div
              className="absolute inset-0"
              style={{ background: coverText === '#fff' ? 'rgba(0,0,0,0.38)' : 'rgba(255,255,255,0.18)' }}
            />
          </>
        )}
        {/* 渐变流动叠层（视频背景时减弱，保留色相融合） */}
        <div
          className="absolute inset-0 animate-gradient-flow"
          style={{ opacity: coverVideo ? 0.25 : 0.7, background: `linear-gradient(120deg, ${theme.primary}cc 0%, transparent 45%, ${theme.primary}99 100%)` }}
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
        <PetalRain shapes={artStyle.petalShapes} color={artStyle.petalColor} count={18} />

        {/* 风格印章（右上角；竖排/圆印/极简布局由主体内嵌印章） */}
        {!['vertical', 'seal', 'minimal'].includes(layout.cover) && (
          <div
            className="absolute top-10 right-8 flex h-14 w-14 items-center justify-center rounded-full border-2 text-2xl select-none"
            style={{
              borderColor: softBorder,
              color: coverText,
              fontFamily: artStyle.titleFont,
            }}
          >
            {artStyle.stamp}
          </div>
        )}

        <div className="relative z-10 flex w-full max-w-md flex-1 flex-col items-center overflow-y-auto px-8 py-10">
          {coverInner}
        </div>
    </div>
  )

  // ==================== 正文（多屏滑动） ====================
  const photoCount = data.photos.length
  const mapUrl = buildMapUrl(data.venue, data.address)

  // —— 照片大图预览的情感文案（艺术字 + 吉祥话 + 简介）——
  // photoPreview 下标与 data.photos 直接对齐（displayPhotos 只是前缀截断）
  const previewOrigIndex = photoPreview === null ? -1 : photoPreview
  const previewCaption =
    previewOrigIndex >= 0 && data.photoCaptions
      ? (data.photoCaptions[previewOrigIndex] || '').trim()
      : ''
  const previewCaptionLines = useMemo(() => {
    if (!previewCaption) return [] as string[]
    return previewCaption
      .split(/[，。！？；\n]+/)
      .map((s) => s.trim())
      .filter(Boolean)
  }, [previewCaption])
  const previewArtWord = useMemo(() => {
    const fromUser =
      previewOrigIndex >= 0 && data.photoArtWords
        ? (data.photoArtWords[previewOrigIndex] || '').trim()
        : ''
    if (fromUser) return fromUser
    if (previewOrigIndex < 0) return ''
    return ART_WORDS_DEFAULT[previewOrigIndex % ART_WORDS_DEFAULT.length] || '永约'
  }, [data.photoArtWords, previewOrigIndex])
  const previewBlessingLines = useMemo((): string[] => {
    const fromUser =
      previewOrigIndex >= 0 && data.photoBlessings
        ? (data.photoBlessings[previewOrigIndex] || '').trim()
        : ''
    let text = fromUser
    if (!text) {
      if (previewOrigIndex < 0) return []
      text = BLESSINGS_DEFAULT[previewOrigIndex % BLESSINGS_DEFAULT.length] || ''
    }
    return text
      .split(/\n+/)
      .map((s) => s.trim())
      .filter(Boolean)
  }, [data.photoBlessings, previewOrigIndex])

  /** 下载当前预览照片原图（base64 直链 / URL 均取原始字节） */
  const downloadPreviewPhoto = useCallback(async () => {
    if (photoPreview === null) return
    const src = data.photos[photoPreview]
    if (!src) return
    try {
      const res = await fetch(src)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `wedding-photo-${photoPreview + 1}.jpg`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch {
      window.open(src, '_blank')
    }
  }, [data.photos, photoPreview])

  const bodyJsx = (
    <div className="fixed inset-0 z-50" style={{ background: theme.cardBg }}>
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
      ) : musicExpanded ? (
        <div className="fixed bottom-6 right-5 z-[60] flex flex-col items-end gap-2">
          <div
            className="w-52 rounded-2xl p-3 text-white shadow-2xl border border-white/20"
            style={{ background: `${theme.primaryDark}e6`, backdropFilter: 'blur(14px)' }}
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-semibold">{current.name}</div>
                {current.artist && (
                  <div className="truncate text-[11px] text-white/65">{current.artist}</div>
                )}
              </div>
              <button
                onClick={() => setMusicExpanded(false)}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/15 transition-colors hover:bg-white/25"
                aria-label="收起音乐面板"
                title="收起"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
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
                className="flex h-10 w-10 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-105"
                style={{ background: theme.primary, color: '#fff' }}
                aria-label={musicPlaying ? '暂停' : '播放'}
                title={musicPlaying ? '暂停音乐' : '播放音乐'}
              >
                {musicPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
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
      ) : (
        /* 默认收起：小音符圆钮（音乐照常播放），点击暂停/播放；上方小箭头可展开完整面板 */
        <div className="fixed bottom-6 right-5 z-[60] flex flex-col items-end gap-1">
          <button
            onClick={() => setMusicExpanded(true)}
            className="flex h-6 w-6 items-center justify-center rounded-full bg-white/25 text-white shadow backdrop-blur transition-colors hover:bg-white/35"
            aria-label="展开音乐面板"
            title="展开音乐面板"
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={toggleMusic}
            className="flex h-10 w-10 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-105"
            style={{ background: theme.primary, color: '#fff' }}
            title={musicPlaying ? '暂停音乐' : '播放音乐'}
            aria-label={musicPlaying ? '暂停音乐' : '播放音乐'}
          >
            <Music2 className={`h-4 w-4 ${musicPlaying ? 'animate-spin-slow' : 'opacity-80'}`} />
          </button>
        </div>
      )}

      {/* 顶部浮动操作条 */}
      <div
        className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] w-[92%] max-w-md flex items-center justify-end gap-2 rounded-full px-4 py-2 text-white text-sm shadow-lg"
        style={{ background: `${theme.primaryDark}cc`, backdropFilter: 'blur(12px)' }}
      >
        <button
          onClick={() => setShowQr(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
        >
          <Share2 className="w-4 h-4" />
          分享请柬
        </button>
      </div>

      {/* 分享二维码弹层：扫码打开请柬，中心叠新人名字 */}
      {showQr &&
        createPortal(
          <div
            className="fixed inset-0 z-[80] flex items-center justify-center p-6"
            style={{ background: 'rgba(18,14,26,0.62)', backdropFilter: 'blur(6px)' }}
            onClick={() => setShowQr(false)}
          >
            <div
              className="relative w-full max-w-[300px] rounded-3xl bg-white px-6 pb-6 pt-7 text-center shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowQr(false)}
                className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600"
                aria-label="关闭分享"
              >
                <X className="h-4 w-4" />
              </button>
              <p
                className="text-[11px] tracking-[0.5em]"
                style={{ color: theme.primaryDark, fontFamily: artStyle.titleFont }}
              >
                扫 码 打 开 请 柬
              </p>
              {/* 二维码（H 级高容错，中心留白叠新人名） */}
              <div className="relative mx-auto mt-4 h-52 w-52">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="请柬二维码" className="h-full w-full" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center rounded-lg bg-stone-50">
                    <span className="animate-pulse text-xs text-stone-400">二维码生成中…</span>
                  </div>
                )}
                {/* 中心新人名字 */}
                <div
                  className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full bg-white shadow ring-1"
                  style={{ ['--tw-ring-color' as string]: `${theme.primary}40` }}
                >
                  <span
                    className="text-[10px] leading-tight font-bold tracking-widest"
                    style={{ color: theme.primaryDark, fontFamily: artStyle.titleFont }}
                  >
                    {data.nameA}
                  </span>
                  <span className="my-px text-[7px] leading-none" style={{ color: theme.primary }}>
                    ❤
                  </span>
                  <span
                    className="text-[10px] leading-tight font-bold tracking-widest"
                    style={{ color: theme.primaryDark, fontFamily: artStyle.titleFont }}
                  >
                    {data.nameB || data.nameA}
                  </span>
                </div>
              </div>
              <p className="mt-3 text-[10px] tracking-wider text-stone-400">微信 / 相机扫码，或长按识别</p>
              {/* 复制链接兜底 */}
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(shareUrl)
                    setCopied(true)
                    setTimeout(() => setCopied(false), 2000)
                  } catch {
                    /* ignore */
                  }
                }}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full py-2.5 text-xs tracking-[0.25em] text-white transition-all hover:brightness-110 active:scale-95"
                style={{ background: theme.primaryDark }}
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-200" /> : <Link2 className="h-3.5 w-3.5" />}
                {copied ? '已复制' : '复制链接'}
              </button>
            </div>
          </div>,
          document.body
        )}

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
        {/* ============ 屏 1：照片墙（婚礼 H5 详情式 · 题款艺术字） ============ */}
        {photoCount > 0 ? (
          <section data-page={0}>
            {/* 吸顶标题（随布局变体 · 艺术字加强版） */}
            <div
              className="sticky top-0 z-20 px-6 pt-16 pb-6"
              style={{
                background: `linear-gradient(to bottom, ${theme.cardBg} 0%, ${theme.cardBg}ee 70%, transparent 100%)`,
              }}
            >
              {/* GALLERY · 题款艺术字（印章 + 大字 + 装饰） */}
              <div className="flex flex-col items-center text-center">
                <div
                  className="flex items-center gap-3 text-[10px] tracking-[0.7em]"
                  style={{ color: theme.primary, opacity: 0.75 }}
                >
                  <span className="h-px w-10" style={{ background: theme.primary, opacity: 0.5 }} />
                  <span>WEDDING · MOMENTS</span>
                  <span className="h-px w-10" style={{ background: theme.primary, opacity: 0.5 }} />
                </div>
                <h2
                  className="mt-3 text-4xl font-bold tracking-[0.18em] animate-pop-in"
                  style={{
                    fontFamily: artStyle.titleFont,
                    color: theme.primary,
                    textShadow: `1px 1px 0 ${theme.primary}22, 0 2px 8px ${theme.primary}18`,
                    letterSpacing: '0.18em',
                  }}
                >
                  最美瞬间
                </h2>
                {/* 装饰：左右细线 + 题款标签（去掉原"壹"繁体数字印章） */}
                <div className="mt-3 flex items-center gap-3">
                  <span className="h-px w-12" style={{ background: `${theme.primary}55` }} />
                  <span
                    className="text-[10px] tracking-[0.45em]"
                    style={{ color: theme.primary, opacity: 0.6, fontFamily: artStyle.titleFont }}
                  >
                    PHOTO GALLERY
                  </span>
                  <span className="h-px w-12" style={{ background: `${theme.primary}55` }} />
                </div>
                <p
                  className="mt-2 text-[10px] tracking-[0.3em] italic"
                  style={{ color: theme.cardSub, fontFamily: artStyle.titleFont }}
                >
                  OUR · LITTLE · MOMENTS
                </p>
              </div>
            </div>

            {/* 照片墙（随变体随机：polaroid / timeline / collage / film / circle / fan / offset / gallery / ribbon / stair / gather / tape / album / knot / couplet / scroll / pendant；吉祥数折叠，可展开） */}
            {(() => {
              switch (photoVariant) {
                case 'polaroid':
                  // 拍立得时光：白边相纸 + 手写体简介，交错倾斜，hover 摆正放大
                  return (
                    <Reveal>
                      <div className="px-6 pb-2">
                        <div className="flex flex-col items-center gap-7">
                          {displayPhotos.map((src, i) => (
                            <button
                              key={i}
                              onClick={() => setPhotoPreview(i)}
                              className={`relative block bg-white p-3 pb-12 shadow-md transition-all duration-300 hover:rotate-0 hover:scale-[1.05] active:scale-95 ${
                                i % 2 === 0 ? '-rotate-2' : 'rotate-2'
                              }`}
                              style={{ borderRadius: '0.35rem' }}
                              aria-label={`查看照片 ${i + 1}`}
                            >
                              <img src={src} alt="" className="aspect-[4/5] w-64 max-w-[68vw] object-cover" loading="eager" decoding="async" onError={handleImgError} />
                              <span
                                className="absolute bottom-3 left-0 right-0 px-2 text-center text-xs tracking-widest"
                                style={{ fontFamily: artStyle.titleFont, color: theme.cardSub }}
                              >
                                {data.photoCaptions?.[i] || `Best Moment · ${String(i + 1).padStart(2, '0')}`}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </Reveal>
                  )
                case 'timeline':
                  // 时光轴：中央竖线 + 照片左右交错 + 节点圆点
                  return (
                    <Reveal>
                      <div className="px-6 pb-2">
                        <div className="relative">
                          <div
                            className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2"
                            style={{
                              background: `linear-gradient(to bottom, transparent, ${theme.primary}66 15%, ${theme.primary}66 85%, transparent)`,
                            }}
                          />
                          <div className="space-y-10">
                            {displayPhotos.map((src, i) => {
                              const left = i % 2 === 0
                              return (
                                <div key={i} className="relative min-h-[130px]">
                                  <span
                                    className="absolute left-1/2 top-1/2 z-10 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-white shadow"
                                    style={{ borderColor: theme.primary }}
                                  />
                                  <div className={`flex flex-col ${left ? 'items-start' : 'items-end'}`}>
                                    <button
                                      onClick={() => setPhotoPreview(i)}
                                      className="block w-[38%] max-w-[150px] overflow-hidden shadow-md transition-transform hover:scale-[1.04] active:scale-95"
                                      style={{ borderRadius: artStyle.radius }}
                                      aria-label={`查看照片 ${i + 1}`}
                                    >
                                      <img src={src} alt="" className="aspect-[3/4] w-full object-cover" loading="eager" decoding="async" onError={handleImgError} />
                                    </button>
                                    {data.photoCaptions?.[i] && (
                                      <p
                                        className="mt-1.5 w-[42%] text-[11px] leading-snug"
                                        style={{ fontFamily: artStyle.titleFont, color: theme.cardSub }}
                                      >
                                        {data.photoCaptions[i]}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    </Reveal>
                  )
                case 'collage':
                  // 拼贴画布：Bento 网格，大图小图错落
                  return (
                    <Reveal>
                      <div className="px-6 pb-2">
                        <div className="grid auto-rows-[84px] grid-cols-4 gap-2">
                          {displayPhotos.map((src, i) => {
                            const cls = [
                              'col-span-2 row-span-2',
                              'col-span-1 row-span-1',
                              'col-span-1 row-span-1',
                              'col-span-2 row-span-1',
                              'col-span-1 row-span-2',
                              'col-span-1 row-span-1',
                            ][i % 6]
                            return (
                              <button
                                key={i}
                                onClick={() => setPhotoPreview(i)}
                                className={`block overflow-hidden shadow-sm transition-transform hover:scale-[1.03] active:scale-95 ${cls}`}
                                style={{ borderRadius: artStyle.radius }}
                                aria-label={`查看照片 ${i + 1}`}
                              >
                                <img src={src} alt="" className="h-full w-full object-cover" loading="eager" decoding="async" onError={handleImgError} />
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </Reveal>
                  )
                case 'film':
                  // 胶片长廊：横向滑动胶片，上下齿孔 + 编号
                  return (
                    <Reveal>
                      <div className="pb-2">
                        <div className="overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                          <div className="flex gap-4 px-6 pb-3">
                            {displayPhotos.map((src, i) => (
                              <button
                                key={i}
                                onClick={() => setPhotoPreview(i)}
                                className="group block shrink-0"
                                style={{ width: 138 }}
                                aria-label={`查看照片 ${i + 1}`}
                              >
                                <div className="rounded-lg bg-[#161616] p-2.5 pb-9 shadow-lg" style={{ borderRadius: '0.55rem' }}>
                                  <div className="mb-1.5 flex justify-between px-0.5 opacity-80">
                                    {Array.from({ length: 5 }).map((_, k) => (
                                      <span key={k} className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: theme.primary }} />
                                    ))}
                                  </div>
                                  <img
                                    src={src}
                                    alt=""
                                    className="aspect-[3/4] w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                                    loading="eager" decoding="async" onError={handleImgError}
                                  />
                                  <div className="mt-1.5 flex justify-between px-0.5 opacity-80">
                                    {Array.from({ length: 5 }).map((_, k) => (
                                      <span key={k} className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: theme.primary }} />
                                    ))}
                                  </div>
                                </div>
                                <span
                                  className="mt-1 block text-center text-[10px] tracking-[0.3em]"
                                  style={{ fontFamily: 'ui-monospace, monospace', color: theme.cardSub }}
                                >
                                  NO.{String(i + 1).padStart(3, '0')}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                        <p className="pb-3 text-center text-[11px] animate-float-x" style={{ color: theme.cardSub }}>
                          ⟷ 左右滑动查看更多
                        </p>
                      </div>
                    </Reveal>
                  )
                case 'circle':
                  // 圆形拼贴：大小圆错落，喜庆气球感
                  return (
                    <Reveal>
                      <div className="flex flex-wrap items-center justify-center gap-4 px-6">
                        {displayPhotos.map((src, i) => {
                          const sizes = [60, 44, 52, 36, 48, 40]
                          const size = sizes[i % sizes.length] * 4
                          return (
                            <button
                              key={i}
                              onClick={() => setPhotoPreview(i)}
                              className="block overflow-hidden rounded-full shadow-md transition-transform hover:scale-105 active:scale-95"
                              style={{ width: size, height: size }}
                              aria-label={`查看照片 ${i + 1}`}
                            >
                              <img src={src} alt="" className="h-full w-full object-cover" loading="eager" decoding="async" onError={handleImgError} />
                            </button>
                          )
                        })}
                      </div>
                    </Reveal>
                  )
                case 'fan':
                  // 扇形展开：每 3 张一组，中间大两侧小扇形排布
                  return (
                    <Reveal>
                      <div className="flex flex-col gap-9 px-6 pb-2">
                        {Array.from({ length: Math.ceil(displayPhotos.length / 3) }).map((_, g) => {
                          const slice = displayPhotos.slice(g * 3, g * 3 + 3)
                          return (
                            <div key={g} className="flex items-end justify-center">
                              {slice.map((src, j) => {
                                const i = g * 3 + j
                                const isMid = j === 1 && slice.length === 3
                                return (
                                  <button
                                    key={i}
                                    onClick={() => setPhotoPreview(i)}
                                    className={`block bg-white p-2 shadow-md transition-transform hover:z-10 hover:scale-105 active:scale-95 ${
                                      isMid ? 'z-10 mx-1 w-32 rotate-0' : j === 0 ? '-rotate-12 translate-y-3 w-24' : 'rotate-12 translate-y-3 w-24'
                                    }`}
                                    style={{ borderRadius: '0.3rem' }}
                                    aria-label={`查看照片 ${i + 1}`}
                                  >
                                    <img src={src} alt="" className="aspect-[3/4] w-full object-cover" loading="eager" decoding="async" onError={handleImgError} />
                                  </button>
                                )
                              })}
                            </div>
                          )
                        })}
                      </div>
                    </Reveal>
                  )
                case 'offset':
                  // 错落杂志：层叠堆叠，如翻阅相册
                  return (
                    <Reveal>
                      <div className="px-6 pb-2">
                        <div
                          className="relative mx-auto"
                          style={{ height: Math.max(displayPhotos.length * 60 + 220, 320) }}
                        >
                          {displayPhotos.map((src, i) => {
                            const angle = (i % 2 === 0 ? -1 : 1) * (3 + (i % 3) * 2)
                            const dx = (i % 2 === 0 ? -1 : 1) * (10 + (i % 3) * 8)
                            return (
                              <button
                                key={i}
                                onClick={() => setPhotoPreview(i)}
                                className="absolute left-1/2 block w-40 overflow-hidden bg-white p-1.5 shadow-lg transition-all hover:z-50 hover:scale-105"
                                style={{ top: i * 60, transform: `translateX(calc(-50% + ${dx}px)) rotate(${angle}deg)`, zIndex: 20 + i, borderRadius: '0.3rem' }}
                                aria-label={`查看照片 ${i + 1}`}
                              >
                                <img src={src} alt="" className="aspect-[3/4] w-full object-cover" loading="eager" decoding="async" onError={handleImgError} />
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </Reveal>
                  )
                case 'gallery':
                  // 画框画廊：题款式留白，每张照片配序号艺术字 + 简介题款
                  return (
                    <Reveal>
                      <div className="px-7 pb-4">
                        <div className="flex flex-col gap-12">
                          {displayPhotos.map((src, i) => (
                            <div key={i} className="flex flex-col items-center">
                              {/* 题款序号 + 主题字 */}
                              <div className="mb-3 flex w-full max-w-sm items-center justify-between">
                                <span
                                  className="text-xs tracking-[0.5em]"
                                  style={{ color: theme.cardSub, fontFamily: artStyle.titleFont }}
                                >
                                  NO. {String(i + 1).padStart(2, '0')}
                                </span>
                                <span
                                  className="text-[10px] tracking-[0.3em]"
                                  style={{ color: theme.cardSub }}
                                >
                                  {data.photoCaptions?.[i] ? '· 题款 ·' : '· MOMENTS ·'}
                                </span>
                              </div>
                              <button
                                onClick={() => setPhotoPreview(i)}
                                className="group block w-full max-w-sm overflow-hidden shadow-md transition-transform hover:scale-[1.02] active:scale-[0.98]"
                                style={{ borderRadius: '0.35rem', border: `1px solid ${artStyle.borderColor}` }}
                                aria-label={`查看照片 ${i + 1}`}
                              >
                                <img src={src} alt="" className="aspect-[4/5] w-full object-cover" loading="eager" decoding="async" onError={handleImgError} />
                              </button>
                              {/* 简介题款（手写体） */}
                              {data.photoCaptions?.[i] && (
                                <p
                                  className="mt-3 max-w-sm text-center text-sm leading-relaxed tracking-wider"
                                  style={{ fontFamily: artStyle.titleFont, color: theme.cardText, opacity: 0.85 }}
                                >
                                  {data.photoCaptions[i]}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </Reveal>
                  )
                case 'ribbon':
                  // 红绸照片：丝带串照片（每张图左右带燕尾丝带，照片随丝带垂下）
                  return (
                    <Reveal>
                      <div className="flex flex-col gap-10 px-6 pb-2">
                        {displayPhotos.map((src, i) => (
                          <div key={i} className="relative">
                            {/* 左侧丝带 */}
                            <span
                              className="absolute -left-2 top-3 h-10 w-3"
                              style={{
                                background: `${theme.primary}cc`,
                                clipPath: 'polygon(0 0, 100% 20%, 100% 100%, 0 80%)',
                              }}
                            />
                            {/* 右侧丝带 */}
                            <span
                              className="absolute -right-2 top-3 h-10 w-3"
                              style={{
                                background: `${theme.primary}cc`,
                                clipPath: 'polygon(0 20%, 100% 0, 100% 80%, 0 100%)',
                              }}
                            />
                            <div className="text-center">
                              <span
                                className="mb-2 inline-block text-[10px] tracking-[0.6em]"
                                style={{ color: theme.primary, opacity: 0.75 }}
                              >
                                —— {String(i + 1).padStart(2, '0')} / {String(displayPhotos.length).padStart(2, '0')} ——
                              </span>
                            </div>
                            <button
                              onClick={() => setPhotoPreview(i)}
                              className="block w-full overflow-hidden shadow-md transition-transform hover:scale-[1.015] active:scale-95"
                              style={{ borderRadius: '0.4rem', border: `2px solid ${artStyle.borderColor}` }}
                              aria-label={`查看照片 ${i + 1}`}
                            >
                              <img src={src} alt="" className="aspect-[3/4] w-full object-cover" loading="eager" decoding="async" onError={handleImgError} />
                            </button>
                            {data.photoCaptions?.[i] && (
                              <p
                                className="mt-3 text-center text-sm leading-relaxed"
                                style={{ fontFamily: artStyle.titleFont, color: theme.cardText }}
                              >
                                {data.photoCaptions[i]}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </Reveal>
                  )
                case 'double':
                  // 双排交错：奇偶列错位下沉，节奏感
                  return (
                    <Reveal>
                      <div className="px-6 pb-2">
                        <div className="grid grid-cols-3 gap-3">
                          {displayPhotos.map((src, i) => (
                            <button
                              key={i}
                              onClick={() => setPhotoPreview(i)}
                              className={`block overflow-hidden shadow-sm transition-transform hover:scale-[1.04] active:scale-95 ${i % 2 === 1 ? 'mt-8' : ''}`}
                              style={{ borderRadius: artStyle.radius }}
                              aria-label={`查看照片 ${i + 1}`}
                            >
                              <img src={src} alt="" className="aspect-[3/4] w-full object-cover" loading="eager" decoding="async" onError={handleImgError} />
                            </button>
                          ))}
                        </div>
                      </div>
                    </Reveal>
                  )
                case 'mosaic':
                  // 马赛克砖：不规则砖墙（方/竖/横/窄交替）
                  return (
                    <Reveal>
                      <div className="columns-3 gap-2 px-6 pb-2">
                        {displayPhotos.map((src, i) => (
                          <button
                            key={i}
                            onClick={() => setPhotoPreview(i)}
                            className="mb-2 block w-full overflow-hidden break-inside-avoid shadow-sm transition-transform hover:scale-[1.03] active:scale-95"
                            style={{ borderRadius: artStyle.radius }}
                            aria-label={`查看照片 ${i + 1}`}
                          >
                            <img
                              src={src}
                              alt=""
                              className={`w-full object-cover ${
                                i % 4 === 0 ? 'aspect-square' : i % 4 === 1 ? 'aspect-[3/4]' : i % 4 === 2 ? 'aspect-[4/3]' : 'aspect-[2/3]'
                              }`}
                              loading="eager" decoding="async" onError={handleImgError}
                            />
                          </button>
                        ))}
                      </div>
                    </Reveal>
                  )
                case 'stair':
                  // 阶梯拾级：三列阶梯递升 + 微旋，如登阶而上的回忆
                  return (
                    <Reveal>
                      <div className="px-6 pb-2">
                        <div className="flex items-start justify-center gap-4">
                          {[0, 1, 2].map((col) => (
                            <div
                              key={col}
                              className={`flex flex-col gap-4 ${col === 1 ? 'mt-14' : col === 2 ? 'mt-28' : ''}`}
                            >
                              {displayPhotos
                                .filter((_, i) => i % 3 === col)
                                .map((src, j) => {
                                  const i = col + j * 3
                                  return (
                                    <button
                                      key={i}
                                      onClick={() => setPhotoPreview(i)}
                                      className="block w-28 overflow-hidden rounded-lg bg-white p-1.5 shadow-md transition-transform hover:scale-105 active:scale-95"
                                      style={{ borderRadius: '0.4rem', transform: `rotate(${(i % 2 === 0 ? -1 : 1) * (2 + (i % 3))}deg)` }}
                                      aria-label={`查看照片 ${i + 1}`}
                                    >
                                      <img src={src} alt="" className="aspect-[3/4] w-full object-cover" loading="eager" decoding="async" onError={handleImgError} />
                                    </button>
                                  )
                                })}
                            </div>
                          ))}
                        </div>
                      </div>
                    </Reveal>
                  )
                case 'gather':
                  // 花簇捧心：中央大图 + 环绕小图，如婚礼捧花
                  return (
                    <Reveal>
                      <div className="px-6 pb-2">
                        <div className="relative mx-auto" style={{ width: 300, height: 320 }}>
                          {displayPhotos.map((src, i) => {
                            if (i === 0) {
                              return (
                                <button
                                  key={i}
                                  onClick={() => setPhotoPreview(0)}
                                  className="absolute left-1/2 top-1/2 z-10 block w-40 overflow-hidden rounded-full border-4 border-white shadow-xl transition-transform hover:scale-105 active:scale-95"
                                  style={{ transform: 'translate(-50%, -50%) rotate(-4deg)' }}
                                  aria-label="查看照片 1"
                                >
                                  <img src={src} alt="" className="aspect-square w-full object-cover" loading="eager" decoding="async" onError={handleImgError} />
                                </button>
                              )
                            }
                            const n = displayPhotos.length - 1
                            const angle = ((i - 1) / Math.max(1, n)) * Math.PI * 2 - Math.PI / 2
                            const r = n <= 6 ? 100 : n <= 9 ? 108 : 118
                            const size = n <= 6 ? 60 : n <= 9 ? 52 : 46
                            const x = Math.cos(angle) * r
                            const y = Math.sin(angle) * r
                            return (
                              <button
                                key={i}
                                onClick={() => setPhotoPreview(i)}
                                className="absolute left-1/2 top-1/2 block overflow-hidden rounded-full border-2 border-white shadow-md transition-transform hover:scale-110 active:scale-95"
                                style={{
                                  width: size,
                                  height: size,
                                  transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) rotate(${i * 8}deg)`,
                                }}
                                aria-label={`查看照片 ${i + 1}`}
                              >
                                <img src={src} alt="" className="h-full w-full object-cover" loading="eager" decoding="async" onError={handleImgError} />
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </Reveal>
                  )
                case 'tape':
                  // 双囍贴纸：拍立得式照片墙 + 纸胶带 + 囍字角贴
                  return (
                    <Reveal>
                      <div className="flex flex-wrap justify-center gap-6 px-6 pb-2">
                        {displayPhotos.map((src, i) => (
                          <button
                            key={i}
                            onClick={() => setPhotoPreview(i)}
                            className="relative block w-32 bg-white p-2 pb-10 shadow-md transition-transform hover:rotate-0 hover:scale-105 active:scale-95"
                            style={{ borderRadius: '0.3rem', transform: `rotate(${(i % 2 === 0 ? -1 : 1) * (2 + (i % 3))}deg)` }}
                            aria-label={`查看照片 ${i + 1}`}
                          >
                            {/* 纸胶带 */}
                            <span
                              className="absolute -top-2.5 left-1/2 h-5 w-16 -translate-x-1/2 rotate-[-4deg] opacity-90"
                              style={{
                                background: 'linear-gradient(90deg, rgba(253,224,179,.92), rgba(254,243,199,.92))',
                                boxShadow: '0 1px 3px rgba(0,0,0,.15)',
                              }}
                            />
                            <img src={src} alt="" className="aspect-square w-full object-cover" loading="eager" decoding="async" onError={handleImgError} />
                            {/* 囍字角贴 */}
                            <span
                              className="absolute -bottom-2.5 -right-2.5 flex h-8 w-8 items-center justify-center rounded-sm text-sm font-bold shadow"
                              style={{
                                background: theme.primary,
                                color: '#fff',
                                fontFamily: artStyle.titleFont,
                                border: '2px solid rgba(255,255,255,.85)',
                              }}
                            >
                              囍
                            </span>
                            <span
                              className="absolute bottom-1 left-0 right-0 text-center text-[10px] tracking-[0.2em]"
                              style={{ fontFamily: artStyle.titleFont, color: theme.cardSub }}
                            >
                              {data.photoCaptions?.[i] || `NO.${String(i + 1).padStart(2, '0')}`}
                            </span>
                          </button>
                        ))}
                      </div>
                    </Reveal>
                  )
                case 'album':
                  // 对开相册：两页翻开 + 书脊，如翻阅婚礼纪念册
                  return (
                    <Reveal>
                      <div className="px-6 pb-2">
                        <div className="flex flex-col gap-9">
                          {Array.from({ length: Math.ceil(displayPhotos.length / 2) }).map((_, g) => {
                            const left = displayPhotos[g * 2]
                            const right = displayPhotos[g * 2 + 1]
                            return (
                              <div key={g} className="mx-auto flex w-full max-w-sm">
                                {left ? (
                                  <button
                                    onClick={() => setPhotoPreview(g * 2)}
                                    className="w-1/2 origin-right bg-white p-2.5 pb-8 shadow-md transition-transform hover:z-10 hover:scale-[1.03] active:scale-95"
                                    style={{ borderRadius: '0.5rem 0 0 0.5rem', transform: 'perspective(900px) rotateY(2.5deg)' }}
                                    aria-label={`查看照片 ${g * 2 + 1}`}
                                  >
                                    <img src={left} alt="" className="aspect-[3/4] w-full object-cover" loading="eager" decoding="async" onError={handleImgError} />
                                    <span
                                      className="mt-1.5 block text-center text-[10px] tracking-[0.2em]"
                                      style={{ fontFamily: artStyle.titleFont, color: theme.cardSub }}
                                    >
                                      {data.photoCaptions?.[g * 2] || `PAGE ${String(g * 2 + 1).padStart(2, '0')}`}
                                    </span>
                                  </button>
                                ) : (
                                  <span className="w-1/2" />
                                )}
                                {/* 书脊 */}
                                <span
                                  className="w-2.5 shrink-0 shadow-inner"
                                  style={{
                                    background: 'linear-gradient(to right, #3f3f46, #71717a 35%, #52525b 60%, #3f3f46)',
                                    borderRadius: 2,
                                  }}
                                />
                                {right ? (
                                  <button
                                    onClick={() => setPhotoPreview(g * 2 + 1)}
                                    className="w-1/2 origin-left bg-white p-2.5 pb-8 shadow-md transition-transform hover:z-10 hover:scale-[1.03] active:scale-95"
                                    style={{ borderRadius: '0 0.5rem 0.5rem 0', transform: 'perspective(900px) rotateY(-2.5deg)' }}
                                    aria-label={`查看照片 ${g * 2 + 2}`}
                                  >
                                    <img src={right} alt="" className="aspect-[3/4] w-full object-cover" loading="eager" decoding="async" onError={handleImgError} />
                                    <span
                                      className="mt-1.5 block text-center text-[10px] tracking-[0.2em]"
                                      style={{ fontFamily: artStyle.titleFont, color: theme.cardSub }}
                                    >
                                      {data.photoCaptions?.[g * 2 + 1] || `PAGE ${String(g * 2 + 2).padStart(2, '0')}`}
                                    </span>
                                  </button>
                                ) : (
                                  <span className="w-1/2" />
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </Reveal>
                  )
                case 'knot':
                  // 红线牵缘：S 形蜿蜒红线串起照片，如月老牵线（正弦曲线 + 悬挂微旋）
                  return (
                    <Reveal>
                      <div className="px-6 pb-2">
                        <p className="mb-2 text-center text-[11px] tracking-[0.4em]" style={{ color: theme.primary, opacity: 0.7, fontFamily: artStyle.titleFont }}>
                          月 老 牵 线 · 缘 定 三 生
                        </p>
                        <div className="relative" style={{ height: Math.max(displayPhotos.length * 92 + 40, 280) }}>
                          {(() => {
                            const n = displayPhotos.length
                            const AMP = 24
                            const xAt = (i: number) => 50 + Math.sin((i / Math.max(1, n - 1)) * Math.PI * 2) * AMP
                            const yAt = (i: number) => 8 + (i / Math.max(1, n - 1)) * 84
                            // 红线 path（同函数采样折线，viewBox 0..100 与定位点一致）
                            const pathPts: string[] = []
                            for (let t = 0; t <= 1.0001; t += 0.02) {
                              pathPts.push(`${t === 0 ? 'M' : 'L'}${(50 + Math.sin(t * Math.PI * 2) * AMP).toFixed(2)} ${(8 + t * 84).toFixed(2)}`)
                            }
                            return (
                              <>
                                <svg
                                  className="pointer-events-none absolute inset-0 h-full w-full"
                                  viewBox="0 0 100 100"
                                  preserveAspectRatio="none"
                                  fill="none"
                                >
                                  <path
                                    d={pathPts.join(' ')}
                                    stroke={`${theme.primary}55`}
                                    strokeWidth={0.45}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                                {displayPhotos.map((src, i) => {
                                  const rot = Math.cos((i / Math.max(1, n - 1)) * Math.PI * 2) * 12
                                  return (
                                    <button
                                      key={i}
                                      onClick={() => setPhotoPreview(i)}
                                      className="absolute z-10 block w-24 overflow-hidden rounded-md bg-white p-1.5 shadow-lg transition-transform hover:z-20 hover:scale-110 active:scale-95"
                                      style={{
                                        left: `${xAt(i)}%`,
                                        top: `${yAt(i)}%`,
                                        transform: `translate(-50%, -50%) rotate(${rot}deg)`,
                                        boxShadow: '0 6px 16px rgba(0,0,0,0.25)',
                                      }}
                                      aria-label={`查看照片 ${i + 1}`}
                                    >
                                      <img src={src} alt="" className="aspect-[3/4] w-full object-cover" loading="eager" decoding="async" onError={handleImgError} />
                                    </button>
                                  )
                                })}
                              </>
                            )
                          })()}
                        </div>
                        <p className="pt-3 text-center text-[10px] tracking-[0.3em]" style={{ color: theme.cardSub }}>
                          —— 红线两端 · 终得相见 ——
                        </p>
                      </div>
                    </Reveal>
                  )
                case 'couplet':
                  // 喜联成对：左右两列竖排如对联 + 顶部横批「天作之合」
                  return (
                    <Reveal>
                      <div className="px-6 pb-2">
                        <div className="mx-auto w-full max-w-sm">
                          {/* 横批 */}
                          <div className="mb-4 text-center">
                            <span
                              className="inline-block border-2 px-7 py-1.5 text-sm font-bold tracking-[0.55em]"
                              style={{
                                borderColor: theme.primary,
                                color: theme.primary,
                                fontFamily: artStyle.titleFont,
                                borderRadius: 4,
                                boxShadow: `0 0 0 1px ${theme.primary}22`,
                              }}
                            >
                              天 作 之 合
                            </span>
                          </div>
                          <div className="flex justify-between gap-4">
                            {[0, 1].map((col) => {
                              const colPhotos = displayPhotos.filter((_, i) => i % 2 === col)
                              return (
                                <div key={col} className="flex w-[47%] flex-col items-center gap-4">
                                  {colPhotos.map((src, j) => {
                                    const i = col + j * 2
                                    return (
                                      <button
                                        key={i}
                                        onClick={() => setPhotoPreview(i)}
                                        className="block w-full overflow-hidden bg-[#fdf3e3] p-2 pb-7 shadow-md transition-transform hover:z-10 hover:scale-[1.04] active:scale-95"
                                        style={{
                                          borderRadius: '0.4rem',
                                          transform: `rotate(${col === 0 ? -1.2 : 1.2}deg)`,
                                          border: `1px solid ${artStyle.borderColor}`,
                                        }}
                                        aria-label={`查看照片 ${i + 1}`}
                                      >
                                        <img src={src} alt="" className="aspect-[3/4] w-full object-cover" loading="eager" decoding="async" onError={handleImgError} />
                                        <span
                                          className="mt-1.5 block text-center text-[10px] tracking-[0.25em]"
                                          style={{ fontFamily: artStyle.titleFont, color: theme.cardSub }}
                                        >
                                          {data.photoCaptions?.[i] || `喜 · ${String(i + 1).padStart(2, '0')}`}
                                        </span>
                                      </button>
                                    )
                                  })}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    </Reveal>
                  )
                case 'scroll':
                  // 婚书长卷：照片如展开的画卷，两端红木轴头，交替左右错落
                  return (
                    <Reveal>
                      <div className="px-6 pb-2">
                        <p className="mb-3 text-center text-[11px] tracking-[0.45em]" style={{ color: theme.primary, opacity: 0.75, fontFamily: artStyle.titleFont }}>
                          一 纸 婚 书 · 白 首 同 心
                        </p>
                        <div className="flex flex-col items-center gap-7">
                          {displayPhotos.map((src, i) => (
                            <div key={i} className={`flex w-full max-w-sm ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                              <button
                                onClick={() => setPhotoPreview(i)}
                                className="group flex w-[88%] items-stretch gap-0 bg-[#fdf6ec] p-2.5 shadow-md transition-transform hover:scale-[1.02] active:scale-95"
                                style={{ borderRadius: '0.45rem', transform: `rotate(${i % 2 === 0 ? -1.5 : 1.5}deg)` }}
                                aria-label={`查看照片 ${i + 1}`}
                              >
                                <span
                                  className="h-full w-2.5 shrink-0 rounded-full shadow-inner"
                                  style={{
                                    background: 'linear-gradient(90deg,#7c4a1e,#c08a4e 45%,#7c4a1e)',
                                    border: '1px solid rgba(0,0,0,0.18)',
                                  }}
                                />
                                <img src={src} alt="" className="aspect-[4/3] w-full object-cover" loading="eager" decoding="async" onError={handleImgError} />
                                <span
                                  className="h-full w-2.5 shrink-0 rounded-full shadow-inner"
                                  style={{
                                    background: 'linear-gradient(90deg,#7c4a1e,#c08a4e 45%,#7c4a1e)',
                                    border: '1px solid rgba(0,0,0,0.18)',
                                  }}
                                />
                              </button>
                            </div>
                          ))}
                        </div>
                        <p className="mt-4 text-center text-[10px] tracking-[0.35em]" style={{ color: theme.cardSub }}>
                          —— 卷 上 写 的 是 缘 ——
                        </p>
                      </div>
                    </Reveal>
                  )
                case 'pendant':
                  // 流苏挂饰：横梁丝绳垂挂照片如香囊玉坠，底部流苏穗
                  return (
                    <Reveal>
                      <div className="px-6 pb-2">
                        <p className="mb-2 text-center text-[11px] tracking-[0.45em]" style={{ color: theme.primary, opacity: 0.75, fontFamily: artStyle.titleFont }}>
                          红 绳 结 缘 · 喜 气 盈 门
                        </p>
                        {/* 顶部横梁 */}
                        <div
                          className="mx-auto mb-1 h-1.5 w-full max-w-sm rounded-full"
                          style={{ background: `linear-gradient(90deg, transparent, ${theme.primary}99 18%, ${theme.primary}99 82%, transparent)` }}
                        />
                        <div className="flex flex-wrap items-start justify-center gap-x-5 gap-y-6">
                          {displayPhotos.map((src, i) => (
                            <div key={i} className="flex flex-col items-center">
                              {/* 丝绳（长短错落） */}
                              <span className="block w-px" style={{ height: 12 + (i % 2) * 12, background: `${theme.primary}77` }} />
                              <button
                                onClick={() => setPhotoPreview(i)}
                                className="block overflow-hidden border-2 border-white shadow-md transition-transform hover:scale-110 active:scale-95"
                                style={{ width: 78, height: 92, borderRadius: '0.55rem 0.55rem 0.95rem 0.95rem', boxShadow: '0 6px 14px rgba(0,0,0,0.22)' }}
                                aria-label={`查看照片 ${i + 1}`}
                              >
                                <img src={src} alt="" className="h-full w-full object-cover" loading="eager" decoding="async" onError={handleImgError} />
                              </button>
                              {/* 流苏穗 */}
                              <span
                                className="mt-1 block h-7 w-9"
                                style={{
                                  background: theme.primary,
                                  opacity: 0.85,
                                  clipPath: 'polygon(16% 0, 84% 0, 82% 34%, 100% 100%, 78% 60%, 66% 100%, 50% 55%, 34% 100%, 22% 60%, 0 100%, 18% 34%)',
                                }}
                              />
                            </div>
                          ))}
                        </div>
                        <p className="mt-3 text-center text-[10px] tracking-[0.3em]" style={{ color: theme.cardSub }}>
                          —— 缘 系 三 生 · 福 满 此 堂 ——
                        </p>
                      </div>
                    </Reveal>
                  )
                default:
                  // 兜底：简单拍立得墙（不可能到达，所有 case 均已列出）
                  return (
                    <Reveal>
                      <div className="px-6 pb-2">
                        <div className="flex flex-col items-center gap-7">
                          {displayPhotos.map((src, i) => (
                            <button
                              key={i}
                              onClick={() => setPhotoPreview(i)}
                              className="block bg-white p-3 pb-12 shadow-md"
                              style={{ borderRadius: '0.35rem' }}
                              aria-label={`查看照片 ${i + 1}`}
                            >
                              <img src={src} alt="" className="aspect-[4/5] w-64 max-w-[68vw] object-cover" loading="eager" decoding="async" onError={handleImgError} />
                            </button>
                          ))}
                        </div>
                      </div>
                    </Reveal>
                  )
              }
            })()}

            {/* 吉祥数折叠：默认展示 6/8/9/10 张，展开查看全部（超过吉祥数才显示切换按钮） */}
            {data.photos.length > maxShow && (
              <div className="mt-7 flex justify-center px-6">
                <button
                  onClick={() => setPhotosExpanded((v) => !v)}
                  className="inline-flex items-center gap-2 rounded-full border px-6 py-2.5 text-xs tracking-[0.3em] transition-all hover:shadow-md active:scale-95"
                  style={{
                    borderColor: `${theme.primary}55`,
                    color: theme.primary,
                    background: `${theme.primary}0d`,
                    fontFamily: artStyle.titleFont,
                  }}
                  aria-expanded={photosExpanded}
                >
                  {photosExpanded ? (
                    <>
                      收 起 · 只看 {maxShow} 张
                      <ChevronUp className="h-3.5 w-3.5" />
                    </>
                  ) : (
                    <>
                      展开查看全部 {data.photos.length} 张
                      <ChevronDown className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              </div>
            )}

            <div
              className="mt-8 mb-2 flex items-center justify-center gap-3 animate-float-y"
              style={{ color: theme.cardSub }}
            >
              <span className="h-px w-12" style={{ background: `${theme.primary}44` }} />
              <span className="text-xs tracking-[0.4em]" style={{ fontFamily: artStyle.titleFont }}>
                点击照片 · 聆听时光
              </span>
              <span className="h-px w-12" style={{ background: `${theme.primary}44` }} />
            </div>
            <p
              className="text-center text-[10px] tracking-[0.35em] pb-12"
              style={{ color: theme.cardSub, opacity: 0.7 }}
            >
              TAP · TO · VIEW · OUR · LITTLE · MOMENTS
            </p>
          </section>
        ) : (
          <section data-page={0} className="min-h-full flex flex-col justify-center px-6 py-16">
            <div className="max-w-md mx-auto w-full">
              <Reveal>
                <SectionHeading label="GALLERY" title={`${typeInfo.emoji} 最美瞬间`} style={layout.section} primary={theme.primary} titleFont={artStyle.titleFont} />
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
                <SectionHeading label="OUR STORY" title={data.nameA && data.nameB ? `${data.nameA} & ${data.nameB} 的故事` : '我们的故事'} style={layout.section} primary={theme.primary} titleFont={artStyle.titleFont} />
              </Reveal>
              <Reveal delay={150}>
                <div
                  className="rounded-3xl p-7 shadow-lg border"
                  style={{ background: '#fff', borderColor: artStyle.borderColor, borderRadius: artStyle.radius }}
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
              <SectionHeading label="WEDDING INFO" title={`${typeInfo.emoji} ${typeInfo.label}信息`} style={layout.section} primary={theme.primary} titleFont={artStyle.titleFont} />
            </Reveal>

            <Reveal delay={120}>
              <div
                className="rounded-3xl p-7 shadow-lg border"
                style={{ background: '#fff', borderColor: artStyle.borderColor, borderRadius: artStyle.radius }}
              >
                {layout.info === 'grid' ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col items-center gap-2 rounded-2xl p-4 text-center" style={{ background: theme.softBg }}>
                      <span className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: '#fff', color: theme.primary }}>
                        <Calendar className="w-5 h-5" />
                      </span>
                      <div className="text-xs" style={{ color: theme.cardSub }}>良辰吉日</div>
                      <div className="text-sm font-semibold" style={{ color: theme.cardText }}>
                        {data.date || '____'}
                        {weekday && <span className="block text-xs font-normal" style={{ color: theme.cardSub }}>{weekday}</span>}
                      </div>
                    </div>
                    {data.time && (
                      <div className="flex flex-col items-center gap-2 rounded-2xl p-4 text-center" style={{ background: theme.softBg }}>
                        <span className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: '#fff', color: theme.primary }}>
                          <Clock className="w-5 h-5" />
                        </span>
                        <div className="text-xs" style={{ color: theme.cardSub }}>吉时</div>
                        <div className="text-sm font-semibold" style={{ color: theme.cardText }}>{data.time}</div>
                      </div>
                    )}
                    {(data.venue || data.address) && (
                      <div className="col-span-2 flex items-center gap-3 rounded-2xl p-4" style={{ background: theme.softBg }}>
                        <span className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: '#fff', color: theme.primary }}>
                          <MapPin className="w-5 h-5" />
                        </span>
                        <div className="min-w-0">
                          <div className="text-xs" style={{ color: theme.cardSub }}>婚宴地点</div>
                          <div className="font-semibold truncate" style={{ color: theme.cardText }}>{data.venue || data.address}</div>
                          {data.venue && data.address && (
                            <div className="text-xs mt-0.5 truncate" style={{ color: theme.cardSub }}>{data.address}</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
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
                )}

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
                          style={{ background: '#fff', borderColor: artStyle.borderColor, borderRadius: artStyle.radius }}
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
                <SectionHeading label="SCHEDULE" title="🕊 宴会流程" style={layout.section} primary={theme.primary} titleFont={artStyle.titleFont} />
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
                          style={{ background: '#fff', borderColor: artStyle.borderColor, borderRadius: artStyle.radius }}
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
              <SectionHeading label="BLESSINGS" title="💌 祝福留言" style={layout.section} primary={theme.primary} titleFont={artStyle.titleFont} />
            </Reveal>

            <Reveal delay={120}>
              <div
                className="rounded-3xl p-6 shadow-lg border"
                style={{ background: '#fff', borderColor: artStyle.borderColor, borderRadius: artStyle.radius }}
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
          <PetalRain shapes={artStyle.petalShapes} color={artStyle.petalColor} count={14} />
          <div className="relative z-10 max-w-md mx-auto w-full">
            <Reveal>
              <div className="text-5xl mb-4 animate-float-y">{typeInfo.emoji}</div>
              <SectionHeading label="THANK YOU" title="感 谢 光 临" style={layout.section} primary="#fff" titleFont={artStyle.titleFont} dark />
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

      {/* 照片墙大图预览：左/上大图 + 右/下「爱的旁白」（艺术字 + 吉祥话 + 简介） */}
      {photoPreview !== null &&
        data.photos[photoPreview] &&
        createPortal(
          <div
            className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto px-3 py-6 sm:px-6"
            style={{
              background:
                'radial-gradient(ellipse at center, rgba(255,240,235,0.97) 0%, rgba(252,222,210,0.97) 100%)',
              backdropFilter: 'blur(6px)',
            }}
            onClick={() => setPhotoPreview(null)}
          >
            {/* 下载原图（未压缩） */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                downloadPreviewPhoto()
              }}
              className="absolute top-4 right-16 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/70 text-stone-700 backdrop-blur transition-colors hover:bg-white"
              aria-label="下载原图"
              title="下载原图（未压缩）"
            >
              <Download className="h-5 w-5" />
            </button>

            {/* 关闭按钮 */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                setPhotoPreview(null)
              }}
              className="absolute top-4 right-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/70 text-stone-700 backdrop-blur transition-colors hover:bg-white"
              aria-label="关闭预览"
            >
              <X className="h-5 w-5" />
            </button>

            {/* 主体：大图 + 爱的旁白 */}
            <div
              className="flex w-full max-w-4xl flex-col items-center gap-4 md:flex-row md:items-center md:justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={data.photos[photoPreview]}
                alt=""
                className="max-h-[50vh] w-auto max-w-full rounded-xl object-contain shadow-2xl md:max-h-[78vh]"
              />

              {/* 右侧文案（爱的旁白）—— 艺术家风格：英文标签 + 艺术字 + 吉祥话 + 简介 */}
              {(previewArtWord || previewBlessingLines.length > 0 || previewCaptionLines.length > 0) && (
                <div
                  className="flex w-full max-w-[320px] flex-col items-center justify-center text-center md:flex-1"
                  style={{ color: '#7a4f2b' }}
                >
                  {/* 顶部英文小字标签 */}
                  <div
                    className="mb-3 text-[11px] font-medium tracking-[0.42em]"
                    style={{ color: '#c08560' }}
                  >
                    WEDDING · MOMENTS
                  </div>

                  {/* 艺术字主标题 —— 巨型书法 / 楷体 / 玫瑰红色 */}
                  {previewArtWord && (
                    <div
                      className="mb-3 select-none text-[42px] leading-none font-semibold md:text-[52px]"
                      style={{
                        fontFamily:
                          "'STKaiti', 'Noto Serif SC', 'Kaiti SC', 'KaiTi', 'Songti SC', 'STSong', serif",
                        color: '#a8423f',
                        letterSpacing: '0.16em',
                        textShadow:
                          '0 1px 0 rgba(255,255,255,0.6), 0 2px 14px rgba(168,66,63,0.18)',
                      }}
                    >
                      {previewArtWord}
                    </div>
                  )}

                  {/* ❤ 装饰小图标 */}
                  <div className="mb-2 text-base" style={{ color: '#c44545' }}>
                    ❤
                  </div>

                  {/* 金色细线分隔 */}
                  <div
                    className="mb-3 h-px"
                    style={{
                      width: '38px',
                      background:
                        'linear-gradient(90deg, transparent, #c9a062, transparent)',
                    }}
                  />

                  {/* 婚礼吉祥话（楷体多行） */}
                  {previewBlessingLines.length > 0 && (
                    <div
                      className="mb-3 text-[15px] leading-[2.1] tracking-[0.16em]"
                      style={{
                        fontFamily:
                          "'STKaiti', 'KaiTi', 'Songti SC', 'Noto Serif SC', serif",
                        color: '#7a2c2a',
                      }}
                    >
                      {previewBlessingLines.map((line, i) => (
                        <p key={i} className="my-0.5">
                          {line}
                        </p>
                      ))}
                    </div>
                  )}

                  {/* 用户简介（caption）—— italic 小字 */}
                  {previewCaptionLines.length > 0 && (
                    <div
                      className="mb-3 max-w-[260px] text-[12px] leading-relaxed italic"
                      style={{
                        color: '#a07654',
                        fontFamily:
                          "'Cormorant Garamond', 'Georgia', 'Noto Serif SC', serif",
                      }}
                    >
                      “{previewCaptionLines.join(' · ')}”
                    </div>
                  )}

                  {/* 计数 —— 摄影展标签 */}
                  <div
                    className="mt-1 inline-flex items-center gap-2 rounded-full px-3 py-1"
                    style={{
                      color: '#a07654',
                      fontSize: '11px',
                      letterSpacing: '0.28em',
                      border: '1px solid rgba(192,133,96,0.35)',
                      background: 'rgba(255,251,240,0.45)',
                    }}
                  >
                    <span
                      className="inline-block h-1 w-1 rounded-full"
                      style={{ background: '#c4765a' }}
                    />
                    {String(photoPreview + 1).padStart(2, '0')}
                    <span style={{ opacity: 0.5 }}>/</span>
                    {String(photoCount).padStart(2, '0')}
                    <span
                      className="inline-block h-1 w-1 rounded-full"
                      style={{ background: '#c4765a' }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 上下张切换 */}
            {photoCount > 1 && (
              <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setPhotoPreview((photoPreview - 1 + photoCount) % photoCount)
                  }}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-white/70 text-stone-700 backdrop-blur transition-colors hover:bg-white"
                  aria-label="上一张"
                >
                  <SkipBack className="h-5 w-5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setPhotoPreview((photoPreview + 1) % photoCount)
                  }}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-white/70 text-stone-700 backdrop-blur transition-colors hover:bg-white"
                  aria-label="下一张"
                >
                  <SkipForward className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>,
          document.body
        )}
    </div>
  )

  // 统一出口：audio 始终挂载（封面页也在），封面/正文共用同一元素，播放不因切换而中断
  return (
    <>
      <audio
        key={trackIndex}
        ref={audioRef}
        src={current.src}
        preload="auto"
        className="hidden"
        onEnded={() => {
          // 默认单曲循环：播放完重播当前曲目（执子之手），不自动切歌。
          // 只有用户手动点「上一首/下一首」才会切换（APT/24 小时摇滚聚会等可选曲目）
          const a = audioRef.current
          if (a) {
            a.currentTime = 0
            a.play()
              .then(() => syncPlaying(true))
              .catch(() => syncPlaying(false))
          }
        }}
        onPlaying={() => syncPlaying(true)}
        onPause={() => syncPlaying(false)}
        onError={() => syncPlaying(false)}
      />
      {opened ? bodyJsx : coverJsx}
    </>
  )
}

export default InvitationView
