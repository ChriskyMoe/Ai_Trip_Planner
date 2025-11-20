/**
 * Google Places API Integration
 * Get your API key from: https://console.cloud.google.com/apis/credentials
 * 
 * Alternative: You can also use Foursquare API, TripAdvisor API, or Amadeus Places API
 */

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY || '';
// Using Places API (New) - the legacy API is deprecated
const GOOGLE_PLACES_API_URL = 'https://places.googleapis.com/v1';

export interface Place {
  place_id: string;
  name: string;
  types: string[];
  rating?: number;
  user_ratings_total?: number;
  formatted_address?: string;
  geometry?: {
    location: {
      lat: number;
      lng: number;
    };
  };
  photos?: Array<{
    photo_reference: string;
  }>;
}

export interface PlaceDetails extends Place {
  website?: string;
  international_phone_number?: string;
  opening_hours?: {
    weekday_text?: string[];
  };
  reviews?: Array<{
    author_name: string;
    rating: number;
    text: string;
  }>;
}

/**
 * Search for places (attractions, restaurants, etc.) near a location
 * Uses Places API (New) - POST request with JSON body
 */
export async function searchPlaces(
  query: string,
  location?: { lat: number; lng: number },
  radius: number = 5000,
  type?: string
): Promise<Place[]> {
  if (!GOOGLE_PLACES_API_KEY) {
    console.warn('GOOGLE_PLACES_API_KEY not configured, using fallback');
    return getFallbackPlaces(query);
  }

  try {
    // Use Places API (New) - Text Search endpoint
    const url = `${GOOGLE_PLACES_API_URL}/places:searchText`;
    
    const requestBody: any = {
      textQuery: query,
      maxResultCount: 20,
    };

    // Add location bias if available (in meters for radius)
    if (location) {
      requestBody.locationBias = {
        circle: {
          center: {
            latitude: location.lat,
            longitude: location.lng,
          },
          radius: radius, // radius in meters
        },
      };
    }

    // Note: Places API (New) doesn't support includedTypes in searchText
    // The type filtering is handled by the textQuery itself
    // If type is specified, it's already included in the query string

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.types,places.location,places.photos',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Places API error:', response.status, errorText);
      return getFallbackPlaces(query);
    }

    const data = await response.json();
    
    if (!data.places || data.places.length === 0) {
      return getFallbackPlaces(query);
    }

    // Transform new API format to our Place interface
    return data.places.map((place: any) => ({
      place_id: place.id,
      name: place.displayName?.text || place.displayName,
      types: place.types || [],
      rating: place.rating,
      user_ratings_total: place.userRatingCount,
      formatted_address: place.formattedAddress,
      geometry: place.location ? {
        location: {
          lat: place.location.latitude,
          lng: place.location.longitude,
        },
      } : undefined,
      photos: place.photos?.map((photo: any) => ({
        photo_reference: photo.name,
      })) || [],
    }));
  } catch (error: any) {
    console.error('Error searching places:', error);
    return getFallbackPlaces(query);
  }
}

/**
 * Get place details by place_id
 * Uses Places API (New)
 */
export async function getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
  if (!GOOGLE_PLACES_API_KEY) {
    return null;
  }

  try {
    // Use Places API (New) - Get Place endpoint
    const url = `${GOOGLE_PLACES_API_URL}/places/${placeId}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
        'X-Goog-FieldMask': 'id,displayName,formattedAddress,rating,userRatingCount,types,location,photos,websiteUri,nationalPhoneNumber,regularOpeningHours,reviews',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Places API error:', response.status, errorText);
      return null;
    }

    const place = await response.json();
    
    // Transform new API format to our PlaceDetails interface
    return {
      place_id: place.id,
      name: place.displayName?.text || place.displayName,
      types: place.types || [],
      rating: place.rating,
      user_ratings_total: place.userRatingCount,
      formatted_address: place.formattedAddress,
      geometry: place.location ? {
        location: {
          lat: place.location.latitude,
          lng: place.location.longitude,
        },
      } : undefined,
      photos: place.photos?.map((photo: any) => ({
        photo_reference: photo.name,
      })) || [],
      website: place.websiteUri,
      international_phone_number: place.nationalPhoneNumber,
      opening_hours: place.regularOpeningHours ? {
        weekday_text: place.regularOpeningHours.weekdayDescriptions,
      } : undefined,
      reviews: place.reviews?.map((review: any) => ({
        author_name: review.authorAttribution?.displayName || 'Anonymous',
        rating: review.rating,
        text: review.text?.text || review.text,
      })) || [],
    };
  } catch (error: any) {
    console.error('Error getting place details:', error);
    return null;
  }
}

/**
 * Search for nearby attractions
 */
export async function searchAttractions(
  destination: string,
  location?: { lat: number; lng: number }
): Promise<Place[]> {
  // Places API (New) uses different type names
  return searchPlaces(`${destination} tourist attractions`, location, 10000, 'tourist_attraction');
}

/**
 * Search for restaurants
 */
export async function searchRestaurants(
  destination: string,
  location?: { lat: number; lng: number }
): Promise<Place[]> {
  return searchPlaces(`${destination} restaurants`, location, 5000, 'restaurant');
}

/**
 * Search for cultural sites
 */
export async function searchCulturalSites(
  destination: string,
  location?: { lat: number; lng: number }
): Promise<Place[]> {
  const types = ['museum', 'art_gallery', 'church', 'mosque', 'temple', 'synagogue'];
  const results: Place[] = [];
  
  for (const type of types) {
    const places = await searchPlaces(`${destination} ${type}`, location, 10000, type);
    results.push(...places);
  }
  
  return results.slice(0, 20); // Limit results
}

/**
 * Fallback places when API is not configured
 */
function getFallbackPlaces(query: string): Place[] {
  // Return some generic places as fallback
  return [
    {
      place_id: 'fallback_1',
      name: `${query} Main Square`,
      types: ['tourist_attraction', 'point_of_interest'],
      rating: 4.5,
      formatted_address: `${query}, City Center`,
    },
    {
      place_id: 'fallback_2',
      name: `${query} Historical Museum`,
      types: ['museum', 'point_of_interest'],
      rating: 4.3,
      formatted_address: `${query}, Museum District`,
    },
    {
      place_id: 'fallback_3',
      name: `${query} Local Market`,
      types: ['shopping_mall', 'point_of_interest'],
      rating: 4.2,
      formatted_address: `${query}, Market Area`,
    },
  ];
}

