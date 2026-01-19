#!/bin/bash

# LayerWiz - One Command Start Script
# Sets up (if needed) and starts both frontend and backend servers

set -e

echo "🧙 LayerWiz"
echo "==========="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

# Detect package manager
if command -v bun &> /dev/null; then
    PKG_MANAGER="bun"
else
    PKG_MANAGER="npm"
fi

# Auto-setup if needed
needs_setup=false

if [ ! -d "node_modules" ]; then
    needs_setup=true
fi

if [ ! -d "backend/.venv" ]; then
    needs_setup=true
fi

if [ "$needs_setup" = true ]; then
    echo -e "${YELLOW}📦 First run detected - installing dependencies...${NC}"
    echo ""
    
    # Install frontend deps
    echo "Installing frontend dependencies..."
    $PKG_MANAGER install
    
    # Setup backend
    echo "Setting up Python backend..."
    cd backend
    python3 -m venv .venv
    source .venv/bin/activate
    pip install -q --upgrade pip
    pip install -q -r requirements.txt
    cd ..
    
    # Create .env.local if needed
    if [ ! -f ".env.local" ] && [ -f ".env.example" ]; then
        cp .env.example .env.local
        echo -e "${YELLOW}Created .env.local - add your API keys if needed${NC}"
    fi
    
    echo ""
    echo -e "${GREEN}✓ Setup complete!${NC}"
    echo ""
fi

# Start everything
echo -e "${CYAN}⚡ Starting LayerWiz...${NC}"
echo ""
echo "═══════════════════════════════════════════════════"
echo -e "${GREEN}✅ LayerWiz is starting!${NC}"
echo "═══════════════════════════════════════════════════"
echo -e "  Frontend: ${YELLOW}http://localhost:3000${NC}"
echo -e "  Backend:  ${YELLOW}http://localhost:8000${NC}"
echo -e "  API Docs: ${YELLOW}http://localhost:8000/docs${NC}"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

$PKG_MANAGER run dev
