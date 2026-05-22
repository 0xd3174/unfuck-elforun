# Stage 1: Build the Go binary
FROM golang:1.22-bookworm AS builder

WORKDIR /src

# Copy go.mod first to cache dependency resolution
COPY go.mod ./
COPY cmd ./cmd

RUN go build -o server ./cmd/server

# Stage 2: Runtime environment with LibreOffice
FROM debian:bookworm-slim

# Install system dependencies (only headless LibreOffice and fonts)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libreoffice-nogui \
    fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy built server binary and assets
COPY --from=builder /src/server /app/server
COPY public /app/public

# Expose port
EXPOSE 8080

# Run the web server
CMD ["/app/server"]
