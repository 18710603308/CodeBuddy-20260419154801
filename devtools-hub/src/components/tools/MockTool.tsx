import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { Search, Sparkles } from 'lucide-react'
import { ContentOutput } from '@/components/shared/ContentOutput'

export function MockTool() {
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
