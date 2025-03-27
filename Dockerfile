# 使用 Node.js 18 作为基础镜像
FROM node:18

# 设置工作目录
WORKDIR /app

# 复制当前项目到工作目录
COPY . .

# 安装 pnpm
RUN npm install -g pnpm

# 安装项目依赖
RUN pnpm install

# 构建前端项目
RUN pnpm build:web

# 启动前端服务
CMD ["pnpm", "start:web"]
