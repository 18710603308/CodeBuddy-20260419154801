# 阿里云DevOps 流水线配置指南

## 📋 前置准备

### 1. 配置ACR镜像仓库

#### 1.1 创建命名空间和仓库

1. 访问 [阿里云容器镜像服务 ACR 控制台](https://cr.console.aliyun.com/)
2. 创建**个人版**实例
3. 创建**命名空间**，例如: `devtools-hub`
4. 创建**镜像仓库**，例如: `frontend`
5. 设置仓库为公开或私有

#### 1.2 获取访问凭证

在 ACR 控制台 -> 访问凭证 -> 设置固定密码

### 2. 确认腾讯云服务器上配置

服务器已安装并运行阿里云 DevOps Agent (已完成✅)

---

## 🚀 流水线配置步骤

### 步骤 1: 创建代码源关联

1. 访问 [阿里云 DevOps 控制台](https://devops.aliyun.com/)
2. 进入你的项目 -> 代码源
3. 关联你的 GitHub/GitLab 仓库

### 步骤 2: 创建流水线

1. 进入**流水线** -> **新建流水线**
2. 选择**空白模板**
3. 配置如下:

#### 阶段 1: 构建镜像

**任务1: 拉取代码**
- 任务类型: 拉取代码
- 代码源: 选择你的仓库

**任务2: 构建Docker镜像**
- 任务类型: Docker 构建
- Dockerfile 路径: `Dockerfile.frontend`
- 镜像标签: `registry.cn-hangzhou.aliyuncs.com/devtools-hub/frontend:${DATETIME}`

**任务3: 推送到ACR**
- 任务类型: Docker 推送
- 镜像标签: 同构建标签
- 配置 Docker 仓库连接: 选择你的ACR连接

#### 阶段 2: 部署到服务器

**任务: SSH执行**
- 选择你的主机（腾讯云主机）
- 执行脚本:

```bash
cd /root
# 创建部署脚本
cat > deploy.sh << 'EOF'
#!/bin/bash
set -e

# ACR配置
ACR_REGISTRY="registry.cn-hangzhou.aliyuncs.com"
ACR_NAMESPACE="devtools-hub"
ACR_REPO="frontend"
IMAGE_TAG="${DATETIME}"
APP_NAME="devtools-hub"
CONTAINER_NAME="${APP_NAME}-app"

# 1. 登录ACR
docker login --username=你的用户名 --password=你的密码 ${ACR_REGISTRY}

# 2. 拉取镜像
docker pull ${ACR_REGISTRY}/${ACR_NAMESPACE}/${ACR_REPO}:${IMAGE_TAG}

# 3. 停止旧容器
if docker ps -a | grep -q ${CONTAINER_NAME}; then
    docker stop ${CONTAINER_NAME}
    docker rm ${CONTAINER_NAME}
fi

# 4. 启动新容器
docker run -d \
    --name ${CONTAINER_NAME} \
    --restart=always \
    -p 8081:80 \
    ${ACR_REGISTRY}/${ACR_NAMESPACE}/${ACR_REPO}:${IMAGE_TAG}

# 5. 验证
sleep 3
docker ps | grep ${CONTAINER_NAME}
echo "部署完成！"
EOF

# 执行部署
chmod +x deploy.sh
bash deploy.sh
```

---

## 📝 变量配置

在流水线配置中设置以下变量:

| 变量名 | 示例值 | 说明 |
|--------|--------|------|
| `registry` | `registry.cn-hangzhou.aliyuncs.com` | ACR地址 |
| `namespace` | `devtools-hub` | 命名空间 |
| `repo` | `frontend` | 仓库名 |
| `tag` | `${DATETIME}` 或 `latest` | 镜像标签 |

---

## 🔧 手动构建脚本

如果你想本地测试构建和推送:

```bash
# 构建
docker build -t registry.cn-hangzhou.aliyuncs.com/devtools-hub/frontend:latest -f Dockerfile.frontend .

# 登录并推送
docker login --username=你的用户名 registry.cn-hangzhou.aliyuncs.com
docker push registry.cn-hangzhou.aliyuncs.com/devtools-hub/frontend:latest

# 使用快速部署脚本
cd .aliyun
chmod +x quick-deploy.sh
./quick-deploy.sh latest
```

---

## 📊 完整工作流

```
代码提交 → 触发流水线
    ↓
构建Docker镜像
    ↓
推送至ACR
    ↓
Agent拉取镜像
    ↓
停止旧容器
    ↓
启动新容器
    ↓
✅ 部署成功
```

---

## 📁 项目文件结构

```
.aliyun/
├── deploy-to-server.sh   # 服务器端部署脚本
├── quick-deploy.sh       # 本地快速部署脚本
├── pipeline.yml          # 流水线配置示例
└── README.md             # 本文档
```
