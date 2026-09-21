FROM node:20-alpine AS builder

WORKDIR /app
COPY microfrontends/organization/package*.json ./microfrontends/organization/
COPY shared ./shared/
WORKDIR /app/microfrontends/organization
RUN npm ci

COPY microfrontends/organization/ ./
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/microfrontends/organization/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
