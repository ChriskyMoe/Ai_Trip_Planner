/**
 * Amadeus Flight API Integration
 * Get your API key from: https://developers.amadeus.com/
 * 
 * Free tier: $200 credit/month
 */

const AMADEUS_API_KEY = process.env.AMADEUS_API_KEY || '';
const AMADEUS_API_SECRET = process.env.AMADEUS_API_SECRET || '';
const AMADEUS_API_URL = 'https://test.api.amadeus.com'; // Use 'api.amadeus.com' for production

let accessToken: string | null = null;
let tokenExpiry: number = 0;

/**
 * Get OAuth access token from Amadeus
 */
async function getAccessToken(): Promise<string> {
  // Check if we have a valid token
  if (accessToken && Date.now() < tokenExpiry) {
    return accessToken;
  }

  if (!AMADEUS_API_KEY || !AMADEUS_API_SECRET) {
    throw new Error('AMADEUS_API_KEY and AMADEUS_API_SECRET must be configured');
  }

  try {
    const response = await fetch(`${AMADEUS_API_URL}/v1/security/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: AMADEUS_API_KEY,
        client_secret: AMADEUS_API_SECRET,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get Amadeus access token');
    }

    const data = await response.json();
    accessToken = data.access_token;
    // Token expires in data.expires_in seconds, set expiry 5 minutes early for safety
    tokenExpiry = Date.now() + (data.expires_in - 300) * 1000;
    
    return accessToken;
  } catch (error: any) {
    console.error('Amadeus token error:', error);
    throw new Error(`Failed to authenticate with Amadeus: ${error.message}`);
  }
}

export interface FlightSearchParams {
  originLocationCode: string; // IATA code (e.g., "NYC", "BKK")
  destinationLocationCode: string;
  departureDate: string; // YYYY-MM-DD
  returnDate?: string; // YYYY-MM-DD (optional for round trip)
  adults: number;
  children?: number;
  infants?: number;
  travelClass?: 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST';
  currencyCode?: string;
}

export interface FlightOffer {
  id: string;
  source: string;
  instantTicketingRequired: boolean;
  nonHomogeneous: boolean;
  oneWay: boolean;
  lastTicketingDate: string;
  numberOfBookableSeats: number;
  itineraries: Array<{
    duration: string;
    segments: Array<{
      departure: {
        iataCode: string;
        terminal?: string;
        at: string;
      };
      arrival: {
        iataCode: string;
        terminal?: string;
        at: string;
      };
      carrierCode: string;
      number: string;
      aircraft?: {
        code: string;
      };
      duration: string;
      numberOfStops: number;
      blacklistedInEU: boolean;
    }>;
  }>;
  price: {
    currency: string;
    total: string;
    base: string;
    fees: Array<{
      amount: string;
      type: string;
    }>;
    grandTotal: string;
  };
  pricingOptions: {
    fareType: string[];
    includedCheckedBagsOnly: boolean;
  };
  validatingAirlineCodes: string[];
  travelerPricings: Array<{
    travelerId: string;
    fareOption: string;
    travelerType: string;
    price: {
      currency: string;
      total: string;
      base: string;
    };
    fareDetailsBySegment: Array<{
      segmentId: string;
      cabin: string;
      fareBasis: string;
      class: string;
      includedCheckedBags?: {
        quantity: number;
      };
    }>;
  }>;
}

/**
 * Search for flight offers
 */
export async function searchFlights(params: FlightSearchParams): Promise<FlightOffer[]> {
  if (!AMADEUS_API_KEY || !AMADEUS_API_SECRET) {
    console.warn('Amadeus API not configured, returning empty results');
    return [];
  }

  try {
    const token = await getAccessToken();

    const queryParams = new URLSearchParams({
      originLocationCode: params.originLocationCode,
      destinationLocationCode: params.destinationLocationCode,
      departureDate: params.departureDate,
      adults: params.adults.toString(),
    });

    if (params.returnDate) {
      queryParams.append('returnDate', params.returnDate);
    }

    if (params.children) {
      queryParams.append('children', params.children.toString());
    }

    if (params.infants) {
      queryParams.append('infants', params.infants.toString());
    }

    if (params.travelClass) {
      queryParams.append('travelClass', params.travelClass);
    }

    if (params.currencyCode) {
      queryParams.append('currencyCode', params.currencyCode);
    }

    // Max results
    queryParams.append('max', '20');

    const response = await fetch(
      `${AMADEUS_API_URL}/v2/shopping/flight-offers?${queryParams.toString()}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Amadeus API error:', response.status, errorText);
      throw new Error(`Amadeus API error: ${response.status}`);
    }

    const data = await response.json();
    return data.data || [];
  } catch (error: any) {
    console.error('Error searching flights:', error);
    throw error;
  }
}

/**
 * Get airport/city suggestions (for autocomplete)
 */
export async function searchAirports(query: string): Promise<any[]> {
  if (!AMADEUS_API_KEY || !AMADEUS_API_SECRET) {
    return [];
  }

  try {
    const token = await getAccessToken();

    const response = await fetch(
      `${AMADEUS_API_URL}/v1/reference-data/locations?subType=AIRPORT,CITY&keyword=${encodeURIComponent(query)}&max=10`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error searching airports:', error);
    return [];
  }
}

/**
 * Get flight offer details by ID
 */
export async function getFlightOffer(offerId: string): Promise<FlightOffer | null> {
  // Note: Amadeus doesn't have a direct "get offer by ID" endpoint
  // You would need to store the offer or search again
  // For now, this is a placeholder
  return null;
}

