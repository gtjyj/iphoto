# 第一阶段：构建阶段
FROM node:18-alpine AS builder

RUN npm install -g pnpm

WORKDIR /app
COPY . .

RUN pnpm install
RUN pnpm build:web
RUN pnpm build:server

FROM node:18-alpine

WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/packages/server/dist ./dist
COPY --from=builder /app/packages/server/html ./html
COPY --from=builder /app/packages/server/.env ./
COPY --from=builder /app/packages/server/init.json ./
COPY --from=builder /app/packages/server/package.json ./

RUN npm install

EXPOSE 4000
CMD ["node", "./dist/main.js"]

# docker run -d\
#   -p 4000:4000 \
#   -v /root/work/photo-server/packages/server/userdata:/app/userdata \
#   iphoto

