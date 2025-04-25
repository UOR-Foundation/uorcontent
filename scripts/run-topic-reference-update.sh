#!/bin/bash

# UOR Framework - Run Topic Reference Update
# This script updates the topic references from fix-connect to semantic relationship names

# Set the base directory
BASE_DIR="/workspaces/codespaces-blank"
CONTENT_DIR="$BASE_DIR/content"
CONVERTED_DIR="$CONTENT_DIR/converted"
SCRIPT_DIR="$CONTENT_DIR/scripts"

# Make the update script executable
chmod +x "$SCRIPT_DIR/update-topic-references.js"

# First validate current connectivity to ensure we have a baseline
echo "Validating current connectivity..."
node "$SCRIPT_DIR/validate-content-connectivity.js" -d "$CONVERTED_DIR"

# Run the update script 
echo -e "\nUpdating topic references..."
node "$SCRIPT_DIR/update-topic-references.js" -c "$CONVERTED_DIR" -v

# Rebuild indexes
echo -e "\nRebuilding indexes..."
node "$CONTENT_DIR/utils/build-index.js" "$CONVERTED_DIR" "$CONVERTED_DIR/index.json"

# Validate connectivity again
echo -e "\nValidating connectivity after update..."
node "$SCRIPT_DIR/validate-content-connectivity.js" -d "$CONVERTED_DIR"

# Regenerate Obsidian vault
echo -e "\nRegenerating Obsidian vault..."
rm -rf "$BASE_DIR/client/obsidian-vault/*" 
node "$BASE_DIR/client/convertToObsidian.js"

echo -e "\nTopic reference update complete!"