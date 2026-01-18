import { NextRequest, NextResponse } from 'next/server';
import { removeBackground } from '@imgly/background-removal-node';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: file.type });

    const resultBlob = await removeBackground(blob, {
      model: 'medium', // Best quality model (80MB) - higher quality than 'small'
      output: {
        format: 'image/png',
      },
    });

    const resultBuffer = await resultBlob.arrayBuffer();
    const processingTimeMs = Date.now() - startTime;

    return new NextResponse(resultBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'X-Processing-Time-Ms': String(processingTimeMs),
      },
    });
  } catch (error) {
    console.error('Background removal failed:', error);
    return NextResponse.json(
      { error: 'Background removal failed' },
      { status: 500 }
    );
  }
}
