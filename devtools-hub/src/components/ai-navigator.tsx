import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, X, ExternalLink, Bot, Zap, Star, ChevronRight, Home, Sun, Moon } from 'lucide-react';
import { categories, type AITool } from '@/data/ai-tools';

// 获取当前主题
function useTheme() {
  const [isDark, setIsDark] = useState(() => {
    const theme = localStorage.getItem('devtools-theme');
    return theme === 'light' ? false : true;
  });

  useEffect(() => {
    // 初始化时同步 localStorage 到 DOM
    const theme = isDark ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('devtools-theme', theme);
  }, [isDark]);

  // 监听其他页面修改主题
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

// 工具卡片组件
function ToolCard({ tool, index }: { tool: AITool; index: number }) {
  const colors = [
    'from-red-500/20 to-orange-500/20 border-red-500/30 hover:border-red-500/50',
    'from-orange-500/20 to-amber-500/20 border-orange-500/30 hover:border-orange-500/50',
    'from-amber-500/20 to-yellow-500/20 border-amber-500/30 hover:border-amber-500/50',
    'from-green-500/20 to-emerald-500/20 border-green-500/30 hover:border-green-500/50',
    'from-emerald-500/20 to-teal-500/20 border-emerald-500/30 hover:border-emerald-500/50',
    'from-teal-500/20 to-cyan-500/20 border-teal-500/30 hover:border-teal-500/50',
    'from-cyan-500/20 to-sky-500/20 border-cyan-500/30 hover:border-cyan-500/50',
    'from-blue-500/20 to-indigo-500/20 border-blue-500/30 hover:border-blue-500/50',
    'from-indigo-500/20 to-violet-500/20 border-indigo-500/30 hover:border-indigo-500/50',
    'from-violet-500/20 to-purple-500/20 border-violet-500/30 hover:border-violet-500/50',
    'from-purple-500/20 to-fuchsia-500/20 border-purple-500/30 hover:border-purple-500/50',
    'from-pink-500/20 to-rose-500/20 border-pink-500/30 hover:border-pink-500/50',
  ];
  const colorClass = colors[index % colors.length];

  return (
    <a
      href={tool.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`group relative flex flex-col p-4 rounded-xl bg-gradient-to-br ${colorClass} border transition-all duration-200 hover:scale-[1.02] hover:shadow-lg`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-primary mb-1 truncate group-hover:text-emerald-400 transition-colors">
            {tool.name}
          </h3>
          <p className="text-xs text-subtle line-clamp-2">
            {tool.description}
          </p>
        </div>
        <ExternalLink className="w-4 h-4 text-subtle opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
      </div>
      <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
        AI
      </div>
    </a>
  );
}

// 分类区块组件
function CategorySection({ category, startIndex }: { category: typeof categories[0]; startIndex: number }) {
  const Icon = category.icon;

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
          <Icon className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-primary">{category.name}</h3>
          <p className="text-xs text-subtle">共 {category.tools.length} 个工具</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {category.tools.map((tool, index) => (
          <ToolCard key={`${category.id}-${index}`} tool={tool} index={startIndex + index} />
        ))}
      </div>
    </div>
  );
}

// AI 导航主组件
export function AINavigator() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { isDark, toggleTheme } = useTheme();

  // 每次进入页面时滚动到顶部
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const filteredTools = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return null;

    const results: { tool: AITool; categoryName: string }[] = [];
    categories.forEach(category => {
      category.tools.forEach(tool => {
        if (
          tool.name.toLowerCase().includes(query) ||
          tool.description.toLowerCase().includes(query)
        ) {
          results.push({ tool, categoryName: category.name });
        }
      });
    });
    return results;
  }, [searchQuery]);

  const displayedCategories = useMemo(() => {
    if (activeCategory === 'all') return categories;
    return categories.filter(cat => cat.id === activeCategory);
  }, [activeCategory]);

  const toolCount = categories.reduce((acc, cat) => acc + cat.tools.length, 0);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="relative p-6 border-b border-border bg-gradient-to-r from-emerald-500/10 via-transparent to-blue-500/10">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl bg-emerald-500/10" />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full blur-3xl bg-blue-500/10" />
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
          
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary hover:bg-accent transition-colors"
          >
            {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-muted" />}
          </button>
        </div>
        
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Bot className="w-6 h-6 text-gray-900 dark:text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-primary">AI 导航黄页</h1>
              <p className="text-sm text-muted">收录全网优质 AI 工具</p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                <Bot className="w-4 h-4 text-amber-400" />
              </div>
              <span className="text-lg font-bold text-primary">{toolCount}+</span>
              <span className="text-xs text-muted">AI 工具</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
                <Zap className="w-4 h-4 text-blue-400" />
              </div>
              <span className="text-lg font-bold text-primary">20</span>
              <span className="text-xs text-muted">功能分类</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
                <Star className="w-4 h-4 text-purple-400" />
              </div>
              <span className="text-xs text-muted">持续更新</span>
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
            placeholder="搜索 AI 工具..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-10 py-3 rounded-xl bg-input border border-border text-primary placeholder:text-muted focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-colors"
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
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeCategory === 'all'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-secondary text-secondary-foreground hover:bg-accent'
              }`}
            >
              全部工具
            </button>
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    activeCategory === category.id
                      ? 'bg-emerald-500 text-white'
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
        {searchQuery && filteredTools ? (
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
                <p className="text-lg text-muted">未找到匹配的工具</p>
                <p className="text-sm text-muted mt-2">尝试使用其他关键词搜索</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {filteredTools.map((item, index) => (
                  <div key={`search-${index}`} className="relative">
                    <ToolCard tool={item.tool} index={index} />
                    <span className="absolute -top-1 -left-1 px-2 py-0.5 rounded text-[10px] font-medium bg-secondary text-muted border border-border">
                      {item.categoryName}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          displayedCategories.map((category, idx) => {
            let startIndex = 0;
            for (let i = 0; i < idx; i++) {
              startIndex += displayedCategories[i].tools.length;
            }
            return (
              <CategorySection
                key={category.id}
                category={category}
                startIndex={startIndex}
              />
            );
          })
        )}
      </div>
      
      {/* Footer */}
      <footer className="p-4 text-center text-sm text-muted border-t border-border mt-8">
        <p>© 2026 AI 导航黄页 · 持续更新中</p>
      </footer>
    </div>
  );
}
