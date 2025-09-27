# Multi-stage build for SmartSupply Health
FROM node:20-alpine AS frontend-build

# Set working directory
WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./

# Install frontend dependencies
RUN npm ci --legacy-peer-deps --only=production

# Copy frontend source code
COPY frontend/ .

# Build frontend
RUN npm run build

# Backend stage
FROM node:20-alpine AS backend

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
  adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy backend package files
COPY backend/package*.json ./

# Install backend dependencies
RUN npm ci --legacy-peer-deps --only=production && \
  npm cache clean --force

# Copy backend source code
COPY backend/ .

# Copy built frontend to backend public directory
COPY --from=frontend-build /app/frontend/build ./public

# Create uploads directory and set permissions
RUN mkdir -p uploads && \
  chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["npm", "start"]
