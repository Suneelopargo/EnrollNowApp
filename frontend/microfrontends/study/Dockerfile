FROM node:20-alpine AS builder

WORKDIR /app
COPY microfrontends/study/package*.json ./microfrontends/study/
COPY shared ./shared/
WORKDIR /app/microfrontends/study
RUN npm ci

COPY microfrontends/study/ ./
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/microfrontends/study/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
