import { NextRequest, NextResponse } from 'next/server';
import { getHotelDetails } from '@/lib/api';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const hotelId = searchParams.get('hotelId');

  if (!hotelId) {
    return NextResponse.json({ error: 'hotelId parameter required' }, { status: 400 });
  }

  try {
    const data = await getHotelDetails(hotelId);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

