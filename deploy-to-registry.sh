#!/bin/bash
set -e
set -x

# 配置
SERVER="110.42.247.238"
REGISTRY="${SERVER}:5000"
PROJECT="devtools-hub"
TAG="latest"

echo "========================================"
echo "  DevTools Hub 部署到私有镜像仓库"
echo "========================================"
echo "Registry: $REGISTRY"
echo "Project:  $PROJECT"
echo "Tag:      $TAG"
echo ""

# 1. 确保本地有构建好的 dist
echo "[1/6] 检查构建目录..."
if [ ! -d "dist" ]; then
    echo "dist 目录不存在，从 dist.tar.gz 解压..."
    if [ -f "dist.tar.gz" ]; then
        tar -xzf dist.tar.gz
    else
        echo "错误: 既没有 dist 目录也没有 dist.tar.gz"
        exit 1
    fi
fi
echo "✅ dist 目录就绪"

# 2. 本地构建镜像
echo ""
echo "[2/6] 本地构建 Docker 镜像..."
docker build -t ${PROJECT}:${TAG} -f Dockerfile.frontend .
echo "✅ 镜像构建成功: ${PROJECT}:${TAG}"

# 3. 标记到私有仓库
echo ""
echo "[3/6] 标记镜像到私有仓库..."
docker tag ${PROJECT}:${TAG} ${REGISTRY}/${PROJECT}:${TAG}
echo "✅ 镜像标记完成: ${REGISTRY}/${PROJECT}:${TAG}"

# 4. 上传到私有仓库
echo ""
echo "[4/6] 上传到私有镜像仓库..."
docker push ${REGISTRY}/${PROJECT}:${TAG}
echo "✅ 镜像上传成功"

# 5. 在服务器上拉取并部署
echo ""
echo "[5/6] 在服务器上拉取并部署..."
ssh -o StrictHostKeyChecking=no root@${SERVER} << SSHEOF
    set -e
    set -x
    
    echo "   停止旧容器..."
    docker stop ${PROJECT}-app 2>/dev/null || true
    docker rm ${PROJECT}-app 2>/dev/null || true
    
    echo "   拉取新镜像..."
    docker pull ${REGISTRY}/${PROJECT}:${TAG}
    
    echo "   启动新容器..."
    docker run -d \
      --name ${PROJECT}-app \
      --restart=always \
      -p 80:80 \
      ${REGISTRY}/${PROJECT}:${TAG}
    
    echo ""
    echo "   ✅ 部署成功!"
    docker ps | grep ${PROJECT}-app
SSHEOF

# 6. 清理本地临时镜像
echo ""
echo "[6/6] 清理本地临时镜像..."
# 保留本地镜像用于测试，不删除

echo ""
echo "========================================"
echo "  ✅ 部署完成!"
echo "========================================"
echo "服务地址: http://${SERVER}"
echo "HTTPS地址: https://${SERVER}"
echo "镜像仓库: ${REGISTRY}/${PROJECT}:${TAG}"
