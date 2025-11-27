'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { supabase } from '@/lib/supabaseClient';

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
  numberOfBookableSeats: number;
}

export default function FlightBookingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const checkingAuth = useRequireAuth();
  const [flightData, setFlightData] = useState<FlightData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'details' | 'confirmation'>('details');

  const [passengerDetails, setPassengerDetails] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: 'MALE' as 'MALE' | 'FEMALE',
    documentType: 'PASSPORT' as 'PASSPORT' | 'IDENTITY_CARD',
    documentNumber: '',
    documentExpiryDate: '',
    documentIssuanceCountry: '',
    documentNationality: '',
  });

  useEffect(() => {
    // Load flight data from localStorage
    const storedFlight = localStorage.getItem('selectedFlight');
    if (storedFlight) {
      setFlightData(JSON.parse(storedFlight));
    } else {
      setError('No flight selected. Please search and select a flight first.');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // For now, we'll create a mock booking
      // In production, you would call Amadeus Flight Create Order API here
      // This requires additional setup and payment processing
      
      // Simulate booking process
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Store booking data
      const bookingData = {
        bookingId: `FLT-${Date.now()}`,
        flightId: flightData?.id,
        status: 'CONFIRMED',
        passenger: passengerDetails,
        flight: flightData,
        bookingDate: new Date().toISOString(),
      };

      // Save to Supabase
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          const saveResponse = await fetch('/api/bookings/flight', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: session.user.id,
              bookingData,
            }),
          });

          if (!saveResponse.ok) {
            console.error('Failed to save flight booking to Supabase, but continuing...');
          }
        }
      } catch (saveError) {
        console.error('Error saving flight booking to Supabase:', saveError);
        // Continue even if Supabase save fails
      }

      // Keep localStorage as backup for now (can be removed later)
      localStorage.setItem(`flight_booking_${bookingData.bookingId}`, JSON.stringify(bookingData));
      
      // Navigate to confirmation
      router.push(`/flights/confirmation?bookingId=${bookingData.bookingId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to book flight');
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-gray-600">Verifying your session...</div>
      </div>
    );
  }

  if (!flightData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          {error ? (
            <>
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={() => router.push('/flights')}
                className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700"
              >
                Search Flights
              </button>
            </>
          ) : (
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          )}
        </div>
      </div>
    );
  }

  const outbound = flightData.itineraries[0];
  const returnFlight = flightData.itineraries[1];
  const totalPrice = parseFloat(flightData.price.grandTotal || flightData.price.total);
  const outboundCarrier = outbound.segments[0];
  const returnCarrier = returnFlight?.segments[0];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => {
              const returnTo = searchParams.get('returnTo');
              if (returnTo === 'itinerary') {
                router.push('/itinerary');
              } else {
                router.back();
              }
            }}
            className="text-primary-600 hover:text-primary-700 font-medium mb-6"
          >
            ← Back to Results
          </button>

          {/* Flight Summary */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Flight Details</h2>
            
            <div className="space-y-4">
              <div className="border-l-4 border-primary-500 pl-4">
                <p className="text-sm text-gray-500 mb-1">Outbound Flight</p>
                <p className="font-semibold text-lg">
                  {outbound.segments[0].departure.iataCode} → {outbound.segments[outbound.segments.length - 1].arrival.iataCode}
                </p>
                <p className="text-sm text-gray-600">
                  {format(new Date(outbound.segments[0].departure.at), 'EEEE, MMMM d, yyyy h:mm a')}
                </p>
                <p className="text-sm text-gray-600">
                  Duration: {outbound.duration} • {outbound.segments[0].numberOfStops === 0 ? 'Non-stop' : `${outbound.segments[0].numberOfStops} stop(s)`}
                </p>
              {outboundCarrier && (
                <p className="text-sm text-gray-500">
                  Flight {outboundCarrier.carrierCode} {outboundCarrier.number}
                </p>
              )}
              </div>

              {returnFlight && (
                <div className="border-l-4 border-primary-500 pl-4">
                  <p className="text-sm text-gray-500 mb-1">Return Flight</p>
                  <p className="font-semibold text-lg">
                    {returnFlight.segments[returnFlight.segments.length - 1].arrival.iataCode} → {returnFlight.segments[0].departure.iataCode}
                  </p>
                  <p className="text-sm text-gray-600">
                    {format(new Date(returnFlight.segments[0].departure.at), 'EEEE, MMMM d, yyyy h:mm a')}
                  </p>
                  <p className="text-sm text-gray-600">
                    Duration: {returnFlight.duration} • {returnFlight.segments[0].numberOfStops === 0 ? 'Non-stop' : `${returnFlight.segments[0].numberOfStops} stop(s)`}
                  </p>
                {returnCarrier && (
                  <p className="text-sm text-gray-500">
                    Flight {returnCarrier.carrierCode} {returnCarrier.number}
                  </p>
                )}
                </div>
              )}

              <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium">Total Price</span>
                  <span className="text-3xl font-bold text-primary-600">
                    {flightData.price.currency} {totalPrice.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Passenger Information Form */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Passenger Information</h2>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={passengerDetails.firstName}
                      onChange={(e) =>
                        setPassengerDetails({ ...passengerDetails, firstName: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={passengerDetails.lastName}
                      onChange={(e) =>
                        setPassengerDetails({ ...passengerDetails, lastName: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={passengerDetails.email}
                      onChange={(e) =>
                        setPassengerDetails({ ...passengerDetails, email: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone *
                    </label>
                    <input
                      type="tel"
                      required
                      value={passengerDetails.phone}
                      onChange={(e) =>
                        setPassengerDetails({ ...passengerDetails, phone: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date of Birth *
                    </label>
                    <input
                      type="date"
                      required
                      value={passengerDetails.dateOfBirth}
                      onChange={(e) =>
                        setPassengerDetails({ ...passengerDetails, dateOfBirth: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gender *
                    </label>
                    <select
                      required
                      value={passengerDetails.gender}
                      onChange={(e) =>
                        setPassengerDetails({ ...passengerDetails, gender: e.target.value as any })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Travel Document</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Document Type *
                      </label>
                      <select
                        required
                        value={passengerDetails.documentType}
                        onChange={(e) =>
                          setPassengerDetails({ ...passengerDetails, documentType: e.target.value as any })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="PASSPORT">Passport</option>
                        <option value="IDENTITY_CARD">Identity Card</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Document Number *
                      </label>
                      <input
                        type="text"
                        required
                        value={passengerDetails.documentNumber}
                        onChange={(e) =>
                          setPassengerDetails({ ...passengerDetails, documentNumber: e.target.value })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Expiry Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={passengerDetails.documentExpiryDate}
                        onChange={(e) =>
                          setPassengerDetails({ ...passengerDetails, documentExpiryDate: e.target.value })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Issuance Country *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g., US, TH"
                        value={passengerDetails.documentIssuanceCountry}
                        onChange={(e) =>
                          setPassengerDetails({ ...passengerDetails, documentIssuanceCountry: e.target.value })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    {error}
                  </div>
                )}

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> This is a demo booking. For production, you'll need to integrate with 
                    Amadeus Flight Create Order API and payment processing. The booking will be stored locally for demonstration.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-6 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Processing Booking...' : 'Confirm Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

