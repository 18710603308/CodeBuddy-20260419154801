/**
 * 电子请柬 - 随机布局库
 * 与随机艺术风格（色板/字体/装饰）正交组合：每次打开随机进入一种布局 + 一种配色 = 多变婚礼请柬风格。
 * 可用 ?l=<layoutId> 固定指定某种布局。
 *
 * 十六期（2026-08-19）起只保留「上用」婚礼感照片墙：
 * - 删除：grid 三列网格、masonry 瀑布流、strip 全景横条、frame 相框墙（太平铺）
 * - 保留 + 增强：heart 爱心、polaroid 拍立得、timeline 时光轴、collage 拼贴、film 胶片长廊
 * - 新增：circle 圆形拼贴、fan 扇形展开、offset 错落杂志、double 双排交错、mosaic 马赛克砖
 * - 新增：gallery 画框画廊（题款式留白）、ribbon 红绸照片（丝带串照片）
 *
 * 十八期（2026-08-19）再增 4 种婚礼艺术布局：
 * - stair 阶梯拾级（三列阶梯递升）、gather 花簇捧心（中央大图 + 环绕小花如捧花）
 * - tape 双囍贴纸（拍立得墙 + 纸胶带 + 囍字角贴）、album 对开相册（两页翻开 + 书脊）
 * - 新增 PHOTO_VARIANTS 独立随机池（无 ?l= 时照片墙每次随机 14 种之一）
 *
 * 十九期（2026-08-19）再增 4 照片墙 + 2 封面 + 9 布局：
 * - knot 红线牵缘（S 形蜿蜒红线串照片，如月老牵线）、couplet 喜联成对（左右两列如对联 + 横批）
 * - scroll 婚书长卷（照片如展开画卷，两端红木轴头）、pendant 流苏挂饰（横梁垂挂 + 流苏穗）
 * - 封面：redveil 红盖头（盖头弧 + 流苏帘）、knots 同心结（双环交叠）
 * - 独立随机池 14 → 18 种
 */

export type CoverVariant =
  | 'classic' // 经典居中：垂直堆叠（默认）
  | 'elegant' // 雅致留白：标题顶部、名字居中、日期与按钮分列底部
  | 'vertical' // 竖排书卷：新郎新娘名竖排 + 中央大印章
  | 'minimal' // 极简主义：只留名字/日期/按钮，大量留白
  | 'grand' // 皇家大气：超大名字 + 上下金线
  | 'frame' // 相框情怀：内容包在细边框框内
  | 'seal' // 圆印之约：中央大圆印章 + 名字
  | 'banner' // 华章横幅：顶部横幅 + 底部横幅
  | 'split' // 上下分栏：标题上、名字中、日期下、按钮悬浮底部
  | 'letter' // 锦书手信：书信式称谓 + 署名
  | 'diagonal' // 斜阳对角：斜切面板 + 名字错落
  | 'couple' // 双人并立：左右各一竖排名字 + 中央爱心
  | 'arch' // 拱门盛典：内容包在圆拱门框内
  | 'rings' // 双环戒约：两个交叠圆环各嵌一个名字
  | 'ribbon' // 红绸结缘：名字横贯丝带 + 燕尾飘带
  | 'laurel' // 花环雅韵：名字被枝叶花环环绕
  | 'diptych' // 对开双联：上下两联 + 中央粗分隔线
  | 'sunburst' // 光芒万丈：中央圆形光晕放射
  | 'plaque' // 金匾之礼：横匾样式（粗边圆角牌匾）
  | 'fan' // 花扇迎宾：顶部扇形展开
  | 'redveil' // 红盖头：名字下方盖头弧 + 流苏帘（十九期）
  | 'knots' // 同心结：双环交叠 + 中央结点（十九期）

export type SectionVariant = 'center' | 'leftline' | 'chapter' | 'badge'

export type InfoVariant = 'list' | 'grid'

/**
 * 照片墙变体（17 期 2026-08-19 重整：去掉平铺感）
 *  - polaroid / timeline / collage / film（保留 4）
 *  - circle / fan / offset / double / mosaic（十六期新增 5）
 *  - gallery 画框画廊（题款式留白，新）
 *  - ribbon 红绸照片（丝带串照片，新）
 *  - stair / gather / tape / album（十八期新增 4，婚礼艺术布局）
 *  - knot / couplet / scroll / pendant（十九期新增 4，红线/喜联/长卷/流苏）
 *  - heart 爱心铺满（二十期 2026-08-20 移除：用户反馈过丑，改为 gallery/scroll/polaroid）
 */
export type PhotoVariant =
  | 'polaroid' // 拍立得时光
  | 'timeline' // 时光轴
  | 'collage' // 拼贴画布（Bento）
  | 'film' // 胶片长廊
  | 'circle' // 圆形拼贴
  | 'fan' // 扇形展开
  | 'offset' // 错落杂志
  | 'double' // 双排交错
  | 'mosaic' // 马赛克砖
  | 'gallery' // 画框画廊（题款式留白）
  | 'ribbon' // 红绸照片（丝带串照片）
  | 'stair' // 阶梯拾级：三列阶梯递升 + 微旋
  | 'gather' // 花簇捧心：中央大图 + 环绕小花如捧花
  | 'tape' // 双囍贴纸：拍立得墙 + 纸胶带 + 囍字角贴
  | 'album' // 对开相册：两页翻开 + 书脊
  | 'knot' // 红线牵缘：S 形蜿蜒红线串照片 + 微旋（十九期）
  | 'couplet' // 喜联成对：左右两列如对联 + 顶部横批（十九期）
  | 'scroll' // 婚书长卷：照片如展开画卷 + 两端红木轴头（十九期）
  | 'pendant' // 流苏挂饰：横梁丝绳垂挂 + 流苏穗（十九期）

export interface InvitationLayout {
  /** 布局 id，可用 ?l=<id> 固定 */
  id: string
  name: string
  cover: CoverVariant
  section: SectionVariant
  info: InfoVariant
  photo: PhotoVariant
}

export const INVITATION_LAYOUTS: InvitationLayout[] = [
  // ---- 原 10 布局（已重映射 photo：grid/masonry 替换为更有婚礼感的变体）----
  { id: 'classic', name: '经典居中', cover: 'classic', section: 'center', info: 'list', photo: 'gallery' },
  { id: 'elegant', name: '雅致留白', cover: 'elegant', section: 'leftline', info: 'grid', photo: 'gallery' },
  { id: 'vertical', name: '竖排书卷', cover: 'vertical', section: 'chapter', info: 'list', photo: 'scroll' },
  { id: 'minimal', name: '极简主义', cover: 'minimal', section: 'center', info: 'grid', photo: 'album' },
  { id: 'grand', name: '皇家大气', cover: 'grand', section: 'chapter', info: 'list', photo: 'ribbon' },
  { id: 'frame', name: '相框情怀', cover: 'frame', section: 'leftline', info: 'list', photo: 'polaroid' },
  { id: 'seal', name: '圆印之约', cover: 'seal', section: 'center', info: 'grid', photo: 'circle' },
  { id: 'banner', name: '华章横幅', cover: 'banner', section: 'chapter', info: 'list', photo: 'collage' },
  { id: 'split', name: '上下分栏', cover: 'split', section: 'leftline', info: 'grid', photo: 'fan' },
  { id: 'letter', name: '锦书手信', cover: 'letter', section: 'center', info: 'list', photo: 'gather' },
  // ---- 十六期 4 布局（已删 strip/frame 重映射为 mosaic/circle）----
  { id: 'polaroid', name: '拍立得时光', cover: 'frame', section: 'center', info: 'grid', photo: 'polaroid' },
  { id: 'timeline', name: '时光轴', cover: 'elegant', section: 'leftline', info: 'list', photo: 'timeline' },
  { id: 'collage', name: '拼贴画布', cover: 'split', section: 'chapter', info: 'grid', photo: 'collage' },
  { id: 'film', name: '胶片长廊', cover: 'minimal', section: 'center', info: 'list', photo: 'film' },
  // ---- 十六期 20 布局（strip/frame/masonry/grid 全部重映射）----
  { id: 'moonlight', name: '月下之约', cover: 'diagonal', section: 'center', info: 'list', photo: 'fan' },
  { id: 'halo', name: '花环雅韵', cover: 'laurel', section: 'badge', info: 'grid', photo: 'circle' },
  { id: 'crescent', name: '双环戒约', cover: 'rings', section: 'center', info: 'grid', photo: 'circle' },
  { id: 'archway', name: '拱门盛典', cover: 'arch', section: 'chapter', info: 'list', photo: 'gallery' },
  { id: 'sunset', name: '斜阳余晖', cover: 'diagonal', section: 'leftline', info: 'grid', photo: 'offset' },
  { id: 'radiance', name: '光芒万丈', cover: 'sunburst', section: 'center', info: 'list', photo: 'stair' },
  { id: 'gilded', name: '金匾之礼', cover: 'plaque', section: 'chapter', info: 'grid', photo: 'tape' },
  { id: 'fanshow', name: '花扇迎宾', cover: 'fan', section: 'badge', info: 'list', photo: 'gather' },
  { id: 'duet', name: '对开双联', cover: 'diptych', section: 'center', info: 'grid', photo: 'album' },
  { id: 'velvet', name: '丝绒红绸', cover: 'ribbon', section: 'leftline', info: 'list', photo: 'ribbon' },
  { id: 'orbit', name: '同心圆缘', cover: 'sunburst', section: 'center', info: 'grid', photo: 'circle' },
  { id: 'cascade', name: '瀑布花影', cover: 'fan', section: 'chapter', info: 'list', photo: 'tape' },
  { id: 'meander', name: '回纹曲折', cover: 'diagonal', section: 'badge', info: 'list', photo: 'offset' },
  { id: 'garden', name: '花园剪影', cover: 'arch', section: 'leftline', info: 'grid', photo: 'stair' },
  { id: 'lantern', name: '灯笼高挂', cover: 'couple', section: 'center', info: 'list', photo: 'offset' },
  { id: 'phoenix', name: '凤冠霞帔', cover: 'plaque', section: 'badge', info: 'grid', photo: 'fan' },
  { id: 'vow', name: '誓言同心', cover: 'rings', section: 'center', info: 'list', photo: 'gallery' },
  { id: 'serenade', name: '小夜曲', cover: 'diptych', section: 'leftline', info: 'grid', photo: 'circle' },
  { id: 'gilt', name: '鎏金年华', cover: 'laurel', section: 'chapter', info: 'list', photo: 'tape' },
  { id: 'blossom', name: '花好月圆', cover: 'ribbon', section: 'center', info: 'grid', photo: 'gather' },
  // ---- 十九期 9 布局（红线/喜联/长卷/流苏等婚礼意象，34 → 43）----
  { id: 'across', name: '鹊桥相会', cover: 'redveil', section: 'chapter', info: 'list', photo: 'knot' },
  { id: 'harmony', name: '琴瑟和鸣', cover: 'knots', section: 'center', info: 'grid', photo: 'couplet' },
  { id: 'bridal', name: '十里红妆', cover: 'redveil', section: 'badge', info: 'grid', photo: 'pendant' },
  { id: 'scrolls', name: '永结同心', cover: 'plaque', section: 'chapter', info: 'list', photo: 'scroll' },
  { id: 'fated', name: '天作之合', cover: 'laurel', section: 'leftline', info: 'list', photo: 'knot' },
  { id: 'joy', name: '喜上眉梢', cover: 'ribbon', section: 'center', info: 'grid', photo: 'pendant' },
  { id: 'eternal', name: '白首同心', cover: 'arch', section: 'badge', info: 'grid', photo: 'scroll' },
  { id: 'redstring', name: '千里姻缘', cover: 'diagonal', section: 'leftline', info: 'list', photo: 'knot' },
  { id: 'twin', name: '双囍临门', cover: 'couple', section: 'center', info: 'grid', photo: 'couplet' },
]

/**
 * 照片墙独立随机池（18 期起）：无 ?l= 时照片墙每次打开随机 14 种之一，
 * 排除 double / mosaic 两个平铺感较强的旧变体，其余全部入选。
 * 19 期 +4：knot / couplet / scroll / pendant → 18 种。
 * 20 期 -1：heart（用户反馈过丑）→ 17 种。
 */
export const PHOTO_VARIANTS: PhotoVariant[] = [
  'polaroid', 'timeline', 'collage', 'film', 'circle', 'fan', 'offset',
  'gallery', 'ribbon', 'stair', 'gather', 'tape', 'album',
  'knot', 'couplet', 'scroll', 'pendant',
]

/** 随机取一种照片墙变体 */
export function getRandomPhotoVariant(): PhotoVariant {
  return PHOTO_VARIANTS[Math.floor(Math.random() * PHOTO_VARIANTS.length)]
}

/** 按 id 取布局，未知则返回 null */
export function getInvitationLayout(id: string | null): InvitationLayout | null {
  if (!id) return null
  return INVITATION_LAYOUTS.find((l) => l.id === id) ?? null
}

/** 随机取一种布局 */
export function getRandomInvitationLayout(): InvitationLayout {
  return INVITATION_LAYOUTS[Math.floor(Math.random() * INVITATION_LAYOUTS.length)]
}
