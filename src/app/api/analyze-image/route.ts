
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
  try {
    const { image, apiKey, model } = await req.json();

    if (!image) {
      return NextResponse.json({ error: 'Image data is required' }, { status: 400 });
    }
    
    // Use provided API key or fall back to env variable
    const effectiveApiKey = apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    
    if (!effectiveApiKey) {
      return NextResponse.json({ 
        error: 'Gemini API Key not configured',
        mock: true,
        suggestion: "A futuristic city skyline at sunset with neon accents."
      }, { status: 200 }); // Return 200 with mock for graceful fallback
    }

    const genAI = new GoogleGenerativeAI(effectiveApiKey);
    
    // Use provided model or default
    const modelName = model || 'gemini-2.0-flash';
    const geminiModel = genAI.getGenerativeModel({ model: modelName });

    // Format image for Gemini
    // Assuming 'image' is a data URL: "data:image/jpeg;base64,....."
    const matches = image.match(/^data:(.+);base64,(.+)$/);
    if (!matches) {
      return NextResponse.json({ error: 'Invalid image format. Expected base64 data URL.' }, { status: 400 });
    }
    
    const mimeType = matches[1];
    const data = matches[2];

    const prompt = "Analyze this image and suggest a creative, high-quality background description that would suit this subject perfectly. Keep it concise (1-2 sentences). Focus on lighting, mood, and environment that complements the subject.";

    const result = await geminiModel.generateContent([
      prompt,
      {
        inlineData: {
          data: data,
          mimeType: mimeType
        }
      }
    ]);

    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ suggestion: text });

  } catch (error: any) {
    console.error('Gemini Analysis Error:', error);
    
    // Check for specific error types
    if (error.message?.includes('API_KEY_INVALID') || error.message?.includes('API key')) {
      return NextResponse.json(
        { error: 'Invalid API key. Please check your Gemini API key in Settings.' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Analysis Failed' },
      { status: 500 }
    );
  }
}
