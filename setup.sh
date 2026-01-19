#!/bin/bash

# LayerWiz - One Command Setup Script
# This script sets up both the Next.js frontend and Python backend

set -e

echo "🧙 LayerWiz Setup"
echo "================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check for required tools
check_requirements() {
    echo ""
    echo "📋 Checking requirements..."
    
    # Check for Node.js
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js is not installed. Please install Node.js 18+ first.${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓${NC} Node.js $(node -v)"
    
    # Check for npm/bun
    if command -v bun &> /dev/null; then
        PKG_MANAGER="bun"
        echo -e "${GREEN}✓${NC} Bun $(bun -v)"
    elif command -v npm &> /dev/null; then
        PKG_MANAGER="npm"
        echo -e "${GREEN}✓${NC} npm $(npm -v)"
    else
        echo -e "${RED}❌ Neither bun nor npm found. Please install one.${NC}"
        exit 1
    fi
    
    # Check for Python 3
    if command -v python3 &> /dev/null; then
        PYTHON_CMD="python3"
        echo -e "${GREEN}✓${NC} Python $($PYTHON_CMD --version | cut -d' ' -f2)"
    elif command -v python &> /dev/null; then
        PYTHON_CMD="python"
        echo -e "${GREEN}✓${NC} Python $($PYTHON_CMD --version | cut -d' ' -f2)"
    else
        echo -e "${RED}❌ Python 3 is not installed. Please install Python 3.9+ first.${NC}"
        exit 1
    fi
}

# Setup frontend
setup_frontend() {
    echo ""
    echo "📦 Installing frontend dependencies..."
    
    if [ "$PKG_MANAGER" = "bun" ]; then
        bun install
    else
        npm install
    fi
    
    echo -e "${GREEN}✓${NC} Frontend dependencies installed"
}

# Setup backend
setup_backend() {
    echo ""
    echo "🐍 Setting up Python backend..."
    
    cd backend
    
    # Create virtual environment if it doesn't exist
    if [ ! -d ".venv" ]; then
        echo "  Creating virtual environment..."
        $PYTHON_CMD -m venv .venv
    fi
    
    # Activate and install dependencies
    echo "  Installing Python dependencies..."
    source .venv/bin/activate
    pip install -q --upgrade pip
    pip install -q -r requirements.txt
    
    cd ..
    
    echo -e "${GREEN}✓${NC} Backend dependencies installed"
}

# Setup environment file
setup_env() {
    echo ""
    if [ ! -f ".env.local" ]; then
        echo "📝 Creating .env.local from .env.example..."
        cp .env.example .env.local
        echo -e "${YELLOW}⚠️  Please edit .env.local and add your API keys${NC}"
    else
        echo -e "${GREEN}✓${NC} .env.local already exists"
    fi
}

# Print success message
print_success() {
    echo ""
    echo "═══════════════════════════════════════════════════"
    echo -e "${GREEN}✅ Setup complete!${NC}"
    echo "═══════════════════════════════════════════════════"
    echo ""
    echo "To start the app, run:"
    echo ""
    echo "  ${YELLOW}./start.sh${NC}"
    echo ""
    echo "Or start manually:"
    echo "  ${YELLOW}$PKG_MANAGER run dev${NC} (starts both frontend and backend)"
    echo ""
}

# Main
check_requirements
setup_frontend
setup_backend
setup_env
print_success
