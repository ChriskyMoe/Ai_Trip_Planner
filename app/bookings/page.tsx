'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { supabase } from '@/lib/supabaseClient';
import Image from 'next/image';

interface HotelBooking {
  bookingId: string;
  status: string;
  hotelConfirmationCode: string;
  checkin: string;
  checkout: string;
  hotel: {
    hotelId: string;
    name: string;
  };
  price: number;
  currency: string;
  cancellationPolicies: {
    refundableTag: string;
  };
}

interface FlightBooking {
  bookingId: string;
  flightId: string;
  status: string;
  passenger: {
    firstName: string;
    lastName: string;
    email: string;
  };
  flight: {
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
        numberOfStops: number;
      }>;
    }>;
  };
  bookingDate: string;
}

export default function BookingsPage() {
  const router = useRouter();
  const checkingAuth = useRequireAuth();
  const [hotelBookings, setHotelBookings] = useState<HotelBooking[]>([]);
  const [flightBookings, setFlightBookings] = useState<FlightBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (checkingAuth) return;

    const loadBookings = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          setLoading(false);
          return;
        }

        // Load hotel bookings from Supabase
        const { data: hotelBookingsData, error: hotelError } = await supabase
          .from('hotel_bookings')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });

        if (hotelError) {
          console.error('Error loading hotel bookings:', hotelError);
        } else {
          const hotelBookingsList: HotelBooking[] = (hotelBookingsData || []).map((booking: any) => {
            // Use booking_data if available, otherwise reconstruct from fields
            if (booking.booking_data) {
              return booking.booking_data;
            }
            return {
              bookingId: booking.booking_id,
              status: booking.status,
              hotelConfirmationCode: booking.hotel_confirmation_code,
              checkin: booking.checkin,
              checkout: booking.checkout,
              hotel: {
                hotelId: booking.hotel_id,
                name: booking.hotel_name,
              },
              price: booking.price,
              currency: booking.currency,
              cancellationPolicies: booking.cancellation_policies || {},
            };
          });
          setHotelBookings(hotelBookingsList);
        }

        // Load flight bookings from Supabase
        const { data: flightBookingsData, error: flightError } = await supabase
          .from('flight_bookings')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });

        if (flightError) {
          console.error('Error loading flight bookings:', flightError);
        } else {
          const flightBookingsList: FlightBooking[] = (flightBookingsData || []).map((booking: any) => {
            // Use booking_data if available, otherwise reconstruct from fields
            if (booking.booking_data) {
              return booking.booking_data;
            }
            return {
              bookingId: booking.booking_id,
              flightId: booking.flight_id,
              status: booking.status,
              passenger: booking.passenger,
              flight: booking.flight_data,
              bookingDate: booking.booking_date,
            };
          });
          setFlightBookings(flightBookingsList);
        }
      } catch (err) {
        console.error('Error loading bookings:', err);
      } finally {
        setLoading(false);
      }
    };

    loadBookings();
  }, [checkingAuth]);

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
          <p className="text-gray-600">Loading your bookings...</p>
        </div>
      </div>
    );
  }

  const totalBookings = hotelBookings.length + flightBookings.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.push('/')}
              className="inline-flex items-center text-gray-600 hover:text-gray-900 font-medium mb-4 transition-colors"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to Home
            </button>
            <h1 className="text-4xl font-extrabold text-gray-900 mb-2">My Bookings</h1>
            <p className="text-gray-600">
              {totalBookings === 0
                ? "You don't have any bookings yet."
                : `You have ${totalBookings} ${totalBookings === 1 ? 'booking' : 'bookings'}`}
            </p>
          </div>

          {totalBookings === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
                <svg
                  className="w-10 h-10 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">No Bookings Yet</h2>
              <p className="text-gray-600 mb-6">
                Start planning your trip and your bookings will appear here.
              </p>
              <button
                onClick={() => router.push('/itinerary')}
                className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Plan a Trip
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Hotel Bookings */}
              {hotelBookings.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                    <span className="mr-2">🏨</span>
                    Hotel Bookings ({hotelBookings.length})
                  </h2>
                  <div className="space-y-4">
                    {hotelBookings.map((booking) => (
                      <div
                        key={booking.bookingId}
                        className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => router.push(`/confirmation?bookingId=${booking.bookingId}`)}
                      >
                        <div className="p-6">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="flex-1">
                              <h3 className="text-xl font-bold text-gray-900 mb-2">
                                {booking.hotel.name}
                              </h3>
                              <div className="grid grid-cols-2 gap-4 mb-3">
                                <div>
                                  <p className="text-sm text-gray-500">Check-in</p>
                                  <p className="font-semibold text-gray-900">
                                    {format(new Date(booking.checkin), 'MMM d, yyyy')}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">Check-out</p>
                                  <p className="font-semibold text-gray-900">
                                    {format(new Date(booking.checkout), 'MMM d, yyyy')}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4 text-sm">
                                <div>
                                  <span className="text-gray-500">Booking ID: </span>
                                  <span className="font-medium text-gray-900">
                                    {booking.bookingId}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-500">Confirmation: </span>
                                  <span className="font-medium text-gray-900">
                                    {booking.hotelConfirmationCode}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <span
                                className={`px-3 py-1 rounded-full text-sm font-medium ${
                                  booking.status === 'CONFIRMED'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}
                              >
                                {booking.status}
                              </span>
                              <p className="text-2xl font-bold text-primary-600">
                                {booking.currency} {booking.price.toFixed(2)}
                              </p>
                              <p className="text-sm text-gray-500">Total Amount</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Flight Bookings */}
              {flightBookings.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                    <span className="mr-2">✈️</span>
                    Flight Bookings ({flightBookings.length})
                  </h2>
                  <div className="space-y-4">
                    {flightBookings.map((booking) => {
                      const outbound = booking.flight.itineraries[0];
                      const returnFlight = booking.flight.itineraries[1];
                      const totalPrice = parseFloat(
                        booking.flight.price.grandTotal || booking.flight.price.total
                      );
                      const outboundCarrier = outbound.segments[0];
                      const returnCarrier = returnFlight?.segments[0];

                      return (
                        <div
                          key={booking.bookingId}
                          className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                          onClick={() =>
                            router.push(`/flights/confirmation?bookingId=${booking.bookingId}`)
                          }
                        >
                          <div className="p-6">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                              <div className="flex-1">
                                <h3 className="text-xl font-bold text-gray-900 mb-3">
                                  Flight Booking
                                </h3>
                                <div className="space-y-3">
                                  <div>
                                    <p className="text-sm text-gray-500 mb-1">Outbound</p>
                                    <p className="font-semibold text-gray-900">
                                      {outbound.segments[0].departure.iataCode} →{' '}
                                      {
                                        outbound.segments[outbound.segments.length - 1]
                                          .arrival.iataCode
                                      }
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      {format(
                                        new Date(outbound.segments[0].departure.at),
                                        'MMM d, yyyy h:mm a'
                                      )}
                                    </p>
                                    {outboundCarrier && (
                                      <p className="text-sm text-gray-500">
                                        Flight {outboundCarrier.carrierCode}{' '}
                                        {outboundCarrier.number}
                                      </p>
                                    )}
                                  </div>
                                  {returnFlight && (
                                    <div>
                                      <p className="text-sm text-gray-500 mb-1">Return</p>
                                      <p className="font-semibold text-gray-900">
                                        {returnFlight.segments[0].departure.iataCode} →{' '}
                                        {
                                          returnFlight.segments[returnFlight.segments.length - 1]
                                            .arrival.iataCode
                                        }
                                      </p>
                                      <p className="text-sm text-gray-600">
                                        {format(
                                          new Date(returnFlight.segments[0].departure.at),
                                          'MMM d, yyyy h:mm a'
                                        )}
                                      </p>
                                      {returnCarrier && (
                                        <p className="text-sm text-gray-500">
                                          Flight {returnCarrier.carrierCode}{' '}
                                          {returnCarrier.number}
                                        </p>
                                      )}
                                    </div>
                                  )}
                                  <div className="pt-2 border-t border-gray-200">
                                    <p className="text-sm text-gray-500">
                                      Passenger: {booking.passenger.firstName}{' '}
                                      {booking.passenger.lastName}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                      Booking ID: {booking.bookingId}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                <span
                                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                                    booking.status === 'CONFIRMED'
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-yellow-100 text-yellow-800'
                                  }`}
                                >
                                  {booking.status}
                                </span>
                                <p className="text-2xl font-bold text-blue-600">
                                  {booking.flight.price.currency} {totalPrice.toFixed(2)}
                                </p>
                                <p className="text-sm text-gray-500">Total Price</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

