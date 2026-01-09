#!/bin/bash
# Agent Documentation Refresh
# Runs weekly to update Tailscale and LM Studio documentation
# Scheduled via LaunchAgent

set -e

AGENT="${1:-all}"
PROJECT_ROOT="/Users/arthurdell/ARTHUR"
LOG_DIR="$PROJECT_ROOT/logs"
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")

mkdir -p "$LOG_DIR"

log() {
    echo "[$TIMESTAMP] $1" | tee -a "$LOG_DIR/agent-docs-refresh.log"
}

refresh_tailscale() {
    log "Refreshing Tailscale docs..."

    # Update model inventory from TAILSCALE nodes
    TAILSCALE_DOCS="$PROJECT_ROOT/tailscale-docs"

    # Check node status
    if command -v tailscale &> /dev/null; then
        tailscale status > "$TAILSCALE_DOCS/node-status.txt" 2>/dev/null || true
        log "  Updated node-status.txt"
    fi

    # Update last refresh timestamp
    echo "Last refreshed: $TIMESTAMP" > "$TAILSCALE_DOCS/.last-refresh"
    log "  Tailscale docs refresh complete"
}

refresh_lmstudio() {
    log "Refreshing LM Studio docs..."

    LMSTUDIO_DOCS="$PROJECT_ROOT/lm-studio-docs"

    # Refresh model inventory from ALPHA
    ALPHA_MODELS=$(curl -s --connect-timeout 5 http://100.65.29.44:1234/v1/models 2>/dev/null | jq -r '.data[].id' 2>/dev/null || echo "ALPHA offline")

    # Refresh model inventory from BETA
    BETA_MODELS=$(curl -s --connect-timeout 5 http://100.84.202.68:1234/v1/models 2>/dev/null | jq -r '.data[].id' 2>/dev/null || echo "BETA offline")

    # Update models.md with current inventory
    cat > "$LMSTUDIO_DOCS/models.md" << EOF
# LM Studio Models

**Last Updated:** $TIMESTAMP

---

## TAILSCALE Node Models

### ALPHA (100.65.29.44)

\`\`\`
$ALPHA_MODELS
\`\`\`

### BETA (100.84.202.68)

\`\`\`
$BETA_MODELS
\`\`\`

---

## Supported Formats

| Format | Extension | Description |
|--------|-----------|-------------|
| GGUF | \`.gguf\` | Quantized models for llama.cpp |
| SafeTensors | \`.safetensors\` | Safe tensor format |
| MLX | \`-mlx\` | Apple Silicon optimized |

---

## Model Selection

Use the model ID in API requests:

\`\`\`json
{
  "model": "<model-id>",
  "messages": [...]
}
\`\`\`

---

## Refresh Model List

\`\`\`bash
# ALPHA
curl -s http://100.65.29.44:1234/v1/models | jq '.data[].id'

# BETA
curl -s http://100.84.202.68:1234/v1/models | jq '.data[].id'
\`\`\`
EOF

    # Update summary with current state
    echo "Last refreshed: $TIMESTAMP" > "$LMSTUDIO_DOCS/.last-refresh"
    log "  LM Studio docs refresh complete"
    log "  ALPHA models: $(echo "$ALPHA_MODELS" | tr '\n' ', ')"
    log "  BETA models: $(echo "$BETA_MODELS" | tr '\n' ', ')"
}

# Main
log "=== Agent Documentation Refresh Started ==="

case "$AGENT" in
    tailscale)
        refresh_tailscale
        ;;
    lmstudio)
        refresh_lmstudio
        ;;
    all)
        refresh_tailscale
        refresh_lmstudio
        ;;
    *)
        log "Unknown agent: $AGENT"
        exit 1
        ;;
esac

log "=== Refresh Complete ==="
