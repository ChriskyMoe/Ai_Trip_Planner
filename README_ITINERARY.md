# AI Itinerary Trip Planner

## 🎯 What You've Built

A complete AI-powered itinerary trip planner that:

1. **Takes your budget** and finds hotels that fit
2. **Uses OpenRouter AI** to generate personalized itineraries
3. **Integrates Google Places API** for real attractions and restaurants
4. **Creates localized plans** with cultural insights and local tips
5. **Allows direct booking** of recommended hotels

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Get API Keys

#### OpenRouter AI (Required)
1. Sign up at: https://openrouter.ai/
2. Get your API key: https://openrouter.ai/keys
3. Add to `.env.local`: `OPENROUTER_API_KEY=your-key`

#### Google Places API (Recommended)
1. Go to: https://console.cloud.google.com/
2. Enable Places API
3. Create API key
4. Add to `.env.local`: `GOOGLE_PLACES_API_KEY=your-key`

### 3. Create `.env.local`
```env
OPENROUTER_API_KEY=sk-or-v1-...
GOOGLE_PLACES_API_KEY=AIza...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Run the App
```bash
npm run dev
```

### 5. Access Itinerary Planner
- Visit: http://localhost:3000/itinerary
- Or click "AI Itinerary Planner" on the home page

## 📋 Features

### Budget-Based Hotel Selection
- Automatically filters hotels by your budget
- Shows 3-5 recommended hotels
- Direct booking integration

### AI-Generated Itineraries
- Day-by-day activity plans
- Meal suggestions with local cuisine
- Transportation recommendations
- Budget breakdown per day

### Real Places Integration
- Tourist attractions from Google Places
- Local restaurants
- Cultural sites (museums, galleries, etc.)
- Ratings and reviews

### Localized Content
- Cultural insights
- Local tips and customs
- Authentic experiences
- Language considerations

## 🎨 User Flow

1. **Input Form**
   - Destination
   - Total budget
   - Dates (check-in/check-out)
   - Number of guests
   - Travel preferences (optional)

2. **AI Processing** (30-60 seconds)
   - Searches hotels within budget
   - Finds real places and attractions
   - Generates personalized itinerary

3. **Results Display**
   - Recommended hotels with booking
   - Complete day-by-day itinerary
   - Budget breakdown
   - Local insights and tips

## 🔧 API Options

### Places API Alternatives

If you don't want to use Google Places API, you can modify `lib/places.ts`:

1. **Foursquare API** - Good for restaurants and venues
2. **TripAdvisor API** - Great for attractions
3. **Amadeus Places API** - Travel-focused
4. **Fallback Mode** - Works without any API (uses generic places)

### AI Model Options

In `lib/openrouter.ts`, you can change the model:

- `anthropic/claude-3.5-sonnet` (recommended)
- `openai/gpt-4`
- `google/gemini-pro`
- `meta-llama/llama-3.1-70b-instruct` (free)

## 📁 File Structure

```
app/
  itinerary/
    page.tsx              # Main itinerary planner UI
  api/
    itinerary/
      generate/
        route.ts          # API endpoint for itinerary generation

lib/
  openrouter.ts          # OpenRouter AI integration
  places.ts              # Google Places API integration
  hotels-budget.ts       # Budget-based hotel filtering
  api.ts                 # LiteAPI integration (existing)
```

## 💡 Customization

### Change AI Model
Edit `lib/openrouter.ts`:
```typescript
model: 'openai/gpt-4', // Change this
```

### Adjust Hotel Count
Edit `app/api/itinerary/generate/route.ts`:
```typescript
maxHotels: 5, // Change to 3, 7, etc.
```

### Customize AI Prompts
Edit the prompt in `lib/openrouter.ts` to change:
- Itinerary style
- Activity preferences
- Budget focus
- Cultural emphasis

## 🐛 Troubleshooting

### "No hotels found within budget"
- Increase your budget
- Try a different destination
- Check dates are valid

### "Failed to generate itinerary"
- Check OpenRouter API key
- Verify you have credits
- Try a different AI model

### Places not showing
- Check Google Places API key
- Verify API is enabled
- Check billing is set up

### Slow generation
- Normal: 30-60 seconds
- Try a faster AI model
- Reduce number of places

## 💰 Cost Estimates

- **OpenRouter AI**: ~$0.01-0.10 per itinerary
- **Google Places**: ~$0.10-1.00 per itinerary
- **LiteAPI**: Already configured (sandbox)

## 🎯 Next Steps

1. ✅ Get API keys
2. ✅ Add to `.env.local`
3. ✅ Test the itinerary planner
4. 🚀 Customize for your needs
5. 🚀 Deploy to production

## 📚 Documentation

- **Setup Guide**: See `ITINERARY_SETUP.md`
- **API Details**: Check individual files in `lib/`
- **Booking Flow**: See existing booking documentation

Enjoy your AI-powered trip planner! 🌍✈️

