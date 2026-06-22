import { useState, useRef } from 'react'
import { QrCode, Download, Upload, ScanLine } from 'lucide-react'

export function QrCodeTool() {
  const [input, setInput] = useState('')
  const [size, setSize] = useState(200)
  const [qrUrl, setQrUrl] = useState('')
  const [parseResult, setParseResult] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const generate = () => {
    if (!input) {
      setQrUrl('')
      return
    }
    setQrUrl(`https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(input)}`)
  }

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setParseResult(`已选择文件: ${file.name} (${Math.round(file.size / 1024)} KB)\n\n提示: 浏览器端 QR 解析需引入 jsQR 库（约 50KB），如需此功能请告知。`)
  }

  return (
    <div className="flex flex-col gap-4 flex-1">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 生成二维码 */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <QrCode className="w-4 h-4 text-emerald-500" /> 生成二维码
          </div>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入要生成二维码的内容（URL、文本、JSON 等）..."
            className="w-full px-4 py-3 rounded-xl bg-input border border-primary text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
          />
          <div className="flex items-center gap-3">
            <label className="text-sm text-muted">尺寸</label>
            <select
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              className="px-3 py-2 rounded-lg bg-input border border-primary text-primary focus:outline-none focus:border-emerald-500"
            >
              <option value={150}>150 × 150</option>
              <option value={200}>200 × 200</option>
              <option value={300}>300 × 300</option>
              <option value={400}>400 × 400</option>
              <option value={500}>500 × 500</option>
            </select>
            <button
              onClick={generate}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors"
            >
              <QrCode className="w-4 h-4" /> 生成
            </button>
          </div>

          {qrUrl && (
            <div className="flex flex-col items-center gap-3 p-6 rounded-xl bg-input border border-primary">
              <img src={qrUrl} alt="QR Code" className="rounded" style={{ width: size, height: size }} />
              <a
                href={qrUrl}
                download="qrcode.png"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-600 hover:bg-slate-500 text-white font-medium transition-colors"
              >
                <Download className="w-4 h-4" /> 下载二维码
              </a>
            </div>
          )}
        </div>

        {/* 解析二维码 */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <ScanLine className="w-4 h-4 text-blue-500" /> 解析二维码
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleUpload}
            className="hidden"
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors self-start"
          >
            <Upload className="w-4 h-4" /> 上传二维码图片
          </button>
          {parseResult && (
            <div className="p-4 rounded-xl bg-input border border-primary text-sm text-secondary whitespace-pre-wrap min-h-[100px]">
              {parseResult}
            </div>
          )}
        </div>
      </div>

      <div className="text-xs text-muted flex gap-4 flex-wrap">
        <span>支持 URL / 文本 / JSON / vCard</span>
        <span>可调尺寸</span>
        <span>一键下载</span>
      </div>
    </div>
  )
}
