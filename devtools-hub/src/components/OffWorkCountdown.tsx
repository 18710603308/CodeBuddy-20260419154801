import { useState, useEffect, useRef, useCallback } from 'react'
import { Clock, Settings, X, Play, Pause, RotateCcw, Coffee } from 'lucide-react'

const STORAGE_KEY = 'offwork_time'

const OffWorkCountdown: React.FC = () => {
  const [open, setOpen] = useState(false)
  const [hour, setHour] = useState('18')
  const [minute, setMinute] = useState('00')
  const [savedTime, setSavedTime] = useState<string | null>(() => localStorage.getItem(STORAGE_KEY))
  const [remaining, setRemaining] = useState<number | null>(null)
  const [isAfterWork, setIsAfterWork] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const [hasTriggeredToday, setHasTriggeredToday] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const triggeredRef = useRef(false)

  // 刷新倒计时
  const tick = useCallback(() => {
    if (!savedTime) return
    const now = new Date()
    const [h, m] = savedTime.split(':').map(Number)
    const target = new Date()
    target.setHours(h, m, 0, 0)

    const diff = target.getTime() - now.getTime()

    if (diff <= 0) {
      // 已过下班时间
      setRemaining(0)
      setIsAfterWork(true)
      // 只在第一次触发时弹窗+播音频
      if (!triggeredRef.current && !hasTriggeredToday) {
        triggeredRef.current = true
        setHasTriggeredToday(true)
        setShowCelebration(true)
        if (audioRef.current) {
          audioRef.current.currentTime = 0
          audioRef.current.play().catch(() => {})
        }
      }
    } else {
      setRemaining(diff)
      setIsAfterWork(false)
    }
  }, [savedTime, hasTriggeredToday])

  // 定时刷新
  useEffect(() => {
    tick()
    intervalRef.current = setInterval(tick, 1000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [tick])

  // 每天重置触发状态
  useEffect(() => {
    const checkDay = () => {
      const today = new Date().toDateString()
      const lastDay = localStorage.getItem('offwork_trigger_day')
      if (lastDay !== today) {
        triggeredRef.current = false
        setHasTriggeredToday(false)
      }
    }
    checkDay()
    const dayInterval = setInterval(checkDay, 60000)
    return () => clearInterval(dayInterval)
  }, [])

  // 保存设置
  const saveTime = () => {
    const h = parseInt(hour) || 18
    const m = parseInt(minute) || 0
    const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
    setSavedTime(timeStr)
    localStorage.setItem(STORAGE_KEY, timeStr)
    triggeredRef.current = false
    setHasTriggeredToday(false)

    // 检查是否已过下班时间
    const now = new Date()
    const target = new Date()
    target.setHours(h, m, 0, 0)
    if (now >= target) {
      setIsAfterWork(true)
      setRemaining(0)
    } else {
      setIsAfterWork(false)
      setRemaining(target.getTime() - now.getTime())
    }
  }

  // 格式化剩余时间
  const formatTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000)
    const hh = Math.floor(totalSec / 3600)
    const mm = Math.floor((totalSec % 3600) / 60)
    const ss = totalSec % 60
    return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
  }

  // 下班弹窗
  const closeCelebration = () => {
    setShowCelebration(false)
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
  }

  const now = new Date()
  const isDark = document.documentElement.getAttribute('data-theme') !== 'light'

  return (
    <>
      {/* 隐藏音频 */}
      <audio ref={audioRef} src="/audio/lanlianhua.mp3" preload="auto" />

      {/* 庆祝弹窗 */}
      {showCelebration && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-yellow-500 via-orange-500 to-red-500 rounded-3xl p-8 shadow-2xl max-w-sm w-full mx-4 text-center animate-bounce">
            <div className="text-6xl mb-4">🎉🐔</div>
            <h2 className="text-3xl font-black text-white mb-2 drop-shadow-lg">
              大吉大利,今晚吃鸡!
            </h2>
            <p className="text-white/80 mb-2 text-lg">🎵 没有什么能够阻挡</p>
            <p className="text-white/80 mb-6 text-lg">我对自由的向往!</p>
            <button
              onClick={closeCelebration}
              className="px-8 py-3 bg-white/20 hover:bg-white/30 backdrop-blur rounded-xl text-white font-bold text-lg transition-all
                border border-white/30 hover:scale-105 active:scale-95"
            >
              下班走人!
            </button>
          </div>
        </div>
      )}

      {/* 浮动按钮 + 面板 */}
      <div className="fixed bottom-6 right-6 z-50">
        {open ? (
          <div className={`rounded-2xl shadow-2xl border overflow-hidden transition-all w-72
            ${isDark ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white border-gray-200 text-gray-900'}`}>
            {/* Header */}
            <div className={`px-4 py-3 flex items-center justify-between border-b
              ${isDark ? 'bg-slate-700 border-slate-600' : 'bg-amber-50 border-amber-200'}`}>
              <div className="flex items-center gap-2">
                <Coffee className="w-5 h-5 text-amber-500" />
                <span className="font-bold text-sm">下班倒计时</span>
              </div>
              <button onClick={() => setOpen(false)} className="hover:opacity-70">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 space-y-4">
              {/* 设置下班时间 */}
              {!savedTime ? (
                <div>
                  <label className="text-xs text-gray-400 mb-2 block">设置下班时间</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="23"
                      value={hour}
                      onChange={e => setHour(e.target.value)}
                      className={`w-16 px-2 py-2 rounded-lg text-center font-mono text-lg border
                        ${isDark ? 'bg-slate-700 border-slate-500 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'}
                        focus:outline-none focus:border-amber-500`}
                    />
                    <span className="text-xl font-bold">:</span>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={minute}
                      onChange={e => setMinute(e.target.value)}
                      className={`w-16 px-2 py-2 rounded-lg text-center font-mono text-lg border
                        ${isDark ? 'bg-slate-700 border-slate-500 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'}
                        focus:outline-none focus:border-amber-500`}
                    />
                    <button
                      onClick={saveTime}
                      className="ml-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold text-sm transition-colors"
                    >
                      确定
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* 已设置 - 显示倒计时 */}
                  <div className="text-center">
                    <div className={`text-xs mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      下班时间 {savedTime}
                      <button
                        onClick={() => { setSavedTime(null); localStorage.removeItem(STORAGE_KEY) }}
                        className="ml-2 text-amber-500 hover:text-amber-600 inline-flex items-center gap-0.5"
                      >
                        <Settings className="w-3 h-3" /> 修改
                      </button>
                    </div>

                    {isAfterWork ? (
                      <div className="py-4">
                        <div className="text-6xl mb-2">🏠</div>
                        <p className="text-lg font-bold text-amber-500">
                          你已经下班了,不许偷偷勤奋!
                        </p>
                      </div>
                    ) : (
                      <div>
                        <div className="text-4xl font-mono font-bold tracking-wider my-3 text-amber-500">
                          {remaining !== null ? formatTime(remaining) : '--:--:--'}
                        </div>
                        <div className="text-xs text-gray-400">
                          距离下班还有
                        </div>
                        {/* 进度条 */}
                        {savedTime && remaining !== null && remaining > 0 && (() => {
                          const [h, m] = savedTime.split(':').map(Number)
                          const target = new Date()
                          target.setHours(h, m, 0, 0)
                          const startOfDay = new Date()
                          startOfDay.setHours(9, 0, 0, 0) // 假设9点上班
                          const totalMs = target.getTime() - startOfDay.getTime()
                          const elapsed = totalMs - remaining
                          const pct = totalMs > 0 ? Math.min(100, Math.max(0, (elapsed / totalMs) * 100)) : 0
                          return (
                            <div className={`w-full h-2 rounded-full mt-2 ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`}>
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-1000"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          )
                        })()}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className={`px-4 py-2 border-t text-center text-[10px]
              ${isDark ? 'bg-slate-700 border-slate-600 text-gray-500' : 'bg-amber-50 border-amber-200 text-gray-400'}`}>
              下班自动弹窗提醒 + 🎵 蓝莲花
            </div>
          </div>
        ) : (
          /* 折叠按钮 */
          <button
            onClick={() => setOpen(true)}
            className="relative group flex items-center gap-2 px-4 py-3 rounded-2xl shadow-xl
              bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500
              text-white font-bold transition-all hover:scale-105 active:scale-95"
          >
            <Clock className="w-5 h-5" />
            {savedTime && remaining !== null && !isAfterWork ? (
              <span className="font-mono text-sm">{formatTime(remaining)}</span>
            ) : isAfterWork ? (
              <span className="text-sm">已下班 🏠</span>
            ) : (
              <span className="text-sm">下班倒计时</span>
            )}
          </button>
        )}
      </div>
    </>
  )
}

export default OffWorkCountdown
