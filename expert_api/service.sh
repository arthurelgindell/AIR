#!/bin/bash
# Expert API Service Management
# Manages the FastAPI server and Tailscale serve configuration

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$SCRIPT_DIR/api.pid"
LOG_FILE="$SCRIPT_DIR/api.log"
PORT=8080

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

start() {
    echo -e "${GREEN}Starting Expert API...${NC}"

    # Check if already running
    if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
        echo -e "${YELLOW}Expert API already running (PID: $(cat "$PID_FILE"))${NC}"
        return 1
    fi

    # Start uvicorn in background (use python3 -m to ensure correct environment)
    cd "$SCRIPT_DIR"
    nohup python3 -m uvicorn server:app --host 0.0.0.0 --port $PORT > "$LOG_FILE" 2>&1 &
    echo $! > "$PID_FILE"

    sleep 2

    # Verify it started
    if kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
        echo -e "${GREEN}FastAPI server started (PID: $(cat "$PID_FILE"))${NC}"
    else
        echo -e "${RED}Failed to start FastAPI server. Check $LOG_FILE${NC}"
        return 1
    fi

    # Configure Tailscale serve
    echo -e "${GREEN}Configuring Tailscale serve...${NC}"
    tailscale serve --bg $PORT

    echo -e "${GREEN}Expert API available at: https://air.tail5f2bae.ts.net/${NC}"
}

stop() {
    echo -e "${YELLOW}Stopping Expert API...${NC}"

    # Stop Tailscale serve
    tailscale serve off 2>/dev/null || true

    # Stop FastAPI server
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if kill -0 "$PID" 2>/dev/null; then
            kill "$PID"
            echo -e "${GREEN}FastAPI server stopped (PID: $PID)${NC}"
        fi
        rm -f "$PID_FILE"
    else
        echo -e "${YELLOW}No PID file found${NC}"
    fi

    echo -e "${GREEN}Expert API stopped${NC}"
}

status() {
    echo -e "${GREEN}=== Expert API Status ===${NC}"

    # Check FastAPI server
    if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
        echo -e "FastAPI: ${GREEN}Running${NC} (PID: $(cat "$PID_FILE"))"

        # Health check
        HEALTH=$(curl -s http://localhost:$PORT/health 2>/dev/null || echo "unavailable")
        echo -e "Health: $HEALTH"
    else
        echo -e "FastAPI: ${RED}Not running${NC}"
    fi

    echo ""

    # Check Tailscale serve
    echo -e "${GREEN}=== Tailscale Serve Status ===${NC}"
    tailscale serve status 2>/dev/null || echo "Not configured"
}

logs() {
    if [ -f "$LOG_FILE" ]; then
        tail -f "$LOG_FILE"
    else
        echo "No log file found"
    fi
}

restart() {
    stop
    sleep 1
    start
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
        echo "Usage: $0 {start|stop|restart|status|logs}"
        echo ""
        echo "Commands:"
        echo "  start   - Start FastAPI server and configure Tailscale serve"
        echo "  stop    - Stop server and disable Tailscale serve"
        echo "  restart - Restart the service"
        echo "  status  - Show service status and health"
        echo "  logs    - Tail the log file"
        exit 1
        ;;
esac
