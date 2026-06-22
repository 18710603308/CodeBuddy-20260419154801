import { useState } from 'react'
import { Hash } from 'lucide-react'
import { ContentTextarea } from '@/components/shared/ContentTextarea'
import { ContentOutput } from '@/components/shared/ContentOutput'

/**
 * 纯 JS MD5 实现（Web Crypto 不支持 MD5）
 * 来源: RFC 1321 经典实现
 */
function md5(input: string): string {
  function rh(n: number) {
    let j: number, s = ''
    for (j = 0; j <= 3; j++) s += (((n >> (j * 8 + 4)) & 0x0f).toString(16) + ((n >> (j * 8)) & 0x0f).toString(16))
    return s
  }
  function ad(x: number, y: number) {
    const l = (x & 0xffff) + (y & 0xffff)
    const m = (x >> 16) + (y >> 16) + (l >> 16)
    return (m << 16) | (l & 0xffff)
  }
  function rl(n: number, c: number) { return (n << c) | (n >>> (32 - c)) }
  function cm(q: number, a: number, b: number, x: number, s: number, t: number) { return ad(rl(ad(ad(a, q), ad(x, t)), s), b) }
  function ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number) { return cm((b & c) | (~b & d), a, b, x, s, t) }
  function gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number) { return cm((b & d) | (c & ~d), a, b, x, s, t) }
  function hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number) { return cm(b ^ c ^ d, a, b, x, s, t) }
  function ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number) { return cm(c ^ (b | ~d), a, b, x, s, t) }
  function cv(s: string) {
    const n = s.length
    const w: number[] = []
    for (let i = 0; i < 64; i += 4) {
      const j = (s.charCodeAt(i / 4) || 0) * (i % 8 < 4 ? 0x1000000 : 1)
      w[i >> 2] = (w[i >> 2] || 0) | j
    }
    w[n >> 2] = (w[n >> 2] || 0) | (0x80 << ((n % 4) * 8))
    w[(((n + 8) >> 6) + 1) * 16 - 2] = n * 8
    return w
  }
  const sb = cv(input)
  let a = 1732584193, b = -271733879, c = -1732584194, d = 271733878
  for (let i = 0; i < sb.length; i += 16) {
    const oa = a, ob = b, oc = c, od = d
    a = ff(a, b, c, d, sb[i + 0]!, 7, -680876936)
    d = ff(d, a, b, c, sb[i + 1]!, 12, -389564586)
    c = ff(c, d, a, b, sb[i + 2]!, 17, 606105819)
    b = ff(b, c, d, a, sb[i + 3]!, 22, -1044525330)
    a = ff(a, b, c, d, sb[i + 4]!, 7, -176418897)
    d = ff(d, a, b, c, sb[i + 5]!, 12, 1200080426)
    c = ff(c, d, a, b, sb[i + 6]!, 17, -1473231341)
    b = ff(b, c, d, a, sb[i + 7]!, 22, -45705983)
    a = ff(a, b, c, d, sb[i + 8]!, 7, 1770035416)
    d = ff(d, a, b, c, sb[i + 9]!, 12, -1958414417)
    c = ff(c, d, a, b, sb[i + 10]!, 17, -42063)
    b = ff(b, c, d, a, sb[i + 11]!, 22, -1990404162)
    a = ff(a, b, c, d, sb[i + 12]!, 7, 1804603682)
    d = ff(d, a, b, c, sb[i + 13]!, 12, -40341101)
    c = ff(c, d, a, b, sb[i + 14]!, 17, -1502002290)
    b = ff(b, c, d, a, sb[i + 15]!, 22, 1236535329)
    a = gg(a, b, c, d, sb[i + 1]!, 5, -165796510)
    d = gg(d, a, b, c, sb[i + 6]!, 9, -1069501632)
    c = gg(c, d, a, b, sb[i + 11]!, 14, 643717713)
    b = gg(b, c, d, a, sb[i + 0]!, 20, -373897302)
    a = gg(a, b, c, d, sb[i + 5]!, 5, -701558691)
    d = gg(d, a, b, c, sb[i + 10]!, 9, 38016083)
    c = gg(c, d, a, b, sb[i + 15]!, 14, -660478335)
    b = gg(b, c, d, a, sb[i + 4]!, 20, -405537848)
    a = gg(a, b, c, d, sb[i + 9]!, 5, 568446438)
    d = gg(d, a, b, c, sb[i + 14]!, 9, -1019803690)
    c = gg(c, d, a, b, sb[i + 3]!, 14, -187363961)
    b = gg(b, c, d, a, sb[i + 8]!, 20, 1163531501)
    a = gg(a, b, c, d, sb[i + 13]!, 5, -1444681467)
    d = gg(d, a, b, c, sb[i + 2]!, 9, -51403784)
    c = gg(c, d, a, b, sb[i + 7]!, 14, 1735328473)
    b = gg(b, c, d, a, sb[i + 12]!, 20, -1926607734)
    a = hh(a, b, c, d, sb[i + 5]!, 4, -378558)
    d = hh(d, a, b, c, sb[i + 8]!, 11, -2022574463)
    c = hh(c, d, a, b, sb[i + 11]!, 16, 1839030562)
    b = hh(b, c, d, a, sb[i + 14]!, 23, -35309556)
    a = hh(a, b, c, d, sb[i + 1]!, 4, -1530992060)
    d = hh(d, a, b, c, sb[i + 4]!, 11, 1272893353)
    c = hh(c, d, a, b, sb[i + 7]!, 16, -155497632)
    b = hh(b, c, d, a, sb[i + 10]!, 23, -1094730640)
    a = hh(a, b, c, d, sb[i + 13]!, 4, 681279174)
    d = hh(d, a, b, c, sb[i + 0]!, 11, -358537222)
    c = hh(c, d, a, b, sb[i + 3]!, 16, -722521979)
    b = hh(b, c, d, a, sb[i + 6]!, 23, 76029189)
    a = hh(a, b, c, d, sb[i + 9]!, 4, -640364487)
    d = hh(d, a, b, c, sb[i + 12]!, 11, -421815835)
    c = hh(c, d, a, b, sb[i + 15]!, 16, 530742520)
    b = hh(b, c, d, a, sb[i + 2]!, 23, -995338651)
    a = ii(a, b, c, d, sb[i + 0]!, 6, -198630844)
    d = ii(d, a, b, c, sb[i + 7]!, 10, 1126891415)
    c = ii(c, d, a, b, sb[i + 14]!, 15, -1416354905)
    b = ii(b, c, d, a, sb[i + 5]!, 21, -57434055)
    a = ii(a, b, c, d, sb[i + 12]!, 6, 1700485571)
    d = ii(d, a, b, c, sb[i + 3]!, 10, -1894986606)
    c = ii(c, d, a, b, sb[i + 10]!, 15, -1051523)
    b = ii(b, c, d, a, sb[i + 1]!, 21, -2054922799)
    a = ii(a, b, c, d, sb[i + 8]!, 6, 1873313359)
    d = ii(d, a, b, c, sb[i + 15]!, 10, -30611744)
    c = ii(c, d, a, b, sb[i + 6]!, 15, -1560198380)
    b = ii(b, c, d, a, sb[i + 13]!, 21, 1309151649)
    a = ii(a, b, c, d, sb[i + 4]!, 6, -145523070)
    d = ii(d, a, b, c, sb[i + 11]!, 10, -1120210379)
    c = ii(c, d, a, b, sb[i + 2]!, 15, 718787259)
    b = ii(b, c, d, a, sb[i + 9]!, 21, -343485551)
    a = ad(a, oa); b = ad(b, ob); c = ad(c, oc); d = ad(d, od)
  }
  return rh(a) + rh(b) + rh(c) + rh(d)
}

/**
 * 纯 JS SHA-1 实现（Web Crypto 不支持 SHA-1）
 */
function sha1(input: string): string {
  function rotl(x: number, n: number) { return (x << n) | (x >>> (32 - n)) }
  const enc = new TextEncoder()
  const bytes = enc.encode(input)
  const len = bytes.length
  const wordLen = (((len + 8) >> 6) + 1) << 4
  const words = new Array(wordLen).fill(0)
  for (let i = 0; i < len; i++) words[i >> 2] = (words[i >> 2] || 0) | (bytes[i]! << ((3 - (i % 4)) * 8))
  words[len >> 2] = (words[len >> 2] || 0) | (0x80 << ((3 - (len % 4)) * 8))
  words[wordLen - 1] = len * 8
  let h0 = 0x67452301, h1 = 0xefcdab89, h2 = 0x98badcfe, h3 = 0x10325476, h4 = 0xc3d2e1f0
  for (let i = 0; i < words.length; i += 16) {
    const w = new Array(80).fill(0)
    for (let j = 0; j < 16; j++) w[j] = words[i + j] || 0
    for (let j = 16; j < 80; j++) w[j] = rotl(w[j - 3]! ^ w[j - 8]! ^ w[j - 14]! ^ w[j - 16]!, 1)
    let a = h0, b = h1, c = h2, d = h3, e = h4
    for (let j = 0; j < 80; j++) {
      let f: number, k: number
      if (j < 20) { f = (b & c) | (~b & d); k = 0x5a827999 }
      else if (j < 40) { f = b ^ c ^ d; k = 0x6ed9eba1 }
      else if (j < 60) { f = (b & c) | (b & d) | (c & d); k = 0x8f1bbcdc }
      else { f = b ^ c ^ d; k = 0xca62c1d6 }
      const t = (rotl(a, 5) + f + e + k + w[j]!) | 0
      e = d; d = c; c = rotl(b, 30); b = a; a = t
    }
    h0 = (h0 + a) | 0; h1 = (h1 + b) | 0; h2 = (h2 + c) | 0; h3 = (h3 + d) | 0; h4 = (h4 + e) | 0
  }
  function toHex(n: number) {
    let s = ''
    for (let i = 7; i >= 0; i--) s += ((n >> (i * 4)) & 0xf).toString(16)
    return s
  }
  return toHex(h0) + toHex(h1) + toHex(h2) + toHex(h3) + toHex(h4)
}

async function shaViaWebCrypto(algo: 'SHA-256' | 'SHA-384' | 'SHA-512', input: string): Promise<string> {
  const enc = new TextEncoder()
  const buf = await crypto.subtle.digest(algo, enc.encode(input))
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export function HashTool() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [algorithm, setAlgorithm] = useState('SHA-256')

  const generate = async () => {
    try {
      let hash = ''
      if (algorithm === 'MD5') {
        hash = md5(input)
      } else if (algorithm === 'SHA-1') {
        hash = sha1(input)
      } else if (algorithm === 'SHA-256' || algorithm === 'SHA-384' || algorithm === 'SHA-512') {
        hash = await shaViaWebCrypto(algorithm, input)
      }
      setOutput(hash)
    } catch {
      setOutput('错误：无法计算 Hash')
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 flex-1 h-full">
      {/* 左侧输入区域 */}
      <div className="flex-1 flex flex-col gap-3 min-w-0">
        <label className="text-sm text-muted">输入内容</label>
        <div className="flex-1">
          <ContentTextarea value={input} onChange={setInput} placeholder="输入要加密的内容..." />
        </div>
        <div className="flex gap-3 flex-wrap items-center">
          <select
            value={algorithm}
            onChange={(e) => setAlgorithm(e.target.value)}
            className="px-4 py-2 rounded-lg bg-input border border-primary text-slate-200"
          >
            <option value="MD5">MD5</option>
            <option value="SHA-1">SHA-1</option>
            <option value="SHA-256">SHA-256</option>
            <option value="SHA-384">SHA-384</option>
            <option value="SHA-512">SHA-512</option>
          </select>
          <button onClick={generate} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors">
            <Hash className="w-4 h-4" /> 生成
          </button>
        </div>
      </div>

      {/* 右侧输出区域 */}
      <div className="flex-1 flex flex-col gap-3 min-w-0">
        <label className="text-sm text-muted">{algorithm} 结果（{output.length} 字符）</label>
        <div className="flex-1">
          <ContentOutput value={output} />
        </div>
      </div>
    </div>
  )
}
