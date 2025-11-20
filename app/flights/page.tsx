'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

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
  }, []);

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
    const code = airport.iataCode;
    if (type === 'origin') {
      setFormData({ ...formData, origin: code });
      setOriginSuggestions([]);
    } else {
      setFormData({ ...formData, destination: code });
      setDestinationSuggestions([]);
    }
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

    try {
      const params = new URLSearchParams({
        origin: formData.origin,
        destination: formData.destination,
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

  if (step === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Searching Flights</h2>
          <p className="text-gray-600">Finding the best flights for you...</p>
        </div>
      </div>
    );
  }

  if (step === 'results') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <button
              onClick={() => {
                setStep('search');
                setFlights([]);
              }}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              ← New Search
            </button>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Flight Results
          </h1>

          {flights.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-8 text-center">
              <p className="text-gray-600 text-lg">No flights found. Try different dates or destinations.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {flights.map((flight, idx) => {
                const outbound = flight.itineraries[0];
                const returnFlight = flight.itineraries[1];
                const totalPrice = parseFloat(flight.price.grandTotal || flight.price.total);

                return (
                  <div key={idx} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
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
                        <p className="text-3xl font-bold text-primary-600">
                          {flight.price.currency} {totalPrice.toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-500">per person</p>
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
                          className="mt-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
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
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-center text-gray-900 mb-4">
            Search Flights
          </h1>
          <p className="text-xl text-center text-gray-600 mb-12">
            Find and book flights to your destination
          </p>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <form onSubmit={handleSearch}>
              {/* Trip Type */}
              <div className="flex gap-4 mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, tripType: 'one-way', returnDate: '' });
                  }}
                  className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all ${
                    formData.tripType === 'one-way'
                      ? 'bg-primary-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  One Way
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, tripType: 'round-trip' })}
                  className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all ${
                    formData.tripType === 'round-trip'
                      ? 'bg-primary-600 text-white shadow-md'
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
                      From *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.origin}
                      onChange={(e) => {
                        setFormData({ ...formData, origin: e.target.value });
                        handleAirportSearch(e.target.value, 'origin');
                      }}
                      placeholder="City or Airport (e.g., NYC, BKK)"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    {originSuggestions.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {originSuggestions.map((airport, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleAirportSelect(airport, 'origin')}
                            className="w-full text-left px-4 py-3 hover:bg-gray-100 transition-colors border-b border-gray-100 last:border-b-0"
                          >
                            <div className="font-medium text-gray-900">
                              {airport.iataCode} - {airport.name}
                            </div>
                            {airport.address && (
                              <div className="text-sm text-gray-500">
                                {airport.address.cityName}, {airport.address.countryName}
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="relative" ref={destinationInputRef}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      To *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.destination}
                      onChange={(e) => {
                        setFormData({ ...formData, destination: e.target.value });
                        handleAirportSearch(e.target.value, 'destination');
                      }}
                      placeholder="City or Airport (e.g., BKK, LHR)"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    {destinationSuggestions.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {destinationSuggestions.map((airport, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleAirportSelect(airport, 'destination')}
                            className="w-full text-left px-4 py-3 hover:bg-gray-100 transition-colors border-b border-gray-100 last:border-b-0"
                          >
                            <div className="font-medium text-gray-900">
                              {airport.iataCode} - {airport.name}
                            </div>
                            {airport.address && (
                              <div className="text-sm text-gray-500">
                                {airport.address.cityName}, {airport.address.countryName}
                              </div>
                            )}
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
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors duration-200"
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

