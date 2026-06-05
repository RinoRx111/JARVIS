# --- BASE STAGE ---
FROM node:18-alpine AS runner

WORKDIR /app

# Copy package dependencies and configuration
COPY package.json ./

# Install dependencies
RUN npm install

# Copy application source code
COPY . .

# Expose Next.js development server port
EXPOSE 3000

# Start development server
CMD ["npm", "run", "dev"]
