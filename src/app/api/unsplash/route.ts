
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('query');

  const apiKey = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY || process.env.UNSPLASH_ACCESS_KEY;

  if (!apiKey) {
      // Return a few mock nature images if no key
      return NextResponse.json({
          results: [
            { id: '1', urls: { regular: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=800' }, alt_description: 'Nature' },
            { id: '2', urls: { regular: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=800' }, alt_description: 'City' },
            { id: '3', urls: { regular: 'https://images.unsplash.com/photo-1453728013993-6d66e9c9123a?auto=format&fit=crop&w=800' }, alt_description: 'Lens' },
            { id: '4', urls: { regular: 'https://images.unsplash.com/photo-1554080353-a576cf803bda?auto=format&fit=crop&w=800' }, alt_description: 'Photography' }
          ],
          mock: true
      });
  }

  // If query is empty, list random/editorial?
  const endpoint = query 
    ? `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=12`
    : `https://api.unsplash.com/photos?per_page=12`;

  try {
    const response = await fetch(endpoint, {
        headers: {
            'Authorization': `Client-ID ${apiKey}`
        }
    });
    
    if (!response.ok) throw new Error('Unsplash API Failed');
    
    const data = await response.json();
    return NextResponse.json(query ? data : { results: data }); // Search returns { results: [] }, List returns []

  } catch (error) {
      return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
