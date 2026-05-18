# Stage 1: Build the React / Vite application using Bun
FROM oven/bun:1-slim AS builder

WORKDIR /app

# Copy dependency configs
COPY package.json bun.lockb* ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source files
COPY . .

# Build Vite static assets
RUN bun run build

# Stage 2: Serve the compiled app with Nginx in production
FROM nginx:alpine

# Copy built assets to Nginx default public directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Custom Nginx configuration to support SPA React routing
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Expose HTTP port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
