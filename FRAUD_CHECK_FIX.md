# Fixing "Booking Rejected by Fraud Check" Error

## The Problem

You're getting this error:
```
Error code: 2013
"booking rejected by fraud check"
```

## Why This Happens

LiteAPI has fraud detection that can reject bookings in sandbox mode for various reasons:
1. **Repeated test bookings** - Too many bookings in a short time
2. **Suspicious patterns** - Test data that looks suspicious
3. **Sandbox limitations** - Some sandbox accounts have stricter fraud checks
4. **Guest information** - Certain test emails or names might trigger fraud checks

## Solutions

### Solution 1: Use Different Guest Information
Try using more realistic-looking guest data:
- **Email:** Use a real-looking email format (e.g., `john.doe@example.com` instead of `test@test.com`)
- **Name:** Use common names (e.g., `John Doe`, `Jane Smith`)
- **Wait a few minutes** between booking attempts

### Solution 2: Contact LiteAPI Support
If you're in sandbox mode and need to test bookings:
1. Go to LiteAPI dashboard
2. Contact support about fraud check rejections in sandbox
3. They may be able to whitelist your account or adjust fraud settings

### Solution 3: Check LiteAPI Dashboard
1. Go to your LiteAPI dashboard
2. Check if there are any fraud management settings
3. See if you can adjust fraud check sensitivity for sandbox

### Solution 4: Use Production API Key (When Ready)
Fraud checks are typically less strict in production with real bookings. But only switch to production when you're ready to process real payments.

## Updated Error Handling

I've updated the code to:
- Show a more helpful error message when fraud check fails
- Suggest trying again with different information
- Make it clear this is a sandbox limitation

## Testing Tips

1. **Use varied guest information:**
   ```
   First Name: John
   Last Name: Smith
   Email: john.smith@example.com
   ```

2. **Wait between attempts:**
   - Don't make multiple bookings in quick succession
   - Wait 2-3 minutes between attempts

3. **Try different hotels:**
   - Some hotels might have different fraud check settings
   - Try booking different properties

4. **Check LiteAPI dashboard:**
   - Look for any fraud management settings
   - Check if there are any account restrictions

## What the Code Does Now

The booking flow will now:
- Show a clear error message when fraud check fails
- Suggest trying again with different information
- Handle the error gracefully without crashing

## Next Steps

1. **Try booking again** with different guest information
2. **Wait a few minutes** if you've made multiple attempts
3. **Contact LiteAPI support** if the issue persists
4. **Check your LiteAPI dashboard** for fraud management settings

The booking system itself is working correctly - this is just LiteAPI's fraud protection being triggered. In production with real bookings, this is less likely to happen.

