'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Script from 'next/script';

interface PrebookData {
  prebookId: string;
  transactionId: string;
  secretKey: string;
  price: number;
  currency: string;
  hotelId: string;
}

declare global {
  interface Window {
    LiteAPIPayment: any;
  }
}

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [step, setStep] = useState<'details' | 'payment'>('details');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [prebookData, setPrebookData] = useState<PrebookData | null>(null);
  const [guestDetails, setGuestDetails] = useState({
    firstName: '',
    lastName: '',
    email: '',
  });
  const [bookingInProgress, setBookingInProgress] = useState(false);
  const [completedBookings, setCompletedBookings] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (step === 'payment' && prebookData) {
      // Initialize payment SDK after component mounts
      setTimeout(() => {
        if (window.LiteAPIPayment) {
          const returnUrl = `${window.location.origin}/checkout?prebookId=${prebookData.prebookId}&transactionId=${prebookData.transactionId}`;
          const config = {
            publicKey: 'sandbox', // Using sandbox since API key starts with 'sand'
            secretKey: prebookData.secretKey,
            returnUrl: returnUrl,
            targetElement: '#payment-container',
            appearance: { theme: 'flat' },
            options: { business: { name: 'Hotel Booking' } },
          };
          const liteAPIPayment = new window.LiteAPIPayment(config);
          liteAPIPayment.handlePayment();
        }
      }, 100);
    }
  }, [step, prebookData]);

  const completeBooking = useCallback(async (prebookId: string, transactionId: string, hotelId?: string, retryCount: number = 0) => {
    // Prevent duplicate bookings
    const bookingKey = `${prebookId}-${transactionId}`;
    if (bookingInProgress || completedBookings.has(bookingKey)) {
      console.log('Booking already in progress or completed, skipping duplicate call');
      return;
    }

    setBookingInProgress(true);
    setLoading(true);
    setError('');

    try {
      // Retrieve guest details from localStorage if not in state
      const storedGuestDetails = localStorage.getItem('guestDetails');
      const guestInfo = storedGuestDetails ? JSON.parse(storedGuestDetails) : guestDetails;

      const response = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prebookId,
          transactionId,
          holder: guestInfo,
          guests: [
            {
              occupancyNumber: 1,
              ...guestInfo,
            },
          ],
        }),
      });

      const data = await response.json();

      if (data.error) {
        // Handle payment pending - retry after a delay
        if (data.code === 2014 || data.type === 'payment_pending') {
          if (retryCount < 3) {
            console.log(`Payment still processing, retrying in 2 seconds... (attempt ${retryCount + 1}/3)`);
            setError('Payment is processing, please wait...');
            setLoading(true);
            
            // Wait 2 seconds then retry
            setTimeout(() => {
              completeBooking(prebookId, transactionId, hotelId, retryCount + 1);
            }, 2000);
            return;
          } else {
            setError(
              'Payment is taking longer than expected. The booking may complete automatically. ' +
              'Please check your bookings or try again in a moment.'
            );
            setLoading(false);
            setBookingInProgress(false);
            return;
          }
        }
        
        // Handle fraud check rejection with helpful message
        if (data.code === 2013 || data.type === 'fraud_check') {
          setError(
            'Booking was rejected by fraud check. This is common in sandbox mode. ' +
            'Please try again with different guest information, or wait a few minutes and try again.'
          );
        } else {
          setError(data.error);
        }
        setLoading(false);
        setBookingInProgress(false);
        return;
      }

      // Mark this booking as completed to prevent duplicates
      setCompletedBookings(prev => new Set(prev).add(bookingKey));
      
      // Store booking data and redirect to confirmation page
      const bookingId = data.data.bookingId;
      const bookingInfo = {
        bookingId: data.data.bookingId,
        status: data.data.status,
        hotelConfirmationCode: data.data.hotelConfirmationCode,
        checkin: data.data.checkin,
        checkout: data.data.checkout,
        hotel: data.data.hotel,
        price: data.data.price,
        currency: data.data.currency,
        cancellationPolicies: data.data.cancellationPolicies,
      };
      
      localStorage.setItem(`booking_${bookingId}`, JSON.stringify(bookingInfo));
      
      // Mark booking as completed in localStorage to prevent duplicates on page reload
      const completedBookingsStorage = JSON.parse(localStorage.getItem('completedBookings') || '[]');
      completedBookingsStorage.push(bookingKey);
      localStorage.setItem('completedBookings', JSON.stringify(completedBookingsStorage));
      
      // Clean up
      if (prebookId) {
        localStorage.removeItem(`prebook_${prebookId}`);
      }
      localStorage.removeItem('guestDetails');
      
      router.push(`/confirmation?bookingId=${bookingId}&hotelId=${hotelId || ''}`);
    } catch (err: any) {
      // If it's a payment pending error, retry
      if (err.message?.includes('payment not completed') && retryCount < 3) {
        console.log(`Payment error, retrying in 2 seconds... (attempt ${retryCount + 1}/3)`);
        setError('Payment is processing, please wait...');
        setTimeout(() => {
          completeBooking(prebookId, transactionId, hotelId, retryCount + 1);
        }, 2000);
        return;
      }
      
      setError(err.message || 'Failed to complete booking');
      setLoading(false);
      setBookingInProgress(false);
    }
  }, [guestDetails, router, bookingInProgress, completedBookings]);

  useEffect(() => {
    // Check if returning from payment
    const prebookId = searchParams.get('prebookId');
    const transactionId = searchParams.get('transactionId');
    
    // Store guest details in localStorage before payment
    if (guestDetails.firstName && !prebookId) {
      localStorage.setItem('guestDetails', JSON.stringify(guestDetails));
    }

    // If we have prebookId and transactionId, we're returning from payment
    if (prebookId && transactionId && !prebookData && !bookingInProgress) {
      // Check if this booking was already completed
      const bookingKey = `${prebookId}-${transactionId}`;
      const completedBookingsStorage = JSON.parse(localStorage.getItem('completedBookings') || '[]');
      
      if (completedBookingsStorage.includes(bookingKey)) {
        console.log('Booking already completed, redirecting to confirmation');
        // Find the booking ID from localStorage
        const bookingKeys = Object.keys(localStorage).filter(key => key.startsWith('booking_'));
        if (bookingKeys.length > 0) {
          const lastBooking = JSON.parse(localStorage.getItem(bookingKeys[bookingKeys.length - 1]) || '{}');
          if (lastBooking.bookingId) {
            router.push(`/confirmation?bookingId=${lastBooking.bookingId}&hotelId=${lastBooking.hotel?.hotelId || ''}`);
            return;
          }
        }
      }
      
      // Retrieve guest details from localStorage
      const storedGuestDetails = localStorage.getItem('guestDetails');
      if (storedGuestDetails) {
        setGuestDetails(JSON.parse(storedGuestDetails));
      }
      
      // Retrieve prebook data from localStorage
      const storedPrebookData = localStorage.getItem(`prebook_${prebookId}`);
      if (storedPrebookData) {
        const data = JSON.parse(storedPrebookData);
        setPrebookData(data);
        setStep('payment');
        // Complete the booking (only once)
        completeBooking(prebookId, transactionId, data.hotelId);
      }
    }
  }, [searchParams, guestDetails, prebookData, completeBooking, bookingInProgress, router]);

  const handleGuestDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const offerId = searchParams.get('offerId');
      if (!offerId) {
        setError('Missing offer ID');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/prebook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offerId }),
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
        setLoading(false);
        return;
      }

      const prebookInfo = {
        prebookId: data.data.prebookId,
        transactionId: data.data.transactionId,
        secretKey: data.data.secretKey,
        price: data.data.price,
        currency: data.data.currency,
        hotelId: data.data.hotelId,
      };

      setPrebookData(prebookInfo);
      
      // Store prebook data in localStorage for payment return
      localStorage.setItem(`prebook_${data.data.prebookId}`, JSON.stringify(prebookInfo));
      localStorage.setItem('guestDetails', JSON.stringify(guestDetails));

      setStep('payment');
    } catch (err: any) {
      setError(err.message || 'Failed to initialize booking');
    } finally {
      setLoading(false);
    }
  };


  if (step === 'details') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <button
              onClick={() => router.back()}
              className="text-primary-600 hover:text-primary-700 font-medium mb-6"
            >
              ← Back
            </button>

            <div className="bg-white rounded-xl shadow-md p-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-6">Guest Information</h1>

              <form onSubmit={handleGuestDetailsSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      required
                      value={guestDetails.firstName}
                      onChange={(e) =>
                        setGuestDetails({ ...guestDetails, firstName: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      required
                      value={guestDetails.lastName}
                      onChange={(e) =>
                        setGuestDetails({ ...guestDetails, lastName: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      required
                      value={guestDetails.email}
                      onChange={(e) =>
                        setGuestDetails({ ...guestDetails, email: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {error && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-6 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Processing...' : 'Continue to Payment'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Script
        src="https://payment-wrapper.liteapi.travel/dist/liteAPIPayment.js?v=a1"
        strategy="afterInteractive"
        onLoad={() => {
          if (prebookData) {
            const returnUrl = `${window.location.origin}/checkout?prebookId=${prebookData.prebookId}&transactionId=${prebookData.transactionId}`;
            const config = {
              publicKey: 'sandbox',
              secretKey: prebookData.secretKey,
              returnUrl: returnUrl,
              targetElement: '#payment-container',
              appearance: { theme: 'flat' },
              options: { business: { name: 'Hotel Booking' } },
            };
            const liteAPIPayment = new window.LiteAPIPayment(config);
            liteAPIPayment.handlePayment();
          }
        }}
      />
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <button
              onClick={() => setStep('details')}
              className="text-primary-600 hover:text-primary-700 font-medium mb-6"
            >
              ← Back
            </button>

            <div className="bg-white rounded-xl shadow-md p-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-6">Payment</h1>

              {prebookData && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Total Amount</span>
                    <span className="text-2xl font-bold text-primary-600">
                      {prebookData.currency} {prebookData.price.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Test Mode:</strong> Use test card <code className="bg-yellow-100 px-1 rounded">4242 4242 4242 4242</code>, any 3 digits for CVV, and any future expiration date.
                </p>
              </div>

              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  <p className="font-medium">{error}</p>
                  {error.includes('processing') && (
                    <p className="text-sm mt-2 text-red-600">
                      This is normal - the payment is being verified. Please wait...
                    </p>
                  )}
                </div>
              )}

              <div id="payment-container" className="mt-6"></div>

              {loading && (
                <div className="mt-6 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
                  <p className="text-gray-600">Processing booking...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

