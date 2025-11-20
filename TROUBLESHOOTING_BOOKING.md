# Troubleshooting Booking 500 Errors

## Common Causes of Booking Failures

### 1. **Missing or Invalid prebookId/transactionId**
- **Symptom:** 500 error when calling `/api/book`
- **Cause:** The prebookId or transactionId might be missing or expired
- **Solution:** 
  - Check browser console for the actual error message
  - Make sure payment was completed successfully
  - Verify localStorage has the correct prebookId and transactionId

### 2. **Payment Not Completed**
- **Symptom:** Booking fails with transaction error
- **Cause:** Payment SDK didn't complete successfully
- **Solution:**
  - Make sure you complete the payment form
  - Use the test card: `4242 4242 4242 4242`
  - Check that you're redirected back to the checkout page after payment

### 3. **Expired Prebook**
- **Symptom:** "invalid prebookId" or "prebook expired"
- **Cause:** Prebook requests expire after some time
- **Solution:**
  - Complete the booking flow quickly after prebook
  - If it expires, start over from the room selection

### 4. **Invalid Guest Information**
- **Symptom:** "missing or empty" field errors
- **Cause:** Guest details not properly formatted
- **Solution:**
  - Make sure all fields (firstName, lastName, email) are filled
  - Check that email is valid format

### 5. **API Key Issues**
- **Symptom:** Authentication errors
- **Cause:** API key might be invalid or expired
- **Solution:**
  - Verify API key in `lib/api.ts` is correct
  - Make sure you're using sandbox key for sandbox mode

## How to Debug

### Step 1: Check Server Logs
Look at your terminal where `npm run dev` is running. You should now see:
- The booking request being sent
- The LiteAPI response
- Any error messages

### Step 2: Check Browser Console
Open browser DevTools (F12) and check:
- Network tab: Look at the `/api/book` request
- Console tab: Check for any JavaScript errors

### Step 3: Check the Actual Error
The improved error handling will now show:
- The exact error message from LiteAPI
- The request that was sent
- The response received

## Common Error Messages

### "missing or empty transaction id"
- **Fix:** Make sure payment was completed and transactionId is stored

### "invalid offerId" or "invalid prebookId"
- **Fix:** The prebook might have expired. Start over from room selection.

### "required request field is missing"
- **Fix:** Check that all required fields are present:
  - prebookId
  - transactionId
  - holder (firstName, lastName, email)
  - guests array

### "payment transaction not found"
- **Fix:** Payment might not have completed. Try the payment again.

## Testing Steps

1. **Start fresh:**
   - Clear browser localStorage
   - Start from hotel search

2. **Complete payment:**
   - Use test card: `4242 4242 4242 4242`
   - Make sure payment completes
   - Wait for redirect back to checkout

3. **Check logs:**
   - Look at server terminal for detailed logs
   - Check what error LiteAPI is returning

4. **Verify data:**
   - Check that prebookId and transactionId are present
   - Verify guest information is complete

## Next Steps

After the improved error handling, you should see the actual error message in:
- Your server terminal (where `npm run dev` runs)
- The browser console
- The error response

This will tell you exactly what's wrong so we can fix it!

