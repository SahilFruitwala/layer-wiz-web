# LayerWiz 🧙

AI-powered image editing tool with background removal and text-behind-subject effects.

![macOS](https://img.shields.io/badge/macOS-000000?style=flat&logo=apple&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-black?style=flat&logo=next.js&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=flat&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat&logo=fastapi&logoColor=white)

## ✨ Features

- 🎨 **Remove Background** - State-of-the-art AI background removal using [BiRefNet](https://github.com/ZhengPeng7/BiRefNet) (SOTA 2024)
- ✏️ **Manual Touch-up** - Brush and eraser tools to refine edges with precision
- 📝 **Text Behind Subject** - Add stylized text that appears behind the subject
- 🎯 **Real-time Preview** - See changes instantly as you edit
- 📦 **Bulk Processing** - Process multiple images at once
- 🖼️ **Custom Backgrounds** - Solid colors, gradients, or AI-generated backgrounds
- ⬇️ **High-Quality Export** - Download as PNG with transparency preserved

## 🚀 Quick Start

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

## 📋 Requirements

| Requirement | Version |
|------------|---------|
| **Node.js** | 18+ (with npm or bun) |
| **Python** | 3.9+ |
| **macOS** | Recommended (Apple Silicon optimized via MPS) |

> **Note:** The app runs on CPU if no GPU is available, but processing will be slower.

## 🛠️ Tech Stack

### Frontend
- **Next.js 16** - React framework with Turbopack
- **TypeScript** - Type-safe development
- **Tailwind CSS 4** - Utility-first styling
- **Fabric.js** - Canvas manipulation for image editing
- **Lucide React** - Beautiful icons

### Backend
- **FastAPI** - High-performance Python API
- **BiRefNet** - State-of-the-art image segmentation model
- **PyTorch** - ML framework with MPS/CUDA support
- **Pillow** - Image processing

## 📁 Project Structure

```
layer-wiz/
├── src/                    # Next.js frontend
│   ├── app/               # App router pages
│   │   ├── page.tsx       # Main editor page
│   │   └── api/           # API routes (Gemini integration)
│   ├── components/        # React components
│   │   ├── RemoveBgCanvas.tsx   # Background removal canvas
│   │   ├── EditorCanvas.tsx     # Text-behind editor
│   │   └── LayeringControls.tsx # Text styling controls
│   └── hooks/             # Custom React hooks
│       └── useBackgroundRemover.ts
├── backend/               # Python FastAPI backend
│   ├── main.py           # API endpoints & BiRefNet integration
│   └── requirements.txt  # Python dependencies
├── public/                # Static assets
├── start.sh              # One-command start script
└── setup.sh              # Setup only (optional)
```

## 🤖 AI Features (Optional)

LayerWiz includes optional AI-powered features:

- **Smart Suggest** - Analyzes your image and suggests creative backgrounds
- **AI Background Generation** - Creates custom backgrounds from text prompts

To enable these features:
1. Click the ⚙️ **Settings** button in the app
2. Get a free API key from [Google AI Studio](https://aistudio.google.com/apikey)
3. Paste your key and select a model

> **Note:** All other features (background removal, manual editing, text layers) work without an API key.

## 🔧 Manual Setup

If you prefer to run things separately:

```bash
# 1. Install frontend dependencies
npm install   # or: bun install

# 2. Setup Python backend
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cd ..

# 3. Start both servers
npm run dev   # or: bun dev

# Or run separately in two terminals:
# Terminal 1: npm run dev:frontend
# Terminal 2: npm run dev:backend
```

## 🐛 Troubleshooting

### "Failed to fetch" error
The Python backend is not running. Make sure both servers are started:
```bash
npm run dev
```
Or start the backend manually:
```bash
cd backend && source .venv/bin/activate && uvicorn main:app --reload --port 8000
```

### "Address already in use" error
Another process is using port 8000. Kill it first:
```bash
lsof -ti :8000 | xargs kill -9
```

### Missing Python dependencies
If you see import errors, reinstall dependencies:
```bash
cd backend
source .venv/bin/activate
pip install -r requirements.txt
```

### Slow processing on first run
The BiRefNet model (~400MB) downloads on first use. Subsequent runs will be faster as the model is cached.

## 🔌 API Reference

### Remove Background

```bash
POST /remove-bg
Content-Type: multipart/form-data

# Request: image file
# Response: PNG with transparent background
# Header: X-Processing-Time-Ms (processing duration)
```

### Health Check

```bash
GET /health

# Response:
{
  "status": "healthy",
  "model": "BiRefNet (SOTA 2024)",
  "device": "mps"  # or "cuda" or "cpu"
}
```

## 📄 License

MIT

---

<p align="center">
  Made with ❤️ using Next.js and PyTorch
</p>
