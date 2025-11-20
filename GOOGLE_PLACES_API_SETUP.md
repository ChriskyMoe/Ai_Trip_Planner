# How to Get Google Places API Key

## Step-by-Step Guide

### Step 1: Go to Google Cloud Console

1. Visit: https://console.cloud.google.com/
2. Sign in with your Google account (or create one if needed)

### Step 2: Create a New Project (or Select Existing)

1. Click the project dropdown at the top of the page
2. Click "New Project"
3. Enter a project name (e.g., "Trip Planner")
4. Click "Create"
5. Wait for the project to be created, then select it

**OR** select an existing project if you have one.

### Step 3: Enable Places API

1. In the search bar at the top, type: **"Places API"**
2. Click on **"Places API"** from the results
3. Click the **"Enable"** button
4. Wait for it to enable (may take a few seconds)

**Also enable:**
- Search for **"Places API (New)"** and enable it too
- This is the newer version of the API

### Step 4: Create API Key

1. Go to: https://console.cloud.google.com/apis/credentials
   - Or click: **APIs & Services** → **Credentials** from the left menu
2. Click **"+ CREATE CREDENTIALS"** at the top
3. Select **"API key"**
4. Your API key will be created and displayed
5. **Copy the key** - it will look like: `AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz1234567`

### Step 5: (Recommended) Restrict the API Key

For security, restrict your API key:

1. Click on the API key you just created (or click "Edit" next to it)
2. Under **"API restrictions"**:
   - Select **"Restrict key"**
   - Check only:
     - ✅ **Places API**
     - ✅ **Places API (New)**
3. Under **"Application restrictions"** (optional but recommended):
   - Select **"HTTP referrers (web sites)"**
   - Add: `http://localhost:3000/*` (for local development)
   - Add: `https://yourdomain.com/*` (for production)
4. Click **"Save"**

### Step 6: Set Up Billing (Required for Places API)

**Important:** Google Places API requires billing to be enabled, but you get $200 free credit per month!

1. Go to: https://console.cloud.google.com/billing
2. Click **"Link a billing account"** or **"Create billing account"**
3. Fill in your billing information
4. **Don't worry** - you get $200 free credit monthly, which is plenty for development

**Free Tier:**
- $200 free credit per month
- Text Search: $32 per 1000 requests
- Details: $17 per 1000 requests
- Typical usage: < $1 per itinerary

### Step 7: Add Key to Your Project

1. Open your `.env.local` file in your project
2. Add or update:
   ```env
   GOOGLE_PLACES_API_KEY=AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz1234567
   ```
3. Replace with your actual API key
4. Save the file

### Step 8: Restart Your Dev Server

```bash
# Stop your server (Ctrl+C)
# Then restart:
npm run dev
```

## Quick Links

- **Google Cloud Console**: https://console.cloud.google.com/
- **Places API**: https://console.cloud.google.com/apis/library/places-backend.googleapis.com
- **Credentials**: https://console.cloud.google.com/apis/credentials
- **Billing**: https://console.cloud.google.com/billing

## Troubleshooting

### "API key not valid"
- Make sure you copied the entire key
- Check that Places API is enabled
- Verify billing is set up

### "This API project is not authorized"
- Make sure Places API is enabled
- Check that you selected the correct project

### "Quota exceeded"
- Check your billing account
- Verify you haven't exceeded the free tier
- Check usage in Google Cloud Console

### API not working
- Restart your dev server after adding the key
- Check the key is in `.env.local` (not `.env`)
- Verify the key format starts with `AIza`

## Cost Information

**Free Tier:**
- $200 credit per month (free)
- Enough for ~6,000 text searches
- Enough for ~11,000 detail requests

**Typical Usage:**
- One itinerary: ~10-20 API calls
- Cost: ~$0.10 - $1.00 per itinerary
- With free tier: Hundreds of itineraries per month

## Alternative: Use Without Google Places API

If you don't want to set up Google Places API:
- The system will use fallback place data
- Itineraries will still work
- Just won't have real-time place information
- You can add the API key later

## Security Best Practices

1. ✅ **Restrict your API key** to only Places API
2. ✅ **Add HTTP referrer restrictions** for production
3. ✅ **Never commit** `.env.local` to git (it's already in .gitignore)
4. ✅ **Rotate keys** if they're exposed
5. ✅ **Monitor usage** in Google Cloud Console

## Next Steps

After getting your API key:
1. Add it to `.env.local`
2. Restart your dev server
3. Test the itinerary planner
4. Enjoy real places in your itineraries! 🎉

