import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { EmulatorJS } from 'react-emulatorjs'
import { NES_CONTROLS } from '../nesControls'
import {
  Home, Menu, X, Gamepad2, Search, ChevronDown,
  Monitor, Cpu, AlertCircle, RotateCcw, Moon, Sun,
  Coins, Play
} from 'lucide-react'

// ==================== 类型定义 ====================

interface GameConfig {
  id: string
  title: string
  subtitle?: string
  romPath?: string
  category: 'nes' | 'arcade' | 'gba' | 'gbc' | 'snes' | 'md' | 'n64' | 'web'
  core?: 'nes' | 'fbneo' | 'mame2003' | 'mame2003_plus' | 'mgba' | 'gambatte' | 'snes9x' | 'genesis_plus_gx' | 'mupen64plus_next'
  biosPath?: string
  iframeUrl?: string  // Web/HTML5 游戏用 iframe 嵌入
  broken?: string     // 游戏不可用原因说明
  noSandbox?: boolean // 全栈联机游戏需要，不启用 sandbox
  redirect?: boolean  // 直接页面跳转而非新窗口
}

// ==================== 游戏库配置 ====================

const GAME_LIBRARY: GameConfig[] = [
  // ---- FC/NES ----
  { id: 'contra', title: '魂斗罗', subtitle: 'Contra', romPath: '/roms/contra.nes', category: 'nes', core: 'nes' },
  { id: 'tank-battle', title: '坦克大战', subtitle: 'Battle City', romPath: '/roms/tank_battle.nes', category: 'nes', core: 'nes' },
  { id: 'super-mario', title: '超级马里奥', subtitle: 'Super Mario Bros', romPath: '/roms/super_mario.nes', category: 'nes', core: 'nes' },
  { id: 'lode-runner', title: '淘金者', subtitle: 'Lode Runner', romPath: '/roms/LodeRunner.nes', category: 'nes', core: 'nes' },
  { id: 'river-city', title: '热血街头', subtitle: 'River City Ransom', romPath: '/roms/nes/river_city.nes', category: 'nes', core: 'nes' },
  { id: 'battle-city-nes', title: '坦克要塞', subtitle: 'Battle City', romPath: '/roms/nes/battle_city.nes', category: 'nes', core: 'nes' },
  { id: 'adventure-island', title: '恐龙冒险岛', subtitle: 'Adventure Island', romPath: '/roms/nes/adventure_island.nes', category: 'nes', core: 'nes' },
  { id: 'chip-dale', title: '松鼠大战', subtitle: "Chip 'n Dale", romPath: '/roms/nes/chip_dale.nes', category: 'nes', core: 'nes' },
  { id: 'lode-runner-nes', title: '淘金者(FC)', subtitle: 'Lode Runner', romPath: '/roms/nes/lode_runner.nes', category: 'nes', core: 'nes' },
  { id: 'pooyan-nes', title: '猪小弟', subtitle: 'Pooyan', romPath: '/roms/nes/pooyan.nes', category: 'nes', core: 'nes' },
  { id: 'sanmo', title: '三目童子', subtitle: 'Mitsume ga Tooru', romPath: '/roms/Sanmo.nes', category: 'nes', core: 'nes' },
  { id: 'fumoji', title: '伏魔记', subtitle: '封神榜之伏魔三太子', romPath: '/roms/Fumojì.nes', category: 'nes', core: 'nes' },
  { id: 'gunnac', title: '加纳战机', subtitle: 'Gun-Nac', romPath: '/roms/nes/gun_nac.nes', category: 'nes', core: 'nes' },
  // 新增加经典 NES 游戏
  { id: 'super-mario-2', title: '超级马里奥2', subtitle: 'Super Mario Bros 2', romPath: '/roms/nes/super_mario_2.nes', category: 'nes', core: 'nes' },
  { id: 'super-mario-3', title: '超级马里奥3', subtitle: 'Super Mario Bros 3', romPath: '/roms/super_mario_3.nes', category: 'nes', core: 'nes' },
  { id: 'nes-duck-tales', title: '唐老鸭', subtitle: 'DuckTales', romPath: '/roms/nes/duck_tales.nes', category: 'nes', core: 'nes' },
  { id: 'nes-kirby-adventure', title: '星之卡比 梦之泉物语', subtitle: "Kirby's Adventure", romPath: '/roms/kirby_adventure.nes', category: 'nes', core: 'nes' },
  { id: 'zelda', title: '塞尔达传说', subtitle: 'The Legend of Zelda', romPath: '/roms/nes/zelda.nes', category: 'nes', core: 'nes' },
  { id: 'zelda-2', title: '塞尔达传说2', subtitle: 'Zelda II', romPath: '/roms/nes/zelda_2.nes', category: 'nes', core: 'nes' },
  { id: 'double-dragon', title: '双截龙', subtitle: 'Double Dragon', romPath: '/roms/nes/double_dragon.nes', category: 'nes', core: 'nes' },
  { id: 'castlevania', title: '恶魔城', subtitle: 'Castlevania', romPath: '/roms/castlevania.nes', category: 'nes', core: 'nes' },
  { id: 'castlevania-2', title: '恶魔城2', subtitle: "Castlevania II", romPath: '/roms/castlevania_2.nes', category: 'nes', core: 'nes' },
  { id: 'metroid-nes', title: '银河战士', subtitle: 'Metroid', romPath: '/roms/metroid.nes', category: 'nes', core: 'nes' },
  { id: 'ninja-gaiden', title: '忍者龙剑传', subtitle: 'Ninja Gaiden', romPath: '/roms/ninja_gaiden.nes', category: 'nes', core: 'nes' },
  { id: 'contra-nes', title: '魂斗罗(FC)', subtitle: 'Contra', romPath: '/roms/nes/contra.nes', category: 'nes', core: 'nes' },

  // ---- 街机 ----
  { id: 'snowbros', title: '雪人兄弟', subtitle: 'Snow Bros', romPath: '/roms/arcade/snowbros.zip', category: 'arcade', core: 'fbneo' },
  { id: 'pooyan-arcade', title: '猪小弟', subtitle: 'Pooyan (Arcade)', romPath: '/roms/arcade/pooyan.zip', category: 'arcade', core: 'fbneo' },
  { id: 'gberet', title: '绿色兵团', subtitle: 'Green Beret', romPath: '/roms/arcade/gberet.zip', category: 'arcade', core: 'fbneo' },
  { id: 'dino', title: '恐龙快打', subtitle: 'Cadillacs and Dinosaurs', romPath: '/roms/arcade/dino.zip', category: 'arcade', core: 'fbneo', biosPath: '/roms/arcade/neogeo.zip' },
  { id: 'punisher', title: '惩罚者', subtitle: 'The Punisher', romPath: '/roms/arcade/punisher.zip', category: 'arcade', core: 'fbneo', biosPath: '/roms/arcade/neogeo.zip' },
  { id: 'kof97', title: '拳皇97', subtitle: 'The King of Fighters 97', romPath: '/roms/arcade/kof97.zip', category: 'arcade', core: 'fbneo' },
  { id: 'kof2002', title: '拳皇2002', subtitle: 'The King of Fighters 2002', romPath: '/roms/arcade/kof2002.zip', category: 'arcade', core: 'fbneo' },
  { id: 'ldrun-arcade', title: '淘金者(街机)', subtitle: 'Lode Runner Arcade', romPath: '/roms/arcade/ldrun.zip', category: 'arcade', core: 'fbneo' },
  { id: 'ddragon', title: '双截龙', subtitle: 'Double Dragon', romPath: '/roms/arcade/ddragon.zip', category: 'arcade', core: 'mame2003_plus' },

  // ---- GBA ----
  { id: 'gba-koudai-hong', title: '口袋妖怪 红宝石', subtitle: 'Pokémon Ruby', romPath: '/roms/gba/pokemon_ruby.gba', category: 'gba', core: 'mgba' },
  { id: 'gba-koudai-lv', title: '口袋妖怪 绿宝石', subtitle: 'Pokémon Emerald', romPath: '/roms/gba/pokemon_emerald.gba', category: 'gba', core: 'mgba' },
  { id: 'gba-koudai-huo', title: '口袋妖怪 火红', subtitle: 'Pokémon FireRed', romPath: '/roms/gba/pokemon_firered.gba', category: 'gba', core: 'mgba' },
  { id: 'gba-super-mario', title: '超级马里奥世界', subtitle: 'Super Mario Advance 2', romPath: '/roms/gba/super_mario_advance2.gba', category: 'gba', core: 'mgba' },
  { id: 'gba-mario-kart', title: '马里奥赛车', subtitle: 'Mario Kart Super Circuit', romPath: '/roms/gba/mario_kart.gba', category: 'gba', core: 'mgba' },
  { id: 'gba-zelda', title: '塞尔达传说 缩小帽', subtitle: 'The Legend of Zelda: Minish Cap', romPath: '/roms/gba/zelda_minish_cap.gba', category: 'gba', core: 'mgba' },
  { id: 'gba-metroid', title: '银河战士 融合', subtitle: 'Metroid Fusion', romPath: '/roms/gba/metroid_fusion.gba', category: 'gba', core: 'mgba' },
  { id: 'gba-castlevania', title: '恶魔城 晓月圆舞曲', subtitle: 'Castlevania: Aria of Sorrow', romPath: '/roms/gba/castlevania_aria.gba', category: 'gba', core: 'mgba' },
  { id: 'gba-golden-sun', title: '黄金太阳', subtitle: 'Golden Sun', romPath: '/roms/gba/golden_sun.gba', category: 'gba', core: 'mgba' },
  { id: 'gba-fire-emblem', title: '火焰纹章 封印之剑', subtitle: 'Fire Emblem: Binding Blade', romPath: '/roms/gba/fire_emblem.gba', category: 'gba', core: 'mgba' },
  { id: 'gba-advance-wars', title: '高级战争', subtitle: 'Advance Wars', romPath: '/roms/gba/advance_wars.gba', category: 'gba', core: 'mgba' },
  { id: 'gba-kirby', title: '星之卡比 梦之泉', subtitle: 'Kirby: Nightmare in Dream Land', romPath: '/roms/gba/kirby_nightmare.gba', category: 'gba', core: 'mgba' },
  // 新加 GBA 经典
  { id: 'gba-final-fantasy-6', title: '最终幻想6', subtitle: 'Final Fantasy VI Advance', romPath: '/roms/gba/gba_final_fantasy_6.gba', category: 'gba', core: 'mgba' },
  { id: 'gba-final-fantasy-4', title: '最终幻想4', subtitle: 'Final Fantasy IV Advance', romPath: '/roms/gba/gba_final_fantasy_4.gba', category: 'gba', core: 'mgba' },
  { id: 'gba-kingdom-hearts', title: '王国之心', subtitle: 'Kingdom Hearts: Chain of Memories', romPath: '/roms/gba/gba_kingdom_hearts.gba', category: 'gba', core: 'mgba' },
  { id: 'gba-wario-ware', title: '瓦力欧制造', subtitle: 'WarioWare, Inc.', romPath: '/roms/gba/gba_wario_ware.gba', category: 'gba', core: 'mgba' },
  { id: 'gba-sonic-advance', title: '索尼克Advance', subtitle: 'Sonic Advance', romPath: '/roms/gba/gba_sonic_advance.gba', category: 'gba', core: 'mgba' },
  { id: 'gba-mario-golf', title: '马里奥高尔夫', subtitle: 'Mario Golf: Advance Tour', romPath: '/roms/gba/gba_mario_golf.gba', category: 'gba', core: 'mgba' },

  // ---- GBC ----
  { id: 'gbc-koudai-jin', title: '口袋妖怪 金', subtitle: 'Pokémon Gold', romPath: '/roms/gbc/pokemon_gold.gbc', category: 'gbc', core: 'gambatte' },
  { id: 'gbc-koudai-yin', title: '口袋妖怪 银', subtitle: 'Pokémon Silver', romPath: '/roms/gbc/pokemon_silver.gbc', category: 'gbc', core: 'gambatte' },
  { id: 'gbc-koudai-shui', title: '口袋妖怪 水晶', subtitle: 'Pokémon Crystal', romPath: '/roms/gbc/pokemon_crystal.gbc', category: 'gbc', core: 'gambatte' },
  { id: 'gbc-zelda-dx', title: '塞尔达传说 梦见岛DX', subtitle: "Zelda: Link's Awakening DX", romPath: '/roms/gbc/zelda_links_awakening.gbc', category: 'gbc', core: 'gambatte' },
  { id: 'gbc-zelda-oracle', title: '塞尔达传说 时空之章', subtitle: 'Zelda: Oracle of Ages', romPath: '/roms/gbc/zelda_oracle_ages.gbc', category: 'gbc', core: 'gambatte' },
  { id: 'gbc-super-mario', title: '超级马里奥DX', subtitle: 'Super Mario Bros. Deluxe', romPath: '/roms/gbc/super_mario_dx.gbc', category: 'gbc', core: 'gambatte' },
  { id: 'gbc-mario-tennis', title: '马里奥网球', subtitle: 'Mario Tennis', romPath: '/roms/gbc/mario_tennis.gbc', category: 'gbc', core: 'gambatte' },
  { id: 'gbc-donkey-kong', title: '大金刚国度', subtitle: 'Donkey Kong Country', romPath: '/roms/gbc/donkey_kong_country.gbc', category: 'gbc', core: 'gambatte' },

  // ---- SNES/SFC ----
  { id: 'snes-super-mario', title: '超级马里奥世界', subtitle: 'Super Mario World', romPath: '/roms/snes/super_mario_world.sfc', category: 'snes', core: 'snes9x' },
  { id: 'snes-zelda', title: '塞尔达传说 众神的三角力量', subtitle: 'The Legend of Zelda: A Link to the Past', romPath: '/roms/snes/zelda_link_to_past.sfc', category: 'snes', core: 'snes9x' },
  { id: 'snes-donkey-kong', title: '超级大金刚', subtitle: 'Donkey Kong Country', romPath: '/roms/snes/donkey_kong_country.sfc', category: 'snes', core: 'snes9x' },
  { id: 'snes-super-metroid', title: '超级银河战士', subtitle: 'Super Metroid', romPath: '/roms/snes/super_metroid.sfc', category: 'snes', core: 'snes9x' },
  { id: 'snes-chrono', title: '超时空之钥', subtitle: 'Chrono Trigger', romPath: '/roms/snes/chrono_trigger.sfc', category: 'snes', core: 'snes9x' },
  { id: 'snes-ff6', title: '最终幻想6', subtitle: 'Final Fantasy VI', romPath: '/roms/snes/final_fantasy_6.sfc', category: 'snes', core: 'snes9x' },
  { id: 'snes-kirby', title: '星之卡比 超级豪华', subtitle: 'Kirby Super Star', romPath: '/roms/snes/kirby_super_star.sfc', category: 'snes', core: 'snes9x' },
  { id: 'snes-mario-kart', title: '马里奥赛车', subtitle: 'Super Mario Kart', romPath: '/roms/snes/super_mario_kart.sfc', category: 'snes', core: 'snes9x' },
  { id: 'snes-earthbound', title: '地球冒险', subtitle: 'EarthBound', romPath: '/roms/snes/earthbound.sfc', category: 'snes', core: 'snes9x' },
  { id: 'snes-mario-rpg', title: '超级马里奥RPG', subtitle: 'Super Mario RPG', romPath: '/roms/snes/super_mario_rpg.sfc', category: 'snes', core: 'snes9x' },

  // ---- Sega MD/Genesis ----
  { id: 'md-sonic1', title: '索尼克', subtitle: 'Sonic the Hedgehog', romPath: '/roms/md/sonic1.md', category: 'md', core: 'genesis_plus_gx' },
  { id: 'md-sonic2', title: '索尼克2', subtitle: 'Sonic the Hedgehog 2', romPath: '/roms/md/sonic2.md', category: 'md', core: 'genesis_plus_gx' },
  { id: 'md-sonic3', title: '索尼克3', subtitle: 'Sonic the Hedgehog 3', romPath: '/roms/md/sonic3.md', category: 'md', core: 'genesis_plus_gx' },
  { id: 'md-streets-rage', title: '怒之铁拳', subtitle: 'Streets of Rage', romPath: '/roms/md/streets_of_rage.md', category: 'md', core: 'genesis_plus_gx' },
  { id: 'md-gunstar', title: '火枪英雄', subtitle: 'Gunstar Heroes', romPath: '/roms/md/gunstar_heroes.md', category: 'md', core: 'genesis_plus_gx' },
  { id: 'md-shinobi', title: '超级忍', subtitle: 'The Revenge of Shinobi', romPath: '/roms/md/revenge_of_shinobi.md', category: 'md', core: 'genesis_plus_gx' },
  { id: 'md-altered', title: '兽王记', subtitle: 'Altered Beast', romPath: '/roms/md/altered_beast.md', category: 'md', core: 'genesis_plus_gx' },
  { id: 'md-golden-axe', title: '战斧', subtitle: 'Golden Axe', romPath: '/roms/md/golden_axe.md', category: 'md', core: 'genesis_plus_gx' },
  { id: 'md-comix-zone', title: '漫画地带', subtitle: 'Comix Zone', romPath: '/roms/md/comix_zone.md', category: 'md', core: 'genesis_plus_gx' },
  { id: 'md-contra-hard', title: '魂斗罗 铁血兵团', subtitle: 'Contra: Hard Corps', romPath: '/roms/md/contra_hard_corps.md', category: 'md', core: 'genesis_plus_gx' },

  // ---- N64 ----
  { id: 'n64-mario64', title: '超级马里奥64', subtitle: 'Super Mario 64', romPath: '/roms/n64/super_mario_64.z64', category: 'n64', core: 'mupen64plus_next' },
  { id: 'n64-zelda', title: '塞尔达传说 时之笛', subtitle: "The Legend of Zelda: Ocarina of Time", romPath: '/roms/n64/zelda_ocarina.z64', category: 'n64', core: 'mupen64plus_next' },
  { id: 'n64-mario-kart', title: '马里奥赛车64', subtitle: 'Mario Kart 64', romPath: '/roms/n64/mario_kart_64.z64', category: 'n64', core: 'mupen64plus_next' },
  { id: 'n64-goldeneye', title: '007 黄金眼', subtitle: 'GoldenEye 007', romPath: '/roms/n64/goldeneye.z64', category: 'n64', core: 'mupen64plus_next' },
  { id: 'n64-star-fox', title: '星际火狐64', subtitle: 'Star Fox 64', romPath: '/roms/n64/star_fox_64.z64', category: 'n64', core: 'mupen64plus_next' },
  { id: 'n64-smash', title: '任天堂明星大乱斗', subtitle: 'Super Smash Bros.', romPath: '/roms/n64/super_smash_bros.z64', category: 'n64', core: 'mupen64plus_next' },
  { id: 'n64-banjo', title: '班卓熊大冒险', subtitle: 'Banjo-Kazooie', romPath: '/roms/n64/banjo_kazooie.z64', category: 'n64', core: 'mupen64plus_next' },
  { id: 'n64-paper-mario', title: '纸片马里奥', subtitle: 'Paper Mario', romPath: '/roms/n64/paper_mario.z64', category: 'n64', core: 'mupen64plus_next' },
  { id: 'n64-dk64', title: '大金刚64', subtitle: 'Donkey Kong 64', romPath: '/roms/n64/donkey_kong_64.z64', category: 'n64', core: 'mupen64plus_next' },
  { id: 'n64-f-zero', title: 'F-Zero X', subtitle: 'F-Zero X', romPath: '/roms/n64/f_zero_x.z64', category: 'n64', core: 'mupen64plus_next' },

  // ---- Web/HTML5 游戏 ----
  { id: 'link-game', title: '连连看', subtitle: '经典的连连看消消乐', category: 'web', iframeUrl: '/link-game' },
  { id: 'spider-solitaire', title: '蜘蛛纸牌', subtitle: '经典Windows蜘蛛纸牌', category: 'web', iframeUrl: '/spider-solitaire' },
  { id: 'minesweeper', title: '扫雷', subtitle: '经典扫雷，挑战最高难度', category: 'web', iframeUrl: '/minesweeper' },
  { id: 'game2048', title: '2048', subtitle: '经典数字合成游戏', category: 'web', iframeUrl: '/game2048' },
  { id: 'gold-miner', title: '黄金矿工', subtitle: '经典益智小游戏', category: 'web', iframeUrl: '/gold-miner' },
  { id: 'fumoji-bbk', title: '伏魔记 BBK', subtitle: '步步高电子词典原版网页移植', category: 'web', iframeUrl: '/fumojì-bbk' },
  { id: 'texas-holdem', title: '德州扑克（单机）', subtitle: '经典德州扑克人机对战', category: 'web', iframeUrl: '/games/texas-holdem/' },
  { id: 'texas-holdem-online', title: '德州扑克（联机）', subtitle: '6人实时联机', category: 'web', iframeUrl: '/poker/', noSandbox: true },
]

// ==================== 分类定义 ====================

const CATEGORIES = [
  { key: 'nes' as const, label: 'FC/NES', icon: '🎮' },
  { key: 'snes' as const, label: 'SFC/SNES', icon: '🎮' },
  { key: 'md' as const, label: 'MD/Genesis', icon: '🕹️' },
  { key: 'gba' as const, label: 'GBA', icon: '🎮' },
  { key: 'gbc' as const, label: 'GBC', icon: '🎮' },
  { key: 'n64' as const, label: 'N64', icon: '🕹️' },
  { key: 'arcade' as const, label: '街机', icon: '🕹️' },
  { key: 'web' as const, label: 'HTML5', icon: '🌐' },
]

// ==================== GameHub 组件 ====================

const GameHub: React.FC = () => {
  const [selectedGame, setSelectedGame] = useState<GameConfig>(GAME_LIBRARY[0])
  const [gameKey, setGameKey] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isDark, setIsDark] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [search, setSearch] = useState('')
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set())
  const [romValid, setRomValid] = useState<Record<string, boolean>>({})

  // 检测移动端
  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768 || 'ontouchstart' in window
      setIsMobile(mobile)
      if (mobile) setSidebarOpen(false)
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // 切换游戏
  const switchGame = useCallback((game: GameConfig) => {
    if (game.id === selectedGame.id) return
    // 联机游戏直接新窗口打开
    if (game.redirect && game.iframeUrl) {
      window.location.href = game.iframeUrl
      return
    }
    if (game.noSandbox && game.iframeUrl) {
      window.open(game.iframeUrl, '_blank')
      return
    }
    setSelectedGame(game)
    setGameKey(prev => prev + 1)
    if (isMobile) setSidebarOpen(false)
  }, [selectedGame.id, isMobile])

  // 重启当前游戏
  const restartGame = useCallback(() => {
    setGameKey(prev => prev + 1)
  }, [])

  // 通过 iframe 内的 EmulatorJS 实例发送输入
  const sendArcadeButton = useCallback((player: number, buttonId: number) => {
    const iframe = document.querySelector('iframe') as HTMLIFrameElement | null
    const emu = iframe?.contentWindow?.EJS_emulator as any
    if (!emu?.gameManager?.simulateInput) return
    emu.gameManager.simulateInput(player, buttonId, 1)
    setTimeout(() => {
      emu.gameManager?.simulateInput(player, buttonId, 0)
    }, 100)
  }, [])

  // 切换分类折叠
  const toggleCategory = useCallback((key: string) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  // 预检 ROM 文件
  useEffect(() => {
    const checkRom = async (game: GameConfig) => {
      if (!game.romPath) return // Web 游戏无需 ROM 校验
      try {
        const resp = await fetch(game.romPath, { method: 'HEAD' })
        setRomValid(prev => ({ ...prev, [game.id]: resp.ok }))
      } catch {
        setRomValid(prev => ({ ...prev, [game.id]: false }))
      }
    }
    checkRom(selectedGame)
  }, [selectedGame.id])

  // 搜索过滤
  const filteredGames = useMemo(() => {
    if (!search.trim()) return GAME_LIBRARY
    const q = search.toLowerCase()
    return GAME_LIBRARY.filter(g =>
      g.title.includes(q) ||
      (g.subtitle && g.subtitle.toLowerCase().includes(q))
    )
  }, [search])

  // 按分类分组
  const groupedGames = useMemo(() => {
    const groups: Record<string, GameConfig[]> = {}
    for (const cat of CATEGORIES) {
      groups[cat.key] = filteredGames.filter(g => g.category === cat.key)
    }
    return groups
  }, [filteredGames])

  const theme = {
    bg: isDark ? 'bg-slate-950' : 'bg-gray-50',
    sidebar: isDark ? 'bg-slate-900 border-r border-white/10' : 'bg-white border-r border-gray-200',
    text: isDark ? 'text-white' : 'text-gray-900',
    textSubtle: isDark ? 'text-white/60' : 'text-gray-500',
    card: isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50 hover:bg-gray-100',
    cardActive: isDark ? 'bg-blue-600/20 border-blue-500/50' : 'bg-blue-50 border-blue-400',
    input: isDark ? 'bg-white/10 border-white/10 focus:border-white/30' : 'bg-gray-100 border-gray-200 focus:border-gray-400',
  }

  const currentRomValid = romValid[selectedGame.id]

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} flex`}>
      {/* ====== 侧边栏 ====== */}
      {sidebarOpen && (
        <>
          {/* 移动端遮罩 */}
          {isMobile && (
            <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setSidebarOpen(false)} />
          )}

          <aside className={`
            ${theme.sidebar} 
            ${isMobile ? 'fixed inset-y-0 left-0 z-50 w-72' : 'w-64 flex-shrink-0'}
            flex flex-col h-screen overflow-hidden
          `}>
            {/* 侧边栏头部 */}
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Gamepad2 className="w-5 h-5 text-blue-400" />
                  <h2 className="font-bold text-lg">游戏合集</h2>
                </div>
                <div className="flex items-center gap-1">
                  <Link to="/" className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}>
                    <Home className="w-4 h-4" />
                  </Link>
                  {isMobile && (
                    <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              {/* 搜索框 */}
              <div className="relative">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${theme.textSubtle}`} />
                <input
                  type="text"
                  placeholder="搜索游戏..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className={`w-full pl-9 pr-3 py-2 rounded-lg text-sm border outline-none transition-colors ${theme.input} ${theme.text}`}
                />
              </div>
            </div>

            {/* 游戏列表 */}
            <div className="flex-1 overflow-y-auto p-2">
              {CATEGORIES.map(cat => {
                const games = groupedGames[cat.key]
                if (games.length === 0) return null
                const collapsed = collapsedCategories.has(cat.key)

                return (
                  <div key={cat.key} className="mb-2">
                    <button
                      onClick={() => toggleCategory(cat.key)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium ${theme.textSubtle} hover:opacity-80`}
                    >
                      <span>{cat.icon} {cat.label} <span className="opacity-50">({games.length})</span></span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${collapsed ? '' : 'rotate-180'}`} />
                    </button>
                    {!collapsed && (
                      <div className="space-y-0.5">
                        {games.map(game => (
                          <button
                            key={game.id}
                            onClick={() => switchGame(game)}
                            className={`
                              w-full text-left px-3 py-2 rounded-lg text-sm transition-colors
                              ${game.id === selectedGame.id ? theme.cardActive : theme.card}
                              ${game.broken ? 'opacity-50' : ''}
                            `}
                          >
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium truncate">{game.title}</span>
                              {game.broken && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 shrink-0">待修复</span>
                              )}
                            </div>
                            {game.subtitle && (
                              <div className={`text-xs ${theme.textSubtle} truncate`}>{game.subtitle}</div>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </aside>
        </>
      )}

      {/* ====== 主内容区 ====== */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto">
        {/* 顶部栏 */}
        <header className={`border-b backdrop-blur-xl sticky top-0 z-30 ${isDark ? 'border-white/10 bg-slate-900/80' : 'border-gray-200 bg-white/80'}`}>
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {!sidebarOpen && (
                <button
                  onClick={() => setSidebarOpen(true)}
                  className={`p-2 rounded-lg ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
                >
                  <Menu className="w-5 h-5" />
                </button>
              )}
              <div>
                <h1 className="text-lg font-bold">{selectedGame.title}</h1>
                {selectedGame.subtitle && (
                  <p className={`text-xs ${theme.textSubtle}`}>{selectedGame.subtitle}</p>
                )}
              </div>
              <div className="flex items-center gap-2 ml-2">
                <span className={`px-2 py-0.5 rounded text-xs ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}>
                  {selectedGame.category === 'nes' ? 'NES' : selectedGame.category === 'web' ? 'HTML5' : '街机'}
                </span>
                {selectedGame.core && (
                  <span className={`px-2 py-0.5 rounded text-xs ${isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                    {selectedGame.core.toUpperCase()}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={restartGame} className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`} title="重新开始">
                <RotateCcw className="w-5 h-5" />
              </button>
              <button
                onClick={() => setIsDark(!isDark)}
                className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </header>

        {/* 游戏区域 */}
        <main className="flex-1 flex flex-col items-center p-4 overflow-y-auto pt-8">
          {/* 快速切换栏（非移动端） */}
          {!isMobile && (
            <div className="mb-4 flex items-center gap-2 flex-wrap justify-center max-w-4xl shrink-0">
              {CATEGORIES.map(cat => (
                <div key={cat.key} className="flex items-center gap-1">
                  <span className={`text-xs ${theme.textSubtle}`}>{cat.label}:</span>
                  {groupedGames[cat.key].slice(0, 8).map(g => (
                    <button
                      key={g.id}
                      onClick={() => switchGame(g)}
                      className={`px-2 py-1 rounded text-xs whitespace-nowrap transition-colors
                        ${g.id === selectedGame.id ? 'bg-blue-600 text-white' : theme.card}`}
                    >
                      {g.title}
                    </button>
                  ))}
                  {groupedGames[cat.key].length > 8 && (
                    <span className={`text-xs ${theme.textSubtle}`}>+{groupedGames[cat.key].length - 8}</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 播放器 */}
          <div className={`rounded-2xl border ${isDark ? 'border-white/10 bg-black' : 'border-gray-200 bg-gray-900'}`}
            style={{ maxWidth: selectedGame.category === 'nes' ? '640px' : selectedGame.category === 'web' ? '100%' : '800px', width: '100%' }}
          >
            {/* Web 游戏用 iframe */}
            {selectedGame.category === 'web' ? (
              <div className="relative bg-gray-100 dark:bg-gray-800" style={{ height: '70vh', minHeight: '500px' }}>
                <iframe
                  key={gameKey}
                  src={selectedGame.iframeUrl}
                  className="w-full h-full border-0"
                  title={selectedGame.title}
                  {...(selectedGame.noSandbox
                    ? {}
                    : { sandbox: 'allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-popups-to-escape-sandbox' })
                  }
                  allow="camera;microphone;fullscreen;autoplay"
                />
              </div>
            ) : selectedGame.romPath && currentRomValid === false ? (
              <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                <h3 className="text-xl font-bold mb-2">ROM 文件不存在</h3>
                <p className="text-sm opacity-70 mb-4">{selectedGame.romPath}</p>
                <button onClick={restartGame}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">
                  重试
                </button>
              </div>
            ) : selectedGame.broken ? (
              <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                <AlertCircle className="w-16 h-16 text-amber-500 mb-4" />
                <h3 className="text-xl font-bold mb-2">游戏暂不可用</h3>
                <p className="text-sm opacity-70 mb-2 max-w-md">{selectedGame.broken}</p>
                <p className="text-xs opacity-50">需要更新 ROM 文件后才能运行</p>
              </div>
            ) : (
              <>
                {/* 街机投币/开始按钮 */}
                {selectedGame.category.startsWith('arcade') && (
                  <div className={`flex items-center justify-center gap-3 mb-3`}>
                    <button
                      onClick={() => sendArcadeButton(0, 2)}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 bg-yellow-600 hover:bg-yellow-500 text-white shadow-lg shadow-yellow-600/20"
                      title="按 V 或点击此按钮投币"
                    >
                      <Coins className="w-4 h-4" />
                      投币 (V)
                    </button>
                    <button
                      onClick={() => sendArcadeButton(0, 3)}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-600/20"
                      title="按 Enter 或点击此按钮开始"
                    >
                      <Play className="w-4 h-4" />
                      开始 (Enter)
                    </button>
                  </div>
                )}
                <div
                  key={gameKey}
                  className="relative select-none overflow-hidden bg-black"
                  style={{
                    width: '100%',
                    aspectRatio: (() => {
                      switch (selectedGame.category) {
                        case 'nes': return '256/240'
                        case 'gba': return '3/2'
                        case 'gbc': return '10/9'
                        case 'snes': case 'md': case 'n64': default: return '4/3'
                      }
                    })()
                  }}
                >
                <EmulatorJS {...({
                  EJS_pathtodata: '/emulatorjs/data',
                  EJS_core: selectedGame.core,
                  EJS_gameUrl: selectedGame.romPath || '',
                  EJS_startOnLoaded: true,
                  ...(selectedGame.biosPath && { EJS_biosUrl: selectedGame.biosPath }),
                  EJS_gameName: selectedGame.title,
                  ...(selectedGame.category.startsWith('arcade') ? {
                    EJS_controlScheme: 'arcade',
                  } : selectedGame.category === 'nes' ? {
                    EJS_controlScheme: 'default',
                    EJS_defaultControls: NES_CONTROLS,
                    EJS_gameID: `nes-${selectedGame.romPath}`,
                  } : {}),
                } as any)} />
              </div>
              </>
            )}
          </div>

          {/* 操作说明 */}
          <div className={`mt-4 rounded-xl p-4 border max-w-lg w-full text-sm ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-white'}`}>
            <h4 className="font-bold mb-2">🎮 操作说明</h4>
            {selectedGame.category === 'web' ? (
              <p className="text-xs opacity-70">该游戏为 HTML5 网页游戏，在原游戏窗口内直接操作即可。</p>
            ) : selectedGame.category === 'nes' ? (
              <div className="grid grid-cols-4 gap-2">
                <div className={`p-2 rounded ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                  <span className="font-medium text-xs">移动</span><p className="text-xs opacity-70 mt-0.5">↑↓←→</p>
                </div>
                <div className={`p-2 rounded ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                  <span className="font-medium text-xs">A键</span><p className="text-xs opacity-70 mt-0.5">Z</p>
                </div>
                <div className={`p-2 rounded ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                  <span className="font-medium text-xs">B键</span><p className="text-xs opacity-70 mt-0.5">X</p>
                </div>
                <div className={`p-2 rounded ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                  <span className="font-medium text-xs">开始/选择</span><p className="text-xs opacity-70 mt-0.5">Enter/Shift</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <h5 className="font-medium text-xs mb-1">1P 按键</h5>
                  <ul className="space-y-0.5 text-xs opacity-70">
                    <li>• 方向: ↑↓←→</li>
                    <li>• 投币: <kbd className={`px-1 rounded ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>V</kbd>　开始: <kbd className={`px-1 rounded ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>Enter</kbd></li>
                    <li>• B <kbd className={`px-1 rounded ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>X</kbd>　Y <kbd className={`px-1 rounded ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>S</kbd></li>
                    <li className="text-xs mt-1 opacity-50">更多按键可在游戏中设置面板调整</li>
                  </ul>
                </div>
                <div>
                  <h5 className="font-medium text-xs mb-1">2P 按键</h5>
                  <ul className="space-y-0.5 text-xs opacity-70">
                    <li>• 方向: WASD</li>
                    <li>• 投币: <kbd className={`px-1 rounded ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>6</kbd>　开始: <kbd className={`px-1 rounded ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>2</kbd></li>
                    <li>• 动作: 小键盘</li>
                    <li>• 1 2 4 5 7 8</li>
                    <li className="text-xs mt-1">⚠️ 先投币再开始</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

export default GameHub
