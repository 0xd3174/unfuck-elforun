# Stage 1: Build the frontend (Vite + React)
FROM oven/bun:1 as frontend-builder
WORKDIR /app
COPY frontend/package.json frontend/bun.lockb* ./
RUN bun install
COPY frontend/ ./
RUN bun run build

# Stage 2: Build the Go binary
FROM golang:1.22-bookworm AS backend-builder
WORKDIR /src
COPY backend/go.mod ./
COPY backend/cmd ./cmd
RUN go build -o server ./cmd/server

# Stage 3: Runtime environment with LibreOffice
FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends \
    libreoffice-nogui \
    fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy built server binary
COPY --from=backend-builder /src/server /app/server
# Copy frontend build to public folder (served by Go)
COPY --from=frontend-builder /app/dist /app/public

EXPOSE 8080
CMD ["/app/server"]
