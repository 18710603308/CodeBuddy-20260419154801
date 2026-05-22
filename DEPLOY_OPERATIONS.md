# DevTools Hub 本地 DevOps 流水线 — 使用与运维文档

> 本文档由 AI 辅助生成，与 `local-deploy.sh` 配套使用。
> 每次流水线变更后请同步更新此文档。

---

## 目录

1. [架构概览](#1-架构概览)
2. [环境准备](#2-环境准备)
3. [首次部署](#3-首次部署)
4. [日常使用](#4-日常使用)
5. [运维命令速查](#5-运维命令速查)
6. [常见问题排查](#6-常见问题排查)
7. [回滚方案](#7-回滚方案)
8. [变更记录](#8-变更记录)

---

## 1. 架构概览

```
┌─────────────────────────────────────────────────────────────────┐
│                          你的本地开发机                           │
│  ┌─────────────┐    ┌────────────────┐    ┌──────────────────┐ │
│  │ npm run     │ →  │ docker build   │ →  │ docker push      │ │
│  │ build       │    │ 构建镜像       │    │ 到本地 Registry  │ │
│  └─────────────┘    └────────────────┘    └──────────────────┘ │
│         │                                              │        │
│         │                                              ▼        │
│         │                                       ┌──────────┐   │
│         │                                       │ 110.42.  │   │
│         │                                       │ 247.238: │   │
│         │                                       │ 5000     │   │
│         │                                       │ Registry │   │
│         │                                       └──────────┘   │
│         │                                              ▲        │
│         │           SSH 远程执行                        │        │
│         └──────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        生产服务器 (110.42.247.238)                │
│  ┌────────────────┐    ┌─────────────────┐    ┌──────────┐     │
│  │ docker pull    │ →  │ docker run      │ →  │ Nginx    │     │
│  │ 从 Registry    │    │ 启动容器        │    │ 反向代理 │     │
│  └────────────────┘    └─────────────────┘    └──────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

### 流水线特点

| 特点 | 说明 |
|------|------|
| **一键执行** | 单条命令 `./local-deploy.sh` 完成全部流程 |
| **本地 Registry** | 使用服务器上的私有 Docker Registry，无需外部云服务 |
| **自动标签** | 默认使用 `git commit hash`，支持自定义标签 |
| **增量部署** | 支持 `--frontend-only`、`--api-only` 灵活选择 |
| **跳过构建** | 支持 `--skip-build` 直接从 Registry 拉取部署 |

---

## 2. 环境准备

### 2.1 本地环境

| 依赖 | 版本要求 | 检查命令 |
|------|----------|----------|
| Docker | ≥ 20.10 | `docker --version` |
| Node.js | ≥ 18 | `node --version` |
| SSH 客户端 | - | `ssh -V` |
| curl | - | `curl --version` |

### 2.2 配置 Docker Insecure Registry

本地机器需要信任服务器的私有 Registry，编辑 `~/.docker/daemon.json`：

```json
{
  "insecure-registries": ["110.42.247.238:5000"]
}
```

**重启 Docker**（根据你的系统选择）：

```bash
# macOS (Docker Desktop)
# 通过 GUI 设置 → Docker Engine → 添加 insecure-registries → Apply & Restart

# Linux
sudo systemctl restart docker

# 验证
python3 -c "import json; print(json.load(open('/etc/docker/daemon.json')))"
```

### 2.3 配置 SSH 免密登录

```bash
# 检查 SSH Key 是否存在
ls -la ~/.ssh/devtools_key

# 测试连接
ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 -i ~/.ssh/devtools_key root@110.42.247.238
```

### 2.4 服务器端检查 Registry

```bash
# 在服务器上检查 Registry 是否运行
docker ps | grep registry

# 测试 Registry API
curl http://localhost:5000/v2/_catalog

# 如果 Registry 未运行，手动启动
# docker run -d --name registry --restart=always -p 5000:5000 registry:2
```

---

## 3. 首次部署

### 步骤 1：确保依赖安装

```bash
cd /Users/wangjiancai/CodeBuddy/20260419154801

# 安装前端依赖
cd devtools-hub && npm install

cd ../docker-api && npm install
cd ..
```

### 步骤 2：赋予脚本执行权限

```bash
chmod +x local-deploy.sh
```

### 步骤 3：执行首次部署

```bash
# 一键构建并部署全部服务
./local-deploy.sh

# 输出示例：
# ========================================
#   DevTools Hub 本地 DevOps 流水线
# ========================================
#   镜像标签: a3f2c91
#   Registry: 110.42.247.238:5000
#   服务器:   110.42.247.238
#
# [STEP] 测试 SSH 连接...
# [INFO] SSH 连接正常
# [STEP] 测试 Registry 连接...
# [INFO] Registry 可达: 110.42.247.238:5000
# ...
# [STEP] 3/3 推送到本地 Registry...
# [INFO] 推送完成
# ...
# [STEP] 1/4 拉取前端镜像...
# [STEP] 3/4 重启前端容器...
# ...
# [STEP] 验证部署...
# ✅ 部署成功!
# ========================================
#   ✅ 全部部署完成
# ========================================
#   前端:    http://110.42.247.238:8081
#   API:     http://110.42.247.238:3000
#   镜像:    110.42.247.238:5000/devtools-hub/frontend:a3f2c91
```

---

## 4. 日常使用

### 4.1 命令行参数

| 参数 | 简写 | 说明 | 示例 |
|------|------|------|------|
| `--frontend-only` | - | 仅构建部署前端 | `./local-deploy.sh --frontend-only` |
| `--api-only` | - | 仅构建部署后端 | `./local-deploy.sh --api-only` |
| `--skip-build` | - | 跳过构建，直接部署 | `./local-deploy.sh --skip-build` |
| `--dry-run` | - | 仅打印命令，不执行 | `./local-deploy.sh --dry-run` |
| `--help` | - | 显示帮助信息 | `./local-deploy.sh --help` |
| `[标签名]` | - | 自定义镜像标签 | `./local-deploy.sh v1.2.0` |

### 4.2 典型使用场景

#### 场景 1：常规部署（修改前端代码后）

```bash
# 前端修改后，一键构建并部署
./local-deploy.sh --frontend-only
```

#### 场景 2：修改后端 API 后

```bash
# 后端修改后，一键构建并部署
./local-deploy.sh --api-only
```

#### 场景 3：发布版本

```bash
# 发布 v1.2.0 版本
./local-deploy.sh v1.2.0
```

#### 场景 4：回滚到上一个版本

```bash
# 跳过构建，直接从 Registry 拉取上一个版本
./local-deploy.sh --skip-build v1.1.0
```

#### 场景 5：测试部署脚本

```bash
# 只打印命令，不实际执行
./local-deploy.sh --dry-run v1.2.0
```

---

## 5. 运维命令速查

### 5.1 本地操作

```bash
# 查看本地构建的镜像
docker images | grep devtools-hub

# 查看本地 Registry 中的镜像列表
curl http://110.42.247.238:5000/v2/_catalog

# 查看某个镜像的标签列表
curl http://110.42.247.238:5000/v2/devtools-hub/frontend/tags/list

# 手动推送镜像到 Registry
docker push 110.42.247.238:5000/devtools-hub/frontend:latest
```

### 5.2 服务器操作

```bash
# SSH 登录服务器
ssh -i ~/.ssh/devtools_key root@110.42.247.238

# 查看运行中的容器
docker ps

# 查看前端容器日志
docker logs devtools-hub-app -f

# 查看 API 容器日志
docker logs docker-api-app -f

# 重启前端容器
docker restart devtools-hub-app

# 重启 API 容器
docker restart docker-api-app

# 停止并删除容器
docker stop devtools-hub-app docker-api-app
docker rm devtools-hub-app docker-api-app

# 查看 Registry 存储的镜像
curl http://localhost:5000/v2/_catalog
```

### 5.3 镜像清理

```bash
# 服务器上清理旧镜像（保留最新 3 个标签）
docker images --format "{{.Repository}}:{{.Tag}}" | grep "110.42.247.238:5000" | sort | head -n -3 | xargs -r docker rmi

# 清理 dangling 镜像
docker image prune -f
```

---

## 6. 常见问题排查

### 6.1 SSH 连接失败

**现象**:
```
[ERROR] SSH 连接失败: 110.42.247.238
```

**排查步骤**:
```bash
# 1. 检查 SSH Key 是否存在
ls -la ~/.ssh/devtools_key

# 2. 手动测试 SSH
ssh -v -i ~/.ssh/devtools_key root@110.42.247.238

# 3. 检查服务器 SSH 端口是否开放
curl -v telnet://110.42.247.238:22
```

### 6.2 Docker Registry 推送失败

**现象**:
```
The push refers to repository [...]
Get "https://110.42.247.238:5000/v2/": http: server gave HTTP response to HTTPS client
```

**原因**: 本地 Docker 未配置 insecure-registry

**解决**:
```bash
# 编辑 Docker 配置
cat << 'EOF' > ~/.docker/daemon.json
{
  "insecure-registries": ["110.42.247.238:5000"]
}
EOF

# 重启 Docker
sudo systemctl restart docker
```

### 6.3 Registry 拉取失败（服务器端）

**现象**:
```
Error response from daemon: Get http://110.42.247.238:5000/v2/: dial tcp 110.42.247.238:5000: connect: connection refused
```

**原因**: 服务器上的 Docker 也需要配置 insecure-registry

**解决**: 在服务器 `/etc/docker/daemon.json` 中添加：
```json
{
  "insecure-registries": ["110.42.247.238:5000"]
}
```
然后 `sudo systemctl restart docker`

### 6.4 前端构建失败

**现象**:
```
npm run build 失败
```

**排查**:
```bash
cd devtools-hub

# 1. 清除缓存重新安装
rm -rf node_modules package-lock.json
npm install

# 2. 单独构建测试
npm run build
```

### 6.5 容器启动后无法访问

**现象**: 部署成功但 8081 端口无法访问

**排查**:
```bash
# 服务器上检查
ssh root@110.42.247.238

# 检查容器状态
docker ps --filter name=devtools-hub-app

# 检查端口监听
ss -tlnp | grep 8081

# 检查防火墙
ufw status
iptables -L | grep 8081
```

---

## 7. 回滚方案

### 7.1 快速回滚到上一版本

```bash
# 查看可用的历史标签
curl http://110.42.247.238:5000/v2/devtools-hub/frontend/tags/list

# 回滚到指定版本（跳过重新构建）
./local-deploy.sh --skip-build v1.1.0
```

### 7.2 手动回滚

如果自动回滚失败，可以手动在服务器上操作：

```bash
# SSH 到服务器
ssh root@110.42.247.238

# 列出可用镜像
docker images | grep devtools-hub

# 停止当前容器
docker stop devtools-hub-app
docker rm devtools-hub-app

# 运行旧版本镜像
docker run -d --name devtools-hub-app --restart=always -p 8081:80 \
    110.42.247.238:5000/devtools-hub/frontend:PREVIOUS_TAG
```

### 7.3 紧急回滚到 deploy.sh

如果 Docker 部署完全失败，可以使用原有的 `deploy.sh` 回退到静态文件部署：

```bash
# 本地执行
./deploy.sh frontend
```

---

## 8. Jenkins CI/CD 流水线

基于 Jenkins + Docker Compose 的完整 CI/CD 流水线，覆盖从代码提交到部署的全流程。

### 8.1 架构概览

```
┌─────────────────────────────────────────────────────────────────┐
│                        本地开发机                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  Jenkins (Docker)                        │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐              │   │
│  │  │ Checkout │  │  Build   │  │  Deploy  │              │   │
│  │  └──────────┘  └──────────┘  └──────────┘              │   │
│  └─────────────────────────────────────────────────────────┘   │
│              │                              │                  │
│              ▼                              ▼                  │
│       ┌──────────┐                ┌──────────────┐          │
│       │ Registry   │                │  生产服务器   │          │
│       │ :5001      │                │  :8081/:3000 │          │
│       └──────────┘                └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

### 8.2 核心文件

| 文件 | 作用 |
|------|------|
| `jenkins/docker-compose.yml` | Jenkins + Registry 容器编排 |
| `jenkins/casc/jenkins.yml` | Jenkins 配置即代码 |
| `Jenkinsfile` | 流水线定义 |
| `jenkins/start.sh` | 一键启动脚本 |

### 8.3 启动 Jenkins

```bash
# 1. 赋予执行权限
chmod +x jenkins/start.sh

# 2. 一键启动
./jenkins/start.sh
```

启动后访问：**http://localhost:8080**

| 项目 | 值 |
|------|-----|
| 账号 | `admin` |
| 密码 | `admin123` |
| Jenkins 地址 | http://localhost:8080 |
| 本地 Registry | http://localhost:5001 |

### 8.4 流水线阶段

```
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│ Checkout │ → │ Install  │ → │  Lint &  │ → │  Build   │
│          │   │   Deps   │   │   TS     │   │ Frontend │
└──────────┘   └──────────┘   └──────────┘   └──────────┘
                                                  │
                              ┌───────────────────┼───────────────────┐
                              ▼                   ▼                   ▼
                        ┌──────────┐     ┌──────────┐     ┌──────────┐
                        │  Build   │     │   Push   │     │  Deploy  │
                        │  Docker  │ →   │ Registry │  →  │  Server  │
                        │  Images  │     │          │     │          │
                        └──────────┘     └──────────┘     └──────────┘
```

### 8.5 构建参数

启动构建时可选择以下参数：

| 参数 | 选项 | 说明 |
|------|------|------|
| `BUILD_TARGET` | `all` / `frontend-only` / `api-only` | 选择构建目标 |
| `DEPLOY_STAGE` | `build-and-deploy` / `build-only` / `deploy-only` | 选择部署阶段 |
| `CUSTOM_TAG` | 任意字符串 | 自定义镜像标签（留空使用 git commit hash） |

### 8.6 手动触发构建

```bash
# 方式1: Jenkins Web UI
# 访问 http://localhost:8080 → 选择任务 → "Build with Parameters"

# 方式2: Jenkins CLI (可选)
# java -jar jenkins-cli.jar -s http://localhost:8080/ build DevTools-Hub-Pipeline \
#   -p BUILD_TARGET=all -p DEPLOY_STAGE=build-and-deploy
```

### 8.7 日常运维

```bash
# 查看 Jenkins 日志
docker logs -f devtools-jenkins

# 重启 Jenkins
docker compose -f jenkins/docker-compose.yml restart

# 停止 Jenkins
docker compose -f jenkins/docker-compose.yml down

# 进入 Jenkins 容器
docker exec -it devtools-jenkins bash

# 查看本地 Registry 镜像
curl http://localhost:5001/v2/_catalog
```

### 8.8 故障排查

**Jenkins 无法启动**

```bash
# 检查容器状态
docker ps | grep devtools-jenkins

# 查看详细日志
docker logs devtools-jenkins --tail 100

# 检查端口占用
lsof -i :8080
```

**构建失败 - Docker 权限**

```bash
# 确保 Jenkins 容器可以访问 Docker
docker exec devtools-jenkins docker ps

# 如果失败，检查 docker.sock 挂载
docker inspect devtools-jenkins | grep -A 5 Mounts
```

**推送 Registry 失败**

```bash
# 检查 Registry 是否运行
curl http://localhost:5001/v2/_catalog

# 检查 Jenkins 容器是否能访问 Registry
docker exec devtools-jenkins curl http://registry:5000/v2/_catalog
```

---

## 9. 变更记录

| 日期 | 变更内容 | 影响 |
|------|----------|------|
| 2026-05-21 | 创建 `local-deploy.sh` 本地 DevOps 流水线 | 新增部署方式 |
| 2026-05-21 | 创建 `DEPLOY_OPERATIONS.md` 使用运维文档 | 新增文档 |
| 2026-05-21 | 新增 Jenkins CI/CD 流水线 (`jenkins/`, `Jenkinsfile`) | 新增 CI/CD 方式 |

---

## 附录：完整文件清单

| 文件 | 用途 |
|------|------|
| `local-deploy.sh` | 本地 DevOps 一键部署脚本 |
| `DEPLOY_OPERATIONS.md` | 本使用运维文档 |
| `PROJECT_DOCUMENTATION.md` | 项目总体文档 |
| `deploy.sh` | 原有 SSH 静态文件部署脚本（备用回滚） |
| `.aliyun/quick-deploy.sh` | 阿里云 ACR 部署脚本（备用） |
