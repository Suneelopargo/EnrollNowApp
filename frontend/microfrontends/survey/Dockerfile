FROM node:20-alpine AS builder

WORKDIR /app
COPY microfrontends/survey/package*.json ./microfrontends/survey/
COPY shared ./shared/
WORKDIR /app/microfrontends/survey
RUN npm ci

COPY microfrontends/survey/ ./
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/microfrontends/survey/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
