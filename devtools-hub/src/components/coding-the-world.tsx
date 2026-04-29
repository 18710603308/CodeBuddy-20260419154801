import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, X, ExternalLink, Globe, Code2, Star, GitFork, 
  Eye, ChevronRight, Home, Sun, Moon, Github, 
  BookOpen, Layers, Sparkles, TrendingUp, Filter, LayoutGrid, List,
  Server, Smartphone, Cog
} from 'lucide-react';

// 开源项目数据
const projects = [
  {
    id: 'react',
    name: 'React',
    description: '用于构建用户界面的 JavaScript 库',
    fullDescription: 'React 是一个用于构建用户界面的 JavaScript 库，由 Facebook 开发并维护。它采用声明式编程范式，让创建交互式 UI 变得简单直观。',
    category: 'frontend',
    language: 'JavaScript',
    languageColor: '#61DAFB',
    stars: 225000,
    forks: 46000,
    owner: 'facebook',
    repo: 'react',
    tags: ['UI库', '组件化', '虚拟DOM'],
    featured: true,
  },
  {
    id: 'vue',
    name: 'Vue.js',
    description: '渐进式 JavaScript 框架',
    fullDescription: 'Vue.js 是一个渐进式 JavaScript 框架，易于学习且功能强大。它可以自底向上逐层应用，适合构建现代单页应用。',
    category: 'frontend',
    language: 'JavaScript',
    languageColor: '#4FC08D',
    stars: 208000,
    forks: 34000,
    owner: 'vuejs',
    repo: 'vue',
    tags: ['框架', '响应式', '渐进式'],
    featured: true,
  },
  {
    id: 'typescript',
    name: 'TypeScript',
    description: 'JavaScript 的超集，添加了类型系统',
    fullDescription: 'TypeScript 是由微软开发的编程语言，是 JavaScript 的超集，添加了可选的静态类型和面向对象编程特性。',
    category: 'frontend',
    language: 'TypeScript',
    languageColor: '#3178C6',
    stars: 101000,
    forks: 14100,
    owner: 'microsoft',
    repo: 'typescript',
    tags: ['类型系统', '编译', 'OOP'],
    featured: true,
  },
  {
    id: 'nextjs',
    name: 'Next.js',
    description: 'React 框架，用于生产环境',
    fullDescription: 'Next.js 是一个基于 React 的全栈框架，提供服务端渲染、静态站点生成等功能，让构建现代 Web 应用变得简单。',
    category: 'frontend',
    language: 'TypeScript',
    languageColor: '#3178C6',
    stars: 126000,
    forks: 27500,
    owner: 'vercel',
    repo: 'next.js',
    tags: ['SSR', '全栈', '静态生成'],
    featured: true,
  },
  {
    id: 'nodejs',
    name: 'Node.js',
    description: '基于 Chrome V8 引擎的 JavaScript 运行时',
    fullDescription: 'Node.js 是一个基于 Chrome V8 引擎的 JavaScript 运行时，允许在服务器端运行 JavaScript 代码。',
    category: 'backend',
    language: 'JavaScript',
    languageColor: '#339933',
    stars: 99000,
    forks: 27000,
    owner: 'nodejs',
    repo: 'node',
    tags: ['后端', '运行时', '异步IO'],
    featured: false,
  },
  {
    id: 'deno',
    name: 'Deno',
    description: '现代的 JavaScript 和 TypeScript 运行时',
    fullDescription: 'Deno 是一个现代的 JavaScript 和 TypeScript 运行时，默认安全，支持 TypeScript，开箱即用。',
    category: 'backend',
    language: 'Rust',
    languageColor: '#DEA584',
    stars: 95000,
    forks: 5300,
    owner: 'denoland',
    repo: 'deno',
    tags: ['运行时', '安全', 'TypeScript'],
    featured: false,
  },
  {
    id: 'bun',
    name: 'Bun',
    description: '快速的 JavaScript 运行时、包管理器和打包工具',
    fullDescription: 'Bun 是一个现代 JavaScript 运行时，比 Node.js 更快，同时包含打包器、转译器、包管理器等功能。',
    category: 'backend',
    language: 'Zig',
    languageColor: '#FBF000',
    stars: 68000,
    forks: 2500,
    owner: 'oven-sh',
    repo: 'bun',
    tags: ['运行时', '打包', '高速'],
    featured: true,
  },
  {
    id: 'go',
    name: 'Go',
    description: 'Google 开发的简单、可靠、高效的编程语言',
    fullDescription: 'Go（又称 Golang）是 Google 开发的一种静态类型、编译型语言，设计目标为高并发、高性能服务器端开发。',
    category: 'backend',
    language: 'Go',
    languageColor: '#00ADD8',
    stars: 115000,
    forks: 17000,
    owner: 'golang',
    repo: 'go',
    tags: ['后端', '并发', '编译型'],
    featured: false,
  },
  {
    id: 'rust',
    name: 'Rust',
    description: '安全、并发、实用的系统编程语言',
    fullDescription: 'Rust 是一种专注于安全性和性能的系统编程语言，无需垃圾回收即可保证内存安全。',
    category: 'backend',
    language: 'Rust',
    languageColor: '#DEA584',
    stars: 98000,
    forks: 14000,
    owner: 'rust-lang',
    repo: 'rust',
    tags: ['系统编程', '内存安全', '并发'],
    featured: false,
  },
  {
    id: 'tailwindcss',
    name: 'Tailwind CSS',
    description: '实用优先的 CSS 框架',
    fullDescription: 'Tailwind CSS 是一个实用优先的 CSS 框架，通过组合小粒度类名来构建现代化设计。',
    category: 'frontend',
    language: 'JavaScript',
    languageColor: '#06B6D4',
    stars: 78000,
    forks: 4400,
    owner: 'tailwindlabs',
    repo: 'tailwindcss',
    tags: ['CSS框架', '实用优先', '响应式'],
    featured: false,
  },
  {
    id: 'vite',
    name: 'Vite',
    description: '下一代前端构建工具',
    fullDescription: 'Vite 是一个由原生 ESM 驱动的下一代前端构建工具，快速的热更新和即时编译让开发体验大幅提升。',
    category: 'tool',
    language: 'TypeScript',
    languageColor: '#3178C6',
    stars: 65000,
    forks: 5700,
    owner: 'vitejs',
    repo: 'vite',
    tags: ['构建工具', 'HMR', 'ESM'],
    featured: true,
  },
  {
    id: 'docker',
    name: 'Docker',
    description: '容器化平台，让应用打包和部署更简单',
    fullDescription: 'Docker 是一个开源的容器化平台，让开发者可以将应用及其依赖打包到容器中，实现一致的运行环境。',
    category: 'tool',
    language: 'Go',
    languageColor: '#2496ED',
    stars: 63000,
    forks: 19000,
    owner: 'moby',
    repo: 'moby',
    tags: ['容器', 'DevOps', '部署'],
    featured: false,
  },
  {
    id: 'kubernetes',
    name: 'Kubernetes',
    description: '容器编排平台',
    fullDescription: 'Kubernetes 是一个开源的容器编排平台，用于自动化容器化应用的部署、扩缩和管理。',
    category: 'tool',
    language: 'Go',
    languageColor: '#326CE5',
    stars: 110000,
    forks: 39000,
    owner: 'kubernetes',
    repo: 'kubernetes',
    tags: ['容器编排', '微服务', '云原生'],
    featured: true,
  },
  {
    id: 'prisma',
    name: 'Prisma',
    description: '下一代 Node.js 和 TypeScript ORM',
    fullDescription: 'Prisma 是一个现代化的数据库工具链，提供类型安全的数据库访问、迁移管理等功能。',
    category: 'tool',
    language: 'TypeScript',
    languageColor: '#3178C6',
    stars: 36000,
    forks: 2500,
    owner: 'prisma',
    repo: 'prisma',
    tags: ['ORM', '数据库', 'TypeScript'],
    featured: false,
  },
  {
    id: 'electron',
    name: 'Electron',
    description: '使用 JavaScript、HTML 和 CSS 构建跨平台桌面应用',
    fullDescription: 'Electron 是一个使用 Web 技术栈（JavaScript、HTML、CSS）构建跨平台桌面应用的框架。',
    category: 'tool',
    language: 'C++',
    languageColor: '#47848F',
    stars: 112000,
    forks: 15500,
    owner: 'electron',
    repo: 'electron',
    tags: ['桌面应用', '跨平台', 'Web技术'],
    featured: false,
  },
  {
    id: 'neovim',
    name: 'Neovim',
    description: 'hyperextensible Vim 编辑器',
    fullDescription: 'Neovim 是一个基于 Vim 的现代化重构版本，支持异步、插件化设计、Lua 配置等现代特性。',
    category: 'tool',
    language: 'Lua',
    languageColor: '#57A8FF',
    stars: 68000,
    forks: 4500,
    owner: 'neovim',
    repo: 'neovim',
    tags: ['编辑器', 'Vim', '可扩展'],
    featured: false,
  },
  {
    id: 'fastapi',
    name: 'FastAPI',
    description: '现代、快速的 Python Web 框架',
    fullDescription: 'FastAPI 是一个现代、快速的 Python Web 框架，基于标准 Python 类型提示，支持自动文档生成。',
    category: 'backend',
    language: 'Python',
    languageColor: '#3776AB',
    stars: 76000,
    forks: 7100,
    owner: 'tiangolo',
    repo: 'fastapi',
    tags: ['Python', 'Web框架', '异步'],
    featured: false,
  },
  {
    id: 'django',
    name: 'Django',
    description: '高级 Python Web 框架',
    fullDescription: 'Django 是一个高级 Python Web 框架，鼓励快速开发和简洁实用的设计。',
    category: 'backend',
    language: 'Python',
    languageColor: '#3776AB',
    stars: 78000,
    forks: 35000,
    owner: 'django',
    repo: 'django',
    tags: ['Python', 'Web框架', 'MTV'],
    featured: false,
  },
  {
    id: 'flutter',
    name: 'Flutter',
    description: 'Google 的跨平台 UI 工具包',
    fullDescription: 'Flutter 是 Google 开发的跨平台 UI 工具包，可从单一代码库为 iOS、Android、Web 和桌面构建原生编译应用。',
    category: 'mobile',
    language: 'Dart',
    languageColor: '#02569B',
    stars: 166000,
    forks: 28000,
    owner: 'flutter',
    repo: 'flutter',
    tags: ['跨平台', 'UI', '移动开发'],
    featured: true,
  },
  {
    id: 'reactnative',
    name: 'React Native',
    description: '使用 React 构建原生移动应用',
    fullDescription: 'React Native 让你使用 JavaScript 和 React 开发真正的原生移动应用，同时支持 iOS 和 Android。',
    category: 'mobile',
    language: 'JavaScript',
    languageColor: '#61DAFB',
    stars: 116000,
    forks: 23500,
    owner: 'facebook',
    repo: 'react-native',
    tags: ['移动开发', 'React', '原生应用'],
    featured: false,
  },
  {
    id: 'expo',
    name: 'Expo',
    description: 'React Native 的框架和平台',
    fullDescription: 'Expo 是一个基于 React Native 的开发和部署工具，提供丰富的原生 API 和快速构建体验。',
    category: 'mobile',
    language: 'TypeScript',
    languageColor: '#3178C6',
    stars: 25000,
    forks: 4200,
    owner: 'expo',
    repo: 'expo',
    tags: ['React Native', '开发工具', '原生模块'],
    featured: false,
  },
  {
    id: 'pytorch',
    name: 'PyTorch',
    description: 'Python 优先的深度学习框架',
    fullDescription: 'PyTorch 是一个开源的深度学习框架，以其动态计算图和易用性在研究领域广受欢迎。',
    category: 'ai',
    language: 'Python',
    languageColor: '#EE4C2C',
    stars: 85000,
    forks: 23000,
    owner: 'pytorch',
    repo: 'pytorch',
    tags: ['深度学习', 'AI', '机器学习'],
    featured: true,
  },
  {
    id: 'tensorflow',
    name: 'TensorFlow',
    description: '端到端开源机器学习平台',
    fullDescription: 'TensorFlow 是一个端到端开源机器学习平台，提供全面的工具、库和社区资源。',
    category: 'ai',
    language: 'Python',
    languageColor: '#FF6F00',
    stars: 182000,
    forks: 89000,
    owner: 'tensorflow',
    repo: 'tensorflow',
    tags: ['机器学习', '深度学习', 'AI'],
    featured: true,
  },
  {
    id: 'langchain',
    name: 'LangChain',
    description: '使用语言模型构建应用的框架',
    fullDescription: 'LangChain 是一个用于开发由语言模型驱动的应用程序的框架，支持Agents、Memory、Chains等功能。',
    category: 'ai',
    language: 'Python',
    languageColor: '#2ECC71',
    stars: 88000,
    forks: 11000,
    owner: 'langchain-ai',
    repo: 'langchain',
    tags: ['LLM', 'AI应用', 'Agents'],
    featured: true,
  },
  {
    id: 'stable-diffusion',
    name: 'Stable Diffusion',
    description: '文本到图像的潜在扩散模型',
    fullDescription: 'Stable Diffusion 是一个开源的文本到图像生成模型，可以根据文本描述生成高质量图像。',
    category: 'ai',
    language: 'Python',
    languageColor: '#9B59B6',
    stars: 68000,
    forks: 12500,
    owner: 'CompVis',
    repo: 'stable-diffusion',
    tags: ['图像生成', 'AIGC', '扩散模型'],
    featured: true,
  },
];

const categories = [
  { id: 'all', name: '全部', icon: Layers, color: 'from-slate-500 to-gray-600' },
  { id: 'frontend', name: '前端', icon: LayoutGrid, color: 'from-blue-500 to-indigo-600' },
  { id: 'backend', name: '后端', icon: Server, color: 'from-emerald-500 to-teal-600' },
  { id: 'tool', name: '工具', icon: Cog, color: 'from-orange-500 to-amber-600' },
  { id: 'mobile', name: '移动开发', icon: Smartphone, color: 'from-violet-500 to-purple-600' },
  { id: 'ai', name: 'AI/ML', icon: Sparkles, color: 'from-pink-500 to-rose-600' },
];

// 格式化数字
function formatNumber(num: number): string {
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toString();
}

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

// 项目卡片组件
function ProjectCard({ project, viewMode }: { project: typeof projects[0]; viewMode: 'grid' | 'list' }) {
  const colors = [
    'from-blue-500/20 to-indigo-500/20 border-blue-500/30 hover:border-blue-500/50',
    'from-emerald-500/20 to-teal-500/20 border-emerald-500/30 hover:border-emerald-500/50',
    'from-orange-500/20 to-amber-500/20 border-orange-500/30 hover:border-orange-500/50',
    'from-violet-500/20 to-purple-500/20 border-violet-500/30 hover:border-violet-500/50',
    'from-pink-500/20 to-rose-500/20 border-pink-500/30 hover:border-pink-500/50',
    'from-cyan-500/20 to-sky-500/20 border-cyan-500/30 hover:border-cyan-500/50',
  ];
  const colorClass = colors[projects.findIndex(p => p.id === project.id) % colors.length];

  const url = `https://github.com/${project.owner}/${project.repo}`;

  if (viewMode === 'list') {
    return (
      <div className={`group relative flex items-center gap-4 p-4 rounded-xl bg-gradient-to-br ${colorClass} border transition-all duration-200 hover:scale-[1.01] hover:shadow-lg`}>
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-500/20 to-gray-600/20 border border-slate-500/30 flex items-center justify-center shrink-0">
          <Github className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-primary truncate group-hover:text-emerald-400 transition-colors">
              {project.name}
            </h3>
            <span 
              style={{ backgroundColor: `${project.languageColor}20`, color: project.languageColor, borderColor: `${project.languageColor}40` }}
              className="px-2 py-0.5 rounded text-[10px] font-medium"
            >
              {project.language}
            </span>
          </div>
          <p className="text-xs text-subtle line-clamp-1">{project.description}</p>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-1 text-sm text-subtle">
            <Star className="w-4 h-4 text-amber-500" />
            {formatNumber(project.stars)}
          </div>
          <div className="flex items-center gap-1 text-sm text-subtle">
            <GitFork className="w-4 h-4 text-blue-500" />
            {formatNumber(project.forks)}
          </div>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg bg-secondary hover:bg-accent transition-colors"
          >
            <ExternalLink className="w-4 h-4 text-subtle" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={`group relative p-4 rounded-xl bg-gradient-to-br ${colorClass} border transition-all duration-200 hover:scale-[1.02] hover:shadow-lg`}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-500/20 to-gray-600/20 border border-slate-500/30 flex items-center justify-center">
          <Github className="w-5 h-5 text-primary" />
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 rounded-lg bg-secondary/50 hover:bg-accent transition-colors opacity-0 group-hover:opacity-100"
        >
          <ExternalLink className="w-4 h-4 text-subtle" />
        </a>
      </div>
      <h3 className="font-semibold text-primary mb-1 group-hover:text-emerald-400 transition-colors">
        {project.name}
      </h3>
      <p className="text-xs text-subtle line-clamp-2 mb-3">
        {project.description}
      </p>
      <div className="flex items-center gap-2 mb-3">
        <span 
          className="px-2 py-0.5 rounded text-[10px] font-medium"
          style={{ backgroundColor: `${project.languageColor}20`, color: project.languageColor }}
        >
          {project.language}
        </span>
      </div>
      <div className="flex items-center gap-3 text-xs text-subtle">
        <div className="flex items-center gap-1">
          <Star className="w-3 h-3 text-amber-500" />
          {formatNumber(project.stars)}
        </div>
        <div className="flex items-center gap-1">
          <GitFork className="w-3 h-3 text-blue-500" />
          {formatNumber(project.forks)}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1">
        {project.tags.slice(0, 3).map((tag) => (
          <span key={tag} className="px-2 py-0.5 rounded text-[10px] bg-secondary text-subtle">
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

// 精选项目组件
function FeaturedSection({ featuredProjects }: { featuredProjects: typeof projects }) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
          <Star className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-primary">精选项目</h3>
          <p className="text-xs text-subtle">热门开源项目推荐</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {featuredProjects.map((project) => (
          <ProjectCard key={project.id} project={project} viewMode="grid" />
        ))}
      </div>
    </div>
  );
}

// 分类区块组件
function CategorySection({ category, projects: categoryProjects, viewMode }: { 
  category: typeof categories[0]; 
  projects: typeof projects;
  viewMode: 'grid' | 'list';
}) {
  const Icon = category.icon;

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-primary">{category.name}</h3>
          <p className="text-xs text-subtle">共 {categoryProjects.length} 个项目</p>
        </div>
      </div>
      <div className={viewMode === 'grid' 
        ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
        : 'flex flex-col gap-3'
      }>
        {categoryProjects.map((project) => (
          <ProjectCard key={project.id} project={project} viewMode={viewMode} />
        ))}
      </div>
    </div>
  );
}

// Coding The World 主组件
export function CodingTheWorld() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'stars' | 'forks' | 'name'>('stars');
  const { isDark, toggleTheme } = useTheme();

  // 每次进入页面时滚动到顶部
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // 搜索过滤
  const filteredProjects = useMemo(() => {
    let result = projects;
    
    // 分类过滤
    if (activeCategory !== 'all') {
      result = result.filter(p => p.category === activeCategory);
    }
    
    // 搜索过滤
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.tags.some(tag => tag.toLowerCase().includes(query)) ||
        p.language.toLowerCase().includes(query)
      );
    }
    
    // 排序
    result = [...result].sort((a, b) => {
      if (sortBy === 'stars') return b.stars - a.stars;
      if (sortBy === 'forks') return b.forks - a.forks;
      return a.name.localeCompare(b.name);
    });
    
    return result;
  }, [activeCategory, searchQuery, sortBy]);

  // 精选项目
  const featuredProjects = useMemo(() => {
    return projects.filter(p => p.featured).sort((a, b) => b.stars - a.stars);
  }, []);

  // 分类后的项目
  const categorizedProjects = useMemo(() => {
    if (activeCategory === 'all') {
      return categories.filter(c => c.id !== 'all').map(cat => ({
        category: cat,
        projects: filteredProjects.filter(p => p.category === cat.id)
      })).filter(group => group.projects.length > 0);
    }
    return [{
      category: categories.find(c => c.id === activeCategory)!,
      projects: filteredProjects
    }];
  }, [activeCategory, filteredProjects]);

  const projectCount = projects.length;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="relative p-6 border-b border-border bg-gradient-to-r from-blue-500/10 via-transparent to-purple-500/10">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl bg-blue-500/10" />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full blur-3xl bg-purple-500/10" />
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
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Code2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-primary">Coding The World</h1>
              <p className="text-sm text-muted">探索优质开源项目</p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-blue-400" />
              </div>
              <span className="text-lg font-bold text-primary">{projectCount}+</span>
              <span className="text-xs text-muted">开源项目</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-lg font-bold text-primary">{featuredProjects.length}</span>
              <span className="text-xs text-muted">精选项目</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
                <Globe className="w-4 h-4 text-purple-400" />
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
            placeholder="搜索项目、标签或语言..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-10 py-3 rounded-xl bg-input border border-border text-primary placeholder:text-muted focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors"
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

        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Category Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin flex-1">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    activeCategory === category.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-secondary text-secondary-foreground hover:bg-accent'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {category.name}
                </button>
              );
            })}
          </div>

          {/* View Mode & Sort */}
          <div className="flex items-center gap-2 shrink-0">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 rounded-lg bg-secondary border border-border text-primary text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="stars">按 Star 排序</option>
              <option value="forks">按 Fork 排序</option>
              <option value="name">按名称排序</option>
            </select>
            <div className="flex gap-1 bg-secondary rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'text-muted hover:text-primary'}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'text-muted hover:text-primary'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
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
                共找到 {filteredProjects.length} 个项目
              </span>
            </div>
            {filteredProjects.length === 0 ? (
              <div className="text-center py-12">
                <Globe className="w-16 h-16 text-muted mx-auto mb-4 opacity-50" />
                <p className="text-lg text-muted">未找到匹配的项目</p>
                <p className="text-sm text-muted mt-2">尝试使用其他关键词搜索</p>
              </div>
            ) : (
              <div className={viewMode === 'grid' 
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
                : 'flex flex-col gap-3'
              }>
                {filteredProjects.map((project) => (
                  <ProjectCard key={project.id} project={project} viewMode={viewMode} />
                ))}
              </div>
            )}
          </div>
        ) : activeCategory === 'all' ? (
          <>
            {/* 精选项目 */}
            <FeaturedSection featuredProjects={featuredProjects.slice(0, 8)} />
            
            {/* 分类项目 */}
            {categorizedProjects.map(({ category, projects: categoryProjects }) => (
              <CategorySection 
                key={category.id} 
                category={category} 
                projects={categoryProjects}
                viewMode={viewMode}
              />
            ))}
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-4">
              <h3 className="text-lg font-semibold text-primary">
                {categories.find(c => c.id === activeCategory)?.name}
              </h3>
              <span className="text-sm text-muted">
                共 {filteredProjects.length} 个项目
              </span>
            </div>
            {filteredProjects.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-lg text-muted">该分类暂无项目</p>
              </div>
            ) : (
              <div className={viewMode === 'grid' 
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
                : 'flex flex-col gap-3'
              }>
                {filteredProjects.map((project) => (
                  <ProjectCard key={project.id} project={project} viewMode={viewMode} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Footer */}
      <footer className="p-4 text-center text-sm text-muted border-t border-border mt-8">
        <p>© 2026 Coding The World · 开源项目导航</p>
      </footer>
    </div>
  );
}
