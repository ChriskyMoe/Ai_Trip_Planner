'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

export default function Home() {
  const router = useRouter();
  
  const navigateToItinerary = () => {
    router.push('/itinerary');
  };
  const [searchType, setSearchType] = useState<'destination' | 'vibe'>('destination');
  const [destinationQuery, setDestinationQuery] = useState('');
  const [vibeQuery, setVibeQuery] = useState('');
  const [placeId, setPlaceId] = useState('');
  const [placeName, setPlaceName] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [checkin, setCheckin] = useState('');
  const [checkout, setCheckout] = useState('');
  const [adults, setAdults] = useState(2);
  const [loading, setLoading] = useState(false);

  const handlePlaceSearch = async (query: string) => {
    setDestinationQuery(query);
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }
    try {
      const response = await fetch(`/api/places?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      setSuggestions(data.data || []);
    } catch (error) {
      console.error('Error searching places:', error);
    }
  };

  const handlePlaceSelect = (place: any) => {
    setPlaceId(place.placeId);
    setPlaceName(place.displayName);
    setDestinationQuery(place.displayName);
    setSuggestions([]);
  };

  const handleSearch = async () => {
    if (!checkin || !checkout) {
      alert('Please select check-in and check-out dates');
      return;
    }

    setLoading(true);
    try {
      const searchParams = new URLSearchParams({
        checkin,
        checkout,
        adults: adults.toString(),
      });

      if (searchType === 'destination') {
        if (!placeId) {
          alert('Please select a destination');
          setLoading(false);
          return;
        }
        searchParams.set('placeId', placeId);
        searchParams.set('placeName', placeName);
      } else {
        if (!vibeQuery.trim()) {
          alert('Please enter a search query');
          setLoading(false);
          return;
        }
        searchParams.set('aiSearch', vibeQuery);
      }

      router.push(`/hotels?${searchParams.toString()}`);
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  };

  const today = format(new Date(), 'yyyy-MM-dd');
  const tomorrow = format(new Date(Date.now() + 86400000), 'yyyy-MM-dd');

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-center text-gray-900 mb-4">
            Smart Trip Planner
          </h1>
          <p className="text-xl text-center text-gray-600 mb-8">
            Plan your perfect trip with AI-powered itineraries
          </p>
          
          {/* Navigation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <div
              onClick={navigateToItinerary}
              className="bg-white rounded-xl shadow-lg p-6 cursor-pointer hover:shadow-xl transition-shadow border-2 border-primary-200 hover:border-primary-400"
            >
              <div className="flex items-center mb-4">
                <div className="bg-primary-100 rounded-lg p-3 mr-4">
                  <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">AI Itinerary Planner</h2>
                  <p className="text-gray-600">Get personalized trip plans</p>
                </div>
              </div>
              <p className="text-sm text-gray-500">
                Enter your budget and destination, and our AI will create a complete itinerary.
              </p>
            </div>
            
            <div
              onClick={() => router.push('/flights')}
              className="bg-white rounded-xl shadow-lg p-6 cursor-pointer hover:shadow-xl transition-shadow border-2 border-primary-200 hover:border-primary-400"
            >
              <div className="flex items-center mb-4">
                <div className="bg-primary-100 rounded-lg p-3 mr-4">
                  <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Flight Booking</h2>
                  <p className="text-gray-600">Search and book flights</p>
                </div>
              </div>
              <p className="text-sm text-gray-500">
                Search for flights by origin and destination, compare prices, and book.
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-200">
              <div className="flex items-center mb-4">
                <div className="bg-gray-100 rounded-lg p-3 mr-4">
                  <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Direct Hotel Search</h2>
                  <p className="text-gray-600">Search and book hotels</p>
                </div>
              </div>
              <p className="text-sm text-gray-500">
                Search by destination or vibe, then browse and book hotels.
              </p>
            </div>
          </div>
          
          <p className="text-center text-gray-600 mb-12">
            Or search hotels directly below
          </p>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            {/* Search Type Toggle */}
            <div className="flex gap-4 mb-6">
              <button
                onClick={() => setSearchType('destination')}
                className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all ${
                  searchType === 'destination'
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Search by Destination
              </button>
              <button
                onClick={() => setSearchType('vibe')}
                className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all ${
                  searchType === 'vibe'
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Search by Vibe
              </button>
            </div>

            {/* Search Input */}
            {searchType === 'destination' ? (
              <div className="relative mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Destination
                </label>
                <input
                  type="text"
                  value={destinationQuery}
                  onChange={(e) => handlePlaceSearch(e.target.value)}
                  placeholder="Enter city or destination"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                {suggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {suggestions.map((place, idx) => (
                      <button
                        key={idx}
                        onClick={() => handlePlaceSelect(place)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-100 transition-colors"
                      >
                        <div className="font-medium">{place.displayName}</div>
                        <div className="text-sm text-gray-500">{place.formattedAddress}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Describe what you're looking for
                </label>
                <input
                  type="text"
                  value={vibeQuery}
                  onChange={(e) => setVibeQuery(e.target.value)}
                  placeholder="e.g., romantic getaway in Paris, beachfront resort in Bali"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            )}

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Check-in
                </label>
                <input
                  type="date"
                  value={checkin}
                  min={today}
                  onChange={(e) => setCheckin(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Check-out
                </label>
                <input
                  type="date"
                  value={checkout}
                  min={checkin || tomorrow}
                  onChange={(e) => setCheckout(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Guests */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Guests
              </label>
              <input
                type="number"
                value={adults}
                min={1}
                max={10}
                onChange={(e) => setAdults(parseInt(e.target.value) || 1)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Search Button */}
            <button
              onClick={handleSearch}
              disabled={loading}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Searching...' : 'Search Hotels'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

