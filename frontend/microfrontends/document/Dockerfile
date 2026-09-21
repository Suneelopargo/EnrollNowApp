FROM node:20-alpine AS builder

WORKDIR /app
COPY microfrontends/document/package*.json ./microfrontends/document/
COPY shared ./shared/
WORKDIR /app/microfrontends/document
RUN npm ci

COPY microfrontends/document/ ./
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/microfrontends/document/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
