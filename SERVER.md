# DevTools Hub 服务器文档

> 更新时间: 2026-05-21 01:00

---

## 1. 服务器基础信息

| 项目 | 值 |
:|------|-----|
| 服务器 IP | `110.42.247.238` |
| 操作系统 | Ubuntu 22.04 (Linux 5.15.0) |
| SSH 端口 | 22 |
| SSH 用户 | root |

### 资源规格

| 资源 | 规格 |
|------|------|
| CPU | Intel Xeon Platinum 8255C @ 2.50GHz × 4 核 |
| 内存 | 3.6 GB |
| 磁盘 | 40 GB (已用 ~15GB, 可用 ~24GB) |

---

## 2. 服务架构

```
┌─────────────────────────────────────────────────────────────────────┐
│                         用户访问                                      │
│                     https://110.42.247.238                           │
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

## 3. 服务详情

### 3.0 前端服务 (Nginx)

| 项目 | 值 |
|------|-----|
| 类型 | Nginx 反向代理 (非 Docker) |
| 状态 | 运行中 |
| 端口 | 80 (HTTP), 443 (HTTPS) |
| 配置路径 | `/etc/nginx/sites-enabled/default` |
| 访问地址 | https://110.42.247.238 |

**功能**: 反向代理所有服务，支持 HTTPS

---

### 3.1 DevTools Hub 前端

| 项目 | 值 |
|------|-----|
| 部署方式 | Nginx 静态文件 |
| 状态 | 运行中 |
| 静态文件 | `/usr/share/nginx/html` |
| 访问地址 | https://110.42.247.238 |
| 功能 | DevTools Hub 主界面 + 镜像管理工具 |

---

### 3.2 Whisper 语音识别服务

| 项目 | 值 |
|------|-----|
| 进程 | Python 3 (非 Docker) |
| 状态 | 运行中 |
| 端口 | 8080 |
| 模型 | base |
| API 地址 | https://110.42.247.238/whisper/ |
| 健康检查 | http://localhost:8080/health |

**API 端点**:
- `GET /health` - 健康检查
- `POST /inference` - 语音转文字

---

### 3.3 Docker API 服务 (镜像管理后端)

| 项目 | 值 |
|------|-----|
| 类型 | Node.js Express (非 Docker) |
| 状态 | 运行中 |
| 端口 | 3000 |
| 进程管理 | nohup node |
| 日志 | `/var/log/docker-api.log` |
| API 地址 | https://110.42.247.238/api/docker |

**API 端点**:
| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/docker-images` | GET | 获取本地镜像列表 |
| `/api/docker/pull` | POST | 拉取镜像 |
| `/api/docker/tag` | POST | 标记镜像 |
| `/api/docker/push` | POST | 推送镜像到私有仓库 |
| `/api/docker/pull-registry` | POST | 从私有仓库拉取 |

**部署路径**: `/opt/docker-api`

---

### 3.4 Docker Registry (镜像仓库)

| 项目 | 值 |
|------|-----|
| 容器名 | `registry` |
| 镜像 | `registry:2` |
| 状态 | 运行中 |
| 端口 | 5000 |
| 数据卷 | `/opt/registry` → `/var/lib/registry` |
| API 地址 | https://110.42.247.238/registry/ |

**用途**: 存储 Docker 镜像

---

### 3.5 Registry Web UI (镜像管理界面)

| 项目 | 值 |
|------|-----|
| 容器名 | `registry-ui` |
| 镜像 | `joxit/docker-registry-ui:latest` |
| 状态 | 运行中 |
| 内部端口 | 80 |
| 映射端口 | 8081 |
| 管理地址 | https://110.42.247.238/registry-ui/ |

**用途**: 可视化管理 Docker 镜像仓库

---

### 3.6 1Panel FRP (内网穿透)

| 项目 | 值 |
|------|-----|
| 容器名 | `1Panel-frps-GoeU` |
| 镜像 | `snowdreamtech/frps:0.65.0` |
| 状态 | 运行中 |
| 用途 | 1Panel 内网穿透服务 |

---

## 4. 端口使用情况

| 端口 | 协议 | 服务 | 说明 |
|------|------|------|------|
| 22 | TCP | SSH | 服务器管理 |
| 80 | TCP | Nginx | HTTP 入口 (重定向到 HTTPS) |
| 443 | TCP | Nginx | HTTPS 入口 |
| 3000 | TCP | Docker API | 镜像管理后端 |
| 5000 | TCP | Registry | Docker 镜像仓库 API |
| 8080 | TCP | Whisper | 语音识别服务 |
| 8081 | TCP | Registry UI | 镜像仓库管理界面 |

---

## 5. HTTPS/SSL 配置

| 项目 | 值 |
|------|-----|
| 证书类型 | 自签名证书 |
| 证书路径 | `/etc/nginx/ssl/server.crt` |
| 私钥路径 | `/etc/nginx/ssl/server.key` |
| 签发者 | 本地 CA |

> 注意: 首次访问需要浏览器允许自签名证书

---

## 6. 常用操作

### 6.1 SSH 连接
```bash
ssh root@110.42.247.238
# 或使用配置的简写
ssh devtools
```

### 6.2 查看服务状态
```bash
# 查看所有 Docker 容器
docker ps

# 查看 Nginx
ps aux | grep nginx

# 查看 Docker API
curl http://localhost:3000/api/docker-images

# 查看 Whisper 服务
curl http://localhost:8080/health

# 查看 Registry
curl http://localhost:5000/v2/_catalog
```

### 6.3 重启服务
```bash
# 重启 Nginx
nginx -t && nginx -s reload
# 或
pkill nginx && nginx

# 重启 Docker API
pkill -f 'node.*server.js'
cd /opt/docker-api && nohup node server.js > /var/log/docker-api.log 2>&1 &

# 重启 Whisper
ps aux | grep server3.py
kill -9 <PID> && cd /path/to/whisper-server && python3 server3.py &

# 重启 Registry
docker restart registry

# 重启 Registry UI
docker restart registry-ui
```

### 6.4 查看日志
```bash
# Docker API 日志
cat /var/log/docker-api.log
# 或
ps aux | grep node

# Nginx 日志
docker logs devtools-hub

# Registry 日志
docker logs registry

# Registry UI 日志
docker logs registry-ui
```

---

## 7. 镜像管理

### 7.1 网页端管理
访问 **https://110.42.247.238** ，首页蓝色 **镜像管理** 卡片，支持：
- 查看私有仓库中的所有镜像
- 上传本地镜像到私有仓库
- 从私有仓库拉取镜像

### 7.2 命令行管理
```bash
# 登录服务器
ssh devtools

# 上传镜像到私有仓库
# 1. 拉取镜像
docker pull nginx:latest

# 2. 标记镜像
docker tag nginx:latest 110.42.247.238:5000/nginx:latest

# 3. 推送镜像
docker push 110.42.247.238:5000/nginx:latest

# 从私有仓库拉取镜像
docker pull 110.42.247.238:5000/nginx:latest

# 查看仓库中的镜像
curl https://110.42.247.238/registry/v2/_catalog
```

### 7.3 本地快速上传脚本
```bash
# 在项目根目录
./upload-image.sh <镜像名> [标签]

# 示例
./upload-image.sh devtools-hub latest
./upload-image.sh nginx alpine
```

---

## 8. 部署流程 (新机器)

### 8.1 安装 Docker
```bash
curl -fsSL https://get.docker.com | sh
systemctl enable docker
```

### 8.2 部署 Nginx + SSL
```bash
apt update && apt install -y nginx
# 复制 SSL 证书到 /etc/nginx/ssl/
```

### 8.3 部署前端静态文件
```bash
# 将 dist 目录内容复制到 /usr/share/nginx/html
```

### 8.4 部署 Docker API
```bash
mkdir -p /opt/docker-api
# 复制 server.js 和 package.json
cd /opt/docker-api && npm install
nohup node server.js > /var/log/docker-api.log 2>&1 &
```

### 8.5 部署 Registry
```bash
docker run -d --name registry \
  --restart=always \
  -p 5000:5000 \
  -v /opt/registry:/var/lib/registry \
  registry:2
```

### 8.6 部署 Registry UI
```bash
docker run -d --name registry-ui \
  --restart=always \
  -p 8081:80 \
  -e REGISTRY_URL=https://110.42.247.238/registry \
  joxit/docker-registry-ui:latest
```

### 8.7 配置 Nginx 反向代理
```bash
# 编辑 /etc/nginx/sites-enabled/default
# 配置所有 location 代理规则
nginx -t && nginx -s reload
```

---

## 9. 本地开发部署脚本

项目根目录 `build-push.sh` 支持一键构建推送:

```bash
# 构建并部署前端
./build-push.sh devtools-hub

# 构建并部署 Whisper 服务
./build-push.sh whisper-server

# 指定版本标签
./build-push.sh devtools-hub v1.0.0
```

---

## 10. 注意事项

1. **SSL 证书**: 使用自签名证书，浏览器首次访问需手动允许
2. **内存限制**: 服务器仅 3.6GB 内存，运行 Whisper 大模型较吃力
3. **SSH**: 需要 root 权限，配置了免密登录 (key: `~/.ssh/devtools_key`)
4. **Registry IP**: Registry UI 代理使用 Docker 内部 IP，重启容器可能变化
5. **Docker API**: 运行在宿主机而非 Docker 容器内

---

## 11. 联系信息

- 服务器管理: root
- SSH Key: `~/.ssh/devtools_key`
