# Tekton CI/CD for DevTools Hub

> 将 DevTools Hub 从 Jenkins Pipeline 迁移到 Tekton 原生流水线。

## 流水线概览

```
Git Push → Webhook → Tekton Pipeline:
                         ├─ 📦 git-clone       (克隆代码)
                         ├─ 🔨 npm-build       (安装依赖 → Lint → TypeScript → Vite构建)
                         ├─ 🐳 docker-build    (Kaniko 构建 Docker 镜像 → 推送仓库)
                         └─ 🚀 deploy-ssh      (SSH → rsync 部署到服务器)
```

## 前置条件

| 组件 | 说明 |
|------|------|
| **K8s 集群** | 运行 Tekton 的 Kubernetes 集群 |
| **Tekton Pipelines** | `kubectl apply -f https://storage.googleapis.com/tekton-releases/pipeline/latest/release.yaml` |
| **Tekton Triggers** (可选) | `kubectl apply -f https://storage.googleapis.com/tekton-releases/triggers/latest/release.yaml` |
| **Tekton CLI** | `brew install tektoncd-cli` (macOS) |
| **SSH Key** | `~/.ssh/devtools_key` → 用于部署到 `110.42.247.238` |

## 快速开始

### 1. 安装全部 Tekton 资源

```bash
chmod +x tekton/setup.sh
./tekton/setup.sh
```

脚本会自动：
- 创建 `devtools-hub` namespace
- 创建 SSH 密钥 Secret（`deploy-ssh-keys`）
- 创建 Docker Registry Secret（`docker-registry-auth`）
- 安装所有 Tasks、Pipeline、Triggers

### 2. 触发一次流水线

**方式 A：直接创建 PipelineRun**

```bash
kubectl create -f tekton/pipelinerun/pipelinerun.yaml -n devtools-hub
```

**方式 B：使用 tkn CLI**

```bash
tkn pipeline start devtools-cicd \
  -p repo-url=https://github.com/your-org/devtools-hub.git \
  -p repo-revision=main \
  -p build-target=all \
  -p deploy-target=all \
  -w name=shared-source,claimName=devtools-source-pvc \
  -w name=ssh-keys,secret=deploy-ssh-keys \
  -w name=docker-config,secret=docker-registry-auth \
  -n devtools-hub --showlog
```

### 3. 查看状态

```bash
# 查看 PipelineRun 列表
tkn pipelinerun list -n devtools-hub

# 查看实时日志
tkn pipelinerun logs -f -n devtools-hub

# 通过 kubectl
kubectl get pipelinerun -n devtools-hub
kubectl get taskrun -n devtools-hub --sort-by=.metadata.creationTimestamp
```

## 参数说明

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `repo-url` | `https://github.com/...` | Git 仓库地址 |
| `repo-revision` | `main` | 分支/Tag/Commit |
| `image-registry` | `localhost:5001` | Docker 镜像仓库 |
| `deploy-server` | `110.42.247.238` | 部署目标服务器 |
| `build-target` | `all` | `all` / `frontend-only` / `api-only` |
| `deploy-target` | `frontend` | `frontend` / `docker-api` / `nginx` / `all` |
| `node-version` | `20` | Node.js 版本 |
| `skip-lint` | `false` | 跳过 Lint（加速构建） |

## 文件结构

```
tekton/
├── setup.sh                          # 一键安装脚本
├── tasks/
│   ├── git-clone.yaml                # Git 克隆
│   ├── npm-build.yaml                # npm 安装 + 类型检查 + Vite 构建
│   ├── docker-build-push.yaml        # Kaniko 构建 + 推送镜像
│   └── deploy-ssh.yaml              # SSH 部署到服务器
├── pipeline/
│   └── devtools-cicd.yaml            # 主流水线定义
├── pipelinerun/
│   └── pipelinerun.yaml              # 流水线运行示例
└── triggers/
    └── github-webhook.yaml           # Git Push 自动触发
```

## Webhook 自动触发

安装 Triggers 后，每当 `main` 分支有推送，自动运行完整 CI/CD：

1. 获取 Webhook URL：
   ```bash
   kubectl get eventlistener devtools-github-listener -n devtools-hub -o jsonpath='{.status.address.url}'
   ```
2. 在 GitHub 仓库 Settings → Webhooks 中添加该 URL
3. Content type: `application/json`
4. Events: `Just the push event`

## 与 Jenkins 对比

| 特性 | Jenkins | Tekton |
|------|---------|--------|
| 运行环境 | Jenkins Agent | K8s Pod (每个 Task 独立 Pod) |
| 资源隔离 | Job 级别 | Task 级别 |
| 配置方式 | Groovy (Jenkinsfile) | YAML (声明式) |
| 扩展性 | 插件机制 | Catalog + Custom Task |
| 镜像构建 | Docker Socket | Kaniko (无需 daemon) |
| 触发 | Poll SCM / Webhook | EventListener |
| 凭证管理 | Jenkins Credentials | K8s Secrets |
