#!/bin/bash
# 快速部署脚本 - 本地构建并推送到ACR，然后在服务器上部署
# 用法: ./quick-deploy.sh [镜像标签]

set -e

# 配置区域
SERVER="110.42.247.238"
ACR_REGISTRY="registry.cn-hangzhou.aliyuncs.com"
ACR_NAMESPACE="devtools-hub"
ACR_REPO="frontend"
TAG="${1:-latest}"
FULL_IMAGE="${ACR_REGISTRY}/${ACR_NAMESPACE}/${ACR_REPO}:${TAG}"

# 颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
echo_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
echo_error() { echo -e "${RED}[ERROR]${NC} $1"; }
echo_step() { echo -e "\n${CYAN}========== $1 ==========${NC}"; }

# ==================== 主流程 ====================
echo_step "开始部署 - $(date)"
echo_info "镜像: ${FULL_IMAGE}"
echo_info "服务器: ${SERVER}"

# 1. 构建前端
echo_step "1. 构建前端"
cd devtools-hub
npm run build
cd ..

# 2. 构建Docker镜像
echo_step "2. 构建Docker镜像"
docker build -t ${FULL_IMAGE} -f Dockerfile.frontend .

# 3. 推送到ACR
echo_step "3. 推送到ACR"
echo_info "请确保已登录ACR (docker login ${ACR_REGISTRY})"
docker push ${FULL_IMAGE}

# 4. 在服务器上部署
echo_step "4. 在服务器上部署"
ssh root@${SERVER} << EOF
set -e
echo "连接服务器成功"

# 配置
APP_NAME="devtools-hub"
CONTAINER_NAME="\${APP_NAME}-app"

# 1. 登录ACR (如果需要)
# docker login --username=你的用户名 --password=你的密码 ${ACR_REGISTRY}

# 2. 拉取镜像
echo "拉取镜像: ${FULL_IMAGE}"
docker pull ${FULL_IMAGE}

# 3. 停止旧容器
if docker ps -a | grep -q \${CONTAINER_NAME}; then
    echo "停止旧容器"
    docker stop \${CONTAINER_NAME}
    docker rm \${CONTAINER_NAME}
fi

# 4. 启动新容器
echo "启动新容器"
docker run -d \
    --name \${CONTAINER_NAME} \
    --restart=always \
    -p 8081:80 \
    ${FULL_IMAGE}

# 5. 验证
sleep 3
if docker ps | grep -q \${CONTAINER_NAME}; then
    echo -e "${GREEN}✅ 部署成功!${NC}"
    docker ps --filter name=\${CONTAINER_NAME}
    echo ""
    echo "访问地址: http://${SERVER}:8081"
else
    echo -e "${RED}❌ 部署失败!${NC}"
    docker logs \${CONTAINER_NAME}
    exit 1
fi
EOF

echo_step "部署完成! - $(date)"
echo_info "访问地址: http://${SERVER}:8081"
