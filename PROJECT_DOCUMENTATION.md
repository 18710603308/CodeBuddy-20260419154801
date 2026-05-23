# DevTools Hub 项目文档

> 本文档由 AI 辅助梳理生成，建议每次项目变更后同步更新。
> 生成时间：2026-05-21

---

## 1. 项目概述

**DevTools Hub** 是一个集开发者工具、经典游戏、AI 导航于一体的综合性前端应用。项目采用 React + Vite + TypeScript + Tailwind CSS 技术栈构建，支持暗色/亮色主题，并包含丰富的功能模块。

**线上地址**: https://110.42.247.238

### 核心功能模块

| 模块 | 说明 |
|------|------|
| **AI 导航黄页** | 收录全网优质 AI 工具的导航页 |
| **Coding The World** | 探索优质开源项目 |
| **经典游戏** | FC/街机/GBA 模拟器（魂斗罗、坦克大战、超级马里奥等） |
| **休闲游戏** | 连连看、蜘蛛纸牌、扫雷、2048 |
| **离线工具** | 40+ 开发工具，无需网络 |
| **DevOps 管理** | 可视化部署与运维管理平台 |
| **镜像管理** | 私有 Docker Registry 可视化管理 |

---

## 2. 项目结构

```
20260419154801/                              # 项目根目录
├── devtools-hub/                            # 前端应用主目录
│   ├── src/
│   │   ├── components/                        # React 组件
│   │   │   ├── App.tsx                        # 主应用组件（工具集合）
│   │   │   ├── ai-navigator.tsx               # AI 导航黄页
│   │   │   ├── coding-the-world.tsx           # 开源项目探索
│   │   │   ├── game.tsx / game-collection.tsx # 游戏相关
│   │   │   ├── retro-games.tsx                # 复古游戏
│   │   │   ├── offline-tools.tsx              # 离线工具
│   │   │   ├── DevOpsPipeline.tsx             # DevOps 流水线管理
│   │   │   ├── registry-viewer.tsx            # 镜像仓库管理
│   │   │   ├── SpeechRecognition.tsx          # 语音识别
│   │   │   ├── ImageManager.tsx               # 图片管理
│   │   │   └── ...                            # 其他组件
│   │   ├── data/
│   │   │   └── ai-tools.ts                    # AI 工具数据源
│   │   ├── hooks/
│   │   │   └── use-mobile.ts                  # 移动端检测 Hook
│   │   ├── icons/                             # 图标资源
│   │   ├── lib/
│   │   │   └── utils.ts                       # 工具函数 (cn)
│   │   ├── App.css                            # 全局样式
│   │   ├── index.css                          # Tailwind 入口 + CSS 变量
│   │   ├── main.tsx                           # 应用入口
│   │   └── router.tsx                         # React Router 路由配置
│   ├── public/                                # 静态资源
│   │   ├── baye-fmj/                          # 伏魔记游戏资源
│   │   ├── data/                              # 模拟器数据
│   │   ├── emulatorjs/                        # EmulatorJS 库
│   │   ├── fm/                                # 其他游戏资源
│   │   ├── roms/                              # NES ROM 文件
│   │   └── whisper-server/                    # 语音识别服务端
│   ├── Dockerfile                             # 前端 Docker 镜像构建文件
│   ├── package.json                           # 项目依赖
│   ├── vite.config.ts                         # Vite 构建配置
│   ├── tailwind.config.js                     # Tailwind CSS 配置
│   ├── tsconfig.json                          # TypeScript 根配置
│   └── ...                                    # 其他配置文件
├── docker-api/                                # Docker API 后端服务
│   ├── server.js                              # Express 服务主文件
│   ├── package.json                           # 后端依赖
│   └── Dockerfile                             # 后端 Docker 镜像
├── .aliyun/                                   # 阿里云 DevOps 配置
│   ├── pipeline.yml                           # 流水线配置示例
│   ├── deploy-to-server.sh                    # 服务器端部署脚本
│   ├── quick-deploy.sh                        # 本地快速部署脚本
│   ├── pipeline-guide.md                      # 流水线配置详细指南
│   └── README.md                              # 阿里云配置说明
├── nginx.conf                                 # Nginx 生产环境配置
├── deploy.sh                                  # 现有部署脚本
├── Dockerfile.frontend                        # 前端 Dockerfile（根目录副本）
├── SERVER.md                                  # 服务器运维文档
└── .env.local                                 # 本地环境变量
```

---

## 3. 技术栈

### 3.1 前端技术栈

| 技术 | 版本 | 说明 |
|------|------|------|
| React | ^19.2.0 | UI 框架 |
| TypeScript | ~5.9.3 | 类型系统 |
| Vite | ^7.2.4 | 构建工具 |
| Tailwind CSS | ^3.4.19 | 原子化 CSS |
| React Router | ^7.14.2 | 路由管理 |
| shadcn/ui | - | UI 组件库 (Radix UI 封装) |
| Lucide React | ^0.562.0 | 图标库 |
| CodeMirror 6 | ^6.x | 代码编辑器 |
| Recharts | ^2.15.4 | 图表库 |
| Zod | ^4.3.5 | 数据校验 |
| React Hook Form | ^7.70.0 | 表单管理 |

### 3.2 后端技术栈

| 技术 | 版本 | 说明 |
|------|------|------|
| Node.js | 18+ | 运行环境 |
| Express | ^4.18.2 | Web 框架 |
| CORS | ^2.8.5 | 跨域处理 |

### 3.3 基础设施

| 技术 | 说明 |
|------|------|
| Nginx | 反向代理 + 静态资源服务 |
| Docker | 容器化部署 |
| Docker Registry | 私有镜像仓库 (端口 5000) |
| SSL | HTTPS 自签名证书 |

---

## 4. 代码风格

### 4.1 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 组件名 | PascalCase | `DevOpsPipeline.tsx`, `RegistryViewer.tsx` |
| 文件/目录 | kebab-case | `ai-navigator.tsx`, `use-mobile.ts` |
| 函数/变量 | camelCase | `fetchStatus`, `deployService` |
| 常量 | UPPER_SNAKE_CASE | `DEFAULT_REGISTRY`, `MOBILE_BREAKPOINT` |
| 接口/类型 | PascalCase | `interface ServiceStatus` |
| Hook | use + PascalCase | `useSyncHeight`, `useContentConfig` |

### 4.2 代码组织风格

- **单文件组件**: 大部分工具组件内联定义在同一文件中（如 `App.tsx` 超过 5000 行），包含类型定义、子组件和逻辑
- **函数式组件**: 全部使用 React 函数式组件 + Hooks
- **Context 模式**: 使用 `createContext` + `useContext` 实现全局状态共享（如 `ContentConfigContext`, `SyncHeightContext`）
- **类型优先**: TypeScript 接口定义在组件文件顶部
- **工具函数内联**: 复杂逻辑（如 XML 格式化、LCS 差分算法）直接内联在组件中

### 4.3 样式风格

- **Tailwind CSS**: 原子化类名，行内书写
- **CSS 变量**: 使用 HSL 色彩空间定义主题变量，支持暗黑/亮色模式切换
- **响应式设计**: 使用 Tailwind 断点 (`sm:`, `md:`, `lg:`) 实现多设备适配
- **过渡动画**: 统一的 `transition-colors`, `hover:scale-[1.02]` 等微交互

### 4.4 典型代码特征

```tsx
// 1. 类型定义在文件顶部
interface Tool {
  id: string
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  color: string
}

// 2. Context + Hook 封装
const ContentConfigContext = createContext<ContentConfig | null>(null)
const useContentConfig = () => { /* ... */ }

// 3. 函数式组件 + useState/useEffect
function JsonTool() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  // ...
}

// 4. Tailwind 类名（长类名链）
className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors"
```

---

## 5. 部署流程（现有）

### 5.1 当前部署方式对比

| 方式 | 位置 | 说明 | 状态 |
|------|------|------|------|
| `deploy.sh` | 项目根目录 | 本地 SSH 直接上传静态文件 | 现有 |
| `.aliyun/quick-deploy.sh` | `.aliyun/` | 本地构建 → 推送 ACR → 服务器部署 | 现有 |
| `.aliyun/deploy-to-server.sh` | `.aliyun/` | 服务器端从 ACR 拉取镜像部署 | 现有 |
| 阿里云 DevOps | 云端 | 流水线自动构建 + 部署 | 规划中 |
| **本地 DevOps 流水线** | **新项目** | **一键构建 → 本地 Registry → 服务器部署** | **本文档新增** |

### 5.2 现有部署脚本说明

#### `deploy.sh`（直接上传静态文件）

```bash
# 部署前端（构建 + SSH 上传 dist）
./deploy.sh frontend

# 部署 Docker API
./deploy.sh docker-api

# 部署 Nginx 配置
./deploy.sh nginx

# 一键全部部署
./deploy.sh all
```

**流程**: 本地 `npm run build` → tar 打包 → scp 上传到服务器 → 解压到 `/usr/share/nginx/html`

#### `.aliyun/quick-deploy.sh`（ACR 镜像方式）

```bash
# 本地构建 Docker 镜像并推送到阿里云 ACR
./.aliyun/quick-deploy.sh [镜像标签]
```

**流程**: `npm run build` → `docker build` → `docker push` (ACR) → SSH 到服务器 `docker pull` → 启动容器

---

## 6. 本地 DevOps 流水线（新增）

### 6.1 设计目标

| 需求 | 实现方式 |
|------|----------|
| **一键执行** | 单条命令 `./local-deploy.sh` |
| **自动编译打包** | `npm run build` + `docker build` |
| **本地镜像仓库** | 使用服务器上已有的 Docker Registry (`110.42.247.238:5000`) |
| **推送服务器部署** | SSH 到服务器执行 `docker pull` + 重启容器 |

### 6.2 技术选型

| 技术 | 说明 |
|------|------|
| **本地 Registry** | `110.42.247.238:5000`（服务器上已部署的 registry:2） |
| **镜像标签策略** | `git commit hash` + `latest` 双标签 |
| **部署方式** | SSH + Docker 容器化部署 |
| **前端服务** | Docker 容器 (Nginx Alpine) |
| **后端服务** | Docker 容器 (Node.js Alpine + Docker CLI) |

### 6.3 流水线脚本

脚本路径：`/local-deploy.sh`（见项目根目录）

```bash
#!/bin/bash
# =============================================
#  DevTools Hub 本地 DevOps 一键部署流水线
#  技术选型: Docker + 本地 Registry + SSH
#  用途: 一键构建 → 推送本地 Registry → 服务器部署
# =============================================
#  用法:
#    ./local-deploy.sh [标签名]
#
#  示例:
#    ./local-deploy.sh              # 使用 git commit hash 作为标签
#    ./local-deploy.sh v1.2.0       # 使用指定标签
#    ./local-deploy.sh latest       # 使用 latest 标签
# =============================================

set -e

# ==================== 配置区域 ====================
# 服务器配置
SERVER="110.42.247.238"
SSH_KEY="$HOME/.ssh/devtools_key"
SSH_OPTS="-o StrictHostKeyChecking=no -o ConnectTimeout=10"

# 本地 Registry 配置 (服务器上的私有镜像仓库)
REGISTRY="110.42.247.238:5000"
NAMESPACE="devtools-hub"
FRONTEND_IMAGE="frontend"
API_IMAGE="docker-api"

# 项目路径
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
FRONTEND_DIR="$SCRIPT_DIR/devtools-hub"
API_DIR="$SCRIPT_DIR/docker-api"

# 颜色
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BLUE='\033[0;34m'; NC='\033[0m'

info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
step()  { echo -e "${YELLOW}[STEP]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
err()   { echo -e "${RED}[ERROR]${NC} $1"; }
title() { echo -e "\n${BLUE}========================================${NC}"; echo -e "${BLUE}  $1${NC}"; echo -e "${BLUE}========================================${NC}"; }

# ==================== 获取镜像标签 ====================
get_image_tag() {
    local tag="${1:-}"
    if [ -z "$tag" ]; then
        # 如果没有指定标签，使用 git commit hash 前7位
        if [ -d "$SCRIPT_DIR/.git" ]; then
            tag=$(cd "$SCRIPT_DIR" && git rev-parse --short HEAD)
        else
            tag=$(date +%Y%m%d%H%M%S)
        fi
    fi
    echo "$tag"
}

# ==================== 构建前端镜像 ====================
build_frontend() {
    local tag="$1"
    title "🏗️  构建前端镜像"

    step "1/3 构建前端项目..."
    cd "$FRONTEND_DIR"
    npm run build
    info "构建完成: $FRONTEND_DIR/dist"

    step "2/3 构建 Docker 镜像..."
    docker build -t "$REGISTRY/$NAMESPACE/$FRONTEND_IMAGE:$tag" -f "$FRONTEND_DIR/Dockerfile" "$FRONTEND_DIR"
    docker tag "$REGISTRY/$NAMESPACE/$FRONTEND_IMAGE:$tag" "$REGISTRY/$NAMESPACE/$FRONTEND_IMAGE:latest"
    info "镜像构建完成: $REGISTRY/$NAMESPACE/$FRONTEND_IMAGE:$tag"

    step "3/3 推送到本地 Registry..."
    docker push "$REGISTRY/$NAMESPACE/$FRONTEND_IMAGE:$tag"
    docker push "$REGISTRY/$NAMESPACE/$FRONTEND_IMAGE:latest"
    info "推送完成"
}

# ==================== 构建后端镜像 ====================
build_api() {
    local tag="$1"
    title "🏗️  构建 Docker API 镜像"

    step "1/2 构建 Docker 镜像..."
    cd "$API_DIR"
    docker build -t "$REGISTRY/$NAMESPACE/$API_IMAGE:$tag" "$API_DIR"
    docker tag "$REGISTRY/$NAMESPACE/$API_IMAGE:$tag" "$REGISTRY/$NAMESPACE/$API_IMAGE:latest"
    info "镜像构建完成: $REGISTRY/$NAMESPACE/$API_IMAGE:$tag"

    step "2/2 推送到本地 Registry..."
    docker push "$REGISTRY/$NAMESPACE/$API_IMAGE:$tag"
    docker push "$REGISTRY/$NAMESPACE/$API_IMAGE:latest"
    info "推送完成"
}

# ==================== 服务器部署 ====================
deploy_to_server() {
    local tag="$1"
    title "🚀 部署到服务器 ($SERVER)"

    ssh $SSH_OPTS -i "$SSH_KEY" root@"$SERVER" << EOF
set -e

# 配置
REGISTRY="$REGISTRY"
NAMESPACE="$NAMESPACE"
FRONTEND_IMAGE="$FRONTEND_IMAGE"
API_IMAGE="$API_IMAGE"
TAG="$tag"

info_remote() { echo -e "\033[0;32m[INFO]\033[0m \$1"; }
step_remote() { echo -e "\033[1;33m[STEP]\033[0m \$1"; }

step_remote "1/4 拉取前端镜像..."
docker pull \$REGISTRY/\$NAMESPACE/\$FRONTEND_IMAGE:\$TAG

step_remote "2/4 拉取 API 镜像..."
docker pull \$REGISTRY/\$NAMESPACE/\$API_IMAGE:\$TAG

step_remote "3/4 重启容器..."
# 前端容器
docker stop devtools-hub-app 2>/dev/null || true
docker rm devtools-hub-app 2>/dev/null || true
docker run -d --name devtools-hub-app --restart=always -p 8081:80 \
    \$REGISTRY/\$NAMESPACE/\$FRONTEND_IMAGE:\$TAG

# API 容器
docker stop docker-api-app 2>/dev/null || true
docker rm docker-api-app 2>/dev/null || true
docker run -d --name docker-api-app --restart=always -p 3000:3000 \
    -v /var/run/docker.sock:/var/run/docker.sock \
    \$REGISTRY/\$NAMESPACE/\$API_IMAGE:\$TAG

step_remote "4/4 验证部署..."
sleep 3
if docker ps | grep -q devtools-hub-app && docker ps | grep -q docker-api-app; then
    echo -e "\033[0;32m✅ 部署成功!\033[0m"
    docker ps --filter name=devtools-hub-app --filter name=docker-api-app
else
    echo -e "\033[0;31m❌ 部署失败!\033[0m"
    exit 1
fi
EOF
}

# ==================== 主流程 ====================
main() {
    local tag="$(get_image_tag "$1")"

    title "DevTools Hub 本地 DevOps 流水线"
    echo -e "  镜像标签: ${CYAN}$tag${NC}"
    echo -e "  Registry: ${CYAN}$REGISTRY${NC}"
    echo -e "  服务器:   ${CYAN}$SERVER${NC}"
    echo ""

    # 1. 构建前端
    build_frontend "$tag"
    echo ""

    # 2. 构建后端
    build_api "$tag"
    echo ""

    # 3. 部署到服务器
    deploy_to_server "$tag"

    title "✅ 全部部署完成"
    echo -e ""
    echo -e "  ${GREEN}前端:${NC}    http://$SERVER:8081"
    echo -e "  ${GREEN}API:${NC}     http://$SERVER:3000"
    echo -e "  ${GREEN}镜像:${NC}    $REGISTRY/$NAMESPACE/$FRONTEND_IMAGE:$tag"
    echo -e ""
}

# ==================== 入口 ====================
main "$@"
```

### 6.4 流水线执行流程

```
┌─────────────────────────────────────────────────────────────────────┐
│                    一键执行: ./local-deploy.sh                       │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│  阶段1: 构建前端                                                     │
│  ┌────────────┐    ┌──────────────┐    ┌─────────────────────────┐  │
│  │ npm build  │ → │ docker build │ → │ push to local registry  │  │
│  └────────────┘    └──────────────┘    └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│  阶段2: 构建后端 (docker-api)                                       │
│  ┌──────────────┐    ┌─────────────────────────────────────────┐  │
│  │ docker build │ → │ push to local registry                  │  │
│  └──────────────┘    └─────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│  阶段3: 服务器部署                                                   │
│  ┌─────────────┐    ┌─────────────┐    ┌────────────────────────┐ │
│  │ docker pull │ → │ stop old    │ → │ docker run new         │ │
│  │ (registry)  │    │ containers  │    │ containers             │ │
│  └─────────────┘    └─────────────┘    └────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
                          ┌─────────────────┐
                          │   ✅ 部署完成    │
                          └─────────────────┘
```

### 6.5 前置条件

在首次使用本地 DevOps 流水线前，请确保：

1. **本地 Docker 已配置 insecure registry**：

   ```json
   // ~/.docker/daemon.json
   {
     "insecure-registries": ["110.42.247.238:5000"]
   }
   ```

   然后重启 Docker：`sudo systemctl restart docker`

2. **服务器 Registry 已运行**：

   ```bash
   # 在服务器上检查
   docker ps | grep registry
   curl http://110.42.247.238:5000/v2/_catalog
   ```

3. **SSH 免密登录已配置**：

   ```bash
   ssh -i ~/.ssh/devtools_key root@110.42.247.238
   ```

---

## 7. 服务架构

```
┌─────────────────────────────────────────────────────────────────────┐
│                         用户访问                                      │
│                    https://110.42.247.238                              │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Nginx (端口 80/443)                            │
│  ├── /                  → 前端静态资源 (DevTools Hub)                │
│  ├── /whisper/         → Whisper API (端口 8080)                   │
│  ├── /api/docker        → Docker API 服务 (端口 3000)                │
│  ├── /registry/         → Docker Registry API (端口 5000)            │
│  └── /registry-ui/      → Registry Web UI (端口 8081)               │
└─────────────────────────────────────────────────────────────────────┘
                                   │
          ┌────────────────────────┼────────────────────────┐
          ▼                        ▼                        ▼
    ┌──────────┐           ┌──────────────┐         ┌──────────┐
    │ Whisper  │           │  Docker API  │         │Registry  │
    │  :8080   │           │    :3000     │         │   :5000  │
    └──────────┘           └──────────────┘         └──────────┘
                                                            │
                                                            ▼
                                                     ┌──────────┐
                                                     │Registry  │
                                                     │   UI     │
                                                     │  :8081   │
                                                     └──────────┘
```

---

## 8. 常用命令速查

### 8.1 本地开发

```bash
cd devtools-hub
npm install
npm run dev      # 开发服务器 (端口 5173)
npm run build    # 生产构建
npm run lint     # ESLint 检查
```

### 8.2 Docker 操作

```bash
# 本地构建前端镜像
docker build -t devtools-hub:latest -f devtools-hub/Dockerfile devtools-hub/

# 构建后端镜像
docker build -t docker-api:latest docker-api/

# 查看本地 Registry 镜像
curl http://110.42.247.238:5000/v2/_catalog
```

### 8.3 部署操作

```bash
# 方式1: 直接上传静态文件
./deploy.sh all

# 方式2: 本地 DevOps 流水线（推荐）
./local-deploy.sh

# 方式3: 指定标签部署
./local-deploy.sh v1.2.0
```

---

## 9. 变更记录

| 日期 | 变更内容 | 文档更新 |
|------|----------|----------|
| 2026-05-21 | 创建项目文档，梳理项目结构和技术栈 | 本文档 |
| 2026-05-21 | 新增本地 DevOps 流水线 (`local-deploy.sh`) | 本文档 |
| 2026-05-21 | 完善流水线脚本，修复 SSH 变量传递问题，支持参数化部署 | `local-deploy.sh` |
| 2026-05-21 | 新增使用运维文档 (`DEPLOY_OPERATIONS.md`) | `DEPLOY_OPERATIONS.md` |
| 2026-05-23 | 游戏中心重构：街机(EmulatorJS) + FC/NES模拟器 + 黄金矿工 | 本次 |
| 2026-05-23 | ArcadeGame/NESGame/GameHub 组件开发，ifram 跨域修复 | 本次 |
| 2026-05-23 | 删除 FlappyBird，Contra/Sanmo/SuperMario/TankBattle 改用 EmulatorJS | 本次 |
| 2026-05-23 | 项目归档：代码提交 (7108910)，最终部署到 110.42.247.238 | 本次 |

---

## 10. 附录

### 10.1 相关文件清单

| 文件 | 说明 |
|------|------|
| `deploy.sh` | 现有 SSH 静态文件部署脚本 |
| `.aliyun/quick-deploy.sh` | ACR 镜像部署脚本 |
| `.aliyun/deploy-to-server.sh` | 服务器端 ACR 拉取部署脚本 |
| `local-deploy.sh` | **新增：本地 Registry DevOps 流水线** |
| `nginx.conf` | Nginx 反向代理配置 |
| `SERVER.md` | 服务器运维文档（IP、端口、服务状态） |

### 10.2 服务器信息

| 项目 | 值 |
|------|-----|
| 服务器 IP | `110.42.247.238` |
| 操作系统 | Ubuntu 22.04 |
| CPU | 4 核 |
| 内存 | 3.6 GB |
| 磁盘 | 40 GB |
| SSH Key | `~/.ssh/devtools_key` |
