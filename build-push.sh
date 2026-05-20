#!/bin/bash
# DevTools Hub 镜像构建并推送到远程仓库
# 使用方式: ./build-push.sh [项目名] [标签]
# 
# 示例:
#   ./build-push.sh devtools-hub           # 构建并推送前端
#   ./build-push.sh whisper-server         # 构建并推送 Whisper 服务
#   ./build-push.sh devtools-hub v1.0.0   # 指定版本号

set -e

# 配置
SERVER="110.42.247.238"
PROJECT="${1:-devtools-hub}"
TAG="${2:-$(date +%Y%m%d%H%M)}"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}  DevTools Hub 镜像构建推送${NC}"
echo -e "${GREEN}=========================================${NC}"
echo -e "项目: ${CYAN}$PROJECT${NC}"
echo -e "标签: ${YELLOW}$TAG${NC}"
echo -e "服务器: ${YELLOW}$SERVER${NC}"
echo ""

# 1. 检查 Docker
echo -e "${YELLOW}[1/4]${NC} 检查 Docker..."
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ 本地未安装 Docker${NC}"
    echo -e "   请访问 https://www.docker.com/products/docker-desktop/ 下载安装"
    exit 1
fi
echo -e "   ${GREEN}✅ Docker 已安装: $(docker --version | cut -d' ' -f3 | cut -d',' -f1)${NC}"

# 2. 构建镜像
echo -e "${YELLOW}[2/4]${NC} 构建 Docker 镜像..."
cd "$(dirname "$0")"

case "$PROJECT" in
    devtools-hub)
        if [ -f Dockerfile.frontend ]; then
            docker build -t $PROJECT:$TAG -f Dockerfile.frontend .
        else
            docker build -t $PROJECT:$TAG .
        fi
        ;;
    whisper-server)
        if [ -f devtools-hub/public/whisper-server/Dockerfile.whisper ]; then
            docker build -t $PROJECT:$TAG -f devtools-hub/public/whisper-server/Dockerfile.whisper .
        else
            echo -e "${RED}❌ 未找到 Whisper Dockerfile${NC}"
            exit 1
        fi
        ;;
    *)
        docker build -t $PROJECT:$TAG .
        ;;
esac

# 3. 打包并上传
echo -e "${YELLOW}[3/4]${NC} 打包镜像..."
CONTAINER_ID=$(docker create $PROJECT:$TAG)
docker export $CONTAINER_ID > /tmp/${PROJECT}-${TAG}.tar
docker rm $CONTAINER_ID

echo -e "${YELLOW}[4/4]${NC} 上传到服务器并部署..."
ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 root@$SERVER << SSHEOF
    set -e
    echo "   上传文件..."
    cat /tmp/${PROJECT}-${TAG}.tar > /dev/null 2>&1 || exit 1
    
    echo "   导入镜像..."
    docker stop ${PROJECT}-app 2>/dev/null || true
    docker rm ${PROJECT}-app 2>/dev/null || true
    docker rmi ${SERVER}:5000/${PROJECT}:${TAG} 2>/dev/null || true
    docker rmi ${SERVER}:5000/${PROJECT}:latest 2>/dev/null || true
    
    cat /tmp/${PROJECT}-${TAG}.tar | docker import - ${PROJECT}:${TAG}
    docker tag ${PROJECT}:${TAG} ${SERVER}:5000/${PROJECT}:${TAG}
    docker tag ${SERVER}:5000/${PROJECT}:${TAG} ${SERVER}:5000/${PROJECT}:latest
    
    echo "   启动容器..."
    if [ "$PROJECT" = "whisper-server" ]; then
        docker run -d --name ${PROJECT}-app --restart=always -p 8080:8080 -v /root/whisper-models:/app/models ${SERVER}:5000/${PROJECT}:${TAG}
    else
        docker run -d --name ${PROJECT}-app --restart=always -p 80:80 ${SERVER}:5000/${PROJECT}:${TAG}
    fi
    
    echo "   清理临时文件..."
    rm -f /tmp/${PROJECT}-${TAG}.tar
    
    echo ""
    echo -e "   ${GREEN}✅ 部署成功！${NC}"
    echo -e "   服务地址: http://$SERVER"
    echo -e "   HTTPS地址: https://$SERVER"
    echo ""
    docker ps | grep ${PROJECT}-app
SSHEOF

# 清理本地临时文件
rm -f /tmp/${PROJECT}-${TAG}.tar

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}  ✅ 全部完成！${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo -e "访问: ${CYAN}https://$SERVER${NC}"
