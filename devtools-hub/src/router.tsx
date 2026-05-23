import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from './App'
import { AINavigator } from './components/ai-navigator'
import { CodingTheWorld } from './components/coding-the-world'
import { OfflineTools } from './components/offline-tools'
import { Game } from './components/game'
import { RetroGames } from './components/retro-games'
import { GameCollection } from './components/game-collection'
import { LinkGame } from './components/link-game'
import { Minesweeper } from './components/minesweeper'
import { Game2048 } from './components/game2048'
import GoldMiner from './components/GoldMiner'
// jsnes components removed - now using EmulatorJS via NESGame
import Sanmo from './components/Sanmo'
import SpiderSolitaire from './components/SpiderSolitaire'
import Fumojì from './components/Fumojì'
import FumojìBBK from './components/FumojìBBK'
import { RegistryViewer } from './components/registry-viewer'
import NESGame from './components/NESGame'
import ArcadeGame from './components/ArcadeGame'
import GameHub from './components/GameHub'
import { ErrorPage } from './components/ErrorPage'

const router = createBrowserRouter([
  { 
    path: '/', 
    element: <App />,
    errorElement: <ErrorPage />
  },
  { path: '/ai', element: <AINavigator />, errorElement: <ErrorPage /> },
  { path: '/coding-the-world', element: <CodingTheWorld />, errorElement: <ErrorPage /> },
  { path: '/offline-tools', element: <OfflineTools />, errorElement: <ErrorPage /> },
  { path: '/game', element: <Game />, errorElement: <ErrorPage /> },
  { path: '/retro-games', element: <RetroGames />, errorElement: <ErrorPage /> },
  { path: '/game-collection', element: <GameCollection />, errorElement: <ErrorPage /> },
  { path: '/link-game', element: <LinkGame />, errorElement: <ErrorPage /> },
  { path: '/minesweeper', element: <Minesweeper />, errorElement: <ErrorPage /> },
  { path: '/game2048', element: <Game2048 />, errorElement: <ErrorPage /> },
  { path: '/gold-miner', element: <GoldMiner />, errorElement: <ErrorPage /> },
  { path: '/gold-mine', element: <GoldMiner />, errorElement: <ErrorPage /> },  // 别名路由
  { path: '/contra-fc', element: <NESGame title="魂斗罗" romPath="/roms/contra.nes" />, errorElement: <ErrorPage /> },
  { path: '/tank-battle', element: <NESGame title="坦克大战" romPath="/roms/tank_battle.nes" />, errorElement: <ErrorPage /> },
  { path: '/super-mario', element: <NESGame title="超级马里奥" romPath="/roms/super_mario.nes" />, errorElement: <ErrorPage /> },
  { path: '/lode-runner', element: <NESGame title="淘金者" romPath="/roms/LodeRunner.nes" />, errorElement: <ErrorPage /> },
  { path: '/sanmo', element: <Sanmo />, errorElement: <ErrorPage /> },
  { path: '/spider-solitaire', element: <SpiderSolitaire />, errorElement: <ErrorPage /> },
  { path: '/fumojì', element: <Fumojì />, errorElement: <ErrorPage /> },
  { path: '/fumojì-bbk', element: <FumojìBBK />, errorElement: <ErrorPage /> },
  { path: '/registry', element: <RegistryViewer />, errorElement: <ErrorPage /> },

  // NES/FC游戏
  { path: '/river-city', element: <NESGame title="热血街头" romPath="/roms/nes/river_city.nes" />, errorElement: <ErrorPage /> },
  { path: '/battle-city-nes', element: <NESGame title="坦克要塞" romPath="/roms/nes/battle_city.nes" />, errorElement: <ErrorPage /> },
  { path: '/adventure-island', element: <NESGame title="恐龙冒险岛" romPath="/roms/nes/adventure_island.nes" />, errorElement: <ErrorPage /> },
  { path: '/chip-dale', element: <NESGame title="松鼠大战" romPath="/roms/nes/chip_dale.nes" />, errorElement: <ErrorPage /> },
  { path: '/lode-runner-nes', element: <NESGame title="淘金者" romPath="/roms/nes/lode_runner.nes" />, errorElement: <ErrorPage /> },
  { path: '/pooyan-nes', element: <NESGame title="猪小弟" romPath="/roms/nes/pooyan.nes" />, errorElement: <ErrorPage /> },

  // 街机游戏
  { path: '/snowbros', element: <ArcadeGame title="雪人兄弟" romPath="/roms/arcade/snowbros.zip" core="fbneo" />, errorElement: <ErrorPage /> },
  { path: '/pooyan-arcade', element: <ArcadeGame title="猪小弟(街机)" romPath="/roms/arcade/pooyan.zip" core="fbneo" />, errorElement: <ErrorPage /> },
  { path: '/gberet', element: <ArcadeGame title="绿色兵团" romPath="/roms/arcade/gberet.zip" core="fbneo" />, errorElement: <ErrorPage /> },
  { path: '/dino', element: <ArcadeGame title="恐龙快打" romPath="/roms/arcade/dino.zip" biosPath="/roms/arcade/neogeo.zip" core="fbneo" />, errorElement: <ErrorPage /> },
  { path: '/punisher', element: <ArcadeGame title="惩罚者" romPath="/roms/arcade/punisher.zip" biosPath="/roms/arcade/neogeo.zip" core="fbneo" />, errorElement: <ErrorPage /> },
  { path: '/kof97', element: <ArcadeGame title="拳皇97" romPath="/roms/arcade/kof97.zip" core="fbneo" />, errorElement: <ErrorPage /> },
  { path: '/kof2002', element: <ArcadeGame title="拳皇2002" romPath="/roms/arcade/kof2002.zip" core="fbneo" />, errorElement: <ErrorPage /> },
  { path: '/orlegend', element: <ArcadeGame title="西游释厄传" romPath="/roms/arcade/orlegend.zip" biosPath="/roms/arcade/pgm.zip" core="fbneo" />, errorElement: <ErrorPage /> },
  { path: '/sangokushi', element: <ArcadeGame title="三国战纪" romPath="/roms/arcade/kov.zip" biosPath="/roms/arcade/pgm.zip" core="fbneo" />, errorElement: <ErrorPage /> },
  // 注意：三国战纪需要完整的 PGM BIOS 文件才能运行
  // 如果显示缺少 ROM 文件错误，请确保 pgm.zip 包含以下文件：
  // pgm_t01s.rom, pgm_m01s.rom, pgm_p01s.u20, pgm_p02s.u20, ddp3_bios.u37, bios.u42
  { path: '/ldrun-arcade', element: <ArcadeGame title="淘金者(街机)" romPath="/roms/arcade/ldrun.zip" core="fbneo" />, errorElement: <ErrorPage /> },
  { path: '/ddragon', element: <ArcadeGame title="双截龙" romPath="/roms/arcade/ddragon.zip" core="mame2003_plus" />, errorElement: <ErrorPage /> },

  // 游戏合集中心（统一入口，不用切换页面即可切换游戏）
  { path: '/game-hub', element: <GameHub />, errorElement: <ErrorPage /> },
])

export default function RouterConfig() {
  return <RouterProvider router={router} />
}
