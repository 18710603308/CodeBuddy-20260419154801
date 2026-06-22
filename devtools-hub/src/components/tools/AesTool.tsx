import { useState } from 'react'
import { Lock } from 'lucide-react'
import { ContentTextarea } from '@/components/shared/ContentTextarea'
import { ContentOutput } from '@/components/shared/ContentOutput'

/**
 * AES-CBC 加解密（Web Crypto API）
 * 密钥：使用 SHA-256 把用户输入的密码派生为 32 字节 AES-256 密钥
 * IV：从密文前缀读取（前 16 字节），解密时用之
 * 编码：每次随机生成 IV，输出 base64 = base64(IV || ciphertext)
 */
async function deriveKey(password: string): Promise<CryptoKey> {
  const enc = new TextEncoder()
  const material = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey'],
  )
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: enc.encode('devtools-hub-aes-salt'),
      iterations: 100000,
      hash: 'SHA-256',
    },
    material,
    { name: 'AES-CBC', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

function bytesToBase64(bytes: Uint8Array): string {
  let s = ''
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i])
  return btoa(s)
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

export function AesTool() {
  const [input, setInput] = useState('')
  const [key, setKey] = useState('')
  const [output, setOutput] = useState('')
  const [mode, setMode] = useState<'encrypt' | 'decrypt'>('encrypt')
  const [busy, setBusy] = useState(false)

  const process = async () => {
    if (!key) {
      setOutput('错误：请输入密钥')
      return
    }
    if (!input) {
      setOutput('错误：请输入要加密/解密的内容')
      return
    }
    setBusy(true)
    setOutput('处理中...')
    try {
      const cryptoKey = await deriveKey(key)
      if (mode === 'encrypt') {
        const enc = new TextEncoder()
        const iv = crypto.getRandomValues(new Uint8Array(16))
        const data = enc.encode(input)
        const cipherBuf = await crypto.subtle.encrypt({ name: 'AES-CBC', iv }, cryptoKey, data)
        const cipherBytes = new Uint8Array(cipherBuf)
        const out = new Uint8Array(iv.length + cipherBytes.length)
        out.set(iv, 0)
        out.set(cipherBytes, iv.length)
        setOutput(bytesToBase64(out))
      } else {
        const all = base64ToBytes(input.trim())
        if (all.length < 17) {
          setOutput('错误：密文格式错误（至少需要 16 字节 IV + 1 字节数据）')
          return
        }
        const iv = all.slice(0, 16)
        const cipher = all.slice(16)
        const plainBuf = await crypto.subtle.decrypt({ name: 'AES-CBC', iv }, cryptoKey, cipher)
        setOutput(new TextDecoder().decode(plainBuf))
      }
    } catch (e) {
      const msg = (e as Error).message
      if (mode === 'decrypt' && /decrypt|operation failed/i.test(msg)) {
        setOutput('错误：解密失败（密钥错误或密文已损坏）')
      } else {
        setOutput('错误：' + msg)
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 flex-1 h-full">
      {/* 左侧输入区域 */}
      <div className="flex-1 flex flex-col gap-3 min-w-0">
        <div className="space-y-2">
          <label className="text-sm text-muted">密钥（任意字符串，内部用 PBKDF2 派生 256 位 AES 密钥）</label>
          <input
            type="text"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="输入加密密钥..."
            className="w-full px-4 py-3 rounded-xl bg-input border border-primary text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex-1">
          <label className="text-sm text-muted block mb-2">输入内容</label>
          <ContentTextarea
            value={input}
            onChange={setInput}
            placeholder={mode === 'encrypt' ? '输入要加密的明文...' : '输入 base64 密文（含 IV 前缀）...'}
          />
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
          <button
            onClick={process}
            disabled={busy}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-medium transition-colors"
          >
            <Lock className="w-4 h-4" /> {busy ? '处理中...' : mode === 'encrypt' ? '加密' : '解密'}
          </button>
        </div>
      </div>

      {/* 右侧输出区域 */}
      <div className="flex-1 flex flex-col gap-3 min-w-0">
        <label className="text-sm text-muted">输出结果（base64）</label>
        <div className="flex-1">
          <ContentOutput value={output} />
        </div>
      </div>
    </div>
  )
}
