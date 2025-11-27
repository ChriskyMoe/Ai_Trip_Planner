'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { useRequireAuth } from '@/hooks/useRequireAuth';

interface FlightBooking {
  bookingId: string;
  flightId: string;
  status: string;
  passenger: any;
  flight: FlightData;
  bookingDate: string;
}

interface FlightData {
  id: string;
  price: {
    currency: string;
    total: string;
    grandTotal: string;
  };
  itineraries: Array<{
    duration: string;
    segments: Array<{
      departure: {
        iataCode: string;
        at: string;
      };
      arrival: {
        iataCode: string;
        at: string;
      };
      carrierCode: string;
      number: string;
      duration: string;
      numberOfStops: number;
    }>;
  }>;
}

export default function FlightConfirmationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const checkingAuth = useRequireAuth();
  const [booking, setBooking] = useState<FlightBooking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (checkingAuth) return;

    const bookingId = searchParams.get('bookingId');
    if (!bookingId) {
      setLoading(false);
      return;
    }

    // Load booking from localStorage
    const storedBooking = localStorage.getItem(`flight_booking_${bookingId}`);
    if (storedBooking) {
      setBooking(JSON.parse(storedBooking));
    }
    setLoading(false);
  }, [searchParams, checkingAuth]);

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-gray-600">Verifying your session...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading booking confirmation...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Booking not found</p>
          <button
            onClick={() => router.push('/flights')}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700"
          >
            Search Flights
          </button>
        </div>
      </div>
    );
  }

  const outbound = booking.flight.itineraries[0];
  const returnFlight = booking.flight.itineraries[1];
  const totalPrice = parseFloat(booking.flight.price.grandTotal || booking.flight.price.total);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Flight Booking Confirmed!</h1>
            <p className="text-gray-600">Your flight reservation has been successfully processed.</p>
          </div>

          {/* Booking Details */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Booking Information</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Booking ID</span>
                <span className="font-semibold text-gray-900">{booking.bookingId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status</span>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  {booking.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Amount</span>
                <span className="text-xl font-bold text-primary-600">
                  {booking.flight.price.currency} {totalPrice.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Flight Details */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Flight Details</h2>
            
            <div className="space-y-4">
              <div className="border-l-4 border-primary-500 pl-4">
                <p className="text-sm text-gray-500 mb-1">Outbound Flight</p>
                <p className="font-semibold text-lg">
                  {outbound.segments[0].departure.iataCode} → {outbound.segments[outbound.segments.length - 1].arrival.iataCode}
                </p>
                <p className="text-sm text-gray-600">
                  {format(new Date(outbound.segments[0].departure.at), 'EEEE, MMMM d, yyyy')}
                </p>
                <p className="text-sm text-gray-600">
                  Departure: {format(new Date(outbound.segments[0].departure.at), 'h:mm a')} • 
                  Arrival: {format(new Date(outbound.segments[outbound.segments.length - 1].arrival.at), 'h:mm a')}
                </p>
                <p className="text-sm text-gray-600">
                  Duration: {outbound.duration} • {outbound.segments[0].numberOfStops === 0 ? 'Non-stop' : `${outbound.segments[0].numberOfStops} stop(s)`}
                </p>
              </div>

              {returnFlight && (
                <div className="border-l-4 border-primary-500 pl-4">
                  <p className="text-sm text-gray-500 mb-1">Return Flight</p>
                  <p className="font-semibold text-lg">
                    {returnFlight.segments[returnFlight.segments.length - 1].arrival.iataCode} → {returnFlight.segments[0].departure.iataCode}
                  </p>
                  <p className="text-sm text-gray-600">
                    {format(new Date(returnFlight.segments[0].departure.at), 'EEEE, MMMM d, yyyy')}
                  </p>
                  <p className="text-sm text-gray-600">
                    Departure: {format(new Date(returnFlight.segments[0].departure.at), 'h:mm a')} • 
                    Arrival: {format(new Date(returnFlight.segments[returnFlight.segments.length - 1].arrival.at), 'h:mm a')}
                  </p>
                  <p className="text-sm text-gray-600">
                    Duration: {returnFlight.duration} • {returnFlight.segments[0].numberOfStops === 0 ? 'Non-stop' : `${returnFlight.segments[0].numberOfStops} stop(s)`}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Passenger Information */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Passenger Information</h2>
            <div className="space-y-2">
              <p className="text-gray-700">
                <strong>Name:</strong> {booking.passenger.firstName} {booking.passenger.lastName}
              </p>
              <p className="text-gray-700">
                <strong>Email:</strong> {booking.passenger.email}
              </p>
              <p className="text-gray-700">
                <strong>Phone:</strong> {booking.passenger.phone}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="text-center space-x-4">
            <button
              onClick={() => router.push('/bookings')}
              className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200"
            >
              View My Bookings
            </button>
            <button
              onClick={() => router.push('/flights')}
              className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200"
            >
              Book Another Flight
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

