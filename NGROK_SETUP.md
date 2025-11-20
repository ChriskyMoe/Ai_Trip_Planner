# How to Install ngrok on Windows

## Method 1: Direct Download (Easiest)

1. **Download ngrok:**
   - Go to: https://ngrok.com/download
   - Click "Download for Windows"
   - Or direct link: https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-windows-amd64.zip

2. **Extract the zip file:**
   - Extract `ngrok.exe` to a folder (e.g., `C:\ngrok` or `C:\Users\YourName\ngrok`)

3. **Add to PATH (Optional but Recommended):**
   - Right-click "This PC" → Properties
   - Click "Advanced system settings"
   - Click "Environment Variables"
   - Under "User variables", find "Path" and click "Edit"
   - Click "New" and add the folder where you extracted ngrok (e.g., `C:\ngrok`)
   - Click OK on all dialogs

4. **Verify installation:**
   - Open Command Prompt or PowerShell
   - Type: `ngrok version`
   - You should see the version number

## Method 2: Using Chocolatey (If you have it)

If you have Chocolatey package manager installed:

```bash
choco install ngrok
```

## Method 3: Using Scoop (If you have it)

If you have Scoop package manager installed:

```bash
scoop install ngrok
```

## Sign Up for Free Account (Required)

1. Go to: https://dashboard.ngrok.com/signup
2. Sign up for a free account (email + password)
3. After signing up, you'll get an authtoken

## Authenticate ngrok

1. Copy your authtoken from the ngrok dashboard
2. Open Command Prompt or PowerShell
3. Run:
   ```bash
   ngrok config add-authtoken YOUR_AUTH_TOKEN_HERE
   ```

## How to Use ngrok with Your Booking Website

1. **Start your Next.js app:**
   ```bash
   npm run dev
   ```
   Your app should be running on `http://localhost:3000`

2. **In a NEW terminal window, start ngrok:**
   ```bash
   ngrok http 3000
   ```

3. **Copy the HTTPS URL:**
   - You'll see something like: `https://abc123.ngrok-free.app`
   - Copy this URL

4. **Use in LiteAPI Webhook:**
   - Webhook URL: `https://abc123.ngrok-free.app/api/webhook`
   - Replace `abc123.ngrok-free.app` with your actual ngrok URL

## Important Notes

- **Free tier limitations:**
  - The URL changes every time you restart ngrok (unless you have a paid plan)
  - You'll need to update the webhook URL in LiteAPI dashboard each time

- **Keep ngrok running:**
  - Don't close the ngrok terminal window while testing
  - If you close it, the URL will stop working

- **View webhook requests:**
  - Go to: http://localhost:4040 (ngrok web interface)
  - You can see all incoming requests and responses here

## Troubleshooting

### "ngrok is not recognized"
- Make sure you added ngrok to your PATH
- Or use the full path: `C:\ngrok\ngrok.exe http 3000`
- Or navigate to the ngrok folder first

### "authtoken is required"
- Make sure you signed up and added your authtoken
- Run: `ngrok config add-authtoken YOUR_TOKEN`

### "Port 3000 is already in use"
- Make sure your Next.js app is running on port 3000
- Or use a different port: `ngrok http 8080` (if your app runs on 8080)

## Alternative: Use Cloudflare Tunnel (Free, No Signup Required)

If you don't want to sign up for ngrok:

1. **Download Cloudflare Tunnel:**
   - Go to: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/
   - Download for Windows

2. **Run:**
   ```bash
   cloudflared tunnel --url http://localhost:3000
   ```

3. **Use the provided URL** in your webhook settings


