import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Calendar, Check, ChevronLeft, Clock, Copy, Eye,
  Gift, Heart, ImagePlus, MapPin, MessageCircleHeart, Music2,
  Plus, RefreshCw, Sparkles, Trash2, Upload, Users, Wand2,
} from 'lucide-react'
import { compressImage, dataUrlSizeKb } from './invitation/compressImage'
import {
  DEFAULT_INVITATION,
  INVITATION_THEMES,
  INVITATION_TYPES,
  buildShareUrl,
  decodeInvitation,
  encodeInvitation,
  getTheme,
} from '../data/invitation'
import type { InvitationData, InvitationTimelineItem, InvitationType } from '../data/invitation'
import { loadInvitation, saveInvitation } from '../lib/invitationApi'
import { InvitationView } from './invitation/InvitationView'

const inputCls =
  'w-full px-3.5 py-2.5 rounded-lg bg-input border border-primary text-primary placeholder:text-muted focus:outline-none focus:border-emerald-500 transition-colors'

// ==================== 主组件：根据 URL 参数切换 编辑/浏览 模式 ====================
export function Invitation() {
  const [searchParams, setSearchParams] = useSearchParams()
  const encoded = searchParams.get('d')
  const id = searchParams.get('id')
  const data = encoded ? decodeInvitation(encoded) : null

  // 有有效 d 参数 → 旧版长链接请柬浏览模式
  if (encoded && data) {
    return <InvitationView data={data} onBack={() => setSearchParams({})} />
  }
  if (encoded && !data) {
    return <InvalidLink />
  }
  // 有短 id → 从数据库加载请柬浏览
  if (id) {
    return <RemoteInvitation key={id} id={id} onBack={() => setSearchParams({})} />
  }
  return <InvitationEditor />
}

// ==================== 短链接请柬：从数据库异步加载 ====================
function RemoteInvitation({ id, onBack }: { id: string; onBack: () => void }) {
  const [state, setState] = useState<'loading' | 'ok' | 'error'>('loading')
  const [data, setData] = useState<InvitationData | null>(null)
  const [views, setViews] = useState(0)

  useEffect(() => {
    let alive = true
    setState('loading')
    loadInvitation(id)
      .then((d) => {
        if (!alive) return
        setData(d.data)
        setViews(d.views)
        setState('ok')
      })
      .catch(() => {
        if (alive) setState('error')
      })
    return () => {
      alive = false
    }
  }, [id])

  if (state === 'loading') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center bg-primary">
        <div className="text-6xl animate-float-y">💌</div>
        <h1 className="text-xl font-bold text-primary">请柬加载中…</h1>
        <p className="text-sm text-muted">正在从云端获取您的邀请函</p>
      </div>
    )
  }
  if (state === 'error' || !data) return <InvalidLink />
  return <InvitationView data={data} onBack={onBack} views={views} />
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

  const setPhoto = (i: number, url: string) =>
    setData((d) => ({ ...d, photos: d.photos.map((p, idx) => (idx === i ? url : p)) }))
  const addPhoto = () =>
    setData((d) => ({ ...d, photos: [...d.photos, ''] }))
  const removePhoto = (i: number) =>
    setData((d) => ({
      ...d,
      photos: d.photos.filter((_, idx) => idx !== i),
      photoCaptions: d.photoCaptions ? d.photoCaptions.filter((_, idx) => idx !== i) : undefined,
      photoArtWords: d.photoArtWords ? d.photoArtWords.filter((_, idx) => idx !== i) : undefined,
      photoBlessings: d.photoBlessings
        ? d.photoBlessings.filter((_, idx) => idx !== i)
        : undefined,
    }))
  const setPhotoCaption = (i: number, caption: string) =>
    setData((d) => {
      const caps = Array.isArray(d.photoCaptions) ? [...d.photoCaptions] : []
      while (caps.length < d.photos.length) caps.push('')
      caps[i] = caption
      return { ...d, photoCaptions: caps }
    })
  /** 艺术字（1-4 字）——留空时浏览端按索引从默认库 ART_WORDS_DEFAULT 自动取 */
  const setPhotoArtWord = (i: number, v: string) =>
    setData((d) => {
      const arr = Array.isArray(d.photoArtWords) ? [...d.photoArtWords] : []
      while (arr.length < d.photos.length) arr.push('')
      arr[i] = v
      return { ...d, photoArtWords: arr }
    })
  /** 婚礼吉祥话（多行，'\n' 换行）——留空时浏览端按索引从 BLESSINGS_DEFAULT 自动取 */
  const setPhotoBlessing = (i: number, v: string) =>
    setData((d) => {
      const arr = Array.isArray(d.photoBlessings) ? [...d.photoBlessings] : []
      while (arr.length < d.photos.length) arr.push('')
      arr[i] = v
      return { ...d, photoBlessings: arr }
    })
  /** 兼容老数据：保留 toggleFeatured 接口但 noop（"心形精选"功能已废弃） */
  const toggleFeatured = (_i: number) => setData((d) => d)

  // —— 本地上传照片：canvas 压缩为 base64 后嵌入数据（随链接分享）——
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadErr, setUploadErr] = useState('')
  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploading(true)
    setUploadErr('')
    try {
      const added: string[] = []
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue
        added.push(await compressImage(file))
      }
      if (added.length === 0) {
        setUploadErr('未识别到有效图片文件')
        return
      }
      setData((d) => ({ ...d, photos: [...d.photos.filter(Boolean), ...added] }))
    } catch {
      setUploadErr('图片处理失败，请换一张试试')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }
  // 数据中 base64 图片的总体积估算
  const embeddedKb = useMemo(
    () => data.photos.filter((p) => p.startsWith('data:')).reduce((sum, p) => sum + dataUrlSizeKb(p), 0),
    [data.photos]
  )

  const setTimelineItem = (i: number, patch: Partial<InvitationTimelineItem>) =>
    setData((d) => ({ ...d, timeline: d.timeline.map((it, idx) => (idx === i ? { ...it, ...patch } : it)) }))
  const addTimelineItem = () =>
    setData((d) => ({ ...d, timeline: [...d.timeline, { time: '', title: '', desc: '' }] }))
  const removeTimelineItem = (i: number) =>
    setData((d) => ({ ...d, timeline: d.timeline.filter((_, idx) => idx !== i) }))

  // 已保存到数据库的短 ID（未保存时回退旧的长链接方案）
  const [savedId, setSavedId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const shareUrl = useMemo(
    () =>
      savedId
        ? `${window.location.origin}/invitation?id=${savedId}`
        : buildShareUrl(data, window.location.origin),
    [data, savedId]
  )

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* ignore */
    }
  }

  // 生成分享链接：优先上传数据库换取 8 位短 ID；后端不可用时回退旧的长链接
  const goShare = async () => {
    if (saving) return
    setSaving(true)
    try {
      const id = await saveInvitation(data)
      setSavedId(id)
      setSearchParams({ id })
    } catch {
      setSearchParams({ d: encodeInvitation(data) })
    } finally {
      setSaving(false)
    }
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
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:scale-105 transition-all disabled:opacity-60 disabled:hover:scale-100"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {saving ? '保存中…' : '生成并查看请柬'}
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

            {/* 照片墙 */}
            <section className="bg-secondary rounded-2xl border border-primary p-5 sm:p-6">
              <SectionTitle icon={ImagePlus} text="照片墙（可选）" />
              <p className="text-xs text-muted mb-3 leading-relaxed">
                宾客将以<b className="text-primary">心形铺满墙</b>形式查看：所有照片自动填满心形（缩略图按数量自适应），
                超过 60 张时剩余照片在下方平铺；点击任意照片可查看大图与<b className="text-primary">照片简介</b>。支持
                <b className="text-primary">本地上传</b>（自动压缩嵌入链接，建议 ≤6 张）或粘贴图床直链。
              </p>

              {/* 上传按钮组 */}
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleUpload(e.target.files)}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-green-600 hover:scale-105 hover:shadow-lg transition-all disabled:opacity-60"
                >
                  <Upload className="w-4 h-4" />
                  {uploading ? '正在处理…' : '上传照片'}
                </button>
                {embeddedKb > 0 && (
                  <span className="text-xs text-amber-400/90">
                    已嵌入图片共约 {embeddedKb} KB
                    {embeddedKb > 900 ? '（链接会很长，建议用图床直链）' : ''}
                  </span>
                )}
                {uploadErr && <span className="text-xs text-rose-400">{uploadErr}</span>}
              </div>

              {/* 说明：所有照片自动铺满心形 */}
              <div className="mb-3 flex items-center justify-between rounded-lg bg-tertiary/40 px-3 py-2">
                <span className="text-xs text-muted">
                  💖 所有照片自动 <b className="text-primary">铺满心形</b>（缩略图按数量自适应，60 张以内全部进心形、超过则下方平铺）
                </span>
                <span className="text-[11px] text-muted/80">点击任意照片查看大图与简介</span>
              </div>

              <div className="space-y-2.5">
                {data.photos.map((url, i) => {
                  return (
                    <div key={i} className="rounded-xl border border-primary/40 bg-tertiary/30 p-2.5">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          {url && (
                            <img
                              src={url}
                              alt=""
                              className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-md object-cover border border-primary"
                              onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
                            />
                          )}
                          <input
                            className={`${inputCls} ${url ? 'pl-14' : ''} ${url.startsWith('data:') ? 'pr-24' : ''}`}
                            value={url.startsWith('data:') ? '（已上传图片）' : url}
                            onChange={(e) => setPhoto(i, e.target.value)}
                            placeholder={`照片 ${i + 1} 的图片直链`}
                          />
                          {url.startsWith('data:') && (
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                              {dataUrlSizeKb(url)}KB
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => removePhoto(i)}
                          className="shrink-0 px-3 rounded-lg bg-tertiary text-muted hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="删除此照片"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <input
                        className={`${inputCls} mt-2 !py-2 text-xs`}
                        value={(data.photoCaptions?.[i] as string) ?? ''}
                        onChange={(e) => setPhotoCaption(i, e.target.value)}
                        placeholder={`照片 ${i + 1} 的简介（点开大图时显示，可留空）`}
                      />
                      {/* 艺术字 + 吉祥话 —— 两栏：1-4 字艺术字 / 多行婚礼吉祥话 */}
                      <div className="mt-1.5 grid grid-cols-[80px_1fr] gap-1.5">
                        <input
                          className={`${inputCls} !py-1.5 !px-2 text-xs text-center`}
                          maxLength={6}
                          value={(data.photoArtWords?.[i] as string) ?? ''}
                          onChange={(e) => setPhotoArtWord(i, e.target.value)}
                          placeholder="艺术字"
                          style={{
                            fontFamily:
                              "'STKaiti', 'KaiTi', 'Noto Serif SC', 'Songti SC', serif",
                            fontWeight: 600,
                            letterSpacing: '0.1em',
                          }}
                          title="艺术字（1-4 字，留空则按张序从默认库取：初见/执手/相知/相守/...）"
                        />
                        <textarea
                          rows={2}
                          className={`${inputCls} !py-1.5 !px-2 text-xs resize-none`}
                          value={(data.photoBlessings?.[i] as string) ?? ''}
                          onChange={(e) => setPhotoBlessing(i, e.target.value)}
                          placeholder="婚礼吉祥话（用回车换行；留空则按张序从默认库取）"
                          style={{
                            fontFamily:
                              "'STKaiti', 'KaiTi', 'Noto Serif SC', 'Songti SC', serif",
                          }}
                          title="婚礼吉祥话（如：执子之手\\n与子偕老）"
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
              <button
                onClick={addPhoto}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-emerald-400 border border-dashed border-emerald-500/40 hover:bg-emerald-500/10 transition-colors"
              >
                <Plus className="w-4 h-4" />
                添加直链
              </button>
            </section>

            {/* 我们的故事 */}
            <section className="bg-secondary rounded-2xl border border-primary p-5 sm:p-6">
              <SectionTitle icon={Heart} text="我们的故事（可选）" />
              <p className="text-xs text-muted mb-3 leading-relaxed">
                宾客浏览时将以“故事卡”形式展示，支持多段落（空行分段）。
              </p>
              <textarea
                className={`${inputCls} min-h-[140px] resize-y`}
                value={data.story}
                onChange={(e) => set('story', e.target.value)}
                placeholder="写下你们的相识、相知、相守的故事…"
              />
            </section>

            {/* 宴会流程 */}
            <section className="bg-secondary rounded-2xl border border-primary p-5 sm:p-6">
              <SectionTitle icon={MapPin} text="宴会流程（可选）" />
              <p className="text-xs text-muted mb-4 leading-relaxed">宾客将看到时间线形式的流程安排，可增删。</p>
              <div className="space-y-3">
                {data.timeline.map((item, i) => (
                  <div key={i} className="rounded-xl border border-primary bg-tertiary/30 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-muted">环节 {i + 1}</span>
                      <button
                        onClick={() => removeTimelineItem(i)}
                        className="p-1 rounded-md text-muted hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="删除此环节"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="grid sm:grid-cols-[90px_1fr] gap-2">
                      <input
                        className={inputCls}
                        value={item.time}
                        onChange={(e) => setTimelineItem(i, { time: e.target.value })}
                        placeholder="时间 18:00"
                      />
                      <input
                        className={inputCls}
                        value={item.title}
                        onChange={(e) => setTimelineItem(i, { title: e.target.value })}
                        placeholder="环节名称，如 婚礼仪式"
                      />
                    </div>
                    <input
                      className={`${inputCls} mt-2`}
                      value={item.desc}
                      onChange={(e) => setTimelineItem(i, { desc: e.target.value })}
                      placeholder="环节说明（可留空）"
                    />
                  </div>
                ))}
              </div>
              <button
                onClick={addTimelineItem}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-emerald-400 border border-dashed border-emerald-500/40 hover:bg-emerald-500/10 transition-colors"
              >
                <Plus className="w-4 h-4" />
                添加环节
              </button>
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
                placeholder="粘贴音乐直链（mp3/ogg）；留空则自动播放内置歌单（24小时摇滚聚会 / APT. 轮播）"
              />
              <p className="mt-2 text-xs text-secondary">
                内置歌单会自动轮播并支持切换/关闭；填写直链后将在歌单末尾追加播放
              </p>
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
                disabled={saving}
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold hover:scale-[1.02] transition-all disabled:opacity-60 disabled:hover:scale-100"
              >
                {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                {saving ? '保存中…' : '生成分享链接'}
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

export default Invitation
