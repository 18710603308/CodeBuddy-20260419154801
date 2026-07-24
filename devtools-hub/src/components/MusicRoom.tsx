import { useState, useEffect, useRef, useCallback } from 'react'
import Peer from 'peerjs'
import type { DataConnection } from 'peerjs'
import {
  Search, Play, Pause, SkipForward, SkipBack, Plus, X, Send,
  Users, Copy, LogOut, Crown, Repeat, Repeat1, Shuffle, Dice5,
  Gift, Smile, Volume2, Music, Headphones, ChevronUp, ChevronDown, Trash2,
  Sparkles, Trophy,
} from 'lucide-react'

// ==================== 类型 ====================
type MusicSource = 'netease' | 'qq' | 'kugou'
type PlayMode = 'loop' | 'single' | 'shuffle'

interface Song {
  id: string
  name: string
  artist: string
  album?: string
  cover?: string
  url: string
  source: MusicSource
  duration?: number
  addedBy?: string
}

interface Player {
  id: string
  name: string
  color: string
  isHost: boolean
}

interface ChatMessage {
  id: string
  userId: string
  name: string
  color: string
  text: string
  timestamp: number
  type: 'text' | 'system' | 'gift' | 'emoji'
  giftName?: string
}

interface GameState {
  type: 'dice' | 'fifteen20' | 'cards' | null
  data: any
}

interface Danmaku {
  id: number
  text: string
  color: string
  y: number
  speed: number
  name: string
}

interface RankEntry {
  id: string
  name: string
  color: string
  songsAdded: number
  chatCount: number
  giftsSent: number
  gamePlays: number
  total: number
}

type Msg =
  | { t: 'hello'; name: string; password: string }
  | { t: 'welcome'; players: Player[]; yourColor: string; playlist: Song[]; currentIndex: number; playMode: PlayMode; startTime: number; playing: boolean; roomName: string; rankStats: RankEntry[] }
  | { t: 'reject'; reason: string }
  | { t: 'players'; players: Player[] }
  | { t: 'addsong'; song: Song }
  | { t: 'removesong'; index: number }
  | { t: 'reorder'; playlist: Song[] }
  | { t: 'playstate'; currentIndex: number; playing: boolean; startTime: number; playMode: PlayMode }
  | { t: 'chat'; msg: ChatMessage }
  | { t: 'game'; state: GameState; by: string }
  | { t: 'hostmigrate'; newHostId: string }
  | { t: 'roomname'; name: string }
  | { t: 'rankstats'; stats: RankEntry[] }

// ==================== 常量 ====================
const PEER_PREFIX = 'musicroom-'
const PLAYER_COLORS = ['#f87171', '#fb923c', '#fbbf24', '#a3e635', '#34d399', '#22d3ee', '#60a5fa', '#a78bfa', '#f472b6', '#94a3b8']

const EMOJIS = ['🎉', '🔥', '👏', '😍', '😂', '🎶', '❤️', '👍', '🤣', '🥳', '😱', '🎸', '🎵', '💪', '🙌', '💯']

const GIFTS = [
  { id: 'flower', name: '鲜花', emoji: '🌹', color: '#f43f5e' },
  { id: 'rocket', name: '火箭', emoji: '🚀', color: '#8b5cf6' },
  { id: 'cake', name: '蛋糕', emoji: '🎂', color: '#f59e0b' },
  { id: 'beer', name: '啤酒', emoji: '🍺', color: '#fbbf24' },
  { id: 'crown', name: '皇冠', emoji: '👑', color: '#eab308' },
  { id: 'heart', name: '爱心', emoji: '💖', color: '#ec4899' },
  { id: 'trophy', name: '奖杯', emoji: '🏆', color: '#f97316' },
  { id: 'star', name: '星星', emoji: '⭐', color: '#facc15' },
]

const CARD_RULES: Record<number, string> = {
  1: 'A — 指定一人喝', 2: '2 — 小姐牌（陪喝）', 3: '3 — 逛三园',
  4: '4 — 摸鼻子', 5: '5 — 照相机', 6: '6 — 摸鼻子',
  7: '7 — 逢7必过', 8: '8 — 厕所牌', 9: '9 — 自己喝',
  10: '10 — 神经病', 11: 'J — 左边喝', 12: 'Q — 右边喝', 13: 'K — 画圈',
}

const HOT_SONGS = [
  { name: '晴天', artist: '周杰伦' },
  { name: '七里香', artist: '周杰伦' },
  { name: '稻香', artist: '周杰伦' },
  { name: '夜曲', artist: '周杰伦' },
  { name: '修炼爱情', artist: '林俊杰' },
  { name: '江南', artist: '林俊杰' },
  { name: '泡沫', artist: '邓紫棋' },
  { name: '光年之外', artist: '邓紫棋' },
  { name: '演员', artist: '薛之谦' },
  { name: '告白气球', artist: '周杰伦' },
  { name: '体面', artist: '于文文' },
  { name: '起风了', artist: '买辣椒也用券' },
  { name: '少年', artist: '梦然' },
  { name: '踏山河', artist: '是七叔呢' },
  { name: '孤勇者', artist: '陈奕迅' },
  { name: '十年', artist: '陈奕迅' },
  { name: '浮夸', artist: '陈奕迅' },
  { name: '红色高跟鞋', artist: '蔡健雅' },
  { name: '分手快乐', artist: '梁静茹' },
  { name: '后来', artist: '刘若英' },
  { name: '那些年', artist: '胡夏' },
  { name: '小幸运', artist: '田馥甄' },
  { name: '追光者', artist: '岑宁儿' },
  { name: '平凡之路', artist: '朴树' },
  { name: '生僻字', artist: '陈柯宇' },
  { name: '芒种', artist: '音阙诗听' },
  { name: '下山', artist: '要不要买菜' },
  { name: '火红的萨日朗', artist: '乌兰托娅' },
  { name: '你笑起来真好看', artist: '李昕融' },
  { name: '学猫叫', artist: '小潘潘' },
]

// ==================== 音乐搜索 ====================
async function searchMusic(keyword: string, source: MusicSource): Promise<Song[]> {
  if (!keyword.trim()) return []
  try {
    if (source === 'netease') {
      const res = await fetch(`/music-api/netease/api/search/get?s=${encodeURIComponent(keyword)}&type=1&limit=30`)
      const data = await res.json()
      if (!data.result?.songs) return []
      return data.result.songs.map((s: any) => ({
        id: `netease-${s.id}`,
        name: s.name?.replace(/<[^>]+>/g, '') || '未知',
        artist: (s.artists || []).map((a: any) => a.name).join(' / ') || '未知',
        album: s.album?.name || '',
        cover: s.album?.picUrl || '',
        url: `https://music.163.com/song/media/outer/url?id=${s.id}.mp3`,
        source: 'netease' as MusicSource,
        duration: s.duration,
      }))
    } else if (source === 'qq') {
      const res = await fetch(`/music-api/qq/soso/fcgi-bin/client_search_cp?w=${encodeURIComponent(keyword)}&format=json&p=1&n=30`)
      const text = await res.text()
      const data = JSON.parse(text)
      if (!data.data?.song?.list) return []
      return data.data.song.list.map((s: any) => ({
        id: `qq-${s.songmid}`,
        name: s.songname || '未知',
        artist: (s.singer || []).map((a: any) => a.name).join(' / ') || '未知',
        album: s.albumname || '',
        cover: s.albummid ? `https://y.gtimg.cn/music/photo_new/T002R300x300M000${s.albummid}.jpg` : '',
        url: '',
        source: 'qq' as MusicSource,
        duration: s.interval * 1000,
      }))
    } else if (source === 'kugou') {
      const res = await fetch(`/music-api/kugou/api/v3/search/song?keyword=${encodeURIComponent(keyword)}&page=1&pagesize=30`)
      const data = await res.json()
      if (!data.data?.info) return []
      return data.data.info.map((s: any) => ({
        id: `kugou-${s.hash}`,
        name: s.songname?.replace(/<[^>]+>/g, '') || '未知',
        artist: s.singername || '未知',
        album: s.album_name || '',
        cover: s.album_img || '',
        url: '',
        source: 'kugou' as MusicSource,
        duration: s.duration * 1000,
      }))
    }
  } catch (e) {
    console.error(`Search ${source} failed:`, e)
  }
  return []
}

// 解析 LRC 歌词
function parseLRC(lrc: string): { time: number; text: string }[] {
  if (!lrc) return []
  const lines = lrc.split('\n')
  const result: { time: number; text: string }[] = []
  const re = /\[(\d+):(\d+)\.?(\d*)\](.*)/
  for (const line of lines) {
    const m = line.match(re)
    if (m) {
      const min = parseInt(m[1])
      const sec = parseInt(m[2])
      const ms = m[3] ? parseInt(m[3].padEnd(3, '0').slice(0, 3)) : 0
      const time = min * 60 + sec + ms / 1000
      const text = m[4].trim()
      if (text) result.push({ time, text })
    }
  }
  return result.sort((a, b) => a.time - b.time)
}

async function fetchLyrics(songId: string): Promise<{ time: number; text: string }[]> {
  if (!songId.startsWith('netease-')) return []
  const id = songId.replace('netease-', '')
  try {
    const res = await fetch(`/music-api/netease/api/song/lyric?id=${id}&lv=1&kv=1&tv=-1`)
    const data = await res.json()
    return parseLRC(data.lrc?.lyric || '')
  } catch {
    return []
  }
}

// ==================== 小游戏 ====================
function rollDice(): number[] {
  return [Math.ceil(Math.random() * 6), Math.ceil(Math.random() * 6)]
}
function generateDeck(): number[] {
  const deck: number[] = []
  for (let i = 0; i < 4; i++) for (let v = 1; v <= 13; v++) deck.push(v)
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[deck[i], deck[j]] = [deck[j], deck[i]]
  }
  return deck
}

// ==================== 组件 ====================
export default function MusicRoom() {
  // --- 状态 ---
  const [screen, setScreen] = useState<'lobby' | 'room'>('lobby')
  const [myName, setMyName] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const [roomName, setRoomName] = useState('听歌房')
  const [roomPassword, setRoomPassword] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [joinPassword, setJoinPassword] = useState('')
  const [error, setError] = useState('')

  const [players, setPlayers] = useState<Player[]>([])
  const [myId, setMyId] = useState('')
  const [myColor, setMyColor] = useState(PLAYER_COLORS[0])
  const [role, setRole] = useState<'host' | 'guest' | null>(null)
  const [connStatus, setConnStatus] = useState<'idle' | 'connecting' | 'connected' | 'failed'>('idle')

  const [playlist, setPlaylist] = useState<Song[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [playMode, setPlayMode] = useState<PlayMode>('loop')
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolume] = useState(0.7)

  const [searchKeyword, setSearchKeyword] = useState('')
  const [searchSource, setSearchSource] = useState<MusicSource>('netease')
  const [searchResults, setSearchResults] = useState<Song[]>([])
  const [searching, setSearching] = useState(false)
  const [leftTab, setLeftTab] = useState<'search' | 'hot'>('hot')

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')

  const [gameState, setGameState] = useState<GameState>({ type: null, data: null })
  const [activeRightTab, setActiveRightTab] = useState<'games' | 'gifts' | 'rank'>('rank')

  const [danmaku, setDanmaku] = useState<Danmaku[]>([])
  const [lyrics, setLyrics] = useState<{ current: string; next: string }>({ current: '', next: '' })
  const [rankStats, setRankStats] = useState<RankEntry[]>([])
  const [rankCategory, setRankCategory] = useState<'total' | 'songs' | 'chat' | 'gifts' | 'games'>('total')

  // --- refs ---
  const peerRef = useRef<Peer | null>(null)
  const connsRef = useRef<Map<string, DataConnection>>(new Map())
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const startTimeRef = useRef<number>(0)
  const playlistRef = useRef<Song[]>([])
  const currentIndexRef = useRef(0)
  const playingRef = useRef(false)
  const playModeRef = useRef<PlayMode>('loop')
  const roleRef = useRef<'host' | 'guest' | null>(null)
  const myIdRef = useRef('')
  const myNameRef = useRef('')
  const myColorRef = useRef(PLAYER_COLORS[0])
  const playersRef = useRef<Player[]>([])
  const passwordRef = useRef('')
  const gameStateRef = useRef<GameState>({ type: null, data: null })
  const roomNameRef = useRef('听歌房')
  const danmakuIdRef = useRef(0)
  const chatEndRef = useRef<HTMLDivElement | null>(null)
  const lyricsTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const currentLyricsRef = useRef<{ time: number; text: string }[]>([])
  const rankStatsRef = useRef<RankEntry[]>([])

  // --- 同步 refs ---
  useEffect(() => { playlistRef.current = playlist }, [playlist])
  useEffect(() => { currentIndexRef.current = currentIndex }, [currentIndex])
  useEffect(() => { playingRef.current = playing }, [playing])
  useEffect(() => { playModeRef.current = playMode }, [playMode])
  useEffect(() => { roleRef.current = role }, [role])
  useEffect(() => { myIdRef.current = myId }, [myId])
  useEffect(() => { myNameRef.current = myName }, [myName])
  useEffect(() => { myColorRef.current = myColor }, [myColor])
  useEffect(() => { playersRef.current = players }, [players])
  useEffect(() => { gameStateRef.current = gameState }, [gameState])
  useEffect(() => { roomNameRef.current = roomName }, [roomName])

  // --- 弹幕 ---
  const addDanmaku = useCallback((text: string, color: string, name: string) => {
    const id = ++danmakuIdRef.current
    const y = 5 + Math.random() * 80
    const speed = 10 + Math.random() * 4
    setDanmaku(prev => [...prev, { id, text, color, name, y, speed }])
    setTimeout(() => setDanmaku(prev => prev.filter(d => d.id !== id)), speed * 1000)
  }, [])

  // --- 广播 ---
  const broadcast = useCallback((msg: Msg) => {
    connsRef.current.forEach(conn => {
      if (conn.open) conn.send(msg)
    })
  }, [])

  const relayToOthers = useCallback((fromId: string, msg: Msg) => {
    connsRef.current.forEach((conn, id) => {
      if (id !== fromId && conn.open) conn.send(msg)
    })
  }, [])

  // --- 霸榜统计 (房主维护，广播同步) ---
  const bumpStat = useCallback((playerId: string, name: string, color: string, field: 'songsAdded' | 'chatCount' | 'giftsSent' | 'gamePlays') => {
    if (roleRef.current !== 'host') return
    const stats = rankStatsRef.current.map(s => ({ ...s }))
    let entry = stats.find(s => s.id === playerId)
    if (!entry) {
      entry = { id: playerId, name, color, songsAdded: 0, chatCount: 0, giftsSent: 0, gamePlays: 0, total: 0 }
      stats.push(entry)
    }
    entry.name = name
    entry.color = color
    entry[field]++
    entry.total = entry.songsAdded * 10 + entry.chatCount + entry.giftsSent * 5 + entry.gamePlays * 3
    stats.sort((a, b) => b.total - a.total)
    rankStatsRef.current = stats
    setRankStats(stats)
    broadcast({ t: 'rankstats', stats })
  }, [broadcast])

  // --- 系统消息 ---
  const addSystemMsg = useCallback((text: string) => {
    setChatMessages(prev => [...prev, {
      id: `sys-${Date.now()}-${Math.random()}`, userId: 'system', name: '系统', color: '#888',
      text, timestamp: Date.now(), type: 'system',
    }])
  }, [])

  // --- 音乐播放 ---
  const broadcastPlayState = useCallback(() => {
    if (roleRef.current === 'host') {
      broadcast({
        t: 'playstate',
        currentIndex: currentIndexRef.current,
        playing: playingRef.current,
        startTime: startTimeRef.current,
        playMode: playModeRef.current,
      })
    }
  }, [broadcast])

  const loadAndPlaySong = useCallback((index: number) => {
    const list = playlistRef.current
    if (index < 0 || index >= list.length) return
    setCurrentIndex(index)
    currentIndexRef.current = index
    const audio = audioRef.current
    if (!audio) return
    const song = list[index]
    if (!song.url) {
      addSystemMsg(`⚠️ ${song.name} 暂无播放链接`)
      return
    }
    audio.src = song.url
    audio.play().then(() => {
      startTimeRef.current = Date.now() - audio.currentTime * 1000
      setPlaying(true)
      playingRef.current = true
      broadcastPlayState()
      // 加载歌词
      fetchLyrics(song.id).then(parsed => {
        currentLyricsRef.current = parsed
        if (parsed.length === 0) setLyrics({ current: '', next: '' })
      })
    }).catch(() => {
      addSystemMsg(`⚠️ 《${song.name}》播放失败（可能需要VIP），自动跳过`)
      if (roleRef.current === 'host' && list.length > 1) {
        setTimeout(() => skipNextRef.current?.(), 1500)
      }
    })
  }, [broadcastPlayState, addSystemMsg])

  const togglePlay = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    if (playingRef.current) {
      audio.pause()
      setPlaying(false)
      playingRef.current = false
      startTimeRef.current = Date.now() - audio.currentTime * 1000
      broadcastPlayState()
    } else {
      const song = playlistRef.current[currentIndexRef.current]
      if (!song) return
      if (audio.src !== song.url) audio.src = song.url
      audio.play().then(() => {
        startTimeRef.current = Date.now() - audio.currentTime * 1000
        setPlaying(true)
        playingRef.current = true
        broadcastPlayState()
        fetchLyrics(song.id).then(parsed => {
          currentLyricsRef.current = parsed
        })
      }).catch(() => {
        addSystemMsg(`⚠️ 播放失败（可能需要VIP）`)
      })
    }
  }, [broadcastPlayState, addSystemMsg])

  const skipNext = useCallback(() => {
    const list = playlistRef.current
    if (list.length === 0) return
    let next: number
    if (playModeRef.current === 'single') {
      next = currentIndexRef.current
    } else if (playModeRef.current === 'shuffle') {
      next = Math.floor(Math.random() * list.length)
    } else {
      next = (currentIndexRef.current + 1) % list.length
    }
    loadAndPlaySong(next)
  }, [loadAndPlaySong])

  const skipPrev = useCallback(() => {
    const list = playlistRef.current
    if (list.length === 0) return
    const prev = (currentIndexRef.current - 1 + list.length) % list.length
    loadAndPlaySong(prev)
  }, [loadAndPlaySong])

  const skipNextRef = useRef(skipNext)
  useEffect(() => { skipNextRef.current = skipNext }, [skipNext])

  // --- 音频事件 ---
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.volume = volume
    const onTime = () => setCurrentTime(audio.currentTime)
    const onEnded = () => {
      if (roleRef.current === 'host') skipNextRef.current?.()
    }
    const onError = () => {
      if (roleRef.current === 'host' && playlistRef.current.length > 1) {
        addSystemMsg('⚠️ 播放出错，自动跳过')
        setTimeout(() => skipNextRef.current?.(), 1500)
      }
    }
    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('error', onError)
    return () => {
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('error', onError)
    }
  }, [volume, addSystemMsg])

  // --- 歌词同步 ---
  useEffect(() => {
    if (lyricsTimerRef.current) clearInterval(lyricsTimerRef.current)
    lyricsTimerRef.current = setInterval(() => {
      const list = currentLyricsRef.current
      if (list.length === 0) {
        setLyrics(prev => prev.current || prev.next ? { current: '', next: '' } : prev)
        return
      }
      const t = audioRef.current?.currentTime || 0
      let cur = '', next = ''
      for (let i = 0; i < list.length; i++) {
        if (list[i].time <= t) cur = list[i].text
        else { next = list[i].text; break }
      }
      setLyrics(prev =>
        prev.current === cur && prev.next === next ? prev : { current: cur, next }
      )
    }, 300)
    return () => {
      if (lyricsTimerRef.current) clearInterval(lyricsTimerRef.current)
    }
  }, [])

  // --- 客户端同步 ---
  useEffect(() => {
    if (role !== 'guest') return
    const timer = setInterval(() => {
      const audio = audioRef.current
      if (!audio || !playingRef.current) return
      const expectedTime = (Date.now() - startTimeRef.current) / 1000
      if (Math.abs(audio.currentTime - expectedTime) > 2) {
        audio.currentTime = expectedTime
      }
    }, 5000)
    return () => clearInterval(timer)
  }, [role])

  // --- 歌单操作 ---
  const addToPlaylist = useCallback((song: Song) => {
    song.addedBy = myNameRef.current
    const newList = [...playlistRef.current, song]
    setPlaylist(newList)
    playlistRef.current = newList
    addSystemMsg(`🎵 ${myNameRef.current} 点了《${song.name}》`)
    addDanmaku(`点了《${song.name}》`, '#fbbf24', myNameRef.current)
    broadcast({ t: 'addsong', song })
    bumpStat(myIdRef.current, myNameRef.current, myColorRef.current, 'songsAdded')
    // 如果当前没在播放，自动播放第一首
    if (playlistRef.current.length === 1 && roleRef.current === 'host') {
      loadAndPlaySong(0)
    }
  }, [broadcast, addSystemMsg, addDanmaku, loadAndPlaySong, bumpStat])

  const addHotSong = useCallback(async (hot: { name: string; artist: string }) => {
    try {
      const results = await searchMusic(`${hot.name} ${hot.artist}`, 'netease')
      if (results.length > 0) {
        addToPlaylist(results[0])
      } else {
        addSystemMsg(`未找到 ${hot.name} - ${hot.artist}`)
      }
    } catch {
      addSystemMsg(`搜索失败：${hot.name}`)
    }
  }, [addToPlaylist, addSystemMsg])

  const removeFromPlaylist = useCallback((index: number) => {
    const list = playlistRef.current
    if (index < 0 || index >= list.length) return
    const newList = list.filter((_, i) => i !== index)
    setPlaylist(newList)
    playlistRef.current = newList
    if (index === currentIndexRef.current) {
      if (newList.length === 0) {
        const audio = audioRef.current
        if (audio) { audio.pause(); audio.src = '' }
        setPlaying(false)
        playingRef.current = false
        currentLyricsRef.current = []
        setLyrics({ current: '', next: '' })
      } else {
        const newIndex = Math.min(index, newList.length - 1)
        setCurrentIndex(newIndex)
        currentIndexRef.current = newIndex
        if (roleRef.current === 'host') loadAndPlaySong(newIndex)
      }
    } else if (index < currentIndexRef.current) {
      setCurrentIndex(currentIndexRef.current - 1)
      currentIndexRef.current -= 1
    }
    broadcast({ t: 'removesong', index })
  }, [broadcast, loadAndPlaySong])

  const moveSong = useCallback((index: number, dir: 'up' | 'down') => {
    const list = [...playlistRef.current]
    const target = dir === 'up' ? index - 1 : index + 1
    if (target < 0 || target >= list.length) return
    ;[list[index], list[target]] = [list[target], list[index]]
    setPlaylist(list)
    playlistRef.current = list
    if (currentIndexRef.current === index) {
      setCurrentIndex(target)
      currentIndexRef.current = target
    } else if (currentIndexRef.current === target) {
      setCurrentIndex(index)
      currentIndexRef.current = index
    }
    if (roleRef.current === 'host') broadcast({ t: 'reorder', playlist: list })
  }, [broadcast])

  const togglePlayMode = useCallback(() => {
    const modes: PlayMode[] = ['loop', 'single', 'shuffle']
    const next = modes[(modes.indexOf(playModeRef.current) + 1) % modes.length]
    setPlayMode(next)
    playModeRef.current = next
    broadcastPlayState()
  }, [broadcastPlayState])

  // --- 搜索 ---
  const doSearch = useCallback(async () => {
    if (!searchKeyword.trim()) return
    setSearching(true)
    setSearchResults([])
    try {
      const results = await searchMusic(searchKeyword, searchSource)
      setSearchResults(results)
      if (results.length === 0) addSystemMsg(`未找到"${searchKeyword}"的相关歌曲`)
    } catch {
      addSystemMsg('搜索失败，请重试')
    } finally {
      setSearching(false)
    }
  }, [searchKeyword, searchSource, addSystemMsg])

  // --- 聊天 / 表情 / 礼物 ---
  const sendChat = useCallback(() => {
    if (!chatInput.trim()) return
    const msg: ChatMessage = {
      id: `chat-${Date.now()}-${Math.random()}`,
      userId: myIdRef.current, name: myNameRef.current, color: myColorRef.current,
      text: chatInput.trim(), timestamp: Date.now(), type: 'text',
    }
    setChatMessages(prev => [...prev, msg])
    addDanmaku(chatInput.trim(), myColorRef.current, myNameRef.current)
    broadcast({ t: 'chat', msg })
    bumpStat(myIdRef.current, myNameRef.current, myColorRef.current, 'chatCount')
    setChatInput('')
  }, [chatInput, broadcast, addDanmaku, bumpStat])

  const sendEmoji = useCallback((emoji: string) => {
    addDanmaku(emoji, myColorRef.current, myNameRef.current)
    broadcast({ t: 'chat', msg: {
      id: `emoji-${Date.now()}`, userId: myIdRef.current, name: myNameRef.current,
      color: myColorRef.current, text: emoji, timestamp: Date.now(), type: 'emoji',
    }})
    bumpStat(myIdRef.current, myNameRef.current, myColorRef.current, 'chatCount')
  }, [broadcast, addDanmaku, bumpStat])

  const sendGift = useCallback((gift: typeof GIFTS[0]) => {
    addDanmaku(gift.emoji, gift.color, myNameRef.current)
    broadcast({ t: 'chat', msg: {
      id: `gift-${Date.now()}`, userId: myIdRef.current, name: myNameRef.current,
      color: myColorRef.current, text: `${gift.emoji} 送出了 ${gift.name}`,
      timestamp: Date.now(), type: 'gift', giftName: gift.name,
    }})
    setChatMessages(prev => [...prev, {
      id: `gift-${Date.now()}-2`, userId: myIdRef.current, name: myNameRef.current,
      color: myColorRef.current, text: `${gift.emoji} 送出了 ${gift.name}`,
      timestamp: Date.now(), type: 'gift', giftName: gift.name,
    }])
    bumpStat(myIdRef.current, myNameRef.current, myColorRef.current, 'giftsSent')
  }, [broadcast, addDanmaku, bumpStat])

  // --- 游戏 ---
  const startGame = useCallback((type: 'dice' | 'fifteen20' | 'cards') => {
    let data: any = {}
    if (type === 'cards') data = { deck: generateDeck(), drawn: [] }
    if (type === 'fifteen20') data = { p1Hand: -1, p2Hand: -1, guess: -1, turn: 0 }
    if (type === 'dice') data = { results: {} }
    const state: GameState = { type, data }
    setGameState(state)
    gameStateRef.current = state
    broadcast({ t: 'game', state, by: myIdRef.current })
    bumpStat(myIdRef.current, myNameRef.current, myColorRef.current, 'gamePlays')
  }, [broadcast, bumpStat])

  const endGame = useCallback(() => {
    const state: GameState = { type: null, data: null }
    setGameState(state)
    gameStateRef.current = state
    broadcast({ t: 'game', state, by: myIdRef.current })
  }, [broadcast])

  const diceRoll = useCallback(() => {
    const dice = rollDice()
    const state: GameState = {
      type: 'dice',
      data: { ...gameStateRef.current.data, results: { ...gameStateRef.current.data?.results, [myIdRef.current]: { dice, name: myNameRef.current, color: myColorRef.current } } },
    }
    setGameState(state)
    gameStateRef.current = state
    broadcast({ t: 'game', state, by: myIdRef.current })
    bumpStat(myIdRef.current, myNameRef.current, myColorRef.current, 'gamePlays')
  }, [broadcast, bumpStat])

  const drawCard = useCallback(() => {
    const gs = gameStateRef.current
    if (gs.type !== 'cards' || !gs.data?.deck?.length) return
    const deck = [...gs.data.deck]
    const card = deck.pop()
    const drawn = [...(gs.data.drawn || []), { card, by: myNameRef.current, color: myColorRef.current }]
    const state: GameState = { ...gs, data: { ...gs.data, deck, drawn } }
    setGameState(state)
    gameStateRef.current = state
    broadcast({ t: 'game', state, by: myIdRef.current })
    bumpStat(myIdRef.current, myNameRef.current, myColorRef.current, 'gamePlays')
  }, [broadcast, bumpStat])

  const fifteen20Action = useCallback((action: 'hand' | 'guess', value: number) => {
    const gs = gameStateRef.current
    if (gs.type !== 'fifteen20') return
    const data = { ...gs.data }
    if (action === 'hand') {
      if (data.turn === 0) data.p1Hand = value
      else data.p2Hand = value
    } else {
      data.guess = value
    }
    const state: GameState = { ...gs, data }
    setGameState(state)
    gameStateRef.current = state
    broadcast({ t: 'game', state, by: myIdRef.current })
    bumpStat(myIdRef.current, myNameRef.current, myColorRef.current, 'gamePlays')
  }, [broadcast, bumpStat])

  const fifteen20Reveal = useCallback(() => {
    const gs = gameStateRef.current
    if (gs.type !== 'fifteen20') return
    const data = { ...gs.data, revealed: true }
    data.total = (data.p1Hand ?? 0) + (data.p2Hand ?? 0)
    data.correct = data.guess === data.total
    const state: GameState = { ...gs, data }
    setGameState(state)
    gameStateRef.current = state
    broadcast({ t: 'game', state, by: myIdRef.current })
  }, [broadcast])

  // --- 房间名称 ---
  const updateRoomName = useCallback((name: string) => {
    setRoomName(name)
    roomNameRef.current = name
    broadcast({ t: 'roomname', name })
  }, [broadcast])

  // --- PeerJS 消息处理 ---
  const handleMsg = useCallback((data: Msg, fromId: string) => {
    const isHost = roleRef.current === 'host'
    switch (data.t) {
      case 'hello': {
        if (!isHost) return
        if (data.password !== passwordRef.current) {
          const conn = connsRef.current.get(fromId)
          if (conn) conn.send({ t: 'reject', reason: '密码错误' } as Msg)
          return
        }
        const color = PLAYER_COLORS[playersRef.current.length % PLAYER_COLORS.length]
        const newPlayer: Player = { id: fromId, name: data.name, color, isHost: false }
        const newPlayers = [...playersRef.current, newPlayer]
        setPlayers(newPlayers)
        playersRef.current = newPlayers
        broadcast({ t: 'players', players: newPlayers })
        addSystemMsg(`🎉 ${data.name} 加入了房间`)
        const conn = connsRef.current.get(fromId)
        if (conn) {
          conn.send({
            t: 'welcome',
            players: newPlayers,
            yourColor: color,
            playlist: playlistRef.current,
            currentIndex: currentIndexRef.current,
            playMode: playModeRef.current,
            startTime: startTimeRef.current,
            playing: playingRef.current,
            roomName: roomNameRef.current,
            rankStats: rankStatsRef.current,
          } as Msg)
        }
        if (gameStateRef.current.type && conn) {
          conn.send({ t: 'game', state: gameStateRef.current, by: myIdRef.current } as Msg)
        }
        break
      }
      case 'reject': {
        setError(data.reason)
        setConnStatus('failed')
        break
      }
      case 'welcome': {
        setPlayers(data.players)
        playersRef.current = data.players
        setMyColor(data.yourColor)
        myColorRef.current = data.yourColor
        setPlaylist(data.playlist)
        playlistRef.current = data.playlist
        setCurrentIndex(data.currentIndex)
        currentIndexRef.current = data.currentIndex
        setPlayMode(data.playMode)
        playModeRef.current = data.playMode
        startTimeRef.current = data.startTime
        setPlaying(data.playing)
        playingRef.current = data.playing
        setRoomName(data.roomName)
        roomNameRef.current = data.roomName
        setRankStats(data.rankStats || [])
        rankStatsRef.current = data.rankStats || []
        setConnStatus('connected')
        const audio = audioRef.current
        const song = data.playlist[data.currentIndex]
        if (audio && song && data.playing) {
          audio.src = song.url
          audio.currentTime = (Date.now() - data.startTime) / 1000
          audio.play().catch(() => {})
          fetchLyrics(song.id).then(parsed => { currentLyricsRef.current = parsed })
        }
        break
      }
      case 'players': {
        setPlayers(data.players)
        playersRef.current = data.players
        break
      }
      case 'addsong': {
        const newList = [...playlistRef.current, data.song]
        setPlaylist(newList)
        playlistRef.current = newList
        addSystemMsg(`🎵 ${data.song.addedBy || '有人'} 点了《${data.song.name}》`)
        addDanmaku(`点了《${data.song.name}》`, '#fbbf24', data.song.addedBy || '有人')
        if (isHost) {
          const sender = playersRef.current.find(p => p.id === fromId)
          bumpStat(fromId, data.song.addedBy || '未知', sender?.color || '#888', 'songsAdded')
          relayToOthers(fromId, data)
        }
        break
      }
      case 'removesong': {
        const newList = playlistRef.current.filter((_, i) => i !== data.index)
        setPlaylist(newList)
        playlistRef.current = newList
        if (isHost) relayToOthers(fromId, data)
        break
      }
      case 'reorder': {
        setPlaylist(data.playlist)
        playlistRef.current = data.playlist
        break
      }
      case 'playstate': {
        if (data.currentIndex !== currentIndexRef.current) {
          setCurrentIndex(data.currentIndex)
          currentIndexRef.current = data.currentIndex
          const audio = audioRef.current
          const song = playlistRef.current[data.currentIndex]
          if (audio && song) {
            audio.src = song.url
            if (data.playing) {
              audio.currentTime = (Date.now() - data.startTime) / 1000
              audio.play().catch(() => {})
              fetchLyrics(song.id).then(parsed => { currentLyricsRef.current = parsed })
            }
          }
        } else {
          const audio = audioRef.current
          if (audio) {
            if (data.playing && !playingRef.current) {
              audio.currentTime = (Date.now() - data.startTime) / 1000
              audio.play().catch(() => {})
              setPlaying(true)
            } else if (!data.playing && playingRef.current) {
              audio.pause()
              setPlaying(false)
            }
          }
        }
        playingRef.current = data.playing
        setPlaying(data.playing)
        setPlayMode(data.playMode)
        playModeRef.current = data.playMode
        startTimeRef.current = data.startTime
        break
      }
      case 'chat': {
        setChatMessages(prev => [...prev, data.msg])
        if (data.msg.type === 'emoji' || data.msg.type === 'gift') {
          const display = data.msg.type === 'emoji' ? data.msg.text : data.msg.text.split(' ')[0]
          addDanmaku(display, data.msg.color, data.msg.name)
        }
        if (isHost) {
          bumpStat(data.msg.userId, data.msg.name, data.msg.color, data.msg.type === 'gift' ? 'giftsSent' : 'chatCount')
          relayToOthers(fromId, data)
        }
        break
      }
      case 'game': {
        setGameState(data.state)
        gameStateRef.current = data.state
        if (isHost) {
          if (data.by !== myIdRef.current) {
            const sender = playersRef.current.find(p => p.id === data.by)
            bumpStat(data.by, sender?.name || '未知', sender?.color || '#888', 'gamePlays')
          }
          relayToOthers(fromId, data)
        }
        break
      }
      case 'hostmigrate': {
        if (data.newHostId === myIdRef.current) {
          setRole('host')
          roleRef.current = 'host'
          addSystemMsg('👑 你成为了新房主')
        }
        setPlayers(prev => {
          const updated = prev.map(p => ({ ...p, isHost: p.id === data.newHostId }))
          playersRef.current = updated
          return updated
        })
        break
      }
      case 'roomname': {
        setRoomName(data.name)
        roomNameRef.current = data.name
        break
      }
      case 'rankstats': {
        setRankStats(data.stats)
        rankStatsRef.current = data.stats
        break
      }
    }
  }, [broadcast, relayToOthers, addSystemMsg, addDanmaku, bumpStat])

  const handleMsgRef = useRef(handleMsg)
  useEffect(() => { handleMsgRef.current = handleMsg }, [handleMsg])

  // --- 创建房间 ---
  const createRoom = useCallback(() => {
    if (!myName.trim()) { setError('请输入昵称'); return }
    setError('')
    setRole('host')
    roleRef.current = 'host'
    setConnStatus('connecting')
    const code = Math.random().toString(36).slice(2, 6).toUpperCase()
    setRoomCode(code)
    passwordRef.current = roomPassword
    const peer = new Peer(PEER_PREFIX + code)
    peerRef.current = peer
    const me: Player = { id: '', name: myName, color: PLAYER_COLORS[0], isHost: true }
    setPlayers([me])
    playersRef.current = [me]
    setMyColor(PLAYER_COLORS[0])
    myColorRef.current = PLAYER_COLORS[0]

    peer.on('open', (id) => {
      setMyId(id)
      myIdRef.current = id
      playersRef.current[0].id = id
      setPlayers([...playersRef.current])
      setConnStatus('connected')
      setScreen('room')
      addSystemMsg(`🎉 房间创建成功，房间号：${code}`)
    })

    peer.on('connection', (conn) => {
      conn.on('open', () => { connsRef.current.set(conn.peer, conn) })
      conn.on('data', (raw: any) => { handleMsgRef.current(raw as Msg, conn.peer) })
      conn.on('close', () => {
        connsRef.current.delete(conn.peer)
        if (roleRef.current === 'host') {
          const remaining = playersRef.current.filter(p => p.id !== conn.peer)
          setPlayers(remaining)
          playersRef.current = remaining
          broadcast({ t: 'players', players: remaining })
          const left = playersRef.current.find(p => p.id === conn.peer)
          if (left) addSystemMsg(`👋 ${left.name} 离开了房间`)
        }
      })
    })

    peer.on('error', (err) => {
      console.error('Peer error:', err)
      setConnStatus('failed')
      setError('创建房间失败：' + err.message)
    })
  }, [myName, roomPassword, broadcast, addSystemMsg])

  // --- 加入房间 ---
  const joinRoom = useCallback(() => {
    if (!myName.trim()) { setError('请输入昵称'); return }
    if (!joinCode.trim()) { setError('请输入房间号'); return }
    setError('')
    setRole('guest')
    roleRef.current = 'guest'
    setConnStatus('connecting')
    setRoomCode(joinCode.toUpperCase())
    passwordRef.current = joinPassword

    const peer = new Peer()
    peerRef.current = peer

    peer.on('open', (id) => {
      setMyId(id)
      myIdRef.current = id
      const conn = peer.connect(PEER_PREFIX + joinCode.toUpperCase(), { reliable: true })
      conn.on('open', () => {
        connsRef.current.set(conn.peer, conn)
        conn.send({ t: 'hello', name: myName, password: joinPassword } as Msg)
      })
      conn.on('data', (raw: any) => { handleMsgRef.current(raw as Msg, conn.peer) })
      conn.on('close', () => {
        setConnStatus('failed')
        addSystemMsg('❌ 与房主的连接已断开')
      })
    })

    peer.on('error', (err) => {
      console.error('Peer error:', err)
      setConnStatus('failed')
      setError('加入房间失败：' + err.message)
    })
  }, [myName, joinCode, joinPassword, addSystemMsg])

  // --- 离开房间 ---
  const leaveRoom = useCallback(() => {
    if (roleRef.current === 'host' && playersRef.current.length > 1) {
      const nextHost = playersRef.current.find(p => p.id !== myIdRef.current)
      if (nextHost) broadcast({ t: 'hostmigrate', newHostId: nextHost.id })
    }
    connsRef.current.forEach(conn => conn.close())
    connsRef.current.clear()
    peerRef.current?.destroy()
    peerRef.current = null
    setScreen('lobby')
    setPlayers([])
    playersRef.current = []
    setPlaylist([])
    playlistRef.current = []
    setChatMessages([])
    setGameState({ type: null, data: null })
    gameStateRef.current = { type: null, data: null }
    setRole(null)
    roleRef.current = null
    setConnStatus('idle')
    setRoomCode('')
    setDanmaku([])
    currentLyricsRef.current = []
    setLyrics({ current: '', next: '' })
    setRankStats([])
    rankStatsRef.current = []
    setRankCategory('total')
    const audio = audioRef.current
    if (audio) { audio.pause(); audio.src = '' }
    setPlaying(false)
    playingRef.current = false
  }, [broadcast])

  // --- 清理 ---
  useEffect(() => {
    return () => {
      peerRef.current?.destroy()
      if (lyricsTimerRef.current) clearInterval(lyricsTimerRef.current)
    }
  }, [])

  // ==================== UI ====================
  const currentSong = playlist[currentIndex]
  const isHost = role === 'host'

  if (screen === 'lobby') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-pink-500 to-purple-600 mb-4 shadow-2xl shadow-purple-500/30">
              <Headphones className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">共享听歌房</h1>
            <p className="text-purple-300 text-sm">和好友一起听歌 · 聊天 · 玩游戏</p>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/10 space-y-5">
            <div>
              <label className="text-purple-300 text-sm mb-1.5 block">昵称</label>
              <input
                value={myName}
                onChange={e => setMyName(e.target.value)}
                maxLength={12}
                placeholder="输入你的昵称"
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder-purple-400/50 focus:outline-none focus:border-pink-400"
              />
            </div>

            <div className="pt-2 border-t border-white/10">
              <div className="flex items-center gap-2 text-purple-300 text-sm mb-2">
                <Crown className="w-4 h-4" /> 创建房间
              </div>
              <input
                value={roomName}
                onChange={e => setRoomName(e.target.value)}
                maxLength={20}
                placeholder="房间名称"
                className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/10 text-white placeholder-purple-400/50 focus:outline-none focus:border-pink-400 mb-2"
              />
              <input
                value={roomPassword}
                onChange={e => setRoomPassword(e.target.value)}
                maxLength={10}
                placeholder="房间密码（可选）"
                className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/10 text-white placeholder-purple-400/50 focus:outline-none focus:border-pink-400 mb-2"
              />
              <button
                onClick={createRoom}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-medium hover:opacity-90 transition-opacity"
              >
                创建房间
              </button>
            </div>

            <div className="pt-2 border-t border-white/10">
              <div className="flex items-center gap-2 text-purple-300 text-sm mb-2">
                <Users className="w-4 h-4" /> 加入房间
              </div>
              <input
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                maxLength={4}
                placeholder="房间号（4位）"
                className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/10 text-white placeholder-purple-400/50 focus:outline-none focus:border-pink-400 mb-2 uppercase tracking-widest text-center font-mono text-lg"
              />
              <input
                value={joinPassword}
                onChange={e => setJoinPassword(e.target.value)}
                maxLength={10}
                placeholder="房间密码（如有）"
                className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/10 text-white placeholder-purple-400/50 focus:outline-none focus:border-pink-400 mb-2"
              />
              <button
                onClick={joinRoom}
                className="w-full py-3 rounded-xl bg-white/10 border border-white/10 text-white font-medium hover:bg-white/20 transition-colors"
              >
                加入房间
              </button>
            </div>

            {error && (
              <div className="text-red-400 text-sm text-center bg-red-500/10 rounded-lg py-2 px-3">{error}</div>
            )}

            <div className="text-purple-400/60 text-xs text-center">
              支持 网易云 / QQ音乐 / 酷狗音乐 搜索点歌
            </div>
          </div>
        </div>
        <audio ref={audioRef} />
      </div>
    )
  }

  // ==================== 房间界面 (3 栏布局) ====================
  return (
    <div className="h-screen flex bg-slate-900 text-white overflow-hidden">
      {/* ==================== 左侧栏 ==================== */}
      <div className="w-80 flex flex-col bg-slate-800/50 border-r border-white/5">
        {/* 搜索 + Tab */}
        <div className="p-3 border-b border-white/5">
          <div className="flex gap-1 mb-2">
            <button
              onClick={() => setLeftTab('hot')}
              className={`flex-1 py-1.5 text-xs rounded-lg transition-colors ${
                leftTab === 'hot' ? 'bg-pink-500 text-white' : 'bg-white/5 text-purple-300 hover:bg-white/10'
              }`}
            >
              热门歌曲
            </button>
            <button
              onClick={() => setLeftTab('search')}
              className={`flex-1 py-1.5 text-xs rounded-lg transition-colors ${
                leftTab === 'search' ? 'bg-pink-500 text-white' : 'bg-white/5 text-purple-300 hover:bg-white/10'
              }`}
            >
              搜索
            </button>
          </div>
          {leftTab === 'search' && (
            <>
              <div className="flex gap-1 mb-2">
                {(['netease', 'qq', 'kugou'] as MusicSource[]).map(s => (
                  <button
                    key={s}
                    onClick={() => setSearchSource(s)}
                    className={`flex-1 py-1 text-[10px] rounded transition-colors ${
                      searchSource === s ? 'bg-white/20 text-white' : 'text-purple-400 hover:text-white'
                    }`}
                  >
                    {s === 'netease' ? '网易云' : s === 'qq' ? 'QQ' : '酷狗'}
                  </button>
                ))}
              </div>
              <div className="flex gap-1">
                <input
                  value={searchKeyword}
                  onChange={e => setSearchKeyword(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') doSearch() }}
                  placeholder="搜索歌曲..."
                  className="flex-1 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs placeholder-purple-400/50 focus:outline-none focus:border-pink-400"
                />
                <button
                  onClick={doSearch}
                  disabled={searching}
                  className="px-2.5 py-1.5 rounded-lg bg-pink-500 text-white text-xs disabled:opacity-50"
                >
                  <Search className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          )}
        </div>

        {/* 歌曲列表 */}
        <div className="flex-1 overflow-y-auto">
          {leftTab === 'search' && searchResults.length > 0 ? (
            <div>
              <div className="px-3 py-2 text-[10px] text-purple-400 border-b border-white/5">
                搜索结果 ({searchResults.length})
              </div>
              {searchResults.map((song, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2 hover:bg-white/5 group">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-white truncate">{song.name}</div>
                    <div className="text-[10px] text-purple-400 truncate">{song.artist}</div>
                  </div>
                  <button
                    onClick={() => addToPlaylist(song)}
                    className="opacity-0 group-hover:opacity-100 px-2 py-0.5 rounded text-[10px] bg-pink-500/20 text-pink-300 hover:bg-pink-500/30 transition-all whitespace-nowrap"
                  >
                    + 添加歌单
                  </button>
                </div>
              ))}
            </div>
          ) : leftTab === 'hot' ? (
            <div>
              <div className="px-3 py-2 text-[10px] text-purple-400 border-b border-white/5 flex items-center justify-between">
                <span>热门歌曲 Top {HOT_SONGS.length}</span>
                <span className="text-purple-500">点击 + 添加歌单</span>
              </div>
              {HOT_SONGS.map((hot, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/5 group">
                  <div className="text-[10px] text-purple-500 w-4">{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-white truncate">{hot.name}</div>
                    <div className="text-[10px] text-purple-400 truncate">{hot.artist}</div>
                  </div>
                  <button
                    onClick={() => addHotSong(hot)}
                    className="opacity-0 group-hover:opacity-100 px-2 py-0.5 rounded text-[10px] bg-pink-500/20 text-pink-300 hover:bg-pink-500/30 transition-all whitespace-nowrap"
                  >
                    + 添加歌单
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-3 py-2 text-[10px] text-purple-400">
              {searching ? '搜索中...' : '输入关键词搜索歌曲'}
            </div>
          )}
        </div>

        {/* 待播放歌单 */}
        <div className="border-t border-white/5 h-2/5 flex flex-col">
          <div className="px-3 py-2 text-xs text-purple-300 border-b border-white/5 flex items-center justify-between">
            <span>待播放歌单 ({playlist.length})</span>
            <span className="text-[10px] text-purple-500">
              {playMode === 'loop' ? '列表循环' : playMode === 'single' ? '单曲' : '随机'}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {playlist.length === 0 ? (
              <div className="text-center py-6 text-purple-500/50 text-xs">还没有歌曲</div>
            ) : (
              playlist.map((song, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 group ${i === currentIndex ? 'bg-pink-500/10' : 'hover:bg-white/5'}`}
                >
                  <div className="flex flex-col gap-0.5">
                    <button onClick={() => moveSong(i, 'up')} disabled={i === 0} className="w-3 h-3 text-purple-400 hover:text-white disabled:opacity-30 flex items-center justify-center">
                      <ChevronUp className="w-2.5 h-2.5" />
                    </button>
                    <button onClick={() => moveSong(i, 'down')} disabled={i === playlist.length - 1} className="w-3 h-3 text-purple-400 hover:text-white disabled:opacity-30 flex items-center justify-center">
                      <ChevronDown className="w-2.5 h-2.5" />
                    </button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs truncate ${i === currentIndex ? 'text-pink-300' : 'text-white'}`}>
                      {i === currentIndex && playing && <Play className="w-2.5 h-2.5 inline animate-pulse mr-1" />}
                      {song.name}
                    </div>
                    <div className="text-[10px] text-purple-400 truncate">{song.artist}</div>
                  </div>
                  <button onClick={() => removeFromPlaylist(i)} className="w-5 h-5 rounded text-red-400 hover:text-red-300 hover:bg-red-500/10 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ==================== 中间栏 ==================== */}
      <div className="flex-1 flex flex-col bg-slate-900 min-w-0">
        {/* 当前播放信息 */}
        <div className="px-6 py-3 text-center border-b border-white/5">
          <div className="text-sm text-purple-300">
            当前播放歌曲：<span className="text-white font-medium">{currentSong?.name || '—'}</span>
            {currentSong && <span className="text-white/70"> - {currentSong.artist}</span>}
          </div>
        </div>

        {/* 视频/封面 + 弹幕 */}
        <div className="flex-1 relative bg-black mx-4 my-3 rounded-2xl overflow-hidden shadow-2xl">
          {currentSong?.cover ? (
            <img src={currentSong.cover} alt="" className="w-full h-full object-contain" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900/50 to-pink-900/50">
              <div className="text-center">
                <Music className="w-24 h-24 text-white/20 mx-auto mb-3" />
                <p className="text-white/30 text-sm">点歌后这里会显示封面</p>
              </div>
            </div>
          )}
          {/* 弹幕层 */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {danmaku.map(d => (
              <div
                key={d.id}
                className="absolute whitespace-nowrap text-sm font-medium"
                style={{
                  top: `${d.y}%`,
                  left: '100%',
                  color: d.color,
                  textShadow: '1px 1px 2px rgba(0,0,0,0.8), 0 0 4px rgba(0,0,0,0.5)',
                  animation: `danmaku-scroll ${d.speed}s linear forwards`,
                }}
              >
                {d.text}
              </div>
            ))}
            <style>{`
              @keyframes danmaku-scroll {
                from { transform: translateX(0); }
                to { transform: translateX(-100vw); }
              }
            `}</style>
          </div>
        </div>

        {/* 歌词 */}
        <div className="px-6 py-2 h-20 text-center flex flex-col justify-center">
          {lyrics.current ? (
            <div className="text-white text-sm">{lyrics.current}</div>
          ) : (
            <div className="text-purple-500/50 text-sm">
              {currentSong ? '♪ 暂无歌词 ♪' : '♪ 等待点歌 ♪'}
            </div>
          )}
          {lyrics.next && (
            <div className="text-purple-400/50 text-xs mt-0.5">{lyrics.next}</div>
          )}
        </div>

        {/* 播放器控制 */}
        <div className="px-6 pb-3">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-purple-400 text-xs w-10 text-right">{formatTime(currentTime)}</span>
            <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-pink-500 to-purple-500"
                style={{ width: `${currentSong?.duration ? (currentTime / (currentSong.duration / 1000)) * 100 : 0}%` }}
              />
            </div>
            <span className="text-purple-400 text-xs w-10">{currentSong?.duration ? formatTime(currentSong.duration / 1000) : '0:00'}</span>
          </div>
          <div className="flex items-center justify-center gap-4">
            <button onClick={togglePlayMode} className="text-purple-300 hover:text-white">
              {playMode === 'loop' ? <Repeat className="w-4 h-4" /> : playMode === 'single' ? <Repeat1 className="w-4 h-4" /> : <Shuffle className="w-4 h-4" />}
            </button>
            <button onClick={skipPrev} disabled={!currentSong} className="w-9 h-9 rounded-full bg-white/5 text-white hover:bg-white/10 flex items-center justify-center disabled:opacity-30">
              <SkipBack className="w-4 h-4" />
            </button>
            <button
              onClick={togglePlay}
              disabled={!currentSong}
              className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 text-white flex items-center justify-center disabled:opacity-30"
            >
              {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </button>
            <button onClick={skipNext} disabled={!currentSong} className="w-9 h-9 rounded-full bg-white/5 text-white hover:bg-white/10 flex items-center justify-center disabled:opacity-30">
              <SkipForward className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1.5 ml-2">
              <Volume2 className="w-3.5 h-3.5 text-purple-300" />
              <input
                type="range" min={0} max={1} step={0.05} value={volume}
                onChange={e => { setVolume(Number(e.target.value)); if (audioRef.current) audioRef.current.volume = Number(e.target.value) }}
                className="w-16 h-1 accent-pink-500"
              />
            </div>
          </div>
        </div>

        {/* 聊天输入 */}
        <div className="px-4 py-2 bg-slate-800/50 border-t border-white/5 flex items-center gap-2">
          <div className="flex items-center gap-1 max-w-[300px] overflow-x-auto">
            {EMOJIS.slice(0, 8).map(e => (
              <button
                key={e}
                onClick={() => sendEmoji(e)}
                className="w-7 h-7 text-base hover:bg-white/10 rounded flex-shrink-0"
              >
                {e}
              </button>
            ))}
          </div>
          <input
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') sendChat() }}
            placeholder="请输入互动弹幕..."
            className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-purple-400/50 focus:outline-none focus:border-pink-400"
          />
          <button onClick={sendChat} className="w-9 h-9 rounded-lg bg-pink-500 text-white flex items-center justify-center">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ==================== 右侧栏 ==================== */}
      <div className="w-80 flex flex-col bg-slate-800/50 border-l border-white/5">
        {/* 房间信息 + 用户 */}
        <div className="border-b border-white/5">
          <div className="px-3 py-2 flex items-center justify-between">
            <div className="flex-1 min-w-0">
              {isHost ? (
                <input
                  value={roomName}
                  onChange={e => updateRoomName(e.target.value)}
                  className="w-full text-sm text-white font-medium bg-transparent border-b border-white/10 focus:outline-none focus:border-pink-400 px-0"
                  placeholder="房间名称"
                />
              ) : (
                <div className="text-sm text-white font-medium truncate">{roomName}</div>
              )}
              <div className="text-[10px] text-purple-400 mt-0.5 flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${connStatus === 'connected' ? 'bg-green-400' : 'bg-yellow-400'}`} />
                {players.length} 人在线
              </div>
            </div>
            <div className="flex flex-col gap-1 items-end">
              <button
                onClick={() => { navigator.clipboard?.writeText(roomCode) }}
                className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/10 text-white text-[10px] hover:bg-white/20"
              >
                <Copy className="w-2.5 h-2.5" /> 房间号 {roomCode}
              </button>
              {passwordRef.current && (
                <div className="text-[10px] text-purple-400">密码 {passwordRef.current}</div>
              )}
            </div>
          </div>
          <div className="px-3 pb-3 grid grid-cols-4 gap-2">
            {players.map(p => (
              <div key={p.id} className="aspect-square rounded-lg bg-white/5 flex flex-col items-center justify-center relative">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-medium" style={{ background: p.color }}>
                  {p.name[0]?.toUpperCase() || '?'}
                </div>
                <div className="text-[10px] text-purple-300 mt-0.5 truncate w-full text-center px-0.5">{p.name}</div>
                {p.isHost && <Crown className="absolute top-0.5 right-0.5 w-3 h-3 text-yellow-400" />}
              </div>
            ))}
            {Array.from({ length: Math.max(0, 8 - players.length) }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square rounded-full border-2 border-dashed border-white/10" />
            ))}
          </div>
        </div>

        {/* Tab 切换 */}
        <div className="flex border-b border-white/5">
          {(['rank', 'games', 'gifts'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveRightTab(tab)}
              className={`flex-1 py-2 text-xs font-medium transition-colors ${
                activeRightTab === tab ? 'text-pink-400 border-b-2 border-pink-400' : 'text-purple-400 hover:text-white'
              }`}
            >
              {tab === 'rank' ? '🏆 霸榜' : tab === 'games' ? '游戏' : '礼物'}
            </button>
          ))}
        </div>

        {/* 霸榜 / 游戏 / 礼物网格 */}
        <div className="flex-1 overflow-y-auto p-3">
          {activeRightTab === 'rank' && (
            <div>
              {/* 分类切换 */}
              <div className="flex gap-1 mb-3">
                {([
                  { key: 'total', label: '总榜' },
                  { key: 'songs', label: '点歌' },
                  { key: 'chat', label: '聊天' },
                  { key: 'gifts', label: '礼物' },
                  { key: 'games', label: '游戏' },
                ] as const).map(cat => (
                  <button
                    key={cat.key}
                    onClick={() => setRankCategory(cat.key)}
                    className={`flex-1 py-1 text-[10px] rounded transition-colors ${
                      rankCategory === cat.key ? 'bg-pink-500 text-white' : 'bg-white/5 text-purple-400 hover:bg-white/10'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* 排名列表 */}
              {(() => {
                const fieldMap: Record<string, keyof RankEntry> = {
                  total: 'total',
                  songs: 'songsAdded',
                  chat: 'chatCount',
                  gifts: 'giftsSent',
                  games: 'gamePlays',
                }
                const field = fieldMap[rankCategory]
                const sorted = [...rankStats].sort((a, b) => (b[field] as number) - (a[field] as number))
                const medals = ['🥇', '🥈', '🥉']

                if (sorted.length === 0) {
                  return (
                    <div className="text-center py-8 text-purple-500/50 text-xs leading-relaxed">
                      <Trophy className="w-10 h-10 text-purple-700 mx-auto mb-3" />
                      还没有霸榜数据<br />点歌、聊天、送礼、玩游戏即可上榜
                    </div>
                  )
                }

                return (
                  <div className="space-y-1.5">
                    {sorted.map((entry, i) => (
                      <div
                        key={entry.id}
                        className={`flex items-center gap-2 p-2 rounded-lg transition-all ${
                          i < 3 ? 'bg-gradient-to-r from-white/10 to-transparent' : 'bg-white/5'
                        } ${entry.id === myId ? 'ring-1 ring-pink-400/50' : ''}`}
                      >
                        <div className="w-6 text-center text-base flex-shrink-0">
                          {i < 3 ? medals[i] : <span className="text-purple-400 text-xs font-bold">{i + 1}</span>}
                        </div>
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0"
                          style={{ background: entry.color }}
                        >
                          {entry.name[0]?.toUpperCase() || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-white truncate flex items-center gap-1">
                            {entry.name}
                            {entry.id === myId && <span className="text-[9px] text-pink-400">(我)</span>}
                          </div>
                          <div className="text-[9px] text-purple-400 flex gap-1.5 mt-0.5">
                            <span>🎵{entry.songsAdded}</span>
                            <span>💬{entry.chatCount}</span>
                            <span>🎁{entry.giftsSent}</span>
                            <span>🎲{entry.gamePlays}</span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-sm font-bold text-pink-300">
                            {rankCategory === 'total' ? entry.total : entry[field] as number}
                          </div>
                          <div className="text-[9px] text-purple-500">分</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })()}

              {/* 积分规则提示 */}
              <div className="mt-3 pt-2 border-t border-white/5 text-[9px] text-purple-500/60 leading-relaxed">
                积分规则: 点歌×10 | 聊天×1 | 礼物×5 | 游戏×3
              </div>
            </div>
          )}

          {activeRightTab === 'games' && (
            <div>
              {!gameState.type ? (
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'dice', name: '摇骰子', emoji: '🎲', color: 'from-orange-500 to-red-500' },
                    { id: 'fifteen20', name: '十五二十', emoji: '✋', color: 'from-blue-500 to-cyan-500' },
                    { id: 'cards', name: '小姐牌', emoji: '🃏', color: 'from-purple-500 to-pink-500' },
                  ].map(g => (
                    <button
                      key={g.id}
                      onClick={() => startGame(g.id as any)}
                      className={`aspect-square rounded-xl bg-gradient-to-br ${g.color} hover:opacity-80 transition-opacity flex flex-col items-center justify-center`}
                    >
                      <span className="text-2xl mb-0.5">{g.emoji}</span>
                      <span className="text-[10px] text-white">{g.name}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white text-xs font-medium">
                      {gameState.type === 'dice' ? '🎲 摇骰子' : gameState.type === 'fifteen20' ? '✋ 十五二十' : '🃏 小姐牌'}
                    </span>
                    <button onClick={endGame} className="text-red-400 text-[10px] hover:text-red-300">结束</button>
                  </div>

                  {gameState.type === 'dice' && (
                    <>
                      <button onClick={diceRoll} className="w-full py-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs">🎲 摇骰子</button>
                      {Object.entries(gameState.data?.results || {}).map(([pid, r]: [string, any]) => (
                        <div key={pid} className="flex items-center gap-2 p-1.5 rounded bg-white/5 text-xs">
                          <span style={{ color: r.color }}>{r.name}</span>
                          <span className="text-lg ml-auto">{r.dice[0]} + {r.dice[1]} = {r.dice[0] + r.dice[1]}</span>
                        </div>
                      ))}
                    </>
                  )}

                  {gameState.type === 'fifteen20' && (
                    <>
                      <div className="flex items-center justify-between p-1.5 rounded bg-white/5 text-xs">
                        <span className="text-purple-400">玩家1</span>
                        <span className="text-white text-base">{gameState.data.p1Hand >= 0 ? ['✊', '🖐', '🙌'][gameState.data.p1Hand / 5] : '待出'}</span>
                      </div>
                      <div className="flex items-center justify-between p-1.5 rounded bg-white/5 text-xs">
                        <span className="text-purple-400">玩家2</span>
                        <span className="text-white text-base">{gameState.data.p2Hand >= 0 ? ['✊', '🖐', '🙌'][gameState.data.p2Hand / 5] : '待出'}</span>
                      </div>
                      {gameState.data.revealed ? (
                        <div className="text-center p-2 rounded-lg bg-white/5">
                          <div className="text-white text-sm">总计: {gameState.data.total}</div>
                          <div className={`text-xs mt-1 ${gameState.data.correct ? 'text-green-400' : 'text-red-400'}`}>
                            {gameState.data.correct ? '猜中了！对方喝 🍺' : '没猜中，继续！'}
                          </div>
                          <button onClick={() => startGame('fifteen20')} className="mt-1 px-2 py-1 rounded bg-white/10 text-white text-[10px]">再来一局</button>
                        </div>
                      ) : (
                        <>
                          <div className="flex gap-1">
                            {[0, 5, 10].map(v => (
                              <button key={v} onClick={() => fifteen20Action('hand', v)} className="flex-1 py-1.5 rounded bg-white/5 text-white text-[10px] hover:bg-white/10">
                                {v === 0 ? '✊ 0' : v === 5 ? '🖐 5' : '🙌 10'}
                              </button>
                            ))}
                          </div>
                          <div className="flex gap-1">
                            {[0, 5, 10, 15, 20].map(v => (
                              <button key={v} onClick={() => fifteen20Action('guess', v)} className={`flex-1 py-1.5 rounded text-[10px] ${gameState.data.guess === v ? 'bg-pink-500 text-white' : 'bg-white/5 text-white hover:bg-white/10'}`}>
                                {v}
                              </button>
                            ))}
                          </div>
                          <button onClick={fifteen20Reveal} className="w-full py-1.5 rounded-lg bg-pink-500 text-white text-xs">揭晓！</button>
                        </>
                      )}
                    </>
                  )}

                  {gameState.type === 'cards' && (
                    <>
                      <button onClick={drawCard} className="w-full py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs">🃏 抽一张牌</button>
                      <div className="text-[10px] text-purple-400 text-center">剩余 {gameState.data?.deck?.length || 0} 张</div>
                      <div className="space-y-1 max-h-64 overflow-y-auto">
                        {(gameState.data?.drawn || []).slice().reverse().map((d: any, i: number) => (
                          <div key={i} className="flex items-center gap-2 p-1.5 rounded bg-white/5">
                            <div className="w-8 h-11 rounded bg-white flex flex-col items-center justify-center flex-shrink-0">
                              <span className="text-black text-xs font-bold">{d.card === 1 ? 'A' : d.card === 11 ? 'J' : d.card === 12 ? 'Q' : d.card === 13 ? 'K' : d.card}</span>
                              <span className="text-red-500 text-[8px]">♥</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-white text-[10px] truncate">{CARD_RULES[d.card]}</div>
                              <div className="text-purple-400 text-[9px]">{d.by} 抽到</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {activeRightTab === 'gifts' && (
            <div className="grid grid-cols-4 gap-2">
              {GIFTS.map(g => (
                <button
                  key={g.id}
                  onClick={() => sendGift(g)}
                  className="aspect-square rounded-xl bg-white/5 hover:bg-white/10 transition-colors flex flex-col items-center justify-center"
                >
                  <span className="text-2xl mb-0.5">{g.emoji}</span>
                  <span className="text-[10px] text-purple-300">{g.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 底部：离开 */}
        <div className="p-3 border-t border-white/5">
          <button
            onClick={leaveRoom}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-red-500/20 text-red-300 text-xs hover:bg-red-500/30"
          >
            <LogOut className="w-3 h-3" /> 离开房间
          </button>
        </div>
      </div>

      <audio ref={audioRef} />
    </div>
  )
}

function formatTime(sec: number): string {
  if (!sec || isNaN(sec)) return '0:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}
