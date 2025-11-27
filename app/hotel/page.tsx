'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useRequireAuth } from '@/hooks/useRequireAuth';

interface Rate {
  name: string;
  mappedRoomId: number;
  boardName: string;
  retailRate: {
    total: Array<{ amount: number; currency: string }>;
    taxesAndFees?: Array<{ included: boolean }>;
  };
  cancellationPolicies: {
    refundableTag: string;
  };
}

interface RoomType {
  offerId: string;
  rates: Rate[];
}

interface HotelDetails {
  id: string;
  name: string;
  hotelDescription?: string;
  hotelImages?: Array<{ url: string; defaultImage?: boolean }>;
  address?: string;
  city?: string;
  starRating?: number;
  rooms?: Array<{
    id: number;
    roomName: string;
    photos?: Array<{ url: string }>;
  }>;
}

interface GroupedRoom {
  roomId: number;
  roomName: string;
  roomImage?: string;
  rates: Array<Rate & { offerId: string }>;
}

export default function HotelPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const checkingAuth = useRequireAuth();
  const [hotelDetails, setHotelDetails] = useState<HotelDetails | null>(null);
  const [groupedRooms, setGroupedRooms] = useState<GroupedRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (checkingAuth) return;

    const loadHotel = async () => {
      try {
        setLoading(true);
        const hotelId = searchParams.get('hotelId');
        const checkin = searchParams.get('checkin');
        const checkout = searchParams.get('checkout');
        const adults = searchParams.get('adults') || '2';

        if (!hotelId || !checkin || !checkout) {
          setError('Missing required parameters');
          setLoading(false);
          return;
        }

        // Fetch hotel details and rates in parallel
        const [detailsResponse, ratesResponse] = await Promise.all([
          fetch(`/api/hotel?hotelId=${hotelId}`),
          fetch('/api/rates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              hotelIds: [hotelId],
              checkin,
              checkout,
              adults: parseInt(adults),
              roomMapping: true,
              includeHotelData: true,
            }),
          }),
        ]);

        const detailsData = await detailsResponse.json();
        const ratesData = await ratesResponse.json();

        if (detailsData.error) {
          setError(detailsData.error);
          setLoading(false);
          return;
        }

        if (ratesData.error) {
          setError(ratesData.error);
          setLoading(false);
          return;
        }

        setHotelDetails(detailsData.data);

        // Group rates by room
        const rateData = ratesData.data[0];
        if (rateData?.roomTypes) {
          const grouped: { [key: number]: GroupedRoom } = {};

          rateData.roomTypes.forEach((roomType: RoomType) => {
            roomType.rates.forEach((rate) => {
              const roomId = rate.mappedRoomId;
              if (!grouped[roomId]) {
                // Find room details from hotel data
                const roomDetails = detailsData.data?.rooms?.find((r: any) => r.id === roomId);
                grouped[roomId] = {
                  roomId,
                  roomName: rate.name,
                  roomImage: roomDetails?.photos?.[0]?.url,
                  rates: [],
                };
              }
              grouped[roomId].rates.push({
                ...rate,
                offerId: roomType.offerId,
              });
            });
          });

          setGroupedRooms(Object.values(grouped));
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load hotel');
      } finally {
        setLoading(false);
      }
    };

    loadHotel();
  }, [searchParams, checkingAuth]);

  const handleBookOffer = (offerId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('offerId', offerId);
    router.push(`/checkout?${params.toString()}`);
  };

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
          <p className="text-gray-600">Loading hotel details...</p>
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
            onClick={() => router.push('/hotels')}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!hotelDetails) {
    return null;
  }

  const mainImage = hotelDetails.hotelImages?.find((img) => img.defaultImage)?.url ||
    hotelDetails.hotelImages?.[0]?.url;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <button
          onClick={() => router.back()}
          className="text-primary-600 hover:text-primary-700 font-medium mb-6"
        >
          ← Back to Results
        </button>

        {/* Hotel Header */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
          {mainImage && (
            <div className="relative h-96 w-full">
              <Image
                src={mainImage}
                alt={hotelDetails.name}
                fill
                sizes="100vw"
                className="object-cover"
              />
            </div>
          )}
          <div className="p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{hotelDetails.name}</h1>
            {hotelDetails.address && (
              <p className="text-gray-600 mb-2">{hotelDetails.address}</p>
            )}
            {hotelDetails.city && (
              <p className="text-gray-600 mb-4">{hotelDetails.city}</p>
            )}
            {hotelDetails.starRating && (
              <div className="flex items-center mb-4">
                {Array.from({ length: hotelDetails.starRating }).map((_, i) => (
                  <span key={i} className="text-yellow-500 text-xl">★</span>
                ))}
              </div>
            )}
            {hotelDetails.hotelDescription && (
              <div
                className="text-gray-700 mt-4"
                dangerouslySetInnerHTML={{ __html: hotelDetails.hotelDescription }}
              />
            )}
          </div>
        </div>

        {/* Available Rooms */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Rooms</h2>
          {groupedRooms.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-8 text-center">
              <p className="text-gray-600">No rooms available for the selected dates.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {groupedRooms.map((room) => (
                <div key={room.roomId} className="bg-white rounded-xl shadow-md overflow-hidden">
                  <div className="md:flex">
                    {room.roomImage && (
                      <div className="relative h-64 md:h-auto md:w-80 flex-shrink-0">
                        <Image
                          src={room.roomImage}
                          alt={room.roomName}
                          fill
                          sizes="(max-width: 768px) 100vw, 320px"
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 p-6">
                      <h3 className="text-xl font-semibold text-gray-900 mb-4">
                        {room.roomName}
                      </h3>
                      <div className="space-y-4">
                        {room.rates.map((rate, idx) => {
                          const price = rate.retailRate.total[0];
                          const isRefundable = rate.cancellationPolicies.refundableTag === 'RFN';
                          return (
                            <div
                              key={idx}
                              className="border border-gray-200 rounded-lg p-4 hover:border-primary-500 transition-colors"
                            >
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <p className="font-medium text-gray-900">{rate.boardName}</p>
                                  <div className="flex gap-2 mt-2">
                                    <span
                                      className={`px-2 py-1 rounded text-xs font-medium ${
                                        isRefundable
                                          ? 'bg-green-100 text-green-800'
                                          : 'bg-red-100 text-red-800'
                                      }`}
                                    >
                                      {isRefundable ? 'Refundable' : 'Non-Refundable'}
                                    </span>
                                    {rate.retailRate.taxesAndFees?.[0]?.included && (
                                      <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                        Taxes Included
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-2xl font-bold text-primary-600">
                                    {price.currency} {price.amount.toFixed(2)}
                                  </p>
                                  <p className="text-sm text-gray-500">per night</p>
                                </div>
                              </div>
                              <button
                                onClick={() => handleBookOffer(rate.offerId)}
                                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                              >
                                Select & Book
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

