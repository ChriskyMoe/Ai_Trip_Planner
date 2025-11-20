'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';

interface Hotel {
  id: string;
  name: string;
  main_photo?: string;
  address?: string;
  rating?: number;
  tags?: string[];
  persona?: string;
  style?: string;
}

interface RateData {
  hotelId: string;
  roomTypes: Array<{
    offerId: string;
    rates: Array<{
      name: string;
      mappedRoomId: number;
      boardName: string;
      retailRate: {
        total: Array<{ amount: number; currency: string }>;
      };
    }>;
  }>;
}

export default function HotelsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [rates, setRates] = useState<RateData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const searchHotels = async () => {
      try {
        setLoading(true);
        const checkin = searchParams.get('checkin');
        const checkout = searchParams.get('checkout');
        const adults = searchParams.get('adults') || '2';
        const placeId = searchParams.get('placeId');
        const aiSearch = searchParams.get('aiSearch');

        if (!checkin || !checkout) {
          setError('Missing search parameters');
          setLoading(false);
          return;
        }

        const body: any = {
          checkin,
          checkout,
          adults: parseInt(adults),
        };

        if (placeId) {
          body.placeId = placeId;
        } else if (aiSearch) {
          body.aiSearch = aiSearch;
        }

        const response = await fetch('/api/rates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        const data = await response.json();

        if (data.error) {
          setError(data.error);
          setLoading(false);
          return;
        }

        setRates(data.data || []);
        setHotels(data.hotels || []);
      } catch (err: any) {
        setError(err.message || 'Failed to search hotels');
      } finally {
        setLoading(false);
      }
    };

    searchHotels();
  }, [searchParams]);

  const getHotelPrice = (hotelId: string) => {
    const hotelRate = rates.find((r) => r.hotelId === hotelId);
    if (hotelRate?.roomTypes[0]?.rates[0]?.retailRate?.total[0]) {
      return hotelRate.roomTypes[0].rates[0].retailRate.total[0];
    }
    return null;
  };

  const handleHotelClick = (hotelId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('hotelId', hotelId);
    router.push(`/hotel?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Searching hotels...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const displayHotels = hotels.length > 0 ? hotels : rates.map((r) => ({ id: r.hotelId }));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <button
            onClick={() => router.push('/')}
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            ← Back to Search
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">
            {searchParams.get('placeName') || searchParams.get('aiSearch') || 'Search Results'}
          </h1>
          <p className="text-gray-600 mt-2">
            {displayHotels.length} hotel{displayHotels.length !== 1 ? 's' : ''} found
          </p>
        </div>

        {displayHotels.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-600 text-lg">No hotels found. Try a different search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayHotels.map((hotel) => {
              const price = getHotelPrice(hotel.id);
              const hotelData = hotels.find((h) => h.id === hotel.id);

              return (
                <div
                  key={hotel.id}
                  onClick={() => handleHotelClick(hotel.id)}
                  className="bg-white rounded-xl shadow-md overflow-hidden cursor-pointer hover:shadow-xl transition-shadow duration-200"
                >
                  {hotelData?.main_photo ? (
                    <div className="relative h-48 w-full">
                      <Image
                        src={hotelData.main_photo}
                        alt={hotelData.name}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-48 w-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-400">No image</span>
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold text-lg text-gray-900 mb-2">
                      {hotelData?.name || `Hotel ${hotel.id}`}
                    </h3>
                    {hotelData?.address && (
                      <p className="text-sm text-gray-600 mb-2">{hotelData.address}</p>
                    )}
                    {hotelData?.rating && (
                      <div className="flex items-center mb-2">
                        <span className="text-yellow-500">★</span>
                        <span className="ml-1 text-sm text-gray-700">{hotelData.rating}</span>
                      </div>
                    )}
                    {price && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">From</span>
                          <span className="text-xl font-bold text-primary-600">
                            {price.currency} {price.amount.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}
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

