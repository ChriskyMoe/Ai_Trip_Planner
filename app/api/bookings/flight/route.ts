import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function POST(request: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Supabase configuration missing' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await request.json();
    const { userId, bookingData } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (!bookingData || !bookingData.bookingId) {
      return NextResponse.json({ error: 'Booking data is required' }, { status: 400 });
    }

    // Insert flight booking into Supabase
    const { data, error } = await supabase
      .from('flight_bookings')
      .insert({
        user_id: userId,
        booking_id: bookingData.bookingId,
        flight_id: bookingData.flightId,
        status: bookingData.status || 'CONFIRMED',
        passenger: bookingData.passenger,
        flight_data: bookingData.flight,
        booking_date: bookingData.bookingDate,
        booking_data: bookingData, // Store full booking data as JSON
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving flight booking:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to save booking' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error('Error in flight booking API:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

