# DevTools Hub 服务器文档

> 更新时间: 2026-05-22 21:51

---

## 1. 服务器基础信息

| 项目 | 值 |
|------|-----|
| 服务器 IP | `110.42.247.238` |
| 操作系统 | Ubuntu 22.04 |
| SSH 端口 | 22 |
| SSH 用户 | root |
| SSH Key | `~/.ssh/devtools_key` |

### 资源规格

| 资源 | 规格 |
|------|------|
| CPU | Intel Xeon Platinum 8255C @ 2.50GHz × 4 核 |
| 内存 | 3.6 GB |
| 磁盘 | 40 GB |

---

## 2. 服务架构

```
                         用户访问
                    https://110.42.247.238
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Nginx (端口 80/443)                          │
│  ├── /              → 前端 SPA (DevTools Hub)                   │
│  ├── /whisper/      → Whisper 语音识别 API (端口 8080)          │
│  ├── /api/          → Docker API 后端 (端口 3000)                │
│  └── /registry/     → Docker Registry API (端口 5000)           │
└─────────────────────────────────────────────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
   ┌──────────┐        ┌──────────────┐     ┌──────────┐
   │ Whisper  │        │  Docker API  │     │ Registry │
   │  :8080   │        │    :3000     │     │  :5000   │
   │ Python   │        │  Node.js     │     │ Docker   │
   └──────────┘        └──────────────┘     └──────────┘
```

---

## 3. 服务详情

### 3.1 前端 (DevTools Hub)

| 项目 | 值 |
|------|-----|
| 部署方式 | Nginx 静态文件 (SPA) |
| 文件路径 | `/usr/share/nginx/html` |
| 本地源码 | `devtools-hub/` (React + Vite + TypeScript) |
| 访问地址 | https://110.42.247.238 |

**主要功能**：
- 🔧 40+ 离线开发工具（JSON/XML/YAML/SQL 格式化、Base64/Hash/JWT 编解码、正则测试等）
- 🤖 AI 导航黄页（192+ AI 工具链接）
- 🎮 游戏合集（NES 模拟器、连连看、扫雷、2048 等）
- 📦 镜像管理（Docker Registry 查看/推送/拉取）
- 🌍 开源项目探索

### 3.2 Nginx 反向代理

| 项目 | 值 |
|------|-----|
| 类型 | 非 Docker，系统级安装 |
| 配置路径 | `/etc/nginx/sites-enabled/default` |
| 本地模板 | 项目根目录 `nginx.conf` |

**代理规则**：

| 路径 | 目标 | 说明 |
|------|------|------|
| `:80` | → 301 重定向 HTTPS | 强制 HTTPS |
| `:443 /` | SPA 静态文件 | try_files + fallback index.html |
| `:443 /whisper/` | `127.0.0.1:8080` | 语音识别 API（50MB body，120s 超时） |
| `:443 /api/` | `127.0.0.1:3000` | Docker API 全部端点 |
| `:443 /registry/` | `127.0.0.1:5000` | Docker Registry API（CORS） |

### 3.3 Docker API 后端

| 项目 | 值 |
|------|-----|
| 技术栈 | Node.js Express |
| 端口 | 3000 |
| 部署路径 | `/opt/docker-api` |
| 进程管理 | nohup node |
| 日志 | `/var/log/docker-api.log` |
| 本地源码 | `docker-api/server.js` |

**API 端点**：

| 方法 | 端点 | 说明 |
|------|------|------|
| `GET` | `/api/status` | 服务健康状态（Nginx / Whisper / Registry / 容器） |
| `GET` | `/api/docker-images` | 获取本地 Docker 镜像列表 |
| `POST` | `/api/deploy` | 触发远程部署（docker-api / nginx） |
| `POST` | `/api/docker/pull` | 拉取镜像 `{image, tag}` |
| `POST` | `/api/docker/tag` | 标记镜像 `{source, target}` |
| `POST` | `/api/docker/push` | 推送镜像 `{image}` |
| `POST` | `/api/docker/pull-registry` | 从私有仓库拉取 `{image}` |

### 3.4 Docker Registry 镜像仓库

| 项目 | 值 |
|------|-----|
| 容器名 | `registry` |
| 镜像 | `registry:2` |
| 端口 | 5000 |
| 数据卷 | `/opt/registry` → `/var/lib/registry` |
| API 地址 | https://110.42.247.238/registry/ |

### 3.5 Whisper 语音识别

| 项目 | 值 |
|------|-----|
| 类型 | Python 3 (非 Docker) |
| 端口 | 8080 |
| 模型 | base |
| 健康检查 | `GET /health` |
| API | `POST /inference` |

> **注意**：Whisper 前端 UI 组件（`SpeechRecognition.tsx`）当前无路由入口，仅后端服务运行中。如需使用，可通过 API 直接调用。

### 3.6 其他容器

| 容器名 | 镜像 | 用途 |
|------|------|------|
| `1Panel-frps-GoeU` | snowdreamtech/frps:0.65.0 | 1Panel 内网穿透 |

---

## 4. 端口清单

| 端口 | 协议 | 服务 | 说明 |
|------|------|------|------|
| 22 | TCP | SSH | 服务器管理 |
| 80 | TCP | Nginx | HTTP → 301 HTTPS |
| 443 | TCP | Nginx | HTTPS 入口 |
| 3000 | TCP | Docker API | 镜像管理后端 |
| 5000 | TCP | Registry | 镜像仓库 |
| 8080 | TCP | Whisper | 语音识别 |

---

## 5. SSL 证书

| 项目 | 值 |
|------|-----|
| 类型 | 自签名证书 |
| 路径 | `/etc/nginx/ssl/server.crt` + `server.key` |

> 首次访问需浏览器手动信任自签名证书。

---

## 6. 常用操作

### 6.1 SSH 连接

```bash
ssh -i ~/.ssh/devtools_key root@110.42.247.238
```

### 6.2 查看服务状态

```bash
# 网页端：首页工具 → 镜像管理（可查看 Registry 仓库）

# 命令行：
ssh -i ~/.ssh/devtools_key root@110.42.247.238 "
  curl -s http://localhost:3000/api/status | python3 -m json.tool
"

# Docker 容器
ssh -i ~/.ssh/devtools_key root@110.42.247.238 "docker ps"
```

### 6.3 重启服务

```bash
# 方式一：本地一键部署（推荐）
./deploy.sh all           # 前端 + Docker API + Nginx 全部部署
./deploy.sh frontend       # 仅部署前端
./deploy.sh docker-api     # 仅部署 Docker API
./deploy.sh nginx          # 仅部署 Nginx 配置

# 方式二：SSH 登录后手动操作
ssh -i ~/.ssh/devtools_key root@110.42.247.238

# Docker API
pkill -f 'node.*server.js'
cd /opt/docker-api && nohup node server.js > /var/log/docker-api.log 2>&1 &

# Nginx
nginx -t && nginx -s reload

# Registry
docker restart registry

# Whisper
pkill -f server3.py && cd /path/to/whisper-server && python3 server3.py &
```

### 6.4 查看日志

```bash
ssh -i ~/.ssh/devtools_key root@110.42.247.238

cat /var/log/docker-api.log          # Docker API
tail -f /var/log/nginx/access.log    # Nginx 访问日志
tail -f /var/log/nginx/error.log     # Nginx 错误日志
docker logs registry                 # Registry
```

---

## 7. 镜像管理

### 7.1 网页端

访问 https://110.42.247.238 首页 → **镜像管理** 卡片，支持查看/推送/拉取私有仓库镜像。

### 7.2 命令行

```bash
# 推送到私有仓库
docker tag nginx:latest 110.42.247.238:5000/nginx:latest
docker push 110.42.247.238:5000/nginx:latest

# 从私有仓库拉取
docker pull 110.42.247.238:5000/nginx:latest

# 查看仓库镜像列表
curl https://110.42.247.238/registry/v2/_catalog
```

---

## 8. 部署流程

### 8.1 前置条件

- 本地已配置 SSH Key（`~/.ssh/devtools_key`）
- 已安装 Node.js + npm

### 8.2 一键部署

```bash
# 在项目根目录执行
./deploy.sh frontend      # 部署前端 (npm build → tar → scp → Nginx)
./deploy.sh docker-api    # 部署 Docker API (上传 → npm install → 重启)
./deploy.sh nginx         # 部署 Nginx 配置 (上传 → nginx -t → reload)
./deploy.sh all           # 一键全部部署
./deploy.sh --help        # 查看帮助
```

### 8.3 部署流程图

```
./deploy.sh all
      │
      ├─ 1. 部署前端
      │    ├─ npm install & npm run build → dist/
      │    ├─ 备份服务器旧文件 (/tmp/html-backup-*)
      │    ├─ tar + scp 上传到 /usr/share/nginx/html
      │    └─ curl 验证
      │
      ├─ 2. 部署 Docker API
      │    ├─ tar + scp 上传到 /opt/docker-api
      │    ├─ npm install
      │    ├─ pkill 旧进程 → nohup 启动新进程
      │    └─ curl 验证
      │
      └─ 3. 部署 Nginx 配置
           ├─ scp 上传 nginx.conf
           ├─ nginx -t 语法检查
           └─ nginx -s reload
```

### 8.4 远程触发（服务端 `/api/deploy`）

服务器上 `/opt/deploy-server.sh` 支持远程触发 Ddocker API 和 Nginx 的重启：

| 触发命令 | 效果 |
|------|------|
| `POST /api/deploy {"service":"docker-api"}` | 重启 Docker API 自身 |
| `POST /api/deploy {"service":"nginx"}` | 重载 Nginx 配置 |

> 前端部署不支持远程触发（需本地构建+上传）。

---

## 9. 新机器初始化

以下为从零搭建服务器的参考步骤（当前服务器已配置完毕）。

```bash
# 1. 安装 Docker
curl -fsSL https://get.docker.com | sh

# 2. 安装 Nginx
apt update && apt install -y nginx

# 3. 部署 Registry
docker run -d --name registry --restart=always \
  -p 5000:5000 -v /opt/registry:/var/lib/registry \
  registry:2

# 4. 部署 Docker API
mkdir -p /opt/docker-api
cd /opt/docker-api && npm install
nohup node server.js > /var/log/docker-api.log 2>&1 &

# 5. 前端静态文件 + Nginx 配置 → 使用 deploy.sh 部署
./deploy.sh all
```

---

## 10. 注意事项

1. **SSL 证书**：自签名证书，浏览器首次访问需手动信任
2. **内存**：仅 3.6GB，Whisper 大模型运行时内存紧张
3. **SSH**：key 路径 `~/.ssh/devtools_key`，root 权限
4. **Docker API**：运行在宿主机而非容器内，部署时注意重启策略
5. **前端部署**：必须在本地构建，服务端无源码
6. **Registry UI**：已移除独立注册表界面，使用前端内建镜像管理替代
