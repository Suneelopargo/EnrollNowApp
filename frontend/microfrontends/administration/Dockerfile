FROM node:20-alpine AS builder

WORKDIR /app
COPY microfrontends/administration/package*.json ./microfrontends/administration/
COPY shared ./shared/
WORKDIR /app/microfrontends/administration
RUN npm ci

COPY microfrontends/administration/ ./
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/microfrontends/administration/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
