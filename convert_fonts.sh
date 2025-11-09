#!/bin/bash

# Font conversion script: TTF to WOFF2
# This script converts all TTF fonts in src/app/fonts/ to WOFF2 format
# for faster web loading times

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting font conversion from TTF to WOFF2...${NC}"

# Directory containing the fonts
FONTS_DIR="src/app/fonts"
OUTPUT_DIR="src/app/fonts"

# Delete existing WOFF files
echo -e "${YELLOW}Cleaning up existing WOFF files...${NC}"
rm -f "$FONTS_DIR"/*.woff
echo -e "${GREEN}✓ Existing WOFF files removed${NC}"

# Check if fonttools is installed
if ! command -v pyftsubset &> /dev/null; then
    echo -e "${RED}Error: fonttools is not installed.${NC}"
    echo "Installing fonttools..."
    pip install fonttools[woff]
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}Failed to install fonttools. Please install it manually:${NC}"
        echo "pip install fonttools[woff]"
        exit 1
    fi
fi

# Check if brotli is installed (required for WOFF2)
echo -e "${YELLOW}Checking for Brotli compression library...${NC}"
python -c "import brotli" 2>/dev/null
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}Brotli not found. Installing brotli for WOFF2 support...${NC}"
    pip install brotli
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}Failed to install brotli. Please install it manually:${NC}"
        echo "pip install brotli"
        exit 1
    fi
    echo -e "${GREEN}✓ Brotli installed successfully${NC}"
else
    echo -e "${GREEN}✓ Brotli already installed${NC}"
fi

# Directory containing the fonts
FONTS_DIR="src/app/fonts"
OUTPUT_DIR="src/app/fonts"

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

# Counter for converted fonts
converted_count=0
total_count=0

# Count total TTF files first
for font_file in "$FONTS_DIR"/*.ttf; do
    if [ -f "$font_file" ]; then
        total_count=$((total_count + 1))
    fi
done

echo -e "${YELLOW}Found $total_count TTF files to convert${NC}"

# Convert each TTF file to WOFF2
for font_file in "$FONTS_DIR"/*.ttf; do
    if [ -f "$font_file" ]; then
        # Get the base name without extension
        base_name=$(basename "$font_file" .ttf)
        output_file="$OUTPUT_DIR/$base_name.woff2"
        
        echo -e "Converting: ${YELLOW}$(basename "$font_file")${NC} -> ${GREEN}$(basename "$output_file")${NC}"
        
        # Convert TTF to WOFF2 using fonttools
        pyftsubset "$font_file" --output-file="$output_file" --flavor=woff2
        
        if [ $? -eq 0 ]; then
            converted_count=$((converted_count + 1))
            echo -e "  ${GREEN}✓ Successfully converted${NC}"
        else
            echo -e "  ${RED}✗ Failed to convert${NC}"
        fi
    fi
done

echo ""
echo -e "${GREEN}Conversion complete!${NC}"
echo -e "Successfully converted: ${GREEN}$converted_count${NC} out of ${YELLOW}$total_count${NC} fonts"
echo -e "WOFF2 files saved to: ${YELLOW}$OUTPUT_DIR${NC}"

# Optional: Show file sizes comparison
echo ""
echo -e "${YELLOW}File size comparison:${NC}"
for font_file in "$FONTS_DIR"/*.ttf; do
    if [ -f "$font_file" ]; then
        base_name=$(basename "$font_file" .ttf)
        woff2_file="$OUTPUT_DIR/$base_name.woff2"
        
        if [ -f "$woff2_file" ]; then
            ttf_size=$(du -h "$font_file" | cut -f1)
            woff2_size=$(du -h "$woff2_file" | cut -f1)
            echo -e "$(basename "$font_file"): ${YELLOW}$ttf_size${NC} -> ${GREEN}$woff2_size${NC}"
        fi
    fi
done

echo ""
echo -e "${GREEN}All done! Your WOFF2 fonts are ready for faster web loading.${NC}"
