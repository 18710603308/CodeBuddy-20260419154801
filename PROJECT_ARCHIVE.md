# DevTools Hub — 项目归档文档

> 归档日期：2026-08-13
> Git Commit：e1eb79a
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
| GaussDB 学习 | 数据库在线学习 + 浏览器内 SQL 练习 |

---

## 2. 最近更新

### GaussDB 数据库在线学习 (2026-08-13)

- **新增 GaussDBLearn** — GaussDB 数据库在线学习与 SQL 练习平台，路由 `/gaussdb-learn`
- **核心引擎 PGlite 0.5.4** — PostgreSQL WASM，浏览器内直接运行 SQL，无需后端服务器
- **10 章课程**：数据库概述 → SQL 基础 → DDL → DML → SELECT → 聚合分组 → JOIN → 子查询 → 函数 → 视图事务
- **20 道练习题**：CodeMirror SQL 编辑器（PostgreSQL 方言高亮 + 自动补全），支持运行/查看答案/自动比对（行数+内容）
- **内置示例数据集**：departments / jobs / employees 三张表，贴近企业人事管理场景
- **首页入口**：顶部导航"数据库学习"链接 + Hero 区 NEW 高亮提示条 + 工具卡片
- **关键配置**：`vite.config.ts` 需 `assetsInclude: ['**/*.wasm', '**/*.data']` + `optimizeDeps.exclude: ['@electric-sql/pglite']`，否则 PGlite 运行时报 `Invalid FS bundle size`

#### 服务器真库 SQL 验证引擎 (2026-08-13 追加)

- **核心能力**：浏览器 PGlite 之外，新增 **服务器 PostgreSQL 18.4 真库**作为 SQL 验证引擎，前端可一键切换
- **PostgreSQL 18 容器** (`gaussdb-pg`)：监听 `127.0.0.1:5432`（不暴露公网），数据卷 `/opt/pgdata:/var/lib/postgresql`（PG 18+ 约定路径，不能挂到 `data` 子目录）
- **低权限角色** `gaussdb_app`：执行用户 SQL；超级用户 `postgres` 仅用于 `/reset` 重置示例数据集；密码分别存 `/opt/sql-api/.apppass` 与 `.pgpass`（600 权限）
- **SQL API 服务** (`/opt/sql-api`，Express + pg，pm2 管理)：`POST /execute`（单语句 + statement_timeout=5s）、`POST /reset`（多语句脚本）、`GET /health`；多语句通过词法分析（忽略字符串/注释）拒绝非单条执行
- **nginx**：`location /sql-api/ → http://127.0.0.1:3002/`（proxy_pass 带尾斜杠剥离前缀）
- **前端**：Header 加 `Globe`/`Server` 图标的"浏览器 / 服务器真库"切换按钮组，状态徽章/侧边栏说明/footer 全部按引擎模式动态渲染
- **vite dev**：`/sql-api` 代理到 `https://110.42.247.238`（`secure: false`），本地开发可联调服务器真库模式
- **端到端验证**：页面 200、health `{"ok":true,"version":"18.4"}`、综合查询 `current_database()=gaussdb_learn`、`current_user=gaussdb_app`、耗时 1ms

### 游戏中心重构 (2026-05-23)

- **新增 ArcadeGame** — EmulatorJS 街机模拟器，支持三国战纪等 MAME/FBA ROM
- **新增 NESGame** — FC/NES 模拟器组件
- **新增 GameHub** — 统一游戏入口页面，集成方向键和投币/开始按钮
- **新增 GoldMiner** — 黄金矿工休闲小游戏（内联 HTML, 1319行）
- **新增 ErrorPage** — 404 页面
- **删除 FlappyBird** — 已废弃

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
| `src/components/GaussDBLearn.tsx` | 686 | GaussDB 在线学习页 |
| `src/data/gaussdb-course.ts` | 768 | 课程 + 练习题数据 |
| `sql-api/server.js` | 173 | SQL API 服务 (Express + pg) |
| `sql-api/init.sql` | 64 | 服务端示例数据集重置脚本 |
| `sql-api/setup-role.sh` | 24 | 创建 gaussdb_app 低权限角色 |
| `sql-api/package.json` | 11 | express + pg 依赖 |

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
0682ce0 feat: GaussDB 学习支持服务器真库验证引擎 (PostgreSQL 18)
  - 7 files changed
  - 新增: sql-api/ (server.js + init.sql + setup-role.sh + package.json)
  - 修改: GaussDBLearn.tsx (双引擎模式)、vite.config.ts (dev proxy)、nginx.conf (/sql-api/)

e1eb79a feat: GaussDB 数据库在线学习与 SQL 练习平台
  - 8 files changed, +1513 / -7
  - 新增: GaussDBLearn, gaussdb-course (PGlite 0.5.4)
  - 首页导航 + Hero 区 NEW 入口

7108910 feat: 游戏中心重构 - 街机/FC模拟器集成 + 黄金矿工
  - 20 files changed, +3172 / -655
  - 新增: ArcadeGame, NESGame, GameHub, GoldMiner, ErrorPage
  - 删除: FlappyBird
  - .gitignore 更新
```
