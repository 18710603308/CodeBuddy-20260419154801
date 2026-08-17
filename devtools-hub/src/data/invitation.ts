/**
 * 电子请柬 - 数据模型 / 主题 / 编解码工具
 * 纯前端实现：请柬数据编码进 URL query (?d=base64url)，分享链接即请柬本体
 */

export type InvitationType = 'wedding' | 'birthday' | 'baby' | 'moving' | 'party'

export interface InvitationTimelineItem {
  /** 时间，如 18:00 */
  time: string
  /** 环节标题，如 婚礼仪式 */
  title: string
  /** 环节说明 */
  desc: string
}

export interface InvitationData {
  /** 请柬类型 */
  type: InvitationType
  /** 邀请人（底部署名，可空） */
  host: string
  /** 主角A（婚礼=新郎 / 生日=寿星 / 满月=宝宝 ...） */
  nameA: string
  /** 主角B（婚礼=新娘 / 其他=可选搭档） */
  nameB: string
  /** 日期 yyyy-mm-dd */
  date: string
  /** 时间 HH:mm */
  time: string
  /** 地点（酒店/餐厅名） */
  venue: string
  /** 详细地址 */
  address: string
  /** 邀请语 */
  message: string
  /** 主题 id */
  themeId: string
  /** 背景音乐 URL（可选） */
  music: string
  /** 是否显示倒计时 */
  showCountdown: boolean
  /** 照片墙（图片直链数组，可空则显示主题插画） */
  photos: string[]
  /**
   * 每张照片的简介文案（与 photos 下标对齐，可空）
   * 浏览端 Lightbox 大图下方会以卡片形式展示该文案
   */
  photoCaptions?: string[]
  /**
   * 心形墙精选展示的照片下标（最多 6 张；空数组则按 photos 前 6 张填充）
   * 心形墙只展示精选照片，互不重叠、保证可点击
   * 其余照片在浏览页另以平铺方式展示
   */
  featuredIndexes?: number[]
  /** 我们的故事（一段文字） */
  story: string
  /** 宴会/活动流程时间线 */
  timeline: InvitationTimelineItem[]
}

export interface InvitationTheme {
  id: string
  name: string
  desc: string
  emoji: string
  /** 主色 */
  primary: string
  primaryDark: string
  /** 请柬背景渐变 */
  gradient: string
  /** 卡片底色 */
  cardBg: string
  cardText: string
  cardSub: string
  /** 编辑页柔色背景 */
  softBg: string
}

export const INVITATION_TYPES: Record<
  InvitationType,
  { label: string; aLabel: string; bLabel: string; title: string; emoji: string; invite: string }
> = {
  wedding: { label: '婚礼', aLabel: '新郎', bLabel: '新娘', title: '婚礼邀请函', emoji: '💍', invite: '诚邀您见证我们的幸福时刻' },
  birthday: { label: '生日', aLabel: '寿星', bLabel: '搭档', title: '生日邀请函', emoji: '🎂', invite: '诚邀您共赴生日宴会' },
  baby: { label: '满月', aLabel: '宝宝', bLabel: '妈妈', title: '满月宴邀请函', emoji: '👶', invite: '诚邀您同贺喜得贵子之喜' },
  moving: { label: '乔迁', aLabel: '户主', bLabel: '户主', title: '乔迁之喜邀请函', emoji: '🏠', invite: '诚邀您莅临新居共庆乔迁' },
  party: { label: '派对', aLabel: '主角', bLabel: '嘉宾', title: '派对邀请函', emoji: '🎉', invite: '诚邀您加入这场欢乐派对' },
}

export const INVITATION_THEMES: InvitationTheme[] = [
  {
    id: 'classic-red',
    name: '中国红',
    desc: '喜庆中式婚礼',
    emoji: '🏮',
    primary: '#e11d48',
    primaryDark: '#be123c',
    gradient: 'linear-gradient(165deg,#fda4af 0%,#f43f5e 48%,#be123c 100%)',
    cardBg: '#fffaf0',
    cardText: '#be123c',
    cardSub: '#fb7185',
    softBg: 'rgba(244,63,94,0.1)',
  },
  {
    id: 'gold',
    name: '香槟金',
    desc: '西式浪漫婚礼',
    emoji: '🥂',
    primary: '#d97706',
    primaryDark: '#b45309',
    gradient: 'linear-gradient(165deg,#fde68a 0%,#f59e0b 48%,#b45309 100%)',
    cardBg: '#fffbeb',
    cardText: '#92400e',
    cardSub: '#d97706',
    softBg: 'rgba(245,158,11,0.12)',
  },
  {
    id: 'rose',
    name: '浪漫粉',
    desc: '甜蜜求婚宴会',
    emoji: '🌹',
    primary: '#ec4899',
    primaryDark: '#db2777',
    gradient: 'linear-gradient(165deg,#fbcfe8 0%,#f472b6 48%,#db2777 100%)',
    cardBg: '#fdf2f8',
    cardText: '#be185d',
    cardSub: '#ec4899',
    softBg: 'rgba(236,72,153,0.1)',
  },
  {
    id: 'emerald',
    name: '清新绿',
    desc: '自然户外婚礼',
    emoji: '🌿',
    primary: '#10b981',
    primaryDark: '#059669',
    gradient: 'linear-gradient(165deg,#a7f3d0 0%,#34d399 48%,#059669 100%)',
    cardBg: '#ecfdf5',
    cardText: '#047857',
    cardSub: '#10b981',
    softBg: 'rgba(16,185,129,0.1)',
  },
  {
    id: 'violet',
    name: '星空紫',
    desc: '时尚潮酷派对',
    emoji: '✨',
    primary: '#8b5cf6',
    primaryDark: '#7c3aed',
    gradient: 'linear-gradient(165deg,#ddd6fe 0%,#a78bfa 48%,#7c3aed 100%)',
    cardBg: '#f5f3ff',
    cardText: '#6d28d9',
    cardSub: '#8b5cf6',
    softBg: 'rgba(139,92,246,0.1)',
  },
  {
    id: 'ocean',
    name: '海盐蓝',
    desc: '清爽简约宴席',
    emoji: '🌊',
    primary: '#0ea5e9',
    primaryDark: '#0284c7',
    gradient: 'linear-gradient(165deg,#bae6fd 0%,#38bdf8 48%,#0284c7 100%)',
    cardBg: '#f0f9ff',
    cardText: '#075985',
    cardSub: '#0ea5e9',
    softBg: 'rgba(14,165,233,0.1)',
  },
  {
    id: 'candy',
    name: '糖果粉',
    desc: '多巴胺元气派对',
    emoji: '🍭',
    primary: '#f43f5e',
    primaryDark: '#e11d48',
    gradient: 'linear-gradient(165deg,#fecdd3 0%,#fb7185 48%,#e11d48 100%)',
    cardBg: '#fff7ed',
    cardText: '#be123c',
    cardSub: '#fb7185',
    softBg: 'rgba(244,63,94,0.1)',
  },
  {
    id: 'sky',
    name: '晴空蓝',
    desc: '奶油轻盈活力',
    emoji: '🧁',
    primary: '#0ea5e9',
    primaryDark: '#0284c7',
    gradient: 'linear-gradient(165deg,#e0f2fe 0%,#7dd3fc 48%,#0284c7 100%)',
    cardBg: '#f0f9ff',
    cardText: '#075985',
    cardSub: '#38bdf8',
    softBg: 'rgba(14,165,233,0.1)',
  },
]

export const DEFAULT_INVITATION: InvitationData = {
  type: 'wedding',
  host: '张伟 & 李娜',
  nameA: '张伟',
  nameB: '李娜',
  date: '2026-10-01',
  time: '18:00',
  venue: '上海外滩华尔道夫酒店',
  address: '上海市黄浦区中山东一路2号',
  message:
    '执子之手，与子偕老。我们即将步入婚姻的殿堂，诚挚邀请您来见证我们的幸福时刻，分享这份喜悦！愿您的到来，让这一天更加圆满。',
  themeId: 'classic-red',
  music: '',
  showCountdown: true,
  photos: [
    'https://picsum.photos/seed/inv-photo-1/800/1066',
    'https://picsum.photos/seed/inv-photo-2/800/1066',
    'https://picsum.photos/seed/inv-photo-3/800/1066',
  ],
  photoCaptions: [
    '初见时的心动，定格在这一秒',
    '一起走过的街角，是最好的时光',
    '从此以后，朝夕都是你',
  ],
  featuredIndexes: [0, 1, 2],
  story:
    '2019 年的春天，我们在朋友的聚会上初次相遇。一句简单的问候，开启了我们之间的故事。\n\n一起看过清晨的海，一起走过深夜的街，从相知到相守，每一个平凡的日子都因为有彼此而变得闪闪发光。\n\n如今，我们决定携手步入人生新的旅程，期待与您分享这份喜悦。',
  timeline: [
    { time: '16:30', title: '宾客签到', desc: '签到留影，品尝迎宾甜点' },
    { time: '17:08', title: '婚礼仪式', desc: '交换戒指，宣读誓言' },
    { time: '18:00', title: '婚宴开席', desc: '举杯共庆，共享喜宴' },
    { time: '20:00', title: '答谢欢送', desc: '合影留念，感谢光临' },
  ],
}

/** 默认值补齐（兼容旧版链接缺少新字段） */
export function fillDefaults(d: Partial<InvitationData> | InvitationData): InvitationData {
  return { ...DEFAULT_INVITATION, ...d }
}

/** 把请柬数据编码成 base64url（用于 URL query） */
export function encodeInvitation(d: InvitationData): string {
  const json = JSON.stringify(d)
  const b64 = btoa(unescape(encodeURIComponent(json)))
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** 从 base64url 解码请柬数据，失败返回 null */
export function decodeInvitation(s: string): InvitationData | null {
  try {
    const b64 = s.replace(/-/g, '+').replace(/_/g, '/')
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4)
    const json = decodeURIComponent(escape(atob(padded)))
    const parsed = JSON.parse(json) as InvitationData
    if (!parsed || typeof parsed !== 'object' || !parsed.date) return null
    return fillDefaults(parsed)
  } catch {
    return null
  }
}

export function getTheme(themeId: string): InvitationTheme {
  return INVITATION_THEMES.find((t) => t.id === themeId) ?? INVITATION_THEMES[0]
}

/** 拼接分享链接 */
export function buildShareUrl(data: InvitationData, origin: string): string {
  return `${origin}/invitation?d=${encodeInvitation(data)}`
}

/** 生成地图检索链接（高德） */
export function buildMapUrl(venue: string, address: string): string {
  const keyword = encodeURIComponent(`${venue} ${address}`.trim())
  return `https://uri.amap.com/search?keyword=${keyword}`
}
