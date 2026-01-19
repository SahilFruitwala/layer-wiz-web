# LayerWiz 🧙

AI-powered image editing tool with background removal and text-behind-subject effects.

## Quick Start

```bash
git clone https://github.com/yourusername/layer-wiz.git
cd layer-wiz
./start.sh
```

That's it! The script automatically:
- Installs Node.js dependencies (using bun or npm)
- Sets up Python virtual environment
- Installs Python dependencies (PyTorch, BiRefNet model)
- Starts both frontend and backend servers

Once running:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

Press `Ctrl+C` to stop all servers.

## Requirements

- **Node.js** 18+ (with npm or bun)
- **Python** 3.9+

## Features

- 🎨 **Remove Background** - AI-powered background removal using BiRefNet
- ✏️ **Manual Touch-up** - Brush tools to refine edges
- 📝 **Text Behind Subject** - Add text that appears behind the subject
- 📦 **Bulk Processing** - Process multiple images at once
- ⬇️ **Download** - Export as high-quality PNG

## Project Structure

```
layer-wiz/
├── src/                    # Next.js frontend
│   ├── app/               # App router pages
│   ├── components/        # React components
│   └── hooks/             # Custom hooks
├── backend/               # Python FastAPI backend
│   ├── main.py           # API endpoints
│   └── requirements.txt  # Python dependencies
├── start.sh              # One-command start script
└── setup.sh              # Setup only (optional)
```

## AI Features (Optional)

LayerWiz includes optional AI-powered features:

- **Smart Suggest** - Analyzes your image and suggests creative backgrounds
- **AI Background Generation** - Creates custom backgrounds from text prompts

To enable these features:
1. Click the ⚙️ **Settings** button in the app
2. Get a free API key from [Google AI Studio](https://aistudio.google.com/apikey)
3. Paste your key and select a model

> **Note:** All other features (background removal, manual editing, text layers) work without an API key.

## Manual Setup

If you prefer to run things separately:

```bash
# Terminal 1: Frontend
npm install
npm run dev

# Terminal 2: Backend
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

## License

MIT
