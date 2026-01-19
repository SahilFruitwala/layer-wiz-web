
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { prompt, apiKey } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Use provided API key or fall back to env variable
    const effectiveApiKey = apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    
    if (!effectiveApiKey) {
      console.warn("Gemini API Key missing");
      return NextResponse.json({ 
        error: 'Gemini/Google API Key not configured',
        mock: true,
        url: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=1974&auto=format&fit=crop'
      }, { status: 200 }); // Return 200 with mock for graceful fallback
    }

    // Attempt to call Imagen 3 via REST API with API Key
    const model = 'imagen-4.0-fast-generate-001';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict?key=${effectiveApiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        instances: [
          { prompt: `High quality, photorealistic background: ${prompt}` }
        ],
        parameters: {
          sampleCount: 1,
          aspectRatio: "1:1"
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Imagen API Error:", errText);
      
      // Check for specific error types
      if (response.status === 401 || response.status === 403) {
        return NextResponse.json(
          { error: 'Invalid API key or Imagen access not enabled. Check your API key permissions.' },
          { status: 401 }
        );
      }
      
      throw new Error(`Imagen Generation Failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.predictions && data.predictions[0]?.bytesBase64Encoded) {
      const base64 = data.predictions[0].bytesBase64Encoded;
      return NextResponse.json({ url: `data:image/png;base64,${base64}` });
    }
     
    throw new Error('Unexpected response format from Imagen');

  } catch (error: any) {
    console.error('Gemini Generation Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
