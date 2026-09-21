FROM node:20-alpine AS builder

WORKDIR /app
COPY microfrontends/identity/package*.json ./microfrontends/identity/
COPY shared ./shared/
WORKDIR /app/microfrontends/identity
RUN npm ci

COPY microfrontends/identity/ ./
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/microfrontends/identity/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
