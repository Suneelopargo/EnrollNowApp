# frontend/shell/Dockerfile - Shell Host Container
FROM node:20-alpine AS builder

WORKDIR /app
COPY shell/package*.json ./shell/
COPY shared ./shared/
WORKDIR /app/shell
RUN npm ci

COPY shell/ ./
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/shell/dist /usr/share/nginx/html
COPY shell/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
