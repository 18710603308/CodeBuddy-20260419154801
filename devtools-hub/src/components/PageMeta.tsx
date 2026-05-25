import { Helmet } from 'react-helmet-async'
import { useMatches } from 'react-router-dom'

interface SeoHandle {
  seo?: {
    title: string
    description: string
  }
}

export function PageMeta() {
  const matches = useMatches()
  // Find the deepest route match that has SEO handle data
  const seo = [...matches].reverse().find(
    (m) => (m?.handle as SeoHandle)?.seo
  )?.handle as SeoHandle | undefined

  const title = seo?.seo?.title || 'DevTools Hub - 在线开发者工具集'
  const description = seo?.seo?.description || 'DevTools Hub 提供 JSON 格式化、编码转换、代码编辑器、正则测试等 40+ 离线开发工具，以及魂斗罗、拳皇97、蜘蛛纸牌等经典游戏在线玩。'
  // Use runtime origin for canonical (works with any domain)
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://52cv.top'
  const pathname = matches[matches.length - 1]?.pathname || '/'
  const canonicalUrl = `${origin}${pathname}`

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content="在线工具,JSON格式化,编码转换,代码编辑器,正则表达式,开发者工具,经典游戏,魂斗罗,拳皇,蜘蛛纸牌,连连看,扫雷,2048,黄金矿工" />
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content="DevTools Hub" />
      <meta property="og:locale" content="zh_CN" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />

      {/* JSON-LD Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'DevTools Hub',
          url: origin,
          description,
          applicationCategory: 'DeveloperApplication',
          operatingSystem: 'Web',
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'CNY',
          },
        })}
      </script>
    </Helmet>
  )
}
