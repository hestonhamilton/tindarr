# Stage 1: Build the client
FROM node:20-alpine AS client-builder

WORKDIR /app

# Copy root package.json and package-lock.json
COPY package.json package-lock.json ./
# Copy the entire packages directory
COPY packages packages

# Install dependencies for all workspaces
RUN npm ci

WORKDIR /app/packages/client

COPY packages/client/src ./src
COPY packages/client/index.html .
COPY packages/client/public ./public
COPY packages/client/tsconfig.json .
COPY packages/client/tsconfig.app.json .
COPY packages/client/tsconfig.node.json .
COPY packages/client/vite.config.ts .
COPY packages/client/eslint.config.js .
RUN npm run build

# Stage 2: Build the server
FROM node:20-alpine AS server-builder

WORKDIR /app

# Copy root package.json and package-lock.json
COPY package.json package-lock.json ./
# Copy the entire packages directory
COPY packages packages

# Install dependencies for all workspaces
RUN npm ci

WORKDIR /app/packages/server

COPY packages/server/src ./src
COPY packages/server/tsconfig.json .
COPY packages/server/jest.config.js .
RUN npm run build

# Stage 3: Final image
FROM node:20-alpine

WORKDIR /app

# Copy server build artifacts
COPY --from=server-builder /app/packages/server/dist ./packages/server/dist
COPY --from=server-builder /app/packages/server/node_modules ./packages/server/node_modules
COPY packages/server/package.json ./packages/server/package.json

# Copy client build artifacts
COPY --from=client-builder /app/packages/client/dist ./packages/client/dist
COPY packages/client/package.json ./packages/client/package.json

# Copy root package.json for workspaces (if needed for production, otherwise omit)
COPY package.json .
COPY package-lock.json .

# Install production dependencies for the root (if any, or for workspaces)
# RUN npm ci --omit=dev

# Expose the port the app runs on
EXPOSE 3001

# Command to run the application
CMD ["node", "packages/server/dist/index.js"]
