# frontend/shell/Dockerfile - Single-Port Modular Frontend Container
FROM node:20-alpine AS builder

WORKDIR /app

# Copy monorepo configuration and modules
COPY package*.json ./
COPY packages ./packages/
COPY shared ./shared/
COPY microfrontends ./microfrontends/
COPY shell ./shell/

# Install dependencies and build single unified modular frontend
RUN npm install
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/shell/dist /usr/share/nginx/html
COPY shell/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
