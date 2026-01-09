#!/bin/bash
# DNA Validator - Enforce Cognitive DNA patterns (Apple Silicon native)
# Scans content for blocked patterns and suggests alternatives
# Compatible with bash 3.2 (macOS default)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENFORCEMENT_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"
PROJECT_ROOT="/Users/arthurdell/ARTHUR"
CONFIG_FILE="$ENFORCEMENT_DIR/config/enforcement.json"
DNA_PROFILE="$PROJECT_ROOT/.claude/context/cognitive-dna/arthur-dna-profile.json"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Load config
load_config() {
    if [[ -f "$CONFIG_FILE" ]]; then
        DNA_ENABLED=$(jq -r '.enforcement.cognitiveDNA.enabled // true' "$CONFIG_FILE")
        DNA_LEVEL=$(jq -r '.enforcement.cognitiveDNA.level // "hard"' "$CONFIG_FILE")
    else
        DNA_ENABLED=true
        DNA_LEVEL="hard"
    fi
}

# Get alternative for a pattern
get_alternative() {
    local pattern="$1"
    case "$pattern" in
        *cuda*|*CUDA*)
            echo "torch.device('mps') for Apple Silicon"
            ;;
        *nvidia*|*NVIDIA*)
            echo "Apple Silicon GPU (M1/M2/M3/M4)"
            ;;
        *cudnn*|*nccl*)
            echo "Apple Neural Engine or Metal"
            ;;
        *)
            echo "Metal Performance Shaders (MPS) for GPU compute"
            ;;
    esac
}

# Scan file for blocked patterns
scan_file() {
    local file="$1"
    local violations=0

    if [[ ! -f "$file" ]]; then
        echo -e "${YELLOW}File not found: $file${NC}"
        return 0
    fi

    local filename=$(basename "$file")
    echo -e "\n${BLUE}Scanning: $filename${NC}"

    # Blocked patterns list
    local patterns="torch.cuda \.cuda\(\) cuda:0 cuda:1 torch.device.*cuda CUDA cudnn nvidia nccl"

    for pattern in $patterns; do
        if grep -qE "$pattern" "$file" 2>/dev/null; then
            local matches=$(grep -nE "$pattern" "$file" 2>/dev/null | head -5)
            echo -e "${RED}❌ Found blocked pattern: $pattern${NC}"
            echo "$matches" | while read -r line; do
                echo -e "   ${YELLOW}$line${NC}"
            done

            # Show alternative
            local alt=$(get_alternative "$pattern")
            echo -e "   ${GREEN}→ Use: $alt${NC}"

            violations=$((violations + 1))
        fi
    done

    return $violations
}

# Scan content string for blocked patterns
scan_content() {
    local content="$1"
    local violations=0
    local patterns="torch.cuda \.cuda\(\) cuda:0 cuda:1 CUDA cudnn nvidia nccl"

    for pattern in $patterns; do
        if echo "$content" | grep -qE "$pattern" 2>/dev/null; then
            echo -e "${RED}❌ Blocked pattern detected: $pattern${NC}"
            local alt=$(get_alternative "$pattern")
            echo -e "   ${GREEN}→ Alternative: $alt${NC}"
            violations=$((violations + 1))
        fi
    done

    return $violations
}

# Scan directory for violations
scan_directory() {
    local dir="${1:-.}"
    local total_violations=0
    local files_scanned=0

    echo -e "\n${GREEN}DNA COMPLIANCE SCAN${NC}"
    echo "═══════════════════════════════════════════════════════════"
    echo -e "Target: $dir"
    echo -e "Mode: $([ "$DNA_LEVEL" == "hard" ] && echo "Hard (blocking)" || echo "Soft (warning)")"

    # Find Python and relevant files
    while IFS= read -r file; do
        if [[ -n "$file" ]]; then
            local violations=0
            scan_file "$file"
            violations=$?
            total_violations=$((total_violations + violations))
            files_scanned=$((files_scanned + 1))
        fi
    done < <(find "$dir" -type f \( -name "*.py" -o -name "*.sh" -o -name "*.yaml" -o -name "*.yml" \) -not -path "*/\.*" -not -path "*/venv/*" -not -path "*/__pycache__/*" 2>/dev/null)

    echo -e "\n═══════════════════════════════════════════════════════════"
    echo -e "Files scanned: $files_scanned"

    if [[ $total_violations -gt 0 ]]; then
        echo -e "${RED}VIOLATIONS FOUND: $total_violations${NC}"
        echo -e "\n${YELLOW}Apple Silicon Native Alternatives:${NC}"
        echo "  PyTorch:    torch.device('mps')"
        echo "  ML Training: MLX (Apple's ML framework)"
        echo "  Inference:   CoreML"
        echo "  GPU Compute: Metal Performance Shaders"

        if [[ "$DNA_LEVEL" == "hard" ]]; then
            return 1
        fi
    else
        echo -e "${GREEN}NO VIOLATIONS - DNA compliant ✅${NC}"
    fi

    return 0
}

# Display DNA profile summary
show_profile() {
    if [[ ! -f "$DNA_PROFILE" ]]; then
        echo -e "${YELLOW}DNA profile not found${NC}"
        return
    fi

    echo -e "\n${GREEN}COGNITIVE DNA PROFILE${NC}"
    echo "═══════════════════════════════════════════════════════════"

    local success_rate=$(jq -r '.profile.successRate // "N/A"' "$DNA_PROFILE")
    local apple_silicon=$(jq -r '.profile.dimensions.technical.appleSilicon.confidence // "N/A"' "$DNA_PROFILE")

    echo -e "Success Rate: ${GREEN}${success_rate}%${NC}"
    echo -e "Apple Silicon Confidence: ${GREEN}${apple_silicon}%${NC}"

    echo -e "\n${YELLOW}Enforcement Rules:${NC}"
    echo "  ❌ BLOCKED: CUDA, cuDNN, NVIDIA patterns"
    echo "  ✅ REQUIRED: MPS, Metal, CoreML, MLX"

    echo -e "\n${BLUE}Gap Augmentation Active:${NC}"
    echo "  Security:    50% confidence → Extra validation"
    echo "  Performance: 50% confidence → Profiling reminders"
    echo "  Testing:     50% confidence → Coverage prompts"
}

# Main
main() {
    local mode="${1:-scan}"
    local target="${2:-.}"

    load_config

    if [[ "$DNA_ENABLED" != "true" ]]; then
        echo -e "${YELLOW}DNA enforcement disabled${NC}"
        exit 0
    fi

    case "$mode" in
        scan)
            scan_directory "$target"
            ;;
        content)
            scan_content "$target"
            ;;
        profile)
            show_profile
            ;;
        *)
            echo "Usage: $0 {scan|content|profile} [target]"
            exit 1
            ;;
    esac
}

main "$@"
