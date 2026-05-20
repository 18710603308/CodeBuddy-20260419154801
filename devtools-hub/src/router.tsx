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
import ContraFC from './components/ContraFC'
import TankBattle from './components/TankBattle'
import SuperMario from './components/SuperMario'
import FlappyBird from './components/FlappyBird'
import LodeRunner from './components/LodeRunner'
import Sanmo from './components/Sanmo'
import SpiderSolitaire from './components/SpiderSolitaire'
import Fumojì from './components/Fumojì'
import FumojìBBK from './components/FumojìBBK'
import { RegistryViewer } from './components/registry-viewer'

const router = createBrowserRouter([
  { path: '/', element: <App /> },
  { path: '/ai', element: <AINavigator /> },
  { path: '/coding-the-world', element: <CodingTheWorld /> },
  { path: '/offline-tools', element: <OfflineTools /> },
  { path: '/game', element: <Game /> },
  { path: '/retro-games', element: <RetroGames /> },
  { path: '/game-collection', element: <GameCollection /> },
  { path: '/link-game', element: <LinkGame /> },
  { path: '/minesweeper', element: <Minesweeper /> },
  { path: '/game2048', element: <Game2048 /> },
  { path: '/contra-fc', element: <ContraFC /> },
  { path: '/tank-battle', element: <TankBattle /> },
  { path: '/super-mario', element: <SuperMario /> },
  { path: '/flappy-bird', element: <FlappyBird /> },
  { path: '/lode-runner', element: <LodeRunner /> },
  { path: '/sanmo', element: <Sanmo /> },
  { path: '/spider-solitaire', element: <SpiderSolitaire /> },
  { path: '/fumojì', element: <Fumojì /> },
  { path: '/fumojì-bbk', element: <FumojìBBK /> },
  { path: '/registry', element: <RegistryViewer /> },
])

export default function RouterConfig() {
  return <RouterProvider router={router} />
}
