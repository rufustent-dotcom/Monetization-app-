# --- Stage 1: Build Environment ---
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files for caching
COPY package*.json ./

# Install all dependencies (including devDependencies for compilation)
RUN npm ci

# Copy source code and configuration files
COPY . .

# Compile TypeScript into dist/server.cjs and build frontend static assets
RUN npm run build

# Prune node_modules to keep only production dependencies
RUN npm prune --production

# --- Stage 2: Production Environment ---
FROM node:20-alpine AS runner

WORKDIR /app

# Set production environment variable
ENV NODE_ENV=production

# Copy package.json to the runner stage
COPY package*.json ./

# Copy production node_modules from the builder stage
COPY --from=builder /app/node_modules ./node_modules

# Copy the entire compiled dist directory (contains both server.cjs and static frontend)
COPY --from=builder /app/dist ./dist

# Create and switch to a non-root user for security
USER node

# Expose your application port (3000)
EXPOSE 3000

# Execute the self-contained bundle
CMD ["node", "dist/server.cjs"]
