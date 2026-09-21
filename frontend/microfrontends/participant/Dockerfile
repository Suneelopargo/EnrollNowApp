FROM node:20-alpine AS builder

WORKDIR /app
COPY microfrontends/participant/package*.json ./microfrontends/participant/
COPY shared ./shared/
WORKDIR /app/microfrontends/participant
RUN npm ci

COPY microfrontends/participant/ ./
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/microfrontends/participant/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
