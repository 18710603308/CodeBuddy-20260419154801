import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { useContentConfig } from '@/contexts/ContentConfigContext'

export function XmlHighlightedOutput({ xml }: { xml: string }) {
  const { contentHeight, fontSize, isFullscreen } = useContentConfig()
  const [copied, setCopied] = useState(false)
  const height = isFullscreen ? Math.min(contentHeight, window.innerHeight - 200) : contentHeight

  const copyOutput = async () => {
    await navigator.clipboard.writeText(xml)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const escapeHtml = (str: string) => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
  }

  const parseTag = (tag: string): string => {
    if (tag.startsWith('<!--')) {
      return `<span class="xml-comment">${escapeHtml(tag)}</span>`
    }
    if (tag.startsWith('<?') || tag.startsWith('<!')) {
      return `<span class="xml-declaration">${escapeHtml(tag)}</span>`
    }
    if (tag.startsWith('</')) {
      const name = tag.slice(2, -1)
      return `&lt;/<span class="xml-tag">${escapeHtml(name)}</span>&gt;`
    }
    if (tag.endsWith('/>')) {
      const inner = tag.slice(1, -2)
      return `&lt;${highlightAttrs(inner)}<span class="xml-bracket">/&gt;</span>`
    }
    const inner = tag.slice(1, -1)
    return `&lt;${highlightAttrs(inner)}&gt;`
  }

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

  const highlightXml = (str: string): string => {
    if (!str) return ''

    return str.split('\n').map(line => {
      let result = ''
      let i = 0

      while (i < line.length) {
        if (line[i] === '<') {
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
