import { NextRequest, NextResponse } from 'next/server';
import { bookHotel } from '@/lib/api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Log the request for debugging
    console.log('Booking request:', JSON.stringify(body, null, 2));
    
    // Validate required fields
    if (!body.prebookId) {
      return NextResponse.json({ error: 'prebookId is required' }, { status: 400 });
    }
    if (!body.transactionId) {
      return NextResponse.json({ error: 'transactionId is required' }, { status: 400 });
    }
    if (!body.holder || !body.holder.firstName || !body.holder.lastName || !body.holder.email) {
      return NextResponse.json({ error: 'holder information is required' }, { status: 400 });
    }
    if (!body.guests || body.guests.length === 0) {
      return NextResponse.json({ error: 'guests information is required' }, { status: 400 });
    }
    
    const data = await bookHotel(body);
    return NextResponse.json(data);
  } catch (error: any) {
    // Log the full error for debugging
    console.error('Booking error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Check for specific error types
    const errorMessage = error.message || 'Failed to book hotel';
    const errorCode = error.code;
    
    // Handle fraud check rejection specifically
    if (errorMessage.includes('fraud check') || errorCode === 2013) {
      return NextResponse.json({ 
        error: 'Booking was rejected by fraud check. This is common in sandbox mode. Please try again with different guest information or contact LiteAPI support.',
        code: 2013,
        type: 'fraud_check'
      }, { status: 403 });
    }
    
    // Handle payment not completed error
    if (errorMessage.includes('payment not completed') || errorCode === 2014) {
      return NextResponse.json({ 
        error: 'Payment is still processing. Please wait a moment and the booking will complete automatically. If this persists, please try again.',
        code: 2014,
        type: 'payment_pending',
        retry: true
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      error: errorMessage,
      code: errorCode,
      details: error.response?.data || error.cause || null
    }, { status: 500 });
  }
}

