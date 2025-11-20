/**
 * Budget-based hotel filtering using LiteAPI
 */

import { searchRates } from './api';

export interface BudgetHotel {
  hotelId: string;
  name: string;
  price: number;
  currency: string;
  address?: string;
  rating?: number;
  main_photo?: string;
  offerId: string;
}

/**
 * Search hotels within budget
 */
export async function searchHotelsInBudget(params: {
  destination: string;
  placeId?: string;
  checkin: string;
  checkout: string;
  adults: number;
  budget: number;
  currency?: string;
  maxHotels?: number;
}): Promise<BudgetHotel[]> {
  const nights = Math.ceil(
    (new Date(params.checkout).getTime() - new Date(params.checkin).getTime()) / (1000 * 60 * 60 * 24)
  );
  
  const maxPricePerNight = params.budget / nights;
  const currency = params.currency || 'USD';

  try {
    // Search for hotels - prefer placeId over aiSearch for accuracy
    const searchParams: any = {
      checkin: params.checkin,
      checkout: params.checkout,
      adults: params.adults,
      currency,
      maxRatesPerHotel: 1,
      includeHotelData: true,
      roomMapping: true,
    };

    // Use placeId if available (more accurate), otherwise use aiSearch
    if (params.placeId) {
      searchParams.placeId = params.placeId;
    } else {
      // Make aiSearch more specific to avoid wrong locations
      searchParams.aiSearch = `hotels in ${params.destination}`;
    }

    const ratesData = await searchRates(searchParams);

    const hotels: BudgetHotel[] = [];
    const hotelMap = new Map<string, any>();

    // Map hotel data
    if (ratesData.hotels) {
      ratesData.hotels.forEach((hotel: any) => {
        hotelMap.set(hotel.id, hotel);
      });
    }

    // Filter hotels by budget and validate destination
    const destinationLower = params.destination.toLowerCase();
    if (ratesData.data) {
      for (const hotelData of ratesData.data) {
        const hotelInfo = hotelMap.get(hotelData.hotelId);
        const roomType = hotelData.roomTypes?.[0];
        const rate = roomType?.rates?.[0];
        
        if (rate?.retailRate?.total?.[0]) {
          const price = rate.retailRate.total[0].amount;
          
          // Check if price per night is within budget
          if (price <= maxPricePerNight) {
            // Validate hotel is in the correct destination
            const hotelAddress = hotelInfo?.address?.toLowerCase() || '';
            const hotelName = hotelInfo?.name?.toLowerCase() || '';
            const hotelCity = hotelInfo?.city?.toLowerCase() || '';
            
            // Check if hotel address/name/city contains destination (basic validation)
            const isInDestination = 
              hotelAddress.includes(destinationLower) ||
              hotelCity.includes(destinationLower) ||
              hotelName.includes(destinationLower) ||
              !hotelAddress || // If no address, include it (let user decide)
              !hotelInfo; // If no hotel info, include it
            
            // Only add if in destination (or if we can't verify)
            if (isInDestination) {
              hotels.push({
                hotelId: hotelData.hotelId,
                name: hotelInfo?.name || `Hotel ${hotelData.hotelId}`,
                price: price,
                currency: rate.retailRate.total[0].currency || currency,
                address: hotelInfo?.address,
                rating: hotelInfo?.rating,
                main_photo: hotelInfo?.main_photo,
                offerId: roomType.offerId,
              });
            } else {
              // Log filtered out hotels for debugging
              console.warn(`Filtered out hotel not in destination: ${hotelInfo?.name} (${hotelInfo?.address}) - searched for: ${params.destination}`);
            }
          }
        }
      }
    }

    // Sort by price (lowest first) and limit results
    hotels.sort((a, b) => a.price - b.price);
    
    const maxHotels = params.maxHotels || 5;
    return hotels.slice(0, maxHotels);
  } catch (error: any) {
    console.error('Error searching hotels in budget:', error);
    throw error;
  }
}

