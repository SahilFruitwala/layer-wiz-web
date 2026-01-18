"""
FastAPI Background Removal Server
Uses BiRefNet (state-of-the-art 2024) for highest quality background removal
"""

import io
import time
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from PIL import Image
import torch
from torchvision import transforms
from transformers import AutoModelForImageSegmentation

app = FastAPI(title="LayerWiz Background Removal API")

# Configure CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Processing-Time-Ms"],
)

# Initialize BiRefNet - state of the art for background removal
print("Loading BiRefNet model (state-of-the-art 2024)...")
device = "mps" if torch.backends.mps.is_available() else "cuda" if torch.cuda.is_available() else "cpu"
print(f"Using device: {device}")

birefnet = AutoModelForImageSegmentation.from_pretrained(
    "ZhengPeng7/BiRefNet",
    trust_remote_code=True
)
birefnet.to(device)
birefnet.eval()
print("BiRefNet loaded successfully!")

# Image preprocessing
transform = transforms.Compose([
    transforms.Resize((1024, 1024)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])


def remove_background_birefnet(image: Image.Image) -> Image.Image:
    """Remove background using BiRefNet with highest quality settings"""
    original_size = image.size
    
    # Prepare input
    input_tensor = transform(image).unsqueeze(0).to(device)
    
    # Run inference
    with torch.no_grad():
        preds = birefnet(input_tensor)[-1].sigmoid()
    
    # Get mask and resize to original size
    mask = preds[0].squeeze().cpu()
    mask_pil = transforms.ToPILImage()(mask)
    mask_pil = mask_pil.resize(original_size, Image.LANCZOS)
    
    # Apply mask to create RGBA output
    image_rgba = image.convert("RGBA")
    image_rgba.putalpha(mask_pil)
    
    return image_rgba


@app.post("/remove-bg")
async def remove_background(image: UploadFile = File(...)):
    """
    Remove background from an uploaded image using BiRefNet.
    Returns PNG with transparent background.
    """
    start_time = time.time()
    
    # Validate file type
    if not image.content_type or not image.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        # Read and process image
        contents = await image.read()
        img = Image.open(io.BytesIO(contents)).convert('RGB')
        
        # Process with BiRefNet
        output = remove_background_birefnet(img)
        
        # Convert to PNG bytes
        output_buffer = io.BytesIO()
        output.save(output_buffer, format='PNG')
        output_buffer.seek(0)
        
        # Calculate processing time
        processing_time_ms = int((time.time() - start_time) * 1000)
        
        return Response(
            content=output_buffer.getvalue(),
            media_type="image/png",
            headers={"X-Processing-Time-Ms": str(processing_time_ms)}
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Background removal failed: {str(e)}")


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy", 
        "model": "BiRefNet (SOTA 2024)",
        "device": device
    }
