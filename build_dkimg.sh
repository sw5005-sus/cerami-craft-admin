#!/bin/bash

# 构建脚本
# 用法: chmod +x build_dkimg.sh && ./build_dkimg.sh [tag]

PROJECT_NAME="ceramicraft-merchant-frontend"
TAG="${1:-latest}"

echo "🚀 开始构建 Docker 镜像..."
echo "📦 项目: $PROJECT_NAME"
echo "🏷️  标签: $TAG"
echo ""

# 构建镜像
docker build -t $PROJECT_NAME:$TAG -t $PROJECT_NAME:latest .

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 构建成功!"
    echo "🐳 镜像: $PROJECT_NAME:$TAG"
    echo ""
    echo "🚀 快速测试运行:"
    echo "   docker run -d -p 8080:80 --name ${PROJECT_NAME}-test $PROJECT_NAME:$TAG"
    echo ""
    echo "🌐 访问地址: http://localhost:8080"
else
    echo ""
    echo "❌ 构建失败!"
    exit 1
fi
