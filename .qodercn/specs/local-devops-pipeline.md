# 本地 DevOps 流水线选型方案

## Context

项目 `DevTools Hub` 目前已有基础的 Docker 部署脚本 (`local-deploy.sh`)，但缺乏系统化的 CI/CD 流水线。用户希望在本地搭建一整套完整的 DevOps 流水线，覆盖从代码提交到部署的全流程，并倾向于使用 Jenkins 作为 CI/CD 工具，手动触发执行。

### 现有技术栈
- **前端**: React + Vite + TypeScript + Tailwind CSS (`devtools-hub/`)
- **后端**: Express + Node.js (`docker-api/`)
- **部署**: Docker + Nginx + 私有 Registry (`110.42.247.238:5000`)
- **构建**: `npm run build` + `docker build`
- **已有脚本**: `local-deploy.sh`（构建+推送+SSH部署）

### 需求总结
- 完整的 CI/CD 流水线（构建 → 测试 → 质量检查 → 部署）
- CI/CD 工具：Jenkins
- 触发方式：手动触发
- 运行环境：本地（开发机器）

---

## 方案对比

### 方案A：Jenkins + Docker Compose（推荐）

**架构**: 使用 Docker Compose 在本地运行 Jenkins，配合 Docker-in-Docker 实现容器化构建。

**优点**:
- 一键启动/停止，环境隔离，不影响主机
- Jenkins 和构建环境都在容器中，干净可控
- 易于迁移和备份（只需备份 volume）
- 与现有 Docker 部署流程无缝集成

**缺点**:
- 需要理解 Docker-in-Docker 或 Docker-outside-of-Docker 模式
- 初次配置略复杂

**核心组件**:
- Jenkins LTS (Docker)
- Docker-in-Docker (用于构建镜像)
- Jenkinsfile (Pipeline as Code)
- Docker Compose 文件

**流水线阶段**:
1. Checkout 代码
2. Install 依赖 (`npm ci`)
3. Lint 检查 (`npm run lint`)
4. TypeScript 编译检查 (`tsc -b`)
5. 前端构建 (`npm run build`)
6. Docker 镜像构建（前端 + 后端）
7. 推送到本地 Registry
8. 部署到服务器（SSH + Docker）

**文件清单**:
```
jenkins/
├── docker-compose.yml      # Jenkins + DinD 编排
├── Dockerfile              # 自定义 Jenkins 镜像（可选）
└── casc/
    └── jenkins.yml         # Jenkins Configuration as Code
Jenkinsfile                 # 流水线定义（放在项目根目录）
```

---

### 方案B：Jenkins 本地直接安装

**架构**: 在主机上直接安装 Jenkins（通过 Homebrew 或官方安装包），使用主机上的 Docker 进行构建。

**优点**:
- 配置简单直观，传统方式
- 直接使用主机 Docker，无需 DinD 配置
- Jenkins 插件生态最完整

**缺点**:
- 污染主机环境（Java、Jenkins 服务常驻）
- 难以清理和迁移
- macOS 上 Jenkins 用户权限问题（Docker 权限）

**核心组件**:
- Jenkins LTS（本地安装）
- 主机 Docker
- Jenkinsfile

**流水线阶段**: 同方案A

**文件清单**:
```
Jenkinsfile                 # 流水线定义
jenkins/
└── setup.md                # 安装和配置指南
```

---

### 方案C：Jenkins + Kubernetes (Local K8s)

**架构**: 在本地运行 minikube/kind + Jenkins，实现更云原生的 DevOps。

**优点**:
- 最贴近生产环境的实践
- 可扩展性强，支持多环境管理
- 完整的容器编排能力

**缺点**:
- 资源消耗大（minikube 至少需要 2CPU/4GB）
- 学习曲线陡峭
- 对于当前项目规模过重

**适用场景**: 团队规模扩大后迁移，或需要多环境管理时。

---

## 推荐方案：方案A（Jenkins + Docker Compose）

### 选型理由

1. **与现有技术栈一致**: 项目已全面使用 Docker，Jenkins 也用 Docker 运行最自然
2. **环境隔离**: Jenkins 和构建环境完全容器化，不影响主机
3. **易于维护**: `docker compose up/down` 即可管理，配置即代码
4. **可扩展**: 后续可轻松添加 SonarQube、Nexus 等服务

### 实施步骤

1. **创建 `jenkins/docker-compose.yml`**
   - Jenkins 主服务（端口 8080/50000）
   - Docker-in-Docker 服务（用于构建镜像）

2. **创建 `jenkins/casc/jenkins.yml`**
   - 配置管理员账号
   - 预装必要插件（Docker Pipeline、Git、Blue Ocean 等）
   - 配置 Docker 工具

3. **创建项目根目录 `Jenkinsfile`**
   - 定义完整流水线阶段
   - 支持参数化构建（前端/后端/全部）
   - 集成现有 `local-deploy.sh` 逻辑

4. **创建启动脚本 `jenkins/start.sh`**
   - 一键启动 Jenkins
   - 打印访问地址和初始密码

5. **更新文档**
   - `JENKINS_SETUP.md`: 安装和使用指南
   - 更新 `DEPLOY_OPERATIONS.md`

### 关键文件路径

- `jenkins/docker-compose.yml` — Jenkins + DinD 编排
- `jenkins/casc/jenkins.yml` — Jenkins 配置即代码
- `Jenkinsfile` — 流水线定义
- `jenkins/start.sh` — 一键启动脚本
- `JENKINS_SETUP.md` — 使用文档

### 当前问题与修复

**问题**: Jenkins 容器反复重启，日志显示 `Running with Java 17 ... which is older than the minimum required version (Java 21)`。

**原因**: 最新的 `jenkins/jenkins:lts-jdk17` 镜像实际上已要求 Java 21 作为最低版本，但标签仍指向 JDK 17 的镜像。

**修复方案**: 将 `jenkins/docker-compose.yml` 中的镜像从 `jenkins/jenkins:lts-jdk17` 升级为 `jenkins/jenkins:lts-jdk21`。

**执行步骤**:
1. 修改 `jenkins/docker-compose.yml` 镜像为 `jenkins/jenkins:lts-jdk21`（已完成）
2. 停止旧容器 `docker compose down`（已完成）
3. 重新拉取镜像 `docker compose pull`
4. 启动 Jenkins `docker compose up -d`
5. 等待 Jenkins 启动完成并验证健康状态
6. 确认 Jenkins 可通过 http://localhost:8080 访问
7. 重新安装/验证 Jenkins 容器内的 Docker CLI 和 Node.js/npm
8. 验证流水线任务配置和 Git 本地 checkout 权限
9. 手动触发流水线构建，验证全流程

### 验证方式

1. 执行 `./jenkins/start.sh` 启动 Jenkins
2. 访问 http://localhost:8080 确认 Jenkins 正常运行
3. 创建 Pipeline 任务，选择项目的 Git 仓库
4. 手动触发构建，观察各阶段执行
5. 确认最终部署到服务器成功
