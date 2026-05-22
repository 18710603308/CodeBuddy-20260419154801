FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY server.js ./

# 挂载宿主机的 Docker socket
RUN mkdir -p /var/run && touch /var/run/docker.sock

EXPOSE 3000

CMD ["node", "server.js"]
