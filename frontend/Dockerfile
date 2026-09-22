# ============================================================
# Stage 1: Build — Node builds the React app
# ============================================================
FROM node:20-alpine AS build
WORKDIR /app

# Install dependencies (Docker layer cache: reused unless lockfile changes)
COPY package.json package-lock.json* ./
RUN --mount=type=cache,target=/root/.npm \
    if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Copy source and build
COPY . .
RUN npm run build

# ============================================================
# Stage 2: Runtime — nginx serves the built assets
# ============================================================
FROM nginx:1.27-alpine AS runtime

# The nginx image's entrypoint will substitute ${BACKEND_URL} in files
# located at /etc/nginx/templates/*.template via envsubst, then write
# the result to /etc/nginx/conf.d/.
#
# We name the source file with `.template` extension so the entrypoint
# picks it up.
RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Default backend URL for local Docker Compose.
# Fly deployment overrides this in fly.toml [env].
ENV BACKEND_URL=http://backend:8080

# Copy built assets
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

# The nginx image's CMD starts nginx; the entrypoint runs the template
# substitution first.
