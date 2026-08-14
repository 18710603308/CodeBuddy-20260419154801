import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft, Calendar, Check, ChevronLeft, Clock, Copy, ExternalLink, Eye,
  Gift, Heart, MapPin, MessageCircleHeart, Music2,
  Pause, Play, RefreshCw, Share2, Sparkles, Users, Wand2,
} from 'lucide-react'
import {
  DEFAULT_INVITATION,
  INVITATION_THEMES,
  INVITATION_TYPES,
  buildMapUrl,
  buildShareUrl,
  decodeInvitation,
  encodeInvitation,
  getTheme,
} from '../data/invitation'
import type { InvitationData, InvitationType } from '../data/invitation'

const inputCls =
  'w-full px-3.5 py-2.5 rounded-lg bg-input border border-primary text-primary placeholder:text-muted focus:outline-none focus:border-emerald-500 transition-colors'

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

// ==================== 主组件：根据 URL 参数切换 编辑/浏览 模式 ====================
export function Invitation() {
  const [searchParams, setSearchParams] = useSearchParams()
  const encoded = searchParams.get('d')
  const data = encoded ? decodeInvitation(encoded) : null

  // 有有效 d 参数 → 请柬浏览模式；否则进入编辑器
  if (encoded && data) {
    return <InvitationView data={data} onBack={() => setSearchParams({})} />
  }
  if (encoded && !data) {
    return <InvalidLink />
  }
  return <InvitationEditor />
}

// ==================== 链接无效提示 ====================
function InvalidLink() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center bg-primary">
      <div className="text-6xl">🥀</div>
      <h1 className="text-2xl font-bold text-primary">请柬链接无效或已过期</h1>
      <p className="text-muted">请向发送者重新获取有效的邀请函链接</p>
      <Link
        to="/invitation"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold hover:scale-105 transition-all"
      >
        <Wand2 className="w-5 h-5" />
        自己制作电子请柬
      </Link>
      <Link to="/" className="text-sm text-muted hover:text-primary transition-colors">
        返回首页
      </Link>
    </div>
  )
}

// ==================== 编辑器（制作请柬） ====================
function InvitationEditor() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [data, setData] = useState<InvitationData>(DEFAULT_INVITATION)
  const [copied, setCopied] = useState(false)
  const theme = getTheme(data.themeId)
  const typeInfo = INVITATION_TYPES[data.type]

  const set = <K extends keyof InvitationData>(key: K, value: InvitationData[K]) =>
    setData((d) => ({ ...d, [key]: value }))

  const shareUrl = useMemo(() => buildShareUrl(data, window.location.origin), [data])

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* ignore */
    }
  }

  const goShare = () => {
    setSearchParams({ d: encodeInvitation(data) })
  }

  const reset = () => setData(DEFAULT_INVITATION)

  return (
    <div className="min-h-screen bg-primary">
      {/* 顶部栏 */}
      <header className="sticky top-0 z-40 bg-primary/90 backdrop-blur-xl border-b border-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link to="/" className="p-2 rounded-lg hover:bg-tertiary transition-colors shrink-0">
              <ChevronLeft className="w-5 h-5 text-primary" />
            </Link>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-primary flex items-center gap-2 truncate">
                <Gift className="w-5 h-5 text-rose-500" />
                电子请柬制作
              </h1>
              <p className="text-xs text-muted hidden sm:block">填写信息 · 实时预览 · 一键生成分享链接</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={copyLink}
              className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-sm font-semibold bg-secondary border border-primary text-primary hover:bg-tertiary transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span className="hidden sm:inline">{copied ? '已复制' : '复制链接'}</span>
            </button>
            <button
              onClick={goShare}
              className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:scale-105 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              生成并查看请柬
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid lg:grid-cols-[1fr_400px] gap-8 items-start">
          {/* ============ 左侧：表单 ============ */}
          <div className="space-y-6">
            {/* 类型 */}
            <section className="bg-secondary rounded-2xl border border-primary p-5 sm:p-6">
              <SectionTitle icon={Gift} text="请柬类型" />
              <div className="grid grid-cols-5 gap-2">
                {(Object.keys(INVITATION_TYPES) as InvitationType[]).map((t) => {
                  const info = INVITATION_TYPES[t]
                  const active = data.type === t
                  return (
                    <button
                      key={t}
                      onClick={() => set('type', t)}
                      className={`flex flex-col items-center gap-1 py-3 rounded-xl border transition-all ${
                        active
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                          : 'border-primary bg-tertiary/40 text-muted hover:border-emerald-500/40'
                      }`}
                    >
                      <span className="text-xl">{info.emoji}</span>
                      <span className="text-xs font-medium">{info.label}</span>
                    </button>
                  )
                })}
              </div>
            </section>

            {/* 主角信息 */}
            <section className="bg-secondary rounded-2xl border border-primary p-5 sm:p-6">
              <SectionTitle icon={Users} text="主角信息" />
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label={typeInfo.aLabel}>
                  <input
                    className={inputCls}
                    value={data.nameA}
                    onChange={(e) => set('nameA', e.target.value)}
                    placeholder={`${typeInfo.aLabel}姓名`}
                  />
                </Field>
                <Field label={typeInfo.bLabel}>
                  <input
                    className={inputCls}
                    value={data.nameB}
                    onChange={(e) => set('nameB', e.target.value)}
                    placeholder={`${typeInfo.bLabel}姓名`}
                  />
                </Field>
              </div>
              <div className="mt-4">
                <Field label="邀请人（底部签名，可留空）">
                  <input
                    className={inputCls}
                    value={data.host}
                    onChange={(e) => set('host', e.target.value)}
                    placeholder="例如：张伟 & 李娜 全家"
                  />
                </Field>
              </div>
            </section>

            {/* 时间地点 */}
            <section className="bg-secondary rounded-2xl border border-primary p-5 sm:p-6">
              <SectionTitle icon={Calendar} text="时间与地点" />
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="日期">
                  <input
                    type="date"
                    className={inputCls}
                    value={data.date}
                    onChange={(e) => set('date', e.target.value)}
                  />
                </Field>
                <Field label="时间">
                  <input
                    type="time"
                    className={inputCls}
                    value={data.time}
                    onChange={(e) => set('time', e.target.value)}
                  />
                </Field>
              </div>
              <div className="mt-4 space-y-4">
                <Field label="地点（酒店 / 餐厅 / 场地名）">
                  <input
                    className={inputCls}
                    value={data.venue}
                    onChange={(e) => set('venue', e.target.value)}
                    placeholder="例如：上海外滩华尔道夫酒店"
                  />
                </Field>
                <Field label="详细地址">
                  <input
                    className={inputCls}
                    value={data.address}
                    onChange={(e) => set('address', e.target.value)}
                    placeholder="例如：上海市黄浦区中山东一路2号"
                  />
                </Field>
              </div>
            </section>

            {/* 邀请语 */}
            <section className="bg-secondary rounded-2xl border border-primary p-5 sm:p-6">
              <SectionTitle icon={MessageCircleHeart} text="邀请语" />
              <textarea
                className={`${inputCls} min-h-[120px] resize-y`}
                value={data.message}
                onChange={(e) => set('message', e.target.value)}
                placeholder="写下想对宾客说的话…"
              />
            </section>

            {/* 主题 */}
            <section className="bg-secondary rounded-2xl border border-primary p-5 sm:p-6">
              <SectionTitle icon={Sparkles} text="请柬主题" />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {INVITATION_THEMES.map((t) => {
                  const active = data.themeId === t.id
                  return (
                    <button
                      key={t.id}
                      onClick={() => set('themeId', t.id)}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                        active ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-primary hover:border-emerald-500/40'
                      }`}
                    >
                      <span
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-lg shrink-0"
                        style={{ background: t.gradient }}
                      >
                        {t.emoji}
                      </span>
                      <span className="text-left min-w-0">
                        <span className="block text-sm font-medium text-primary truncate">{t.name}</span>
                        <span className="block text-xs text-muted truncate">{t.desc}</span>
                      </span>
                    </button>
                  )
                })}
              </div>
            </section>

            {/* 音乐 & 开关 */}
            <section className="bg-secondary rounded-2xl border border-primary p-5 sm:p-6">
              <SectionTitle icon={Music2} text="背景音乐（可选）" />
              <input
                className={inputCls}
                value={data.music}
                onChange={(e) => set('music', e.target.value)}
                placeholder="粘贴音乐直链（mp3/ogg），留空则不播放"
              />
              <label className="mt-4 flex items-center justify-between gap-3 cursor-pointer">
                <span className="text-sm text-secondary">请柬中显示倒计时</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={data.showCountdown}
                  onClick={() => set('showCountdown', !data.showCountdown)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    data.showCountdown ? 'bg-emerald-500' : 'bg-tertiary'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      data.showCountdown ? 'translate-x-[22px]' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </label>
            </section>

            {/* 底部操作 */}
            <div className="flex flex-col sm:flex-row gap-3 pb-8">
              <button
                onClick={goShare}
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold hover:scale-[1.02] transition-all"
              >
                <Sparkles className="w-5 h-5" />
                生成分享链接
              </button>
              <button
                onClick={copyLink}
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-secondary border border-primary text-primary font-semibold hover:bg-tertiary transition-colors"
              >
                {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
                {copied ? '链接已复制' : '复制分享链接'}
              </button>
              <button
                onClick={reset}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-muted hover:text-primary hover:bg-tertiary transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
                重置
              </button>
            </div>
          </div>

          {/* ============ 右侧：实时预览 ============ */}
          <div className="lg:sticky lg:top-24">
            <div className="text-center text-xs text-muted mb-3 flex items-center justify-center gap-1.5">
              <Eye className="w-3.5 h-3.5" />
              手机端实时预览
            </div>
            <InvitationPreview data={data} />
          </div>
        </div>
      </main>
    </div>
  )
}

function SectionTitle({ icon: Icon, text }: { icon: React.ComponentType<{ className?: string }>; text: string }) {
  return (
    <h2 className="flex items-center gap-2 text-base font-semibold text-primary mb-4">
      <Icon className="w-4 h-4 text-emerald-400" />
      {text}
    </h2>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-muted mb-1.5">{label}</label>
      {children}
    </div>
  )
}

// ==================== 预览卡片（编辑器右侧） ====================
function InvitationPreview({ data }: { data: InvitationData }) {
  const theme = getTheme(data.themeId)
  const typeInfo = INVITATION_TYPES[data.type]
  const weekday = useMemo(() => {
    const d = new Date(`${data.date}T00:00:00`)
    return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('zh-CN', { weekday: 'long' })
  }, [data.date])

  return (
    <div
      className="mx-auto max-w-[340px] rounded-[28px] p-2 shadow-2xl"
      style={{ background: 'linear-gradient(145deg, rgba(255,255,255,0.18), rgba(255,255,255,0.05))', border: '1px solid rgba(255,255,255,0.15)' }}
    >
      <div
        className="rounded-[22px] overflow-hidden font-serif"
        style={{ background: theme.gradient, color: '#fff' }}
      >
        <div className="px-7 pt-9 pb-8 text-center relative">
          {/* 装饰 */}
          <div className="absolute inset-x-0 top-4 flex justify-center gap-6 text-white/70 text-sm tracking-[0.5em]">
            <span>{theme.emoji}</span>
          </div>
          <div className="text-xs tracking-[0.45em] text-white/80 mb-1">INVITATION</div>
          <div className="text-xl font-semibold mb-5">{typeInfo.title}</div>

          <div className="my-2 text-3xl font-bold leading-snug">
            {data.nameA || 'XXX'}
            {data.nameB && (
              <>
                <span className="text-2xl px-2 align-middle">
                  <Heart className="w-6 h-6 inline text-rose-200" fill="currentColor" />
                </span>
                {data.nameB}
              </>
            )}
          </div>

          <div className="my-6 w-16 h-px bg-white/40 mx-auto" />

          <div className="space-y-1.5 text-sm text-white/90">
            <div className="flex items-center justify-center gap-2">
              <Calendar className="w-4 h-4" />
              {data.date || '2026-10-01'}
              {weekday && <span className="text-white/70">{weekday}</span>}
            </div>
            {data.time && (
              <div className="flex items-center justify-center gap-2">
                <Clock className="w-4 h-4" />
                {data.time}
              </div>
            )}
            {(data.venue || data.address) && (
              <div className="flex items-center justify-center gap-2">
                <MapPin className="w-4 h-4" />
                <span className="truncate max-w-[220px]">{data.venue || data.address}</span>
              </div>
            )}
          </div>

          <div className="mt-6 px-4 py-2.5 rounded-full bg-white/15 backdrop-blur text-sm text-white">
            点击开启请柬
          </div>
        </div>
      </div>
    </div>
  )
}

// ==================== 请柬浏览模式（分享给宾客的页面） ====================
function InvitationView({ data, onBack }: { data: InvitationData; onBack: () => void }) {
  const [opened, setOpened] = useState(false)
  const [copied, setCopied] = useState(false)
  const [musicPlaying, setMusicPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

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

  const openInvitation = () => {
    setOpened(true)
    // 用户交互后尝试自动播放音乐
    const a = audioRef.current
    if (a && data.music) {
      a.play()
        .then(() => setMusicPlaying(true))
        .catch(() => setMusicPlaying(false))
    }
  }

  const toggleMusic = () => {
    const a = audioRef.current
    if (!a) return
    if (musicPlaying) {
      a.pause()
      setMusicPlaying(false)
    } else {
      a.play()
        .then(() => setMusicPlaying(true))
        .catch(() => setMusicPlaying(false))
    }
  }

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

  const mapUrl = buildMapUrl(data.venue, data.address)
  const weekday = useMemo(() => {
    const d = new Date(`${data.date}T00:00:00`)
    return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('zh-CN', { weekday: 'long' })
  }, [data.date])

  return (
    <div className="min-h-screen font-serif" style={{ background: theme.gradient }}>
      {/* 背景音乐 */}
      {data.music && (
        <>
          <audio ref={audioRef} src={data.music} loop preload="none" />
          <button
            onClick={toggleMusic}
            className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-white/20 backdrop-blur-lg text-white flex items-center justify-center shadow-lg hover:bg-white/30 transition-colors"
            title={musicPlaying ? '暂停音乐' : '播放音乐'}
          >
            {musicPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>
        </>
      )}

      <div className="max-w-md mx-auto relative min-h-screen">
        {/* 顶部浮动操作条 */}
        {opened && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md flex items-center justify-between gap-2 rounded-full bg-black/25 backdrop-blur-xl px-4 py-2 text-white text-sm">
            <button onClick={onBack} className="inline-flex items-center gap-1.5 hover:text-white/80 transition-colors">
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
        )}

        {/* ===== 封面 ===== */}
        {!opened && (
          <div className="flex flex-col items-center justify-center min-h-screen px-8 text-center text-white">
            <div className="text-6xl mb-4 drop-shadow-lg">{typeInfo.emoji}</div>
            <div className="text-xs tracking-[0.5em] text-white/70 mb-2">INVITATION</div>
            <h1 className="text-4xl font-bold mb-2">{typeInfo.title}</h1>
            <div className="my-6 w-16 h-px bg-white/50" />
            <div className="text-3xl font-bold leading-relaxed mb-6">
              {data.nameA || 'XXX'}
              {data.nameB && (
                <>
                  <span className="text-2xl px-3 align-middle">
                    <Heart className="w-7 h-7 inline text-rose-200" fill="currentColor" />
                  </span>
                  {data.nameB}
                </>
              )}
            </div>
            <p className="text-white/80 mb-10">
              {data.date || '____'}
              {weekday && `（${weekday}）`}
              {data.time && ` ${data.time}`}
            </p>
            <button
              onClick={openInvitation}
              className="px-10 py-4 rounded-full bg-white/20 backdrop-blur-lg border border-white/40 text-lg font-semibold hover:bg-white/30 hover:scale-105 transition-all shadow-xl"
            >
              开启请柬
            </button>
          </div>
        )}

        {/* ===== 请柬正文 ===== */}
        {opened && (
          <div className="px-6 pt-24 pb-28 text-center text-white">
            <div className="text-5xl mb-5">{typeInfo.emoji}</div>
            <div className="text-xs tracking-[0.5em] text-white/70 mb-3">INVITATION</div>
            <h1 className="text-3xl font-bold mb-3">{typeInfo.title}</h1>

            <div className="text-3xl font-bold leading-relaxed mb-8">
              {data.nameA || 'XXX'}
              {data.nameB && (
                <>
                  <span className="text-2xl px-3 align-middle">
                    <Heart className="w-7 h-7 inline text-rose-200" fill="currentColor" />
                  </span>
                  {data.nameB}
                </>
              )}
            </div>

            {/* 邀请语 */}
            <p className="text-white/90 leading-relaxed mb-10 whitespace-pre-line max-w-sm mx-auto">
              {data.message || typeInfo.invite}
            </p>

            {/* 信息卡 */}
            <div className="rounded-3xl bg-white/12 backdrop-blur-md p-6 mb-8 space-y-4">
              <div className="flex items-center justify-center gap-3">
                <Calendar className="w-5 h-5 text-white/80 shrink-0" />
                <span className="text-lg">
                  {data.date || '____'}
                  {weekday && <span className="text-white/70 ml-2">{weekday}</span>}
                </span>
              </div>
              {data.time && (
                <div className="flex items-center justify-center gap-3">
                  <Clock className="w-5 h-5 text-white/80 shrink-0" />
                  <span className="text-lg">{data.time}</span>
                </div>
              )}
              {(data.venue || data.address) && (
                <div className="flex items-center justify-center gap-3">
                  <MapPin className="w-5 h-5 text-white/80 shrink-0" />
                  <span className="text-lg">{data.venue || data.address}</span>
                </div>
              )}
              {(data.venue || data.address) && (
                <a
                  href={mapUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-white/20 hover:bg-white/30 text-sm font-semibold transition-colors"
                >
                  查看地图
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>

            {/* 倒计时 */}
            {data.showCountdown && countdown && (
              <div className="mb-10">
                <div className="text-sm text-white/70 mb-3 tracking-widest">
                  {countdown.passed ? '宴会正在进行中' : '距离宴会开始还有'}
                </div>
                {!countdown.passed && (
                  <div className="flex justify-center gap-3">
                    {[
                      { v: countdown.days, label: '天' },
                      { v: countdown.hours, label: '时' },
                      { v: countdown.minutes, label: '分' },
                      { v: countdown.seconds, label: '秒' },
                    ].map((it) => (
                      <div key={it.label} className="w-16 rounded-2xl bg-white/15 backdrop-blur-md py-3">
                        <div className="text-2xl font-bold tabular-nums">{it.v}</div>
                        <div className="text-xs text-white/70 mt-1">{it.label}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 留言祝福 */}
            <div className="rounded-3xl bg-white/12 backdrop-blur-md p-6 mb-8 text-left">
              <h2 className="flex items-center gap-2 text-white font-semibold mb-4">
                <MessageCircleHeart className="w-5 h-5" />
                祝福留言（{wishes.length}）
              </h2>
              <div className="space-y-3 mb-5">
                {wishes.length === 0 && (
                  <p className="text-sm text-white/60 text-center py-3">还没有留言，来送上你的祝福吧～</p>
                )}
                {wishes.map((w, i) => (
                  <div key={i} className="bg-white/10 rounded-xl p-3">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-sm font-semibold text-white/90">{w.name}</span>
                      <span className="text-xs text-white/50">
                        {new Date(w.time).toLocaleDateString('zh-CN')}
                      </span>
                    </div>
                    <p className="text-sm text-white/80 break-words">{w.text}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-2.5">
                <input
                  className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/25 text-white placeholder:text-white/50 focus:outline-none focus:border-white/60"
                  placeholder="你的名字"
                  value={wishName}
                  onChange={(e) => setWishName(e.target.value)}
                  maxLength={20}
                />
                <textarea
                  className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/25 text-white placeholder:text-white/50 focus:outline-none focus:border-white/60 resize-none"
                  placeholder="送上你的祝福…"
                  value={wishText}
                  onChange={(e) => setWishText(e.target.value)}
                  maxLength={120}
                  rows={2}
                />
                <button
                  onClick={submitWish}
                  className="w-full py-2.5 rounded-xl bg-white/20 hover:bg-white/30 font-semibold text-sm transition-colors"
                >
                  送出祝福
                </button>
              </div>
            </div>

            {/* 底部签名 */}
            <div className="text-white/80 text-sm leading-relaxed mb-10">
              <p>{typeInfo.invite}</p>
              {data.host && <p className="mt-3 text-white font-semibold text-base">{data.host} 敬邀</p>}
            </div>

            <div className="w-16 h-px bg-white/40 mx-auto mb-8" />

            <Link
              to="/invitation"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/15 hover:bg-white/25 text-sm font-semibold transition-colors"
            >
              <Wand2 className="w-4 h-4" />
              我也要制作电子请柬
            </Link>

            <div className="mt-10 pb-4 text-xs text-white/40">
              Made with <Heart className="w-3 h-3 inline text-rose-300" fill="currentColor" /> DevTools Hub
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Invitation
