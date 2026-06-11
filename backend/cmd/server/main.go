package main

import (
	"log"
	"net/http"
	"os"
	"time"
)

const (
	maxUploadSize = 10 * 1024 * 1024 // 10 MB
	uploadDir     = "./uploads"
	dpi           = 300
)

func startCleanupTask() {
	go func() {
		ticker := time.NewTicker(15 * time.Minute)
		for range ticker.C {
			entries, err := os.ReadDir(uploadDir)
			if err != nil {
				continue
			}
			now := time.Now()
			for _, entry := range entries {
				if entry.IsDir() {
					info, err := entry.Info()
					if err == nil && now.Sub(info.ModTime()) > time.Hour {
						_ = os.RemoveAll(uploadDir + "/" + entry.Name())
					}
				}
			}
		}
	}()
}

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

	startCleanupTask()

	server := &http.Server{
		Addr:         ":" + port,
		Handler:      mux,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  120 * time.Second,
	}

	log.Printf("Server starting on port %s...", port)
	if err := server.ListenAndServe(); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
