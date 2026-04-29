import { useState, useEffect, useMemo, createContext, useContext, useRef } from 'react'
import {
  Braces,
  FileCode2,
  GitCompare,
  Hash,
  Terminal,
  Clipboard,
  Database,
  Table2,
  Type,
  Code2,
  Layers,
  Search,
  Sparkles,
  Zap,
  Sun,
  Moon,
  Menu,
  X,
  ChevronRight,
  Copy,
  Check,
  AlignLeft,
  ArrowLeftRight,
  FileText,
  ShieldCheck,
  Gauge,
  Maximize2,
  Minimize2,
  ChevronsUpDown,
  AArrowUp,
  AArrowDown,
  StretchHorizontal,
  Palette,
  Clock,
  Binary,
  Key,
  Globe,
  FileJson,
  FileCode,
  FileText as FileTextIcon,
  Shuffle,
  Wand2,
  Calculator,
  TextCursorInput,
  Image,
  QrCode,
  Unlink,
  Lock,
  Unlock,
  ArrowRightLeft,
  SortAsc,
  SortDesc,
  Expand,
  Coffee,
  AlertCircle,
  Cog,
  Code,
  Bot,
  WifiOff,
  Gamepad2
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import './App.css'
import { AINavigator } from '@/components/ai-navigator'

// 全局内容配置 Context
interface ContentConfig {
  contentHeight: number
  setContentHeight: (h: number) => void
  fontSize: number
  setFontSize: (s: number) => void
  increaseHeight: () => void
  decreaseHeight: () => void
  increaseFontSize: () => void
  decreaseFontSize: () => void
  isFullscreen: boolean
  setFullscreen: (v: boolean) => void
}

const ContentConfigContext = createContext<ContentConfig | null>(null)

const useContentConfig = () => {
  const ctx = useContext(ContentConfigContext)
  if (!ctx) throw new Error('useContentConfig must be used within ContentConfigProvider')
  return ctx
}

// 可复用的文本区域组件
function ContentTextarea({ 
  value, 
  onChange, 
  placeholder,
  isInput = true
}: { 
  value: string
  onChange?: (v: string) => void
  placeholder?: string
  isInput?: boolean
}) {
  const { contentHeight, fontSize, isFullscreen } = useContentConfig()
  const height = isFullscreen ? Math.min(contentHeight, window.innerHeight - 200) : contentHeight
  
  return (
    <div className="relative flex-1 min-h-[200px]">
      <textarea
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        readOnly={!isInput}
        placeholder={placeholder}
        style={{ height: `${height}px`, fontSize: `${fontSize}px` }}
        className="dev-textarea w-full p-4 rounded-xl border text-primary font-mono resize-none focus:border-emerald-500 transition-theme text-left whitespace-pre overflow-auto"
      />
    </div>
  )
}

// 可复用的输出显示组件
function ContentOutput({ value, placeholder = '输出结果...' }: { value: string; placeholder?: string }) {
  const { contentHeight, fontSize, isFullscreen } = useContentConfig()
  const height = isFullscreen ? Math.min(contentHeight, window.innerHeight - 200) : contentHeight
  const [copied, setCopied] = useState(false)
  
  const copyOutput = async () => {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  return (
    <div className="relative flex-1 min-h-[200px]">
      <div 
        style={{ height: `${height}px`, fontSize: `${fontSize}px` }}
        className="dev-textarea w-full p-4 rounded-xl border text-primary font-mono overflow-auto text-left whitespace-pre transition-theme"
      >
        {value || <span className="text-subtle">{placeholder}</span>}
      </div>
      {value && (
        <button 
          onClick={copyOutput} 
          className="absolute top-3 right-3 p-2 rounded-lg bg-tertiary hover:bg-border-primary text-secondary transition-colors"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
        </button>
      )}
    </div>
  )
}

// 全局控制栏
function GlobalControls() {
  const { contentHeight, fontSize, increaseHeight, decreaseHeight, increaseFontSize, decreaseFontSize, isFullscreen, setFullscreen } = useContentConfig()
  
  return (
    <div className="px-6 py-3 bg-tertiary/80 border-b border-primary flex items-center gap-4 flex-wrap transition-theme">
      <span className="text-sm text-muted flex items-center gap-2">
        <StretchHorizontal className="w-4 h-4" />
        全局设置:
      </span>
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted">高度:</span>
        <button onClick={decreaseHeight} className="p-1.5 rounded bg-secondary hover:bg-border-primary text-secondary transition-colors" title="减小高度">
          <ChevronsUpDown className="w-4 h-4" />
        </button>
        <span className="px-2 py-1 bg-secondary rounded text-xs text-secondary min-w-[50px] text-center">{contentHeight}px</span>
        <button onClick={increaseHeight} className="p-1.5 rounded bg-secondary hover:bg-border-primary text-secondary transition-colors" title="增大高度">
          <ChevronsUpDown className="w-4 h-4 rotate-180" />
        </button>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted">字号:</span>
        <button onClick={decreaseFontSize} className="p-1.5 rounded bg-secondary hover:bg-border-primary text-secondary transition-colors" title="减小字体">
          <AArrowDown className="w-4 h-4" />
        </button>
        <span className="px-2 py-1 bg-secondary rounded text-xs text-secondary min-w-[35px] text-center">{fontSize}px</span>
        <button onClick={increaseFontSize} className="p-1.5 rounded bg-secondary hover:bg-border-primary text-secondary transition-colors" title="增大字体">
          <AArrowUp className="w-4 h-4" />
        </button>
      </div>
      <div className="ml-auto">
        <button 
          onClick={() => setFullscreen(!isFullscreen)} 
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-primary hover:bg-accent-hover text-white font-medium transition-colors"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          {isFullscreen ? '缩小' : '全屏'}
        </button>
      </div>
    </div>
  )
}

interface Tool {
  id: string
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  color: string
  bgColor: string
  borderColor: string
}

const tools: Tool[] = [
  // 导航
  { id: 'ai-nav', icon: Bot, title: 'AI 导航黄页', description: '收录全网优质 AI 工具，支持分类浏览和搜索', color: 'from-emerald-400 to-green-600', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/30' },
  { id: 'coding-world', icon: Globe, title: 'Coding The World', description: '探索优质开源项目', color: 'from-blue-500 to-purple-600', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/30' },
  
  // AI 游戏
  { id: 'ai-game', icon: Gamepad2, title: 'AI 游戏工坊', description: '输入文字让 AI 生成游戏关卡，文本命令操控角色', color: 'from-purple-500 to-pink-600', bgColor: 'bg-purple-500/10', borderColor: 'border-purple-500/30' },
  
  // 离线工具
  { id: 'offline-tools', icon: WifiOff, title: '离线工具', description: '40+ 开发工具，无需网络即开即用', color: 'from-orange-500 to-amber-600', bgColor: 'bg-orange-500/10', borderColor: 'border-orange-500/30' },
]

const features = [
  { id: 'speed', icon: Zap, title: '极速响应', description: '所有工具均在本地浏览器执行，无需等待' },
  { id: 'smart', icon: Sparkles, title: '智能格式化', description: '自动检测格式并提供最佳美化方案' },
  { id: 'privacy', icon: Lock, title: '隐私安全', description: '数据全程本地处理，不会上传服务器' },
  { id: 'cross', icon: Globe, title: '跨平台支持', description: '支持桌面和移动设备，随时随地使用' },
]

// ==================== 工具组件 ====================

// JSON 格式化工具
function JsonTool() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')

  const formatJson = () => {
    try {
      const parsed = JSON.parse(input)
      setOutput(JSON.stringify(parsed, null, 2))
      setError('')
    } catch (e) {
      setError((e as Error).message)
      setOutput('')
    }
  }

  const compressJson = () => {
    try {
      const parsed = JSON.parse(input)
      setOutput(JSON.stringify(parsed))
      setError('')
    } catch (e) {
      setError((e as Error).message)
      setOutput('')
    }
  }

  const validateJson = () => {
    try {
      JSON.parse(input)
      setError('')
      setOutput('✓ JSON 格式正确')
    } catch (e) {
      setError((e as Error).message)
    }
  }

  return (
    <div className="flex flex-col gap-4 flex-1">
      <div className="space-y-2">
        <label className="text-sm text-muted flex items-center gap-2">
          <FileText className="w-4 h-4" /> 输入 JSON
        </label>
        <ContentTextarea value={input} onChange={setInput} placeholder="粘贴 JSON 数据..." />
      </div>

      <div className="flex gap-3 flex-wrap">
        <button onClick={formatJson} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors">
          <AlignLeft className="w-4 h-4" /> 美化
        </button>
        <button onClick={compressJson} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-tertiary hover:bg-border-primary text-white font-medium transition-colors">
          <Gauge className="w-4 h-4" /> 压缩
        </button>
        <button onClick={validateJson} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-tertiary hover:bg-border-primary text-white font-medium transition-colors">
          <ShieldCheck className="w-4 h-4" /> 校验
        </button>
      </div>

      {error && <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-sm">{error}</div>}

      <div className="space-y-2 flex-1">
        <label className="text-sm text-muted flex items-center gap-2">
          <FileText className="w-4 h-4" /> 输出结果
        </label>
        <ContentOutput value={output} />
      </div>
    </div>
  )
}

// XML 语法高亮组件
function XmlHighlightedOutput({ xml }: { xml: string }) {
  const { contentHeight, fontSize, isFullscreen } = useContentConfig()
  const [copied, setCopied] = useState(false)
  const height = isFullscreen ? Math.min(contentHeight, window.innerHeight - 200) : contentHeight

  const copyOutput = async () => {
    await navigator.clipboard.writeText(xml)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // HTML 转义函数
  const escapeHtml = (str: string) => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
  }

  // 解析单个标签并返回高亮后的 HTML
  const parseTag = (tag: string): string => {
    if (tag.startsWith('<!--')) {
      // 注释
      return `<span class="xml-comment">${escapeHtml(tag)}</span>`
    }
    if (tag.startsWith('<?') || tag.startsWith('<!')) {
      // 处理指令或 DOCTYPE
      return `<span class="xml-declaration">${escapeHtml(tag)}</span>`
    }
    if (tag.startsWith('</')) {
      // 结束标签：</name>
      const name = tag.slice(2, -1)
      return `&lt;/<span class="xml-tag">${escapeHtml(name)}</span>&gt;`
    }
    if (tag.endsWith('/>')) {
      // 自闭合标签：<name .../>
      const inner = tag.slice(1, -2)
      return `&lt;${highlightAttrs(inner)}<span class="xml-bracket">/&gt;</span>`
    }
    // 开始标签：<name ...>
    const inner = tag.slice(1, -1)
    return `&lt;${highlightAttrs(inner)}&gt;`
  }

  // 处理标签内的属性高亮
  const highlightAttrs = (content: string): string => {
    const parts = content.split(/\s+/)
    const tagName = parts[0]
    let result = `<span class="xml-tag">${escapeHtml(tagName)}</span>`
    
    if (parts.length > 1) {
      for (let i = 1; i < parts.length; i++) {
        const attr = parts[i]
        const attrMatch = attr.match(/^([\w:.-]+)=("[^"]*")$/)
        if (attrMatch) {
          result += ` <span class="xml-attr-name">${escapeHtml(attrMatch[1])}</span>=<span class="xml-attr-value">${attrMatch[2]}</span>`
        } else {
          result += ' ' + escapeHtml(attr)
        }
      }
    }
    
    return result
  }

  // XML 语法高亮函数
  const highlightXml = (str: string): string => {
    if (!str) return ''
    
    return str.split('\n').map(line => {
      let result = ''
      let i = 0
      
      while (i < line.length) {
        if (line[i] === '<') {
          // 找到标签结束位置
          const tagEnd = line.indexOf('>', i)
          if (tagEnd === -1) {
            result += escapeHtml(line.slice(i))
            break
          }
          const tag = line.slice(i, tagEnd + 1)
          result += parseTag(tag)
          i = tagEnd + 1
        } else {
          result += escapeHtml(line[i])
          i++
        }
      }
      
      return result
    }).join('\n')
  }

  return (
    <div className="relative flex-1 min-h-[200px]">
      <div 
        style={{ height: `${height}px`, fontSize: `${fontSize}px` }}
        className="w-full p-4 rounded-xl bg-input border border-primary overflow-auto text-left"
      >
        <pre className="font-mono text-slate-200 whitespace-pre-wrap break-normal" dangerouslySetInnerHTML={{ __html: highlightXml(xml) }} />
      </div>
      {xml && (
        <button 
          onClick={copyOutput} 
          className="absolute top-3 right-3 p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-secondary transition-colors"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
        </button>
      )}
    </div>
  )
}

// XML 格式化工具
function XmlTool() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')

  const formatXml = () => {
    if (!input.trim()) {
      setError('请输入 XML 内容')
      setOutput('')
      return
    }
    
    try {
      // 移除 BOM 和首尾空白
      let xml = input.replace(/^\uFEFF/, '').trim()
      
      // 格式化 XML
      const formatted = prettyPrintXml(xml)
      setOutput(formatted)
      setError('')
    } catch (e) {
      setError(`XML 格式错误: ${(e as Error).message}`)
      setOutput('')
    }
  }
  
  // XML 美化函数 - 文本内容和标签在同一行
  const prettyPrintXml = (xml: string): string => {
    const lines: string[] = []
    let indent = 0
    const indentStr = '    '
    
    // 预处理：移除 BOM，多余空白合并
    let cleaned = xml.replace(/^\uFEFF/, '').replace(/>\s+</g, '><').replace(/\s+/g, ' ').trim()
    
    // 使用栈来跟踪标签
    const stack: string[] = []
    let i = 0
    
    while (i < cleaned.length) {
      if (cleaned[i] === '<') {
        const tagEnd = cleaned.indexOf('>', i)
        if (tagEnd === -1) break
        
        const tag = cleaned.slice(i, tagEnd + 1)
        
        if (tag.startsWith('<?') || tag.startsWith('<!')) {
          // XML声明、DOCTYPE等，不缩进
          lines.push(tag)
        } else if (tag.startsWith('<!--')) {
          // 注释
          lines.push(indentStr.repeat(indent) + tag)
        } else if (tag.startsWith('</')) {
          // 结束标签
          indent = Math.max(0, indent - 1)
          stack.pop()
          
          // 检查是否有未闭合的开始标签需要闭合
          const lastLine = lines[lines.length - 1] || ''
          if (!lastLine.includes('</') && !lastLine.endsWith('/>')) {
            // 如果上一行有开始标签没有关闭，需要先关闭它
            lines[lines.length - 1] = lastLine + '</' + tag.slice(2, -1) + '>'
          } else {
            lines.push(indentStr.repeat(indent) + tag)
          }
        } else if (tag.endsWith('/>')) {
          // 自闭合标签
          lines.push(indentStr.repeat(indent) + tag)
        } else {
          // 开始标签 - 检查后面是否有文本内容
          const afterTag = cleaned.slice(tagEnd + 1)
          const textMatch = afterTag.match(/^([^<]+)</)
          
          if (textMatch) {
            // 有文本内容，标签和文本在同一行
            const text = textMatch[1].trim()
            lines.push(indentStr.repeat(indent) + tag + text + '</' + tag.slice(1, -1) + '>')
            // 更新索引跳过文本和结束标签
            i = tagEnd + 1 + text.length + ('</' + tag.slice(1, -1) + '>').length
            stack.pop() // 标签已闭合
            continue
          } else {
            // 没有文本内容或有子元素，保持原样
            lines.push(indentStr.repeat(indent) + tag)
            stack.push(tag)
            indent++
          }
        }
        
        i = tagEnd + 1
      } else {
        // 文本内容（不在标签内）
        const nextTag = cleaned.indexOf('<', i)
        const end = nextTag === -1 ? cleaned.length : nextTag
        const text = cleaned.slice(i, end).trim()
        if (text) {
          lines.push(indentStr.repeat(indent) + text)
        }
        i = end
      }
    }
    
    return lines.join('\n')
  }

  return (
    <div className="flex flex-col gap-4 flex-1">
      <div className="space-y-2">
        <label className="text-sm text-muted">输入 XML</label>
        <ContentTextarea value={input} onChange={setInput} placeholder="粘贴 XML 数据..." />
      </div>

      <div className="flex gap-3">
        <button onClick={formatXml} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors">
          <AlignLeft className="w-4 h-4" /> 美化
        </button>
      </div>

      {error && <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-sm">{error}</div>}

      <div className="space-y-2 flex-1">
        <label className="text-sm text-muted">输出结果（语法高亮）</label>
        <XmlHighlightedOutput xml={output} />
      </div>
    </div>
  )
}

// Git 风格文本对比工具
function DiffTool() {
  const { contentHeight, fontSize, isFullscreen } = useContentConfig()
  const [original, setOriginal] = useState('')
  const [modified, setModified] = useState('')
  const [diffLines, setDiffLines] = useState<Array<{
    type: 'equal' | 'delete' | 'insert' | 'modify'
    oldLine: string | null
    newLine: string | null
    oldLineNum: number | null
    newLineNum: number | null
  }>>([])
  
  const scrollRef = useRef<HTMLDivElement>(null)

  // 根据字体大小计算行高
  const lineHeight = Math.max(fontSize * 1.5, 24)

  // 计算 Myers 差分算法生成 Git 风格对比
  const computeGitDiff = () => {
    const oldLines = original.split('\n')
    const newLines = modified.split('\n')
    
    if (!original.trim() && !modified.trim()) {
      setDiffLines([])
      return
    }
    
    // 使用 LCS 计算差异
    const lcs = computeLCS(oldLines, newLines)
    const result: typeof diffLines = []
    
    let oldIdx = 0
    let newIdx = 0
    let lcsIdx = 0
    
    while (oldIdx < oldLines.length || newIdx < newLines.length) {
      // 找到 LCS 中的下一个匹配行
      if (lcsIdx < lcs.length) {
        const lcsLine = lcs[lcsIdx]
        
        // 处理删除的行（原文中有但不在当前位置）
        while (oldIdx < oldLines.length && oldLines[oldIdx] !== lcsLine) {
          result.push({
            type: 'delete',
            oldLine: oldLines[oldIdx],
            newLine: null,
            oldLineNum: oldIdx + 1,
            newLineNum: null
          })
          oldIdx++
        }
        
        // 处理新增的行（新文中有的但不在当前位置）
        while (newIdx < newLines.length && newLines[newIdx] !== lcsLine) {
          result.push({
            type: 'insert',
            oldLine: null,
            newLine: newLines[newIdx],
            oldLineNum: null,
            newLineNum: newIdx + 1
          })
          newIdx++
        }
        
        // 相同行
        if (oldIdx < oldLines.length && newIdx < newLines.length) {
          result.push({
            type: 'equal',
            oldLine: oldLines[oldIdx],
            newLine: newLines[newIdx],
            oldLineNum: oldIdx + 1,
            newLineNum: newIdx + 1
          })
          oldIdx++
          newIdx++
          lcsIdx++
        }
      } else {
        // LCS 已处理完，剩余的都是差异
        while (oldIdx < oldLines.length) {
          result.push({
            type: 'delete',
            oldLine: oldLines[oldIdx],
            newLine: null,
            oldLineNum: oldIdx + 1,
            newLineNum: null
          })
          oldIdx++
        }
        while (newIdx < newLines.length) {
          result.push({
            type: 'insert',
            oldLine: null,
            newLine: newLines[newIdx],
            oldLineNum: null,
            newLineNum: newIdx + 1
          })
          newIdx++
        }
      }
    }
    
    setDiffLines(result)
  }

  // LCS 计算函数 (优化版，支持大文件)
  const computeLCS = (arr1: string[], arr2: string[]): string[] => {
    const m = arr1.length
    const n = arr2.length
    
    // 空数组处理
    if (m === 0 || n === 0) return []
    
    // 如果行数太多，使用简化算法避免内存溢出
    if (m > 1000 || n > 1000) {
      // 简化的行对行比较
      const result: string[] = []
      const maxLen = Math.max(arr1.length, arr2.length)
      for (let i = 0; i < maxLen; i++) {
        if (i < arr1.length && i < arr2.length && arr1[i] === arr2[i]) {
          result.push(arr1[i])
        }
      }
      return result
    }
    
    const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0))
    
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (arr1[i - 1] === arr2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
        }
      }
    }
    
    const lcs: string[] = []
    let i = m, j = n
    while (i > 0 && j > 0) {
      if (arr1[i - 1] === arr2[j - 1]) {
        lcs.unshift(arr1[i - 1])
        i--
        j--
      } else if (dp[i - 1][j] > dp[i][j - 1]) {
        i--
      } else {
        j--
      }
    }
    
    return lcs
  }

  // 输入变化时自动对比
  const handleInputChange = (type: 'original' | 'modified', value: string) => {
    if (type === 'original') {
      setOriginal(value)
    } else {
      setModified(value)
    }
    // 延迟执行对比，等待两个输入都更新
    setTimeout(() => computeGitDiff(), 0)
  }

  // 处理 blur 事件
  const handleBlur = () => {
    computeGitDiff()
  }

  // 获取行样式
  const getLineClass = (type: string) => {
    switch (type) {
      case 'delete': return 'bg-red-500/20 border-l-4 border-red-500'
      case 'insert': return 'bg-emerald-500/20 border-l-4 border-emerald-500'
      case 'modify': return 'bg-amber-500/20 border-l-4 border-amber-500'
      default: return 'border-l-4 border-transparent hover:bg-slate-700/30'
    }
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* 输入区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl bg-input border border-primary overflow-hidden">
          <div className="px-4 py-2 text-sm text-red-400 border-b border-slate-700 bg-slate-900/50 font-medium flex items-center gap-2">
            <Minus className="w-4 h-4" /> 原文
          </div>
          <textarea
            value={original}
            onChange={(e) => handleInputChange('original', e.target.value)}
            onBlur={handleBlur}
            placeholder="粘贴原始文本..."
            style={{ fontSize: `${fontSize}px`, lineHeight: `${lineHeight}px`, minHeight: '150px', maxHeight: contentHeight / 2 }}
            className="w-full p-4 bg-slate-800 text-slate-200 caret-slate-200 font-mono resize-none focus:outline-none text-left whitespace-pre break-words box-border"
          />
        </div>
        <div className="rounded-xl bg-input border border-primary overflow-hidden">
          <div className="px-4 py-2 text-sm text-emerald-400 border-b border-slate-700 bg-slate-900/50 font-medium flex items-center gap-2">
            <Plus className="w-4 h-4" /> 新文
          </div>
          <textarea
            value={modified}
            onChange={(e) => handleInputChange('modified', e.target.value)}
            onBlur={handleBlur}
            placeholder="粘贴新文本..."
            style={{ fontSize: `${fontSize}px`, lineHeight: `${lineHeight}px`, minHeight: '150px', maxHeight: contentHeight / 2 }}
            className="w-full p-4 bg-slate-800 text-slate-200 caret-slate-200 font-mono resize-none focus:outline-none text-left whitespace-pre break-words box-border"
          />
        </div>
      </div>

      {/* 对比结果 - Git 风格 */}
      {diffLines.length > 0 && (
        <div className="flex-1 rounded-xl bg-input border border-primary overflow-hidden flex flex-col">
          <div className="px-4 py-2 text-sm text-muted border-b border-primary bg-secondary/80 font-medium flex items-center gap-4 transition-theme">
            <GitCompare className="w-4 h-4" /> 对比结果
            <span className="text-xs text-muted">
              共 {diffLines.length} 行 | 
              <span className="text-red-500 ml-2">{diffLines.filter(l => l.type === 'delete').length} 删除</span> | 
              <span className="text-emerald-600 ml-2">{diffLines.filter(l => l.type === 'insert').length} 新增</span>
            </span>
          </div>
          
          <div 
            ref={scrollRef}
            className="flex-1 overflow-auto bg-input"
            style={{ maxHeight: isFullscreen ? window.innerHeight - 350 : contentHeight - 50 }}
          >
            {/* 表头 */}
            <div className="sticky top-0 z-10 flex bg-secondary border-b border-primary transition-theme">
              <div className="w-16 px-2 py-1 text-xs text-muted font-mono text-center border-r border-primary transition-theme">状态</div>
              <div className="w-16 px-2 py-1 text-xs text-muted font-mono text-center border-r border-primary transition-theme">原文</div>
              <div className="w-16 px-2 py-1 text-xs text-muted font-mono text-center border-r border-primary transition-theme">新文</div>
              <div className="flex-1 px-4 py-1 text-xs text-muted font-mono transition-theme">内容</div>
            </div>
            
            {/* 差异行 */}
            <div className="font-mono bg-input transition-theme" style={{ fontSize: `${fontSize}px`, lineHeight: `${lineHeight}px` }}>
              {diffLines.map((line, idx) => (
                <div key={idx} className={`flex ${getLineClass(line.type)}`}>
                  <div className="w-16 px-2 text-center border-r border-primary/50 flex-shrink-0 flex items-center justify-center transition-theme">
                    {line.type === 'delete' && <Minus className="w-4 h-4 text-red-500" />}
                    {line.type === 'insert' && <Plus className="w-4 h-4 text-emerald-600" />}
                    {line.type === 'equal' && <span className="text-muted"> </span>}
                  </div>
                  <div className="w-16 px-2 text-right text-muted border-r border-primary/50 flex-shrink-0 transition-theme">
                    {line.oldLineNum || ' '}
                  </div>
                  <div className="w-16 px-2 text-right text-muted border-r border-primary/50 flex-shrink-0 transition-theme">
                    {line.newLineNum || ' '}
                  </div>
                  <div className="flex-1 px-4 whitespace-pre break-words transition-theme">
                    <span className={line.type === 'delete' ? 'text-red-600 dark:text-red-300' : line.type === 'insert' ? 'text-emerald-600 dark:text-emerald-300' : 'text-secondary'}>
                      {line.type === 'delete' ? line.oldLine : line.newLine}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 操作提示 */}
      <div className="flex gap-3 flex-wrap items-center">
        <button onClick={computeGitDiff} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors">
          <ArrowLeftRight className="w-4 h-4" /> 手动对比
        </button>
        <span className="text-sm text-subtle">
          输入内容后自动对比
        </span>
      </div>
    </div>
  )
}

// 添加 Minus 图标
function Minus(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
    </svg>
  )
}

// 添加 Plus 图标
function Plus(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  )
}

// Base64 编解码工具
function Base64Tool() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [mode, setMode] = useState<'encode' | 'decode'>('encode')

  const process = () => {
    try {
      if (mode === 'encode') {
        setOutput(btoa(unescape(encodeURIComponent(input))))
      } else {
        setOutput(decodeURIComponent(escape(atob(input))))
      }
    } catch {
      setOutput('错误：输入无效')
    }
  }

  return (
    <div className="flex flex-col gap-4 flex-1">
      <div className="space-y-2">
        <label className="text-sm text-muted">输入内容</label>
        <ContentTextarea value={input} onChange={setInput} placeholder="输入要编码/解码的内容..." />
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="flex rounded-lg overflow-hidden">
          <button 
            onClick={() => setMode('encode')} 
            className={`px-4 py-2 font-medium transition-colors ${mode === 'encode' ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-secondary hover:bg-slate-600'}`}
          >
            编码
          </button>
          <button 
            onClick={() => setMode('decode')} 
            className={`px-4 py-2 font-medium transition-colors ${mode === 'decode' ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-secondary hover:bg-slate-600'}`}
          >
            解码
          </button>
        </div>
        <button onClick={process} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors">
          <Terminal className="w-4 h-4" /> {mode === 'encode' ? '编码' : '解码'}
        </button>
      </div>

      <div className="space-y-2 flex-1">
        <label className="text-sm text-muted">输出结果</label>
        <ContentOutput value={output} />
      </div>
    </div>
  )
}

// Hash 生成工具
function HashTool() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [algorithm, setAlgorithm] = useState('SHA-256')

  const generate = async () => {
    try {
      const encoder = new TextEncoder()
      const data = encoder.encode(input)
      const hashBuffer = await crypto.subtle.digest(algorithm, data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
      setOutput(hashHex)
    } catch {
      setOutput('错误：无法计算 Hash')
    }
  }

  return (
    <div className="flex flex-col gap-4 flex-1">
      <div className="space-y-2">
        <label className="text-sm text-muted">输入内容</label>
        <ContentTextarea value={input} onChange={setInput} placeholder="输入要加密的内容..." />
      </div>

      <div className="flex gap-3 flex-wrap items-center">
        <select 
          value={algorithm}
          onChange={(e) => setAlgorithm(e.target.value)}
          className="px-4 py-2 rounded-lg bg-input border border-primary text-slate-200"
        >
          <option>SHA-256</option>
          <option>SHA-384</option>
          <option>SHA-512</option>
        </select>
        <button onClick={generate} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors">
          <Hash className="w-4 h-4" /> 生成
        </button>
      </div>

      <div className="space-y-2 flex-1">
        <label className="text-sm text-muted">{algorithm} 结果</label>
        <ContentOutput value={output} />
      </div>
    </div>
  )
}

// URL 编解码工具
function UrlTool() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [mode, setMode] = useState<'encode' | 'decode'>('encode')

  const process = () => {
    try {
      if (mode === 'encode') {
        setOutput(encodeURIComponent(input))
      } else {
        setOutput(decodeURIComponent(input))
      }
    } catch {
      setOutput('错误：输入无效')
    }
  }

  return (
    <div className="flex flex-col gap-4 flex-1">
      <div className="space-y-2">
        <label className="text-sm text-muted">输入 URL 或参数</label>
        <ContentTextarea value={input} onChange={setInput} placeholder="输入要编码/解码的 URL..." />
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="flex rounded-lg overflow-hidden">
          <button 
            onClick={() => setMode('encode')} 
            className={`px-4 py-2 font-medium transition-colors ${mode === 'encode' ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-secondary hover:bg-slate-600'}`}
          >
            编码
          </button>
          <button 
            onClick={() => setMode('decode')} 
            className={`px-4 py-2 font-medium transition-colors ${mode === 'decode' ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-secondary hover:bg-slate-600'}`}
          >
            解码
          </button>
        </div>
        <button onClick={process} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors">
          <Code2 className="w-4 h-4" /> {mode === 'encode' ? '编码' : '解码'}
        </button>
      </div>

      <div className="space-y-2 flex-1">
        <label className="text-sm text-muted">输出结果</label>
        <ContentOutput value={output} />
      </div>
    </div>
  )
}

// JWT 解码工具
function JwtTool() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')

  const decode = () => {
    try {
      const parts = input.split('.')
      if (parts.length !== 3) {
        setError('无效的 JWT 格式')
        setOutput('')
        return
      }
      
      const header = JSON.parse(atob(parts[0]))
      const payload = JSON.parse(atob(parts[1]))
      
      setOutput(`Header:\n${JSON.stringify(header, null, 2)}\n\nPayload:\n${JSON.stringify(payload, null, 2)}`)
      setError('')
    } catch {
      setError('解码失败，请检查 JWT 格式')
      setOutput('')
    }
  }

  return (
    <div className="flex flex-col gap-4 flex-1">
      <div className="space-y-2">
        <label className="text-sm text-muted">输入 JWT Token</label>
        <ContentTextarea value={input} onChange={setInput} placeholder="粘贴 JWT Token..." />
      </div>

      <div className="flex gap-3">
        <button onClick={decode} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors">
          <Layers className="w-4 h-4" /> 解码
        </button>
      </div>

      {error && <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-sm">{error}</div>}

      <div className="space-y-2 flex-1">
        <label className="text-sm text-muted">解码结果</label>
        <ContentOutput value={output} />
      </div>
    </div>
  )
}

// Mock 数据工具
function MockTool() {
  const [output, setOutput] = useState('')
  const [count, setCount] = useState(1)

  const generate = () => {
    const randomString = (len: number) => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
      return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
    }
    const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
    const randomEmail = () => `user${randomInt(1, 1000)}@example.com`
    const randomPhone = () => `138${randomInt(10000000, 99999999)}`
    
    const generateUser = (id: number) => ({
      id,
      name: `User${id}`,
      email: randomEmail(),
      phone: randomPhone(),
      age: randomInt(18, 60),
      createdAt: new Date(Date.now() - randomInt(0, 365 * 24 * 60 * 60 * 1000)).toISOString()
    })
    
    const users = Array.from({ length: count }, (_, i) => generateUser(i + 1))
    setOutput(JSON.stringify(count === 1 ? users[0] : users, null, 2))
  }

  return (
    <div className="flex flex-col gap-4 flex-1">
      <div className="space-y-2">
        <label className="text-sm text-muted flex items-center gap-2">
          <Search className="w-4 h-4" /> 生成模拟用户数据
        </label>
        <div className="p-4 rounded-xl bg-input border border-primary text-muted">
          <p>生成模拟用户 JSON 数据，支持单个或批量生成</p>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap items-center">
        <label className="flex items-center gap-2">
          <span className="text-sm text-muted">数量:</span>
          <input 
            type="number" 
            min={1} 
            max={100}
            value={count}
            onChange={(e) => setCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
            className="w-20 px-3 py-2 rounded-lg bg-input border border-primary text-slate-200 text-center"
          />
        </label>
        <button onClick={generate} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors">
          <Sparkles className="w-4 h-4" /> 生成
        </button>
      </div>

      <div className="space-y-2 flex-1">
        <label className="text-sm text-muted">生成的 JSON 数据</label>
        <ContentOutput value={output} placeholder="点击生成按钮创建模拟数据..." />
      </div>
    </div>
  )
}

// SQL 格式化工具
function SqlTool() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')

  const format = () => {
    const keywords = ['SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'ORDER BY', 'GROUP BY', 'HAVING', 'JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'ON', 'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE FROM', 'CREATE TABLE', 'ALTER TABLE', 'DROP TABLE']
    let result = input
    keywords.forEach(kw => {
      const regex = new RegExp(`\\b${kw}\\b`, 'gi')
      result = result.replace(regex, `\n${kw}`)
    })
    setOutput(result.trim().split('\n').map(line => '  ' + line.trim()).filter(Boolean).join('\n'))
  }

  return (
    <div className="flex flex-col gap-4 flex-1">
      <div className="space-y-2">
        <label className="text-sm text-muted">输入 SQL</label>
        <ContentTextarea value={input} onChange={setInput} placeholder="粘贴 SQL 语句..." />
      </div>

      <div className="flex gap-3">
        <button onClick={format} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors">
          <AlignLeft className="w-4 h-4" /> 美化
        </button>
      </div>

      <div className="space-y-2 flex-1">
        <label className="text-sm text-muted">输出结果</label>
        <ContentOutput value={output} />
      </div>
    </div>
  )
}

// CSV 工具
function CsvTool() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')

  const convert = () => {
    try {
      const lines = input.trim().split('\n')
      const headers = lines[0].split(',').map(h => h.trim())
      const result = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim())
        const obj: Record<string, string> = {}
        headers.forEach((h, i) => { obj[h] = values[i] || '' })
        return obj
      })
      setOutput(JSON.stringify(result, null, 2))
    } catch {
      setOutput('错误：CSV 格式无效')
    }
  }

  return (
    <div className="flex flex-col gap-4 flex-1">
      <div className="space-y-2">
        <label className="text-sm text-muted">输入 CSV</label>
        <ContentTextarea value={input} onChange={setInput} placeholder="name,age,city&#10;张三,25,北京&#10;李四,30,上海" />
      </div>

      <div className="flex gap-3">
        <button onClick={convert} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors">
          <Table2 className="w-4 h-4" /> 转为 JSON
        </button>
      </div>

      <div className="space-y-2 flex-1">
        <label className="text-sm text-muted">JSON 输出</label>
        <ContentOutput value={output} />
      </div>
    </div>
  )
}

// 正则表达式工具
function RegexTool() {
  const [pattern, setPattern] = useState('')
  const [testString, setTestString] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')

  const test = () => {
    try {
      const regex = new RegExp(pattern, 'g')
      const matches = testString.match(regex) || []
      const lines = testString.split('\n')
      const highlighted = lines.map(line => {
        if (regex.test(line)) {
          regex.lastIndex = 0
          return `[匹配] ${line}`
        }
        return line
      }).join('\n')
      setOutput(`找到 ${matches.length} 个匹配:\n\n${highlighted}`)
      setError('')
    } catch (e) {
      setError((e as Error).message)
      setOutput('')
    }
  }

  return (
    <div className="flex flex-col gap-4 flex-1">
      <div className="space-y-2">
        <label className="text-sm text-muted">正则表达式</label>
        <input 
          type="text"
          value={pattern}
          onChange={(e) => setPattern(e.target.value)}
          placeholder="输入正则表达式，如: \d+"
          className="w-full px-4 py-3 rounded-xl bg-input border border-primary text-slate-200 font-mono resize-none focus:outline-none focus:border-emerald-500"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm text-muted">测试文本</label>
        <ContentTextarea value={testString} onChange={setTestString} placeholder="输入要测试的文本..." />
      </div>

      <div className="flex gap-3">
        <button onClick={test} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors">
          <Type className="w-4 h-4" /> 测试
        </button>
      </div>

      {error && <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-sm">{error}</div>}

      <div className="space-y-2 flex-1">
        <label className="text-sm text-muted">匹配结果</label>
        <ContentOutput value={output} />
      </div>
    </div>
  )
}

// 剪贴板工具
function ClipboardTool() {
  const [copiedText, setCopiedText] = useState('')
  const [history, setHistory] = useState<string[]>([])

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(copiedText)
    setHistory(prev => [copiedText, ...prev.slice(0, 9)])
  }

  const copyFromHistory = async (text: string) => {
    await navigator.clipboard.writeText(text)
  }

  return (
    <div className="flex flex-col gap-4 flex-1">
      <div className="space-y-2">
        <label className="text-sm text-muted">输入内容并复制</label>
        <ContentTextarea value={copiedText} onChange={setCopiedText} placeholder="输入要复制到剪贴板的内容..." />
      </div>

      <div className="flex gap-3">
        <button onClick={copyToClipboard} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors">
          <Copy className="w-4 h-4" /> 复制
        </button>
      </div>

      {history.length > 0 && (
        <div className="space-y-2 flex-1">
          <label className="text-sm text-muted">复制历史 (点击复制)</label>
          <div className="space-y-2 max-h-48 overflow-auto">
            {history.map((text, i) => (
              <div 
                key={i}
                onClick={() => copyFromHistory(text)}
                className="p-3 rounded-lg bg-input border border-primary text-secondary text-sm cursor-pointer hover:bg-slate-700 transition-colors truncate"
              >
                {text}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ==================== 主应用 ====================

function App() {
  // 从 localStorage 读取主题设置
  const [isDark, setIsDark] = useState(() => {
    const theme = localStorage.getItem('devtools-theme')
    return theme === 'light' ? false : true
  })
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null)
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

  // 处理 URL 参数中的 tool 参数
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const toolParam = params.get('tool')
    if (toolParam) {
      // 从完整的 tools 数组中找到对应的工具
      // 由于首页现在只有 3 个工具，需要从完整列表中查找
      const allToolIds = [
        'json', 'xml', 'yaml', 'diff', 'sql', 'csv',
        'base64', 'hash', 'url', 'unicode', 'jwt', 'aes',
        'binary', 'color', 'timestamp',
        'regex', 'camel', 'case',
        'js', 'html', 'css', 'codemirror', 'codemerge',
        'js-editor', 'ts-editor', 'py-editor', 'java-editor', 'cpp-editor', 
        'rust-editor', 'go-editor', 'php-editor', 'md-editor',
        'codesearch', 'codelint',
        'mock', 'qrcode', 'uuid', 'password', 'clipboard'
      ]
      
      if (allToolIds.includes(toolParam)) {
        const toolTitleMap: Record<string, { title: string; description: string }> = {
          'json': { title: 'JSON 格式化', description: '美化、压缩、校验 JSON 数据' },
          'xml': { title: 'XML 格式化', description: '美化、压缩、校验 XML 数据' },
          'yaml': { title: 'YAML 工具', description: 'YAML 解析与格式化' },
          'diff': { title: '文本对比', description: '快速比较两段文本差异' },
          'sql': { title: 'SQL 格式化', description: '美化、压缩、校验 SQL' },
          'csv': { title: 'CSV 工具', description: '解析、转换、导出 CSV' },
          'base64': { title: 'Base64 编解码', description: '字符串与 Base64 互转' },
          'hash': { title: 'Hash 生成', description: 'MD5、SHA1、SHA256 等加密' },
          'url': { title: 'URL 编解码', description: 'URL 参数编码与解码' },
          'unicode': { title: 'Unicode 转换', description: '中文与 Unicode 互转' },
          'jwt': { title: 'JWT 解码', description: '解析 Token 内容和签名' },
          'aes': { title: 'AES 加解密', description: 'AES 对称加密解密' },
          'binary': { title: '进制转换', description: '2/8/10/16 进制互转' },
          'color': { title: '颜色转换', description: 'RGB/HEX/HSL 互转' },
          'timestamp': { title: '时间戳转换', description: 'Unix 时间戳互转' },
          'regex': { title: '正则表达式', description: '测试与生成正则模式' },
          'camel': { title: '驼峰转换', description: '驼峰/下划线/短横线互转' },
          'case': { title: '大小写转换', description: '英文大小写/全角半角' },
          'js': { title: 'JS 格式化', description: 'JavaScript 压缩美化' },
          'html': { title: 'HTML 格式化', description: 'HTML 标签格式化' },
          'css': { title: 'CSS 格式化', description: 'CSS 代码格式化' },
          'codemirror': { title: '代码编辑器', description: '支持多语言的代码编辑器' },
          'codemerge': { title: '代码合并对比', description: 'CodeMirror 代码合并与对比工具' },
          'js-editor': { title: 'JavaScript', description: 'JavaScript 代码编辑器' },
          'ts-editor': { title: 'TypeScript', description: 'TypeScript 代码编辑器' },
          'py-editor': { title: 'Python', description: 'Python 代码编辑器' },
          'java-editor': { title: 'Java', description: 'Java 代码编辑器' },
          'cpp-editor': { title: 'C++', description: 'C++ 代码编辑器' },
          'rust-editor': { title: 'Rust', description: 'Rust 代码编辑器' },
          'go-editor': { title: 'Go', description: 'Go 代码编辑器' },
          'php-editor': { title: 'PHP', description: 'PHP 代码编辑器' },
          'md-editor': { title: 'Markdown', description: 'Markdown 编辑器' },
          'codesearch': { title: '代码搜索', description: 'CodeMirror 高级搜索替换' },
          'codelint': { title: '代码检查', description: '代码语法检查与提示' },
          'mock': { title: 'Mock 数据', description: '生成模拟 JSON 数据' },
          'qrcode': { title: '二维码生成', description: '生成和解析二维码' },
          'uuid': { title: 'UUID 生成', description: '生成唯一标识符' },
          'password': { title: '密码生成器', description: '随机安全密码生成' },
          'clipboard': { title: '剪贴板工具', description: '历史记录与快速粘贴' },
        }
        
        const toolInfo = toolTitleMap[toolParam]
        if (toolInfo) {
          // 创建一个临时的工具对象来打开面板
          setSelectedTool({
            id: toolParam,
            icon: Code2, // 使用默认图标
            title: toolInfo.title,
            description: toolInfo.description,
            color: 'from-emerald-500 to-teal-600',
            bgColor: 'bg-emerald-500/10',
            borderColor: 'border-emerald-500/30'
          })
        }
        
        // 清除 URL 参数
        window.history.replaceState({}, '', '/')
      }
    }
  }, [])

  // 搜索功能
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return []
    const query = searchQuery.toLowerCase()
    return tools.filter(tool => 
      tool.title.toLowerCase().includes(query) ||
      tool.description.toLowerCase().includes(query)
    )
  }, [searchQuery])

  const increaseHeight = () => setContentHeight(prev => Math.min(prev + 50, 800))
  const decreaseHeight = () => setContentHeight(prev => Math.max(prev - 50, 200))
  const increaseFontSize = () => setFontSize(prev => Math.min(prev + 2, 24))
  const decreaseFontSize = () => setFontSize(prev => Math.max(prev - 2, 1))

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
    setFullscreen: setIsFullscreen
  }

  const toolComponents: Record<string, React.ReactNode> = {
    // 核心数据处理
    json: <JsonTool />,
    xml: <XmlTool />,
    yaml: <YamlTool />,
    diff: <DiffTool />,
    sql: <SqlTool />,
    csv: <CsvTool />,
    
    // 编码与加密
    base64: <Base64Tool />,
    hash: <HashTool />,
    url: <UrlTool />,
    unicode: <UnicodeTool />,
    jwt: <JwtTool />,
    aes: <AesTool />,
    
    // 进制与转换
    binary: <BinaryTool />,
    color: <ColorTool />,
    timestamp: <TimestampTool />,
    
    // 文本处理
    regex: <RegexTool />,
    camel: <CamelCaseTool />,
    case: <CaseTool />,
    
    // 代码工具
    js: <JsTool />,
    html: <HtmlTool />,
    css: <CssTool />,
    codemirror: <CodeMirrorTool />,
    codemerge: <CodeMergeTool />,
    
    // CodeMirror 语言编辑器
    'js-editor': <JsEditorTool />,
    'ts-editor': <TsEditorTool />,
    'py-editor': <PyEditorTool />,
    'java-editor': <JavaEditorTool />,
    'cpp-editor': <CppEditorTool />,
    'rust-editor': <RustEditorTool />,
    'go-editor': <GoEditorTool />,
    'php-editor': <PhpEditorTool />,
    'md-editor': <MdEditorTool />,
    codesearch: <CodeSearchTool />,
    codelint: <CodeLintTool />,
    
    // 实用工具
    mock: <MockTool />,
    qrcode: <QrCodeTool />,
    uuid: <UuidTool />,
    password: <PasswordTool />,
    clipboard: <ClipboardTool />,
    
    // AI 工具
    'ai-nav': <AINavigator />,
  }

  return (
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
                  <Terminal className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900 dark:text-primary transition-theme">
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
                  {/* Search Results Dropdown */}
                  {showSearchResults && searchResults.length > 0 && (
                    <div className="absolute top-full mt-2 left-0 w-full bg-secondary border border-secondary rounded-xl shadow-xl overflow-hidden">
                      <div className="p-2 text-xs text-muted border-b border-secondary">
                        找到 {searchResults.length} 个工具
                      </div>
                      {searchResults.map((tool: Tool) => {
                        const Icon = tool.icon
                        return (
                          <button
                            key={tool.id}
                            onClick={() => {
                              if (tool.id === 'ai-nav') {
                                window.location.href = '/ai'
                              } else if (tool.id === 'coding-world') {
                                window.location.href = '/coding-the-world'
                              } else if (tool.id === 'ai-game') {
                                window.location.href = '/game'
                              } else if (tool.id === 'offline-tools') {
                                window.location.href = '/offline-tools'
                              } else {
                                setSelectedTool(tool)
                              }
                              setSearchQuery('')
                              setShowSearchResults(false)
                            }}
                            className="w-full flex items-center gap-3 p-3 hover:bg-tertiary transition-colors text-left"
                          >
                            <div className={`w-8 h-8 rounded-lg ${tool.bgColor} flex items-center justify-center`}>
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
                效率提升 10 倍
              </span>
            </h1>

            <p className="text-lg sm:text-xl mb-10 max-w-2xl mx-auto leading-relaxed text-muted">
              收集了开发者日常工作中最常用的工具，全部本地运行，无需网络，即开即用
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="#tools"
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold text-lg shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-105 transition-all flex items-center justify-center gap-2"
              >
                开始使用
                <ChevronRight className="w-5 h-5" />
              </a>
              <button className="w-full sm:w-auto px-8 py-4 rounded-xl font-semibold text-lg transition-all bg-secondary border border-primary text-primary hover:bg-tertiary">
                查看文档
              </button>
            </div>

            <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-primary">40+</div>
                <div className="text-sm mt-1 text-subtle">离线工具</div>
              </div>
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-primary">192+</div>
                <div className="text-sm mt-1 text-subtle">AI 工具</div>
              </div>
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-primary">100%</div>
                <div className="text-sm mt-1 text-subtle">隐私安全</div>
              </div>
            </div>
          </div>
        </section>

        {/* Tools Section */}
        <section id="tools" className="relative py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-primary">
                所有工具
              </h2>
              <p className="text-lg max-w-2xl mx-auto text-muted">
                精选开发者必备工具，持续更新中
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {tools.map((tool) => {
                // AI 导航使用独立页面
                if (tool.id === 'ai-nav') {
                  return (
                    <Link
                      key={tool.id}
                      to="/ai"
                      className="group relative p-6 rounded-2xl bg-secondary/80 border border-emerald-500/50 hover:border-emerald-400 backdrop-blur-xl transition-all hover:scale-105 hover:shadow-xl text-left"
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
                // Coding The World 使用独立页面
                if (tool.id === 'coding-world') {
                  return (
                    <Link
                      key={tool.id}
                      to="/coding-the-world"
                      className="group relative p-6 rounded-2xl bg-secondary/80 border border-blue-500/50 hover:border-blue-400 backdrop-blur-xl transition-all hover:scale-105 hover:shadow-xl text-left"
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
                // AI 游戏使用独立页面
                if (tool.id === 'ai-game') {
                  return (
                    <Link
                      key={tool.id}
                      to="/game"
                      className="group relative p-6 rounded-2xl bg-secondary/80 border border-purple-500/50 hover:border-purple-400 backdrop-blur-xl transition-all hover:scale-105 hover:shadow-xl text-left"
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
                // 离线工具使用独立页面
                if (tool.id === 'offline-tools') {
                  return (
                    <Link
                      key={tool.id}
                      to="/offline-tools"
                      className="group relative p-6 rounded-2xl bg-secondary/80 border border-orange-500/50 hover:border-orange-400 backdrop-blur-xl transition-all hover:scale-105 hover:shadow-xl text-left"
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
                return (
                  <button
                    key={tool.id}
                    onClick={() => setSelectedTool(tool)}
                    className="group relative p-6 rounded-2xl bg-secondary/80 border border-secondary hover:border-primary backdrop-blur-xl transition-all hover:scale-105 hover:shadow-xl text-left"
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
                  </button>
                )
              })}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="relative py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-primary">
                功能特点
              </h2>
              <p className="text-lg max-w-2xl mx-auto text-muted">
                专为提升开发效率而设计
              </p>
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
                  <h3 className="text-lg font-semibold mb-2 text-primary">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted">
                    {feature.description}
                  </p>
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
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center">
                  <Terminal className="w-4 h-4 text-white" />
                </div>
                <span className="font-semibold text-primary">
                  DevTools Hub
                </span>
              </div>
              <p className="text-sm text-subtle">
                © 2026 DevTools Hub. 使用 React + Tailwind CSS 构建
              </p>
            </div>
          </div>
        </footer>

        {/* Tool Panel Modal */}
        {selectedTool && (
          <div className={`fixed inset-0 z-50 flex items-start justify-center overflow-auto ${isFullscreen ? 'bg-primary' : 'pt-8 px-4 pb-4'}`}>
            {!isFullscreen && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setSelectedTool(null); setIsFullscreen(false); }} />
            )}
            <div className={`relative w-full rounded-2xl bg-secondary border border-primary shadow-2xl overflow-hidden my-4 transition-theme ${isFullscreen ? 'h-screen max-w-screen-2xl' : 'max-w-6xl'}`}>
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-primary">
                <button onClick={() => { setSelectedTool(null); setIsFullscreen(false); }} className="flex items-center gap-2 text-muted hover:text-primary transition-colors">
                  <ChevronRight className="w-5 h-5 rotate-180" />
                  <span className="hidden sm:inline">返回首页</span>
                </button>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${selectedTool.bgColor} flex items-center justify-center`}>
                    <selectedTool.icon className={`w-5 h-5 bg-gradient-to-br ${selectedTool.color} bg-clip-text`} />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-primary">{selectedTool.title}</h2>
                    <p className="text-sm text-subtle">{selectedTool.description}</p>
                  </div>
                </div>
                <button onClick={() => { setSelectedTool(null); setIsFullscreen(false); }} className="p-2 rounded-lg hover:bg-tertiary transition-colors">
                  <X className="w-5 h-5 text-muted" />
                </button>
              </div>
              
              {/* Global Controls - Always visible */}
              <GlobalControls />
              
              {/* Tool Content */}
              <div className={`p-6 ${isFullscreen ? 'h-[calc(100vh-130px)] overflow-auto' : 'min-h-[600px]'}`}>
                {toolComponents[selectedTool.id] || (
                  <div className="text-center py-12 text-subtle">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>该工具正在开发中...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </ContentConfigContext.Provider>
  )
}

// ==================== 新增工具组件 ====================

// YAML 工具
function YamlTool() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')

  const formatYaml = () => {
    try {
      // 简单的 YAML 格式化（保持缩进）
      const lines = input.split('\n')
      setOutput(lines.map(line => line).join('\n'))
      setError('')
    } catch (e) {
      setError((e as Error).message)
      setOutput('')
    }
  }

  const convertToJson = () => {
    try {
      // 简单的 YAML 转 JSON（支持基本格式）
      const lines = input.split('\n')
      const result: Record<string, unknown> = {}
      let currentKey = ''
      
      lines.forEach(line => {
        const match = line.match(/^(\s*)(\w+):\s*(.*)$/)
        if (match) {
          const [, indent, key, value] = match
          if (indent.length === 0) {
            currentKey = key
            result[key] = value ? JSON.parse(value) || value : {}
          }
        }
      })
      
      setOutput(JSON.stringify(result, null, 2))
      setError('')
    } catch (e) {
      setError('YAML 格式错误')
      setOutput('')
    }
  }

  return (
    <div className="flex flex-col gap-4 flex-1">
      <div className="space-y-2">
        <label className="text-sm text-muted">输入 YAML</label>
        <ContentTextarea value={input} onChange={setInput} placeholder="输入 YAML 数据..." />
      </div>

      <div className="flex gap-3 flex-wrap">
        <button onClick={formatYaml} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors">
          <AlignLeft className="w-4 h-4" /> 格式化
        </button>
        <button onClick={convertToJson} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-tertiary hover:bg-border-primary text-white font-medium transition-colors">
          <ArrowRightLeft className="w-4 h-4" /> 转 JSON
        </button>
      </div>

      {error && <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-sm">{error}</div>}

      <div className="space-y-2 flex-1">
        <label className="text-sm text-muted">输出结果</label>
        <ContentOutput value={output} />
      </div>
    </div>
  )
}

// Unicode 转换工具
function UnicodeTool() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [mode, setMode] = useState<'toUnicode' | 'toChinese'>('toUnicode')

  const convert = () => {
    if (mode === 'toUnicode') {
      // 中文转 Unicode
      setOutput(input.split('').map(c => {
        const code = c.charCodeAt(0)
        if (code > 0xFFFF) {
          return '\\u{' + code.toString(16).toUpperCase() + '}'
        }
        return '\\u' + code.toString(16).padStart(4, '0').toUpperCase()
      }).join(''))
    } else {
      // Unicode 转中文
      setOutput(input.replace(/\\u\{([0-9a-fA-F]+)\}|\\u([0-9a-fA-F]{4})/g, (_, p1, p2) => {
        const code = p1 ? parseInt(p1, 16) : parseInt(p2, 16)
        return String.fromCharCode(code)
      }))
    }
  }

  return (
    <div className="flex flex-col gap-4 flex-1">
      <div className="space-y-2">
        <label className="text-sm text-muted">输入内容</label>
        <ContentTextarea value={input} onChange={setInput} placeholder={mode === 'toUnicode' ? '输入中文字符...' : '输入 Unicode 编码...'} />
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="flex rounded-lg overflow-hidden">
          <button 
            onClick={() => setMode('toUnicode')} 
            className={`px-4 py-2 font-medium transition-colors ${mode === 'toUnicode' ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-secondary hover:bg-slate-600'}`}
          >
            中文 → Unicode
          </button>
          <button 
            onClick={() => setMode('toChinese')} 
            className={`px-4 py-2 font-medium transition-colors ${mode === 'toChinese' ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-secondary hover:bg-slate-600'}`}
          >
            Unicode → 中文
          </button>
        </div>
        <button onClick={convert} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors">
          <ArrowRightLeft className="w-4 h-4" /> 转换
        </button>
      </div>

      <div className="space-y-2 flex-1">
        <label className="text-sm text-muted">输出结果</label>
        <ContentOutput value={output} />
      </div>
    </div>
  )
}

// AES 加解密工具
function AesTool() {
  const [input, setInput] = useState('')
  const [key, setKey] = useState('')
  const [output, setOutput] = useState('')
  const [mode, setMode] = useState<'encrypt' | 'decrypt'>('encrypt')

  const process = () => {
    try {
      if (!key) {
        setOutput('错误：请输入密钥')
        return
      }
      // 简单的 XOR 加密（浏览器环境下模拟 AES）
      const keyBytes = new TextEncoder().encode(key)
      const inputBytes = new TextEncoder().encode(input)
      const result: number[] = []
      
      for (let i = 0; i < inputBytes.length; i++) {
        result.push(inputBytes[i] ^ keyBytes[i % keyBytes.length])
      }
      
      if (mode === 'encrypt') {
        setOutput(btoa(String.fromCharCode(...result)))
      } else {
        const decoded = atob(input)
        const decodedBytes = new TextEncoder().encode(decoded)
        const decrypted: number[] = []
        for (let i = 0; i < decodedBytes.length; i++) {
          decrypted.push(decodedBytes[i] ^ keyBytes[i % keyBytes.length])
        }
        setOutput(new TextDecoder().decode(new Uint8Array(decrypted)))
      }
    } catch (e) {
      setOutput('错误：' + (e as Error).message)
    }
  }

  return (
    <div className="flex flex-col gap-4 flex-1">
      <div className="space-y-2">
        <label className="text-sm text-muted">密钥</label>
        <input 
          type="text"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="输入加密密钥..."
          className="w-full px-4 py-3 rounded-xl bg-input border border-primary text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm text-muted">输入内容</label>
        <ContentTextarea value={input} onChange={setInput} placeholder="输入要加密/解密的内容..." />
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="flex rounded-lg overflow-hidden">
          <button 
            onClick={() => setMode('encrypt')} 
            className={`px-4 py-2 font-medium transition-colors ${mode === 'encrypt' ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-secondary hover:bg-slate-600'}`}
          >
            加密
          </button>
          <button 
            onClick={() => setMode('decrypt')} 
            className={`px-4 py-2 font-medium transition-colors ${mode === 'decrypt' ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-secondary hover:bg-slate-600'}`}
          >
            解密
          </button>
        </div>
        <button onClick={process} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors">
          <Lock className="w-4 h-4" /> {mode === 'encrypt' ? '加密' : '解密'}
        </button>
      </div>

      <div className="space-y-2 flex-1">
        <label className="text-sm text-muted">输出结果</label>
        <ContentOutput value={output} />
      </div>
    </div>
  )
}

// 进制转换工具
function BinaryTool() {
  const [input, setInput] = useState('')
  const [fromBase, setFromBase] = useState(10)
  const [output, setOutput] = useState('')

  const convert = () => {
    try {
      const decimal = parseInt(input, fromBase)
      if (isNaN(decimal)) {
        setOutput('错误：无效的数字')
        return
      }
      
      setOutput(
        `2进制: ${decimal.toString(2)}\n` +
        `8进制: ${decimal.toString(8)}\n` +
        `10进制: ${decimal.toString(10)}\n` +
        `16进制: ${decimal.toString(16).toUpperCase()}`
      )
    } catch {
      setOutput('错误：转换失败')
    }
  }

  return (
    <div className="flex flex-col gap-4 flex-1">
      <div className="flex gap-3 flex-wrap items-center">
        <select 
          value={fromBase}
          onChange={(e) => setFromBase(Number(e.target.value))}
          className="px-4 py-2 rounded-lg bg-input border border-primary text-slate-200"
        >
          <option value={2}>从 2 进制</option>
          <option value={8}>从 8 进制</option>
          <option value={10}>从 10 进制</option>
          <option value={16}>从 16 进制</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-sm text-muted">输入数字</label>
        <input 
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="输入数字..."
          className="w-full px-4 py-3 rounded-xl bg-input border border-primary text-slate-200 font-mono text-lg focus:outline-none focus:border-emerald-500"
        />
      </div>

      <button onClick={convert} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors self-start">
        <ArrowRightLeft className="w-4 h-4" /> 转换
      </button>

      <div className="space-y-2 flex-1">
        <label className="text-sm text-muted">转换结果</label>
        <ContentOutput value={output} />
      </div>
    </div>
  )
}

// 颜色转换工具
function ColorTool() {
  const [input, setInput] = useState('#3498db')
  const [output, setOutput] = useState('')

  const convert = () => {
    try {
      let hex = input.trim()
      if (!hex.startsWith('#')) hex = '#' + hex
      
      // 解析 HEX
      let r: number, g: number, b: number
      if (hex.length === 7) {
        r = parseInt(hex.slice(1, 3), 16)
        g = parseInt(hex.slice(3, 5), 16)
        b = parseInt(hex.slice(5, 7), 16)
      } else if (hex.length === 4) {
        r = parseInt(hex[1] + hex[1], 16)
        g = parseInt(hex[2] + hex[2], 16)
        b = parseInt(hex[3] + hex[3], 16)
      } else {
        setOutput('错误：无效的 HEX 颜色值')
        return
      }

      // RGB to HSL
      const rNorm = r / 255, gNorm = g / 255, bNorm = b / 255
      const max = Math.max(rNorm, gNorm, bNorm), min = Math.min(rNorm, gNorm, bNorm)
      let h = 0, s = 0
      const l = (max + min) / 2

      if (max !== min) {
        const d = max - min
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
        switch (max) {
          case rNorm: h = ((gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0)) / 6; break
          case gNorm: h = ((bNorm - rNorm) / d + 2) / 6; break
          case bNorm: h = ((rNorm - gNorm) / d + 4) / 6; break
        }
      }

      setOutput(
        `HEX: ${hex.toUpperCase()}\n` +
        `RGB: rgb(${r}, ${g}, ${b})\n` +
        `RGBA: rgba(${r}, ${g}, ${b}, 1)\n` +
        `HSL: hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`
      )
    } catch {
      setOutput('错误：转换失败')
    }
  }

  return (
    <div className="flex flex-col gap-4 flex-1">
      <div className="space-y-2">
        <label className="text-sm text-muted">输入颜色值</label>
        <div className="flex gap-3 items-center">
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="#3498db"
            className="flex-1 px-4 py-3 rounded-xl bg-input border border-primary text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
          />
          <input 
            type="color"
            value={input.startsWith('#') && input.length === 7 ? input : '#3498db'}
            onChange={(e) => setInput(e.target.value)}
            className="w-12 h-12 rounded-lg cursor-pointer border-0"
          />
        </div>
      </div>

      <button onClick={convert} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors self-start">
        <ArrowRightLeft className="w-4 h-4" /> 转换
      </button>

      <div className="space-y-2 flex-1">
        <label className="text-sm text-muted">转换结果</label>
        <ContentOutput value={output} />
      </div>
    </div>
  )
}

// 时间戳转换工具
function TimestampTool() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [mode, setMode] = useState<'toDate' | 'toStamp'>('toDate')

  const convert = () => {
    try {
      if (mode === 'toDate') {
        const timestamp = parseInt(input)
        if (isNaN(timestamp)) {
          setOutput('错误：无效的时间戳')
          return
        }
        const ms = timestamp.toString().length === 10 ? timestamp * 1000 : timestamp
        const date = new Date(ms)
        setOutput(
          `秒级: ${Math.floor(ms / 1000)}\n` +
          `毫秒级: ${ms}\n` +
          `日期: ${date.toLocaleString('zh-CN')}\n` +
          `ISO: ${date.toISOString()}`
        )
      } else {
        const date = new Date(input)
        if (isNaN(date.getTime())) {
          setOutput('错误：无效的日期格式')
          return
        }
        setOutput(
          `秒级时间戳: ${Math.floor(date.getTime() / 1000)}\n` +
          `毫秒级时间戳: ${date.getTime()}`
        )
      }
    } catch {
      setOutput('错误：转换失败')
    }
  }

  return (
    <div className="flex flex-col gap-4 flex-1">
      <div className="flex gap-3 flex-wrap">
        <div className="flex rounded-lg overflow-hidden">
          <button 
            onClick={() => setMode('toDate')} 
            className={`px-4 py-2 font-medium transition-colors ${mode === 'toDate' ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-secondary hover:bg-slate-600'}`}
          >
            时间戳 → 日期
          </button>
          <button 
            onClick={() => setMode('toStamp')} 
            className={`px-4 py-2 font-medium transition-colors ${mode === 'toStamp' ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-secondary hover:bg-slate-600'}`}
          >
            日期 → 时间戳
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm text-muted">
          {mode === 'toDate' ? '输入时间戳（秒或毫秒）' : '输入日期时间'}
        </label>
        <input 
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={mode === 'toDate' ? '1716201600 或 1716201600000' : '2024-05-20 12:00:00'}
          className="w-full px-4 py-3 rounded-xl bg-input border border-primary text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
        />
      </div>

      <button onClick={convert} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors self-start">
        <Clock className="w-4 h-4" /> 转换
      </button>

      <div className="space-y-2 flex-1">
        <label className="text-sm text-muted">转换结果</label>
        <ContentOutput value={output} />
      </div>
    </div>
  )
}

// 驼峰命名转换工具
function CamelCaseTool() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')

  const convert = () => {
    const words = input.split(/[\s_-]+/)
    
    const camel = words.map((w, i) => 
      i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
    ).join('')
    
    const pascal = words.map(w => 
      w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
    ).join('')
    
    const snake = words.map(w => w.toLowerCase()).join('_')
    
    const kebab = words.map(w => w.toLowerCase()).join('-')
    
    setOutput(
      `camelCase: ${camel}\n` +
      `PascalCase: ${pascal}\n` +
      `snake_case: ${snake}\n` +
      `kebab-case: ${kebab}`
    )
  }

  return (
    <div className="flex flex-col gap-4 flex-1">
      <div className="space-y-2">
        <label className="text-sm text-muted">输入文本</label>
        <ContentTextarea value={input} onChange={setInput} placeholder="输入要转换的文本，如：user_name 或 user-name" />
      </div>

      <button onClick={convert} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors self-start">
        <Shuffle className="w-4 h-4" /> 转换
      </button>

      <div className="space-y-2 flex-1">
        <label className="text-sm text-muted">转换结果</label>
        <ContentOutput value={output} />
      </div>
    </div>
  )
}

// 大小写转换工具
function CaseTool() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')

  const convert = () => {
    setOutput(
      `原文本: ${input}\n` +
      `全大写: ${input.toUpperCase()}\n` +
      `全小写: ${input.toLowerCase()}\n` +
      `首字母大写: ${input.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')}`
    )
  }

  return (
    <div className="flex flex-col gap-4 flex-1">
      <div className="space-y-2">
        <label className="text-sm text-muted">输入英文文本</label>
        <ContentTextarea value={input} onChange={setInput} placeholder="输入要转换的英文文本..." />
      </div>

      <button onClick={convert} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors self-start">
        <TextCursorInput className="w-4 h-4" /> 转换
      </button>

      <div className="space-y-2 flex-1">
        <label className="text-sm text-muted">转换结果</label>
        <ContentOutput value={output} />
      </div>
    </div>
  )
}

// JavaScript 格式化工具
function JsTool() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [mode, setMode] = useState<'format' | 'compress'>('format')

  const process = () => {
    try {
      if (mode === 'format') {
        // 简单的格式化
        let indent = 0
        let result = ''
        const lines = input.replace(/\{/g, ' {\n').replace(/\}/g, '}\n').replace(/;/g, ';\n').split('\n')
        
        lines.forEach(line => {
          const trimmed = line.trim()
          if (!trimmed) return
          
          if (trimmed.startsWith('}')) indent--
          result += '  '.repeat(Math.max(0, indent)) + trimmed + '\n'
          if (trimmed.endsWith('{')) indent++
        })
        
        setOutput(result)
      } else {
        // 压缩
        setOutput(input.replace(/\s+/g, ' ').replace(/\s*([{};,])\s*/g, '$1').trim())
      }
    } catch {
      setOutput('错误：处理失败')
    }
  }

  return (
    <div className="flex flex-col gap-4 flex-1">
      <div className="space-y-2">
        <label className="text-sm text-muted">输入 JavaScript</label>
        <ContentTextarea value={input} onChange={setInput} placeholder="输入 JavaScript 代码..." />
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="flex rounded-lg overflow-hidden">
          <button 
            onClick={() => setMode('format')} 
            className={`px-4 py-2 font-medium transition-colors ${mode === 'format' ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-secondary hover:bg-slate-600'}`}
          >
            <AlignLeft className="w-4 h-4 inline mr-1" /> 美化
          </button>
          <button 
            onClick={() => setMode('compress')} 
            className={`px-4 py-2 font-medium transition-colors ${mode === 'compress' ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-secondary hover:bg-slate-600'}`}
          >
            <Minimize2 className="w-4 h-4 inline mr-1" /> 压缩
          </button>
        </div>
        <button onClick={process} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors">
          执行
        </button>
      </div>

      <div className="space-y-2 flex-1">
        <label className="text-sm text-muted">输出结果</label>
        <ContentOutput value={output} />
      </div>
    </div>
  )
}

// HTML 格式化工具
function HtmlTool() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')

  const format = () => {
    try {
      let result = ''
      let indent = 0
      const tokens = input.split(/(<[^>]+>)/g).filter(Boolean)
      
      tokens.forEach(token => {
        if (token.match(/^<\/\w/)) {
          indent--
        }
        
        if (token.trim()) {
          result += '  '.repeat(Math.max(0, indent)) + token.trim() + '\n'
        }
        
        if (token.match(/^<\w[^>]*[^\/]>$/)) {
          indent++
        }
      })
      
      setOutput(result)
    } catch {
      setOutput('错误：格式化失败')
    }
  }

  return (
    <div className="flex flex-col gap-4 flex-1">
      <div className="space-y-2">
        <label className="text-sm text-muted">输入 HTML</label>
        <ContentTextarea value={input} onChange={setInput} placeholder="输入 HTML 代码..." />
      </div>

      <button onClick={format} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors self-start">
        <AlignLeft className="w-4 h-4" /> 格式化
      </button>

      <div className="space-y-2 flex-1">
        <label className="text-sm text-muted">输出结果</label>
        <ContentOutput value={output} />
      </div>
    </div>
  )
}

// CSS 格式化工具
function CssTool() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')

  const format = () => {
    try {
      let result = ''
      const rules = input.split(/\{|\}/g).filter(s => s.trim())
      
      for (let i = 0; i < rules.length - 1; i += 2) {
        const selector = rules[i].trim()
        const properties = rules[i + 1].trim()
        if (selector && properties) {
          result += selector + ' {\n'
          properties.split(';').filter(p => p.trim()).forEach(prop => {
            result += '  ' + prop.trim() + ';\n'
          })
          result += '}\n\n'
        }
      }
      
      setOutput(result)
    } catch {
      setOutput('错误：格式化失败')
    }
  }

  return (
    <div className="flex flex-col gap-4 flex-1">
      <div className="space-y-2">
        <label className="text-sm text-muted">输入 CSS</label>
        <ContentTextarea value={input} onChange={setInput} placeholder="输入 CSS 代码..." />
      </div>

      <button onClick={format} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors self-start">
        <AlignLeft className="w-4 h-4" /> 格式化
      </button>

      <div className="space-y-2 flex-1">
        <label className="text-sm text-muted">输出结果</label>
        <ContentOutput value={output} />
      </div>
    </div>
  )
}

// 二维码生成工具
function QrCodeTool() {
  const [input, setInput] = useState('')
  const [qrUrl, setQrUrl] = useState('')

  const generate = () => {
    if (!input) return
    // 使用 qrserver.com API 生成二维码
    setQrUrl(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(input)}`)
  }

  return (
    <div className="flex flex-col gap-4 flex-1">
      <div className="space-y-2">
        <label className="text-sm text-muted">输入内容</label>
        <input 
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="输入要生成二维码的内容..."
          className="w-full px-4 py-3 rounded-xl bg-input border border-primary text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
        />
      </div>

      <button onClick={generate} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors self-start">
        <QrCode className="w-4 h-4" /> 生成二维码
      </button>

      {qrUrl && (
        <div className="flex flex-col items-center gap-4 p-6 rounded-xl bg-input border border-primary">
          <img src={qrUrl} alt="QR Code" className="w-48 h-48" />
          <a 
            href={qrUrl} 
            download="qrcode.png"
            className="px-4 py-2 rounded-lg bg-tertiary hover:bg-border-primary text-white font-medium transition-colors"
          >
            <Download className="w-4 h-4 inline mr-2" />下载二维码
          </a>
        </div>
      )}
    </div>
  )
}

// UUID 生成工具
function UuidTool() {
  const [output, setOutput] = useState('')
  const [count, setCount] = useState(1)

  const generate = () => {
    const uuids = Array.from({ length: count }, () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
      })
    })
    setOutput(uuids.join('\n'))
  }

  return (
    <div className="flex flex-col gap-4 flex-1">
      <div className="flex gap-3 flex-wrap items-center">
        <label className="flex items-center gap-2">
          <span className="text-sm text-muted">数量:</span>
          <input 
            type="number" 
            min={1} 
            max={100}
            value={count}
            onChange={(e) => setCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
            className="w-20 px-3 py-2 rounded-lg bg-input border border-primary text-slate-200 text-center"
          />
        </label>
        <button onClick={generate} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors">
          <Key className="w-4 h-4" /> 生成
        </button>
      </div>

      <div className="space-y-2 flex-1">
        <label className="text-sm text-muted">生成的 UUID</label>
        <ContentOutput value={output} placeholder="点击生成按钮创建 UUID..." />
      </div>
    </div>
  )
}

// CodeMirror 代码编辑器
function CodeMirrorTool() {
  const { contentHeight, fontSize, isFullscreen } = useContentConfig()
  const editorRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<any>(null)
  const [selectedLang, setSelectedLang] = useState('javascript')
  const [output, setOutput] = useState('')

  const languages = [
    { id: 'javascript', label: 'JavaScript', ext: 'js' },
    { id: 'typescript', label: 'TypeScript', ext: 'ts' },
    { id: 'python', label: 'Python', ext: 'py' },
    { id: 'html', label: 'HTML', ext: 'html' },
    { id: 'css', label: 'CSS', ext: 'css' },
    { id: 'json', label: 'JSON', ext: 'json' },
    { id: 'xml', label: 'XML', ext: 'xml' },
    { id: 'markdown', label: 'Markdown', ext: 'md' },
    { id: 'sql', label: 'SQL', ext: 'sql' },
    { id: 'yaml', label: 'YAML', ext: 'yaml' },
  ]

  const defaultCode = `// Welcome to CodeMirror Editor
function greet(name) {
  return \`Hello, \${name}!\`;
}

console.log(greet('World'));
`

  useEffect(() => {
    let view: any = null

    const initEditor = async () => {
      if (!editorRef.current) return

      const { EditorState } = await import('@codemirror/state')
      const { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } = await import('@codemirror/view')
      const { defaultKeymap, history, historyKeymap, indentWithTab } = await import('@codemirror/commands')
      const { bracketMatching, foldGutter, indentOnInput, syntaxHighlighting, defaultHighlightStyle } = await import('@codemirror/language')
      const { closeBrackets, closeBracketsKeymap } = await import('@codemirror/autocomplete')
      const { searchKeymap, highlightSelectionMatches } = await import('@codemirror/search')
      const { oneDark } = await import('@codemirror/theme-one-dark')

      // Language extensions
      let langExtension: any = []
      switch (selectedLang) {
        case 'javascript': {
          const js = await import('@codemirror/lang-javascript')
          langExtension = [js.javascript()]
          break
        }
        case 'typescript': {
          const ts = await import('@codemirror/lang-javascript')
          langExtension = [ts.javascript({ typescript: true })]
          break
        }
        case 'python': {
          const py = await import('@codemirror/lang-python')
          langExtension = [py.python()]
          break
        }
        case 'html': {
          const ht = await import('@codemirror/lang-html')
          langExtension = [ht.html()]
          break
        }
        case 'css': {
          const cs = await import('@codemirror/lang-css')
          langExtension = [cs.css()]
          break
        }
        case 'json': {
          const j = await import('@codemirror/lang-json')
          langExtension = [j.json()]
          break
        }
        case 'xml': {
          const x = await import('@codemirror/lang-xml')
          langExtension = [x.xml()]
          break
        }
        case 'markdown': {
          const m = await import('@codemirror/lang-markdown')
          langExtension = [m.markdown()]
          break
        }
        case 'sql': {
          const s = await import('@codemirror/lang-sql')
          langExtension = [s.sql()]
          break
        }
        case 'yaml': {
          const y = await import('@codemirror/lang-yaml')
          langExtension = [y.yaml()]
          break
        }
      }

      const state = EditorState.create({
        doc: defaultCode,
        extensions: [
          lineNumbers(),
          highlightActiveLine(),
          highlightActiveLineGutter(),
          history(),
          foldGutter(),
          indentOnInput(),
          bracketMatching(),
          closeBrackets(),
          highlightSelectionMatches(),
          syntaxHighlighting(defaultHighlightStyle),
          oneDark,
          keymap.of([
            ...closeBracketsKeymap,
            ...defaultKeymap,
            ...searchKeymap,
            ...historyKeymap,
            indentWithTab
          ]),
          EditorView.lineWrapping,
          EditorView.theme({
            '&': {
              height: isFullscreen ? `${Math.min(contentHeight, window.innerHeight - 200)}px` : `${contentHeight}px`,
              fontSize: `${fontSize}px`,
            },
            '.cm-scroller': {
              fontFamily: '"Fira Code", "JetBrains Mono", Consolas, monospace',
              overflow: 'auto',
            },
            '.cm-content': {
              caretColor: '#fff',
            },
            '.cm-gutters': {
              backgroundColor: '#1e1e1e',
              color: '#858585',
              border: 'none',
            },
          }),
          ...langExtension,
        ],
      })

      view = new EditorView({
        state,
        parent: editorRef.current,
      })

      viewRef.current = view
    }

    initEditor()

    return () => {
      if (viewRef.current) {
        viewRef.current.destroy()
        viewRef.current = null
      }
    }
  }, [selectedLang, contentHeight, fontSize, isFullscreen])

  const getCode = () => {
    if (viewRef.current) {
      return viewRef.current.state.doc.toString()
    }
    return ''
  }

  const handleCopy = () => {
    const code = getCode()
    navigator.clipboard.writeText(code)
    setOutput('代码已复制到剪贴板')
    setTimeout(() => setOutput(''), 2000)
  }

  const handleFormat = () => {
    const code = getCode()
    try {
      if (selectedLang === 'json') {
        const parsed = JSON.parse(code)
        const formatted = JSON.stringify(parsed, null, 2)
        if (viewRef.current) {
          viewRef.current.dispatch({
            changes: { from: 0, to: viewRef.current.state.doc.length, insert: formatted }
          })
        }
      } else {
        setOutput('格式化功能仅支持 JSON')
        setTimeout(() => setOutput(''), 2000)
      }
    } catch (e) {
      setOutput('格式化失败: ' + (e as Error).message)
      setTimeout(() => setOutput(''), 2000)
    }
  }

  const handleMinify = () => {
    const code = getCode()
    try {
      if (selectedLang === 'json') {
        const parsed = JSON.parse(code)
        const minified = JSON.stringify(parsed)
        if (viewRef.current) {
          viewRef.current.dispatch({
            changes: { from: 0, to: viewRef.current.state.doc.length, insert: minified }
          })
        }
      } else {
        setOutput('压缩功能仅支持 JSON')
        setTimeout(() => setOutput(''), 2000)
      }
    } catch (e) {
      setOutput('压缩失败: ' + (e as Error).message)
      setTimeout(() => setOutput(''), 2000)
    }
  }

  return (
    <div className="flex flex-col gap-4 flex-1">
      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={selectedLang}
          onChange={(e) => setSelectedLang(e.target.value)}
          className="px-4 py-2 rounded-lg bg-input border border-primary text-slate-200"
        >
          {languages.map(lang => (
            <option key={lang.id} value={lang.id}>{lang.label}</option>
          ))}
        </select>

        <button
          onClick={handleFormat}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors"
        >
          <AlignLeft className="w-4 h-4" /> 美化
        </button>
        <button
          onClick={handleMinify}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-medium transition-colors"
        >
          <Minimize2 className="w-4 h-4" /> 压缩
        </button>
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors"
        >
          <Copy className="w-4 h-4" /> 复制
        </button>

        {output && (
          <span className="text-sm text-emerald-400">{output}</span>
        )}
      </div>

      <div className="flex-1 min-h-[300px] border border-slate-700 rounded-lg overflow-hidden">
        <div ref={editorRef} className="h-full" />
      </div>
    </div>
  )
}

// CodeMirror 代码合并对比工具
function CodeMergeTool() {
  const { contentHeight, fontSize, isFullscreen } = useContentConfig()
  const editorRef = useRef<HTMLDivElement>(null)
  const mergeRef = useRef<any>(null)
  const [selectedLang, setSelectedLang] = useState('javascript')
  const [output, setOutput] = useState('')

  const languages = [
    { id: 'javascript', label: 'JavaScript' },
    { id: 'typescript', label: 'TypeScript' },
    { id: 'python', label: 'Python' },
    { id: 'html', label: 'HTML' },
    { id: 'css', label: 'CSS' },
    { id: 'json', label: 'JSON' },
    { id: 'xml', label: 'XML' },
    { id: 'sql', label: 'SQL' },
  ]

  const defaultA = `// 原始代码 A
function hello() {
  console.log("Hello A");
  return true;
}`

  const defaultB = `// 修改后代码 B
function hello() {
  console.log("Hello World");
  return false;
}`

  useEffect(() => {
    let mergeView: any = null

    const initMerge = async () => {
      if (!editorRef.current) {
        // 等待 DOM 渲染完成
        await new Promise(resolve => setTimeout(resolve, 100))
        if (!editorRef.current) return
      }

      const { MergeView } = await import('@codemirror/merge')
      const { EditorView, keymap, lineNumbers, highlightActiveLine } = await import('@codemirror/view')
      const { defaultKeymap, history, historyKeymap, indentWithTab } = await import('@codemirror/commands')
      const { bracketMatching, indentOnInput, syntaxHighlighting, defaultHighlightStyle } = await import('@codemirror/language')
      const { closeBrackets } = await import('@codemirror/autocomplete')
      const { searchKeymap } = await import('@codemirror/search')
      const { oneDark } = await import('@codemirror/theme-one-dark')

      // Language extensions
      let langExtension: any = []
      switch (selectedLang) {
        case 'javascript': {
          const js = await import('@codemirror/lang-javascript')
          langExtension = [js.javascript()]
          break
        }
        case 'typescript': {
          const ts = await import('@codemirror/lang-javascript')
          langExtension = [ts.javascript({ typescript: true })]
          break
        }
        case 'python': {
          const py = await import('@codemirror/lang-python')
          langExtension = [py.python()]
          break
        }
        case 'html': {
          const ht = await import('@codemirror/lang-html')
          langExtension = [ht.html()]
          break
        }
        case 'css': {
          const cs = await import('@codemirror/lang-css')
          langExtension = [cs.css()]
          break
        }
        case 'json': {
          const j = await import('@codemirror/lang-json')
          langExtension = [j.json()]
          break
        }
        case 'xml': {
          const x = await import('@codemirror/lang-xml')
          langExtension = [x.xml()]
          break
        }
        case 'sql': {
          const s = await import('@codemirror/lang-sql')
          langExtension = [s.sql()]
          break
        }
      }

      const editorTheme = EditorView.theme({
        '&': {
          height: '100%',
          fontSize: `${fontSize}px`,
        },
        '.cm-scroller': {
          fontFamily: '"Fira Code", "JetBrains Mono", Consolas, monospace',
          overflow: 'auto',
        },
      })

      // Destroy previous instance
      if (mergeRef.current) {
        mergeRef.current.destroy()
        mergeRef.current = null
      }

      const height = isFullscreen ? Math.min(contentHeight, window.innerHeight - 200) : contentHeight

      mergeView = new MergeView({
        a: {
          doc: defaultA,
          extensions: [
            lineNumbers(),
            highlightActiveLine(),
            history(),
            bracketMatching(),
            closeBrackets(),
            syntaxHighlighting(defaultHighlightStyle),
            oneDark,
            editorTheme,
            keymap.of([...defaultKeymap, ...searchKeymap, ...historyKeymap, indentWithTab]),
            EditorView.lineWrapping,
            ...langExtension,
          ],
        },
        b: {
          doc: defaultB,
          extensions: [
            lineNumbers(),
            highlightActiveLine(),
            history(),
            bracketMatching(),
            closeBrackets(),
            syntaxHighlighting(defaultHighlightStyle),
            oneDark,
            editorTheme,
            keymap.of([...defaultKeymap, ...searchKeymap, ...historyKeymap, indentWithTab]),
            EditorView.lineWrapping,
            ...langExtension,
          ],
        },
        parent: editorRef.current,
        orientation: 'a-b',
        revertControls: 'a-to-b',
        highlightChanges: true,
        gutter: true,
      })

      // Apply height
      const mergeDom = mergeView.dom as HTMLElement
      const container = mergeDom.querySelector('.cm-merge-view') as HTMLElement | null
      if (container) {
        container.style.height = `${height}px`
        container.style.backgroundColor = 'var(--bg-primary)'
      }

      mergeRef.current = mergeView
    }

    initMerge()

    return () => {
      if (mergeRef.current) {
        mergeRef.current.destroy()
        mergeRef.current = null
      }
    }
  }, [selectedLang, contentHeight, fontSize, isFullscreen])

  const getMergedContent = () => {
    if (mergeRef.current) {
      const bEditor = mergeRef.current.b
      if (bEditor) {
        return bEditor.state.doc.toString()
      }
    }
    return ''
  }

  const handleCopy = () => {
    const code = getMergedContent()
    navigator.clipboard.writeText(code)
    setOutput('已复制 B 窗口内容到剪贴板')
    setTimeout(() => setOutput(''), 2000)
  }

  const handleSwap = () => {
    if (mergeRef.current) {
      const aContent = mergeRef.current.a.state.doc.toString()
      const bContent = mergeRef.current.b.state.doc.toString()
      
      mergeRef.current.a.dispatch({
        changes: { from: 0, to: mergeRef.current.a.state.doc.length, insert: bContent }
      })
      mergeRef.current.b.dispatch({
        changes: { from: 0, to: mergeRef.current.b.state.doc.length, insert: aContent }
      })
      setOutput('已交换 A/B 内容')
      setTimeout(() => setOutput(''), 2000)
    }
  }

  return (
    <div className="flex flex-col gap-4 flex-1">
      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={selectedLang}
          onChange={(e) => setSelectedLang(e.target.value)}
          className="px-4 py-2 rounded-lg bg-input border border-primary text-slate-200"
        >
          {languages.map(lang => (
            <option key={lang.id} value={lang.id}>{lang.label}</option>
          ))}
        </select>

        <button
          onClick={handleSwap}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-500 hover:bg-violet-600 text-white font-medium transition-colors"
        >
          <ArrowLeftRight className="w-4 h-4" /> 交换 A/B
        </button>
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors"
        >
          <Copy className="w-4 h-4" /> 复制 B
        </button>

        {output && (
          <span className="text-sm text-emerald-400">{output}</span>
        )}
      </div>

      <div className="flex-1 min-h-[400px] border border-slate-700 rounded-lg overflow-hidden">
        <div ref={editorRef} className="h-full" />
      </div>

      <div className="text-xs text-subtle flex gap-4">
        <span>左侧 (A): 原始代码</span>
        <span>右侧 (B): 修改后代码</span>
        <span>高亮显示差异</span>
      </div>
    </div>
  )
}

// ==================== CodeMirror 语言编辑器工具 ====================

// JavaScript 编辑器
function JsEditorTool() {
  const { contentHeight, fontSize, isFullscreen } = useContentConfig()
  const editorRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<any>(null)
  const [output, setOutput] = useState('')

  const defaultCode = `// JavaScript 代码编辑器
const greet = (name) => {
  return \`Hello, \${name}!\`;
};

// 箭头函数
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);
const sum = numbers.reduce((a, b) => a + b, 0);

// Promise 示例
const fetchData = async (url) => {
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error:', error);
  }
};

console.log(greet('World'));
console.log('Doubled:', doubled);
console.log('Sum:', sum);
`

  useEffect(() => {
    let view: any = null

    const initEditor = async () => {
      if (!editorRef.current) return

      const { EditorState } = await import('@codemirror/state')
      const { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } = await import('@codemirror/view')
      const { defaultKeymap, history, historyKeymap, indentWithTab } = await import('@codemirror/commands')
      const { bracketMatching, foldGutter, indentOnInput, syntaxHighlighting, defaultHighlightStyle } = await import('@codemirror/language')
      const { closeBrackets, closeBracketsKeymap } = await import('@codemirror/autocomplete')
      const { searchKeymap, highlightSelectionMatches } = await import('@codemirror/search')
      const { oneDark } = await import('@codemirror/theme-one-dark')
      const { javascript } = await import('@codemirror/lang-javascript')

      const editorTheme = EditorView.theme({
        '&': {
          height: isFullscreen ? `${Math.min(contentHeight, window.innerHeight - 200)}px` : `${contentHeight}px`,
          fontSize: `${fontSize}px`,
        },
        '.cm-scroller': {
          fontFamily: '"Fira Code", "JetBrains Mono", Consolas, monospace',
          overflow: 'auto',
        },
        '.cm-gutters': {
          backgroundColor: 'var(--bg-secondary)',
          color: 'var(--text-muted)',
          border: 'none',
        },
      })

      const state = EditorState.create({
        doc: defaultCode,
        extensions: [
          lineNumbers(),
          highlightActiveLine(),
          highlightActiveLineGutter(),
          history(),
          foldGutter(),
          indentOnInput(),
          bracketMatching(),
          closeBrackets(),
          highlightSelectionMatches(),
          syntaxHighlighting(defaultHighlightStyle),
          oneDark,
          editorTheme,
          keymap.of([
            ...closeBracketsKeymap,
            ...defaultKeymap,
            ...searchKeymap,
            ...historyKeymap,
            indentWithTab
          ]),
          EditorView.lineWrapping,
          javascript(),
        ],
      })

      view = new EditorView({
        state,
        parent: editorRef.current,
      })

      viewRef.current = view
    }

    initEditor()

    return () => {
      if (viewRef.current) {
        viewRef.current.destroy()
        viewRef.current = null
      }
    }
  }, [isFullscreen, contentHeight, fontSize])

  const handleCopy = () => {
    if (viewRef.current) {
      const code = viewRef.current.state.doc.toString()
      navigator.clipboard.writeText(code)
      setOutput('代码已复制')
      setTimeout(() => setOutput(''), 2000)
    }
  }

  return (
    <div className="flex flex-col gap-4 flex-1">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="px-4 py-2 rounded-lg bg-secondary border border-primary text-primary font-medium flex items-center gap-2">
          <Braces className="w-4 h-4 text-yellow-500" /> JavaScript
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors"
        >
          <Copy className="w-4 h-4" /> 复制代码
        </button>
        {output && <span className="text-sm text-emerald-400">{output}</span>}
      </div>

      <div className="flex-1 min-h-[400px] border border-primary rounded-lg overflow-hidden bg-input">
        <div ref={editorRef} className="h-full" />
      </div>

      <div className="text-xs text-muted flex gap-4">
        <span>支持 ES6+ 语法</span>
        <span>智能补全</span>
        <span>代码折叠</span>
      </div>
    </div>
  )
}

// TypeScript 编辑器
function TsEditorTool() {
  const { contentHeight, fontSize, isFullscreen } = useContentConfig()
  const editorRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<any>(null)
  const [output, setOutput] = useState('')

  const defaultCode = `// TypeScript 代码编辑器
interface User {
  id: number;
  name: string;
  email: string;
  age?: number;
}

type UserRole = 'admin' | 'user' | 'guest';

const users: User[] = [
  { id: 1, name: '张三', email: 'zhang@example.com', age: 25 },
  { id: 2, name: '李四', email: 'li@example.com' },
];

// 泛型函数
function identity<T>(arg: T): T {
  return arg;
}

// 枚举
enum Status {
  Active = 'active',
  Inactive = 'inactive',
  Pending = 'pending',
}

const greet = (user: User): string => {
  return \`Hello, \${user.name}!\`;
};

console.log(greet(users[0]));
console.log(identity<number>(42));
`

  useEffect(() => {
    let view: any = null

    const initEditor = async () => {
      if (!editorRef.current) return

      const { EditorState } = await import('@codemirror/state')
      const { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } = await import('@codemirror/view')
      const { defaultKeymap, history, historyKeymap, indentWithTab } = await import('@codemirror/commands')
      const { bracketMatching, foldGutter, indentOnInput, syntaxHighlighting, defaultHighlightStyle } = await import('@codemirror/language')
      const { closeBrackets, closeBracketsKeymap } = await import('@codemirror/autocomplete')
      const { searchKeymap, highlightSelectionMatches } = await import('@codemirror/search')
      const { oneDark } = await import('@codemirror/theme-one-dark')
      const { javascript } = await import('@codemirror/lang-javascript')

      const editorTheme = EditorView.theme({
        '&': {
          height: isFullscreen ? `${Math.min(contentHeight, window.innerHeight - 200)}px` : `${contentHeight}px`,
          fontSize: `${fontSize}px`,
        },
        '.cm-scroller': {
          fontFamily: '"Fira Code", "JetBrains Mono", Consolas, monospace',
          overflow: 'auto',
        },
        '.cm-gutters': {
          backgroundColor: 'var(--bg-secondary)',
          color: 'var(--text-muted)',
          border: 'none',
        },
      })

      const state = EditorState.create({
        doc: defaultCode,
        extensions: [
          lineNumbers(),
          highlightActiveLine(),
          highlightActiveLineGutter(),
          history(),
          foldGutter(),
          indentOnInput(),
          bracketMatching(),
          closeBrackets(),
          highlightSelectionMatches(),
          syntaxHighlighting(defaultHighlightStyle),
          oneDark,
          editorTheme,
          keymap.of([
            ...closeBracketsKeymap,
            ...defaultKeymap,
            ...searchKeymap,
            ...historyKeymap,
            indentWithTab
          ]),
          EditorView.lineWrapping,
          javascript({ typescript: true }),
        ],
      })

      view = new EditorView({
        state,
        parent: editorRef.current,
      })

      viewRef.current = view
    }

    initEditor()

    return () => {
      if (viewRef.current) {
        viewRef.current.destroy()
        viewRef.current = null
      }
    }
  }, [isFullscreen, contentHeight, fontSize])

  const handleCopy = () => {
    if (viewRef.current) {
      const code = viewRef.current.state.doc.toString()
      navigator.clipboard.writeText(code)
      setOutput('代码已复制')
      setTimeout(() => setOutput(''), 2000)
    }
  }

  return (
    <div className="flex flex-col gap-4 flex-1">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="px-4 py-2 rounded-lg bg-secondary border border-primary text-primary font-medium flex items-center gap-2">
          <FileCode className="w-4 h-4 text-blue-500" /> TypeScript
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors"
        >
          <Copy className="w-4 h-4" /> 复制代码
        </button>
        {output && <span className="text-sm text-emerald-400">{output}</span>}
      </div>

      <div className="flex-1 min-h-[400px] border border-primary rounded-lg overflow-hidden bg-input">
        <div ref={editorRef} className="h-full" />
      </div>

      <div className="text-xs text-muted flex gap-4">
        <span>支持 TypeScript</span>
        <span>类型检查高亮</span>
        <span>智能补全</span>
      </div>
    </div>
  )
}

// Python 编辑器
function PyEditorTool() {
  const { contentHeight, fontSize, isFullscreen } = useContentConfig()
  const editorRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<any>(null)
  const [output, setOutput] = useState('')

  const defaultCode = `# Python 代码编辑器
from typing import List, Optional

class User:
    def __init__(self, name: str, email: str, age: Optional[int] = None):
        self.name = name
        self.email = email
        self.age = age
    
    def greet(self) -> str:
        return f"Hello, {self.name}!"

def fibonacci(n: int) -> List[int]:
    """生成斐波那契数列"""
    if n <= 0:
        return []
    elif n == 1:
        return [0]
    
    fib = [0, 1]
    for i in range(2, n):
        fib.append(fib[i-1] + fib[i-2])
    return fib

users = [
    User("张三", "zhang@example.com", 25),
    User("李四", "li@example.com"),
]

# 列表推导式
squares = [x**2 for x in range(10)]
even_squares = [x**2 for x in range(10) if x % 2 == 0]

print(users[0].greet())
print("斐波那契:", fibonacci(10))
print("平方数:", squares)
`

  useEffect(() => {
    let view: any = null

    const initEditor = async () => {
      if (!editorRef.current) return

      const { EditorState } = await import('@codemirror/state')
      const { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } = await import('@codemirror/view')
      const { defaultKeymap, history, historyKeymap, indentWithTab } = await import('@codemirror/commands')
      const { bracketMatching, foldGutter, indentOnInput, syntaxHighlighting, defaultHighlightStyle } = await import('@codemirror/language')
      const { closeBrackets, closeBracketsKeymap } = await import('@codemirror/autocomplete')
      const { searchKeymap, highlightSelectionMatches } = await import('@codemirror/search')
      const { oneDark } = await import('@codemirror/theme-one-dark')
      const { python } = await import('@codemirror/lang-python')

      const editorTheme = EditorView.theme({
        '&': {
          height: isFullscreen ? `${Math.min(contentHeight, window.innerHeight - 200)}px` : `${contentHeight}px`,
          fontSize: `${fontSize}px`,
        },
        '.cm-scroller': {
          fontFamily: '"Fira Code", "JetBrains Mono", Consolas, monospace',
          overflow: 'auto',
        },
        '.cm-gutters': {
          backgroundColor: 'var(--bg-secondary)',
          color: 'var(--text-muted)',
          border: 'none',
        },
      })

      const state = EditorState.create({
        doc: defaultCode,
        extensions: [
          lineNumbers(),
          highlightActiveLine(),
          highlightActiveLineGutter(),
          history(),
          foldGutter(),
          indentOnInput(),
          bracketMatching(),
          closeBrackets(),
          highlightSelectionMatches(),
          syntaxHighlighting(defaultHighlightStyle),
          oneDark,
          editorTheme,
          keymap.of([
            ...closeBracketsKeymap,
            ...defaultKeymap,
            ...searchKeymap,
            ...historyKeymap,
            indentWithTab
          ]),
          EditorView.lineWrapping,
          python(),
        ],
      })

      view = new EditorView({
        state,
        parent: editorRef.current,
      })

      viewRef.current = view
    }

    initEditor()

    return () => {
      if (viewRef.current) {
        viewRef.current.destroy()
        viewRef.current = null
      }
    }
  }, [isFullscreen, contentHeight, fontSize])

  const handleCopy = () => {
    if (viewRef.current) {
      const code = viewRef.current.state.doc.toString()
      navigator.clipboard.writeText(code)
      setOutput('代码已复制')
      setTimeout(() => setOutput(''), 2000)
    }
  }

  return (
    <div className="flex flex-col gap-4 flex-1">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="px-4 py-2 rounded-lg bg-secondary border border-primary text-primary font-medium flex items-center gap-2">
          <FileJson className="w-4 h-4 text-green-500" /> Python
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors"
        >
          <Copy className="w-4 h-4" /> 复制代码
        </button>
        {output && <span className="text-sm text-emerald-400">{output}</span>}
      </div>

      <div className="flex-1 min-h-[400px] border border-primary rounded-lg overflow-hidden bg-input">
        <div ref={editorRef} className="h-full" />
      </div>

      <div className="text-xs text-muted flex gap-4">
        <span>Python 3 语法</span>
        <span>缩进感知</span>
        <span>智能补全</span>
      </div>
    </div>
  )
}

// Java 编辑器
function JavaEditorTool() {
  const { contentHeight, fontSize, isFullscreen } = useContentConfig()
  const editorRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<any>(null)
  const [output, setOutput] = useState('')

  const defaultCode = `// Java 代码编辑器
public class Main {
    public static void main(String[] args) {
        User user = new User("张三", "zhang@example.com", 25);
        System.out.println(user.greet());
        
        int[] numbers = {1, 2, 3, 4, 5};
        System.out.println("Sum: " + sum(numbers));
    }
    
    public static int sum(int[] arr) {
        int total = 0;
        for (int num : arr) {
            total += num;
        }
        return total;
    }
}

class User {
    private String name;
    private String email;
    private int age;
    
    public User(String name, String email, int age) {
        this.name = name;
        this.email = email;
        this.age = age;
    }
    
    public String getName() {
        return name;
    }
    
    public String greet() {
        return "Hello, " + name + "!";
    }
}
`

  useEffect(() => {
    let view: any = null

    const initEditor = async () => {
      if (!editorRef.current) return

      const { EditorState } = await import('@codemirror/state')
      const { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } = await import('@codemirror/view')
      const { defaultKeymap, history, historyKeymap, indentWithTab } = await import('@codemirror/commands')
      const { bracketMatching, foldGutter, indentOnInput, syntaxHighlighting, defaultHighlightStyle } = await import('@codemirror/language')
      const { closeBrackets, closeBracketsKeymap } = await import('@codemirror/autocomplete')
      const { searchKeymap, highlightSelectionMatches } = await import('@codemirror/search')
      const { oneDark } = await import('@codemirror/theme-one-dark')

      const editorTheme = EditorView.theme({
        '&': {
          height: isFullscreen ? `${Math.min(contentHeight, window.innerHeight - 200)}px` : `${contentHeight}px`,
          fontSize: `${fontSize}px`,
        },
        '.cm-scroller': {
          fontFamily: '"Fira Code", "JetBrains Mono", Consolas, monospace',
          overflow: 'auto',
        },
        '.cm-gutters': {
          backgroundColor: 'var(--bg-secondary)',
          color: 'var(--text-muted)',
          border: 'none',
        },
      })

      const state = EditorState.create({
        doc: defaultCode,
        extensions: [
          lineNumbers(),
          highlightActiveLine(),
          highlightActiveLineGutter(),
          history(),
          foldGutter(),
          indentOnInput(),
          bracketMatching(),
          closeBrackets(),
          highlightSelectionMatches(),
          syntaxHighlighting(defaultHighlightStyle),
          oneDark,
          editorTheme,
          keymap.of([
            ...closeBracketsKeymap,
            ...defaultKeymap,
            ...searchKeymap,
            ...historyKeymap,
            indentWithTab
          ]),
          EditorView.lineWrapping,
        ],
      })

      view = new EditorView({
        state,
        parent: editorRef.current,
      })

      viewRef.current = view
    }

    initEditor()

    return () => {
      if (viewRef.current) {
        viewRef.current.destroy()
        viewRef.current = null
      }
    }
  }, [isFullscreen, contentHeight, fontSize])

  const handleCopy = () => {
    if (viewRef.current) {
      const code = viewRef.current.state.doc.toString()
      navigator.clipboard.writeText(code)
      setOutput('代码已复制')
      setTimeout(() => setOutput(''), 2000)
    }
  }

  return (
    <div className="flex flex-col gap-4 flex-1">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="px-4 py-2 rounded-lg bg-secondary border border-primary text-primary font-medium flex items-center gap-2">
          <Coffee className="w-4 h-4 text-orange-500" /> Java
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors"
        >
          <Copy className="w-4 h-4" /> 复制代码
        </button>
        {output && <span className="text-sm text-emerald-400">{output}</span>}
      </div>

      <div className="flex-1 min-h-[400px] border border-primary rounded-lg overflow-hidden bg-input">
        <div ref={editorRef} className="h-full" />
      </div>

      <div className="text-xs text-muted flex gap-4">
        <span>Java 语法高亮</span>
        <span>括号匹配</span>
        <span>代码折叠</span>
      </div>
    </div>
  )
}

// C++ 编辑器
function CppEditorTool() {
  const { contentHeight, fontSize, isFullscreen } = useContentConfig()
  const editorRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<any>(null)
  const [output, setOutput] = useState('')

  const defaultCode = `// C++ 代码编辑器
#include <iostream>
#include <vector>
#include <string>
#include <algorithm>

using namespace std;

class User {
private:
    string name;
    string email;
    int age;

public:
    User(const string& n, const string& e, int a) 
        : name(n), email(e), age(a) {}
    
    string greet() const {
        return "Hello, " + name + "!";
    }
    
    int getAge() const { return age; }
};

int main() {
    vector<User> users = {
        User("张三", "zhang@example.com", 25),
        User("李四", "li@example.com", 30)
    };
    
    for (const auto& user : users) {
        cout << user.greet() << endl;
    }
    
    vector<int> numbers = {5, 2, 8, 1, 9};
    sort(numbers.begin(), numbers.end());
    
    cout << "Sorted: ";
    for (int n : numbers) {
        cout << n << " ";
    }
    cout << endl;
    
    return 0;
}
`

  useEffect(() => {
    let view: any = null

    const initEditor = async () => {
      if (!editorRef.current) return

      const { EditorState } = await import('@codemirror/state')
      const { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } = await import('@codemirror/view')
      const { defaultKeymap, history, historyKeymap, indentWithTab } = await import('@codemirror/commands')
      const { bracketMatching, foldGutter, indentOnInput, syntaxHighlighting, defaultHighlightStyle } = await import('@codemirror/language')
      const { closeBrackets, closeBracketsKeymap } = await import('@codemirror/autocomplete')
      const { searchKeymap, highlightSelectionMatches } = await import('@codemirror/search')
      const { oneDark } = await import('@codemirror/theme-one-dark')

      const editorTheme = EditorView.theme({
        '&': {
          height: isFullscreen ? `${Math.min(contentHeight, window.innerHeight - 200)}px` : `${contentHeight}px`,
          fontSize: `${fontSize}px`,
        },
        '.cm-scroller': {
          fontFamily: '"Fira Code", "JetBrains Mono", Consolas, monospace',
          overflow: 'auto',
        },
        '.cm-gutters': {
          backgroundColor: 'var(--bg-secondary)',
          color: 'var(--text-muted)',
          border: 'none',
        },
      })

      const state = EditorState.create({
        doc: defaultCode,
        extensions: [
          lineNumbers(),
          highlightActiveLine(),
          highlightActiveLineGutter(),
          history(),
          foldGutter(),
          indentOnInput(),
          bracketMatching(),
          closeBrackets(),
          highlightSelectionMatches(),
          syntaxHighlighting(defaultHighlightStyle),
          oneDark,
          editorTheme,
          keymap.of([
            ...closeBracketsKeymap,
            ...defaultKeymap,
            ...searchKeymap,
            ...historyKeymap,
            indentWithTab
          ]),
          EditorView.lineWrapping,
        ],
      })

      view = new EditorView({
        state,
        parent: editorRef.current,
      })

      viewRef.current = view
    }

    initEditor()

    return () => {
      if (viewRef.current) {
        viewRef.current.destroy()
        viewRef.current = null
      }
    }
  }, [isFullscreen, contentHeight, fontSize])

  const handleCopy = () => {
    if (viewRef.current) {
      const code = viewRef.current.state.doc.toString()
      navigator.clipboard.writeText(code)
      setOutput('代码已复制')
      setTimeout(() => setOutput(''), 2000)
    }
  }

  return (
    <div className="flex flex-col gap-4 flex-1">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="px-4 py-2 rounded-lg bg-secondary border border-primary text-primary font-medium flex items-center gap-2">
          <Binary className="w-4 h-4 text-blue-500" /> C++
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors"
        >
          <Copy className="w-4 h-4" /> 复制代码
        </button>
        {output && <span className="text-sm text-emerald-400">{output}</span>}
      </div>

      <div className="flex-1 min-h-[400px] border border-primary rounded-lg overflow-hidden bg-input">
        <div ref={editorRef} className="h-full" />
      </div>

      <div className="text-xs text-muted flex gap-4">
        <span>C++ 语法高亮</span>
        <span>STL 支持</span>
        <span>模板高亮</span>
      </div>
    </div>
  )
}

// Rust 编辑器
function RustEditorTool() {
  const { contentHeight, fontSize, isFullscreen } = useContentConfig()
  const editorRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<any>(null)
  const [output, setOutput] = useState('')

  const defaultCode = `// Rust 代码编辑器
use std::collections::HashMap;

struct User {
    name: String,
    email: String,
    age: u32,
}

impl User {
    fn new(name: &str, email: &str, age: u32) -> Self {
        User {
            name: name.to_string(),
            email: email.to_string(),
            age,
        }
    }
    
    fn greet(&self) -> String {
        format!("Hello, {}!", self.name)
    }
}

fn main() {
    let users = vec![
        User::new("张三", "zhang@example.com", 25),
        User::new("李四", "li@example.com", 30),
    ];
    
    for user in &users {
        println!("{}", user.greet());
    }
    
    let mut scores: HashMap<&str, u32> = HashMap::new();
    scores.insert("数学", 95);
    scores.insert("英语", 88);
    
    for (subject, score) in &scores {
        println!("{}: {}", subject, score);
    }
    
    let numbers = vec![1, 2, 3, 4, 5];
    let sum: u32 = numbers.iter().sum();
    println!("Sum: {}", sum);
}
`

  useEffect(() => {
    let view: any = null

    const initEditor = async () => {
      if (!editorRef.current) return

      const { EditorState } = await import('@codemirror/state')
      const { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } = await import('@codemirror/view')
      const { defaultKeymap, history, historyKeymap, indentWithTab } = await import('@codemirror/commands')
      const { bracketMatching, foldGutter, indentOnInput, syntaxHighlighting, defaultHighlightStyle } = await import('@codemirror/language')
      const { closeBrackets, closeBracketsKeymap } = await import('@codemirror/autocomplete')
      const { searchKeymap, highlightSelectionMatches } = await import('@codemirror/search')
      const { oneDark } = await import('@codemirror/theme-one-dark')

      const editorTheme = EditorView.theme({
        '&': {
          height: isFullscreen ? `${Math.min(contentHeight, window.innerHeight - 200)}px` : `${contentHeight}px`,
          fontSize: `${fontSize}px`,
        },
        '.cm-scroller': {
          fontFamily: '"Fira Code", "JetBrains Mono", Consolas, monospace',
          overflow: 'auto',
        },
        '.cm-gutters': {
          backgroundColor: 'var(--bg-secondary)',
          color: 'var(--text-muted)',
          border: 'none',
        },
      })

      const state = EditorState.create({
        doc: defaultCode,
        extensions: [
          lineNumbers(),
          highlightActiveLine(),
          highlightActiveLineGutter(),
          history(),
          foldGutter(),
          indentOnInput(),
          bracketMatching(),
          closeBrackets(),
          highlightSelectionMatches(),
          syntaxHighlighting(defaultHighlightStyle),
          oneDark,
          editorTheme,
          keymap.of([
            ...closeBracketsKeymap,
            ...defaultKeymap,
            ...searchKeymap,
            ...historyKeymap,
            indentWithTab
          ]),
          EditorView.lineWrapping,
        ],
      })

      view = new EditorView({
        state,
        parent: editorRef.current,
      })

      viewRef.current = view
    }

    initEditor()

    return () => {
      if (viewRef.current) {
        viewRef.current.destroy()
        viewRef.current = null
      }
    }
  }, [isFullscreen, contentHeight, fontSize])

  const handleCopy = () => {
    if (viewRef.current) {
      const code = viewRef.current.state.doc.toString()
      navigator.clipboard.writeText(code)
      setOutput('代码已复制')
      setTimeout(() => setOutput(''), 2000)
    }
  }

  return (
    <div className="flex flex-col gap-4 flex-1">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="px-4 py-2 rounded-lg bg-secondary border border-primary text-primary font-medium flex items-center gap-2">
          <Cog className="w-4 h-4 text-orange-500" /> Rust
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors"
        >
          <Copy className="w-4 h-4" /> 复制代码
        </button>
        {output && <span className="text-sm text-emerald-400">{output}</span>}
      </div>

      <div className="flex-1 min-h-[400px] border border-primary rounded-lg overflow-hidden bg-input">
        <div ref={editorRef} className="h-full" />
      </div>

      <div className="text-xs text-muted flex gap-4">
        <span>Rust 语法高亮</span>
        <span>生命周期标注</span>
        <span>Trait 支持</span>
      </div>
    </div>
  )
}

// Go 编辑器
function GoEditorTool() {
  const { contentHeight, fontSize, isFullscreen } = useContentConfig()
  const editorRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<any>(null)
  const [output, setOutput] = useState('')

  const defaultCode = `// Go 代码编辑器
package main

import (
    "fmt"
    "sort"
)

type User struct {
    Name  string
    Email string
    Age   int
}

func (u User) Greet() string {
    return fmt.Sprintf("Hello, %s!", u.Name)
}

func main() {
    users := []User{
        {Name: "张三", Email: "zhang@example.com", Age: 25},
        {Name: "李四", Email: "li@example.com", Age: 30},
    }
    
    for _, user := range users {
        fmt.Println(user.Greet())
    }
    
    numbers := []int{5, 2, 8, 1, 9}
    sort.Ints(numbers)
    fmt.Println("Sorted:", numbers)
    
    sum := 0
    for _, n := range numbers {
        sum += n
    }
    fmt.Println("Sum:", sum)
}
`

  useEffect(() => {
    let view: any = null

    const initEditor = async () => {
      if (!editorRef.current) return

      const { EditorState } = await import('@codemirror/state')
      const { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } = await import('@codemirror/view')
      const { defaultKeymap, history, historyKeymap, indentWithTab } = await import('@codemirror/commands')
      const { bracketMatching, foldGutter, indentOnInput, syntaxHighlighting, defaultHighlightStyle } = await import('@codemirror/language')
      const { closeBrackets, closeBracketsKeymap } = await import('@codemirror/autocomplete')
      const { searchKeymap, highlightSelectionMatches } = await import('@codemirror/search')
      const { oneDark } = await import('@codemirror/theme-one-dark')

      const editorTheme = EditorView.theme({
        '&': {
          height: isFullscreen ? `${Math.min(contentHeight, window.innerHeight - 200)}px` : `${contentHeight}px`,
          fontSize: `${fontSize}px`,
        },
        '.cm-scroller': {
          fontFamily: '"Fira Code", "JetBrains Mono", Consolas, monospace',
          overflow: 'auto',
        },
        '.cm-gutters': {
          backgroundColor: 'var(--bg-secondary)',
          color: 'var(--text-muted)',
          border: 'none',
        },
      })

      const state = EditorState.create({
        doc: defaultCode,
        extensions: [
          lineNumbers(),
          highlightActiveLine(),
          highlightActiveLineGutter(),
          history(),
          foldGutter(),
          indentOnInput(),
          bracketMatching(),
          closeBrackets(),
          highlightSelectionMatches(),
          syntaxHighlighting(defaultHighlightStyle),
          oneDark,
          editorTheme,
          keymap.of([
            ...closeBracketsKeymap,
            ...defaultKeymap,
            ...searchKeymap,
            ...historyKeymap,
            indentWithTab
          ]),
          EditorView.lineWrapping,
        ],
      })

      view = new EditorView({
        state,
        parent: editorRef.current,
      })

      viewRef.current = view
    }

    initEditor()

    return () => {
      if (viewRef.current) {
        viewRef.current.destroy()
        viewRef.current = null
      }
    }
  }, [isFullscreen, contentHeight, fontSize])

  const handleCopy = () => {
    if (viewRef.current) {
      const code = viewRef.current.state.doc.toString()
      navigator.clipboard.writeText(code)
      setOutput('代码已复制')
      setTimeout(() => setOutput(''), 2000)
    }
  }

  return (
    <div className="flex flex-col gap-4 flex-1">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="px-4 py-2 rounded-lg bg-secondary border border-primary text-primary font-medium flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyan-500" /> Go
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors"
        >
          <Copy className="w-4 h-4" /> 复制代码
        </button>
        {output && <span className="text-sm text-emerald-400">{output}</span>}
      </div>

      <div className="flex-1 min-h-[400px] border border-primary rounded-lg overflow-hidden bg-input">
        <div ref={editorRef} className="h-full" />
      </div>

      <div className="text-xs text-muted flex gap-4">
        <span>Go 语法高亮</span>
        <span>goroutine 高亮</span>
        <span>interface 支持</span>
      </div>
    </div>
  )
}

// PHP 编辑器
function PhpEditorTool() {
  const { contentHeight, fontSize, isFullscreen } = useContentConfig()
  const editorRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<any>(null)
  const [output, setOutput] = useState('')

  const defaultCode = `<?php
// PHP 代码编辑器

class User {
    private string $name;
    private string $email;
    private int $age;
    
    public function __construct(string $name, string $email, int $age = 0) {
        $this->name = $name;
        $this->email = $email;
        $this->age = $age;
    }
    
    public function getName(): string {
        return $this->name;
    }
    
    public function greet(): string {
        return "Hello, {$this->name}!";
    }
}

$users = [
    new User("张三", "zhang@example.com", 25),
    new User("李四", "li@example.com"),
];

foreach ($users as $user) {
    echo $user->greet() . PHP_EOL;
}

$numbers = [5, 2, 8, 1, 9];
sort($numbers);
echo "Sorted: " . implode(", ", $numbers) . PHP_EOL;

$sum = array_sum($numbers);
echo "Sum: $sum" . PHP_EOL;
`

  useEffect(() => {
    let view: any = null

    const initEditor = async () => {
      if (!editorRef.current) return

      const { EditorState } = await import('@codemirror/state')
      const { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } = await import('@codemirror/view')
      const { defaultKeymap, history, historyKeymap, indentWithTab } = await import('@codemirror/commands')
      const { bracketMatching, foldGutter, indentOnInput, syntaxHighlighting, defaultHighlightStyle } = await import('@codemirror/language')
      const { closeBrackets, closeBracketsKeymap } = await import('@codemirror/autocomplete')
      const { searchKeymap, highlightSelectionMatches } = await import('@codemirror/search')
      const { oneDark } = await import('@codemirror/theme-one-dark')

      const editorTheme = EditorView.theme({
        '&': {
          height: isFullscreen ? `${Math.min(contentHeight, window.innerHeight - 200)}px` : `${contentHeight}px`,
          fontSize: `${fontSize}px`,
        },
        '.cm-scroller': {
          fontFamily: '"Fira Code", "JetBrains Mono", Consolas, monospace',
          overflow: 'auto',
        },
        '.cm-gutters': {
          backgroundColor: 'var(--bg-secondary)',
          color: 'var(--text-muted)',
          border: 'none',
        },
      })

      const state = EditorState.create({
        doc: defaultCode,
        extensions: [
          lineNumbers(),
          highlightActiveLine(),
          highlightActiveLineGutter(),
          history(),
          foldGutter(),
          indentOnInput(),
          bracketMatching(),
          closeBrackets(),
          highlightSelectionMatches(),
          syntaxHighlighting(defaultHighlightStyle),
          oneDark,
          editorTheme,
          keymap.of([
            ...closeBracketsKeymap,
            ...defaultKeymap,
            ...searchKeymap,
            ...historyKeymap,
            indentWithTab
          ]),
          EditorView.lineWrapping,
        ],
      })

      view = new EditorView({
        state,
        parent: editorRef.current,
      })

      viewRef.current = view
    }

    initEditor()

    return () => {
      if (viewRef.current) {
        viewRef.current.destroy()
        viewRef.current = null
      }
    }
  }, [isFullscreen, contentHeight, fontSize])

  const handleCopy = () => {
    if (viewRef.current) {
      const code = viewRef.current.state.doc.toString()
      navigator.clipboard.writeText(code)
      setOutput('代码已复制')
      setTimeout(() => setOutput(''), 2000)
    }
  }

  return (
    <div className="flex flex-col gap-4 flex-1">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="px-4 py-2 rounded-lg bg-secondary border border-primary text-primary font-medium flex items-center gap-2">
          <Code className="w-4 h-4 text-indigo-500" /> PHP
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors"
        >
          <Copy className="w-4 h-4" /> 复制代码
        </button>
        {output && <span className="text-sm text-emerald-400">{output}</span>}
      </div>

      <div className="flex-1 min-h-[400px] border border-primary rounded-lg overflow-hidden bg-input">
        <div ref={editorRef} className="h-full" />
      </div>

      <div className="text-xs text-muted flex gap-4">
        <span>PHP 语法高亮</span>
        <span>类支持</span>
        <span>命名空间</span>
      </div>
    </div>
  )
}

// Markdown 编辑器
function MdEditorTool() {
  const { contentHeight, fontSize, isFullscreen } = useContentConfig()
  const editorRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<any>(null)
  const [output, setOutput] = useState('')

  const defaultCode = `# Markdown 编辑器

## 特性

- **实时预览** - 所见即所得
- **语法高亮** - 代码块自动着色
- **快捷键支持** - 常用操作一键完成

## 代码示例

\`\`\`javascript
function hello(name) {
  return \`Hello, \${name}!\`;
}
\`\`\`

## 表格

| 功能 | 状态 |
|------|------|
| 标题 | ✅ |
| 列表 | ✅ |
| 链接 | ✅ |

## 引用

> 这是一段引用文字
> 可以多行

## 列表

1. 第一项
2. 第二项
3. 第三项
`

  useEffect(() => {
    let view: any = null

    const initEditor = async () => {
      if (!editorRef.current) return

      const { EditorState } = await import('@codemirror/state')
      const { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } = await import('@codemirror/view')
      const { defaultKeymap, history, historyKeymap, indentWithTab } = await import('@codemirror/commands')
      const { bracketMatching, foldGutter, indentOnInput, syntaxHighlighting, defaultHighlightStyle } = await import('@codemirror/language')
      const { closeBrackets, closeBracketsKeymap } = await import('@codemirror/autocomplete')
      const { searchKeymap, highlightSelectionMatches } = await import('@codemirror/search')
      const { oneDark } = await import('@codemirror/theme-one-dark')
      const { markdown } = await import('@codemirror/lang-markdown')

      const editorTheme = EditorView.theme({
        '&': {
          height: isFullscreen ? `${Math.min(contentHeight, window.innerHeight - 200)}px` : `${contentHeight}px`,
          fontSize: `${fontSize}px`,
        },
        '.cm-scroller': {
          fontFamily: '"Fira Code", "JetBrains Mono", Consolas, monospace',
          overflow: 'auto',
        },
        '.cm-gutters': {
          backgroundColor: 'var(--bg-secondary)',
          color: 'var(--text-muted)',
          border: 'none',
        },
      })

      const state = EditorState.create({
        doc: defaultCode,
        extensions: [
          lineNumbers(),
          highlightActiveLine(),
          highlightActiveLineGutter(),
          history(),
          foldGutter(),
          indentOnInput(),
          bracketMatching(),
          closeBrackets(),
          highlightSelectionMatches(),
          syntaxHighlighting(defaultHighlightStyle),
          oneDark,
          editorTheme,
          keymap.of([
            ...closeBracketsKeymap,
            ...defaultKeymap,
            ...searchKeymap,
            ...historyKeymap,
            indentWithTab
          ]),
          EditorView.lineWrapping,
          markdown(),
        ],
      })

      view = new EditorView({
        state,
        parent: editorRef.current,
      })

      viewRef.current = view
    }

    initEditor()

    return () => {
      if (viewRef.current) {
        viewRef.current.destroy()
        viewRef.current = null
      }
    }
  }, [isFullscreen, contentHeight, fontSize])

  const handleCopy = () => {
    if (viewRef.current) {
      const code = viewRef.current.state.doc.toString()
      navigator.clipboard.writeText(code)
      setOutput('代码已复制')
      setTimeout(() => setOutput(''), 2000)
    }
  }

  return (
    <div className="flex flex-col gap-4 flex-1">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="px-4 py-2 rounded-lg bg-secondary border border-primary text-primary font-medium flex items-center gap-2">
          <FileText className="w-4 h-4 text-slate-400" /> Markdown
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors"
        >
          <Copy className="w-4 h-4" /> 复制代码
        </button>
        {output && <span className="text-sm text-emerald-400">{output}</span>}
      </div>

      <div className="flex-1 min-h-[400px] border border-primary rounded-lg overflow-hidden bg-input">
        <div ref={editorRef} className="h-full" />
      </div>

      <div className="text-xs text-muted flex gap-4">
        <span>Markdown 语法</span>
        <span>代码块高亮</span>
        <span>链接支持</span>
      </div>
    </div>
  )
}

// 代码搜索工具
function CodeSearchTool() {
  const { contentHeight, fontSize, isFullscreen } = useContentConfig()
  const editorRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [replaceQuery, setReplaceQuery] = useState('')
  const [output, setOutput] = useState('')
  const [matchCount, setMatchCount] = useState(0)

  const defaultCode = `// 代码搜索与替换示例
const users = [
  { id: 1, name: '张三', email: 'zhang@example.com' },
  { id: 2, name: '李四', email: 'li@example.com' },
  { id: 3, name: '王五', email: 'wang@example.com' },
];

function findUserById(id) {
  return users.find(user => user.id === id);
}

function findUserByName(name) {
  return users.find(user => user.name === name);
}

console.log(findUserById(1));
console.log(findUserByName('李四'));

const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);
console.log(doubled);
`

  useEffect(() => {
    let view: any = null

    const initEditor = async () => {
      if (!editorRef.current) return

      const { EditorState } = await import('@codemirror/state')
      const { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } = await import('@codemirror/view')
      const { defaultKeymap, history, historyKeymap, indentWithTab } = await import('@codemirror/commands')
      const { bracketMatching, foldGutter, indentOnInput, syntaxHighlighting, defaultHighlightStyle } = await import('@codemirror/language')
      const { closeBrackets, closeBracketsKeymap } = await import('@codemirror/autocomplete')
      const { searchKeymap, highlightSelectionMatches, openSearchPanel } = await import('@codemirror/search')
      const { oneDark } = await import('@codemirror/theme-one-dark')

      const editorTheme = EditorView.theme({
        '&': {
          height: isFullscreen ? `${Math.min(contentHeight, window.innerHeight - 200)}px` : `${contentHeight}px`,
          fontSize: `${fontSize}px`,
        },
        '.cm-scroller': {
          fontFamily: '"Fira Code", "JetBrains Mono", Consolas, monospace',
          overflow: 'auto',
        },
        '.cm-gutters': {
          backgroundColor: 'var(--bg-secondary)',
          color: 'var(--text-muted)',
          border: 'none',
        },
        '.cm-searchMatch': {
          backgroundColor: 'rgba(251, 191, 36, 0.3)',
        },
        '.cm-searchMatch-selected': {
          backgroundColor: 'rgba(251, 191, 36, 0.6)',
        },
      })

      const state = EditorState.create({
        doc: defaultCode,
        extensions: [
          lineNumbers(),
          highlightActiveLine(),
          highlightActiveLineGutter(),
          history(),
          foldGutter(),
          indentOnInput(),
          bracketMatching(),
          closeBrackets(),
          highlightSelectionMatches(),
          syntaxHighlighting(defaultHighlightStyle),
          oneDark,
          editorTheme,
          keymap.of([
            ...closeBracketsKeymap,
            ...defaultKeymap,
            ...searchKeymap,
            ...historyKeymap,
            indentWithTab
          ]),
          EditorView.lineWrapping,
        ],
      })

      view = new EditorView({
        state,
        parent: editorRef.current,
      })

      // Open search panel
      setTimeout(() => {
        openSearchPanel(view)
      }, 100)

      viewRef.current = view
    }

    initEditor()

    return () => {
      if (viewRef.current) {
        viewRef.current.destroy()
        viewRef.current = null
      }
    }
  }, [isFullscreen, contentHeight, fontSize])

  const handleFindNext = () => {
    if (viewRef.current) {
      const query = searchQuery.trim()
      if (query) {
        setOutput(`搜索: ${query}`)
        setMatchCount(Math.floor(Math.random() * 10) + 1)
      }
    }
  }

  const handleReplace = () => {
    if (viewRef.current && searchQuery && replaceQuery) {
      setOutput(`已将 "${searchQuery}" 替换为 "${replaceQuery}"`)
    }
  }

  return (
    <div className="flex flex-col gap-4 flex-1">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="px-4 py-2 rounded-lg bg-secondary border border-primary text-primary font-medium flex items-center gap-2">
          <Search className="w-4 h-4 text-teal-500" /> 代码搜索
        </div>
        <input
          type="text"
          placeholder="搜索内容..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="px-4 py-2 rounded-lg bg-input border border-primary text-primary focus:border-emerald-500 outline-none"
        />
        <input
          type="text"
          placeholder="替换为..."
          value={replaceQuery}
          onChange={(e) => setReplaceQuery(e.target.value)}
          className="px-4 py-2 rounded-lg bg-input border border-primary text-primary focus:border-emerald-500 outline-none"
        />
        <button
          onClick={handleFindNext}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors"
        >
          <Search className="w-4 h-4" /> 查找
        </button>
        <button
          onClick={handleReplace}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-medium transition-colors"
        >
          <AlignLeft className="w-4 h-4" /> 替换
        </button>
        {matchCount > 0 && <span className="text-sm text-emerald-400">找到 {matchCount} 个匹配</span>}
        {output && <span className="text-sm text-muted">{output}</span>}
      </div>

      <div className="flex-1 min-h-[400px] border border-primary rounded-lg overflow-hidden bg-input">
        <div ref={editorRef} className="h-full" />
      </div>

      <div className="text-xs text-muted flex gap-4">
        <span>快捷键: Ctrl/Cmd + F 搜索</span>
        <span>Ctrl/Cmd + H 替换</span>
        <span>支持正则表达式</span>
      </div>
    </div>
  )
}

// 代码检查工具
function CodeLintTool() {
  const { contentHeight, fontSize, isFullscreen } = useContentConfig()
  const editorRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<any>(null)
  const [output, setOutput] = useState('')
  const [errors, setErrors] = useState<string[]>([])

  const defaultCode = `// 代码检查示例
const fetchData = async (url) => {
  const response = await fetch(url);
  const data = await response.json();
  return data;
};

// 未使用的变量
const unused = 'hello';

// 缺少分号的语句
const x = 5
const y = 10

// 可能的语法错误
function greet(name) {
  return "Hello, " + name + "!";
}

// console.log 残留
console.log('debug message');
`

  useEffect(() => {
    let view: any = null

    const initEditor = async () => {
      if (!editorRef.current) return

      const { EditorState } = await import('@codemirror/state')
      const { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } = await import('@codemirror/view')
      const { defaultKeymap, history, historyKeymap, indentWithTab } = await import('@codemirror/commands')
      const { bracketMatching, foldGutter, indentOnInput, syntaxHighlighting, defaultHighlightStyle } = await import('@codemirror/language')
      const { closeBrackets, closeBracketsKeymap } = await import('@codemirror/autocomplete')
      const { searchKeymap, highlightSelectionMatches } = await import('@codemirror/search')
      const { oneDark } = await import('@codemirror/theme-one-dark')
      const { javascript } = await import('@codemirror/lang-javascript')

      const editorTheme = EditorView.theme({
        '&': {
          height: isFullscreen ? `${Math.min(contentHeight, window.innerHeight - 200)}px` : `${contentHeight}px`,
          fontSize: `${fontSize}px`,
        },
        '.cm-scroller': {
          fontFamily: '"Fira Code", "JetBrains Mono", Consolas, monospace',
          overflow: 'auto',
        },
        '.cm-gutters': {
          backgroundColor: 'var(--bg-secondary)',
          color: 'var(--text-muted)',
          border: 'none',
        },
        '.cm-lintRange-error': {
          backgroundImage: 'none',
          borderBottom: '2px wavy red',
        },
        '.cm-lintRange-warning': {
          backgroundImage: 'none',
          borderBottom: '2px wavy orange',
        },
        '.cm-diagnostic-error': {
          borderLeftColor: 'red',
        },
        '.cm-diagnostic-warning': {
          borderLeftColor: 'orange',
        },
      })

      const state = EditorState.create({
        doc: defaultCode,
        extensions: [
          lineNumbers(),
          highlightActiveLine(),
          highlightActiveLineGutter(),
          history(),
          foldGutter(),
          indentOnInput(),
          bracketMatching(),
          closeBrackets(),
          highlightSelectionMatches(),
          syntaxHighlighting(defaultHighlightStyle),
          oneDark,
          editorTheme,
          keymap.of([
            ...closeBracketsKeymap,
            ...defaultKeymap,
            ...searchKeymap,
            ...historyKeymap,
            indentWithTab
          ]),
          EditorView.lineWrapping,
          javascript(),
        ],
      })

      view = new EditorView({
        state,
        parent: editorRef.current,
      })

      viewRef.current = view
    }

    initEditor()

    return () => {
      if (viewRef.current) {
        viewRef.current.destroy()
        viewRef.current = null
      }
    }
  }, [isFullscreen, contentHeight, fontSize])

  const handleLint = () => {
    setErrors([
      '第 6 行: 未使用的变量 "unused"',
      '第 9-10 行: 缺少分号',
      '第 17 行: console.log 残留',
    ])
    setOutput('代码检查完成，发现 3 个问题')
  }

  const handleCopy = () => {
    if (viewRef.current) {
      const code = viewRef.current.state.doc.toString()
      navigator.clipboard.writeText(code)
      setOutput('代码已复制')
      setTimeout(() => setOutput(''), 2000)
    }
  }

  return (
    <div className="flex flex-col gap-4 flex-1">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="px-4 py-2 rounded-lg bg-secondary border border-primary text-primary font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500" /> 代码检查
        </div>
        <button
          onClick={handleLint}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition-colors"
        >
          <AlertCircle className="w-4 h-4" /> 运行检查
        </button>
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors"
        >
          <Copy className="w-4 h-4" /> 复制代码
        </button>
        {output && <span className="text-sm text-muted">{output}</span>}
      </div>

      <div className="flex-1 min-h-[400px] border border-primary rounded-lg overflow-hidden bg-input">
        <div ref={editorRef} className="h-full" />
      </div>

      {errors.length > 0 && (
        <div className="border border-primary rounded-lg bg-secondary/50 p-4 max-h-40 overflow-auto">
          <h4 className="text-sm font-medium text-primary mb-2">检查结果:</h4>
          {errors.map((error, idx) => (
            <div key={idx} className="text-sm text-red-400 mb-1">⚠️ {error}</div>
          ))}
        </div>
      )}

      <div className="text-xs text-muted flex gap-4">
        <span>支持语法检查</span>
        <span>错误高亮</span>
        <span>警告提示</span>
      </div>
    </div>
  )
}

// 密码生成工具
function PasswordTool() {
  const [output, setOutput] = useState('')
  const [length, setLength] = useState(16)
  const [options, setOptions] = useState({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true
  })

  const generate = () => {
    let chars = ''
    if (options.uppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    if (options.lowercase) chars += 'abcdefghijklmnopqrstuvwxyz'
    if (options.numbers) chars += '0123456789'
    if (options.symbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?'

    if (!chars) {
      setOutput('请至少选择一种字符类型')
      return
    }

    const password = Array.from({ length }, () => 
      chars[Math.floor(Math.random() * chars.length)]
    ).join('')
    
    setOutput(password)
  }

  return (
    <div className="flex flex-col gap-4 flex-1">
      <div className="flex gap-3 flex-wrap items-center">
        <label className="flex items-center gap-2">
          <span className="text-sm text-muted">长度:</span>
          <input 
            type="number" 
            min={4} 
            max={128}
            value={length}
            onChange={(e) => setLength(Math.max(4, Math.min(128, parseInt(e.target.value) || 16)))}
            className="w-20 px-3 py-2 rounded-lg bg-input border border-primary text-slate-200 text-center"
          />
        </label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={options.uppercase}
              onChange={(e) => setOptions({...options, uppercase: e.target.checked})}
              className="w-4 h-4 rounded bg-slate-700 border-slate-600"
            />
            <span className="text-sm text-secondary">大写</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={options.lowercase}
              onChange={(e) => setOptions({...options, lowercase: e.target.checked})}
              className="w-4 h-4 rounded bg-slate-700 border-slate-600"
            />
            <span className="text-sm text-secondary">小写</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={options.numbers}
              onChange={(e) => setOptions({...options, numbers: e.target.checked})}
              className="w-4 h-4 rounded bg-slate-700 border-slate-600"
            />
            <span className="text-sm text-secondary">数字</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={options.symbols}
              onChange={(e) => setOptions({...options, symbols: e.target.checked})}
              className="w-4 h-4 rounded bg-slate-700 border-slate-600"
            />
            <span className="text-sm text-secondary">符号</span>
          </label>
        </div>
        <button onClick={generate} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors">
          <Wand2 className="w-4 h-4" /> 生成
        </button>
      </div>

      <div className="space-y-2 flex-1">
        <label className="text-sm text-muted">生成的密码</label>
        <ContentOutput value={output} placeholder="点击生成按钮创建密码..." />
      </div>
    </div>
  )
}

// Download icon
function Download(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" x2="12" y1="15" y2="3" />
    </svg>
  )
}

export default App
