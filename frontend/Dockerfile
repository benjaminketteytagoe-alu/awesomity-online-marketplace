# ============================================================
# Stage 1: Build — Node + full toolchain, thrown away after
# ============================================================
FROM node:20-alpine AS build
WORKDIR /app

# Install deps first (Docker layer cache: reused unless lockfile changes)
COPY package.json package-lock.json* ./
RUN --mount=type=cache,target=/root/.npm \
    if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Copy source and build
COPY . .
RUN npm run build

# ============================================================
# Stage 2: Runtime — nginx only, ~35 MB final image
# ============================================================
FROM nginx:1.27-alpine AS runtime

# Swap default config for ours (proxy + SPA fallback)
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

# nginx official image already has the right CMD
