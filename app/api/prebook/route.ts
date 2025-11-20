import { NextRequest, NextResponse } from 'next/server';
import { prebookOffer } from '@/lib/api';

export async function POST(request: NextRequest) {
  try {
    const { offerId } = await request.json();
    if (!offerId) {
      return NextResponse.json({ error: 'offerId required' }, { status: 400 });
    }
    const data = await prebookOffer(offerId);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

