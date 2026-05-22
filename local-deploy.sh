#!/bin/bash
# =============================================
#  DevTools Hub 本地 DevOps 一键部署流水线
#  技术选型: Docker + 本地 Registry + SSH
#  用途: 一键构建 → 推送本地 Registry → 服务器部署
# =============================================
#  用法:
#    ./local-deploy.sh [选项] [标签名]
#
#  选项:
#    --frontend-only    仅构建部署前端
#    --api-only         仅构建部署后端
#    --skip-build       跳过构建，直接从 Registry 拉取部署
#    --dry-run          仅打印命令，不执行
#    --help             显示帮助
#
#  示例:
#    ./local-deploy.sh              # 构建全部并部署（自动标签）
#    ./local-deploy.sh v1.2.0       # 使用指定标签
#    ./local-deploy.sh --frontend-only
#    ./local-deploy.sh --skip-build v1.2.0
# =============================================

set -euo pipefail

# ==================== 配置区域 ====================
# 服务器配置
SERVER="110.42.247.238"
SSH_KEY="$HOME/.ssh/devtools_key"
SSH_OPTS="-o StrictHostKeyChecking=no -o ConnectTimeout=10"

# 本地 Registry 配置 (服务器上的私有镜像仓库)
REGISTRY="110.42.247.238:5000"
NAMESPACE="devtools-hub"
FRONTEND_IMAGE="frontend"
API_IMAGE="docker-api"

# 项目路径
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
FRONTEND_DIR="$SCRIPT_DIR/devtools-hub"
API_DIR="$SCRIPT_DIR/docker-api"

# ==================== 颜色输出 ====================
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BLUE='\033[0;34m'; NC='\033[0m'

info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
step()  { echo -e "${YELLOW}[STEP]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
err()   { echo -e "${RED}[ERROR]${NC} $1"; }
title() { echo -e "\n${BLUE}========================================${NC}"; echo -e "${BLUE}  $1${NC}"; echo -e "${BLUE}========================================${NC}"; }

# ==================== 参数解析 ====================
TAG=""
FRONTEND_ONLY=false
API_ONLY=false
SKIP_BUILD=false
DRY_RUN=false

parse_args() {
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --frontend-only) FRONTEND_ONLY=true; shift ;;
            --api-only)      API_ONLY=true; shift ;;
            --skip-build)    SKIP_BUILD=true; shift ;;
            --dry-run)       DRY_RUN=true; shift ;;
            --help)
                sed -n '1,20p' "$0"
                exit 0
                ;;
            --*)
                err "未知选项: $1"
                sed -n '1,20p' "$0"
                exit 1
                ;;
            *)
                if [[ -z "$TAG" ]]; then
                    TAG="$1"
                else
                    warn "忽略多余参数: $1"
                fi
                shift
                ;;
        esac
    done
}

# ==================== 获取镜像标签 ====================
get_image_tag() {
    local tag="${TAG:-}"
    if [[ -z "$tag" ]]; then
        if [[ -d "$SCRIPT_DIR/.git" ]] && command -v git &>/dev/null; then
            tag=$(cd "$SCRIPT_DIR" && git rev-parse --short HEAD 2>/dev/null || date +%Y%m%d%H%M%S)
        else
            tag=$(date +%Y%m%d%H%M%S)
        fi
    fi
    echo "$tag"
}

# ==================== 前置检查 ====================
pre_check() {
    title "🔍 前置检查"

    # 检查 Docker
    if ! command -v docker &>/dev/null; then
        err "未检测到 Docker，请先安装 Docker"
        exit 1
    fi
    info "Docker 已安装: $(docker --version | head -n1)"

    # 检查 SSH
    if ! command -v ssh &>/dev/null; then
        err "未检测到 SSH 客户端"
        exit 1
    fi
    info "SSH 已安装"

    # 检查 SSH Key
    if [[ ! -f "$SSH_KEY" ]]; then
        err "SSH Key 不存在: $SSH_KEY"
        exit 1
    fi
    info "SSH Key: $SSH_KEY"

    # 检查 SSH 连接
    step "测试 SSH 连接..."
    if ! ssh $SSH_OPTS -i "$SSH_KEY" -o ConnectTimeout=5 root@"$SERVER" "echo 'SSH OK'" &>/dev/null; then
        err "SSH 连接失败: $SERVER"
        exit 1
    fi
    info "SSH 连接正常"

    # 检查 Registry 可达性
    step "测试 Registry 连接..."
    if ! curl -s --max-time 5 "http://$REGISTRY/v2/" &>/dev/null; then
        warn "Registry 可能未配置 insecure-registry，如果推送失败请检查 ~/.docker/daemon.json"
    else
        info "Registry 可达: $REGISTRY"
    fi
}

# ==================== 构建前端镜像 ====================
build_frontend() {
    local tag="$1"
    title "🏗️  构建前端镜像"

    step "1/3 构建前端项目..."
    cd "$FRONTEND_DIR"
    npm run build
    info "构建完成: $FRONTEND_DIR/dist"

    step "2/3 构建 Docker 镜像..."
    docker build -t "$REGISTRY/$NAMESPACE/$FRONTEND_IMAGE:$tag" -f "$FRONTEND_DIR/Dockerfile" "$FRONTEND_DIR"
    docker tag "$REGISTRY/$NAMESPACE/$FRONTEND_IMAGE:$tag" "$REGISTRY/$NAMESPACE/$FRONTEND_IMAGE:latest"
    info "镜像构建完成: $REGISTRY/$NAMESPACE/$FRONTEND_IMAGE:$tag"

    step "3/3 推送到本地 Registry..."
    docker push "$REGISTRY/$NAMESPACE/$FRONTEND_IMAGE:$tag"
    docker push "$REGISTRY/$NAMESPACE/$FRONTEND_IMAGE:latest"
    info "推送完成"
}

# ==================== 构建后端镜像 ====================
build_api() {
    local tag="$1"
    title "🏗️  构建 Docker API 镜像"

    step "1/2 构建 Docker 镜像..."
    cd "$API_DIR"
    docker build -t "$REGISTRY/$NAMESPACE/$API_IMAGE:$tag" "$API_DIR"
    docker tag "$REGISTRY/$NAMESPACE/$API_IMAGE:$tag" "$REGISTRY/$NAMESPACE/$API_IMAGE:latest"
    info "镜像构建完成: $REGISTRY/$NAMESPACE/$API_IMAGE:$tag"

    step "2/2 推送到本地 Registry..."
    docker push "$REGISTRY/$NAMESPACE/$API_IMAGE:$tag"
    docker push "$REGISTRY/$NAMESPACE/$API_IMAGE:latest"
    info "推送完成"
}

# ==================== 服务器部署 ====================
deploy_to_server() {
    local tag="$1"
    local deploy_frontend=true
    local deploy_api=true

    if [[ "$FRONTEND_ONLY" == true ]]; then
        deploy_api=false
    elif [[ "$API_ONLY" == true ]]; then
        deploy_frontend=false
    fi

    title "🚀 部署到服务器 ($SERVER)"

    # 使用安全的变量传递方式：将脚本内容写入临时文件，通过 stdin 传递
    # 避免 heredoc 中变量展开的陷阱
    local tmp_script
    tmp_script=$(mktemp)
    trap "rm -f '$tmp_script'" EXIT

    cat > "$tmp_script" << 'SCRIPT_EOF'
set -e

info_remote() { echo -e "\033[0;32m[INFO]\033[0m $1"; }
step_remote() { echo -e "\033[1;33m[STEP]\033[0m $1"; }

# 变量将在本地替换
REGISTRY="__REGISTRY__"
NAMESPACE="__NAMESPACE__"
FRONTEND_IMAGE="__FRONTEND_IMAGE__"
API_IMAGE="__API_IMAGE__"
TAG="__TAG__"
DEPLOY_FRONTEND="__DEPLOY_FRONTEND__"
DEPLOY_API="__DEPLOY_API__"

if [[ "$DEPLOY_FRONTEND" == "true" ]]; then
    step_remote "1/4 拉取前端镜像..."
    docker pull "${REGISTRY}/${NAMESPACE}/${FRONTEND_IMAGE}:${TAG}"

    step_remote "2/4 重启前端容器..."
    docker stop devtools-hub-app 2>/dev/null || true
    docker rm devtools-hub-app 2>/dev/null || true
    docker run -d --name devtools-hub-app --restart=always -p 8081:80 \
        "${REGISTRY}/${NAMESPACE}/${FRONTEND_IMAGE}:${TAG}"
fi

if [[ "$DEPLOY_API" == "true" ]]; then
    step_remote "3/4 拉取 API 镜像..."
    docker pull "${REGISTRY}/${NAMESPACE}/${API_IMAGE}:${TAG}"

    step_remote "4/4 重启 API 容器..."
    docker stop docker-api-app 2>/dev/null || true
    docker rm docker-api-app 2>/dev/null || true
    docker run -d --name docker-api-app --restart=always -p 3000:3000 \
        -v /var/run/docker.sock:/var/run/docker.sock \
        "${REGISTRY}/${NAMESPACE}/${API_IMAGE}:${TAG}"
fi

step_remote "验证部署..."
sleep 3
if docker ps | grep -q devtools-hub-app && docker ps | grep -q docker-api-app; then
    echo -e "\033[0;32m✅ 部署成功!\033[0m"
    docker ps --filter name=devtools-hub-app --filter name=docker-api-app
else
    echo -e "\033[0;31m❌ 部署失败!\033[0m"
    exit 1
fi
SCRIPT_EOF

    # 替换占位符
    sed -i.bak \
        -e "s|__REGISTRY__|$REGISTRY|g" \
        -e "s|__NAMESPACE__|$NAMESPACE|g" \
        -e "s|__FRONTEND_IMAGE__|$FRONTEND_IMAGE|g" \
        -e "s|__API_IMAGE__|$API_IMAGE|g" \
        -e "s|__TAG__|$tag|g" \
        -e "s|__DEPLOY_FRONTEND__|$deploy_frontend|g" \
        -e "s|__DEPLOY_API__|$deploy_api|g" \
        "$tmp_script"
    rm -f "$tmp_script.bak"

    if [[ "$DRY_RUN" == true ]]; then
        title "[DRY RUN] 远程执行脚本"
        cat "$tmp_script"
        return 0
    fi

    # 通过 stdin 传递脚本到远程服务器执行
    ssh $SSH_OPTS -i "$SSH_KEY" root@"$SERVER" 'bash -s' < "$tmp_script"

    rm -f "$tmp_script"
    trap - EXIT
}

# ==================== 主流程 ====================
main() {
    parse_args "$@"

    local tag
    tag=$(get_image_tag)

    title "DevTools Hub 本地 DevOps 流水线"
    echo -e "  镜像标签: ${CYAN}$tag${NC}"
    echo -e "  Registry: ${CYAN}$REGISTRY${NC}"
    echo -e "  服务器:   ${CYAN}$SERVER${NC}"
    echo ""

    # 前置检查
    pre_check
    echo ""

    # 构建阶段（可跳过）
    if [[ "$SKIP_BUILD" != true ]]; then
        if [[ "$FRONTEND_ONLY" == true ]]; then
            build_frontend "$tag"
            echo ""
        elif [[ "$API_ONLY" == true ]]; then
            build_api "$tag"
            echo ""
        else
            build_frontend "$tag"
            echo ""
            build_api "$tag"
            echo ""
        fi
    else
        info "跳过构建 (--skip-build)"
    fi

    # 部署阶段
    deploy_to_server "$tag"

    title "✅ 全部部署完成"
    echo -e ""
    echo -e "  ${GREEN}前端:${NC}    http://$SERVER:8081"
    echo -e "  ${GREEN}API:${NC}     http://$SERVER:3000"
    echo -e "  ${GREEN}镜像:${NC}    $REGISTRY/$NAMESPACE/$FRONTEND_IMAGE:$tag"
    echo -e ""
}

# ==================== 入口 ====================
main "$@"
