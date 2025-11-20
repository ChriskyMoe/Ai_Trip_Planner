# LiteAPI Webhook Setup Guide

This guide explains how to set up webhooks for your LiteAPI booking website.

## What is a Webhook?

A webhook is a way for LiteAPI to notify your application in real-time when booking events occur (like when a booking is confirmed, cancelled, or when payment is processed).

## Step 1: Create Webhook Endpoint

The webhook endpoint is already created at `/api/webhook` in your Next.js app. This endpoint will receive notifications from LiteAPI.

## Step 2: Expose Your Webhook URL

### For Local Development:

You need to expose your local server to the internet so LiteAPI can reach it. Use one of these options:

#### Option A: Using ngrok (Recommended)

1. Install ngrok: https://ngrok.com/download
2. Start your Next.js dev server: `npm run dev`
3. In another terminal, run: `ngrok http 3000`
4. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)
5. Your webhook URL will be: `https://abc123.ngrok.io/api/webhook`

#### Option B: Using Cloudflare Tunnel

1. Install cloudflared: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/
2. Run: `cloudflared tunnel --url http://localhost:3000`
3. Use the provided URL

### For Production:

Your webhook URL will be: `https://yourdomain.com/api/webhook`

## Step 3: Register Webhook in LiteAPI Dashboard

Go to the LiteAPI dashboard → Webhooks section and fill in the form:

### Webhook URL
```
https://yourdomain.com/api/webhook
```
Or for local development with ngrok:
```
https://abc123.ngrok.io/api/webhook
```

### Description
```
Production Booking Webhooks
```
Or:
```
Development Webhooks
```

### Authentication Token
Enter a secure random string (e.g., generate one using: `openssl rand -hex 32`)

**Important:** Copy this token and add it to your `.env.local` file:
```
LITEAPI_WEBHOOK_TOKEN=your-token-here
```

### Max Retries
```
3
```
(Default is fine - LiteAPI will retry up to 3 times if your endpoint fails)

### Initial Wait (sec)
```
2
```
(Default is fine - wait 2 seconds before first retry)

### Select Events

Select the events you want to receive notifications for:

- ✅ **booking.book** - When a booking is confirmed
- ✅ **booking.cancel** - When a booking is cancelled  
- ✅ **payment.accepted** - When payment is successfully processed
- ✅ **payment.declined** - When payment fails
- ✅ **payment.balance** - Payment balance/commission updates

### Custom Request Headers (Optional)

You can add custom headers if needed. For example:
- Header: `X-API-Version`
- Value: `v1`

## Step 4: Test Your Webhook

1. Make a test booking through your website
2. Check your server logs to see if webhook events are received
3. In LiteAPI dashboard, you can see webhook delivery status and logs

## Step 5: Handle Webhook Events

The webhook handler (`app/api/webhook/route.ts`) currently logs events. You can extend it to:

- Update your database with booking status
- Send confirmation emails to customers
- Update inventory/availability
- Process refunds for cancellations
- Update commission/earnings records

## Security Best Practices

1. **Always verify the webhook token** - The code checks `LITEAPI_WEBHOOK_TOKEN` against the header
2. **Use HTTPS** - Never use HTTP for webhooks in production
3. **Validate webhook data** - Check that required fields are present
4. **Idempotency** - Handle duplicate webhook deliveries gracefully (LiteAPI may retry)

## Troubleshooting

### Webhook not receiving events?

1. Check that your webhook URL is accessible from the internet
2. Verify the URL is correct in LiteAPI dashboard
3. Check server logs for errors
4. Ensure your Next.js server is running
5. Check LiteAPI dashboard webhook logs for delivery status

### Getting 401 Unauthorized?

- Make sure `LITEAPI_WEBHOOK_TOKEN` in your `.env.local` matches the token in LiteAPI dashboard
- Check that the token is being sent in the `x-webhook-token` header (or adjust the code to match LiteAPI's header name)

### Webhook receiving duplicate events?

- This is normal - LiteAPI may retry if it doesn't receive a 200 response
- Implement idempotency checks using the `bookingId` or `transactionId`

## Example Webhook Payload

```json
{
  "eventName": "booking.book",
  "response": {
    "bookingId": "abc123",
    "status": "CONFIRMED",
    "hotelConfirmationCode": "HTL-123456",
    "checkin": "2025-01-15",
    "checkout": "2025-01-17",
    "hotel": {
      "hotelId": "hotel123",
      "name": "Grand Hotel"
    },
    "price": 200.00,
    "currency": "USD"
  },
  "request": {
    // Original request data
  }
}
```

## Next Steps

1. Set up ngrok or deploy your app
2. Register the webhook in LiteAPI dashboard
3. Test with a booking
4. Extend the webhook handlers to update your database/notify users


