import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Search,
  RefreshCw,
  Download,
  AlertCircle,
  Info,
  Check,
  ArrowLeft,
} from 'lucide-react';

interface Repository {
  name: string;
  tags: string[];
}

interface ImageInfo {
  name: string;
  tag: string;
  size?: string;
  created?: string;
}

// 默认 Registry 地址
const DEFAULT_REGISTRY = 'http://110.42.247.238';

export function RegistryViewer() {
  const navigate = useNavigate();
  const [registryUrl, setRegistryUrl] = useState(DEFAULT_REGISTRY);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);
  const [images, setImages] = useState<ImageInfo[]>([]);
  const [activeTab, setActiveTab] = useState<'repos' | 'images'>('repos');
  const [copied, setCopied] = useState<string | null>(null);

  // 加载仓库列表
  const loadRepositories = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${registryUrl}/v2/_catalog`);
      if (!response.ok) throw new Error('无法连接到镜像仓库');

      const data = await response.json();
      const repoNames = data.repositories || [];

      // 加载每个仓库的标签
      const reposWithTags: Repository[] = await Promise.all(
        repoNames.map(async (name: string) => {
          try {
            const tagsResponse = await fetch(`${registryUrl}/v2/${name}/tags/list`);
            if (!tagsResponse.ok) return { name, tags: [] };
            const tagsData = await tagsResponse.json();
            return { name, tags: tagsData.tags || [] };
          } catch {
            return { name, tags: [] };
          }
        })
      );

      setRepositories(reposWithTags);
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setLoading(false);
    }
  };

  // 查看仓库镜像
  const viewRepository = (repo: string) => {
    const repoData = repositories.find(r => r.name === repo);
    if (repoData) {
      setImages(repoData.tags.map(tag => ({
        name: repo,
        tag
      })));
      setSelectedRepo(repo);
      setActiveTab('images');
    }
  };

  // 复制拉取命令
  const copyPullCommand = (image: ImageInfo) => {
    const command = `docker pull ${registryUrl.replace(/^https?:\/\//, '')}/${image.name}:${image.tag}`;
    navigator.clipboard.writeText(command).then(() => {
      setCopied(`${image.name}:${image.tag}`);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  // 初始化加载
  useEffect(() => {
    loadRepositories();
  }, [registryUrl]);

  // 过滤仓库
  const filteredRepos = repositories.filter(repo =>
    repo.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-slate-200 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 头部 */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-slate-400" />
            </button>
            <div className="flex items-center gap-3">
              <Box className="w-8 h-8 text-emerald-400" />
              <h1 className="text-3xl font-bold text-white">Docker Registry 管理</h1>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[300px]">
              <label className="block text-sm text-slate-400 mb-2">Registry 地址</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={registryUrl}
                  onChange={(e) => setRegistryUrl(e.target.value)}
                  className="flex-1 px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 focus:outline-none focus:border-emerald-500"
                  placeholder="http://localhost:5000"
                />
                <button
                  onClick={loadRepositories}
                  disabled={loading}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  刷新
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-4 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <span className="text-red-300">{error}</span>
            </div>
          )}
        </div>

        {/* 标签页 */}
        <div className="flex gap-1 mb-6 border-b border-slate-700">
          <button
            onClick={() => setActiveTab('repos')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'repos'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            仓库列表
          </button>
          {selectedRepo && (
            <button
              onClick={() => setActiveTab('images')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'images'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              镜像: {selectedRepo}
            </button>
          )}
        </div>

        {/* 仓库列表 */}
        {activeTab === 'repos' && (
          <div>
            <div className="flex gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 focus:outline-none focus:border-emerald-500"
                  placeholder="搜索仓库..."
                />
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <RefreshCw className="w-8 h-8 text-slate-500 animate-spin mb-4" />
                <p className="text-slate-400">加载中...</p>
              </div>
            ) : filteredRepos.length > 0 ? (
              <div className="grid gap-4">
                {filteredRepos.map((repo) => (
                  <div
                    key={repo.name}
                    onClick={() => viewRepository(repo.name)}
                    className="p-4 rounded-xl bg-slate-800 border border-slate-700 hover:border-emerald-500/50 hover:bg-slate-800/80 transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-1">{repo.name}</h3>
                        <p className="text-sm text-slate-400">
                          {repo.tags.length} 个标签
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {repo.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 max-w-[300px]">
                            {repo.tags.slice(0, 5).map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-1 text-xs rounded-full bg-slate-700 text-slate-300"
                              >
                                {tag}
                              </span>
                            ))}
                            {repo.tags.length > 5 && (
                              <span className="px-2 py-1 text-xs rounded-full bg-slate-700 text-slate-400">
                                +{repo.tags.length - 5}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20">
                <Box className="w-12 h-12 text-slate-600 mb-4" />
                <p className="text-slate-400">没有找到仓库</p>
              </div>
            )}
          </div>
        )}

        {/* 镜像列表 */}
        {activeTab === 'images' && selectedRepo && (
          <div>
            <div className="mb-4 flex items-center gap-2">
              <button
                onClick={() => setActiveTab('repos')}
                className="text-slate-400 hover:text-white transition-colors"
              >
                ← 返回仓库列表
              </button>
            </div>

            {images.length > 0 ? (
              <div className="grid gap-4">
                {images.map((image) => (
                  <div
                    key={`${image.name}:${image.tag}`}
                    className="p-4 rounded-xl bg-slate-800 border border-slate-700"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          {image.name}:{image.tag}
                        </h3>
                        <p className="text-sm text-slate-400">
                          {`${registryUrl.replace(/^https?:\/\//, '')}/${image.name}:${image.tag}`}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => copyPullCommand(image)}
                          className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                            copied === `${image.name}:${image.tag}`
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                          }`}
                          title="复制拉取命令"
                        >
                          {copied === `${image.name}:${image.tag}` ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                          {copied === `${image.name}:${image.tag}` ? '已复制' : '复制'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20">
                <Info className="w-12 h-12 text-slate-600 mb-4" />
                <p className="text-slate-400">该仓库没有镜像标签</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
