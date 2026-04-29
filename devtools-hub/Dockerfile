# 使用 Nginx 镜像运行静态网站
FROM nginx:alpine

# 删除默认 nginx 配置
RUN rm /etc/nginx/conf.d/default.conf

# 复制构建产物
COPY dist/ /usr/share/nginx/html/

# 复制自定义 nginx 配置（开启 Gzip 压缩）
RUN echo 'gzip on; \
gzip_vary on; \
gzip_min_length 1024; \
gzip_proxied any; \
gzip_types text/plain text/css text/xml application/json application/javascript application/rss+xml application/atom+xml image/svg+xml; \
gzip_disable "MSIE [1-6]\.";' > /etc/nginx/gzip.conf

RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    root /usr/share/nginx/html; \
    index index.html; \
    include /etc/nginx/gzip.conf; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    location /assets/ { \
        expires 1y; \
        add_header Cache-Control "public, immutable"; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
