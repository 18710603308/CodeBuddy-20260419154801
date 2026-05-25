/**
 * Sitemap 生成脚本
 * 用法: node scripts/generate-sitemap.js
 * 生成 public/sitemap.xml
 */

const fs = require('fs')
const path = require('path')

const BASE_URL = 'https://52cv.top'
const TODAY = new Date().toISOString().split('T')[0]

const routes = [
  // 主页面 (最高优先级)
  { path: '/', changefreq: 'daily', priority: '1.0' },

  // 独立功能页面
  { path: '/ai', changefreq: 'weekly', priority: '0.9' },
  { path: '/coding-the-world', changefreq: 'weekly', priority: '0.9' },
  { path: '/offline-tools', changefreq: 'weekly', priority: '0.9' },
  { path: '/game', changefreq: 'weekly', priority: '0.8' },
  { path: '/retro-games', changefreq: 'weekly', priority: '0.8' },
  { path: '/game-collection', changefreq: 'weekly', priority: '0.7' },
  { path: '/game-hub', changefreq: 'weekly', priority: '0.9' },

  // 休闲游戏
  { path: '/link-game', changefreq: 'monthly', priority: '0.7' },
  { path: '/minesweeper', changefreq: 'monthly', priority: '0.7' },
  { path: '/game2048', changefreq: 'monthly', priority: '0.7' },
  { path: '/gold-miner', changefreq: 'monthly', priority: '0.7' },
  { path: '/spider-solitaire', changefreq: 'monthly', priority: '0.7' },

  // 特殊小游戏
  { path: '/sanmo', changefreq: 'monthly', priority: '0.6' },
  { path: '/fumojì', changefreq: 'monthly', priority: '0.6' },
  { path: '/fumojì-bbk', changefreq: 'monthly', priority: '0.6' },

  // NES/FC 游戏
  { path: '/contra-fc', changefreq: 'monthly', priority: '0.7' },
  { path: '/tank-battle', changefreq: 'monthly', priority: '0.7' },
  { path: '/super-mario', changefreq: 'monthly', priority: '0.7' },
  { path: '/lode-runner', changefreq: 'monthly', priority: '0.6' },
  { path: '/river-city', changefreq: 'monthly', priority: '0.6' },
  { path: '/battle-city-nes', changefreq: 'monthly', priority: '0.6' },
  { path: '/adventure-island', changefreq: 'monthly', priority: '0.6' },
  { path: '/chip-dale', changefreq: 'monthly', priority: '0.6' },
  { path: '/lode-runner-nes', changefreq: 'monthly', priority: '0.6' },
  { path: '/pooyan-nes', changefreq: 'monthly', priority: '0.6' },

  // 街机游戏
  { path: '/snowbros', changefreq: 'monthly', priority: '0.7' },
  { path: '/pooyan-arcade', changefreq: 'monthly', priority: '0.6' },
  { path: '/gberet', changefreq: 'monthly', priority: '0.6' },
  { path: '/dino', changefreq: 'monthly', priority: '0.7' },
  { path: '/punisher', changefreq: 'monthly', priority: '0.7' },
  { path: '/kof97', changefreq: 'monthly', priority: '0.8' },
  { path: '/kof2002', changefreq: 'monthly', priority: '0.8' },
  { path: '/orlegend', changefreq: 'monthly', priority: '0.7' },
  { path: '/sangokushi', changefreq: 'monthly', priority: '0.8' },
  { path: '/ldrun-arcade', changefreq: 'monthly', priority: '0.6' },
  { path: '/ddragon', changefreq: 'monthly', priority: '0.7' },

  // 管理页面
  { path: '/registry', changefreq: 'weekly', priority: '0.5' },
]

function generateSitemap() {
  const urls = routes.map((r) => {
    return `  <url>
    <loc>${BASE_URL}${r.path}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`
  }).join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0">
${urls}
</urlset>
`

  const outputPath = path.join(__dirname, '..', 'public', 'sitemap.xml')
  fs.writeFileSync(outputPath, xml, 'utf-8')
  console.log(`✅ Sitemap generated: ${outputPath}`)
  console.log(`   ${routes.length} URLs`)
  console.log(`   Base URL: ${BASE_URL}`)
}

generateSitemap()
