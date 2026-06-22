import { useState } from 'react'
import { Layers, ShieldCheck, Clock } from 'lucide-react'
import { ContentTextarea } from '@/components/shared/ContentTextarea'
import { ContentOutput } from '@/components/shared/ContentOutput'

function b64urlDecode(s: string): string {
  // base64url -> base64
  const pad = '='.repeat((4 - (s.length % 4)) % 4)
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + pad
  // 处理中文
  try {
    const binary = atob(b64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    return new TextDecoder('utf-8').decode(bytes)
  } catch {
    return atob(b64)
  }
}

function b64urlEncode(s: string): string {
  const bytes = new TextEncoder().encode(s)
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!)
  return btoa(bin).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

async function verifyHs256(token: string, secret: string): Promise<{ valid: boolean; reason: string }> {
  const parts = token.split('.')
  if (parts.length !== 3) return { valid: false, reason: 'JWT 格式错误（需要 3 段）' }
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  )
  const data = enc.encode(parts[0] + '.' + parts[1])
  const signature = await crypto.subtle.sign('HMAC', key, data)
  const expected = new Uint8Array(signature)
  // 解码 signature
  const sigB64 = parts[2]!.replace(/-/g, '+').replace(/_/g, '/')
  const pad = '='.repeat((4 - (sigB64.length % 4)) % 4)
  const sigBin = atob(sigB64 + pad)
  const actual = new Uint8Array(sigBin.length)
  for (let i = 0; i < sigBin.length; i++) actual[i] = sigBin.charCodeAt(i)
  if (expected.length !== actual.length) return { valid: false, reason: '签名长度不匹配' }
  // constant time 比较
  let diff = 0
  for (let i = 0; i < expected.length; i++) diff |= (expected[i]! ^ actual[i]!)
  return { valid: diff === 0, reason: diff === 0 ? '签名验证通过 ✓' : '签名验证失败（密钥错误或 token 被篡改）' }
}

export function JwtTool() {
  const [input, setInput] = useState('')
  const [secret, setSecret] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [verifyStatus, setVerifyStatus] = useState<{ valid: boolean; reason: string } | null>(null)

  const decode = () => {
    if (!input.trim()) {
      setError('请输入 JWT Token')
      setOutput('')
      return
    }
    try {
      const parts = input.split('.')
      if (parts.length !== 3) {
        setError('无效的 JWT 格式（需要 3 段，header.payload.signature）')
        setOutput('')
        setVerifyStatus(null)
        return
      }

      const headerStr = b64urlDecode(parts[0]!)
      const payloadStr = b64urlDecode(parts[1]!)
      const header = JSON.parse(headerStr)
      const payload = JSON.parse(payloadStr)

      // 过期时间检查
      let expiryInfo = ''
      if (typeof payload.exp === 'number') {
        const expDate = new Date(payload.exp * 1000)
        const now = Date.now()
        const expired = now > payload.exp * 1000
        expiryInfo = `\n过期时间 (exp): ${expDate.toISOString()} ${expired ? '⚠️ 已过期' : '✓ 有效'}`
      }
      if (typeof payload.iat === 'number') {
        const iatDate = new Date(payload.iat * 1000)
        expiryInfo += `\n签发时间 (iat): ${iatDate.toISOString()}`
      }
      if (typeof payload.nbf === 'number') {
        const nbfDate = new Date(payload.nbf * 1000)
        expiryInfo += `\n生效时间 (nbf): ${nbfDate.toISOString()}`
      }

      setOutput(
        `Header:\n${JSON.stringify(header, null, 2)}\n\n` +
          `Payload:\n${JSON.stringify(payload, null, 2)}` +
          (expiryInfo ? '\n' + expiryInfo : ''),
      )
      setError('')
      setVerifyStatus(null)
    } catch {
      setError('解码失败，请检查 JWT 格式')
      setOutput('')
      setVerifyStatus(null)
    }
  }

  const verifySignature = async () => {
    if (!input.trim()) {
      setError('请输入 JWT Token')
      return
    }
    if (!secret) {
      setError('请输入密钥（HS256）')
      return
    }
    try {
      const result = await verifyHs256(input, secret)
      setVerifyStatus(result)
      setError('')
    } catch (e) {
      setError('验证失败: ' + (e as Error).message)
      setVerifyStatus(null)
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 flex-1 h-full">
      {/* 左侧输入区域 */}
      <div className="flex-1 flex flex-col gap-3 min-w-0">
        <label className="text-sm text-muted">输入 JWT Token</label>
        <div className="flex-1 min-h-[180px]">
          <ContentTextarea
            value={input}
            onChange={setInput}
            placeholder="粘贴 JWT Token (格式: header.payload.signature)"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-muted">HS256 密钥（用于签名验证）</label>
          <input
            type="text"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="输入 HMAC 密钥..."
            className="w-full px-4 py-2 rounded-lg bg-input border border-primary text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
          />
        </div>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={decode}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors"
          >
            <Layers className="w-4 h-4" /> 解码
          </button>
          <button
            onClick={verifySignature}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors"
          >
            <ShieldCheck className="w-4 h-4" /> 验证签名
          </button>
        </div>
        {error && <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-sm">{error}</div>}
        {verifyStatus && (
          <div
            className={`p-3 rounded-lg border text-sm flex items-center gap-2 ${
              verifyStatus.valid
                ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                : 'bg-red-500/20 border-red-500/30 text-red-400'
            }`}
          >
            <Clock className="w-4 h-4" /> {verifyStatus.reason}
          </div>
        )}
      </div>

      {/* 右侧输出区域 */}
      <div className="flex-1 flex flex-col gap-3 min-w-0">
        <label className="text-sm text-muted">解码结果</label>
        <div className="flex-1">
          <ContentOutput value={output} />
        </div>
      </div>
    </div>
  )
}
