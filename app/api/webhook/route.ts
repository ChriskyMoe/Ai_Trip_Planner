import { NextRequest, NextResponse } from 'next/server';

/**
 * LiteAPI Webhook Endpoint
 * 
 * This endpoint receives webhook notifications from LiteAPI about booking events.
 * 
 * Events you might want to handle:
 * - booking.book: When a booking is confirmed
 * - booking.cancel: When a booking is cancelled
 * - payment.accepted: When payment is successfully processed
 * - payment.declined: When payment fails
 * - payment.balance: Payment balance updates
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Extract webhook data
    const { response, request: webhookRequest, eventName } = body;

    // Validate required fields
    if (!response || !webhookRequest || !eventName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify webhook authenticity (optional but recommended)
    // You can verify the webhook token here if you set one in LiteAPI dashboard
    const authToken = request.headers.get('x-webhook-token');
    const expectedToken = process.env.LITEAPI_WEBHOOK_TOKEN;
    
    if (expectedToken && authToken !== expectedToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Handle different event types
    switch (eventName) {
      case 'booking.book':
        await handleBookingConfirmed(response, webhookRequest);
        break;
      
      case 'booking.cancel':
        await handleBookingCancelled(response, webhookRequest);
        break;
      
      case 'payment.accepted':
        await handlePaymentAccepted(response, webhookRequest);
        break;
      
      case 'payment.declined':
        await handlePaymentDeclined(response, webhookRequest);
        break;
      
      case 'payment.balance':
        await handlePaymentBalance(response, webhookRequest);
        break;
      
      default:
        console.log(`Unhandled event: ${eventName}`, { response, webhookRequest });
    }

    // Always return 200 to acknowledge receipt
    // LiteAPI will retry if you return an error status
    return NextResponse.json({ 
      status: 'ok',
      received: true,
      event: eventName 
    });

  } catch (error: any) {
    console.error('Webhook error:', error);
    
    // Return 200 to prevent retries for malformed requests
    // Or return 500 if you want LiteAPI to retry
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

// Handler functions for different events

async function handleBookingConfirmed(response: any, webhookRequest: any) {
  console.log('Booking confirmed:', {
    bookingId: response.bookingId,
    status: response.status,
    hotelConfirmationCode: response.hotelConfirmationCode,
  });
  
  // Here you can:
  // - Update your database
  // - Send confirmation email to customer
  // - Update booking status in your system
  // - Trigger other business logic
  
  // Example: Store booking in database
  // await db.bookings.create({
  //   bookingId: response.bookingId,
  //   status: response.status,
  //   hotelConfirmationCode: response.hotelConfirmationCode,
  //   // ... other fields
  // });
}

async function handleBookingCancelled(response: any, webhookRequest: any) {
  console.log('Booking cancelled:', {
    bookingId: response.bookingId,
    reason: response.reason,
  });
  
  // Handle cancellation:
  // - Update booking status
  // - Process refunds if needed
  // - Notify customer
  // - Update inventory
}

async function handlePaymentAccepted(response: any, webhookRequest: any) {
  console.log('Payment accepted:', {
    transactionId: response.transactionId,
    amount: response.amount,
    currency: response.currency,
  });
  
  // Handle successful payment:
  // - Update payment status
  // - Confirm booking
  // - Send receipt
}

async function handlePaymentDeclined(response: any, webhookRequest: any) {
  console.log('Payment declined:', {
    transactionId: response.transactionId,
    reason: response.reason,
  });
  
  // Handle failed payment:
  // - Update booking status
  // - Notify customer
  // - Release inventory
}

async function handlePaymentBalance(response: any, webhookRequest: any) {
  console.log('Payment balance update:', response);
  
  // Handle balance updates:
  // - Update commission records
  // - Update earnings
}

// GET endpoint for webhook verification (optional)
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    status: 'ok',
    message: 'Webhook endpoint is active',
    timestamp: new Date().toISOString()
  });
}


