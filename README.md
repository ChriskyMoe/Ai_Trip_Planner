# LiteAPI Hotel Booking Website

A modern, full-featured hotel booking website built with Next.js and LiteAPI.

## Features

- **Dual Search Modes**:
  - Search by destination using places autocomplete
  - Search by vibe using AI-powered free text search
  
- **Hotel Discovery**: Browse hotels with images, ratings, and pricing
- **Room Selection**: View available offers grouped by room type with detailed information
- **Secure Checkout**: Guest information collection and integrated payment processing
- **Booking Confirmation**: Complete booking details with hotel information

## Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Modern, responsive styling
- **LiteAPI** - Hotel booking API integration

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
├── app/
│   ├── api/              # API routes (server-side)
│   │   ├── places/       # Places search endpoint
│   │   ├── rates/        # Hotel rates search endpoint
│   │   ├── prebook/      # Prebook endpoint
│   │   ├── book/         # Booking endpoint
│   │   └── hotel/        # Hotel details endpoint
│   ├── page.tsx          # Home/search page
│   ├── hotels/           # Hotel listing page
│   ├── hotel/            # Hotel details page
│   ├── checkout/         # Checkout and payment page
│   └── confirmation/     # Booking confirmation page
├── lib/
│   └── api.ts            # LiteAPI client functions
└── ...
```

## API Integration

All LiteAPI endpoints are called server-side to protect the API key. The API key is configured in `lib/api.ts`.

### Sandbox Mode

The application is configured for sandbox mode. When testing payments, use:
- Card: `4242 4242 4242 4242`
- CVV: Any 3 digits
- Expiry: Any future date

## Booking Flow

1. **Search**: User selects search type (destination or vibe), dates, and guests
2. **Browse**: View hotel results with pricing
3. **Select**: Choose a hotel and view available room offers
4. **Checkout**: Enter guest details and complete payment
5. **Confirm**: View booking confirmation with all details

## Environment

The application uses a sandbox API key. For production, update the API key in `lib/api.ts` and change the payment SDK `publicKey` from `'sandbox'` to `'live'` in `app/checkout/page.tsx`.

## License

MIT

