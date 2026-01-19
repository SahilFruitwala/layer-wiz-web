
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '');

export async function POST(req: Request) {
  try {
    const { image } = await req.json(); // Expecting base64 or url? 
    // Usually for Gemini Multimodal, we need inline data (base64) or file token.
    // Client should send base64 data (without prefix ideally, or we strip it).

    if (!image) {
      return NextResponse.json({ error: 'Image data is required' }, { status: 400 });
    }
    
    // Check key
    if (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_API_KEY) {
        return NextResponse.json({ 
            error: 'Gemini API Key missing',
            mock: true,
            suggestion: "A futuristic city skyline at sunset with neon accents." // Mock suggestion
        }, { status: 500 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    // Format image for Gemini
    // Assuming 'image' is a data URL: "data:image/jpeg;base64,....."
    const matches = image.match(/^data:(.+);base64,(.+)$/);
    if (!matches) {
        return NextResponse.json({ error: 'Invalid image format. Expected base64 data URL.' }, { status: 400 });
    }
    
    const mimeType = matches[1];
    const data = matches[2];

    const prompt = "Analyze this image and suggest a creative, high-quality background description that would suit this subject perfectly. Keep it concise (1-2 sentences). Focus on lighting, mood, and environment that complements the subject.";

    const result = await model.generateContent([
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
    return NextResponse.json(
      { error: error.message || 'Analysis Failed' },
      { status: 500 }
    );
  }
}
