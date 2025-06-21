#!/bin/bash

MAC="$1"

RESULT=$(curl -s -X POST http://192.168.100.158:8000/api/session_status \
  -H "Content-Type: application/json" \
  -d "{\"mac_address\": \"$MAC\"}")

if echo "$RESULT" | grep -q '"status":"active"'; then
  exit 0
else
  echo "Auth-Type := Reject"
  exit 0
fi

