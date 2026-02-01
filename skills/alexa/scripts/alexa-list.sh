#!/bin/bash
# Get items from an Alexa list (shopping list, to-do, etc.)
# Usage: alexa-list.sh [list-name]
# Default: "Shopping List"

LIST_NAME="${1:-Shopping List}"

# Check if alexacli is installed
if ! command -v alexacli &> /dev/null; then
    echo "Error: alexacli not installed"
    echo "Install: brew install buddyh/tap/alexacli"
    exit 1
fi

# Get list items
alexacli list "$LIST_NAME" 2>&1

# Check for auth errors
if [ $? -ne 0 ]; then
    echo ""
    echo "If auth error, run: alexacli auth"
fi
