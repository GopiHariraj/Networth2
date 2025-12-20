FROM node:20-slim

WORKDIR /app

# Install OpenSSL and other required dependencies for Prisma
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build the application
RUN npm run build

EXPOSE 3001

# Run migrations and start app
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start:prod"]
