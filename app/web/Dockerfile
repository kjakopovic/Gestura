# Stage 1: Build the project using Node.js
FROM node:22.14-alpine AS builder
WORKDIR /app

# Set environment variables for Vite build
ENV VITE_BACKEND_AUTH_API=https://ee51i8n39e.execute-api.eu-central-1.amazonaws.com
ENV VITE_STAGE=develop
ENV VITE_WSS_API=wss://nuxgkct5le.execute-api.eu-central-1.amazonaws.com

COPY package*.json ./
RUN npm install

COPY . .

# Build the Vite project (outputs to the "dist" folder)
RUN npm run build

# Stage 2: Serve the built files using Nginx
FROM nginx:alpine

# 2. Copy custom nginx config (overwriting the default)
COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
