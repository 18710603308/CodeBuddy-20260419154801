import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Mic, MicOff, Trash2, Copy, Download, Volume2, Activity, AlertCircle, Settings, Server, Globe, Upload } from 'lucide-react'

// 语音识别服务配置 - 使用同源路径，通过 nginx 反向代理
const DEFAULT_API_URL = `${window.location.origin}/whisper`

const SpeechRecognition: React.FC = () => {
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<string[]>([])
  const [isDark, setIsDark] = useState(true)
  const [audioLevel, setAudioLevel] = useState(0)
  const [logs, setLogs] = useState<string[]>([])
  const [showDebug, setShowDebug] = useState(false)
  const [apiUrl, setApiUrl] = useState(DEFAULT_API_URL)
  const [showSettings, setShowSettings] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [isRecording, setIsRecording] = useState(false)

  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const audioContext = useRef<any>(null)
  const analyser = useRef<any>(null)
  const animationFrame = useRef<any>(null)
  const audioChunks = useRef<Blob[]>([])

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString()
    setLogs(prev => [`[${time}] ${msg}`, ...prev.slice(0, 49)])
    console.log(`[STT] ${msg}`)
  }

  // 测试服务连接
  const testConnection = async () => {
    try {
      const response = await fetch(`${apiUrl}/health`, {
        signal: AbortSignal.timeout(5000)
      })
      if (response.ok) {
        setIsConnected(true)
        addLog('服务连接成功')
        return true
      }
    } catch (e) {
      setIsConnected(false)
      addLog('服务连接失败')
    }
    return false
  }

  // 获取麦克风音量
  const startAudioMonitoring = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 16000 } 
      })
      
      audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      analyser.current = audioContext.current.createAnalyser()
      analyser.current.fftSize = 256
      
      const source = audioContext.current.createMediaStreamSource(stream)
      source.connect(analyser.current)
      
      const dataArray = new Uint8Array(analyser.current.frequencyBinCount)
      
      const updateLevel = () => {
        if (!analyser.current) return
        analyser.current.getByteFrequencyData(dataArray)
        const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length
        setAudioLevel(Math.round((average / 128) * 100))
        animationFrame.current = requestAnimationFrame(updateLevel)
      }
      updateLevel()
      addLog('麦克风已就绪')
    } catch (e) {
      setError('麦克风访问失败')
    }
  }

  const stopAudioMonitoring = () => {
    if (animationFrame.current) cancelAnimationFrame(animationFrame.current)
    if (audioContext.current) audioContext.current.close()
    setAudioLevel(0)
  }

  // 开始录音
  const startRecording = async () => {
    setError(null)
    setTranscript('')
    audioChunks.current = []
    
    // 检查浏览器是否支持麦克风
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('您的浏览器不支持麦克风访问，或页面未使用 HTTPS 协议。请使用 Chrome/Edge 浏览器访问。')
      return
    }
    
    const connected = await testConnection()
    if (!connected) {
      setError(`无法连接到识别服务 (${apiUrl})`)
      return
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 16000 } 
      })
      
      await startAudioMonitoring()
      
      mediaRecorder.current = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm'
      })
      
      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data)
        }
      }
      
      mediaRecorder.current.start(1000)
      setIsRecording(true)
      addLog('开始录音')
    } catch (e: any) {
      setError(e.message || '启动失败')
    }
  }

  // 停止录音并转写
  const stopRecordingAndTranscribe = async () => {
    if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
      mediaRecorder.current.stop()
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop())
    }
    
    stopAudioMonitoring()
    setIsRecording(false)
    
    if (audioChunks.current.length === 0) {
      addLog('没有录音数据')
      return
    }
    
    // 合并音频
    const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' })
    addLog(`录音完成: ${(audioBlob.size / 1024).toFixed(1)}KB`)
    
    // 转写
    setIsTranscribing(true)
    try {
      const formData = new FormData()
      formData.append('file', audioBlob, 'audio.webm')
      
      addLog('正在转写...')
      const response = await fetch(`${apiUrl}/inference`, {
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(120000) // 2分钟超时
      })
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      
      const result = await response.json()
      if (result.text) {
        setTranscript(result.text)
        addLog(`转写完成: ${result.text}`)
      } else {
        addLog('未识别到文字')
      }
    } catch (e: any) {
      addLog(`转写失败: ${e.message}`)
      setError(e.message || '转写失败')
    } finally {
      setIsTranscribing(false)
      audioChunks.current = []
    }
  }

  // 文件上传转写
  const transcribeFile = async (file: File) => {
    setIsTranscribing(true)
    setError(null)
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      addLog(`上传文件: ${file.name} (${(file.size / 1024).toFixed(1)}KB)`)
      
      const response = await fetch(`${apiUrl}/inference`, {
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(120000)
      })
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      
      const result = await response.json()
      if (result.text) {
        setTranscript(result.text)
        addLog(`转写完成`)
      } else {
        addLog('未识别到文字')
      }
    } catch (e: any) {
      addLog(`转写失败: ${e.message}`)
      setError(e.message || '转写失败')
    } finally {
      setIsTranscribing(false)
    }
  }

  const clearTranscript = () => {
    if (transcript) setHistory(prev => [transcript, ...prev.slice(0, 9)])
    setTranscript('')
  }

  const copyTranscript = async () => {
    if (transcript) await navigator.clipboard.writeText(transcript)
  }

  const downloadTranscript = () => {
    if (!transcript) return
    const blob = new Blob([transcript], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `语音转写_${new Date().toLocaleString().replace(/[/:]/g, '-')}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const speakTranscript = () => {
    if (!transcript) return
    const utterance = new SpeechSynthesisUtterance(transcript)
    utterance.lang = 'zh-CN'
    speechSynthesis.speak(utterance)
  }

  useEffect(() => {
    setIsDark(localStorage.getItem('devtools-theme') !== 'light')
    testConnection()
    
    return () => {
      if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
        mediaRecorder.current.stop()
        mediaRecorder.current.stream.getTracks().forEach(track => track.stop())
      }
      stopAudioMonitoring()
    }
  }, [])

  const theme = {
    bg: isDark ? 'from-slate-900 via-purple-900/50 to-indigo-900' : 'from-blue-100 via-indigo-100 to-purple-100',
    headerBg: isDark ? 'bg-black/40' : 'bg-white/80',
    text: isDark ? 'text-white' : 'text-gray-900',
    textSubtle: isDark ? 'text-white/60' : 'text-gray-600',
    card: isDark ? 'bg-white/5' : 'bg-white/80',
    border: isDark ? 'border-white/10' : 'border-gray-200',
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.bg}`}>
      {/* Header */}
      <div className={`sticky top-0 z-50 ${theme.headerBg} backdrop-blur-lg border-b ${theme.border}`}>
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link to="/" className={`flex items-center gap-2 ${theme.textSubtle}`}>
              <ChevronRight className="w-5 h-5 rotate-180" />
              <span>返回首页</span>
            </Link>
            <h1 className={`font-bold text-lg ${theme.text}`}>🎙️ 语音转写</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-4">
        {/* 错误提示 */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 text-red-300 flex items-center justify-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {/* 录音控制 */}
        <div className={`${theme.card} backdrop-blur-lg rounded-2xl p-8 border ${theme.border} text-center`}>
          <div className="flex justify-center gap-4 mb-6">
            <button
              onClick={startRecording}
              disabled={isRecording || isTranscribing}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all
                ${isRecording ? 'bg-gray-500 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-600'} shadow-lg`}
            >
              <Mic className="w-8 h-8 text-white" />
            </button>
            
            <button
              onClick={stopRecordingAndTranscribe}
              disabled={!isRecording || isTranscribing}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all
                ${!isRecording ? 'bg-gray-500 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600 animate-pulse'} shadow-lg`}
            >
              <MicOff className="w-8 h-8 text-white" />
            </button>
          </div>
          
          {/* 音量条 */}
          {isRecording && (
            <div className="mb-4">
              <Activity className={`w-4 h-4 mx-auto ${theme.textSubtle} animate-pulse`} />
              <div className={`w-48 h-2 mx-auto mt-2 rounded-full ${theme.card} border ${theme.border}`}>
                <div 
                  className={`h-full rounded-full bg-emerald-500 transition-all ${audioLevel > 50 ? 'animate-pulse' : ''}`}
                  style={{ width: `${audioLevel}%` }}
                />
              </div>
              <p className={`text-sm ${theme.textSubtle} mt-2`}>录音中...</p>
            </div>
          )}
          
          {isTranscribing && (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <span className={theme.textSubtle}>正在转写...</span>
            </div>
          )}
          
          <p className={`text-sm ${theme.textSubtle} mt-4`}>
            {isConnected ? '✅ 服务已连接' : '⚠️ 服务未连接'}
          </p>
        </div>

        {/* 文件上传 */}
        <div className={`${theme.card} backdrop-blur-lg rounded-2xl p-6 border ${theme.border}`}>
          <h3 className={`font-semibold ${theme.text} mb-3 flex items-center gap-2`}>
            <Upload className="w-4 h-4" />
            上传音频文件
          </h3>
          <input
            type="file"
            accept="audio/*"
            onChange={(e) => e.target.files?.[0] && transcribeFile(e.target.files[0])}
            disabled={isTranscribing}
            className={`w-full text-sm ${theme.textSubtle}`}
          />
          <p className={`text-xs ${theme.textSubtle} mt-2`}>支持 wav, mp3, m4a, webm 格式</p>
        </div>

        {/* 调试面板 */}
        {showDebug && (
          <div className={`${theme.card} backdrop-blur-lg rounded-2xl border ${theme.border} p-4`}>
            <div className="flex justify-between mb-3">
              <h3 className={`font-semibold ${theme.text}`}>调试日志</h3>
              <button onClick={() => setLogs([])} className={`text-xs ${theme.textSubtle}`}>清空</button>
            </div>
            <div className={`text-xs font-mono ${theme.textSubtle} max-h-48 overflow-y-auto space-y-1`}>
              {logs.map((log, i) => <div key={i}>{log}</div>)}
            </div>
          </div>
        )}

        {/* 转写结果 */}
        <div className={`${theme.card} backdrop-blur-lg rounded-2xl border ${theme.border} overflow-hidden`}>
          <div className="flex items-center justify-between px-4 py-3 border-b ${theme.border}">
            <h2 className={`font-semibold ${theme.text}`}>📝 转写结果</h2>
            <div className="flex gap-2">
              <button onClick={speakTranscript} disabled={!transcript} className={`p-2 rounded-lg ${theme.card} disabled:opacity-50`}>
                <Volume2 className="w-4 h-4 text-emerald-400" />
              </button>
              <button onClick={copyTranscript} disabled={!transcript} className={`p-2 rounded-lg ${theme.card} disabled:opacity-50`}>
                <Copy className="w-4 h-4 text-blue-400" />
              </button>
              <button onClick={downloadTranscript} disabled={!transcript} className={`p-2 rounded-lg ${theme.card} disabled:opacity-50`}>
                <Download className="w-4 h-4 text-purple-400" />
              </button>
              <button onClick={clearTranscript} disabled={!transcript} className={`p-2 rounded-lg ${theme.card} disabled:opacity-50`}>
                <Trash2 className="w-4 h-4 text-red-400" />
              </button>
            </div>
          </div>
          
          <div className="p-4 min-h-[200px] max-h-[400px] overflow-y-auto">
            {transcript ? (
              <p className={`text-lg leading-relaxed ${theme.text} whitespace-pre-wrap`}>{transcript}</p>
            ) : (
              <p className={`${theme.textSubtle} text-center py-8`}>
                {isTranscribing ? '转写中...' : '开始录音或上传音频文件'}
              </p>
            )}
          </div>
        </div>

        {/* 历史记录 */}
        {history.length > 0 && (
          <div className={`${theme.card} backdrop-blur-lg rounded-2xl border ${theme.border} p-4`}>
            <h3 className={`font-semibold ${theme.text} mb-3`}>📜 历史记录</h3>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {history.map((text, i) => (
                <div key={i} className={`p-3 rounded-lg ${theme.card} border ${theme.border} cursor-pointer`}
                  onClick={() => { setTranscript(text); setHistory(prev => prev.filter((_, j) => j !== i)) }}>
                  <p className={`text-sm ${theme.text} line-clamp-2`}>{text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 使用说明 */}
        <div className={`${theme.card} backdrop-blur-lg rounded-2xl border ${theme.border} p-4`}>
          <h3 className={`font-semibold ${theme.text} mb-2`}>💡 使用说明</h3>
          <ul className={`text-sm ${theme.textSubtle} space-y-1`}>
            <li>• 使用 <strong className="text-emerald-400">Whisper</strong> 开源语音识别</li>
            <li>• 完全免费，支持中文离线识别</li>
            <li>• 录音后点击红色按钮停止并转写</li>
            <li>• 支持上传音频文件批量转写</li>
            <li>• ⚠️ 服务器需部署 Whisper 服务</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default SpeechRecognition
