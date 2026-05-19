import React, { useState, useCallback, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Home, RotateCcw, Lightbulb, Undo2, Trophy, ChevronRight, XCircle } from 'lucide-react'

interface Card {
  suit: string
  value: number
  faceUp: boolean
}

interface History {
  columns: Card[][]
  stock: Card[]
  completed: number
}

const createDeck = (): Card[] => {
  const deck: Card[] = []
  for (let d = 0; d < 8; d++) {
    for (let v = 1; v <= 13; v++) {
      deck.push({ suit: '♠', value: v, faceUp: false })
    }
  }
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck
}

const SpiderSolitaire: React.FC = () => {
  const [columns, setColumns] = useState<Card[][]>([])
  const [stock, setStock] = useState<Card[]>([])
  const [completed, setCompleted] = useState(0)
  const [selected, setSelected] = useState<{ col: number; count: number } | null>(null)
  const selectedRef = useRef<{ col: number; count: number } | null>(null)
  const [score, setScore] = useState(500)
  const [moves, setMoves] = useState(0)
  const [won, setWon] = useState(false)
  const [stuck, setStuck] = useState(false)
  const [hint, setHint] = useState<{ from: number; to: number } | null>(null)
  const [isDark, setIsDark] = useState(true)
  const historyRef = useRef<History[]>([])
  const columnsRef = useRef<Card[][]>([])
  const stockRef = useRef<Card[]>([])

  useEffect(() => { setIsDark(localStorage.getItem('devtools-theme') !== 'light') }, [])

  const init = useCallback(() => {
    const deck = createDeck()
    const cols: Card[][] = Array.from({ length: 10 }, () => [])
    let idx = 0
    for (let c = 0; c < 10; c++) {
      const count = c < 4 ? 6 : 5
      for (let i = 0; i < count; i++) {
        cols[c].push({ ...deck[idx++], faceUp: i === count - 1 })
      }
    }
    const stk = deck.slice(idx)
    columnsRef.current = cols
    stockRef.current = stk
    setColumns(cols)
    setStock(stk)
    setCompleted(0)
    setSelected(null)
    selectedRef.current = null
    setScore(500)
    setMoves(0)
    setWon(false)
    setStuck(false)
    setHint(null)
    historyRef.current = []
  }, [])

  useEffect(() => { init() }, [init])

  // 同步 ref 避免闭包 stale 问题
  useEffect(() => { columnsRef.current = columns }, [columns])
  useEffect(() => { stockRef.current = stock }, [stock])
  useEffect(() => { selectedRef.current = selected }, [selected])

  const valDisplay = (v: number) => ({ 1: 'A', 11: 'J', 12: 'Q', 13: 'K' }[v] || v.toString())

  const saveHistory = () => {
    historyRef.current.push({
      columns: columns.map(c => c.map(card => ({ ...card }))),
      stock: stock.map(c => ({ ...c })),
      completed
    })
    if (historyRef.current.length > 50) historyRef.current.shift()
  }

  const undo = () => {
    if (historyRef.current.length === 0) return
    const last = historyRef.current.pop()!
    columnsRef.current = last.columns
    stockRef.current = last.stock
    setColumns(last.columns)
    setStock(last.stock)
    setCompleted(last.completed)
    setSelected(null)
    selectedRef.current = null
    setMoves(m => Math.max(0, m - 1))
    setHint(null)
    setStuck(false)
  }

  // 获取某列可移动序列信息，返回 null 表示无可移动序列
  const getMovableSeq = (col: Card[]): { startIdx: number; count: number; firstValue: number } | null => {
    if (col.length === 0) return null
    const last = col[col.length - 1]
    if (!last.faceUp) return null
    let startIdx = col.length - 1
    for (let i = col.length - 2; i >= 0; i--) {
      if (col[i].faceUp && col[i].value === col[i + 1].value + 1) startIdx = i
      else break
    }
    const count = col.length - startIdx
    const firstCard = col[startIdx] // 序列第一张牌，它的值决定能放到什么上面
    return { startIdx, count, firstValue: firstCard.value }
  }

  // 提示：找最有意义的合法移动
  const showHint = () => {
    const cols = columnsRef.current
    const hasEmptyCol = cols.some(c => c.length === 0)
    type Move = { from: number; to: number; count: number; priority: number }
    let bestMove: Move | null = null

    for (let from = 0; from < cols.length; from++) {
      const seq = getMovableSeq(cols[from])
      if (!seq) continue

      const canReveal = seq.startIdx > 0 && !cols[from][seq.startIdx - 1].faceUp

      for (let to = 0; to < cols.length; to++) {
        if (from === to) continue
        const targetCol = cols[to]

        if (targetCol.length === 0) {
          // K入空列：只有能翻牌时才有意义（优先级3）
          if (seq.firstValue === 13 && canReveal) {
            if (!bestMove || bestMove.priority < 3) {
              bestMove = { from, to, count: seq.count, priority: 3 }
            }
          }
        } else {
          const targetCard = targetCol[targetCol.length - 1]
          if (targetCard.faceUp && targetCard.value === seq.firstValue + 1) {
            const prio = canReveal ? 3 : 2
            if (!bestMove || bestMove.priority < prio) {
              bestMove = { from, to, count: seq.count, priority: prio }
            }
          }
        }
      }
    }

    if (bestMove && bestMove.priority >= 2) {
      // 有翻牌或接龙等有意义移动
      setHint({ from: bestMove.from, to: bestMove.to })
      setSelected({ col: bestMove.from, count: bestMove.count })
      selectedRef.current = { col: bestMove.from, count: bestMove.count }
    } else if (stockRef.current.length > 0 && !hasEmptyCol) {
      // 无有意义的移动、无空列 → 直接提示发牌
      setHint({ from: -1, to: -1 })
      setSelected(null)
      selectedRef.current = null
    } else if (stockRef.current.length > 0 && hasEmptyCol) {
      // 有空列：检查是否有K可移入空列（以便发牌）
      let kToEmpty: Move | null = null
      for (let from = 0; from < cols.length; from++) {
        const seq = getMovableSeq(cols[from])
        if (!seq || seq.firstValue !== 13) continue
        for (let to = 0; to < cols.length; to++) {
          if (from === to || cols[to].length !== 0) continue
          kToEmpty = { from, to, count: seq.count, priority: 0 }
          break
        }
        if (kToEmpty) break
      }

      if (kToEmpty) {
        // 有K可移入空列 → 高亮并提示
        setHint({ from: kToEmpty.from, to: kToEmpty.to })
        setSelected({ col: kToEmpty.from, count: kToEmpty.count })
        selectedRef.current = { col: kToEmpty.from, count: kToEmpty.count }
        // 同时显示文字说明
        setHint({ from: -2, to: kToEmpty.to })
      } else {
        // 无K可移入空列 → 真正的死局前兆，提示撤回
        setHint({ from: -3, to: -3 })
        setSelected(null)
        selectedRef.current = null
      }
    }
  }

  // 每次状态变化后自动检测死局
  useEffect(() => {
    if (won || columns.length === 0) return
    const cols = columnsRef.current
    const hasStock = stockRef.current.length > 0

    // 检查是否有任何合法移动
    let hasMove = false
    for (let from = 0; from < cols.length && !hasMove; from++) {
      const seq = getMovableSeq(cols[from])
      if (!seq) continue
      for (let to = 0; to < cols.length && !hasMove; to++) {
        if (from === to) continue
        const targetCol = cols[to]
        if (targetCol.length === 0) {
          if (seq.firstValue === 13) hasMove = true
        } else {
          const tc = targetCol[targetCol.length - 1]
          if (tc.faceUp && tc.value === seq.firstValue + 1) hasMove = true
        }
      }
    }
    if (!hasMove && !hasStock) {
      setStuck(true)
    } else {
      setStuck(false)
    }
  }, [columns, stock, won])

  const handleClick = (colIndex: number) => {
    setHint(null)
    setStuck(false)
    // 始终使用 ref 获取最新状态，避免 stale closure
    const cols = columnsRef.current
    const sel = selectedRef.current
    const col = cols[colIndex]
    
    if (sel) {
      // 已选中，尝试移动
      if (sel.col === colIndex) {
        setSelected(null)
        selectedRef.current = null
        return
      }
      
      const sourceCol = cols[sel.col]
      const sourceCards = sourceCol.slice(-sel.count)
      const sourceValue = sourceCards[0].value
      
      if (col.length === 0) {
        // 空列只能放 K
        if (sourceValue === 13) {
          saveHistory()
          doMoveWithSelected(sel, colIndex)
        } else {
          setSelected(null)
          selectedRef.current = null
        }
        return
      }
      
      const targetCard = col[col.length - 1]
      // 目标牌必须正面朝上，且比要放的牌大1（如放5，目标必须是6）
      if (targetCard.faceUp && targetCard.value === sourceValue + 1) {
        saveHistory()
        doMoveWithSelected(sel, colIndex)
      } else {
        setSelected(null)
        selectedRef.current = null
      }
    } else {
      // 未选中，选择可移动序列
      if (col.length === 0) return
      const lastCard = col[col.length - 1]
      if (!lastCard.faceUp) return
      
      let startIdx = col.length - 1
      for (let i = col.length - 2; i >= 0; i--) {
        if (col[i].faceUp && col[i].value === col[i + 1].value + 1) startIdx = i
        else break
      }
      const count = col.length - startIdx
      setSelected({ col: colIndex, count })
      selectedRef.current = { col: colIndex, count }
    }
  }

  const doMoveWithSelected = (sel: { col: number; count: number }, targetCol: number) => {
    const newCols = columnsRef.current.map(c => [...c])
    const movingCards = newCols[sel.col].splice(-sel.count)
    newCols[targetCol].push(...movingCards)
    
    const lastIdx = newCols[sel.col].length - 1
    if (lastIdx >= 0 && !newCols[sel.col][lastIdx].faceUp) {
      newCols[sel.col][lastIdx].faceUp = true
    }
    
    columnsRef.current = newCols
    setColumns(newCols)
    setSelected(null)
    selectedRef.current = null
    setMoves(m => m + 1)
    setScore(s => Math.max(0, s - 1))
  }

  const deal = () => {
    if (stockRef.current.length === 0) return
    if (columnsRef.current.some(c => c.length === 0)) return
    saveHistory()
    const newStock = [...stockRef.current]
    const newCols = columnsRef.current.map(c => [...c])
    
    for (let i = 0; i < 10 && newStock.length > 0; i++) {
      const card = newStock.pop()!
      card.faceUp = true
      newCols[i].push(card)
    }

    columnsRef.current = newCols
    stockRef.current = newStock
    setColumns(newCols)
    setStock(newStock)
    setSelected(null)
    selectedRef.current = null
    setMoves(m => m + 1)
    setScore(s => Math.max(0, s - 100))
    setHint(null)
  }

  useEffect(() => {
    if (columns.length === 0) return
    const timer = setTimeout(() => {
      const newCols = columns.map(c => [...c])
      for (let i = 0; i < newCols.length; i++) {
        const col = newCols[i]
        if (col.length >= 13) {
          const last = col.slice(-13)
          let valid = true
          for (let j = 0; j < 13; j++) {
            if (last[j].value !== 13 - j) { valid = false; break }
          }
          if (valid) {
            newCols[i] = col.slice(0, -13)
            if (newCols[i].length > 0 && !newCols[i][newCols[i].length - 1].faceUp) {
              newCols[i][newCols[i].length - 1].faceUp = true
            }
            setColumns(newCols)
            setCompleted(c => c + 1)
            setMoves(m => m + 1)
            setScore(s => s + 100)
            break
          }
        }
      }
    }, 150)
    return () => clearTimeout(timer)
  }, [columns])

  useEffect(() => { if (completed === 8) setWon(true) }, [completed])

  const theme = {
    bg: isDark ? 'from-slate-900 via-purple-900/50 to-indigo-900' : 'from-green-100 via-emerald-100 to-teal-100',
    headerBg: isDark ? 'bg-black/40 backdrop-blur-lg border-white/10' : 'bg-white/80 backdrop-blur-lg border-gray-200',
    text: isDark ? 'text-white' : 'text-gray-900',
    textSubtle: isDark ? 'text-white/60' : 'text-gray-600',
    btn: isDark ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-indigo-500 hover:bg-indigo-600 text-white',
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.bg}`}>
      {/* Header */}
      <div className={`sticky top-0 z-50 ${theme.headerBg} border-b`}>
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link to="/" className={`flex items-center gap-2 ${theme.textSubtle} hover:${theme.text} transition-colors`}>
              <ChevronRight className="w-5 h-5 rotate-180" />
              <Home className="w-5 h-5" />
              <span>返回首页</span>
            </Link>
            
            <span className="font-bold text-xl">🕷️ 蜘蛛纸牌</span>
            
            <div className="flex items-center gap-2">
              <span className={`${theme.text} font-bold`}>分数: <span className="text-yellow-400">{score}</span></span>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center gap-2 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          <button onClick={init} className={`px-4 py-2 rounded-lg ${theme.btn} font-medium active:scale-95`}>
            🎮 新游戏
          </button>
          <button onClick={undo} disabled={historyRef.current.length === 0} 
            className="px-3 py-2 rounded-lg bg-gray-600/80 hover:bg-gray-500/80 text-white disabled:opacity-40 active:scale-95 flex items-center gap-1">
            <Undo2 className="w-4 h-4" />撤回
          </button>
          <button onClick={showHint}
            className="px-3 py-2 rounded-lg bg-yellow-600/90 hover:bg-yellow-500 text-white active:scale-95 flex items-center gap-1">
            <Lightbulb className="w-4 h-4" />提示
          </button>
        </div>
        <button onClick={deal} disabled={stock.length === 0 || columns.some(c => c.length === 0)}
          className="px-4 py-2 rounded-lg bg-orange-600/90 hover:bg-orange-500 text-white disabled:opacity-40 active:scale-95">
          🃏 发牌 ({Math.floor(stock.length / 10)})
        </button>
      </div>

      {/* Completed & Stock */}
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-2">
        <div className="flex gap-1">
          {Array(8).fill(null).map((_, i) => (
            <div key={i} className={`w-10 h-14 rounded-lg flex items-center justify-center text-lg font-bold ${
              i < completed ? 'bg-gradient-to-br from-yellow-400 to-orange-400 text-yellow-900 shadow-lg' 
                : isDark ? 'bg-slate-700/60 border border-slate-600/30' : 'bg-gray-200 border border-gray-300'
            }`}>
              {i < completed ? '✓' : '♠'}
            </div>
          ))}
        </div>
        
        <div className="ml-auto relative">
          <div onClick={deal} className={`w-12 h-14 rounded-lg cursor-pointer flex items-center justify-center text-lg font-bold ${
            (stock.length === 0 || columns.some(c => c.length === 0)) 
              ? 'bg-gray-700/50 opacity-50' 
              : 'bg-gradient-to-br from-green-600 to-emerald-600 text-white shadow-lg hover:shadow-xl'
          }`}>
            ♠
          </div>
          {stock.length > 0 && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold shadow">
              {Math.floor(stock.length / 10)}
            </div>
          )}
        </div>
      </div>

      {/* Game Board */}
      <div className="flex-1 max-w-6xl mx-auto px-2 pb-6 overflow-x-auto">
        <div className="flex gap-[4px] justify-center min-w-max pt-2">
          {columns.map((col, colIdx) => (
            <div key={colIdx} className="flex flex-col items-center">
              {col.map((card, cardIdx) => {
                const isSelected = selected?.col === colIdx && cardIdx >= col.length - (selected?.count || 0)
                const isHinted = hint?.from === colIdx && cardIdx >= col.length - (selected?.count || 0)
                const isHintTarget = hint?.to === colIdx
                
                return (
                  <div
                    key={cardIdx}
                    onClick={() => handleClick(colIdx)}
                    className={`
                      w-[58px] h-[76px] rounded-lg cursor-pointer transition-all duration-150
                      ${card.faceUp 
                        ? `bg-white shadow-md ${isSelected ? 'ring-2 ring-blue-400 scale-105 z-20' : ''} ${isHinted ? 'ring-2 ring-green-400 animate-pulse z-20' : ''} ${isHintTarget ? 'ring-2 ring-green-400' : ''}`
                        : `${isDark ? 'bg-gradient-to-br from-indigo-800 to-purple-800' : 'bg-gradient-to-br from-blue-700 to-indigo-700'} shadow-md`
                      }
                    `}
                    style={{ marginTop: cardIdx > 0 ? '-52px' : '0' }}
                  >
                    {card.faceUp && (
                      <div className="w-full h-full flex flex-col p-1 text-black">
                        <div className="flex justify-between items-start">
                          <span className="text-[11px] font-bold leading-none">{valDisplay(card.value)}</span>
                          <span className="text-[13px] leading-none">♠</span>
                        </div>
                        <div className="flex-1 flex items-center justify-center">
                          <span className="text-[22px] font-bold">♠</span>
                        </div>
                        <div className="flex justify-end items-end">
                          <span className="text-[13px] leading-none">♠</span>
                          <span className="text-[11px] font-bold leading-none">{valDisplay(card.value)}</span>
                        </div>
                      </div>
                    )}
                    {!card.faceUp && (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className={`${isDark ? 'text-indigo-300' : 'text-blue-200'} text-[18px]`}>♠</span>
                      </div>
                    )}
                  </div>
                )
              })}
              
              {col.length === 0 && (
                <div
                  onClick={() => handleClick(colIdx)}
                  className={`w-[58px] h-[76px] rounded-lg border-2 border-dashed cursor-pointer transition-all ${
                    hint?.to === colIdx ? 'border-green-400 ring-2 ring-green-400 animate-pulse' : `border-${isDark ? 'indigo-500/40' : 'gray-400/50'} bg-${isDark ? 'indigo-900/20' : 'gray-200/50'}`
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Status Bar */}
      <div className={`sticky bottom-0 ${theme.headerBg} border-t py-2 px-4`}>
        <div className="max-w-6xl mx-auto flex justify-between text-sm">
          <span className={theme.textSubtle}>移动: {moves}</span>
          <span className={theme.textSubtle}>完成: {completed}/8</span>
          <span className={theme.textSubtle}>剩余: {stock.length}张</span>
        </div>
      </div>

      {/* Win Modal */}
      {won && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-8 rounded-2xl text-center shadow-2xl max-w-sm mx-4">
            <Trophy className="w-20 h-20 mx-auto text-white mb-4 drop-shadow-lg" />
            <h2 className="text-3xl font-bold text-white mb-2 drop-shadow">🎉 恭喜通关！</h2>
            <p className="text-white/90 mb-2">用 {moves} 步完成游戏</p>
            <p className="text-white/90 mb-6 text-xl font-bold">最终得分: {score}</p>
            <button onClick={init} className="px-8 py-3 bg-white text-orange-600 rounded-xl font-bold hover:bg-orange-50 active:scale-95 transition-all shadow-lg">
              再来一局
            </button>
          </div>
        </div>
      )}

      {/* Stuck Modal - 无路可走 */}
      {stuck && !won && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-gray-700 to-gray-900 p-8 rounded-2xl text-center shadow-2xl max-w-sm mx-4 border border-gray-600">
            <XCircle className="w-20 h-20 mx-auto text-red-400 mb-4" />
            <h2 className="text-3xl font-bold text-white mb-2">😵 无路可走了</h2>
            <p className="text-gray-300 mb-2">已没有可移动的牌，也没有剩余牌可发</p>
            <p className="text-gray-400 mb-6 text-lg">当前得分: {score} | 移动: {moves} 步</p>
            <div className="flex gap-3 justify-center">
              <button onClick={undo}
                disabled={historyRef.current.length === 0}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl font-bold active:scale-95 transition-all shadow-lg">
                ↩️ 撤回重试
              </button>
              <button onClick={init} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold active:scale-95 transition-all shadow-lg">
                🎮 新游戏
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hint Message */}
      {hint?.from === -1 && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-yellow-500/90 text-black px-4 py-2 rounded-lg shadow-lg z-50 animate-bounce">
          💡 建议点击「发牌」按钮
        </div>
      )}
      {hint?.from === -2 && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-orange-500/90 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-bounce">
          💡 将高亮K移入空列（绿色虚线框），然后发牌
        </div>
      )}
      {hint?.from === -3 && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-red-500/90 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-bounce">
          ⚠️ 有空列无法发牌，且无K可移入空列，建议撤回重试
        </div>
      )}
    </div>
  )
}

export default SpiderSolitaire
