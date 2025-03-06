# Stage 1: Build the project using Node.js
FROM node:22.14-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Build the Vite project (outputs to the "dist" folder)
RUN npm run build

# Stage 2: Serve the built files using Nginx
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
