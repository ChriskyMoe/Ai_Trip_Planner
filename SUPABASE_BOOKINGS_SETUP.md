# Supabase Bookings Tables Setup

This document describes the database schema needed for storing hotel and flight bookings in Supabase.

## Required Tables

### 1. `hotel_bookings` Table

```sql
CREATE TABLE hotel_bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'CONFIRMED',
  hotel_confirmation_code TEXT,
  checkin DATE NOT NULL,
  checkout DATE NOT NULL,
  hotel_id TEXT,
  hotel_name TEXT,
  price DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL,
  cancellation_policies JSONB,
  booking_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, booking_id)
);

-- Create index for faster queries
CREATE INDEX idx_hotel_bookings_user_id ON hotel_bookings(user_id);
CREATE INDEX idx_hotel_bookings_booking_id ON hotel_bookings(booking_id);
CREATE INDEX idx_hotel_bookings_created_at ON hotel_bookings(created_at DESC);

-- Enable Row Level Security
ALTER TABLE hotel_bookings ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only see their own bookings
CREATE POLICY "Users can view own hotel bookings"
  ON hotel_bookings FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy: Users can insert their own bookings
CREATE POLICY "Users can insert own hotel bookings"
  ON hotel_bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy: Users can update their own bookings
CREATE POLICY "Users can update own hotel bookings"
  ON hotel_bookings FOR UPDATE
  USING (auth.uid() = user_id);
```

### 2. `flight_bookings` Table

```sql
CREATE TABLE flight_bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_id TEXT NOT NULL,
  flight_id TEXT,
  status TEXT NOT NULL DEFAULT 'CONFIRMED',
  passenger JSONB NOT NULL,
  flight_data JSONB NOT NULL,
  booking_date TIMESTAMP WITH TIME ZONE NOT NULL,
  booking_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, booking_id)
);

-- Create index for faster queries
CREATE INDEX idx_flight_bookings_user_id ON flight_bookings(user_id);
CREATE INDEX idx_flight_bookings_booking_id ON flight_bookings(booking_id);
CREATE INDEX idx_flight_bookings_created_at ON flight_bookings(created_at DESC);

-- Enable Row Level Security
ALTER TABLE flight_bookings ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only see their own bookings
CREATE POLICY "Users can view own flight bookings"
  ON flight_bookings FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy: Users can insert their own bookings
CREATE POLICY "Users can insert own flight bookings"
  ON flight_bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy: Users can update their own bookings
CREATE POLICY "Users can update own flight bookings"
  ON flight_bookings FOR UPDATE
  USING (auth.uid() = user_id);
```

## Setup Instructions

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Run the SQL commands above to create both tables
4. Verify the tables are created in the Table Editor
5. Verify RLS policies are enabled and working correctly

## Notes

- The `booking_data` JSONB column stores the complete booking information for easy retrieval
- Individual fields are also stored for easier querying and filtering
- Row Level Security (RLS) ensures users can only access their own bookings
- The `UNIQUE(user_id, booking_id)` constraint prevents duplicate bookings
- Indexes are created for common query patterns (user_id, booking_id, created_at)
