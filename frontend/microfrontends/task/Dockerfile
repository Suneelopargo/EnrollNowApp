FROM node:20-alpine AS builder

WORKDIR /app
COPY microfrontends/task/package*.json ./microfrontends/task/
COPY shared ./shared/
WORKDIR /app/microfrontends/task
RUN npm ci

COPY microfrontends/task/ ./
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/microfrontends/task/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
