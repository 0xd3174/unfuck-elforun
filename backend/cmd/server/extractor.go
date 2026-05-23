package main

import (
	"bytes"
	"encoding/hex"
	"fmt"
	"image"
	"image/png"
	"os"
	"regexp"
)

// extractWMF parses an RTF file, finds the first \pict block, extracts the hex-encoded WMF data,
// decodes it to binary, and writes it to the outputPath.
func extractWMF(inputPath, outputPath string) error {
	content, err := os.ReadFile(inputPath)
	if err != nil {
		return fmt.Errorf("read file failed: %w", err)
	}

	pictPos := bytes.Index(content, []byte("\\pict"))
	if pictPos == -1 {
		return fmt.Errorf("no \\pict block found in RTF")
	}

	braceCount := 1
	endPos := -1
	for i := pictPos + 1; i < len(content); i++ {
		if content[i] == '{' {
			braceCount++
		} else if content[i] == '}' {
			braceCount--
			if braceCount == 0 {
				endPos = i
				break
			}
		}
	}

	if endPos == -1 {
		return fmt.Errorf("matching closing brace for \\pict group not found")
	}

	pictBlock := content[pictPos:endPos]

	// Find the last control word
	re := regexp.MustCompile(`\\[a-zA-Z0-9-]+`)
	matches := re.FindAllIndex(pictBlock, -1)
	if len(matches) == 0 {
		return fmt.Errorf("no control words found in pict block")
	}
	lastMatch := matches[len(matches)-1]
	hexStart := lastMatch[1] // End index of the last control word

	hexDataRaw := pictBlock[hexStart:]

	// Filter out non-hex characters (e.g. whitespace, newlines)
	var hexData bytes.Buffer
	for _, b := range hexDataRaw {
		if (b >= '0' && b <= '9') || (b >= 'a' && b <= 'f') || (b >= 'A' && b <= 'F') {
			hexData.WriteByte(b)
		}
	}

	hexStr := hexData.String()
	if len(hexStr)%2 != 0 {
		hexStr = hexStr[:len(hexStr)-1]
	}

	binaryData, err := hex.DecodeString(hexStr)
	if err != nil {
		return fmt.Errorf("failed to decode hex data: %w", err)
	}

	if err := os.WriteFile(outputPath, binaryData, 0644); err != nil {
		return fmt.Errorf("write output file failed: %w", err)
	}

	return nil
}

// trimPNG opens a PNG, finds the background color at pixel (0,0), calculates the bounding
// box of non-background content, crops it with a 10px padding, and writes it to outputPath.
func trimPNG(inputPath, outputPath string) error {
	f, err := os.Open(inputPath)
	if err != nil {
		return fmt.Errorf("open file failed: %w", err)
	}
	defer f.Close()

	cfg, err := png.DecodeConfig(f)
	if err != nil {
		return fmt.Errorf("decode PNG config failed: %w", err)
	}

	if cfg.Width > 8000 || cfg.Height > 8000 {
		return fmt.Errorf("image dimensions too large: %dx%d", cfg.Width, cfg.Height)
	}

	// Seek back to start for decoding
	if _, err := f.Seek(0, 0); err != nil {
		return fmt.Errorf("seek failed: %w", err)
	}

	img, err := png.Decode(f)
	if err != nil {
		return fmt.Errorf("decode PNG failed: %w", err)
	}

	bounds := img.Bounds()
	if bounds.Dx() == 0 || bounds.Dy() == 0 {
		return fmt.Errorf("empty image bounds")
	}

	// Get background color at top-left pixel (0, 0)
	bgColor := img.At(bounds.Min.X, bounds.Min.Y)
	bgR, bgG, bgB, bgA := bgColor.RGBA()

	minX, minY := bounds.Max.X, bounds.Max.Y
	maxX, maxY := bounds.Min.X, bounds.Min.Y
	found := false

	for y := bounds.Min.Y; y < bounds.Max.Y; y++ {
		for x := bounds.Min.X; x < bounds.Max.X; x++ {
			c := img.At(x, y)
			r, g, b, a := c.RGBA()
			if r != bgR || g != bgG || b != bgB || a != bgA {
				found = true
				if x < minX {
					minX = x
				}
				if x > maxX {
					maxX = x
				}
				if y < minY {
					minY = y
				}
				if y > maxY {
					maxY = y
				}
			}
		}
	}

	var cropped image.Image
	if found {
		// Add 10px padding
		padding := 10
		left := minX - padding
		if left < bounds.Min.X {
			left = bounds.Min.X
		}
		top := minY - padding
		if top < bounds.Min.Y {
			top = bounds.Min.Y
		}
		right := maxX + padding
		if right > bounds.Max.X {
			right = bounds.Max.X
		}
		bottom := maxY + padding
		if bottom > bounds.Max.Y {
			bottom = bounds.Max.Y
		}

		type SubImager interface {
			SubImage(r image.Rectangle) image.Image
		}

		if subImg, ok := img.(SubImager); ok {
			cropped = subImg.SubImage(image.Rect(left, top, right, bottom))
		} else {
			// Fallback: Copy pixels to a new RGBA image
			rect := image.Rect(0, 0, right-left, bottom-top)
			rgba := image.NewRGBA(rect)
			for y := top; y < bottom; y++ {
				for x := left; x < right; x++ {
					rgba.Set(x-left, y-top, img.At(x, y))
				}
			}
			cropped = rgba
		}
	} else {
		// No content found to trim, save original
		cropped = img
	}

	outF, err := os.Create(outputPath)
	if err != nil {
		return fmt.Errorf("create output file failed: %w", err)
	}
	defer outF.Close()

	if err := png.Encode(outF, cropped); err != nil {
		return fmt.Errorf("encode PNG failed: %w", err)
	}

	return nil
}
