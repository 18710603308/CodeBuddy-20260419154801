import { useState, useEffect } from 'react'

const REGISTRY_API = '/registry'
const DOCKER_API = '/api/docker'

interface Image {
  name: string
  tags: string[]
}

export function ImageManager() {
  const [images, setImages] = useState<Image[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [log, setLog] = useState<string[]>([])
  const [pullImage, setPullImage] = useState('')
  const [uploadName, setUploadName] = useState('')
  const [uploadTag, setUploadTag] = useState('latest')
  const [activeTab, setActiveTab] = useState<'manage' | 'upload' | 'pull'>('manage')

  const addLog = (msg: string) => setLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`])

  const fetchImages = async () => {
    try {
      setLoading(true)
      // 从 Registry API 获取仓库镜像列表
      const res = await fetch(`${REGISTRY_API}/v2/_catalog`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const repos: string[] = data.repositories || []

      const imageList: Image[] = []
      for (const repo of repos) {
        const tagRes = await fetch(`${REGISTRY_API}/v2/${repo}/tags/list`)
        if (!tagRes.ok) continue
        const tagData = await tagRes.json()
        imageList.push({ name: repo, tags: tagData.tags || [] })
      }
      setImages(imageList)
    } catch (e) {
      addLog('获取镜像列表失败: ' + String(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchImages()
  }, [])

  const uploadImage = async () => {
    if (!uploadName.trim()) return
    setUploading(true)
    addLog(`开始上传: ${uploadName}:${uploadTag}`)

    try {
      // 1. 拉取
      addLog('1. 拉取镜像...')
      await fetch('/api/docker/pull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: uploadName, tag: uploadTag })
      })

      // 2. 标记
      addLog('2. 标记镜像...')
      const registryImage = `110.42.247.238:5000/${uploadName}:${uploadTag}`
      await fetch('/api/docker/tag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: `${uploadName}:${uploadTag}`, target: registryImage })
      })

      // 3. 推送
      addLog('3. 推送到私有仓库...')
      const pushRes = await fetch('/api/docker/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: registryImage })
      })

      if (pushRes.ok) {
        addLog(`✅ 上传成功: ${registryImage}`)
      } else {
        addLog('❌ 上传失败')
      }

      fetchImages()
    } catch {
      addLog('❌ 上传出错')
    } finally {
      setUploading(false)
    }
  }

  const pullFromRegistry = async () => {
    if (!pullImage.trim()) return
    setUploading(true)
    addLog(`从私有仓库拉取: ${pullImage}`)

    try {
      const res = await fetch('/api/docker/pull-registry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: pullImage })
      })

      if (res.ok) {
        addLog(`✅ 拉取成功: ${pullImage}`)
      } else {
        addLog('❌ 拉取失败')
      }
    } catch {
      addLog('❌ 拉取出错')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">镜像管理</h1>

      {/* 标签页 */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('manage')}
          className={`px-4 py-2 rounded ${activeTab === 'manage' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          仓库镜像
        </button>
        <button
          onClick={() => setActiveTab('upload')}
          className={`px-4 py-2 rounded ${activeTab === 'upload' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          上传镜像
        </button>
        <button
          onClick={() => setActiveTab('pull')}
          className={`px-4 py-2 rounded ${activeTab === 'pull' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          拉取镜像
        </button>
      </div>

      {/* 仓库镜像列表 */}
      {activeTab === 'manage' && (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">私有仓库镜像</h2>
            <button
              onClick={fetchImages}
              disabled={loading}
              className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
            >
              {loading ? '加载中...' : '刷新'}
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500">加载中...</div>
          ) : images.length === 0 ? (
            <div className="text-center py-8 text-gray-500">暂无镜像</div>
          ) : (
            <div className="space-y-4">
              {images.map(img => (
                <div key={img.name} className="border rounded p-3">
                  <div className="font-medium">{img.name}</div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {img.tags.map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    完整地址: {img.name}:{img.tags[0] || 'latest'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 上传镜像 */}
      {activeTab === 'upload' && (
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-4">上传本地镜像到私有仓库</h2>
          <p className="text-gray-600 mb-4">
            输入本地镜像名称和标签，自动推送到私有仓库
          </p>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="镜像名，如 nginx"
              value={uploadName}
              onChange={e => setUploadName(e.target.value)}
              className="flex-1 border rounded px-3 py-2"
            />
            <input
              type="text"
              placeholder="标签"
              value={uploadTag}
              onChange={e => setUploadTag(e.target.value)}
              className="w-32 border rounded px-3 py-2"
            />
            <button
              onClick={uploadImage}
              disabled={uploading || !uploadName.trim()}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
            >
              {uploading ? '上传中...' : '上传'}
            </button>
          </div>
        </div>
      )}

      {/* 拉取镜像 */}
      {activeTab === 'pull' && (
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-4">从私有仓库拉取镜像</h2>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="镜像地址，如 devtools-hub:latest"
              value={pullImage}
              onChange={e => setPullImage(e.target.value)}
              className="flex-1 border rounded px-3 py-2"
            />
            <button
              onClick={pullFromRegistry}
              disabled={uploading || !pullImage.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {uploading ? '拉取中...' : '拉取'}
            </button>
          </div>
        </div>
      )}

      {/* 日志 */}
      {log.length > 0 && (
        <div className="mt-4 bg-gray-900 text-green-400 rounded p-4 font-mono text-sm">
          {log.map((l, i) => (
            <div key={i} className="whitespace-pre-wrap">{l}</div>
          ))}
        </div>
      )}
    </div>
  )
}
