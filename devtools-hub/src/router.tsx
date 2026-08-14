import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom'
import App from './App'
import { AINavigator } from './components/ai-navigator'
import { CodingTheWorld } from './components/coding-the-world'
import { OfflineTools } from './components/offline-tools'
import { GaussDBLearn } from './components/GaussDBLearn'
import { Game } from './components/game'
import { RetroGames } from './components/retro-games'
import { GameCollection } from './components/game-collection'
import { LinkGame } from './components/link-game'
import { Minesweeper } from './components/minesweeper'
import { Game2048 } from './components/game2048'
import GoldMiner from './components/GoldMiner'
import Sanmo from './components/Sanmo'
import SpiderSolitaire from './components/SpiderSolitaire'
import Fumojì from './components/Fumojì'
import FumojìBBK from './components/FumojìBBK'
import { RegistryViewer } from './components/registry-viewer'
import NESGame from './components/NESGame'
import ArcadeGame from './components/ArcadeGame'
import GameHub from './components/GameHub'
import PerlerBeadsCoop from './components/PerlerBeadsCoop'
import MusicRoom from './components/MusicRoom'
import Invitation from './components/Invitation'
import { ErrorPage } from './components/ErrorPage'
import { PageMeta } from './components/PageMeta'

// SEO metadata for each route
// handle.seo only defines route-specific overrides; PageMeta falls back to defaults
const SEO = {
  HOME: {
    title: 'DevTools Hub - 在线开发者工具集 | JSON格式化·编码转换·经典游戏',
    description: 'DevTools Hub 提供 JSON 格式化、编码转换、代码编辑器、正则测试等 40+ 离线开发工具，以及魂斗罗、拳皇97、蜘蛛纸牌、连连看等经典游戏免费在线玩，全部本地运行，保护隐私。',
  },
  AI: {
    title: 'AI工具导航 - AI导航黄页 | DevTools Hub',
    description: '收录全网 192+ 优质 AI 工具，涵盖 ChatGPT、AI 绘画、AI 编程、AI 写作等分类，帮你快速找到最适合的 AI 工具。',
  },
  CODING_WORLD: {
    title: 'Coding The World - 开源项目探索 | DevTools Hub',
    description: '探索全球优质开源项目，涵盖前端、后端、AI、DevOps 等领域，发现改变世界的代码。',
  },
  OFFLINE_TOOLS: {
    title: '离线开发工具 - 40+免网络开发工具箱 | DevTools Hub',
    description: '40+ 开发者工具全部本地运行，无需网络。JSON/XML/YAML 格式化、Base64 编码、正则测试、代码编辑器、时间戳转换等。',
  },
  GAME: {
    title: 'AI文字游戏 - 角色扮演冒险 | DevTools Hub',
    description: '基于 AI 的文字角色扮演游戏，沉浸式剧情体验，每一次选择都影响故事走向。',
  },
  RETRO_GAMES: {
    title: '复古游戏 - 经典FC街机游戏合集 | DevTools Hub',
    description: '回味经典！魂斗罗、超级马里奥、坦克大战、拳皇97、三国战纪等 FC/NES 和街机游戏免费在线玩。',
  },
  GAME_COLLECTION: {
    title: '游戏平台合集 - 第三方游戏导航 | DevTools Hub',
    description: '收录优质第三方在线游戏平台，发现更多好玩的网页游戏。',
  },
  GAME_HUB: {
    title: '游戏中心 - 街机/FC/休闲游戏合集 | DevTools Hub',
    description: '一页畅玩所有经典游戏：魂斗罗、拳皇97、蜘蛛纸牌、扫雷、2048、黄金矿工、连连看等。',
  },
  PERLER_COOP: {
    title: '拼豆联机 - 多人在线拼豆创作 | DevTools Hub',
    description: '纯网页多人联机拼豆游戏，WebRTC P2P 实时合作，20色调色板，创建房间分享码即可和好友一起拼豆创作，支持预设图案和导出PNG。',
  },
  MUSIC_ROOM: {
    title: '共享听歌房 - 多人在线听歌聊天 | DevTools Hub',
    description: '纯网页多人在线共享听歌房间，支持网易云/QQ音乐/酷狗搜索点歌，房间内实时聊天、表情互动、刷礼物、摇骰子/十五二十/小姐牌小游戏，P2P实时同步。',
  },
  LINK_GAME: {
    title: '连连看在线玩 - 经典休闲益智游戏 | DevTools Hub',
    description: '在线连连看小游戏，经典消除玩法，锻炼眼力和反应速度，免费在线畅玩。',
  },
  MINESWEEPER: {
    title: '扫雷在线玩 - 经典益智游戏 | DevTools Hub',
    description: '经典 Windows 扫雷游戏网页版，多种难度可选，挑战你的逻辑推理能力，免费在线玩。',
  },
  GAME2048: {
    title: '2048在线玩 - 数字益智游戏 | DevTools Hub',
    description: '风靡全球的 2048 数字游戏，滑动合并相同数字，挑战 2048 甚至更高分数！免费在线玩。',
  },
  GOLD_MINER: {
    title: '黄金矿工在线玩 - 经典休闲小游戏 | DevTools Hub',
    description: '经典黄金矿工网页版，控制钩爪抓取金块和钻石，避开石头，挑战最高分！免费在线玩。',
  },
  SPIDER_SOLITAIRE: {
    title: '蜘蛛纸牌在线玩 - 经典纸牌游戏 | DevTools Hub',
    description: '经典蜘蛛纸牌网页版，单色/双色/四色模式可选，锻炼耐心和策略思维，免费在线玩。',
  },
  SANMO: {
    title: '三目童子在线玩 - FC经典游戏 | DevTools Hub',
    description: 'FC 经典游戏三目童子网页模拟器版，怀旧童年记忆，免费在线畅玩。',
  },
  FUMOJI: {
    title: '伏魔记在线玩 - FC经典RPG | DevTools Hub',
    description: 'FC 经典角色扮演游戏伏魔记网页版，重温经典回合制战斗，免费在线玩。',
  },
  FUMOJI_BBK: {
    title: '伏魔记步步高在线玩 - FC游戏 | DevTools Hub',
    description: '伏魔记步步高版本网页模拟器版，FC 经典 RPG 游戏免费在线畅玩。',
  },
  REGISTRY: {
    title: 'Docker Registry - 私有镜像仓库管理 | DevTools Hub',
    description: '可视化 Docker 私有镜像仓库管理工具，查看、搜索、删除镜像标签，管理容器镜像。',
  },
  GAUSSDB_LEARN: {
    title: 'GaussDB在线学习 - SQL数据库练习平台 | DevTools Hub',
    description: '华为GaussDB数据库在线学习平台，内置浏览器SQL练习环境。学习DDL、DML、SELECT、JOIN、聚合、子查询、事务等数据库知识，边学边练，免费在线运行SQL。',
  },
  INVITATION: {
    title: '电子请柬 - 婚礼/生日/乔迁邀请函在线制作 | DevTools Hub',
    description: '免费在线制作电子请柬：婚礼、生日、满月、乔迁、派对等多种场景模板，填写信息实时预览，一键生成分享链接，支持倒计时、背景音乐、祝福留言墙。',
  },
}

// Helper: SEO for NES games
function nesSEO(name: string, keywords: string) {
  return {
    title: `${name}在线玩 - FC经典游戏 | DevTools Hub`,
    description: `FC经典游戏《${name}》网页模拟器版，无需下载，浏览器直接玩。${keywords}`,
  }
}

// Helper: SEO for arcade games
function arcadeSEO(name: string, keywords: string) {
  return {
    title: `${name}在线玩 - 街机经典游戏 | DevTools Hub`,
    description: `街机经典游戏《${name}》网页模拟器版，完美还原街机厅体验，免费在线畅玩。${keywords}`,
  }
}

// Root layout that sets SEO meta from route handles
function RootLayout() {
  return (
    <>
      <PageMeta />
      <Outlet />
    </>
  )
}

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <ErrorPage />,
    children: [
      { path: '/', element: <App />, handle: { seo: SEO.HOME } },
      { path: '/ai', element: <AINavigator />, handle: { seo: SEO.AI } },
      { path: '/coding-the-world', element: <CodingTheWorld />, handle: { seo: SEO.CODING_WORLD } },
      { path: '/offline-tools', element: <OfflineTools />, handle: { seo: SEO.OFFLINE_TOOLS } },
      { path: '/gaussdb-learn', element: <GaussDBLearn />, handle: { seo: SEO.GAUSSDB_LEARN } },
      { path: '/invitation', element: <Invitation />, handle: { seo: SEO.INVITATION } },
      { path: '/game', element: <Game />, handle: { seo: SEO.GAME } },
      { path: '/retro-games', element: <RetroGames />, handle: { seo: SEO.RETRO_GAMES } },
      { path: '/game-collection', element: <GameCollection />, handle: { seo: SEO.GAME_COLLECTION } },
      { path: '/game-hub', element: <GameHub />, handle: { seo: SEO.GAME_HUB } },
      { path: '/perler-coop', element: <PerlerBeadsCoop />, handle: { seo: SEO.PERLER_COOP } },
      { path: '/music-room', element: <MusicRoom />, handle: { seo: SEO.MUSIC_ROOM } },

      // 休闲游戏
      { path: '/link-game', element: <LinkGame />, handle: { seo: SEO.LINK_GAME } },
      { path: '/minesweeper', element: <Minesweeper />, handle: { seo: SEO.MINESWEEPER } },
      { path: '/game2048', element: <Game2048 />, handle: { seo: SEO.GAME2048 } },
      { path: '/gold-miner', element: <GoldMiner />, handle: { seo: SEO.GOLD_MINER } },
      { path: '/gold-mine', element: <GoldMiner />, handle: { seo: SEO.GOLD_MINER } },
      { path: '/spider-solitaire', element: <SpiderSolitaire />, handle: { seo: SEO.SPIDER_SOLITAIRE } },
      { path: '/gunnac', element: <NESGame title="加纳战机" romPath="/roms/nes/gun_nac.nes" />, handle: { seo: nesSEO('加纳战机', '经典FC纵版射击游戏，武器升级系统，Gun-Nac。') } },

      // 特殊小游戏
      { path: '/sanmo', element: <Sanmo />, handle: { seo: SEO.SANMO } },
      { path: '/fumojì', element: <Fumojì />, handle: { seo: SEO.FUMOJI } },
      { path: '/fumojì-bbk', element: <FumojìBBK />, handle: { seo: SEO.FUMOJI_BBK } },

      // NES/FC 游戏
      { path: '/contra-fc', element: <NESGame title="魂斗罗" romPath="/roms/contra.nes" />, handle: { seo: nesSEO('魂斗罗', '经典横版射击游戏，上上下下左右左右BABA。') } },
      { path: '/tank-battle', element: <NESGame title="坦克大战" romPath="/roms/tank_battle.nes" />, handle: { seo: nesSEO('坦克大战', '保卫基地，消灭敌方坦克，双人合作更精彩。') } },
      { path: '/super-mario', element: <NESGame title="超级马里奥" romPath="/roms/super_mario.nes" />, handle: { seo: nesSEO('超级马里奥', '水管工马里奥拯救公主，史上最经典平台跳跃游戏。') } },
      { path: '/lode-runner', element: <NESGame title="淘金者" romPath="/roms/LodeRunner.nes" />, handle: { seo: nesSEO('淘金者', '收集所有金块并躲避敌人，经典解谜动作游戏。') } },
      { path: '/river-city', element: <NESGame title="热血街头" romPath="/roms/nes/river_city.nes" />, handle: { seo: nesSEO('热血街头', '热血系列经典之作，街头格斗闯关。') } },
      { path: '/battle-city-nes', element: <NESGame title="坦克要塞" romPath="/roms/nes/battle_city.nes" />, handle: { seo: nesSEO('坦克要塞', '坦克大战变体版本，更多关卡更多挑战。') } },
      { path: '/adventure-island', element: <NESGame title="恐龙冒险岛" romPath="/roms/nes/adventure_island.nes" />, handle: { seo: nesSEO('恐龙冒险岛', '高桥名人的冒险岛，经典横版动作闯关游戏。') } },
      { path: '/chip-dale', element: <NESGame title="松鼠大战" romPath="/roms/nes/chip_dale.nes" />, handle: { seo: nesSEO('松鼠大战', '迪士尼经典动画改编，双人合作举箱子砸敌人。') } },
      { path: '/lode-runner-nes', element: <NESGame title="淘金者" romPath="/roms/nes/lode_runner.nes" />, handle: { seo: nesSEO('淘金者(NES)', 'NES版淘金者，收集金块闯关解谜。') } },
      { path: '/pooyan-nes', element: <NESGame title="猪小弟" romPath="/roms/nes/pooyan.nes" />, handle: { seo: nesSEO('猪小弟', '经典FC射击游戏，保护小猪免受狼群攻击。') } },

      // 街机游戏
      { path: '/snowbros', element: <ArcadeGame title="雪人兄弟" romPath="/roms/arcade/snowbros.zip" core="fbneo" />, handle: { seo: arcadeSEO('雪人兄弟', '双人合作经典，把敌人滚成雪球踢出去。') } },
      { path: '/pooyan-arcade', element: <ArcadeGame title="猪小弟(街机)" romPath="/roms/arcade/pooyan.zip" core="fbneo" />, handle: { seo: arcadeSEO('猪小弟', '街机版射击游戏，射箭保护小猪。') } },
      { path: '/gberet', element: <ArcadeGame title="绿色兵团" romPath="/roms/arcade/gberet.zip" core="fbneo" />, handle: { seo: arcadeSEO('绿色兵团', '经典横版动作射击，深入敌后执行秘密任务。') } },
      { path: '/dino', element: <ArcadeGame title="恐龙快打" romPath="/roms/arcade/dino.zip" biosPath="/roms/arcade/neogeo.zip" core="fbneo" />, handle: { seo: arcadeSEO('恐龙快打', 'Capcom经典街机游戏，四人合作打恐龙，黄帽最受欢迎。') } },
      { path: '/punisher', element: <ArcadeGame title="惩罚者" romPath="/roms/arcade/punisher.zip" biosPath="/roms/arcade/neogeo.zip" core="fbneo" />, handle: { seo: arcadeSEO('惩罚者', '漫威经典改编街机，惩罚者与神盾局长联手打击犯罪。') } },
      { path: '/kof97', element: <ArcadeGame title="拳皇97" romPath="/roms/arcade/kof97.zip" core="fbneo" />, handle: { seo: arcadeSEO('拳皇97', 'SNK巅峰之作，八神庵、草薙京经典角色大乱斗，中国最受欢迎的格斗游戏。') } },
      { path: '/kof2002', element: <ArcadeGame title="拳皇2002" romPath="/roms/arcade/kof2002.zip" core="fbneo" />, handle: { seo: arcadeSEO('拳皇2002', '拳皇系列集大成之作，角色最多、连招最丰富的格斗游戏。') } },
      { path: '/orlegend', element: <ArcadeGame title="西游释厄传" romPath="/roms/arcade/orlegend.zip" biosPath="/roms/arcade/pgm.zip" core="fbneo" />, handle: { seo: arcadeSEO('西游释厄传', 'IGS经典街机，孙悟空、猪八戒等角色西天取经闯关。') } },
      { path: '/sangokushi', element: <ArcadeGame title="三国战纪" romPath="/roms/arcade/kov.zip" biosPath="/roms/arcade/pgm.zip" core="fbneo" />, handle: { seo: arcadeSEO('三国战纪', 'IGS经典街机游戏，关羽、张飞、赵云等武将闯关，中国街机厅王者。') } },
      { path: '/ldrun-arcade', element: <ArcadeGame title="淘金者(街机)" romPath="/roms/arcade/ldrun.zip" core="fbneo" />, handle: { seo: arcadeSEO('淘金者(街机)', '街机版淘金者，收集全部金块并躲避追捕。') } },
      { path: '/ddragon', element: <ArcadeGame title="双截龙" romPath="/roms/arcade/ddragon.zip" core="mame2003_plus" />, handle: { seo: arcadeSEO('双截龙', '经典街机格斗闯关，双人合作打击敌人，救出女友。') } },

      // 管理工具
      { path: '/registry', element: <RegistryViewer />, handle: { seo: SEO.REGISTRY } },

      // 404 兜底
      { path: '*', element: <ErrorPage /> },
    ],
  },
])

export default function RouterConfig() {
  return <RouterProvider router={router} />
}
