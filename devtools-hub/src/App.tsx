import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronRight,
  X,
  Terminal,
  Menu,
  Sun,
  Moon,
  Search,
  Sparkles,
  Zap,
  Lock,
  Globe,
  Code2,
  FileText,
  Bot,
  Database,
  Sparkle,
} from 'lucide-react'
import './App.css'
import { AINavigator } from '@/components/ai-navigator'
import OffWorkCountdown from '@/components/OffWorkCountdown'
import { AdBanner } from '@/components/shared/AdBanner'
import { GlobalControls } from '@/components/shared/GlobalControls'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'
import {
  ContentConfigContext,
  type ContentConfig,
} from '@/contexts/ContentConfigContext'
import { tools, findTool, type ToolMeta } from '@/data/tools'

// 主页不显示的工具(都在 game-hub / offline-tools / 子页面里)
// 这些 id 在 tools.ts 里有定义,但点击应直接进子页面/子菜单
const NAV_HOMEPAGE_HIDE_IDS = new Set<string>([
  // 街机/FCS 经典游戏 - 全部在 /game-hub 子页
  'contra-fc', 'tank-battle', 'super-mario', 'lode-runner',
  'snowbros', 'pooyan-arcade', 'gberet', 'dino', 'punisher',
  'kof97', 'kof2002', 'orlegend', 'sangokushi', 'ldrun-arcade',
  'river-city', 'battle-city-nes', 'adventure-island', 'chip-dale',
  'lode-runner-nes', 'pooyan-nes',
  // 经典小游戏 - 在 /game-hub 子页
  'link-game', 'spider-solitaire', 'minesweeper', 'game2048', 'gold-miner',
  'sanmo', 'fumojì', 'fumojì-bbk', 'texas-holdem',
  // 文字游戏(独立页面)
  'ai-game', 'yikm-retro',
  // 离线工具子菜单(进 /offline-tools 子页)
  'json', 'xml', 'yaml', 'diff', 'sql', 'csv',
  'base64', 'hash', 'url', 'unicode', 'jwt', 'aes',
  'binary', 'color', 'timestamp',
  'regex', 'camel', 'case',
  'js', 'html', 'css', 'codemirror', 'codemerge',
  'js-editor', 'ts-editor', 'py-editor', 'java-editor', 'cpp-editor',
  'rust-editor', 'go-editor', 'php-editor', 'md-editor',
  'codesearch', 'codelint',
  'mock', 'qrcode', 'uuid', 'password', 'clipboard',
])

// 工具组件 - 用 React.lazy 做按需加载,首屏体积大幅缩减
const JsonTool = lazy(() => import('@/components/tools/JsonTool').then((m) => ({ default: m.JsonTool })))
const XmlTool = lazy(() => import('@/components/tools/XmlTool').then((m) => ({ default: m.XmlTool })))
const YamlTool = lazy(() => import('@/components/tools/YamlTool').then((m) => ({ default: m.YamlTool })))
const DiffTool = lazy(() => import('@/components/tools/DiffTool').then((m) => ({ default: m.DiffTool })))
const SqlTool = lazy(() => import('@/components/tools/SqlTool').then((m) => ({ default: m.SqlTool })))
const CsvTool = lazy(() => import('@/components/tools/CsvTool').then((m) => ({ default: m.CsvTool })))
const Base64Tool = lazy(() => import('@/components/tools/Base64Tool').then((m) => ({ default: m.Base64Tool })))
const HashTool = lazy(() => import('@/components/tools/HashTool').then((m) => ({ default: m.HashTool })))
const UrlTool = lazy(() => import('@/components/tools/UrlTool').then((m) => ({ default: m.UrlTool })))
const UnicodeTool = lazy(() => import('@/components/tools/UnicodeTool').then((m) => ({ default: m.UnicodeTool })))
const JwtTool = lazy(() => import('@/components/tools/JwtTool').then((m) => ({ default: m.JwtTool })))
const AesTool = lazy(() => import('@/components/tools/AesTool').then((m) => ({ default: m.AesTool })))
const BinaryTool = lazy(() => import('@/components/tools/BinaryTool').then((m) => ({ default: m.BinaryTool })))
const ColorTool = lazy(() => import('@/components/tools/ColorTool').then((m) => ({ default: m.ColorTool })))
const TimestampTool = lazy(() => import('@/components/tools/TimestampTool').then((m) => ({ default: m.TimestampTool })))
const RegexTool = lazy(() => import('@/components/tools/RegexTool').then((m) => ({ default: m.RegexTool })))
const CamelCaseTool = lazy(() => import('@/components/tools/CamelCaseTool').then((m) => ({ default: m.CamelCaseTool })))
const CaseTool = lazy(() => import('@/components/tools/CaseTool').then((m) => ({ default: m.CaseTool })))
const JsTool = lazy(() => import('@/components/tools/JsTool').then((m) => ({ default: m.JsTool })))
const HtmlTool = lazy(() => import('@/components/tools/HtmlTool').then((m) => ({ default: m.HtmlTool })))
const CssTool = lazy(() => import('@/components/tools/CssTool').then((m) => ({ default: m.CssTool })))
const CodeMirrorTool = lazy(() => import('@/components/tools/CodeMirrorTool').then((m) => ({ default: m.CodeMirrorTool })))
const CodeMergeTool = lazy(() => import('@/components/tools/CodeMergeTool').then((m) => ({ default: m.CodeMergeTool })))
const JsEditorTool = lazy(() => import('@/components/tools/JsEditorTool').then((m) => ({ default: m.JsEditorTool })))
const TsEditorTool = lazy(() => import('@/components/tools/TsEditorTool').then((m) => ({ default: m.TsEditorTool })))
const PyEditorTool = lazy(() => import('@/components/tools/PyEditorTool').then((m) => ({ default: m.PyEditorTool })))
const JavaEditorTool = lazy(() => import('@/components/tools/JavaEditorTool').then((m) => ({ default: m.JavaEditorTool })))
const CppEditorTool = lazy(() => import('@/components/tools/CppEditorTool').then((m) => ({ default: m.CppEditorTool })))
const RustEditorTool = lazy(() => import('@/components/tools/RustEditorTool').then((m) => ({ default: m.RustEditorTool })))
const GoEditorTool = lazy(() => import('@/components/tools/GoEditorTool').then((m) => ({ default: m.GoEditorTool })))
const PhpEditorTool = lazy(() => import('@/components/tools/PhpEditorTool').then((m) => ({ default: m.PhpEditorTool })))
const MdEditorTool = lazy(() => import('@/components/tools/MdEditorTool').then((m) => ({ default: m.MdEditorTool })))
const CodeSearchTool = lazy(() => import('@/components/tools/CodeSearchTool').then((m) => ({ default: m.CodeSearchTool })))
const CodeLintTool = lazy(() => import('@/components/tools/CodeLintTool').then((m) => ({ default: m.CodeLintTool })))
const MockTool = lazy(() => import('@/components/tools/MockTool').then((m) => ({ default: m.MockTool })))
const QrCodeTool = lazy(() => import('@/components/tools/QrCodeTool').then((m) => ({ default: m.QrCodeTool })))
const UuidTool = lazy(() => import('@/components/tools/UuidTool').then((m) => ({ default: m.UuidTool })))
const PasswordTool = lazy(() => import('@/components/tools/PasswordTool').then((m) => ({ default: m.PasswordTool })))
const ClipboardTool = lazy(() => import('@/components/tools/ClipboardTool').then((m) => ({ default: m.ClipboardTool })))

/**
 * 工具组件注册表
 * - key: ToolMeta.componentKey(对应 data/tools.ts)
 * - value: 懒加载组件
 * 用于工具面板 modal 中根据 selectedTool.id 渲染对应工具
 */
const TOOL_COMPONENTS: Record<string, React.LazyExoticComponent<React.ComponentType<any>>> = {
  json: JsonTool,
  xml: XmlTool,
  yaml: YamlTool,
  diff: DiffTool,
  sql: SqlTool,
  csv: CsvTool,
  base64: Base64Tool,
  hash: HashTool,
  url: UrlTool,
  unicode: UnicodeTool,
  jwt: JwtTool,
  aes: AesTool,
  binary: BinaryTool,
  color: ColorTool,
  timestamp: TimestampTool,
  regex: RegexTool,
  camel: CamelCaseTool,
  case: CaseTool,
  js: JsTool,
  html: HtmlTool,
  css: CssTool,
  codemirror: CodeMirrorTool,
  codemerge: CodeMergeTool,
  'js-editor': JsEditorTool,
  'ts-editor': TsEditorTool,
  'py-editor': PyEditorTool,
  'java-editor': JavaEditorTool,
  'cpp-editor': CppEditorTool,
  'rust-editor': RustEditorTool,
  'go-editor': GoEditorTool,
  'php-editor': PhpEditorTool,
  'md-editor': MdEditorTool,
  codesearch: CodeSearchTool,
  codelint: CodeLintTool,
  mock: MockTool,
  qrcode: QrCodeTool,
  uuid: UuidTool,
  password: PasswordTool,
  clipboard: ClipboardTool,
}

const features = [
  { id: 'speed', icon: Zap, title: '极速响应', description: '所有工具均在本地浏览器执行，无需等待' },
  { id: 'smart', icon: Sparkles, title: '智能格式化', description: '自动检测格式并提供最佳美化方案' },
  { id: 'privacy', icon: Lock, title: '隐私安全', description: '数据全程本地处理，不会上传服务器' },
  { id: 'cross', icon: Globe, title: '跨平台支持', description: '支持桌面和移动设备，随时随地使用' },
]

function App() {
  // 从 localStorage 读取主题设置
  const [isDark, setIsDark] = useState(() => {
    const theme = localStorage.getItem('devtools-theme')
    return theme === 'light' ? false : true
  })
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [selectedTool, setSelectedTool] = useState<ToolMeta | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearchResults, setShowSearchResults] = useState(false)

  // 全局内容配置
  const [contentHeight, setContentHeight] = useState(350)
  const [fontSize, setFontSize] = useState(14)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const theme = isDark ? 'dark' : 'light'
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('devtools-theme', theme)
  }, [isDark])

  // 处理 URL 参数中的 tool 参数(外部链接 deep-link 用)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const toolParam = params.get('tool')
    if (toolParam) {
      const found = findTool(toolParam)
      if (found?.componentKey) {
        setSelectedTool(found)
      }
      // 清除 URL 参数
      window.history.replaceState({}, '', '/')
    }
  }, [])

  // 搜索功能
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return []
    const query = searchQuery.toLowerCase()
    return tools.filter(
      (tool) =>
        tool.title.toLowerCase().includes(query) ||
        tool.description.toLowerCase().includes(query),
    )
  }, [searchQuery])

  const increaseHeight = () => setContentHeight((prev) => Math.min(prev + 50, 800))
  const decreaseHeight = () => setContentHeight((prev) => Math.max(prev - 50, 200))
  const increaseFontSize = () => setFontSize((prev) => Math.min(prev + 2, 24))
  const decreaseFontSize = () => setFontSize((prev) => Math.max(prev - 2, 1))

  const contentConfig: ContentConfig = {
    contentHeight,
    setContentHeight,
    fontSize,
    setFontSize,
    increaseHeight,
    decreaseHeight,
    increaseFontSize,
    decreaseFontSize,
    isFullscreen,
    setFullscreen: setIsFullscreen,
  }

  /**
   * 搜索结果点击处理
   * 区分: 有 route 的跳路由,有 componentKey 的打开 modal
   */
  const handleSearchSelect = (tool: ToolMeta) => {
    if (tool.route) {
      window.location.href = tool.route
    } else {
      setSelectedTool(tool)
    }
    setSearchQuery('')
    setShowSearchResults(false)
  }

  return (
    <>
      <ContentConfigContext.Provider value={contentConfig}>
        <div className="min-h-screen transition-theme bg-primary">
          {/* Background Gradient */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl bg-emerald-500/10" />
            <div className="absolute top-1/2 -left-40 w-96 h-96 rounded-full blur-3xl bg-blue-500/10" />
            <div className="absolute -bottom-40 right-1/3 w-72 h-72 rounded-full blur-3xl bg-purple-500/10" />
          </div>

          {/* Navigation */}
          <nav className="fixed top-4 left-4 right-4 z-40 rounded-2xl bg-secondary/80 backdrop-blur-xl shadow-lg border border-secondary transition-theme">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <Terminal className="w-5 h-5 text-gray-900 dark:text-white" />
                  </div>
                  <span className="text-xl font-bold text-gray-900 dark:text-white transition-theme">
                    DevTools Hub
                  </span>
                </div>

                {/* Search Box */}
                <div className="hidden md:flex items-center gap-8">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                    <input
                      type="text"
                      placeholder="搜索工具..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value)
                        setShowSearchResults(e.target.value.trim().length > 0)
                      }}
                      onFocus={() => setShowSearchResults(searchQuery.trim().length > 0)}
                      onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
                      className="w-64 pl-10 pr-4 py-2 rounded-xl bg-tertiary border border-secondary text-primary text-sm placeholder:text-muted focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                    {showSearchResults && searchResults.length > 0 && (
                      <div className="absolute top-full mt-2 left-0 w-full bg-secondary border border-secondary rounded-xl shadow-xl overflow-hidden">
                        <div className="p-2 text-xs text-muted border-b border-secondary">
                          找到 {searchResults.length} 个工具
                        </div>
                        {searchResults.map((tool) => {
                          const Icon = tool.icon
                          return (
                            <button
                              key={tool.id}
                              onClick={() => handleSearchSelect(tool)}
                              className="w-full flex items-center gap-3 p-3 hover:bg-tertiary transition-colors text-left"
                            >
                              <div
                                className={`w-8 h-8 rounded-lg ${tool.bgColor} flex items-center justify-center`}
                              >
                                <Icon className={`w-4 h-4 bg-gradient-to-br ${tool.color} bg-clip-text`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-primary truncate">{tool.title}</div>
                                <div className="text-xs text-muted truncate">{tool.description}</div>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    )}
                    {showSearchResults && searchQuery.trim() && searchResults.length === 0 && (
                      <div className="absolute top-full mt-2 left-0 w-full bg-secondary border border-secondary rounded-xl shadow-xl p-4 text-center">
                        <p className="text-sm text-muted">未找到匹配的工具</p>
                      </div>
                    )}
                  </div>
                  <Link
                    to="/gaussdb-learn"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold transition-colors text-teal-400 hover:text-teal-300"
                  >
                    <Database className="w-4 h-4" />
                    数据库学习
                  </Link>
                  <a href="#tools" className="text-sm font-medium transition-colors text-muted hover:text-primary">
                    工具列表
                  </a>
                  <a href="#features" className="text-sm font-medium transition-colors text-muted hover:text-primary">
                    功能特点
                  </a>
                  <button
                    onClick={() => setIsDark(!isDark)}
                    className="p-2.5 rounded-xl transition-all bg-tertiary hover:bg-border-primary text-warning"
                  >
                    {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                  </button>
                </div>

                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-2 rounded-lg"
                >
                  {mobileMenuOpen ? (
                    <X className="text-primary" />
                  ) : (
                    <Menu className="text-primary" />
                  )}
                </button>
              </div>
            </div>

            {mobileMenuOpen && (
              <div className="md:hidden px-4 pb-4 bg-secondary/95 backdrop-blur-xl rounded-b-2xl transition-theme">
                <div className="flex flex-col gap-3 pt-2">
                                <Link
                                  to="/gaussdb-learn"
                                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-teal-400 hover:bg-tertiary transition-colors"
                                >
                                  <Database className="w-4 h-4" />
                                  数据库学习
                                </Link>
                                <a href="#tools" className="px-4 py-2 rounded-lg text-sm font-medium text-secondary hover:bg-tertiary transition-colors">
                                  工具列表
                                </a>
                                <a href="#features" className="px-4 py-2 rounded-lg text-sm font-medium text-secondary hover:bg-tertiary transition-colors">
                                  功能特点
                                </a>
                  <button
                    onClick={() => setIsDark(!isDark)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-secondary hover:bg-tertiary transition-colors"
                  >
                    {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    {isDark ? '切换亮色' : '切换暗色'}
                  </button>
                </div>
              </div>
            )}
          </nav>

          {/* Hero Section */}
          <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-8 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <Sparkles className="w-4 h-4" />
                为开发者打造的效率工具集
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight text-primary">
                告别繁琐
                <br />
                <span className="bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent">
                  提升开发效率
                </span>
              </h1>

              <p className="text-lg sm:text-xl mb-12 max-w-2xl mx-auto text-muted">
                汇集 {tools.filter((t) => t.category === 'utility').length}+ 款开发常用工具,覆盖格式化、编码、加密、代码编辑等场景
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <a
                  href="#tools"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold text-lg shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-105 transition-all"
                >
                  <Sparkles className="w-5 h-5" />
                  立即开始
                </a>
                <a
                  href="#features"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-secondary border border-primary text-primary font-semibold text-lg hover:bg-tertiary transition-all"
                >
                  了解更多
                </a>
              </div>

              {/* 新功能高亮提示条 */}
              <div className="mt-10 flex items-center justify-center gap-3 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-md shadow-teal-500/30">
                  <Sparkle className="w-3 h-3" />
                  NEW
                </span>
                <Link
                  to="/gaussdb-learn"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-300 hover:text-teal-200 transition-colors group"
                >
                  <Database className="w-4 h-4" />
                  GaussDB 在线学习 + SQL 练习
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          </section>

          {/* Tools Section - 按 category 分组渲染 */}
          <section id="tools" className="relative py-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-primary">所有工具</h2>
                <p className="text-lg max-w-2xl mx-auto text-muted">
                  精选开发者必备工具,持续更新中
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {tools
                  .filter((t) => !NAV_HOMEPAGE_HIDE_IDS.has(t.id))
                  .map((tool) => {
                    // 有 route 的(导航大类 + 游戏大类)用 Link 跳子页面
                    if (tool.route) {
                      return (
                        <Link
                          key={tool.id}
                          to={tool.route}
                          className={`group relative p-6 rounded-2xl bg-secondary/80 border ${tool.borderColor} backdrop-blur-xl transition-all hover:scale-105 hover:shadow-xl text-left`}
                        >
                          <div className={`w-12 h-12 rounded-xl ${tool.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                            <tool.icon className={`w-6 h-6 bg-gradient-to-br ${tool.color} bg-clip-text`} />
                          </div>
                          <h3 className="text-lg font-semibold mb-2 text-primary">
                            {tool.title}
                          </h3>
                          <p className="text-sm text-subtle">
                            {tool.description}
                          </p>
                          <div className={`absolute top-4 right-4 w-6 h-6 rounded-full ${tool.bgColor} flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity`}>
                            <ChevronRight className={`w-4 h-4 bg-gradient-to-br ${tool.color} bg-clip-text`} />
                          </div>
                        </Link>
                      )
                    }
                    // 实用工具(util)点击用 modal 弹出
                    const Icon = tool.icon
                    return (
                      <button
                        key={tool.id}
                        onClick={() => handleSearchSelect(tool)}
                        className={`group p-6 rounded-2xl bg-secondary/80 border ${tool.borderColor} text-left transition-theme hover:scale-105 hover:shadow-xl`}
                      >
                        <div className={`w-12 h-12 rounded-xl ${tool.bgColor} flex items-center justify-center mb-4`}>
                          <Icon className={`w-6 h-6 bg-gradient-to-br ${tool.color} bg-clip-text`} />
                        </div>
                        <h3 className="text-lg font-semibold mb-2 text-primary">{tool.title}</h3>
                        <p className="text-sm text-muted line-clamp-2">{tool.description}</p>
                      </button>
                    )
                  })}
              </div>
            </div>
          </section>

          {/* 广告位 1 - 工具列表后 */}
          <AdBanner position="tools-after" />

          {/* Features Section */}
          <section id="features" className="relative py-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-primary">功能特点</h2>
                <p className="text-lg text-muted">为什么选择 DevTools Hub</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {features.map((feature) => (
                  <div
                    key={feature.id}
                    className="p-6 rounded-2xl bg-secondary/80 border border-secondary text-center transition-theme"
                  >
                    <div className="w-12 h-12 rounded-xl mx-auto mb-4 bg-emerald-500/10 flex items-center justify-center">
                      <feature.icon className="w-6 h-6 text-emerald-400" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2 text-primary">{feature.title}</h3>
                    <p className="text-sm text-muted">{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="relative py-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-tertiary)] border border-primary p-8 sm:p-12 text-center transition-theme">
                <div className="relative z-10">
                  <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-primary">
                    准备好提升开发效率了吗？
                  </h2>
                  <p className="text-lg mb-8 text-muted">
                    立即开始使用所有工具，完全免费
                  </p>
                  <a
                    href="#tools"
                    className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold text-lg shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-105 transition-all"
                  >
                    <Sparkles className="w-5 h-5" />
                    立即开始
                  </a>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-emerald-500/20 to-transparent rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-blue-500/20 to-transparent rounded-full blur-3xl" />
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-primary transition-theme">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <Terminal className="w-4 h-4 text-gray-900 dark:text-white" />
                  </div>
                  <span className="font-semibold text-primary">DevTools Hub</span>
                </div>
                <p className="text-sm text-subtle">
                  © 2026 DevTools Hub. 使用 React + Tailwind CSS 构建
                </p>
              </div>
            </div>
          </footer>

          {/* 广告位 2 - 页脚 */}
          <AdBanner position="footer" />

          {/* Tool Panel Modal */}
          {selectedTool && (
            <div
              className={`fixed inset-0 z-50 flex items-start justify-center overflow-auto ${isFullscreen ? 'bg-primary' : 'pt-8 px-4 pb-4'}`}
            >
              {!isFullscreen && (
                <div
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                  onClick={() => {
                    setSelectedTool(null)
                    setIsFullscreen(false)
                  }}
                />
              )}
              <div
                className={`relative w-full rounded-2xl bg-secondary border border-primary shadow-2xl overflow-hidden my-4 transition-theme ${isFullscreen ? 'h-screen max-w-screen-2xl' : 'max-w-6xl'}`}
              >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-primary">
                  <button
                    onClick={() => {
                      setSelectedTool(null)
                      setIsFullscreen(false)
                    }}
                    className="flex items-center gap-2 text-muted hover:text-primary transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 rotate-180" />
                    <span className="hidden sm:inline">返回首页</span>
                  </button>
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl ${selectedTool.bgColor} flex items-center justify-center`}
                    >
                      <selectedTool.icon
                        className={`w-5 h-5 bg-gradient-to-br ${selectedTool.color} bg-clip-text`}
                      />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-primary">{selectedTool.title}</h2>
                      <p className="text-sm text-subtle">{selectedTool.description}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedTool(null)
                      setIsFullscreen(false)
                    }}
                    className="p-2 rounded-lg hover:bg-tertiary transition-colors"
                  >
                    <X className="w-5 h-5 text-muted" />
                  </button>
                </div>

                {/* Global Controls - Always visible */}
                <GlobalControls />

                {/* Tool Content */}
                <div
                  className={`p-6 ${isFullscreen ? 'h-[calc(100vh-130px)] overflow-auto' : 'min-h-[600px]'}`}
                >
                  <ErrorBoundary>
                    <Suspense
                      fallback={
                        <div className="flex items-center justify-center h-64 text-muted">
                          <Bot className="w-6 h-6 animate-pulse mr-2" />
                          正在加载工具...
                        </div>
                      }
                    >
                      {selectedTool.componentKey && TOOL_COMPONENTS[selectedTool.componentKey] ? (
                        (() => {
                          const ToolComp = TOOL_COMPONENTS[selectedTool.componentKey!]
                          return <ToolComp />
                        })()
                      ) : (
                        <div className="text-center py-12 text-subtle">
                          <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>该工具正在开发中...</p>
                        </div>
                      )}
                    </Suspense>
                  </ErrorBoundary>
                </div>
              </div>
            </div>
          )}
        </div>
      </ContentConfigContext.Provider>

      {/* 下班倒计时浮动组件 */}
      <OffWorkCountdown />
    </>
  )
}

export default App
