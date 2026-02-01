#!/bin/bash
# Add item to an Alexa list
# Usage: alexa-add.sh <item> [list-name]
# Default list: "Shopping List"

if [ -z "$1" ]; then
    echo "Usage: alexa-add.sh <item> [list-name]"
    echo "Example: alexa-add.sh 'milk' 'Shopping List'"
    exit 1
fi

ITEM="$1"
LIST_NAME="${2:-Shopping List}"

# Check if alexacli is installed
if ! command -v alexacli &> /dev/null; then
    echo "Error: alexacli not installed"
    echo "Install: brew install buddyh/tap/alexacli"
    exit 1
fi

# Add item
alexacli add "$LIST_NAME" "$ITEM"
