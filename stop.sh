#!/usr/bin/env bash

# Dynamically resolve script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🛑 Stopping CinePro Backend & Frontend services..."

# Terminate using saved process PIDs
if [ -f "${SCRIPT_DIR}/.backend.pid" ]; then
    PID=$(cat "${SCRIPT_DIR}/.backend.pid")
    kill -9 "$PID" >/dev/null 2>&1
    rm -f "${SCRIPT_DIR}/.backend.pid"
fi

if [ -f "${SCRIPT_DIR}/.frontend.pid" ]; then
    PID=$(cat "${SCRIPT_DIR}/.frontend.pid")
    kill -9 "$PID" >/dev/null 2>&1
    rm -f "${SCRIPT_DIR}/.frontend.pid"
fi

# Terminate any remaining process listening on ports 3000 (Backend) and 5173 (Frontend)
if command -v fuser >/dev/null 2>&1; then
    fuser -k 3000/tcp >/dev/null 2>&1
    fuser -k 5173/tcp >/dev/null 2>&1
fi

# Fallback kill for tsx watch & vite processes
pkill -f "tsx watch src/server.ts" >/dev/null 2>&1
pkill -f "vite" >/dev/null 2>&1

echo "✅ CinePro services have been completely terminated."
