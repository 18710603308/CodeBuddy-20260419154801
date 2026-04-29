import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, X, ChevronRight, Home, Sun, Moon, 
  Braces, FileCode2, Hash, Terminal, Database, 
  Table2, Type, Code2, Layers, Globe, FileJson,
  FileCode, FileText, Shuffle, TextCursorInput,
  Palette, Clock, Binary, Lock, Cog, Coffee,
  AlertCircle, QrCode, Key, ShieldCheck, Clipboard,
  Wand2, GitCompare, Wifi, WifiOff
} from 'lucide-react';

// 获取当前主题
function useTheme() {
  const [isDark, setIsDark] = useState(() => {
    const theme = localStorage.getItem('devtools-theme');
    return theme === 'light' ? false : true;
  });

  useEffect(() => {
    const theme = isDark ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('devtools-theme', theme);
  }, [isDark]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'devtools-theme') {
        const newTheme = e.newValue;
        if (newTheme) {
          document.documentElement.setAttribute('data-theme', newTheme);
          setIsDark(newTheme === 'dark');
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return { isDark, toggleTheme: () => setIsDark(!isDark) };
}

// 工具接口
interface OfflineTool {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  color: string;
  bgColor: string;
  route: string;
}

// 所有离线工具
const offlineTools: OfflineTool[] = [
  // 核心数据处理
  { id: 'json', icon: Braces, title: 'JSON 格式化', description: '美化、压缩、校验 JSON 数据', color: 'from-amber-500 to-orange-600', bgColor: 'bg-amber-500/10', route: 'json' },
  { id: 'xml', icon: FileCode2, title: 'XML 格式化', description: '美化、压缩、校验 XML 数据', color: 'from-emerald-500 to-teal-600', bgColor: 'bg-emerald-500/10', route: 'xml' },
  { id: 'yaml', icon: FileJson, title: 'YAML 工具', description: 'YAML 解析与格式化', color: 'from-teal-500 to-cyan-600', bgColor: 'bg-teal-500/10', route: 'yaml' },
  { id: 'diff', icon: GitCompare, title: '文本对比', description: '快速比较两段文本差异', color: 'from-blue-500 to-cyan-600', bgColor: 'bg-blue-500/10', route: 'diff' },
  { id: 'sql', icon: Database, title: 'SQL 格式化', description: '美化、压缩、校验 SQL', color: 'from-indigo-500 to-blue-600', bgColor: 'bg-indigo-500/10', route: 'sql' },
  { id: 'csv', icon: Table2, title: 'CSV 工具', description: '解析、转换、导出 CSV', color: 'from-violet-500 to-purple-600', bgColor: 'bg-violet-500/10', route: 'csv' },
  
  // 编码与加密
  { id: 'base64', icon: Terminal, title: 'Base64 编解码', description: '字符串与 Base64 互转', color: 'from-green-500 to-emerald-600', bgColor: 'bg-green-500/10', route: 'base64' },
  { id: 'hash', icon: Hash, title: 'Hash 生成', description: 'MD5、SHA1、SHA256 等加密', color: 'from-purple-500 to-pink-600', bgColor: 'bg-purple-500/10', route: 'hash' },
  { id: 'url', icon: Code2, title: 'URL 编解码', description: 'URL 参数编码与解码', color: 'from-teal-500 to-cyan-600', bgColor: 'bg-teal-500/10', route: 'url' },
  { id: 'unicode', icon: Type, title: 'Unicode 转换', description: '中文与 Unicode 互转', color: 'from-cyan-500 to-sky-600', bgColor: 'bg-cyan-500/10', route: 'unicode' },
  { id: 'jwt', icon: Layers, title: 'JWT 解码', description: '解析 Token 内容和签名', color: 'from-fuchsia-500 to-pink-600', bgColor: 'bg-fuchsia-500/10', route: 'jwt' },
  { id: 'aes', icon: Lock, title: 'AES 加解密', description: 'AES 对称加密解密', color: 'from-red-500 to-rose-600', bgColor: 'bg-red-500/10', route: 'aes' },
  
  // 进制与转换
  { id: 'binary', icon: Binary, title: '进制转换', description: '2/8/10/16 进制互转', color: 'from-orange-500 to-amber-600', bgColor: 'bg-orange-500/10', route: 'binary' },
  { id: 'color', icon: Palette, title: '颜色转换', description: 'RGB/HEX/HSL 互转', color: 'from-pink-500 to-rose-600', bgColor: 'bg-pink-500/10', route: 'color' },
  { id: 'timestamp', icon: Clock, title: '时间戳转换', description: 'Unix 时间戳互转', color: 'from-blue-500 to-indigo-600', bgColor: 'bg-blue-500/10', route: 'timestamp' },
  
  // 文本处理
  { id: 'regex', icon: Type, title: '正则表达式', description: '测试与生成正则模式', color: 'from-cyan-500 to-sky-600', bgColor: 'bg-cyan-500/10', route: 'regex' },
  { id: 'camel', icon: Shuffle, title: '驼峰转换', description: '驼峰/下划线/短横线互转', color: 'from-violet-500 to-purple-600', bgColor: 'bg-violet-500/10', route: 'camel' },
  { id: 'case', icon: TextCursorInput, title: '大小写转换', description: '英文大小写/全角半角', color: 'from-amber-500 to-yellow-600', bgColor: 'bg-amber-500/10', route: 'case' },
  
  // 代码工具
  { id: 'js', icon: Code2, title: 'JS 格式化', description: 'JavaScript 压缩美化', color: 'from-yellow-500 to-amber-600', bgColor: 'bg-yellow-500/10', route: 'js' },
  { id: 'html', icon: FileText, title: 'HTML 格式化', description: 'HTML 标签格式化', color: 'from-orange-500 to-red-600', bgColor: 'bg-orange-500/10', route: 'html' },
  { id: 'css', icon: Palette, title: 'CSS 格式化', description: 'CSS 代码格式化', color: 'from-blue-500 to-cyan-600', bgColor: 'bg-blue-500/10', route: 'css' },
  { id: 'codemirror', icon: Code2, title: '代码编辑器', description: '支持多语言的代码编辑器', color: 'from-sky-500 to-blue-600', bgColor: 'bg-sky-500/10', route: 'codemirror' },
  { id: 'codemerge', icon: GitCompare, title: '代码合并对比', description: 'CodeMirror 代码合并与对比工具', color: 'from-violet-500 to-purple-600', bgColor: 'bg-violet-500/10', route: 'codemerge' },
  
  // 语言编辑器
  { id: 'js-editor', icon: Braces, title: 'JavaScript', description: 'JavaScript 代码编辑器', color: 'from-yellow-500 to-amber-600', bgColor: 'bg-yellow-500/10', route: 'js-editor' },
  { id: 'ts-editor', icon: FileCode, title: 'TypeScript', description: 'TypeScript 代码编辑器', color: 'from-blue-500 to-indigo-600', bgColor: 'bg-blue-500/10', route: 'ts-editor' },
  { id: 'py-editor', icon: FileJson, title: 'Python', description: 'Python 代码编辑器', color: 'from-green-500 to-emerald-600', bgColor: 'bg-green-500/10', route: 'py-editor' },
  { id: 'java-editor', icon: Coffee, title: 'Java', description: 'Java 代码编辑器', color: 'from-orange-500 to-red-600', bgColor: 'bg-orange-500/10', route: 'java-editor' },
  { id: 'cpp-editor', icon: Binary, title: 'C++', description: 'C++ 代码编辑器', color: 'from-blue-600 to-cyan-600', bgColor: 'bg-blue-600/10', route: 'cpp-editor' },
  { id: 'rust-editor', icon: Cog, title: 'Rust', description: 'Rust 代码编辑器', color: 'from-orange-600 to-red-700', bgColor: 'bg-orange-600/10', route: 'rust-editor' },
  { id: 'go-editor', icon: Terminal, title: 'Go', description: 'Go 代码编辑器', color: 'from-cyan-500 to-teal-600', bgColor: 'bg-cyan-500/10', route: 'go-editor' },
  { id: 'php-editor', icon: FileCode, title: 'PHP', description: 'PHP 代码编辑器', color: 'from-indigo-500 to-purple-600', bgColor: 'bg-indigo-500/10', route: 'php-editor' },
  { id: 'md-editor', icon: FileText, title: 'Markdown', description: 'Markdown 编辑器', color: 'from-slate-500 to-gray-600', bgColor: 'bg-slate-500/10', route: 'md-editor' },
  { id: 'codesearch', icon: Search, title: '代码搜索', description: 'CodeMirror 高级搜索替换', color: 'from-teal-500 to-emerald-600', bgColor: 'bg-teal-500/10', route: 'codesearch' },
  { id: 'codelint', icon: AlertCircle, title: '代码检查', description: '代码语法检查与提示', color: 'from-red-500 to-rose-600', bgColor: 'bg-red-500/10', route: 'codelint' },
  
  // 实用工具
  { id: 'mock', icon: Wand2, title: 'Mock 数据', description: '生成模拟 JSON 数据', color: 'from-orange-500 to-amber-600', bgColor: 'bg-orange-500/10', route: 'mock' },
  { id: 'qrcode', icon: QrCode, title: '二维码生成', description: '生成和解析二维码', color: 'from-teal-500 to-emerald-600', bgColor: 'bg-teal-500/10', route: 'qrcode' },
  { id: 'uuid', icon: Key, title: 'UUID 生成', description: '生成唯一标识符', color: 'from-purple-500 to-violet-600', bgColor: 'bg-purple-500/10', route: 'uuid' },
  { id: 'password', icon: ShieldCheck, title: '密码生成器', description: '随机安全密码生成', color: 'from-green-500 to-emerald-600', bgColor: 'bg-green-500/10', route: 'password' },
  { id: 'clipboard', icon: Clipboard, title: '剪贴板工具', description: '历史记录与快速粘贴', color: 'from-rose-500 to-red-600', bgColor: 'bg-rose-500/10', route: 'clipboard' },
];

// 分类
const categories = [
  { id: 'all', name: '全部工具', icon: Wifi },
  { id: 'data', name: '数据处理', icon: Database },
  { id: 'encoding', name: '编码加密', icon: Lock },
  { id: 'convert', name: '格式转换', icon: Shuffle },
  { id: 'text', name: '文本处理', icon: Type },
  { id: 'code', name: '代码工具', icon: Code2 },
  { id: 'editor', name: '语言编辑器', icon: Terminal },
  { id: 'utility', name: '实用工具', icon: Cog },
];

// 工具卡片组件
function ToolCard({ tool }: { tool: OfflineTool }) {
  const Icon = tool.icon;
  
  const handleClick = () => {
    // 跳转到首页并选中对应工具
    window.location.href = `/?tool=${tool.route}`;
  };
  
  return (
    <button
      onClick={handleClick}
      className="group relative p-5 rounded-xl bg-secondary/80 border border-secondary hover:border-primary backdrop-blur-xl transition-all hover:scale-[1.02] hover:shadow-lg text-left w-full"
    >
      <div className={`w-10 h-10 rounded-lg ${tool.bgColor} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
        <Icon className={`w-5 h-5 bg-gradient-to-br ${tool.color} bg-clip-text`} />
      </div>
      <h3 className="text-sm font-semibold mb-1 text-primary group-hover:text-orange-400 transition-colors">
        {tool.title}
      </h3>
      <p className="text-xs text-subtle line-clamp-2">
        {tool.description}
      </p>
    </button>
  );
}

// 离线工具主组件
export function OfflineTools() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { isDark, toggleTheme } = useTheme();

  // 每次进入页面时滚动到顶部
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // 过滤工具
  const filteredTools = useMemo(() => {
    let result = offlineTools;
    
    // 分类过滤
    if (activeCategory !== 'all') {
      const categoryIds: Record<string, string[]> = {
        'data': ['json', 'xml', 'yaml', 'diff', 'sql', 'csv'],
        'encoding': ['base64', 'hash', 'url', 'unicode', 'jwt', 'aes'],
        'convert': ['binary', 'color', 'timestamp'],
        'text': ['regex', 'camel', 'case'],
        'code': ['js', 'html', 'css', 'codemirror', 'codemerge', 'codesearch', 'codelint'],
        'editor': ['js-editor', 'ts-editor', 'py-editor', 'java-editor', 'cpp-editor', 'rust-editor', 'go-editor', 'php-editor', 'md-editor'],
        'utility': ['mock', 'qrcode', 'uuid', 'password', 'clipboard'],
      };
      const ids = categoryIds[activeCategory] || [];
      result = result.filter(t => ids.includes(t.id));
    }
    
    // 搜索过滤
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(t => 
        t.title.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query)
      );
    }
    
    return result;
  }, [activeCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="relative p-6 border-b border-border bg-gradient-to-r from-orange-500/10 via-transparent to-amber-500/10">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl bg-orange-500/10" />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full blur-3xl bg-amber-500/10" />
        </div>
        
        {/* Navigation */}
        <div className="flex items-center justify-between mb-4">
          <Link 
            to="/" 
            className="flex items-center gap-2 text-muted hover:text-primary transition-colors"
          >
            <ChevronRight className="w-5 h-5 rotate-180" />
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">返回首页</span>
          </Link>
          
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary hover:bg-accent transition-colors"
          >
            {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-muted" />}
          </button>
        </div>
        
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <WifiOff className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-primary">离线工具</h1>
              <p className="text-sm text-muted">无需网络，即开即用</p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center">
                <Cog className="w-4 h-4 text-orange-400" />
              </div>
              <span className="text-lg font-bold text-primary">{offlineTools.length}</span>
              <span className="text-xs text-muted">开发工具</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                <WifiOff className="w-4 h-4 text-amber-400" />
              </div>
              <span className="text-xs text-muted">完全离线运行</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="p-4 border-b border-border bg-secondary/50">
        <div className="relative mb-3 max-w-7xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
          <input
            type="text"
            placeholder="搜索工具..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-10 py-3 rounded-xl bg-input border border-border text-primary placeholder:text-muted focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-tertiary transition-colors"
            >
              <X className="w-4 h-4 text-muted" />
            </button>
          )}
        </div>

        {/* Category Tabs */}
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    activeCategory === category.id
                      ? 'bg-orange-500 text-white'
                      : 'bg-secondary text-secondary-foreground hover:bg-accent'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {category.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-4">
        {searchQuery ? (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <h3 className="text-lg font-semibold text-primary">
                搜索结果: &quot;{searchQuery}&quot;
              </h3>
              <span className="text-sm text-muted">
                共找到 {filteredTools.length} 个工具
              </span>
            </div>
            {filteredTools.length === 0 ? (
              <div className="text-center py-12">
                <Cog className="w-16 h-16 text-muted mx-auto mb-4 opacity-50" />
                <p className="text-lg text-muted">未找到匹配的工具</p>
                <p className="text-sm text-muted mt-2">尝试使用其他关键词搜索</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {filteredTools.map((tool) => (
                  <ToolCard key={tool.id} tool={tool} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {filteredTools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        )}
      </div>
      
      {/* Footer */}
      <footer className="p-4 text-center text-sm text-muted border-t border-border mt-8">
        <p>© 2026 离线工具 · 无需网络，即开即用</p>
      </footer>
    </div>
  );
}
