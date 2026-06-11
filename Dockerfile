FROM oven/bun:1 AS frontend-builder
WORKDIR /app
# Install frontend dependencies separately for Docker layer caching
COPY frontend/package.json frontend/bun.lockb* ./
RUN bun install
COPY frontend/ ./
RUN bun run build

FROM golang:1.22-bookworm AS backend-builder
WORKDIR /src
COPY backend/ ./
RUN go build -o server ./cmd/server

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends \
    libreoffice-nogui \
    fonts-liberation \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=backend-builder /src/server /app/server
COPY --from=frontend-builder /app/dist /app/public

EXPOSE 8080
CMD ["/app/server"]
