
import { NextResponse } from 'next/server';
import Replicate from 'replicate';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN || process.env.NEXT_PUBLIC_REPLICATE_API_TOKEN,
});

export async function POST(req: Request) {
  try {
    const { image, mask, prompt } = await req.json();

    if (!image || !mask) {
      return NextResponse.json({ error: 'Image and mask are required' }, { status: 400 });
    }

    if (!process.env.REPLICATE_API_TOKEN && !process.env.NEXT_PUBLIC_REPLICATE_API_TOKEN) {
        return NextResponse.json(
            { error: 'Replicate API Token missing. Please check your .env.local' },
            { status: 500 }
        );
    }

    // Using LaMa (Resolution-robust Large Mask Inpainting)
    // It's fast and effective for object removal.
    // If prompt provided, we might switch to SD-Inpainting, but LaMa is best for "Eraser".
    const output = await replicate.run(
      "iagovar/lama:167d3c0c0570b5514f762f026a763872c0e9d6d451253457008cf6741168157e",
      {
        input: {
          image: image,
          mask: mask
        }
      }
    );

    // Replicate returns the URL directly or an array depending on model
    // LaMa returns a string output (image URL)
    return NextResponse.json({ url: output });

  } catch (error: any) {
    console.error('Magic Eraser Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process image' },
      { status: 500 }
    );
  }
}
