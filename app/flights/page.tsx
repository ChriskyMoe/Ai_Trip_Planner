'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { useRequireAuth } from '@/hooks/useRequireAuth';

interface Airport {
  iataCode: string;
  name: string;
  detailedName: string;
  address?: {
    cityName?: string;
    countryName?: string;
  };
}

interface FlightOffer {
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

export default function FlightsPage() {
  const router = useRouter();
  const checkingAuth = useRequireAuth();
  const [step, setStep] = useState<'search' | 'results' | 'loading'>('search');
  const [error, setError] = useState('');
  const [flights, setFlights] = useState<FlightOffer[]>([]);

  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    departureDate: '',
    returnDate: '',
    tripType: 'one-way' as 'one-way' | 'round-trip',
    adults: '1',
    children: '0',
    infants: '0',
    travelClass: 'ECONOMY' as 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST',
    currency: 'USD',
  });

  const [originSuggestions, setOriginSuggestions] = useState<Airport[]>([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState<Airport[]>([]);
  const originInputRef = useRef<HTMLDivElement>(null);
  const destinationInputRef = useRef<HTMLDivElement>(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    if (checkingAuth) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      if (
        originInputRef.current && !originInputRef.current.contains(event.target as Node) &&
        destinationInputRef.current && !destinationInputRef.current.contains(event.target as Node)
      ) {
        setOriginSuggestions([]);
        setDestinationSuggestions([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [checkingAuth]);

  const handleAirportSearch = async (query: string, type: 'origin' | 'destination') => {
    if (query.length < 2) {
      if (type === 'origin') {
        setOriginSuggestions([]);
      } else {
        setDestinationSuggestions([]);
      }
      return;
    }

    try {
      const response = await fetch(`/api/flights/airports?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      
      if (type === 'origin') {
        setOriginSuggestions(data.data || []);
      } else {
        setDestinationSuggestions(data.data || []);
      }
    } catch (error) {
      console.error('Error searching airports:', error);
    }
  };

  const handleAirportSelect = (airport: Airport, type: 'origin' | 'destination') => {
    const code = airport.iataCode?.toUpperCase().trim();
    if (!code || !/^[A-Z]{3}$/.test(code)) {
      setError(`Invalid airport code: ${airport.iataCode}. Please select a valid airport.`);
      return;
    }
    
    if (type === 'origin') {
      setFormData({ ...formData, origin: code });
      setOriginSuggestions([]);
    } else {
      setFormData({ ...formData, destination: code });
      setDestinationSuggestions([]);
    }
    setError(''); // Clear any previous errors
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setStep('loading');

    if (!formData.origin || !formData.destination || !formData.departureDate) {
      setError('Please fill in origin, destination, and departure date');
      setStep('search');
      return;
    }

    if (formData.tripType === 'round-trip' && !formData.returnDate) {
      setError('Please select return date for round-trip flights');
      setStep('search');
      return;
    }

    // Validate that origin and destination are valid 3-letter airport codes
    const originCode = formData.origin.trim().toUpperCase();
    const destinationCode = formData.destination.trim().toUpperCase();
    
    if (!/^[A-Z]{3}$/.test(originCode)) {
      setError('Please select an airport from the suggestions for "From". Airport codes must be 3 letters (e.g., NYC, JFK, BKK).');
      setStep('search');
      return;
    }

    if (!/^[A-Z]{3}$/.test(destinationCode)) {
      setError('Please select an airport from the suggestions for "To". Airport codes must be 3 letters (e.g., NYC, JFK, BKK).');
      setStep('search');
      return;
    }

    try {
      const params = new URLSearchParams({
        origin: originCode,
        destination: destinationCode,
        departureDate: formData.departureDate,
        adults: formData.adults,
        currency: formData.currency,
      });

      if (formData.returnDate) {
        params.append('returnDate', formData.returnDate);
      }

      if (formData.children !== '0') {
        params.append('children', formData.children);
      }

      if (formData.infants !== '0') {
        params.append('infants', formData.infants);
      }

      if (formData.travelClass !== 'ECONOMY') {
        params.append('travelClass', formData.travelClass);
      }

      const response = await fetch(`/api/flights/search?${params.toString()}`);
      const data = await response.json();

      if (data.error) {
        setError(data.error);
        setStep('search');
        return;
      }

      setFlights(data.data || []);
      setStep('results');
    } catch (err: any) {
      setError(err.message || 'Failed to search flights');
      setStep('search');
    }
  };

  const today = format(new Date(), 'yyyy-MM-dd');

  // Show loading while checking authentication
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-gray-700">Loading...</div>
      </div>
    );
  }

  if (step === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        </div>
        <div className="text-center relative z-10">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full blur-lg opacity-50"></div>
            <div className="relative animate-spin rounded-full h-20 w-20 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Searching Flights</h2>
          <p className="text-lg text-gray-600">Finding the best flights for you...</p>
        </div>
      </div>
    );
  }

  if (step === 'results') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        </div>

        <div className="container mx-auto px-4 py-8 relative z-10">
          <div className="mb-6">
            <button
              onClick={() => {
                setStep('search');
                setFlights([]);
              }}
              className="inline-flex items-center text-blue-600 hover:text-blue-700 font-semibold transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              New Search
            </button>
          </div>

          <h1 className="text-4xl font-extrabold text-gray-900 mb-8 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            Flight Results
          </h1>

          {flights.length === 0 ? (
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl p-12 text-center border border-white/20">
              <p className="text-gray-600 text-xl">No flights found. Try different dates or destinations.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {flights.map((flight, idx) => {
                const outbound = flight.itineraries[0];
                const returnFlight = flight.itineraries[1];
                const totalPrice = parseFloat(flight.price.grandTotal || flight.price.total);

                return (
                  <div key={idx} className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl p-8 hover:shadow-2xl transition-all duration-300 border border-white/20 transform hover:-translate-y-1">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <div>
                            <p className="text-sm text-gray-500">Departure</p>
                            <p className="text-lg font-semibold">
                              {outbound.segments[0].departure.iataCode} → {outbound.segments[outbound.segments.length - 1].arrival.iataCode}
                            </p>
                            <p className="text-sm text-gray-600">
                              {format(new Date(outbound.segments[0].departure.at), 'MMM d, h:mm a')} - {format(new Date(outbound.segments[outbound.segments.length - 1].arrival.at), 'h:mm a')}
                            </p>
                          </div>
                          {returnFlight && (
                            <div>
                              <p className="text-sm text-gray-500">Return</p>
                              <p className="text-lg font-semibold">
                                {returnFlight.segments[returnFlight.segments.length - 1].arrival.iataCode} → {returnFlight.segments[0].departure.iataCode}
                              </p>
                              <p className="text-sm text-gray-600">
                                {format(new Date(returnFlight.segments[0].departure.at), 'MMM d, h:mm a')} - {format(new Date(returnFlight.segments[returnFlight.segments.length - 1].arrival.at), 'h:mm a')}
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>Duration: {outbound.duration}</span>
                          {outbound.segments[0].numberOfStops > 0 && (
                            <span>{outbound.segments[0].numberOfStops} stop(s)</span>
                          )}
                          {flight.numberOfBookableSeats > 0 && (
                            <span>{flight.numberOfBookableSeats} seats available</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                          {flight.price.currency} {totalPrice.toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-500 mb-4">per person</p>
                        <button
                          onClick={() => {
                            // Store flight data and navigate to booking
                            const flightData = {
                              id: flight.id,
                              price: flight.price,
                              itineraries: flight.itineraries,
                              numberOfBookableSeats: flight.numberOfBookableSeats,
                            };
                            localStorage.setItem('selectedFlight', JSON.stringify(flightData));
                            router.push(`/flights/booking?flightId=${flight.id}`);
                          }}
                          className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        >
                          Select Flight
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <button
              onClick={() => router.push('/')}
              className="inline-flex items-center text-blue-600 hover:text-blue-700 font-semibold transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Home
            </button>
          </div>
          <div className="text-center mb-12">
            <div className="inline-block mb-4">
              <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
                ✈️ Flight Booking
              </span>
            </div>
            <h1 className="text-6xl font-extrabold mb-4 bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent">
              Search Flights
            </h1>
            <p className="text-2xl text-gray-700 font-medium">
              Find and book flights to your destination
            </p>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/20">
            <form onSubmit={handleSearch}>
              {/* Trip Type */}
              <div className="flex gap-4 mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, tripType: 'one-way', returnDate: '' });
                  }}
                  className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all ${
                    formData.tripType === 'one-way'
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  One Way
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, tripType: 'round-trip' })}
                  className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all ${
                    formData.tripType === 'round-trip'
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Round Trip
                </button>
              </div>

              <div className="space-y-6">
                {/* Origin & Destination */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative" ref={originInputRef}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      From (Airport) *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.origin}
                      onChange={(e) => {
                        const value = e.target.value;
                        setFormData({ ...formData, origin: value });
                        handleAirportSearch(value, 'origin');
                      }}
                      onFocus={(e) => {
                        if (e.target.value.length >= 2) {
                          handleAirportSearch(e.target.value, 'origin');
                        }
                      }}
                      onBlur={(e) => {
                        // Validate on blur - if it's not a 3-letter code, show suggestions again
                        const value = e.target.value.trim().toUpperCase();
                        if (value.length > 0 && !/^[A-Z]{3}$/.test(value)) {
                          if (value.length >= 2) {
                            handleAirportSearch(value, 'origin');
                          }
                        }
                      }}
                      placeholder="Search city or airport (e.g., New York, NYC, JFK)"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                    {originSuggestions.length > 0 && (
                      <div className="absolute z-20 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl max-h-72 overflow-y-auto">
                        {originSuggestions.map((airport, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleAirportSelect(airport, 'origin')}
                            className="w-full text-left px-4 py-4 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0 first:rounded-t-xl last:rounded-b-xl"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-sm">{airport.iataCode}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-gray-900 truncate">
                                  {airport.name}
                                </div>
                                {airport.address && (
                                  <div className="text-sm text-gray-500 truncate">
                                    {airport.address.cityName}, {airport.address.countryName}
                                  </div>
                                )}
                                {airport.detailedName && airport.detailedName !== airport.name && (
                                  <div className="text-xs text-gray-400 mt-1 truncate">
                                    {airport.detailedName}
                                  </div>
                                )}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="relative" ref={destinationInputRef}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      To (Airport) *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.destination}
                      onChange={(e) => {
                        const value = e.target.value;
                        setFormData({ ...formData, destination: value });
                        handleAirportSearch(value, 'destination');
                      }}
                      onFocus={(e) => {
                        if (e.target.value.length >= 2) {
                          handleAirportSearch(e.target.value, 'destination');
                        }
                      }}
                      onBlur={(e) => {
                        // Validate on blur - if it's not a 3-letter code, show suggestions again
                        const value = e.target.value.trim().toUpperCase();
                        if (value.length > 0 && !/^[A-Z]{3}$/.test(value)) {
                          if (value.length >= 2) {
                            handleAirportSearch(value, 'destination');
                          }
                        }
                      }}
                      placeholder="Search city or airport (e.g., Bangkok, BKK, Suvarnabhumi)"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                    {destinationSuggestions.length > 0 && (
                      <div className="absolute z-20 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl max-h-72 overflow-y-auto">
                        {destinationSuggestions.map((airport, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleAirportSelect(airport, 'destination')}
                            className="w-full text-left px-4 py-4 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0 first:rounded-t-xl last:rounded-b-xl"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-sm">{airport.iataCode}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-gray-900 truncate">
                                  {airport.name}
                                </div>
                                {airport.address && (
                                  <div className="text-sm text-gray-500 truncate">
                                    {airport.address.cityName}, {airport.address.countryName}
                                  </div>
                                )}
                                {airport.detailedName && airport.detailedName !== airport.name && (
                                  <div className="text-xs text-gray-400 mt-1 truncate">
                                    {airport.detailedName}
                                  </div>
                                )}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Departure Date *
                    </label>
                    <input
                      type="date"
                      required
                      min={today}
                      value={formData.departureDate}
                      onChange={(e) => setFormData({ ...formData, departureDate: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  {formData.tripType === 'round-trip' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Return Date *
                      </label>
                      <input
                        type="date"
                        required
                        min={formData.departureDate || today}
                        value={formData.returnDate}
                        onChange={(e) => setFormData({ ...formData, returnDate: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                  )}
                </div>

                {/* Passengers & Class */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Adults *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="9"
                      value={formData.adults}
                      onChange={(e) => setFormData({ ...formData, adults: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Children
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="9"
                      value={formData.children}
                      onChange={(e) => setFormData({ ...formData, children: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Travel Class
                    </label>
                    <select
                      value={formData.travelClass}
                      onChange={(e) => setFormData({ ...formData, travelClass: e.target.value as any })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="ECONOMY">Economy</option>
                      <option value="PREMIUM_ECONOMY">Premium Economy</option>
                      <option value="BUSINESS">Business</option>
                      <option value="FIRST">First Class</option>
                    </select>
                  </div>
                </div>

                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Search Flights
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

