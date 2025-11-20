# Booking System Checklist

## ✅ What's Required for Bookings to Work

### 1. **Core Booking Flow (REQUIRED)**
- ✅ Search hotels (destination or AI search)
- ✅ Select hotel and room
- ✅ Enter guest details
- ✅ Prebook offer (creates prebookId)
- ✅ Payment processing (LiteAPI Payment SDK)
- ✅ Complete booking (calls /api/book endpoint)

**These steps work WITHOUT webhooks!**

### 2. **Webhooks (OPTIONAL - for notifications only)**
- ⚠️ Webhooks are NOT needed for bookings to work
- Webhooks are only for receiving notifications AFTER bookings are made
- They help you:
  - Know when a booking is confirmed
  - Handle cancellations
  - Track payment status
  - But the booking itself works without them

## 🧪 How to Test Your Booking

### Step 1: Start Your App
```bash
npm run dev
```
Your app should be running on `http://localhost:3000`

### Step 2: Test the Full Flow

1. **Search for Hotels**
   - Go to `http://localhost:3000`
   - Choose "Search by Destination" or "Search by Vibe"
   - Enter dates and number of guests
   - Click "Search Hotels"

2. **Select a Hotel**
   - Click on any hotel from results
   - You should see available rooms

3. **Select a Room**
   - Click "Select & Book" on any room offer
   - You should be redirected to checkout

4. **Enter Guest Details**
   - Fill in: First Name, Last Name, Email
   - Click "Continue to Payment"

5. **Payment (Test Mode)**
   - Use test card: `4242 4242 4242 4242`
   - CVV: Any 3 digits (e.g., `123`)
   - Expiry: Any future date (e.g., `12/25`)
   - Complete payment

6. **Booking Confirmation**
   - After payment, you should see the confirmation page
   - Booking ID and hotel confirmation code should be displayed

## ⚠️ Common Issues

### Issue: "Failed to prebook"
- **Cause:** Offer might be unavailable
- **Solution:** Try a different room/offer

### Issue: Payment not working
- **Cause:** Payment SDK not loading
- **Solution:** 
  - Check browser console for errors
  - Make sure you're using the test card: `4242 4242 4242 4242`
  - Verify payment SDK script is loading

### Issue: "Failed to complete booking"
- **Cause:** Missing prebookId or transactionId
- **Solution:** 
  - Check that payment was successful
  - Verify localStorage has the required data
  - Check server logs for API errors

### Issue: Booking works but no webhook notifications
- **This is OK!** Bookings work without webhooks
- Webhooks are just for notifications
- If you want webhooks, make sure:
  - ngrok is running
  - Webhook URL is registered in LiteAPI dashboard
  - Your webhook endpoint is accessible

## ✅ Quick Verification

Run this checklist:

- [ ] App starts without errors (`npm run dev`)
- [ ] Can search for hotels
- [ ] Can see hotel details and rooms
- [ ] Can click "Select & Book"
- [ ] Can enter guest details
- [ ] Payment form appears
- [ ] Can complete payment with test card
- [ ] Booking confirmation page shows
- [ ] Booking ID is displayed

If all checked ✅, **your booking system is working!**

## 📝 What Webhooks Add (Optional)

If you set up webhooks, you'll also receive:
- Real-time notifications when bookings are confirmed
- Notifications when bookings are cancelled
- Payment status updates
- Better tracking and monitoring

But again, **bookings work without webhooks!**

