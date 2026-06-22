/**
 * 百度联盟广告位组件
 * 三种位置:tools-after (工具列表后) / footer (页脚) / sidebar (侧栏)
 */
interface AdBannerProps {
  position: 'tools-after' | 'footer' | 'sidebar'
}

const STYLES: Record<AdBannerProps['position'], string> = {
  'tools-after': 'my-6 px-4',
  footer: 'py-6 px-4',
  sidebar: 'sticky top-24',
}

const CONTAINER_CLASS: Record<AdBannerProps['position'], string> = {
  'tools-after': 'min-h-[100px] md:min-h-[90px]',
  footer: 'min-h-[100px] md:min-h-[90px]',
  sidebar: 'min-h-[250px]',
}

export function AdBanner({ position }: AdBannerProps) {
  return (
    <div className={`max-w-7xl mx-auto ${STYLES[position]}`}>
      <div
        id={`baidu-ad-${position}`}
        className={`${CONTAINER_CLASS[position]} bg-gradient-to-r from-amber-500/5 to-orange-500/5 border border-amber-500/10 rounded-xl overflow-hidden`}
      >
        {/* 百度网盟广告代码 - 保留此占位区域，审核通过后会自动显示广告 */}
        <div className="h-full flex items-center justify-center text-muted/50 text-sm p-4">
          <div className="text-center">
            <div className="text-2xl mb-2">📢</div>
            <div>百度联盟广告位</div>
            <div className="text-xs mt-1">审核通过后自动显示</div>
          </div>
        </div>
      </div>
    </div>
  )
}
