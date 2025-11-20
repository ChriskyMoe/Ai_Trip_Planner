import { NextRequest, NextResponse } from 'next/server';
import { searchRates } from '@/lib/api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = await searchRates(body);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

