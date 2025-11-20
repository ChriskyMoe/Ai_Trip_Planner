'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import Image from 'next/image';

interface ItineraryDay {
  day: number;
  date: string;
  title: string;
  budget: number;
  activities: Array<{
    time: string;
    activity: string;
    place?: string;
    type?: string;
    duration?: string;
    cost?: number;
    localTip?: string;
  }>;
  meals: Array<{
    time: string;
    type: string;
    name: string;
    cuisine?: string;
    cost?: number;
  }>;
  transportation?: string;
  totalCost: number;
}

interface Itinerary {
  summary: string;
  hotels: Array<{
    id: string;
    name: string;
    reason: string;
    price?: number;
    address?: string;
    rating?: number;
    main_photo?: string;
    offerId?: string;
  }>;
  itinerary: ItineraryDay[];
  totalBudget: number;
  budgetBreakdown: {
    accommodation: number;
    activities: number;
    meals: number;
    transportation: number;
  };
  localInsights: string[];
}

export default function ItineraryPlanner() {
  const router = useRouter();
  const [step, setStep] = useState<'input' | 'loading' | 'result'>('input');
  const [error, setError] = useState('');
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [hotels, setHotels] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    destination: '',
    budget: '',
    currency: 'USD',
    checkin: '',
    checkout: '',
    adults: '2',
    preferences: '',
  });
  const [destinationSuggestions, setDestinationSuggestions] = useState<any[]>([]);
  const [placeId, setPlaceId] = useState('');
  const [placeName, setPlaceName] = useState('');
  const destinationInputRef = useRef<HTMLDivElement>(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (destinationInputRef.current && !destinationInputRef.current.contains(event.target as Node)) {
        setDestinationSuggestions([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleDestinationSearch = async (query: string) => {
    setFormData({ ...formData, destination: query });
    if (query.length < 2) {
      setDestinationSuggestions([]);
      return;
    }
    try {
      const response = await fetch(`/api/places?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      setDestinationSuggestions(data.data || []);
    } catch (error) {
      console.error('Error searching places:', error);
    }
  };

  const handleDestinationSelect = (place: any) => {
    setPlaceId(place.placeId);
    setPlaceName(place.displayName);
    setFormData({ ...formData, destination: place.displayName });
    setDestinationSuggestions([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setStep('loading');

    try {
      // Use placeName if available (from autocomplete), otherwise use destination
      const searchDestination = placeName || formData.destination;
      
      const response = await fetch('/api/itinerary/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: searchDestination,
          placeId: placeId || undefined,
          budget: parseFloat(formData.budget),
          currency: formData.currency,
          checkin: formData.checkin,
          checkout: formData.checkout,
          adults: parseInt(formData.adults),
          preferences: formData.preferences || undefined,
        }),
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
        setStep('input');
        return;
      }

      setItinerary(data.itinerary);
      setHotels(data.hotels || []);
      setStep('result');
    } catch (err: any) {
      setError(err.message || 'Failed to generate itinerary');
      setStep('input');
    }
  };

  const handleBookHotel = (hotel: any) => {
    if (!hotel.offerId) {
      alert('Hotel booking not available for this hotel');
      return;
    }

    const params = new URLSearchParams({
      offerId: hotel.offerId,
      checkin: formData.checkin,
      checkout: formData.checkout,
      adults: formData.adults,
      hotelId: hotel.id,
    });

    router.push(`/checkout?${params.toString()}`);
  };

  if (step === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Creating Your Itinerary</h2>
          <p className="text-gray-600">
            Our AI is finding the best hotels and creating a personalized trip plan...
          </p>
        </div>
      </div>
    );
  }

  if (step === 'result' && itinerary) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <button
              onClick={() => {
                setStep('input');
                setItinerary(null);
              }}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              ← Create New Itinerary
            </button>
          </div>

          {/* Summary */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Your {formData.destination} Itinerary
            </h1>
            <p className="text-gray-700 text-lg">{itinerary.summary}</p>
          </div>

          {/* Budget Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Total Budget</p>
              <p className="text-2xl font-bold text-primary-600">
                {formData.currency} {itinerary.totalBudget.toFixed(2)}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Accommodation</p>
              <p className="text-2xl font-bold text-gray-900">
                {formData.currency} {itinerary.budgetBreakdown.accommodation.toFixed(2)}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Activities</p>
              <p className="text-2xl font-bold text-gray-900">
                {formData.currency} {itinerary.budgetBreakdown.activities.toFixed(2)}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Meals</p>
              <p className="text-2xl font-bold text-gray-900">
                {formData.currency} {itinerary.budgetBreakdown.meals.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Recommended Hotels */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Recommended Hotels</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {itinerary.hotels.map((hotel, idx) => {
                const hotelData = hotels.find((h) => h.hotelId === hotel.id || h.name === hotel.name);
                return (
                  <div key={idx} className="border border-gray-200 rounded-lg p-4">
                    {hotelData?.main_photo && (
                      <div className="relative h-32 w-full mb-3 rounded overflow-hidden">
                        <Image
                          src={hotelData.main_photo}
                          alt={hotel.name}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-cover"
                        />
                      </div>
                    )}
                    <h3 className="font-semibold text-lg mb-2">{hotel.name}</h3>
                    {hotelData?.rating && (
                      <div className="flex items-center mb-2">
                        <span className="text-yellow-500">★</span>
                        <span className="ml-1 text-sm">{hotelData.rating}</span>
                      </div>
                    )}
                    {hotelData?.price && (
                      <p className="text-primary-600 font-bold mb-2">
                        {formData.currency} {hotelData.price.toFixed(2)}/night
                      </p>
                    )}
                    <p className="text-sm text-gray-600 mb-3">{hotel.reason}</p>
                    {hotelData?.offerId && (
                      <button
                        onClick={() => handleBookHotel(hotelData)}
                        className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                      >
                        Book Now
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Daily Itinerary */}
          <div className="space-y-6">
            {itinerary.itinerary.map((day, idx) => (
              <div key={idx} className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="bg-primary-600 text-white p-4">
                  <h3 className="text-xl font-bold">{day.title}</h3>
                  <p className="text-sm opacity-90">
                    {format(new Date(day.date), 'EEEE, MMMM d, yyyy')} • Budget: {formData.currency}{' '}
                    {day.totalCost.toFixed(2)}
                  </p>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {day.activities.map((activity, actIdx) => (
                      <div key={actIdx} className="border-l-4 border-primary-500 pl-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-primary-600">{activity.time}</span>
                              <span className="text-gray-600 text-sm">{activity.duration}</span>
                            </div>
                            <h4 className="font-semibold text-gray-900">{activity.activity}</h4>
                            {activity.place && (
                              <p className="text-sm text-gray-600">📍 {activity.place}</p>
                            )}
                            {activity.localTip && (
                              <p className="text-sm text-primary-700 mt-2 italic">
                                💡 {activity.localTip}
                              </p>
                            )}
                          </div>
                          {activity.cost !== undefined && (
                            <span className="text-gray-700 font-medium">
                              {formData.currency} {activity.cost.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {day.meals.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-3">Meals</h4>
                      <div className="space-y-2">
                        {day.meals.map((meal, mealIdx) => (
                          <div key={mealIdx} className="flex justify-between items-center">
                            <div>
                              <span className="font-medium">{meal.time}</span> - {meal.name}
                              {meal.cuisine && (
                                <span className="text-sm text-gray-600 ml-2">({meal.cuisine})</span>
                              )}
                            </div>
                            {meal.cost !== undefined && (
                              <span className="text-gray-700">
                                {formData.currency} {meal.cost.toFixed(2)}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {day.transportation && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">
                        <strong>Transportation:</strong> {day.transportation}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Local Insights */}
          {itinerary.localInsights && itinerary.localInsights.length > 0 && (
            <div className="mt-6 bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Local Insights & Tips</h2>
              <ul className="space-y-2">
                {itinerary.localInsights.map((insight, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="text-primary-600 mr-2">✓</span>
                    <span className="text-gray-700">{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  }

  const today = format(new Date(), 'yyyy-MM-dd');
  const tomorrow = format(new Date(Date.now() + 86400000), 'yyyy-MM-dd');

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-center text-gray-900 mb-4">
            AI Trip Planner
          </h1>
          <p className="text-xl text-center text-gray-600 mb-12">
            Get a personalized itinerary with hotels that fit your budget
          </p>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                {/* Destination */}
                <div className="relative" ref={destinationInputRef}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Destination *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.destination}
                    onChange={(e) => handleDestinationSearch(e.target.value)}
                    onFocus={(e) => {
                      if (e.target.value.length >= 2) {
                        handleDestinationSearch(e.target.value);
                      }
                    }}
                    placeholder="e.g., Paris, Tokyo, New York"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  {destinationSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {destinationSuggestions.map((place, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleDestinationSelect(place)}
                          className="w-full text-left px-4 py-3 hover:bg-gray-100 transition-colors border-b border-gray-100 last:border-b-0"
                        >
                          <div className="font-medium text-gray-900">{place.displayName}</div>
                          <div className="text-sm text-gray-500">{place.formattedAddress}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Budget */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Total Budget *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.budget}
                      onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                      placeholder="1000"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Currency *
                    </label>
                    <select
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="JPY">JPY (¥)</option>
                      <option value="CAD">CAD (C$)</option>
                      <option value="AUD">AUD (A$)</option>
                    </select>
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Check-in Date *
                    </label>
                    <input
                      type="date"
                      required
                      min={today}
                      value={formData.checkin}
                      onChange={(e) => setFormData({ ...formData, checkin: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Check-out Date *
                    </label>
                    <input
                      type="date"
                      required
                      min={formData.checkin || tomorrow}
                      value={formData.checkout}
                      onChange={(e) => setFormData({ ...formData, checkout: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Guests */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Guests *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="10"
                    value={formData.adults}
                    onChange={(e) => setFormData({ ...formData, adults: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                {/* Preferences */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Travel Preferences (Optional)
                  </label>
                  <textarea
                    value={formData.preferences}
                    onChange={(e) => setFormData({ ...formData, preferences: e.target.value })}
                    placeholder="e.g., Interested in museums, local food, nightlife, family-friendly activities..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
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
                  Generate My Itinerary
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

