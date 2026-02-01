# 多阶段构建：第一阶段 - 构建应用
FROM node:24.6.0-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制源代码
COPY . .

# 安装所有依赖（包括开发依赖，构建需要）
RUN npm ci --ignore-scripts

# 构建应用
RUN npm run build

# 第二阶段 - 生产环境镜像
FROM nginxinc/nginx-unprivileged:alpine

# 复制构建好的静态文件到 nginx 默认目录
COPY --from=builder /app/dist /usr/share/nginx/html

# 暴露 8080 端口（nginx-unprivileged 默认监听 8080）
EXPOSE 8080
