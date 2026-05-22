package main

import (
	"log"
	"net/http"
	"os"
)

const (
	maxUploadSize = 10 * 1024 * 1024 // 10 MB
	uploadDir     = "./uploads"
)

func main() {
	// Create upload directory if it doesn't exist
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		log.Fatalf("Failed to create upload directory: %v", err)
	}

	mux := http.NewServeMux()

	// Serve UI static files
	fs := http.FileServer(http.Dir("./public"))
	mux.Handle("/", fs)

	// API Endpoints
	mux.HandleFunc("/upload", handleUpload)
	mux.HandleFunc("/download/", handleDownload)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s...", port)
	if err := http.ListenAndServe(":"+port, mux); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
