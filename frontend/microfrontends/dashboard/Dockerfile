FROM node:20-alpine AS builder

WORKDIR /app
COPY microfrontends/dashboard/package*.json ./microfrontends/dashboard/
COPY shared ./shared/
WORKDIR /app/microfrontends/dashboard
RUN npm ci

COPY microfrontends/dashboard/ ./
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/microfrontends/dashboard/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
