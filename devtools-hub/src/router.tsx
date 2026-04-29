import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from './App'
import { AINavigator } from './components/ai-navigator'
import { CodingTheWorld } from './components/coding-the-world'
import { OfflineTools } from './components/offline-tools'
import { Game } from './components/game'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
  },
  {
    path: '/ai',
    element: <AINavigator />,
  },
  {
    path: '/coding-the-world',
    element: <CodingTheWorld />,
  },
  {
    path: '/offline-tools',
    element: <OfflineTools />,
  },
  {
    path: '/game',
    element: <Game />,
  },
])

export default function RouterConfig() {
  return <RouterProvider router={router} />
}
