#!/bin/bash
# 阿里云DevOps Agent部署脚本
# 从ACR拉取镜像并部署到服务器

set -e

# ==================== 配置区域 ====================
# ACR配置 (请根据你的实际情况修改)
ACR_REGISTRY="registry.cn-hangzhou.aliyuncs.com"  # 你的ACR区域地址
ACR_NAMESPACE="devtools-hub"                        # 你的命名空间
ACR_REPO="frontend"                                 # 你的镜像仓库名
IMAGE_TAG="${IMAGE_TAG:-latest}"                    # 镜像标签

# 部署配置
APP_NAME="devtools-hub"
CONTAINER_NAME="${APP_NAME}-app"
SERVER_IP="110.42.247.238"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# ==================== 辅助函数 ====================
echo_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
echo_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
echo_error() { echo -e "${RED}[ERROR]${NC} $1"; }
echo_step() { echo -e "\n${CYAN}========== $1 ==========${NC}"; }

# ==================== 部署流程 ====================
echo_step "部署开始 $(date)"
echo_info "应用: ${APP_NAME}"
echo_info "镜像: ${ACR_REGISTRY}/${ACR_NAMESPACE}/${ACR_REPO}:${IMAGE_TAG}"

# 1. 拉取最新镜像
echo_step "1. 拉取镜像"
docker pull "${ACR_REGISTRY}/${ACR_NAMESPACE}/${ACR_REPO}:${IMAGE_TAG}"

# 2. 停止并删除旧容器
echo_step "2. 清理旧容器"
if [ "$(docker ps -a -q -f name=${CONTAINER_NAME})" ]; then
    echo_info "停止容器: ${CONTAINER_NAME}"
    docker stop ${CONTAINER_NAME} || true
    echo_info "删除容器: ${CONTAINER_NAME}"
    docker rm ${CONTAINER_NAME} || true
fi

# 3. 启动新容器
echo_step "3. 启动新容器"
docker run -d \
    --name ${CONTAINER_NAME} \
    --restart=always \
    -p 8081:80 \
    "${ACR_REGISTRY}/${ACR_NAMESPACE}/${ACR_REPO}:${IMAGE_TAG}"

# 4. 验证部署
echo_step "4. 验证部署"
sleep 3
if docker ps | grep -q ${CONTAINER_NAME}; then
    echo_info "✅ 部署成功!"
    docker ps --filter name=${CONTAINER_NAME}
    echo ""
    echo_info "访问地址: http://${SERVER_IP}:8081"
else
    echo_error "❌ 部署失败!"
    docker logs ${CONTAINER_NAME}
    exit 1
fi

echo_step "部署完成 $(date)"
