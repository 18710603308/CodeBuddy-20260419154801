/**
 * 电子请柬 - 数据模型 / 主题 / 编解码工具
 * 纯前端实现：请柬数据编码进 URL query (?d=base64url)，分享链接即请柬本体
 */

export type InvitationType = 'wedding' | 'birthday' | 'baby' | 'moving' | 'party'

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
    primary: '#b91c1c',
    primaryDark: '#7f1d1d',
    gradient: 'linear-gradient(165deg,#7f1d1d 0%,#991b1b 45%,#b91c1c 100%)',
    cardBg: '#fffaf0',
    cardText: '#7f1d1d',
    cardSub: '#a16207',
    softBg: 'rgba(185,28,28,0.08)',
  },
  {
    id: 'gold',
    name: '香槟金',
    desc: '西式浪漫婚礼',
    emoji: '🥂',
    primary: '#b45309',
    primaryDark: '#78350f',
    gradient: 'linear-gradient(165deg,#78350f 0%,#92400e 45%,#d97706 100%)',
    cardBg: '#fffbeb',
    cardText: '#78350f',
    cardSub: '#a16207',
    softBg: 'rgba(217,119,6,0.1)',
  },
  {
    id: 'rose',
    name: '浪漫粉',
    desc: '甜蜜求婚宴会',
    emoji: '🌹',
    primary: '#db2777',
    primaryDark: '#9d174d',
    gradient: 'linear-gradient(165deg,#831843 0%,#be185d 50%,#db2777 100%)',
    cardBg: '#fdf2f8',
    cardText: '#9d174d',
    cardSub: '#db2777',
    softBg: 'rgba(219,39,119,0.08)',
  },
  {
    id: 'emerald',
    name: '清新绿',
    desc: '自然户外婚礼',
    emoji: '🌿',
    primary: '#059669',
    primaryDark: '#065f46',
    gradient: 'linear-gradient(165deg,#064e3b 0%,#047857 50%,#059669 100%)',
    cardBg: '#ecfdf5',
    cardText: '#065f46',
    cardSub: '#059669',
    softBg: 'rgba(5,150,105,0.08)',
  },
  {
    id: 'violet',
    name: '星空紫',
    desc: '时尚潮酷派对',
    emoji: '✨',
    primary: '#7c3aed',
    primaryDark: '#5b21b6',
    gradient: 'linear-gradient(165deg,#312e81 0%,#5b21b6 50%,#8b5cf6 100%)',
    cardBg: '#f5f3ff',
    cardText: '#4c1d95',
    cardSub: '#7c3aed',
    softBg: 'rgba(124,58,237,0.08)',
  },
  {
    id: 'ocean',
    name: '海盐蓝',
    desc: '清爽简约宴席',
    emoji: '🌊',
    primary: '#0284c7',
    primaryDark: '#0c4a6e',
    gradient: 'linear-gradient(165deg,#082f49 0%,#0369a1 50%,#0ea5e9 100%)',
    cardBg: '#f0f9ff',
    cardText: '#0c4a6e',
    cardSub: '#0369a1',
    softBg: 'rgba(2,132,199,0.08)',
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
    return parsed
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
