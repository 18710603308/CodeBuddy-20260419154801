#!/bin/bash
# =============================================
#  DevTools Hub Jenkins 一键启动脚本
#  用途: 一键启动本地 Jenkins CI/CD 环境
# =============================================

set -euo pipefail

# 颜色输出
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BLUE='\033[0;34m'; NC='\033[0m'

info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
step()  { echo -e "${YELLOW}[STEP]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
err()   { echo -e "${RED}[ERROR]${NC} $1"; }
title() { echo -e "\n${BLUE}========================================${NC}"; echo -e "${BLUE}  $1${NC}"; echo -e "${BLUE}========================================${NC}"; }

# 脚本目录
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

title "DevTools Hub Jenkins 启动脚本"

# ==================== 前置检查 ====================
step "检查依赖..."

if ! command -v docker &>/dev/null; then
    err "未检测到 Docker，请先安装 Docker"
    exit 1
fi
info "Docker 已安装: $(docker --version | head -n1)"

if ! command -v docker-compose &>/dev/null && ! docker compose version &>/dev/null; then
    err "未检测到 docker-compose，请先安装"
    exit 1
fi
info "Docker Compose 已安装"

# ==================== 启动 Jenkins ====================
title "启动 Jenkins 服务"

step "1/3 创建必要目录..."
mkdir -p jenkins_home
info "目录创建完成"

step "2/3 启动 Docker Compose..."
if docker compose version &>/dev/null; then
    docker compose up -d
else
    docker-compose up -d
fi
info "Jenkins 容器已启动"

step "3/3 等待 Jenkins 就绪..."
echo -n "等待 Jenkins 启动"
for i in {1..30}; do
    if docker ps | grep -q devtools-jenkins; then
        echo ""
        info "Jenkins 容器运行中"
        break
    fi
    echo -n "."
    sleep 2
    if [ "$i" -eq 30 ]; then
        err "Jenkins 启动超时"
        exit 1
    fi
done

# ==================== 获取初始密码 ====================
title "Jenkins 访问信息"

echo -e ""
echo -e "  ${GREEN}Jenkins 地址:${NC}   http://localhost:8080"
echo -e "  ${GREEN}管理员账号:${NC}   admin"
echo -e "  ${GREEN}管理员密码:${NC}   admin123"
echo -e ""
echo -e "  ${CYAN}预配置任务:${NC}"
echo -e "    - DevTools-Hub-Pipeline (完整 CI/CD)"
echo -e "    - DevTools-Hub-Build-Only (仅构建)"
echo -e ""
echo -e "  ${CYAN}本地 Registry:${NC}  http://localhost:5001"
echo -e ""

# ==================== 常用命令提示 ====================
title "常用命令"

echo -e ""
echo -e "  ${YELLOW}查看日志:${NC}      docker logs -f devtools-jenkins"
echo -e "  ${YELLOW}停止服务:${NC}      docker compose -f jenkins/docker-compose.yml down"
echo -e "  ${YELLOW}重启服务:${NC}      docker compose -f jenkins/docker-compose.yml restart"
echo -e "  ${YELLOW}进入容器:${NC}      docker exec -it devtools-jenkins bash"
echo -e ""

info "Jenkins 启动完成，请访问 http://localhost:8080"
