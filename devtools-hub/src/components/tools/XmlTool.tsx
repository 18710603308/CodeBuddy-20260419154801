import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { ContentTextarea } from '@/components/shared/ContentTextarea'
import { XmlHighlightedOutput } from './XmlHighlightedOutput'
import { AlignLeft, Minimize2, ShieldCheck } from 'lucide-react'

export function XmlTool() {
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

  const minifyXml = () => {
    if (!input.trim()) {
      setError('请输入 XML 内容')
      setOutput('')
      return
    }
    try {
      const xml = input.replace(/^\uFEFF/, '').trim()
      const minified = xml
        .replace(/>\s+</g, '><')
        .replace(/\s+/g, ' ')
        .replace(/>\s+</g, '><')
        .trim()
      setOutput(minified)
      setError('')
    } catch (e) {
      setError(`XML 压缩失败: ${(e as Error).message}`)
      setOutput('')
    }
  }

  const validateXml = () => {
    if (!input.trim()) {
      setError('请输入 XML 内容')
      setOutput('')
      return
    }
    try {
      const xml = input.replace(/^\uFEFF/, '').trim()
      // 浏览器原生 DOMParser 校验
      const doc = new DOMParser().parseFromString(xml, 'application/xml')
      const errNode = doc.getElementsByTagName('parsererror')[0]
      if (errNode) {
        setError(`XML 校验失败: ${errNode.textContent || '语法错误'}`)
        setOutput('')
        return
      }
      // 统计信息
      const allElements = doc.getElementsByTagName('*')
      const root = doc.documentElement
      const summary = `✓ XML 校验通过\n根元素: <${root.nodeName}>\n元素总数: ${allElements.length}\n属性总数: ${Array.from(allElements).reduce((s, el) => s + el.attributes.length, 0)}`
      setOutput(summary)
      setError('')
    } catch (e) {
      setError(`XML 校验失败: ${(e as Error).message}`)
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
    <div className="flex flex-col lg:flex-row gap-4 flex-1 h-full">
      {/* 左侧输入区域 */}
      <div className="flex-1 flex flex-col gap-3 min-w-0">
        <label className="text-sm text-muted">输入 XML</label>
        <div className="flex gap-3 flex-wrap">
          <button onClick={formatXml} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors">
            <AlignLeft className="w-4 h-4" /> 美化
          </button>
          <button onClick={minifyXml} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-medium transition-colors">
            <Minimize2 className="w-4 h-4" /> 压缩
          </button>
          <button onClick={validateXml} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors">
            <ShieldCheck className="w-4 h-4" /> 校验
          </button>
        </div>
        <div className="flex-1">
          <ContentTextarea value={input} onChange={setInput} placeholder="粘贴 XML 数据..." />
        </div>
        {error && <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-sm">{error}</div>}
      </div>

      {/* 右侧输出区域 */}
      <div className="flex-1 flex flex-col gap-3 min-w-0">
        <label className="text-sm text-muted">输出结果（语法高亮）</label>
        {/* 占位区域，与左侧按钮组同高，保持视觉对称 */}
        <div className="h-[42px]" />
        <div className="flex-1">
          <XmlHighlightedOutput xml={output} />
        </div>
      </div>
    </div>
  )
}
