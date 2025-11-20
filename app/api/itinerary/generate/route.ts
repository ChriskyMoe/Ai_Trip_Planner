import { NextRequest, NextResponse } from 'next/server';
import { generateItinerary } from '@/lib/openrouter';
import { searchHotelsInBudget } from '@/lib/hotels-budget';
import { searchAttractions, searchRestaurants, searchCulturalSites } from '@/lib/places';
import { searchPlaces as searchLiteAPIPlaces } from '@/lib/api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      destination,
      placeId: providedPlaceId,
      budget,
      currency = 'USD',
      checkin,
      checkout,
      adults = 2,
      preferences,
    } = body;

    if (!destination || !budget || !checkin || !checkout) {
      return NextResponse.json(
        { error: 'Missing required fields: destination, budget, checkin, checkout' },
        { status: 400 }
      );
    }

    console.log('Generating itinerary for:', { destination, budget, checkin, checkout });

    // Step 1: Get place location from LiteAPI (IMPORTANT for accurate hotel search)
    let placeId: string | undefined = providedPlaceId;
    let placeName: string | undefined;
    
    // If placeId was provided from autocomplete, use it directly
    if (providedPlaceId) {
      placeName = destination; // Use the destination as placeName since it was selected from autocomplete
      console.log(`Using provided placeId: ${placeId} for destination: ${destination}`);
    } else {
      // Otherwise, search for the place
      try {
        const placesData = await searchLiteAPIPlaces(destination);
        if (placesData.data && placesData.data.length > 0) {
          // Find the best match (exact match preferred)
          const exactMatch = placesData.data.find(
            (p: any) => p.displayName.toLowerCase() === destination.toLowerCase()
          );
          const selectedPlace = exactMatch || placesData.data[0];
          placeId = selectedPlace.placeId;
          placeName = selectedPlace.displayName;
          console.log(`Found place: ${placeName} (${placeId}) for destination: ${destination}`);
        }
      } catch (error) {
        console.warn('Could not get place ID, continuing without it:', error);
      }
    }

    // Use the found place name if available, otherwise use original destination
    const searchDestination = placeName || destination;

    // Step 2: Search hotels within budget
    console.log('Searching hotels within budget...');
    const hotels = await searchHotelsInBudget({
      destination: searchDestination, // Use validated destination
      placeId,
      checkin,
      checkout,
      adults,
      budget: parseFloat(budget),
      currency,
      maxHotels: 5,
    });

    // Log found hotels for debugging
    console.log(`Found ${hotels.length} hotels in ${searchDestination}:`, 
      hotels.map(h => `${h.name} (${h.address || 'no address'})`));

    if (hotels.length === 0) {
      return NextResponse.json(
        { error: 'No hotels found within your budget. Please increase your budget or try a different destination.' },
        { status: 404 }
      );
    }

    console.log(`Found ${hotels.length} hotels within budget`);

    // Step 3: Search for places/attractions
    console.log('Searching for places and attractions...');
    const [attractions, restaurants, culturalSites] = await Promise.all([
      searchAttractions(destination),
      searchRestaurants(destination),
      searchCulturalSites(destination),
    ]);

    // Combine and deduplicate places
    const allPlaces = [
      ...attractions.slice(0, 10),
      ...restaurants.slice(0, 10),
      ...culturalSites.slice(0, 10),
    ];

    // Remove duplicates by name
    const uniquePlaces = Array.from(
      new Map(allPlaces.map((p) => [p.name, p])).values()
    ).slice(0, 20);

    console.log(`Found ${uniquePlaces.length} unique places`);

    // Step 4: Generate itinerary with AI
    console.log('Generating AI itinerary...');
    const itineraryJson = await generateItinerary({
      destination,
      budget: parseFloat(budget),
      currency,
      checkin,
      checkout,
      adults,
      preferences,
      hotels: hotels.map((h) => ({
        id: h.hotelId,
        name: h.name,
        price: h.price,
        address: h.address,
        rating: h.rating,
      })),
      places: uniquePlaces.map((p) => ({
        name: p.name,
        type: p.types?.[0] || 'point_of_interest',
        address: p.formatted_address,
        rating: p.rating,
      })),
    });

    // Parse the JSON response
    let itinerary;
    try {
      itinerary = JSON.parse(itineraryJson);
    } catch (parseError) {
      console.error('Failed to parse itinerary JSON:', parseError);
      console.error('Raw response:', itineraryJson);
      return NextResponse.json(
        { error: 'Failed to parse AI response. Please try again.' },
        { status: 500 }
      );
    }

    // Add hotel details to itinerary
    if (itinerary.hotels) {
      itinerary.hotels = itinerary.hotels.map((hotel: any) => {
        const hotelData = hotels.find((h) => h.hotelId === hotel.id || h.name === hotel.name);
        return {
          ...hotel,
          ...hotelData,
        };
      });
    }

    return NextResponse.json({
      success: true,
      itinerary,
      hotels,
      places: uniquePlaces,
    });
  } catch (error: any) {
    console.error('Error generating itinerary:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate itinerary' },
      { status: 500 }
    );
  }
}

