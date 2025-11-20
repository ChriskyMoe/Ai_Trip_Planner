# How to Find Your ngrok URL

## Step-by-Step Guide

### 1. Start Your Next.js App First
Open your first terminal/command prompt and run:
```bash
npm run dev
```
Wait until you see: "Ready on http://localhost:3000"

### 2. Start ngrok in a NEW Terminal
Open a **second** terminal/command prompt window and run:
```bash
ngrok http 3000
```

### 3. Where to Find the URL

After running `ngrok http 3000`, you'll see output that looks like this:

```
ngrok

Session Status                online
Account                       Your Name (Plan: Free)
Version                       3.x.x
Region                        United States (us)
Latency                       -
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123.ngrok-free.app -> http://localhost:3000

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

### 4. The URL You Need

Look for the line that says **"Forwarding"**:
```
Forwarding    https://abc123.ngrok-free.app -> http://localhost:3000
```

**The URL you need is:** `https://abc123.ngrok-free.app`

### 5. Copy the Full Webhook URL

For LiteAPI webhook, use:
```
https://abc123.ngrok-free.app/api/webhook
```

(Replace `abc123.ngrok-free.app` with your actual ngrok URL)

## Visual Guide

```
┌─────────────────────────────────────────────────┐
│ ngrok                                           │
│                                                 │
│ Session Status                online            │
│ Account                       Your Name         │
│ Version                       3.x.x             │
│ Region                        United States     │
│                                                 │
│ Web Interface                 http://127.0.0.1:4040 │
│                                                 │
│ Forwarding    https://abc123.ngrok-free.app    │ ← THIS IS YOUR URL!
│                -> http://localhost:3000         │
│                                                 │
└─────────────────────────────────────────────────┘
```

## Alternative: View in Browser

You can also see the URL in the ngrok web interface:

1. While ngrok is running, open your browser
2. Go to: **http://localhost:4040**
3. You'll see a web interface showing:
   - Your ngrok URL
   - All incoming requests
   - Request/response details

## Important Notes

- **Keep both terminals open:**
  - Terminal 1: `npm run dev` (your Next.js app)
  - Terminal 2: `ngrok http 3000` (ngrok tunnel)

- **The URL changes:**
  - Free ngrok URLs change every time you restart ngrok
  - You'll need to update the webhook URL in LiteAPI dashboard each time

- **HTTPS is important:**
  - Always use the **https://** URL (not http://)
  - LiteAPI requires HTTPS for webhooks

## Quick Checklist

- [ ] Next.js app running on port 3000
- [ ] ngrok running in separate terminal
- [ ] Found the "Forwarding" line with HTTPS URL
- [ ] Copied the full URL: `https://your-url.ngrok-free.app/api/webhook`
- [ ] Added it to LiteAPI webhook settings

