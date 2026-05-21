import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

interface ServiceStatus {
  status: string
  model?: string
  repos?: number
}

interface Services {
  nginx: ServiceStatus
  whisper: ServiceStatus
  registry: ServiceStatus
  containers: string[]
}

interface DeployResult {
  success: boolean
  message: string
}

const deployItems = [
  { name: '前端 (devtools-hub)', service: 'frontend', desc: '需本地运行 ./deploy.sh', cmd: './deploy.sh frontend', needsLocal: true },
  { name: 'Docker API', service: 'docker-api', desc: '重启后端服务', cmd: './deploy.sh docker-api', needsLocal: false },
  { name: 'Nginx 配置', service: 'nginx', desc: '重载 Nginx 配置', cmd: './deploy.sh nginx', needsLocal: false },
  { name: '全部部署', service: 'all', desc: '重启所有服务', cmd: './deploy.sh all', needsLocal: true },
]

export function DevOpsPipeline() {
  const navigate = useNavigate()
  const [services, setServices] = useState<Services | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deploying, setDeploying] = useState<string | null>(null)
  const [deployResult, setDeployResult] = useState<DeployResult | null>(null)
  const [activeTab, setActiveTab] = useState<'status' | 'deploy' | 'images'>('status')

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const res = await fetch('/api/status')
      const data = await res.json()
      if (data.success) setServices(data.services)
      else setError('获取状态失败')
    } catch {
      setError('连接失败，请检查服务')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchStatus() }, [fetchStatus])

  const deployService = async (service: string, needsLocal: boolean) => {
    if (needsLocal) {
      setDeployResult({
        success: false,
        message: `「${service}」部署需要在本地终端执行：\n\n  cd 项目根目录\n  ./deploy.sh ${service}\n\n前端构建 + 上传只能在本地完成，服务器端无法执行。`,
      })
      return
    }
    setDeploying(service)
    setDeployResult(null)
    try {
      const res = await fetch('/api/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service }),
      })
      const data = await res.json()
      setDeployResult(data)
      if (data.success) setTimeout(fetchStatus, 2000)
    } catch {
      setDeployResult({ success: false, message: '网络错误，部署请求失败' })
    } finally {
      setDeploying(null)
    }
  }

  const statusBadge = (s: string) => {
    const map: Record<string, string> = { running: 'bg-green-500 text-white', down: 'bg-red-500 text-white', unknown: 'bg-gray-400 text-white' }
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[s] || 'bg-gray-400 text-white'}`}>{s}</span>
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">DevOps 流水线管理</h1>

      {/* 标签页 */}
      <div className="flex gap-2 mb-4">
        {(['status', 'deploy', 'images'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded ${activeTab === tab ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
          >
            {{ status: '服务状态', deploy: '流水线', images: '镜像仓库' }[tab]}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-3 mb-4 text-red-700 text-sm">{error}</div>
      )}

      {activeTab === 'status' && location.hostname !== '110.42.247.238' && (
        <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded p-3 mb-4 text-xs text-yellow-800 dark:text-yellow-300">
          ⚠️ 本地预览模式：服务状态连接的是本地后端（localhost），显示 down 表示本地无对应服务。部署到生产环境后状态将恢复正常。
        </div>
      )}

      {/* 服务状态 */}
      {activeTab === 'status' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">生产环境服务状态</h2>
            <button onClick={fetchStatus} disabled={loading} className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:opacity-50">
              {loading ? '刷新中...' : '刷新'}
            </button>
          </div>

          {loading && !services ? (
            <div className="text-center py-8 text-gray-500">加载中...</div>
          ) : services ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { name: 'Nginx (前端)', s: services.nginx, desc: '反向代理 + 静态资源' },
                  { name: 'Whisper (语音)', s: services.whisper, desc: services.whisper?.model ? `模型: ${services.whisper.model}` : '语音转写' },
                ].map(svc => (
                  <div key={svc.name} className="border rounded-lg p-3 flex justify-between items-center">
                    <div>
                      <div className="font-medium">{svc.name}</div>
                      <div className="text-xs text-gray-500">{svc.desc}</div>
                    </div>
                    {statusBadge(svc.s?.status || 'unknown')}
                  </div>
                ))}
              </div>

              <div className="border rounded-lg p-3">
                <div className="flex justify-between items-center mb-2">
                  <div className="font-medium">Registry (镜像仓库)</div>
                  {statusBadge(services.registry?.status || 'unknown')}
                </div>
                <div className="text-xs text-gray-500">仓库镜像数: {services.registry?.repos ?? 0}</div>
              </div>

              {services.containers.length > 0 && (
                <div className="border rounded-lg p-3">
                  <div className="font-medium mb-2">Docker 容器</div>
                  <div className="space-y-1">
                    {services.containers.map((c, i) => {
                      const [name, ...rest] = c.split(':')
                      return (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="font-mono">{name}</span>
                          <span className="text-gray-500">{rest.join(':')}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      )}

      {/* 流水线 */}
      {activeTab === 'deploy' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-4">一键部署流水线</h2>

          {/* 部署结果 */}
          {deployResult && (
            <div className={`mb-4 p-3 rounded text-sm ${deployResult.success ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
              <div className="font-medium mb-1">{deployResult.success ? '✅' : '❌'} 部署{deployResult.success ? '成功' : '失败'}</div>
              <pre className="text-xs whitespace-pre-wrap">{deployResult.message}</pre>
            </div>
          )}

          <div className="space-y-3">
            {deployItems.map(item => {
              const isDeploying = deploying === item.service
              const isLocal = item.needsLocal
              return (
                <div key={item.service} className="border rounded-lg p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-gray-500 mt-1">{item.desc}</div>
                      <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded mt-1 inline-block">{item.cmd}</code>
                    </div>
                    <button
                      onClick={() => deployService(item.service, isLocal)}
                      disabled={deploying !== null}
                      className={`px-3 py-1 rounded text-sm text-white transition-colors disabled:opacity-50 min-w-[64px] ${
                        isLocal ? 'bg-orange-500 hover:bg-orange-600' :
                        isDeploying ? 'bg-yellow-500' : 'bg-green-500 hover:bg-green-600'
                      }`}
                    >
                      {isLocal ? '本地执行' : isDeploying ? '部署中...' : '触发'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
            💡 <strong>前端/全量部署</strong>需要在本地终端执行（构建 + 上传）：<code className="px-1 bg-blue-100 rounded">./deploy.sh frontend</code> 或 <code className="px-1 bg-blue-100 rounded">./deploy.sh all</code>
            <br />🟢 <strong>Docker API / Nginx</strong> 可直接在页面上点击「触发」远程执行。
          </div>
        </div>
      )}

      {/* 镜像仓库 */}
      {activeTab === 'images' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-4">私有镜像仓库</h2>
          <div className="text-sm text-gray-500 mb-2">
            仓库地址: <code className="px-1 bg-gray-100 rounded">localhost:5000</code>
          </div>
          <div className="text-center py-8 text-gray-500">
            查看和管理镜像，请使用{' '}
            <button onClick={() => navigate('/registry')} className="text-blue-500 underline hover:text-blue-600">
              镜像管理
            </button>{' '}
            工具
          </div>
        </div>
      )}
    </div>
  )
}
