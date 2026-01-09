#!/bin/bash
#
# AI Board of Directors - Backend Service Manager
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$SCRIPT_DIR/service.pid"
LOG_FILE="$SCRIPT_DIR/service.log"
PORT="${PORT:-8000}"

# Ensure Bun is in PATH
export PATH="$HOME/.bun/bin:$PATH"

start() {
    if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
        echo "Service already running (PID: $(cat "$PID_FILE"))"
        return 1
    fi

    echo "Starting AI Board of Directors Backend..."
    cd "$SCRIPT_DIR"

    nohup bun run src/index.ts > "$LOG_FILE" 2>&1 &
    echo $! > "$PID_FILE"

    sleep 2

    if kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
        echo "Service started (PID: $(cat "$PID_FILE"))"
        echo "API: http://localhost:$PORT"
        echo "WebSocket: ws://localhost:$PORT/ws"
    else
        echo "Failed to start service"
        rm -f "$PID_FILE"
        return 1
    fi
}

stop() {
    if [ ! -f "$PID_FILE" ]; then
        echo "Service not running (no PID file)"
        return 0
    fi

    local pid
    pid=$(cat "$PID_FILE")

    if kill -0 "$pid" 2>/dev/null; then
        echo "Stopping service (PID: $pid)..."
        kill "$pid"
        rm -f "$PID_FILE"
        echo "Service stopped"
    else
        echo "Service not running (stale PID file)"
        rm -f "$PID_FILE"
    fi
}

restart() {
    stop
    sleep 1
    start
}

status() {
    if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
        echo "Service running (PID: $(cat "$PID_FILE"))"
        echo ""
        echo "Health check:"
        curl -s "http://localhost:$PORT/health" | jq . 2>/dev/null || echo "  (unable to fetch)"
    else
        echo "Service not running"
        return 1
    fi
}

logs() {
    if [ -f "$LOG_FILE" ]; then
        tail -f "$LOG_FILE"
    else
        echo "No log file found"
    fi
}

case "$1" in
    start)
        start
        ;;
    stop)
        stop
        ;;
    restart)
        restart
        ;;
    status)
        status
        ;;
    logs)
        logs
        ;;
    *)
        echo "AI Board of Directors - Backend Service"
        echo ""
        echo "Usage: $0 {start|stop|restart|status|logs}"
        echo ""
        echo "Commands:"
        echo "  start   - Start the backend server"
        echo "  stop    - Stop the backend server"
        echo "  restart - Restart the backend server"
        echo "  status  - Show service status and health"
        echo "  logs    - Tail the service logs"
        exit 1
        ;;
esac
