# How Recommended Hotels Are Selected in the Itinerary Planner

## 🔍 Complete Flow Explanation

The hotel recommendation system uses **LiteAPI** to find real hotels, then **AI** to intelligently select and recommend them. Here's the step-by-step process:

---

## Step 1: User Inputs Budget & Destination

When you fill out the itinerary form:
- **Destination**: e.g., "Paris"
- **Budget**: e.g., $1000
- **Dates**: Check-in and check-out
- **Guests**: Number of people

---

## Step 2: Calculate Budget Per Night

The system calculates:
```
Budget per night = Total Budget ÷ Number of Nights
Example: $1000 ÷ 5 nights = $200/night maximum
```

This ensures hotels fit your total budget.

---

## Step 3: Search Real Hotels Using LiteAPI ⭐

**This is where REAL hotels come from - NOT random!**

The system calls **LiteAPI** (the same API used for booking):
- Searches for hotels in your destination
- Gets **real hotel data**: names, prices, addresses, ratings, photos
- Gets **real availability** for your dates
- Gets **real pricing** in your currency

**Code location**: `lib/hotels-budget.ts` → `searchHotelsInBudget()`

**What LiteAPI returns:**
- Hotel IDs
- Hotel names
- Real prices per night
- Addresses
- Ratings
- Photos
- Availability for your dates

---

## Step 4: Filter Hotels by Budget

The system filters the LiteAPI results:
- ✅ Only includes hotels where `price per night ≤ budget per night`
- ✅ Sorts by price (cheapest first)
- ✅ Limits to top 5 hotels that fit your budget

**Example:**
- Budget: $200/night
- Hotel A: $150/night ✅ (included)
- Hotel B: $250/night ❌ (excluded - too expensive)
- Hotel C: $180/night ✅ (included)

**Result**: Only hotels A and C are passed to the AI.

---

## Step 5: Get Real Places Using Google Places API

While searching hotels, the system also:
- Uses **Google Places API** to find real attractions, restaurants, cultural sites
- Gets real places with ratings, addresses, photos
- This data is also passed to the AI

**Code location**: `lib/places.ts`

---

## Step 6: AI Selects & Recommends Hotels 🤖

**This is where AI comes in - but it only chooses from REAL hotels!**

The system sends to **OpenRouter AI**:
- List of 3-5 **real hotels** from LiteAPI (already filtered by budget)
- List of **real places** from Google Places API
- Your preferences
- Your budget

**The AI's job:**
1. **Selects 3-5 hotels** from the provided list (not random!)
2. **Explains why** each hotel fits your budget and preferences
3. **Creates itinerary** using real places
4. **Organizes activities** day-by-day

**Code location**: `lib/openrouter.ts` → `generateItinerary()`

**Important**: The AI **CANNOT** create fake hotels. It can only:
- ✅ Choose from the real hotels provided by LiteAPI
- ✅ Recommend which ones are best for you
- ✅ Explain why each hotel fits your needs

---

## Step 7: Display Results

The final itinerary shows:
- **Real hotel names** (from LiteAPI)
- **Real prices** (from LiteAPI)
- **Real addresses** (from LiteAPI)
- **Real photos** (from LiteAPI)
- **AI explanations** (why each hotel is recommended)
- **Bookable hotels** (with direct booking links)

---

## Summary: What Uses What?

| Component | API Used | Purpose |
|-----------|----------|---------|
| **Hotel Search** | **LiteAPI** | Find real hotels with real prices |
| **Hotel Filtering** | **Code Logic** | Filter by budget |
| **Hotel Selection** | **OpenRouter AI** | Choose best hotels from the list |
| **Places/Attractions** | **Google Places API** | Find real attractions, restaurants |
| **Itinerary Creation** | **OpenRouter AI** | Organize activities day-by-day |

---

## Key Points

✅ **Hotels are REAL** - They come from LiteAPI, not randomly generated
✅ **Prices are REAL** - Actual booking prices for your dates
✅ **Availability is REAL** - Only shows hotels available for your dates
✅ **AI is SMART** - Selects the best hotels from real options and explains why
✅ **Bookable** - All recommended hotels can be booked directly

---

## Example Flow

1. **User**: "Paris, $1000 budget, 5 nights"
2. **System**: Calculates $200/night max
3. **LiteAPI**: Returns 20 hotels in Paris
4. **Filter**: Keeps only hotels ≤ $200/night → 8 hotels remain
5. **Sort**: Sorts by price → Top 5 cheapest
6. **AI**: Receives 5 real hotels, selects best 3-4, explains why
7. **Result**: Shows 3-4 real, bookable hotels with AI recommendations

---

## Why This Approach?

1. **Real Hotels**: Users get actual bookable hotels, not fake suggestions
2. **Budget-Aware**: Only shows hotels that fit the budget
3. **AI Intelligence**: AI helps choose the best options and explains why
4. **Localized**: AI creates culturally authentic itineraries
5. **Bookable**: Direct booking integration with real availability

---

## Code Files

- **Hotel Search**: `lib/hotels-budget.ts`
- **LiteAPI Integration**: `lib/api.ts`
- **AI Itinerary**: `lib/openrouter.ts`
- **Places Search**: `lib/places.ts`
- **API Endpoint**: `app/api/itinerary/generate/route.ts`

---

## Conclusion

**Hotels are NOT random!** They are:
- ✅ Real hotels from LiteAPI
- ✅ Filtered by your actual budget
- ✅ Selected intelligently by AI
- ✅ Fully bookable with real prices

The AI's role is to **select and recommend** from real options, not to create fake hotels! 🎯

