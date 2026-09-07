/**
 * 电子请柬 - 随机艺术风格库（十式）
 * 同一链接每次打开随机进入一种风格（随机样式随动：色板 / 封面背景与文字色 / 标题字体 / 装饰粒子 / 卡片圆角描边）。
 * 也可用 ?s=<styleId> 固定指定某种风格。
 */

export type ArtShape = 'petal' | 'heart' | 'star' | 'bubble'

export interface InvitationArtStyle {
  /** 风格 id，可用于 ?s=<id> 固定 */
  id: string
  /** 风格名 */
  name: string
  /** 封面引言（四字对仗，· 分隔，艺术排版） */
  tagline: string
  /** 印章符号（封面装饰，囍 / ❀ / 🌸 / 🕊 / ✦ / 🌿 / 🏮） */
  stamp: string
  /** 标题字体系列（封面大字 + 正文大标题） */
  titleFont: string
  /** 封面背景（默认取 colors.gradient） */
  coverBg?: string
  /** 封面文字颜色（浅色背景风格需深色文字） */
  coverText?: string
  /** 封面「轻触开启」按钮样式覆盖（浅色背景风格时用） */
  coverButtonCls?: string
  /** 封面视频背景素材（mp4 相对 / 路径，随机选一；无则不播视频） */
  video?: string[]
  /** 色板覆盖（覆盖原主题同名颜色字段） */
  colors: {
    primary: string
    primaryDark: string
    gradient: string
    cardBg: string
    cardText: string
    cardSub: string
    softBg: string
  }
  /** 封面漂浮粒子组合 */
  petalShapes: ArtShape[]
  petalColor: string
  /** 卡片圆角（内联值） */
  radius: string
  /** 卡片描边色 */
  borderColor: string
}

export const INVITATION_ART_STYLES: InvitationArtStyle[] = [
  {
    id: 'zhusha',
    name: '朱砂鎏金',
    tagline: '琴瑟和鸣 · 鸾凤呈祥',
    stamp: '囍',
    titleFont: `'STKaiti','KaiTi','楷体',serif`,
    colors: {
      primary: '#c7372f',
      primaryDark: '#9e2721',
      gradient: 'linear-gradient(165deg,#c7372f 0%,#8e1f1a 52%,#6e1512 100%)',
      cardBg: '#fdf6ec',
      cardText: '#8e1f1a',
      cardSub: '#c08a4e',
      softBg: 'rgba(199,55,47,0.08)',
    },
    petalShapes: ['heart', 'bubble'],
    petalColor: 'rgba(255,255,255,0.55)',
    radius: '1.25rem',
    borderColor: 'rgba(192,138,78,0.3)',
  },
  {
    id: 'gugong',
    name: '故宫红墙',
    tagline: '天作之合 · 永以为好',
    stamp: '囍',
    titleFont: `'Songti SC','SimSun','宋体',serif`,
    colors: {
      primary: '#9d2235',
      primaryDark: '#7c1a29',
      gradient: 'linear-gradient(165deg,#a4263c 0%,#7c1a29 50%,#5d131e 100%)',
      cardBg: '#fbf6ee',
      cardText: '#7c1a29',
      cardSub: '#a9802f',
      softBg: 'rgba(157,34,53,0.08)',
    },
    petalShapes: ['heart', 'star'],
    petalColor: 'rgba(255,255,255,0.5)',
    radius: '0.875rem',
    borderColor: 'rgba(169,128,47,0.32)',
  },
  {
    id: 'manor',
    name: '玫瑰庄园',
    tagline: '以爱之名 · 共赴余生',
    stamp: '❀',
    titleFont: `'Georgia','Times New Roman','Songti SC',serif`,
    colors: {
      primary: '#a34a6e',
      primaryDark: '#7c3455',
      gradient: 'linear-gradient(165deg,#b95c7e 0%,#8e3a5e 50%,#64253f 100%)',
      cardBg: '#fdf6f8',
      cardText: '#7c3455',
      cardSub: '#c08aa0',
      softBg: 'rgba(163,74,110,0.08)',
    },
    petalShapes: ['bubble', 'heart'],
    petalColor: 'rgba(255,255,255,0.6)',
    radius: '1.75rem',
    borderColor: 'rgba(192,138,160,0.32)',
  },
  {
    id: 'taoyao',
    name: '桃之夭夭',
    tagline: '桃之夭夭 · 灼灼其华',
    stamp: '🌸',
    titleFont: `'STKaiti','KaiTi','楷体',serif`,
    colors: {
      primary: '#ec6aa5',
      primaryDark: '#cf3f85',
      gradient: 'linear-gradient(165deg,#ffd1e3 0%,#f798c6 48%,#cf3f85 100%)',
      cardBg: '#fff5fa',
      cardText: '#be2f76',
      cardSub: '#ee8fb8',
      softBg: 'rgba(236,106,165,0.1)',
    },
    petalShapes: ['bubble', 'heart'],
    petalColor: 'rgba(255,255,255,0.65)',
    radius: '1.5rem',
    borderColor: 'rgba(238,143,184,0.34)',
  },
  {
    id: 'shuimo',
    name: '水墨朱砂',
    tagline: '执子之手 · 与子偕老',
    stamp: '囍',
    titleFont: `'STKaiti','KaiTi','楷体',serif`,
    coverBg: 'linear-gradient(170deg,#f7f1e6 0%,#efe4d0 55%,#e2d2b6 100%)',
    coverText: '#8f2f1f',
    coverButtonCls:
      'bg-white/75 backdrop-blur-xl border border-[#8f2f1f]/25 hover:bg-white/90',
    colors: {
      primary: '#b3402c',
      primaryDark: '#8f2f1f',
      gradient: 'linear-gradient(165deg,#b3402c 0%,#8f2f1f 52%,#6b2317 100%)',
      cardBg: '#faf5ec',
      cardText: '#5a4a3c',
      cardSub: '#94806a',
      softBg: 'rgba(179,64,44,0.08)',
    },
    petalShapes: ['heart'],
    petalColor: 'rgba(179,64,44,0.22)',
    radius: '0.75rem',
    borderColor: 'rgba(179,64,44,0.18)',
  },
  {
    id: 'bourgogne',
    name: '法式酒红',
    tagline: '执手今生 · 白首不离',
    stamp: '🕊',
    titleFont: `'Georgia','Times New Roman','Songti SC',serif`,
    colors: {
      primary: '#7a3440',
      primaryDark: '#5d2230',
      gradient: 'linear-gradient(165deg,#a35a66 0%,#7a3440 50%,#521c28 100%)',
      cardBg: '#faf6ef',
      cardText: '#5d2230',
      cardSub: '#a67c52',
      softBg: 'rgba(122,52,64,0.08)',
    },
    petalShapes: ['star', 'bubble'],
    petalColor: 'rgba(255,255,255,0.55)',
    radius: '2rem',
    borderColor: 'rgba(166,124,82,0.3)',
  },
  {
    id: 'nocturne',
    name: '鎏金夜色',
    tagline: '星河为证 · 岁月为盟',
    stamp: '✦',
    titleFont: `'Palatino','Georgia','Songti SC',serif`,
    colors: {
      primary: '#d4ab3e',
      primaryDark: '#b8932f',
      gradient: 'linear-gradient(165deg,#232a4f 0%,#161c38 55%,#0d1126 100%)',
      cardBg: '#eef0f8',
      cardText: '#2c3560',
      cardSub: '#8a93bd',
      softBg: 'rgba(230,195,92,0.12)',
    },
    petalShapes: ['star'],
    petalColor: 'rgba(255,222,140,0.5)',
    radius: '1.25rem',
    borderColor: 'rgba(230,195,92,0.28)',
  },
  {
    id: 'meadow',
    name: '绿野仙踪',
    tagline: '以天地为盟 · 以草木为证',
    stamp: '🌿',
    titleFont: `'STKaiti','KaiTi','楷体',serif`,
    colors: {
      primary: '#5f8d5f',
      primaryDark: '#47704a',
      gradient: 'linear-gradient(165deg,#9fc39f 0%,#6e9a6e 48%,#3f6a44 100%)',
      cardBg: '#f4f8f1',
      cardText: '#3e5c46',
      cardSub: '#7fa083',
      softBg: 'rgba(95,141,95,0.1)',
    },
    petalShapes: ['bubble', 'petal'],
    petalColor: 'rgba(255,255,255,0.5)',
    radius: '1.25rem',
    borderColor: 'rgba(95,141,95,0.25)',
  },
  {
    id: 'amber',
    name: '琥珀流光',
    tagline: '时光为酿 · 与你共酌',
    stamp: '🏮',
    titleFont: `'STKaiti','KaiTi','楷体',serif`,
    colors: {
      primary: '#c97b2d',
      primaryDark: '#a8611f',
      gradient: 'linear-gradient(165deg,#f0b76a 0%,#cf8a3a 48%,#a8611f 100%)',
      cardBg: '#fff8ea',
      cardText: '#8a5416',
      cardSub: '#c98a4b',
      softBg: 'rgba(201,123,45,0.1)',
    },
    petalShapes: ['bubble'],
    petalColor: 'rgba(255,235,190,0.55)',
    radius: '1.25rem',
    borderColor: 'rgba(201,138,75,0.3)',
  },
  {
    id: 'celadon',
    name: '青花新中式',
    tagline: '山遥水阔 · 此情不渝',
    stamp: '囍',
    titleFont: `'STKaiti','KaiTi','楷体',serif`,
    colors: {
      primary: '#1e5a8c',
      primaryDark: '#163e63',
      gradient: 'linear-gradient(165deg,#7fb2d8 0%,#3a7bb0 50%,#1a4771 100%)',
      cardBg: '#f6fafd',
      cardText: '#1e4a6e',
      cardSub: '#4a82a8',
      softBg: 'rgba(30,90,140,0.08)',
    },
    petalShapes: ['bubble', 'heart'],
    petalColor: 'rgba(255,255,255,0.55)',
    radius: '0.875rem',
    borderColor: 'rgba(30,90,140,0.22)',
  },
  {
    id: 'mono-cinema',
    name: '黑白电影',
    tagline: '黑白之间 · 一眼万年',
    stamp: '✦',
    titleFont: `'Didot','Bodoni MT','Georgia',serif`,
    video: ['/invitation-assets/bg-mono-1.mp4', '/invitation-assets/bg-mono-2.mp4'],
    colors: {
      primary: '#3a3a3a',
      primaryDark: '#111111',
      gradient: 'linear-gradient(165deg,#3d3d3d 0%,#1c1c1c 55%,#000 100%)',
      cardBg: '#f4f4f0',
      cardText: '#1c1c1c',
      cardSub: '#9a9a90',
      softBg: 'rgba(0,0,0,0.05)',
    },
    petalShapes: ['star'],
    petalColor: 'rgba(255,255,255,0.4)',
    radius: '0.375rem',
    borderColor: 'rgba(255,255,255,0.28)',
  },
  {
    id: 'cyber-neon',
    name: '赛博霓虹',
    tagline: '霓虹为誓 · 未来为约',
    stamp: '⚡',
    titleFont: `'Arial Narrow','Arial','PingFang SC',sans-serif`,
    video: ['/invitation-assets/bg-cyber-1.mp4', '/invitation-assets/bg-cyber-2.mp4'],
    colors: {
      primary: '#00e5ff',
      primaryDark: '#b026ff',
      gradient: 'linear-gradient(165deg,#2b0a5e 0%,#12031a 45%,#032a38 100%)',
      cardBg: '#0b0b16',
      cardText: '#e8faff',
      cardSub: '#7fb8d6',
      softBg: 'rgba(0,229,255,0.1)',
    },
    petalShapes: ['star', 'bubble'],
    petalColor: 'rgba(0,229,255,0.55)',
    radius: '0.75rem',
    borderColor: 'rgba(0,229,255,0.35)',
  },
  {
    id: 'morandi-dream',
    name: '奶油莫兰迪',
    tagline: '奶油梦境 · 温柔相拥',
    stamp: '☁️',
    titleFont: `'STYuanti','Yuanti SC','PingFang SC',sans-serif`,
    video: ['/invitation-assets/bg-morandi-1.mp4', '/invitation-assets/bg-morandi-2.mp4'],
    coverBg: 'linear-gradient(170deg,#f4eee9 0%,#e8dfdc 55%,#d9cdd5 100%)',
    coverText: '#6a5c68',
    coverButtonCls: 'bg-white/75 backdrop-blur-xl border border-[#6a5c68]/25 hover:bg-white/90',
    colors: {
      primary: '#a48fa8',
      primaryDark: '#826a8a',
      gradient: 'linear-gradient(165deg,#dccfe0 0%,#b7a6c9 50%,#8a7390 100%)',
      cardBg: '#fbf8f6',
      cardText: '#5f5558',
      cardSub: '#b0a2a8',
      softBg: 'rgba(164,143,168,0.12)',
    },
    petalShapes: ['bubble', 'petal'],
    petalColor: 'rgba(255,255,255,0.75)',
    radius: '1.75rem',
    borderColor: 'rgba(164,143,168,0.3)',
  },
  {
    id: 'urban-mag',
    name: '都市杂志',
    tagline: '都市流光 · 爱在街头',
    stamp: '🖤',
    titleFont: `'Arial Black','Arial','PingFang SC',sans-serif`,
    video: ['/invitation-assets/bg-urban-1.mp4', '/invitation-assets/bg-urban-2.mp4'],
    colors: {
      primary: '#ff4d5a',
      primaryDark: '#c72c3c',
      gradient: 'linear-gradient(165deg,#33345e 0%,#1b1c3d 50%,#0d0d1f 100%)',
      cardBg: '#f6f5f1',
      cardText: '#1d1d24',
      cardSub: '#94939c',
      softBg: 'rgba(255,77,90,0.08)',
    },
    petalShapes: ['star'],
    petalColor: 'rgba(255,255,255,0.45)',
    radius: '0.125rem',
    borderColor: 'rgba(255,77,90,0.4)',
  },
]

/** 按 id 取风格，未知则返回 null */
export function getInvitationStyle(id: string | null): InvitationArtStyle | null {
  if (!id) return null
  return INVITATION_ART_STYLES.find((s) => s.id === id) ?? null
}

/** 随机取一种艺术风格 */
export function getRandomInvitationStyle(): InvitationArtStyle {
  return INVITATION_ART_STYLES[Math.floor(Math.random() * INVITATION_ART_STYLES.length)]
}
