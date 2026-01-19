
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ 
        error: 'OpenAI API key not configured',
        mock: true,
        url: 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?q=80&w=2070&auto=format&fit=crop' // Cyberpunk city fallback
      }, { status: 500 });
    }

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: `A high quality background image for a portrait subject, described as: ${prompt}. No text, no people in foreground.`,
        n: 1,
        size: "1024x1024",
        response_format: "url"
      })
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || 'Failed to generate image');
    }

    const data = await response.json();
    const imageUrl = data.data[0].url;

    return NextResponse.json({ url: imageUrl });

      } catch (error: unknown) {
        console.error('AI Generation Error:', error);
        return NextResponse.json(
          { error: (error as Error).message || 'Internal Server Error' },
          { status: 500 }
        );
      }
}
