FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
ENV ESBUILD_SKIP_BINARY_DOWNLOAD=1
RUN npm install --legacy-peer-deps
COPY . .
RUN npx esbuild --version || npm install esbuild --legacy-peer-deps
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY --from=builder /app/public/roms /usr/share/nginx/html/roms
COPY --from=builder /app/public/data /usr/share/nginx/html/data
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
