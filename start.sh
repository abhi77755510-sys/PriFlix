#!/usr/bin/env bash

# Dynamically resolve script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Get Linux machine local network IP address
LOCAL_IP=$(hostname -I | awk '{print $1}')
if [ -z "$LOCAL_IP" ]; then
    LOCAL_IP="localhost"
fi

echo "=================================================="
echo "🚀 Starting CinePro (Backend + Frontend)"
echo "=================================================="

# Ensure any previous instances are terminated first
if [ -f "${SCRIPT_DIR}/stop.sh" ]; then
    bash "${SCRIPT_DIR}/stop.sh" >/dev/null 2>&1
fi

# Start Backend in background
echo "Starting Backend (Port 3000)..."
cd "${SCRIPT_DIR}/backend" || exit 1
npm run dev -- --host 0.0.0.0 > "${SCRIPT_DIR}/backend.log" 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > "${SCRIPT_DIR}/.backend.pid"

# Start Frontend in background
echo "Starting Frontend (Port 5173)..."
cd "${SCRIPT_DIR}/frontend" || exit 1
npm run dev -- --host 0.0.0.0 > "${SCRIPT_DIR}/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > "${SCRIPT_DIR}/.frontend.pid"

sleep 3

echo ""
echo "=================================================="
echo "✅ CinePro is running successfully!"
echo "--------------------------------------------------"
echo "💻 Local Access:   http://localhost:5173"
echo "📲 Hotspot Access: http://${LOCAL_IP}:5173"
echo "--------------------------------------------------"
echo "📄 Logs: ${SCRIPT_DIR}/backend.log & ${SCRIPT_DIR}/frontend.log"
echo "🛑 To stop CinePro: run ./stop.sh"
echo "=================================================="
