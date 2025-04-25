#!/bin/bash

# Run the semantic conversion process for fix-connect predicates

# Set the base directory
BASE_DIR="/workspaces/codespaces-blank"
CONTENT_DIR="$BASE_DIR/content"
CONVERTED_DIR="$CONTENT_DIR/converted"
SCRIPT_DIR="$CONTENT_DIR/scripts/semantic-fix"

# Make the conversion script executable
chmod +x "$SCRIPT_DIR/convert-fix-predicates.js"

# First validate current connectivity to ensure we have a baseline
echo "Validating current connectivity..."
node "$CONTENT_DIR/scripts/validate-content-connectivity.js" -d "$CONVERTED_DIR"

# Run the conversion script 
echo -e "\nConverting fix-connect predicates to semantic relationships..."
node "$SCRIPT_DIR/convert-fix-predicates.js" -c "$CONVERTED_DIR" -o "$CONVERTED_DIR/predicates" -v

# Rebuild indexes
echo -e "\nRebuilding indexes..."
node "$CONTENT_DIR/utils/build-index.js" "$CONVERTED_DIR" "$CONVERTED_DIR/index.json"

# Validate connectivity again
echo -e "\nValidating connectivity after conversion..."
node "$CONTENT_DIR/scripts/validate-content-connectivity.js" -d "$CONVERTED_DIR"

# Regenerate Obsidian vault
echo -e "\nRegenerating Obsidian vault..."
rm -rf "$BASE_DIR/client/obsidian-vault/*" 
node "$BASE_DIR/client/convertToObsidian.js"

echo -e "\nSemantic conversion complete!"