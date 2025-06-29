# Stage 1: Build the frontend
FROM node:22-alpine AS frontend
WORKDIR /app/client
COPY client/package.json ./
RUN npm install
COPY client/ .
RUN npm run build

# Stage 2: Build the backend
FROM node:22-alpine AS backend
WORKDIR /app
COPY server/package.json ./
RUN npm install
COPY server/ .

# Stage 3: Final image
FROM node:22-alpine
WORKDIR /app
COPY --from=backend /app .
COPY --from=frontend /app/client/dist ./static
RUN apk add --no-cache bash curl
LABEL org.opencontainers.image.source=https://github.com/syndrizzle/synapse
LABEL org.opencontainers.image.description="Generate accurate multiple-choice questions from any PDF with Synapse. Enhance comprehension and accelerate your learning 🪄"
LABEL org.opencontainers.image.licenses=MIT
EXPOSE 3000
CMD ["npm", "start"]
