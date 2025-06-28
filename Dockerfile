# Dockerfile

# Build frontend
FROM node:18-alpine as frontend
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install -g pnpm
RUN pnpm install
COPY client/ ./
RUN pnpm build

# Build backend
FROM node:18-alpine as backend
WORKDIR /app
COPY server/package*.json ./
RUN npm install
COPY server/ ./

# Final image
FROM node:18-alpine
WORKDIR /app
RUN apk add --no-cache curl
COPY --from=backend /app .
COPY --from=frontend /app/client/dist ./client/dist

EXPOSE 3000

CMD ["node", "src/index.js"]
