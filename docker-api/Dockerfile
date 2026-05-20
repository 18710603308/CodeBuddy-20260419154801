FROM node:18-alpine

# 安装 Docker CLI
RUN apk add --no-cache docker cli

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY server.js ./

# 挂载宿主机的 Docker socket
RUN mkdir -p /var/run && touch /var/run/docker.sock

EXPOSE 3000

CMD ["node", "server.js"]
