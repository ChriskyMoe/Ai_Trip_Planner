import { NextRequest, NextResponse } from 'next/server';
import { searchFlights } from '@/lib/amadeus';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    const originLocationCode = searchParams.get('origin');
    const destinationLocationCode = searchParams.get('destination');
    const departureDate = searchParams.get('departureDate');
    const returnDate = searchParams.get('returnDate') || undefined;
    const adults = parseInt(searchParams.get('adults') || '1');
    const children = parseInt(searchParams.get('children') || '0') || undefined;
    const infants = parseInt(searchParams.get('infants') || '0') || undefined;
    const travelClass = searchParams.get('travelClass') as any || undefined;
    const currencyCode = searchParams.get('currency') || 'USD';

    if (!originLocationCode || !destinationLocationCode || !departureDate) {
      return NextResponse.json(
        { error: 'Missing required parameters: origin, destination, departureDate' },
        { status: 400 }
      );
    }

    const flights = await searchFlights({
      originLocationCode,
      destinationLocationCode,
      departureDate,
      returnDate,
      adults,
      children,
      infants,
      travelClass,
      currencyCode,
    });

    return NextResponse.json({
      success: true,
      data: flights,
      count: flights.length,
    });
  } catch (error: any) {
    console.error('Flight search error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to search flights' },
      { status: 500 }
    );
  }
}

