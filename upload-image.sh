#!/bin/bash
# 简易镜像上传工具
# 用法: ./upload-image.sh [镜像名] [标签]
set -e

SERVER="110.42.247.238"
REGISTRY="${SERVER}:5000"

# 颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
echo_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
echo_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 检查参数
if [ -z "$1" ]; then
    echo "用法: $0 <镜像名> [标签]"
    echo ""
    echo "示例:"
    echo "  $0 devtools-hub                # 使用默认标签 latest"
    echo "  $0 devtools-hub v1.0.0        # 使用指定标签"
    echo "  $0 whisper-server latest      # 上传 whisper-server"
    echo ""
    echo "当前服务器可用镜像列表:"
    ssh root@${SERVER} "docker images | grep -E '^${REGISTRY}' | awk '{print \$1\":\"\$2}'" 2>/dev/null || echo_warn "无法获取镜像列表"
    exit 1
fi

IMAGE_NAME="$1"
IMAGE_TAG="${2:-latest}"
FULL_IMAGE="${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}"

echo_info "准备上传镜像: ${FULL_IMAGE}"
echo_info "步骤: pull -> tag -> push"
echo ""

# 1. 拉取镜像
echo_info "1. 拉取镜像 ${IMAGE_NAME}:${IMAGE_TAG}..."
docker pull "${IMAGE_NAME}:${IMAGE_TAG}" 2>/dev/null || docker pull "library/${IMAGE_NAME}:${IMAGE_TAG}" 2>/dev/null || {
    echo_error "拉取镜像失败: ${IMAGE_NAME}:${IMAGE_TAG}"
    exit 1
}

# 2. 标记镜像
echo_info "2. 标记镜像..."
docker tag "${IMAGE_NAME}:${IMAGE_TAG}" "${FULL_IMAGE}"

# 3. 推送到私有仓库
echo_info "3. 推送到私有仓库..."
docker push "${FULL_IMAGE}"

echo ""
echo_info "✅ 上传成功!"
echo_info "镜像地址: ${FULL_IMAGE}"
echo ""
echo_info "在服务器上使用:"
echo "  docker pull ${FULL_IMAGE}"
