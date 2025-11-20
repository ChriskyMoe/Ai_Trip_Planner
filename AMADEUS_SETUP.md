# Amadeus Flight API Setup Guide

## Quick Start

### Step 1: Sign Up for Amadeus

1. Go to: https://developers.amadeus.com/
2. Click "Register" or "Get Started"
3. Create a free account
4. Verify your email

### Step 2: Create an App

1. Go to: https://developers.amadeus.com/my-apps
2. Click "Create New App"
3. Fill in:
   - **App Name**: e.g., "Smart Trip Planner"
   - **Description**: "Flight booking for trip planner"
   - **Category**: Travel
4. Click "Create"

### Step 3: Get Your API Credentials

After creating the app, you'll see:
- **API Key** (Client ID)
- **API Secret** (Client Secret)

**Important:** Copy these immediately - you won't see the secret again!

### Step 4: Add to Environment Variables

Add to your `.env.local` file:

```env
AMADEUS_API_KEY=your-api-key-here
AMADEUS_API_SECRET=your-api-secret-here
```

### Step 5: Test Mode vs Production

- **Test Mode**: Uses `test.api.amadeus.com` (default in code)
- **Production**: Change to `api.amadeus.com` in `lib/amadeus.ts`

For development, use **Test Mode** (it's free and has test data).

## Free Tier

- **$200 credit per month** (free)
- Enough for ~200-500 flight searches
- Perfect for development and testing

## API Endpoints Used

1. **OAuth Token** - Get access token
2. **Flight Offers Search** - Search for flights
3. **Airport/City Search** - Autocomplete for airports

## Testing

1. Start your app: `npm run dev`
2. Go to: http://localhost:3000/flights
3. Search for flights (e.g., NYC to BKK)
4. View results

## Troubleshooting

### "Failed to authenticate"
- Check API key and secret are correct
- Make sure they're in `.env.local`
- Restart dev server after adding keys

### "No flights found"
- Test mode has limited data
- Try popular routes (NYC, LHR, BKK, etc.)
- Check dates are in the future

### "Invalid airport code"
- Use IATA codes (3 letters): NYC, BKK, LHR, etc.
- Use the autocomplete to get correct codes

## Next Steps

After setting up:
1. ✅ Add API keys to `.env.local`
2. ✅ Restart dev server
3. ✅ Test flight search
4. 🚀 Implement flight booking (when ready)

## Documentation

- **Amadeus Docs**: https://developers.amadeus.com/
- **Flight Offers Search**: https://developers.amadeus.com/self-service/category/flight/api-doc/flight-offers-search
- **Airport Search**: https://developers.amadeus.com/self-service/category/airport/api-doc/airport-and-city-search

The flight booking system is ready! Just add your API keys and start searching! ✈️

