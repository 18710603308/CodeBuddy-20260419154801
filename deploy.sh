#!/bin/bash
# =============================================
#  DevTools Hub DevOps 一键部署流水线
#  用法: ./deploy.sh [服务名] [选项]
# =============================================
#  服务名:
#    frontend    - 前端静态资源 (默认)
#    docker-api  - Docker API 后端服务
#    nginx       - Nginx 配置
#    all         - 全部部署
#
#  选项:
#    --incremental / -i   增量部署 (rsync，只传变化的文件)
#    --skip-build  / -s   跳过构建 (使用已有 dist)
#
#  示例:
#    ./deploy.sh                     # 全量部署前端
#    ./deploy.sh frontend -i         # 增量部署前端
#    ./deploy.sh frontend -s -i      # 跳过构建 + 增量部署
#    ./deploy.sh all                 # 一键全部部署
# =============================================
set -e

# ==================== 配置 ====================
SERVER="110.42.247.238"
SSH_KEY="$HOME/.ssh/devtools_key"
SSH_OPTS="-o StrictHostKeyChecking=no -o ConnectTimeout=10"

# 本地路径
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
FRONTEND_DIR="$SCRIPT_DIR/devtools-hub"
DOCKER_API_DIR="$SCRIPT_DIR/docker-api"
NGINX_CONF="$SCRIPT_DIR/nginx.conf"

# 服务器路径
SERVER_FRONTEND="/usr/share/nginx/html"
SERVER_DOCKER_API="/opt/docker-api"
SERVER_NGINX="/etc/nginx/sites-enabled/default"

# ==================== 颜色 ====================
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BLUE='\033[0;34m'; NC='\033[0m'

info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
step()  { echo -e "${YELLOW}[STEP]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
err()   { echo -e "${RED}[ERROR]${NC} $1"; }
title() { echo -e "\n${BLUE}========================================${NC}"; echo -e "${BLUE}  $1${NC}"; echo -e "${BLUE}========================================${NC}"; }

# ==================== 工具函数 ====================

remote() {
    ssh $SSH_OPTS -i "$SSH_KEY" root@"$SERVER" "$@"
}

upload_dir() {
    local local_dir="$1"
    local remote_dir="$2"
    info "上传目录: $local_dir → $remote_dir"
    cd "$local_dir"
    tar -czf /tmp/deploy.tar.gz .
    scp $SSH_OPTS -i "$SSH_KEY" /tmp/deploy.tar.gz root@"$SERVER":/tmp/
    remote "rm -rf $remote_dir/* && cd $remote_dir && tar -xzf /tmp/deploy.tar.gz && rm /tmp/deploy.tar.gz"
    rm -f /tmp/deploy.tar.gz
    info "上传完成"
}

# ==================== 部署步骤 ====================

deploy_frontend() {
    local mode="${1:-full}"  # full | incremental
    local skip_build="${2:-false}"

    if [ "$skip_build" = "true" ]; then
        title "🚀 部署前端 (devtools-hub) [跳过构建]"
    else
        title "🚀 部署前端 (devtools-hub)"
    fi

    if [ "$skip_build" != "true" ]; then
        step "1/4 构建项目..."
        cd "$FRONTEND_DIR"
        [ -d node_modules ] || npm install
        npm run build
        info "构建完成: $FRONTEND_DIR/dist"
    fi

    step "2/4 备份服务器旧文件..."
    remote "cp -r $SERVER_FRONTEND /tmp/html-backup-\$(date +%Y%m%d%H%M) 2>/dev/null || true"

    if [ "$mode" = "incremental" ]; then
        step "3/4 增量同步 (rsync)..."
        rsync -avz --delete \
            -e "ssh $SSH_OPTS -i $SSH_KEY" \
            "$FRONTEND_DIR/dist/" \
            "root@$SERVER:$SERVER_FRONTEND/"
        info "增量同步完成"
    else
        step "3/4 上传并替换静态文件..."
        cd "$FRONTEND_DIR/dist"
        tar -czf /tmp/frontend.tar.gz .
        scp $SSH_OPTS -i "$SSH_KEY" /tmp/frontend.tar.gz root@"$SERVER":/tmp/
        remote "rm -rf $SERVER_FRONTEND/* && cd $SERVER_FRONTEND && tar -xzf /tmp/frontend.tar.gz && rm /tmp/frontend.tar.gz"
        rm -f /tmp/frontend.tar.gz
    fi

    step "4/4 验证..."
    local status=$(remote "curl -s -o /dev/null -w '%{http_code}' http://localhost/")
    if [ "$status" = "200" ] || [ "$status" = "301" ]; then
        info "✅ 前端部署成功 (HTTP $status)"
    else
        warn "⚠️ 前端返回 HTTP $status，请检查"
    fi

    info "访问: https://$SERVER"
}

deploy_docker_api() {
    title "🚀 部署 Docker API"

    step "1/3 上传代码..."
    cd "$DOCKER_API_DIR"
    npm install --silent 2>/dev/null || true
    tar -czf /tmp/docker-api.tar.gz --exclude=node_modules .
    scp $SSH_OPTS -i "$SSH_KEY" /tmp/docker-api.tar.gz root@"$SERVER":/tmp/
    remote "mkdir -p $SERVER_DOCKER_API && cd $SERVER_DOCKER_API && tar -xzf /tmp/docker-api.tar.gz && npm install --silent && rm /tmp/docker-api.tar.gz"
    rm -f /tmp/docker-api.tar.gz

    step "2/3 重启服务..."
    remote "pkill -f 'node.*server.js' 2>/dev/null || true && sleep 1 && cd $SERVER_DOCKER_API && nohup node server.js > /var/log/docker-api.log 2>&1 &"

    step "3/3 验证..."
    sleep 2
    local result=$(remote "curl -s http://localhost:3000/api/docker-images | head -c 50")
    if echo "$result" | grep -q '"success"'; then
        info "✅ Docker API 部署成功"
    else
        warn "⚠️ Docker API 可能未就绪"
    fi

    info "API 地址: https://$SERVER/api/docker"
}

deploy_nginx() {
    title "🚀 部署 Nginx 配置"

    step "1/2 上传配置文件..."
    if [ -f "$NGINX_CONF" ]; then
        scp $SSH_OPTS -i "$SSH_KEY" "$NGINX_CONF" root@"$SERVER":"$SERVER_NGINX"
    else
        warn "未找到本地 nginx.conf，使用服务器现有配置"
    fi

    step "2/2 重载 Nginx..."
    remote "nginx -t && nginx -s reload"

    info "✅ Nginx 配置部署成功"
}

deploy_all() {
    title "一键部署全部服务"
    echo -e "  服务器: ${CYAN}$SERVER${NC}"
    echo -e "  时间:   ${CYAN}$(date '+%Y-%m-%d %H:%M:%S')${NC}"
    echo ""

    deploy_frontend
    echo ""
    deploy_docker_api
    echo ""
    deploy_nginx

    title "✅ 全部部署完成"
    echo -e ""
    echo -e "  ${GREEN}前端:${NC}      https://$SERVER"
    echo -e "  ${GREEN}镜像管理:${NC}  https://$SERVER (首页蓝色卡片)"
    echo -e "  ${GREEN}Docker API:${NC} https://$SERVER/api/docker"
    echo ""
}

# ==================== 帮助 ====================

show_help() {
    echo "DevTools Hub DevOps 一键部署流水线"
    echo ""
    echo "用法: ./deploy.sh [服务名]"
    echo ""
    echo "服务名:"
    echo "  frontend    部署前端静态资源 (默认)"
    echo "  docker-api  部署 Docker API 后端"
    echo "  nginx       部署 Nginx 配置"
    echo "  all         一键部署全部服务"
    echo ""
    echo "示例:"
    echo "  ./deploy.sh              # 部署前端"
    echo "  ./deploy.sh frontend     # 部署前端"
    echo "  ./deploy.sh docker-api   # 部署 Docker API"
    echo "  ./deploy.sh nginx        # 部署 Nginx 配置"
    echo "  ./deploy.sh all          # 全部部署"
}

# ==================== 入口 ====================

SERVICE="frontend"
MODE="full"
SKIP_BUILD="false"

for arg in "$@"; do
    case "$arg" in
        frontend|docker-api|nginx|all) SERVICE="$arg" ;;
        --incremental|-i)             MODE="incremental" ;;
        --skip-build|-s)              SKIP_BUILD="true" ;;
        -h|--help)                    show_help; exit 0 ;;
    esac
done

case "$SERVICE" in
    frontend)     deploy_frontend "$MODE" "$SKIP_BUILD" ;;
    docker-api)   deploy_docker_api ;;
    nginx)        deploy_nginx ;;
    all)          deploy_all ;;
    *)            echo "未知服务: $SERVICE"; show_help; exit 1 ;;
esac
