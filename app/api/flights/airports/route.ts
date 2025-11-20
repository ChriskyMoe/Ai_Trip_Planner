import { NextRequest, NextResponse } from 'next/server';
import { searchAirports } from '@/lib/amadeus';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
      return NextResponse.json({ data: [] });
    }

    const airports = await searchAirports(query);
    return NextResponse.json({ data: airports });
  } catch (error: any) {
    console.error('Airport search error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to search airports' },
      { status: 500 }
    );
  }
}

