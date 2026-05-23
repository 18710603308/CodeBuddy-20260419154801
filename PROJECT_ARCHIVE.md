# DevTools Hub — 项目归档文档

> 归档日期：2026-05-23
> Git Commit：7108910
> 部署地址：https://110.42.247.238

---

## 1. 项目概述

**DevTools Hub** 是一个集开发者工具、经典游戏、AI 导航于一体的综合性前端应用。技术栈：React 19 + Vite 7 + TypeScript + Tailwind CSS。

### 功能模块

| 模块 | 说明 |
|------|------|
| AI 导航黄页 | 收录全网优质 AI 工具的导航页 |
| Coding The World | 探索优质开源项目 |
| 经典游戏 | 街机/FC/GBA 模拟器（魂斗罗、坦克大战、超级马里奥、三国战纪等） |
| 休闲游戏 | 连连看、蜘蛛纸牌、扫雷、2048、黄金矿工 |
| 离线工具 | 40+ 开发工具，无需网络 |
| DevOps 管理 | 可视化部署与运维管理平台 |
| 镜像管理 | 私有 Docker Registry 可视化管理 |

---

## 2. 最近更新 (2026-05-23)

### 游戏中心重构

- **新增 ArcadeGame** — EmulatorJS 街机模拟器，支持三国战纪等 MAME/FBA ROM
- **新增 NESGame** — FC/NES 模拟器组件
- **新增 GameHub** — 统一游戏入口页面，集成方向键和投币/开始按钮
- **新增 GoldMiner** — 黄金矿工休闲小游戏（内联 HTML, 1319行）
- **新增 ErrorPage** — 404 页面
- **删除 FlappyBird** — 已废弃

### 模拟器适配

- ContraFC、Sanmo、SuperMario、TankBattle 改用 EmulatorJS 加载
- 键盘映射（EmulatorJS arcade 默认）:
  - V = 投币, Enter = 开始, X = B, S = Y
  - 方向键 ↑↓←→

### 关键修复

- **iframe 跨域**：react-emulatorjs 通过 iframe 加载，API 需从 `iframe.contentWindow.EJS_emulator` 获取
- 投币/开始按钮现在正常工作

### 关键文件

| 文件 | 行数 | 说明 |
|------|------|------|
| `src/components/GameHub.tsx` | 488 | 统一游戏入口 |
| `src/components/GoldMiner.tsx` | 1319 | 黄金矿工游戏 |
| `src/components/ArcadeGame.tsx` | 244 | 街机模拟器 |
| `src/components/NESGame.tsx` | 181 | FC 模拟器 |
| `src/arcadeControls.ts` | 48 | 街机按键定义 |
| `src/nesControls.ts` | 35 | FC 按键定义 |

---

## 3. 项目结构

```
├── devtools-hub/                  # 前端主项目
│   ├── src/
│   │   ├── components/            # React 组件 (~30+)
│   │   ├── router.tsx             # 路由配置
│   │   ├── App.tsx                # 主应用
│   │   └── main.tsx               # 入口
│   ├── public/
│   │   ├── emulatorjs/data/       # EmulatorJS 运行时 (78MB, gitignore)
│   │   ├── roms/                  # ROM 文件 (278MB, gitignore)
│   │   └── games/                 # 内联小游戏资源
│   └── package.json
├── docker-api/                    # Docker API 后端 (Express)
├── jenkins/                       # Jenkins CI/CD 配置
├── nginx.conf                     # Nginx 反向代理
├── deploy.sh                      # 直接 SSH 部署脚本
├── local-deploy.sh                # Docker Registry 部署流水线
├── Dockerfile.frontend            # 前端 Docker 镜像
└── docker-compose.local.yml       # 本地开发编排
```

---

## 4. 部署信息

| 项目 | 值 |
|------|-----|
| 服务器 | 110.42.247.238 (Ubuntu 22.04, 4C/3.6GB/40GB) |
| 访问地址 | https://110.42.247.238 |
| 前端路径 | /usr/share/nginx/html |
| Registry | 110.42.247.238:5000 |
| SSH Key | ~/.ssh/devtools_key |

### 部署方式

```bash
# 方式1: 直接上传（当前使用）
./deploy.sh frontend

# 方式2: Docker Registry 流水线
./local-deploy.sh

# 方式3: Jenkins CI/CD
# 访问 http://localhost:8080 (admin/admin123)
```

---

## 5. 运行时依赖（不在 git 中）

以下大文件已加入 `.gitignore`，需手动获取：

| 目录 | 大小 | 说明 |
|------|------|------|
| `devtools-hub/public/emulatorjs/data/` | 78MB | EmulatorJS 框架 |
| `devtools-hub/public/roms/` | 278MB | 游戏 ROM 文件 |

---

## 6. Git 提交记录

```
7108910 feat: 游戏中心重构 - 街机/FC模拟器集成 + 黄金矿工
  - 20 files changed, +3172 / -655
  - 新增: ArcadeGame, NESGame, GameHub, GoldMiner, ErrorPage
  - 删除: FlappyBird
  - .gitignore 更新
```
