# Use Node.js LTS
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files from Backend subfolder
COPY Backend/package*.json ./

# Install dependencies
RUN npm install --omit=dev

# Copy source code from Backend subfolder
COPY Backend/ .

# Expose port
EXPOSE 5001

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget -qO- http://localhost:5001/ || exit 1

# Start the server
CMD ["node", "src/index.js"]
