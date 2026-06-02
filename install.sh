#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────────
# nice-image — GPT-Image-2 CLI installer
# One command: git clone ... && bash install.sh
# ──────────────────────────────────────────────────

SKILL_NAME="nice-image"
SKILL_DIR="$HOME/.claude/skills/$SKILL_NAME"
CODX_DIR="$HOME/.agents/skills/$SKILL_NAME"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo ""
echo -e "${CYAN}══════════════════════════════════════════════${NC}"
echo -e "${CYAN}   nice-image — GPT-Image-2 CLI Installer${NC}"
echo -e "${CYAN}══════════════════════════════════════════════${NC}"
echo ""

# ── 1. Detect shell RC file ──
detect_rc() {
    local shell_name
    shell_name=$(basename "$SHELL" 2>/dev/null || echo "bash")
    case "$shell_name" in
        zsh)
            echo "$HOME/.zshrc"
            ;;
        bash)
            if [ -f "$HOME/.bashrc" ]; then
                echo "$HOME/.bashrc"
            elif [ -f "$HOME/.bash_profile" ]; then
                echo "$HOME/.bash_profile"
            else
                echo "$HOME/.bashrc"
            fi
            ;;
        *)
            echo "$HOME/.profile"
            ;;
    esac
}

RC_FILE=$(detect_rc)

# ── 2. Check prerequisites ──
echo -e "${YELLOW}[1/4]${NC} Checking prerequisites..."

if ! command -v node &>/dev/null; then
    echo -e "${RED}Node.js is not installed.${NC}"
    echo "Install it from: https://nodejs.org/ (v18 or later)"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}Node.js v18+ required. Current: $(node -v)${NC}"
    exit 1
fi

echo -e "  ${GREEN}✓${NC} Node.js $(node -v)"

if ! command -v npm &>/dev/null; then
    echo -e "${RED}npm is not installed.${NC}"
    exit 1
fi
echo -e "  ${GREEN}✓${NC} npm $(npm -v)"

# ── 3. Install project ──
echo ""
echo -e "${YELLOW}[2/4]${NC} Installing nice-image CLI..."

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

npm install --silent
npm run build --silent
npm install -g . --silent

echo -e "  ${GREEN}✓${NC} nice-image installed globally"
echo -e "  ${GREEN}✓${NC} huoke-image subcommands available"

# ── 4. Install skill files ──
echo ""
echo -e "${YELLOW}[3/4]${NC} Installing skill for Claude Code..."

# Claude Code
mkdir -p "$SKILL_DIR"
cp "$SCRIPT_DIR/SKILL.md" "$SKILL_DIR/SKILL.md" 2>/dev/null || true
cp "$SCRIPT_DIR/.claude/settings.json" "$SKILL_DIR/settings.json" 2>/dev/null || true
echo -e "  ${GREEN}✓${NC} Claude Code: $SKILL_DIR"

# Codex (or any agent that scans ~/.agents/skills/)
mkdir -p "$CODX_DIR"
cp "$SCRIPT_DIR/SKILL.md" "$CODX_DIR/SKILL.md" 2>/dev/null || true
echo -e "  ${GREEN}✓${NC} Codex: $CODX_DIR"

# ── 5. Configure API key ──
echo ""
echo -e "${YELLOW}[4/4]${NC} Configuring API key..."

ALREADY_SET=false
if grep -q "NICE_TOKEN_API_KEY" "$RC_FILE" 2>/dev/null; then
    ALREADY_SET=true
    echo -e "  ${GREEN}✓${NC} NICE_TOKEN_API_KEY already in $RC_FILE"
fi

if [ "$ALREADY_SET" = false ]; then
    echo ""
    echo -e "  ${CYAN}Enter your Nice-Token API key:${NC}"
    echo -n "  > "
    read -r API_KEY </dev/tty

    if [ -n "$API_KEY" ]; then
        {
            echo ""
            echo "# nice-image — GPT-Image-2 CLI"
            echo "export NICE_TOKEN_API_KEY=\"$API_KEY\""
        } >> "$RC_FILE"
        echo -e "  ${GREEN}✓${NC} Written to $RC_FILE"
        export NICE_TOKEN_API_KEY="$API_KEY"
    else
        echo -e "  ${YELLOW}⚠${NC}  Skipped. Set manually: export NICE_TOKEN_API_KEY=\"sk-...\""
    fi
fi

# ── 6. Optional smoke test ──
echo ""
echo -e "${CYAN}──────────────────────────────────────────────${NC}"
echo -e "  ${GREEN}Install complete!${NC}"
echo ""
echo -e "  Run a smoke test?"
echo -e "  ${YELLOW}(Generates a test image, ~10 seconds)${NC}"
echo -n "  [Y/n] > "
read -r RUN_TEST </dev/tty

if [ "$RUN_TEST" != "n" ] && [ "$RUN_TEST" != "N" ]; then
    echo ""
    echo -e "  ${CYAN}Running smoke test...${NC}"

    if [ -z "${NICE_TOKEN_API_KEY:-}" ]; then
        echo -e "  ${RED}✗${NC} NICE_TOKEN_API_KEY not set. Skipping smoke test."
    else
        nice-image -u "https://picsum.photos/512/512" \
            -p "A simple product on a clean white background, studio lighting" 2>&1 || true
        echo ""
        echo -e "  ${GREEN}✓${NC} Smoke test complete."
    fi
fi

echo ""
echo -e "${GREEN}══════════════════════════════════════════════${NC}"
echo -e "${GREEN}   Done! Next time Claude Code starts,${NC}"
echo -e "${GREEN}   it will auto-discover the skill.${NC}"
echo ""
echo -e "  Source your RC file now:"
echo -e "  ${CYAN}source $RC_FILE${NC}"
echo ""
echo -e "  Or test manually:"
echo -e "  ${CYAN}nice-image -u \"https://example.com/img.jpg\" -p \"test prompt\"${NC}"
echo -e "${GREEN}══════════════════════════════════════════════${NC}"
echo ""
