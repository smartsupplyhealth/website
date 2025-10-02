# SmartSupply Health - Frontend Dockerfile
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build the React app
RUN npm run build

# Install serve to serve the built app
RUN npm install -g serve

# Set environment variables
ENV NODE_ENV=production

# Expose port
EXPOSE 3000

# Health check (using wget instead of curl)
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Serve the built React app
CMD ["serve", "-s", "build", "-l", "3000"]


