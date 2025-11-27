'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useRequireAuth } from '@/hooks/useRequireAuth';

interface BookingData {
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
    cancelPolicyInfos?: Array<{ cancelTime: string }>;
  };
}

interface HotelDetails {
  id: string;
  name: string;
  hotelImages?: Array<{ url: string; defaultImage?: boolean }>;
  address?: string;
  city?: string;
}

export default function ConfirmationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const checkingAuth = useRequireAuth();
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [hotelDetails, setHotelDetails] = useState<HotelDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (checkingAuth) return;

    const loadConfirmation = async () => {
      try {
        const bookingId = searchParams.get('bookingId');
        if (!bookingId) {
          setError('Missing booking ID');
          setLoading(false);
          return;
        }

        // Try to get booking data from localStorage
        const storedBooking = localStorage.getItem(`booking_${bookingId}`);
        let booking: BookingData | null = null;

        if (storedBooking) {
          booking = JSON.parse(storedBooking);
        }

        if (!booking) {
          setError('Booking not found');
          setLoading(false);
          return;
        }

        setBookingData(booking);

        // Fetch hotel details
        const hotelId = booking.hotel.hotelId || searchParams.get('hotelId');
        if (hotelId) {
          const response = await fetch(`/api/hotel?hotelId=${hotelId}`);
          const data = await response.json();
          if (!data.error) {
            setHotelDetails(data.data);
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load confirmation');
      } finally {
        setLoading(false);
      }
    };

    loadConfirmation();
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
          <p className="text-gray-600">Loading confirmation...</p>
        </div>
      </div>
    );
  }

  if (error || !bookingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Booking not found'}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const mainImage = hotelDetails?.hotelImages?.find((img) => img.defaultImage)?.url ||
    hotelDetails?.hotelImages?.[0]?.url;
  const isRefundable = bookingData.cancellationPolicies.refundableTag === 'RFN';

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
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Booking Confirmed!</h1>
            <p className="text-gray-600">Your reservation has been successfully processed.</p>
          </div>

          {/* Booking Details Card */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
          {mainImage && (
            <div className="relative h-64 w-full">
              <Image
                src={mainImage}
                alt={hotelDetails?.name || ''}
                fill
                sizes="100vw"
                className="object-cover"
              />
            </div>
          )}
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {hotelDetails?.name || bookingData.hotel.name}
              </h2>
              {hotelDetails?.address && (
                <p className="text-gray-600 mb-2">{hotelDetails.address}</p>
              )}
              {hotelDetails?.city && <p className="text-gray-600 mb-4">{hotelDetails.city}</p>}

              <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-200">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Check-in</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(bookingData.checkin).toLocaleDateString('en-US', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Check-out</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(bookingData.checkout).toLocaleDateString('en-US', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Booking Information */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Booking Information</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Booking ID</span>
                <span className="font-semibold text-gray-900">{bookingData.bookingId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Hotel Confirmation Code</span>
                <span className="font-semibold text-gray-900">
                  {bookingData.hotelConfirmationCode}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status</span>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  {bookingData.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Amount</span>
                <span className="text-xl font-bold text-primary-600">
                  {bookingData.currency} {bookingData.price.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Cancellation Policy</span>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    isRefundable
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {isRefundable ? 'Refundable' : 'Non-Refundable'}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="text-center">
            <button
              onClick={() => router.push('/')}
              className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200"
            >
              Book Another Stay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

