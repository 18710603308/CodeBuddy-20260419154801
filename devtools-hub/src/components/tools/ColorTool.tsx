import { useState, useMemo } from 'react'
import { ArrowRightLeft, Wand2, Shuffle } from 'lucide-react'
import { ContentOutput } from '@/components/shared/ContentOutput'

interface ColorObj {
  hex: string
  rgb: { r: number; g: number; b: number; a: number }
  hsl: { h: number; s: number; l: number; a: number }
}

function clamp(n: number, min = 0, max = 255) {
  return Math.min(max, Math.max(min, n))
}

function hexToRgb(hex: string): { r: number; g: number; b: number; a: number } | null {
  let h = hex.trim().replace(/^#/, '')
  if (/^[0-9a-fA-F]{3}$/.test(h)) h = h.split('').map((c) => c + c).join('')
  if (/^[0-9a-fA-F]{4}$/.test(h)) {
    h = h
      .split('')
      .map((c, i) => (i === 3 ? c + c : c + c))
      .join('')
  }
  if (/^[0-9a-fA-F]{6}$/.test(h)) {
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
      a: 1,
    }
  }
  if (/^[0-9a-fA-F]{8}$/.test(h)) {
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
      a: parseInt(h.slice(6, 8), 16) / 255,
    }
  }
  return null
}

function rgbToHex(r: number, g: number, b: number): string {
  const c = (n: number) => clamp(Math.round(n)).toString(16).padStart(2, '0')
  return ('#' + c(r) + c(g) + c(b)).toUpperCase()
}

function rgbToHsl(r: number, g: number, b: number) {
  const rN = r / 255, gN = g / 255, bN = b / 255
  const max = Math.max(rN, gN, bN)
  const min = Math.min(rN, gN, bN)
  const l = (max + min) / 2
  let h = 0, s = 0
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === rN) h = ((gN - bN) / d + (gN < bN ? 6 : 0)) / 6
    else if (max === gN) h = ((bN - rN) / d + 2) / 6
    else h = ((rN - gN) / d + 4) / 6
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
}

function hslToRgb(h: number, s: number, l: number) {
  const hN = ((h % 360) + 360) % 360 / 360
  const sN = clamp(s, 0, 100) / 100
  const lN = clamp(l, 0, 100) / 100
  if (sN === 0) {
    const v = Math.round(lN * 255)
    return { r: v, g: v, b: v }
  }
  const q = lN < 0.5 ? lN * (1 + sN) : lN + sN - lN * sN
  const p = 2 * lN - q
  const conv = (t: number) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }
  return {
    r: Math.round(conv(hN + 1 / 3) * 255),
    g: Math.round(conv(hN) * 255),
    b: Math.round(conv(hN - 1 / 3) * 255),
  }
}

/**
 * 解析任意格式：HEX / RGB(...) / RGBA(...) / HSL(...) / HSLA(...)
 */
function parseColor(input: string): ColorObj | null {
  const s = input.trim()
  if (!s) return null
  // HEX
  if (/^#?[0-9a-fA-F]{3,8}$/.test(s)) {
    const rgb = hexToRgb(s)
    if (!rgb) return null
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b)
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b)
    return { hex, rgb, hsl: { ...hsl, a: rgb.a } }
  }
  // RGB / RGBA
  const rgbM = s.match(/^rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/i)
  if (rgbM) {
    const r = clamp(Number(rgbM[1]))
    const g = clamp(Number(rgbM[2]))
    const b = clamp(Number(rgbM[3]))
    const a = rgbM[4] !== undefined ? clamp(Number(rgbM[4]), 0, 1) : 1
    const hex = rgbToHex(r, g, b)
    const hsl = rgbToHsl(r, g, b)
    return { hex, rgb: { r, g, b, a }, hsl: { ...hsl, a } }
  }
  // HSL / HSLA
  const hslM = s.match(/^hsla?\s*\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*(?:,\s*([\d.]+)\s*)?\)$/i)
  if (hslM) {
    const h = Number(hslM[1])
    const sP = Number(hslM[2])
    const lP = Number(hslM[3])
    const a = hslM[4] !== undefined ? clamp(Number(hslM[4]), 0, 1) : 1
    const { r, g, b } = hslToRgb(h, sP, lP)
    const hex = rgbToHex(r, g, b)
    return { hex, rgb: { r, g, b, a }, hsl: { h, s: sP, l: lP, a } }
  }
  return null
}

function formatColor(c: ColorObj): string {
  return (
    `HEX: ${c.hex}\n` +
    `HEX+α: ${c.hex}${Math.round(c.rgb.a * 255).toString(16).padStart(2, '0')}\n` +
    `RGB: rgb(${c.rgb.r}, ${c.rgb.g}, ${c.rgb.b})\n` +
    `RGBA: rgba(${c.rgb.r}, ${c.rgb.g}, ${c.rgb.b}, ${c.rgb.a})\n` +
    `HSL: hsl(${c.hsl.h}, ${c.hsl.s}%, ${c.hsl.l}%)\n` +
    `HSLA: hsla(${c.hsl.h}, ${c.hsl.s}%, ${c.hsl.l}%, ${c.rgb.a})`
  )
}

function randomColor(): string {
  const r = Math.floor(Math.random() * 256)
  const g = Math.floor(Math.random() * 256)
  const b = Math.floor(Math.random() * 256)
  return rgbToHex(r, g, b)
}

function getContrastColor(hex: string): string {
  const rgb = hexToRgb(hex)
  if (!rgb) return '#000'
  const yiq = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000
  return yiq >= 128 ? '#000000' : '#FFFFFF'
}

const PRESETS = [
  '#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6',
  '#1abc9c', '#34495e', '#e67e22', '#16a085', '#c0392b',
  '#8e44ad', '#27ae60', '#2980b9', '#d35400', '#7f8c8d',
]

export function ColorTool() {
  const [input, setInput] = useState('#3498db')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [alpha, setAlpha] = useState(1)

  const parsed = useMemo<ColorObj | null>(() => parseColor(input), [input])

  const convert = () => {
    if (!parsed) {
      setError('无法识别的颜色格式（支持 HEX、RGB、RGBA、HSL、HSLA）')
      setOutput('')
      return
    }
    setError('')
    setOutput(formatColor(parsed))
  }

  const adjustAlpha = (newA: number) => {
    setAlpha(newA)
    if (!parsed) return
    const c: ColorObj = {
      ...parsed,
      rgb: { ...parsed.rgb, a: newA },
      hsl: { ...parsed.hsl, a: newA },
    }
    setInput(c.hex)
    setOutput(formatColor(c))
  }

  return (
    <div className="flex flex-col gap-4 flex-1">
      <div className="space-y-2">
        <label className="text-sm text-muted">输入颜色（HEX / RGB / RGBA / HSL / HSLA）</label>
        <div className="flex gap-3 items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="#3498db / rgb(52, 152, 219) / hsl(204, 70%, 53%)"
            className="flex-1 px-4 py-3 rounded-xl bg-input border border-primary text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
          />
          {parsed && (
            <input
              type="color"
              value={parsed.hex}
              onChange={(e) => setInput(e.target.value)}
              className="w-12 h-12 rounded-lg cursor-pointer border-0"
            />
          )}
        </div>
      </div>

      {parsed && (
        <div className="space-y-2">
          <label className="text-sm text-muted flex items-center gap-2">
            透明度（{alpha.toFixed(2)}）
          </label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={alpha}
            onChange={(e) => adjustAlpha(Number(e.target.value))}
            className="w-full accent-fuchsia-500"
          />
        </div>
      )}

      <div className="flex gap-3 flex-wrap">
        <button
          onClick={convert}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors"
        >
          <ArrowRightLeft className="w-4 h-4" /> 转换
        </button>
        <button
          onClick={() => setInput(randomColor())}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-500 hover:bg-violet-600 text-white font-medium transition-colors"
        >
          <Shuffle className="w-4 h-4" /> 随机
        </button>
      </div>

      {/* 色板预览 */}
      {parsed && (
        <div
          className="rounded-xl border border-primary p-6 flex items-center justify-center text-2xl font-bold h-32 transition-colors"
          style={{ backgroundColor: parsed.hex, color: getContrastColor(parsed.hex) }}
        >
          <Wand2 className="w-6 h-6 mr-3" />
          {parsed.hex}
        </div>
      )}

      {/* 预设色板 */}
      <div className="space-y-2">
        <label className="text-sm text-muted">预设色板（点击选择）</label>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((c) => (
            <button
              key={c}
              onClick={() => setInput(c)}
              className="w-9 h-9 rounded-lg border border-primary hover:scale-110 transition-transform"
              style={{ backgroundColor: c }}
              title={c}
            />
          ))}
        </div>
      </div>

      {error && <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-sm">{error}</div>}

      <div className="space-y-2 flex-1">
        <label className="text-sm text-muted">转换结果</label>
        <ContentOutput value={output || (parsed ? formatColor(parsed) : '')} />
      </div>
    </div>
  )
}
