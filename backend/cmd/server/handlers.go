package main

import (
	"bytes"
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"sync"
	"time"
)

var processingMutex sync.Mutex

type ProcessResponse struct {
	ID      string `json:"id"`
	PDFName string `json:"pdfName"`
	PNGName string `json:"pngName"`
}

type ErrorResponse struct {
	Error string `json:"error"`
}

func generateUUID() string {
	bytes := make([]byte, 16)

	if _, err := rand.Read(bytes); err != nil {
		return fmt.Sprintf("%d", os.Getpid())
	}

	return hex.EncodeToString(bytes)
}

func writeJSONError(w http.ResponseWriter, status int, errMsg string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(ErrorResponse{Error: errMsg})
}

func handleUpload(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSONError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	r.Body = http.MaxBytesReader(w, r.Body, maxUploadSize)

	if err := r.ParseMultipartForm(maxUploadSize); err != nil {
		writeJSONError(w, http.StatusBadRequest, "Uploaded file too large (max 10MB)")
		return
	}

	file, _, err := r.FormFile("file")

	if err != nil {
		writeJSONError(w, http.StatusBadRequest, "Invalid upload payload")
		return
	}

	defer file.Close()

	uuid := generateUUID()
	txDir := filepath.Join(uploadDir, uuid)

	if err := os.MkdirAll(txDir, 0755); err != nil {
		log.Printf("Error creating directory %s: %v", txDir, err)
		writeJSONError(w, http.StatusInternalServerError, "Failed to create processing workspace")
		return
	}

	fileBytes, err := io.ReadAll(file)
	if err != nil {
		log.Printf("Error reading uploaded file: %v", err)
		writeJSONError(w, http.StatusInternalServerError, "Failed to read uploaded file")
		return
	}

	// If it is an RTF file, sanitize the encoding declarations to use CP1251/Cyrillic
	if bytes.HasPrefix(fileBytes, []byte("{\\rtf")) {
		fileBytes = bytes.ReplaceAll(fileBytes, []byte("\\ansicpg0"), []byte("\\ansicpg1251"))
		fileBytes = bytes.ReplaceAll(fileBytes, []byte("\\fcharset1"), []byte("\\fcharset204"))
		fileBytes = bytes.ReplaceAll(fileBytes, []byte("\\fcharset0"), []byte("\\fcharset204"))
	}

	rtfPath := filepath.Join(txDir, "report.rtf")

	if err := os.WriteFile(rtfPath, fileBytes, 0644); err != nil {
		log.Printf("Error writing uploaded file %s: %v", rtfPath, err)
		writeJSONError(w, http.StatusInternalServerError, "Failed to save uploaded file")
		return
	}

	log.Printf("[%s] Received upload, saved to %s", uuid, rtfPath)

	log.Printf("[%s] Converting RTF to PDF via local LibreOffice...", uuid)

	ctxPDF, cancelPDF := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancelPDF()

	cmdLibrePDF := exec.CommandContext(ctxPDF, "libreoffice", "--headless", "--convert-to", "pdf", "--outdir", txDir, rtfPath)

	var pdfErr bytes.Buffer
	cmdLibrePDF.Stderr = &pdfErr

	processingMutex.Lock()
	err = cmdLibrePDF.Run()
	processingMutex.Unlock()

	if err != nil {
		if ctxPDF.Err() == context.DeadlineExceeded {
			log.Printf("[%s] Local LibreOffice PDF conversion timed out", uuid)
			writeJSONError(w, http.StatusGatewayTimeout, "PDF conversion timed out")
			return
		}

		log.Printf("[%s] Local LibreOffice PDF conversion failed: %v (stderr: %s)", uuid, err, pdfErr.String())
		writeJSONError(w, http.StatusInternalServerError, "Failed to convert RTF report to PDF")
		return
	}

	log.Printf("[%s] Extracting WMF chromatogram...", uuid)

	wmfPath := filepath.Join(txDir, "image.wmf")

	if err := extractWMF(rtfPath, wmfPath); err != nil {
		log.Printf("[%s] WMF extraction failed: %v", uuid, err)
		writeJSONError(w, http.StatusInternalServerError, "Failed to extract chromatogram vector graphic from RTF")
		return
	}

	log.Printf("[%s] Converting WMF to PNG via LibreOffice...", uuid)

	ctxPNG, cancelPNG := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancelPNG()

	filterParam := fmt.Sprintf("png:impress_png_Export:PixelResolution=%d", dpi)
	cmdLibre := exec.CommandContext(ctxPNG, "libreoffice", "--headless", "--convert-to", filterParam, "--outdir", txDir, wmfPath)

	var libreErr bytes.Buffer
	cmdLibre.Stderr = &libreErr

	processingMutex.Lock()
	err = cmdLibre.Run()
	processingMutex.Unlock()

	if err != nil {
		if ctxPNG.Err() == context.DeadlineExceeded {
			log.Printf("[%s] LibreOffice WMF to PNG conversion timed out", uuid)
			writeJSONError(w, http.StatusGatewayTimeout, "PNG conversion timed out")
			return
		}
		log.Printf("[%s] LibreOffice conversion failed: %v (stderr: %s)", uuid, err, libreErr.String())
		writeJSONError(w, http.StatusInternalServerError, "Failed to rasterize chromatogram to PNG")
		return
	}

	tempPngPath := filepath.Join(txDir, "image.png")
	trimmedPngPath := filepath.Join(txDir, "chromatogram.png")

	log.Printf("[%s] Trimming chromatogram margins...", uuid)

	if err := trimPNG(tempPngPath, trimmedPngPath); err != nil {
		log.Printf("[%s] PNG trimming failed: %v", uuid, err)
		writeJSONError(w, http.StatusInternalServerError, "Failed to crop chromatogram PNG")
		return
	}

	log.Printf("[%s] Processing completed successfully!", uuid)

	w.Header().Set("Content-Type", "application/json")

	_ = json.NewEncoder(w).Encode(ProcessResponse{
		ID:      uuid,
		PDFName: "report.pdf",
		PNGName: "chromatogram.png",
	})
}

func handleDownload(w http.ResponseWriter, r *http.Request) {
	// Request path format: /download/<uuid>/<filename>
	parts := strings.Split(strings.TrimPrefix(r.URL.Path, "/download/"), "/")

	if len(parts) != 2 {
		http.Error(w, "Invalid download path", http.StatusBadRequest)
		return
	}

	uuid := parts[0]
	filename := parts[1]

	if len(uuid) != 32 || strings.Contains(uuid, "..") || strings.Contains(uuid, "/") || strings.Contains(uuid, "\\") {
		http.Error(w, "Forbidden path characters in transaction ID", http.StatusForbidden)
		return
	}

	if filename != "report.pdf" && filename != "chromatogram.png" {
		http.Error(w, "Forbidden filename request", http.StatusForbidden)
		return
	}

	safePath := filepath.Clean(filepath.Join(uploadDir, uuid, filename))

	absUploadDir, err1 := filepath.Abs(uploadDir)
	absSafePath, err2 := filepath.Abs(safePath)

	if err1 != nil || err2 != nil || !strings.HasPrefix(absSafePath, absUploadDir) {
		http.Error(w, "Access denied", http.StatusForbidden)
		return
	}

	if _, err := os.Stat(safePath); os.IsNotExist(err) {
		http.Error(w, "File not found", http.StatusNotFound)
		return
	}

	http.ServeFile(w, r, safePath)
}
