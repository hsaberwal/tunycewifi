#!/bin/bash

MAC="$1"
REASON="$2"

# Query the FastAPI /session_status API
SESSION_INFO=$(curl -s -X POST http://192.168.100.158:8000/api/session_status \
  -H "Content-Type: application/json" \
  -d "{\"mac_address\": \"$MAC\"}")

# Extract status
STATUS=$(echo "$SESSION_INFO" | grep -o '"status":"[^"]*"' | cut -d':' -f2 | tr -d '"')

# Default if no response
if [ -z "$STATUS" ]; then
  STATUS="unreachable"
fi

# Compose full reason
FINAL_REASON="$REASON - session=$STATUS"

# Log via FastAPI
curl -s -X POST http://192.168.100.158:8000/api/log_reject \
  -H "Content-Type: application/json" \
  -d "{\"mac_address\": \"$MAC\", \"reason\": \"$FINAL_REASON\"}"

exit 0

