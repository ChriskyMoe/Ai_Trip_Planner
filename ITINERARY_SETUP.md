# Itinerary Planner Setup Guide

## Overview

The AI Itinerary Planner creates personalized trip plans with:
- **Budget-based hotel recommendations** (3-5 hotels that fit your budget)
- **AI-generated day-by-day itineraries** using OpenRouter AI
- **Real places and attractions** from Google Places API
- **Localized suggestions** with cultural insights and tips

## Required API Keys

### 1. OpenRouter AI API Key

**Get your key:**
1. Go to: https://openrouter.ai/
2. Sign up for a free account
3. Go to: https://openrouter.ai/keys
4. Create a new API key
5. Copy the key

**Add to environment:**
Create or update `.env.local`:
```
OPENROUTER_API_KEY=your-openrouter-api-key-here
```

**Free tier:** OpenRouter offers free credits to get started. You can use models like:
- `anthropic/claude-3.5-sonnet` (recommended)
- `openai/gpt-4`
- `google/gemini-pro`
- `meta-llama/llama-3.1-70b-instruct` (free)

### 2. Google Places API Key (Optional but Recommended)

**Get your key:**
1. Go to: https://console.cloud.google.com/
2. Create a new project or select existing
3. Enable "Places API" and "Places API (New)"
4. Go to Credentials → Create Credentials → API Key
5. Copy the key
6. (Optional) Restrict the key to Places API only for security

**Add to environment:**
```
GOOGLE_PLACES_API_KEY=your-google-places-api-key-here
```

**Free tier:** Google offers $200 free credit per month, which is plenty for development.

**Note:** If you don't add a Google Places API key, the system will use fallback place data. However, for best results with real, localized places, we recommend using Google Places API.

### 3. LiteAPI Key (Already Configured)

Your LiteAPI key is already set up in `lib/api.ts`. No changes needed.

## Environment Variables

Create a `.env.local` file in your project root:

```env
# OpenRouter AI (Required)
OPENROUTER_API_KEY=sk-or-v1-...

# Google Places API (Optional but Recommended)
GOOGLE_PLACES_API_KEY=AIza...

# App URL (Optional, for OpenRouter referrer)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# LiteAPI Webhook (Optional, if using webhooks)
LITEAPI_WEBHOOK_TOKEN=your-webhook-token
```

## How It Works

### 1. User Input
- Destination
- Total budget
- Check-in/check-out dates
- Number of guests
- Travel preferences (optional)

### 2. Hotel Search
- Searches LiteAPI for hotels in the destination
- Filters hotels by budget (budget ÷ nights = max price per night)
- Returns 3-5 hotels that fit the budget

### 3. Places Search
- Uses Google Places API to find:
  - Tourist attractions
  - Restaurants
  - Cultural sites (museums, galleries, etc.)
- Combines and deduplicates results

### 4. AI Itinerary Generation
- Sends hotel and place data to OpenRouter AI
- AI creates a detailed, localized itinerary with:
  - Day-by-day activities
  - Meal suggestions
  - Transportation tips
  - Budget breakdown
  - Local cultural insights

### 5. Display Results
- Shows recommended hotels with booking options
- Displays complete day-by-day itinerary
- Includes budget breakdown and local tips

## Features

✅ **Budget-Aware**: Only suggests hotels within your budget
✅ **Real Places**: Uses Google Places API for actual attractions
✅ **Localized**: AI provides cultural insights and local tips
✅ **Bookable**: Direct booking links for recommended hotels
✅ **Detailed**: Day-by-day breakdown with times and costs

## API Alternatives

If you don't want to use Google Places API, you can modify `lib/places.ts` to use:

### Option 1: Foursquare API
- Free tier available
- Good for restaurants and venues
- Get key: https://developer.foursquare.com/

### Option 2: TripAdvisor Content API
- Requires partnership
- Great for attractions and reviews

### Option 3: Amadeus Places API
- Free tier available
- Good for travel-related places
- Get key: https://developers.amadeus.com/

### Option 4: Fallback Mode
- Works without any places API
- Uses generic place suggestions
- Still creates full itinerary

## Testing

1. **Start your app:**
   ```bash
   npm run dev
   ```

2. **Go to itinerary planner:**
   - Visit: http://localhost:3000/itinerary
   - Or click "AI Itinerary Planner" on the home page

3. **Fill in the form:**
   - Destination: e.g., "Paris"
   - Budget: e.g., "1000"
   - Currency: USD
   - Dates: Select check-in and check-out
   - Guests: 2
   - Preferences: (optional) e.g., "museums, local food"

4. **Generate itinerary:**
   - Click "Generate My Itinerary"
   - Wait for AI to create your plan (30-60 seconds)
   - Review the results

## Troubleshooting

### "OPENROUTER_API_KEY is not configured"
- Make sure you've added the key to `.env.local`
- Restart your dev server after adding the key

### "No hotels found within your budget"
- Try increasing your budget
- Try a different destination
- Check that dates are valid

### "Failed to generate itinerary"
- Check OpenRouter API key is valid
- Check your OpenRouter account has credits
- Try a different AI model in `lib/openrouter.ts`

### Places not showing
- If using Google Places API, check the key is valid
- Check API is enabled in Google Cloud Console
- Without Google Places API, fallback places will be used

### Slow generation
- AI itinerary generation takes 30-60 seconds
- This is normal for complex AI requests
- Consider using a faster model if needed

## Cost Estimates

### OpenRouter AI
- Free tier: Limited credits
- Paid: ~$0.01-0.10 per itinerary (depends on model)
- Recommended: Start with free tier, upgrade if needed

### Google Places API
- Free tier: $200 credit/month
- Text Search: $32 per 1000 requests
- Details: $17 per 1000 requests
- Typical usage: < $1 per itinerary

### LiteAPI
- Already configured (sandbox mode)
- No additional cost for hotel search

## Next Steps

1. **Get API keys** (OpenRouter required, Google Places recommended)
2. **Add to `.env.local`**
3. **Restart dev server**
4. **Test the itinerary planner**
5. **Customize AI prompts** in `lib/openrouter.ts` if needed

Enjoy your AI-powered trip planner! 🗺️✈️

