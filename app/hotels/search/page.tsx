'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

export default function HotelSearchPage() {
  const router = useRouter();
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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-emerald-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <button
              onClick={() => router.push('/')}
              className="inline-flex items-center text-emerald-600 hover:text-emerald-700 font-semibold mb-4 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Home
            </button>
            <div className="text-center mb-8">
              <div className="inline-block mb-4">
                <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                  🏨 Hotel Search
                </span>
              </div>
              <h1 className="text-6xl font-extrabold mb-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 bg-clip-text text-transparent">
                Search Hotels
              </h1>
              <p className="text-2xl text-gray-700 font-medium">
                Find the perfect hotel for your stay
              </p>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/20">
            {/* Search Type Toggle */}
            <div className="flex gap-4 mb-6">
              <button
                onClick={() => setSearchType('destination')}
                className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all ${
                  searchType === 'destination'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Search by Destination
              </button>
              <button
                onClick={() => setSearchType('vibe')}
                className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all ${
                  searchType === 'vibe'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg'
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? 'Searching...' : 'Search Hotels'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

