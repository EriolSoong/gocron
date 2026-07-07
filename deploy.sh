#!/bin/bash
set -e

# ============================================
# gocron v2.0 Docker 一键部署脚本
# ============================================

IMAGE_NAME="${IMAGE_NAME:-gocron}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
CONTAINER_NAME="${CONTAINER_NAME:-gocron}"
HOST_PORT="${HOST_PORT:-5920}"
CONF_DIR="${CONF_DIR:-$(pwd)/conf}"
LOG_DIR="${LOG_DIR:-$(pwd)/log}"
DATA_DIR="${DATA_DIR:-$(pwd)/data}"

echo "========================================"
echo " gocron Docker 部署"
echo "========================================"
echo " 镜像: ${IMAGE_NAME}:${IMAGE_TAG}"
echo " 容器: ${CONTAINER_NAME}"
echo " 端口: ${HOST_PORT}"
echo " 配置: ${CONF_DIR}"
echo " 日志: ${LOG_DIR}"
echo "========================================"

# 1. 构建 Linux 静态二进制
# echo "" && echo "[1/4] 构建 Linux 静态二进制..."
# make build-linux

# 2. 构建 Docker 镜像
echo "" && echo "[2/4] 构建 Docker 镜像..."
docker build -t "${IMAGE_NAME}:${IMAGE_TAG}" .

# 3. 停止并删除旧容器
echo "" && echo "[3/4] 清理旧容器..."
docker rm -f "${CONTAINER_NAME}" 2>/dev/null || true

# 4. 启动新容器
echo "" && echo "[4/4] 启动容器..."
mkdir -p "${CONF_DIR}" "${LOG_DIR}" "${DATA_DIR}"

# 首次部署提示
if [ ! -f "${CONF_DIR}/install.lock" ]; then
    echo ""
    echo "  🆕 首次部署: 访问 http://localhost:${HOST_PORT} 进入安装向导"
    echo "  安装完成后配置文件将保存到 ${CONF_DIR}/app.ini"
    echo ""
fi

docker run -d \
    --name "${CONTAINER_NAME}" \
    --restart unless-stopped \
    -p "${HOST_PORT}:5920" \
    -v "${CONF_DIR}:/app/conf" \
    -v "${LOG_DIR}:/app/log" \
    -v "${DATA_DIR}:/app/data" \
    "${IMAGE_NAME}:${IMAGE_TAG}"

# 等待服务就绪
sleep 2
if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo ""
    echo "========================================"
    echo " ✅ 部署完成"
    echo " 访问: http://localhost:${HOST_PORT}"
    echo ""
    echo " 查看日志: docker logs -f ${CONTAINER_NAME}"
    echo " 停止服务: docker stop ${CONTAINER_NAME}"
    echo "========================================"
else
    echo ""
    echo "========================================"
    echo " ❌ 容器启动失败，查看日志:"
    echo " docker logs ${CONTAINER_NAME}"
    echo "========================================"
    exit 1
fi
