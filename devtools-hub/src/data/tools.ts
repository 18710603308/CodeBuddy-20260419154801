import type { ComponentType } from 'react'
import { Binary, Bomb as BombIcon, Bot, Braces, Clipboard, Clock, Code2, Coffee, Cog, Database, FileCode, FileJson, FileText, Gamepad2, Gift, GitCompare, Globe, Grid3x3, Hash, Hash as HashIcon, Headphones, Joystick, Key, Link as LinkIcon, Lock, Music, Puzzle, QrCode, Search, ShieldCheck, Shuffle, Table2, Terminal, TextCursorInput, Type, Wand2, WifiOff } from 'lucide-react'

/**
 * 工具元数据接口
 * - id: 工具唯一标识
 * - icon: lucide 图标组件
 * - title / description: 中文展示
 * - color / bgColor / borderColor: Tailwind 主题样式
 * - category: 分类(navigation / game / utility / coding / converter / encoder)
 * - route?: 内部路由跳转(如 /game-hub、/ai),不填则在 modal 中渲染
 * - componentKey?: 在 toolComponents 注册表中的 key
 */
export interface ToolMeta {
  id: string
  icon: ComponentType<{ className?: string }>
  title: string
  description: string
  color: string
  bgColor: string
  borderColor: string
  category: 'navigation' | 'game' | 'utility' | 'coding' | 'converter' | 'encoder'
  route?: string
  componentKey?: string
}

const nav = (id: string, icon: any, title: string, description: string, color: string, bgColor: string, borderColor: string, route: string): ToolMeta => ({
  id, icon, title, description, color, bgColor, borderColor, category: 'navigation', route,
})

const game = (id: string, icon: any, title: string, description: string, color: string, bgColor: string, borderColor: string, route = '/game-hub'): ToolMeta => ({
  id, icon, title, description, color, bgColor, borderColor, category: 'game', route,
})

const util = (id: string, icon: any, title: string, description: string, color: string, bgColor: string, borderColor: string, componentKey: string, route?: string): ToolMeta => ({
  id, icon, title, description, color, bgColor, borderColor, category: 'utility', componentKey, ...(route && { route }),
})

/**
 * 全站工具/页面注册表
 * 单一来源 - 搜索下拉、首页工具列表、URL ?tool= 参数都从这里读
 */
export const tools: ToolMeta[] = [
  // 导航
  nav('ai-nav', Bot, 'AI 导航黄页', '收录全网优质 AI 工具，支持分类浏览和搜索', 'from-emerald-400 to-green-600', 'bg-emerald-500/10', 'border-emerald-500/30', '/ai'),
  nav('coding-world', Globe, 'Coding The World', '探索优质开源项目', 'from-blue-500 to-purple-600', 'bg-blue-500/10', 'border-blue-500/30', '/coding-the-world'),
  nav('gaussdb-learn', Database, 'GaussDB 数据库学习', 'GaussDB 在线学习与 SQL 练习平台，内置数据库引擎边学边练', 'from-teal-500 to-cyan-600', 'bg-teal-500/10', 'border-teal-500/30', '/gaussdb-learn'),
  nav('invitation', Gift, '电子请柬', '婚礼/生日/乔迁电子请柬在线制作，实时预览一键生成分享链接', 'from-rose-500 to-pink-600', 'bg-rose-500/10', 'border-rose-500/30', '/invitation'),

  // 游戏 - 第三方平台
  game('game-collection', Gamepad2, '欲买桂花同载酒', '第三方游戏平台合集，FC、街机、GBA 等经典游戏', 'from-amber-500 to-orange-600', 'bg-amber-500/10', 'border-amber-500/30', '/game-collection'),

  // 游戏 - 自托管模拟器中心
  game('game-hub', Joystick, '游戏合集中心', '40款自托管模拟器游戏，一键切换无需跳转', 'from-violet-500 to-purple-600', 'bg-violet-500/10', 'border-violet-500/30'),

  // 游戏 - 休闲/H5
  game('link-game', LinkIcon, '连连看', '经典的连连看消消乐游戏', 'from-pink-500 to-rose-600', 'bg-pink-500/10', 'border-pink-500/30'),
  game('spider-solitaire', Gamepad2, '蜘蛛纸牌', '经典Windows蜘蛛纸牌，单人纸牌游戏', 'from-amber-600 to-orange-700', 'bg-amber-500/10', 'border-amber-500/30'),
  game('minesweeper', BombIcon, '扫雷', '经典扫雷游戏，挑战最高难度', 'from-emerald-500 to-teal-600', 'bg-emerald-500/10', 'border-emerald-500/30'),
  game('game2048', HashIcon, '2048', '经典数字合成游戏，挑战2048', 'from-orange-500 to-amber-600', 'bg-orange-500/10', 'border-orange-500/30'),
  game('gold-miner', Gamepad2, '黄金矿工', '经典益智小游戏，抓取金块得分', 'from-yellow-500 to-orange-600', 'bg-yellow-500/10', 'border-yellow-500/30'),
  game('texas-holdem', Gamepad2, '德州扑克', '经典德州扑克人机对战，仿真实牌局', 'from-red-600 to-rose-800', 'bg-red-600/10', 'border-red-600/30'),
  game('perler-coop', Grid3x3, '拼豆联机', '多人在线拼豆创作，P2P实时联机，20色调色板自由拼像素画', 'from-pink-500 to-rose-600', 'bg-pink-500/10', 'border-pink-500/30', '/perler-coop'),
  game('music-room', Headphones, '共享听歌房', '多人在线听歌聊天，支持网易云/QQ/酷狗搜歌，表情礼物互动，摇骰子/十五二十/小姐牌小游戏', 'from-purple-500 to-indigo-600', 'bg-purple-500/10', 'border-purple-500/30', '/music-room'),

  // 游戏 - 模拟器 FC
  game('contra-fc', Gamepad2, '魂斗罗 FC', '原汁原味FC经典复刻，EmulatorJS模拟器', 'from-red-500 to-orange-600', 'bg-red-500/10', 'border-red-500/30'),
  game('tank-battle', Gamepad2, '坦克大战 FC', '经典FC坦克大战，EmulatorJS模拟器', 'from-green-500 to-emerald-600', 'bg-green-500/10', 'border-green-500/30'),
  game('super-mario', Gamepad2, '超级马里奥 FC', '经典FC超级马里奥，EmulatorJS模拟器', 'from-red-500 to-red-600', 'bg-red-500/10', 'border-red-500/30'),
  game('lode-runner', Gamepad2, '淘金者', '经典FC淘金者复刻，收集金块躲避敌人', 'from-amber-500 to-yellow-600', 'bg-amber-500/10', 'border-amber-500/30'),
  game('sanmo', Gamepad2, '三目童子', '经典FC三目童子，第三只眼能量攻击', 'from-indigo-500 to-purple-600', 'bg-indigo-500/10', 'border-indigo-500/30'),
  game('fumojì', Gamepad2, '伏魔记', '经典步步高词典RPG，封神榜之伏魔三太子', 'from-red-600 to-pink-600', 'bg-red-500/10', 'border-red-500/30'),
  game('fumojì-bbk', Gamepad2, '伏魔记 BBK', '步步高电子词典原版网页移植，Baye引擎', 'from-amber-600 to-orange-700', 'bg-amber-500/10', 'border-amber-500/30'),

  // 游戏 - 街机
  game('snowbros', Gamepad2, '雪人兄弟', '经典街机雪人兄弟，EmulatorJS模拟器', 'from-cyan-400 to-blue-600', 'bg-cyan-500/10', 'border-cyan-500/30'),
  game('pooyan-arcade', Gamepad2, '猪小弟(街机)', '经典街机猪小弟，EmulatorJS模拟器', 'from-pink-400 to-rose-600', 'bg-pink-500/10', 'border-pink-500/30'),
  game('gberet', Gamepad2, '绿色兵团', '经典街机绿色兵团，EmulatorJS模拟器', 'from-green-400 to-emerald-600', 'bg-green-500/10', 'border-green-500/30'),
  game('dino', Gamepad2, '恐龙快打', '经典街机恐龙快打，EmulatorJS模拟器', 'from-amber-500 to-orange-600', 'bg-amber-500/10', 'border-amber-500/30'),
  game('punisher', Gamepad2, '惩罚者', '经典街机惩罚者，EmulatorJS模拟器', 'from-red-500 to-rose-700', 'bg-red-500/10', 'border-red-500/30'),
  game('kof97', Gamepad2, '拳皇97', '经典街机拳皇97，EmulatorJS模拟器', 'from-purple-500 to-pink-600', 'bg-purple-500/10', 'border-purple-500/30'),
  game('kof2002', Gamepad2, '拳皇2002', '经典街机拳皇2002，EmulatorJS模拟器', 'from-violet-500 to-purple-700', 'bg-violet-500/10', 'border-violet-500/30'),
  game('orlegend', Gamepad2, '西游释厄传', '经典街机西游释厄传，EmulatorJS模拟器', 'from-orange-500 to-red-600', 'bg-orange-500/10', 'border-orange-500/30'),
  game('sangokushi', Gamepad2, '三国战纪', '经典街机三国战纪，EmulatorJS模拟器', 'from-red-600 to-amber-600', 'bg-red-500/10', 'border-red-500/30'),
  game('ldrun-arcade', Gamepad2, '淘金者(街机)', '经典街机淘金者，EmulatorJS模拟器', 'from-yellow-500 to-amber-600', 'bg-yellow-500/10', 'border-yellow-500/30'),

  // 游戏 - NES
  game('river-city', Gamepad2, '热血街头', '经典FC热血街头，EmulatorJS模拟器', 'from-red-400 to-pink-600', 'bg-red-500/10', 'border-red-500/30'),
  game('battle-city-nes', Gamepad2, '坦克要塞', '经典FC坦克要塞，EmulatorJS模拟器', 'from-green-400 to-emerald-600', 'bg-green-500/10', 'border-green-500/30'),
  game('adventure-island', Gamepad2, '恐龙冒险岛', '经典FC恐龙冒险岛，EmulatorJS模拟器', 'from-teal-400 to-green-600', 'bg-teal-500/10', 'border-teal-500/30'),
  game('chip-dale', Gamepad2, '松鼠大战', '经典FC松鼠大战，EmulatorJS模拟器', 'from-brown-400 to-amber-600', 'bg-amber-500/10', 'border-amber-500/30'),
  game('lode-runner-nes', Gamepad2, '淘金者(NES)', '经典FC淘金者，EmulatorJS模拟器', 'from-amber-400 to-yellow-600', 'bg-yellow-500/10', 'border-yellow-500/30'),
  game('pooyan-nes', Gamepad2, '猪小弟(NES)', '经典FC猪小弟，EmulatorJS模拟器', 'from-pink-400 to-rose-600', 'bg-pink-500/10', 'border-pink-500/30'),

  // AI 游戏
  game('ai-game', Bot, 'AI 游戏工坊', '输入文字让 AI 生成游戏关卡，文本命令操控角色', 'from-purple-500 to-pink-600', 'bg-purple-500/10', 'border-purple-500/30', '/game'),

  // 离线工具页
  game('offline-tools', WifiOff, '离线工具', '40+ 开发工具，无需网络即开即用', 'from-orange-500 to-amber-600', 'bg-orange-500/10', 'border-orange-500/30', '/offline-tools'),

  // 实用工具(在 modal 中渲染)
  util('json', FileJson, 'JSON 格式化', '美化、压缩、校验 JSON 数据', 'from-emerald-500 to-teal-600', 'bg-emerald-500/10', 'border-emerald-500/30', 'json'),
  util('xml', FileCode, 'XML 格式化', '美化、压缩、校验 XML 数据', 'from-blue-500 to-cyan-600', 'bg-blue-500/10', 'border-blue-500/30', 'xml'),
  util('yaml', FileCode, 'YAML 工具', 'YAML 解析与格式化', 'from-purple-500 to-pink-600', 'bg-purple-500/10', 'border-purple-500/30', 'yaml'),
  util('diff', Braces, '文本对比', '快速比较两段文本差异', 'from-orange-500 to-red-600', 'bg-orange-500/10', 'border-orange-500/30', 'diff'),
  util('sql', Table2, 'SQL 格式化', '美化、压缩、校验 SQL', 'from-cyan-500 to-blue-600', 'bg-cyan-500/10', 'border-cyan-500/30', 'sql'),
  util('csv', Table2, 'CSV 工具', '解析、转换、导出 CSV', 'from-green-500 to-emerald-600', 'bg-green-500/10', 'border-green-500/30', 'csv'),
  util('base64', Code2, 'Base64 编解码', '字符串与 Base64 互转', 'from-pink-500 to-rose-600', 'bg-pink-500/10', 'border-pink-500/30', 'base64'),
  util('hash', Hash, 'Hash 生成', 'MD5、SHA1、SHA256 等加密', 'from-indigo-500 to-purple-600', 'bg-indigo-500/10', 'border-indigo-500/30', 'hash'),
  util('url', LinkIcon, 'URL 编解码', 'URL 参数编码与解码', 'from-amber-500 to-orange-600', 'bg-amber-500/10', 'border-amber-500/30', 'url'),
  util('unicode', Type, 'Unicode 转换', '中文与 Unicode 互转', 'from-violet-500 to-purple-600', 'bg-violet-500/10', 'border-violet-500/30', 'unicode'),
  util('jwt', Key, 'JWT 解码', '解析 Token 内容和签名', 'from-red-500 to-rose-600', 'bg-red-500/10', 'border-red-500/30', 'jwt'),
  util('aes', ShieldCheck, 'AES 加解密', 'AES 对称加密解密', 'from-slate-500 to-gray-600', 'bg-slate-500/10', 'border-slate-500/30', 'aes'),
  util('binary', Binary, '进制转换', '2/8/10/16 进制互转', 'from-teal-500 to-cyan-600', 'bg-teal-500/10', 'border-teal-500/30', 'binary'),
  util('color', Wand2, '颜色转换', 'RGB/HEX/HSL 互转', 'from-fuchsia-500 to-pink-600', 'bg-fuchsia-500/10', 'border-fuchsia-500/30', 'color'),
  util('timestamp', Clock, '时间戳转换', 'Unix 时间戳互转', 'from-blue-500 to-indigo-600', 'bg-blue-500/10', 'border-blue-500/30', 'timestamp'),
  util('regex', TextCursorInput, '正则表达式', '测试与生成正则模式', 'from-rose-500 to-red-600', 'bg-rose-500/10', 'border-rose-500/30', 'regex'),
  util('camel', Shuffle, '驼峰转换', '驼峰/下划线/短横线互转', 'from-amber-500 to-yellow-600', 'bg-amber-500/10', 'border-amber-500/30', 'camel'),
  util('case', Type, '大小写转换', '英文大小写/全角半角', 'from-yellow-500 to-amber-600', 'bg-yellow-500/10', 'border-yellow-500/30', 'case'),
  util('js', Braces, 'JS 格式化', 'JavaScript 压缩美化', 'from-yellow-400 to-amber-500', 'bg-yellow-500/10', 'border-yellow-500/30', 'js'),
  util('html', FileCode, 'HTML 格式化', 'HTML 标签格式化', 'from-orange-500 to-red-500', 'bg-orange-500/10', 'border-orange-500/30', 'html'),
  util('css', FileCode, 'CSS 格式化', 'CSS 代码格式化', 'from-blue-400 to-cyan-500', 'bg-blue-500/10', 'border-blue-500/30', 'css'),
  util('codemirror', Terminal, '代码编辑器', '支持多语言的代码编辑器', 'from-slate-500 to-zinc-600', 'bg-slate-500/10', 'border-slate-500/30', 'codemirror'),
  util('codemerge', GitCompare, '代码合并对比', 'CodeMirror 代码合并与对比工具', 'from-indigo-500 to-violet-600', 'bg-indigo-500/10', 'border-indigo-500/30', 'codemerge'),
  util('js-editor', Braces, 'JavaScript', 'JavaScript 代码编辑器', 'from-yellow-400 to-amber-500', 'bg-yellow-500/10', 'border-yellow-500/30', 'js-editor'),
  util('ts-editor', FileCode, 'TypeScript', 'TypeScript 代码编辑器', 'from-blue-500 to-blue-600', 'bg-blue-500/10', 'border-blue-500/30', 'ts-editor'),
  util('py-editor', Terminal, 'Python', 'Python 代码编辑器', 'from-green-500 to-emerald-600', 'bg-green-500/10', 'border-green-500/30', 'py-editor'),
  util('java-editor', Coffee, 'Java', 'Java 代码编辑器', 'from-orange-600 to-red-700', 'bg-orange-500/10', 'border-orange-500/30', 'java-editor'),
  util('cpp-editor', Cog, 'C++', 'C++ 代码编辑器', 'from-blue-600 to-indigo-700', 'bg-blue-500/10', 'border-blue-500/30', 'cpp-editor'),
  util('rust-editor', Cog, 'Rust', 'Rust 代码编辑器', 'from-amber-600 to-orange-700', 'bg-amber-500/10', 'border-amber-500/30', 'rust-editor'),
  util('go-editor', Terminal, 'Go', 'Go 代码编辑器', 'from-cyan-500 to-blue-600', 'bg-cyan-500/10', 'border-cyan-500/30', 'go-editor'),
  util('php-editor', FileCode, 'PHP', 'PHP 代码编辑器', 'from-indigo-500 to-purple-600', 'bg-indigo-500/10', 'border-indigo-500/30', 'php-editor'),
  util('md-editor', FileText, 'Markdown', 'Markdown 编辑器', 'from-slate-600 to-gray-700', 'bg-slate-500/10', 'border-slate-500/30', 'md-editor'),
  util('codesearch', Search, '代码搜索', 'CodeMirror 高级搜索替换', 'from-cyan-500 to-teal-600', 'bg-cyan-500/10', 'border-cyan-500/30', 'codesearch'),
  util('codelint', ShieldCheck, '代码检查', '代码语法检查与提示', 'from-red-500 to-rose-600', 'bg-red-500/10', 'border-red-500/30', 'codelint'),
  util('mock', Shuffle, 'Mock 数据', '生成模拟 JSON 数据', 'from-purple-500 to-pink-600', 'bg-purple-500/10', 'border-purple-500/30', 'mock'),
  util('qrcode', QrCode, '二维码生成', '生成和解析二维码', 'from-slate-600 to-gray-700', 'bg-slate-500/10', 'border-slate-500/30', 'qrcode'),
  util('uuid', Hash, 'UUID 生成', '生成唯一标识符', 'from-violet-500 to-purple-600', 'bg-violet-500/10', 'border-violet-500/30', 'uuid'),
  util('password', Lock, '密码生成器', '随机安全密码生成', 'from-red-600 to-rose-700', 'bg-red-500/10', 'border-red-500/30', 'password'),
  util('clipboard', Clipboard, '剪贴板工具', '历史记录与快速粘贴', 'from-blue-500 to-indigo-600', 'bg-blue-500/10', 'border-blue-500/30', 'clipboard'),
]

/**
 * 仅作为 modal 渲染的工具 id 集合(用于 ?tool= 参数解析)
 */
export const TOOL_COMPONENT_IDS = tools
  .filter((t) => !!t.componentKey)
  .map((t) => t.id!)

/**
 * 给定 id 查找 Tool 元数据
 */
export function findTool(id: string): ToolMeta | undefined {
  return tools.find((t) => t.id === id)
}
