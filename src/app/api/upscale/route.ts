
import { NextResponse } from 'next/server';
import Replicate from 'replicate';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN || process.env.NEXT_PUBLIC_REPLICATE_API_TOKEN,
});

export async function POST(req: Request) {
  try {
    const { image, scale = 2 } = await req.json();

    if (!image) {
      return NextResponse.json({ error: 'Image is required' }, { status: 400 });
    }

    if (!process.env.REPLICATE_API_TOKEN && !process.env.NEXT_PUBLIC_REPLICATE_API_TOKEN) {
        return NextResponse.json(
            { error: 'Replicate API Token missing' },
            { status: 500 }
        );
    }

    // Using Real-ESRGAN
    const output = await replicate.run(
      "nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73ab41b2ee83fbc71ae95",
      {
        input: {
          image: image,
          scale: scale,
          face_enhance: true
        }
      }
    );

    return NextResponse.json({ url: output });

  } catch (error: any) {
    console.error('Upscale Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upscale image' },
      { status: 500 }
    );
  }
}
