const LITEAPI_KEY = 'sand_377ccccf-9c0a-4632-b63a-a9c7eb1628a0';
const API_BASE = 'https://api.liteapi.travel/v3.0';
const BOOK_BASE = 'https://book.liteapi.travel/v3.0';

const headers = {
  'X-API-Key': LITEAPI_KEY,
  'accept': 'application/json',
  'content-type': 'application/json',
};

export async function searchPlaces(query: string) {
  const response = await fetch(
    `${API_BASE}/data/places?textQuery=${encodeURIComponent(query)}`,
    { headers: { 'X-API-Key': LITEAPI_KEY, 'accept': 'application/json' } }
  );
  if (!response.ok) throw new Error('Failed to search places');
  return response.json();
}

export async function searchRates(params: {
  placeId?: string;
  hotelIds?: string[];
  aiSearch?: string;
  checkin: string;
  checkout: string;
  adults: number;
  currency?: string;
  guestNationality?: string;
  maxRatesPerHotel?: number;
  roomMapping?: boolean;
  includeHotelData?: boolean;
}) {
  const body: any = {
    occupancies: [{ adults: params.adults }],
    currency: params.currency || 'USD',
    guestNationality: params.guestNationality || 'US',
    checkin: params.checkin,
    checkout: params.checkout,
    roomMapping: params.roomMapping ?? true,
    maxRatesPerHotel: params.maxRatesPerHotel ?? 1,
    includeHotelData: params.includeHotelData ?? true,
  };

  if (params.aiSearch) {
    body.aiSearch = params.aiSearch;
  } else if (params.placeId) {
    body.placeId = params.placeId;
  } else if (params.hotelIds) {
    body.hotelIds = params.hotelIds;
  }

  const response = await fetch(`${API_BASE}/hotels/rates`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error('Failed to search rates');
  return response.json();
}

export async function prebookOffer(offerId: string) {
  const response = await fetch(`${BOOK_BASE}/rates/prebook`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      usePaymentSdk: true,
      offerId,
    }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to prebook');
  }
  return response.json();
}

export async function bookHotel(params: {
  prebookId: string;
  transactionId: string;
  holder: {
    firstName: string;
    lastName: string;
    email: string;
  };
  guests: Array<{
    occupancyNumber: number;
    firstName: string;
    lastName: string;
    email: string;
  }>;
}) {
  const requestBody = {
    prebookId: params.prebookId,
    holder: params.holder,
    payment: {
      method: 'TRANSACTION_ID',
      transactionId: params.transactionId,
    },
    guests: params.guests,
  };

  console.log('Calling LiteAPI book endpoint with:', JSON.stringify(requestBody, null, 2));

  const response = await fetch(`${BOOK_BASE}/rates/book`, {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody),
  });

  const responseText = await response.text();
  console.log('LiteAPI response status:', response.status);
  console.log('LiteAPI response:', responseText);

  if (!response.ok) {
    let error;
    try {
      error = JSON.parse(responseText);
    } catch {
      error = { message: responseText || 'Failed to book' };
    }
    console.error('LiteAPI booking error:', error);
    
    // Preserve the full error information
    const errorMessage = error.error?.message || error.message || 'Failed to book';
    const errorCode = error.error?.code;
    const errorDescription = error.error?.description;
    
    // Create error with more details
    const detailedError: any = new Error(errorMessage);
    detailedError.code = errorCode;
    detailedError.description = errorDescription;
    detailedError.fullError = error;
    
    throw detailedError;
  }

  try {
    return JSON.parse(responseText);
  } catch {
    throw new Error('Invalid response from LiteAPI');
  }
}

export async function getHotelDetails(hotelId: string) {
  const response = await fetch(
    `${API_BASE}/data/hotel?hotelId=${hotelId}&timeout=4`,
    { headers: { 'X-API-Key': LITEAPI_KEY, 'accept': 'application/json' } }
  );
  if (!response.ok) throw new Error('Failed to get hotel details');
  return response.json();
}

