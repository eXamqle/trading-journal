# Stage 1: Build the React client
FROM node:20-alpine AS client-builder

WORKDIR /app/client

# Copy client package files
COPY client/package*.json ./

# Install ALL client dependencies (including devDependencies like Vite needed for build)
RUN npm install

# Copy client source
COPY client/ ./

# Build the client for production
RUN npm run build

# Stage 2: Setup the server
FROM node:20-alpine AS server-builder

WORKDIR /app/server

# Copy server package files
COPY server/package*.json ./

# Install server dependencies (including build dependencies for better-sqlite3)
RUN apk add --no-cache python3 make g++ && \
    npm install --production && \
    apk del python3 make g++

# Stage 3: Production image
FROM node:20-alpine

WORKDIR /app

# Install runtime dependencies for better-sqlite3
RUN apk add --no-cache dumb-init

# Copy server files and dependencies
COPY --from=server-builder /app/server/node_modules ./server/node_modules
COPY server ./server

# Copy built client files
COPY --from=client-builder /app/client/dist ./server/public

# Create directory for database
RUN mkdir -p /app/server/database && \
    chown -R node:node /app

# Switch to non-root user
USER node

# Expose the port
EXPOSE 5000

# Set working directory to server
WORKDIR /app/server

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the server
CMD ["node", "src/server.js"]
