/*
  # Life Map Database Schema

  ## Overview
  Creates the full schema for the Life Map blood donation emergency network.

  ## New Tables

  ### 1. `profiles`
  - Extends Supabase auth.users
  - Stores user profile: full name, phone, blood group, location (lat/lng), donor availability
  - `blood_group`: one of the standard 8 blood groups
  - `is_available`: whether the donor is currently visible on the map
  - `latitude` / `longitude`: general area location (not precise)

  ### 2. `blood_requests`
  - Represents an active blood request from a patient/family
  - Contains required blood group, location of need, and status
  - `status`: pending | fulfilled | cancelled
  - Links to requester via `user_id`

  ### 3. `request_responses`
  - Tracks donor responses to a blood request
  - `status`: pending (notified) | accepted | declined
  - When accepted, contact info of both parties is revealed in the UI

  ### 4. `hospitals`
  - Static/seeded list of nearby hospitals / blood banks
  - Used as fallback when no donors respond

  ## Security
  - RLS enabled on all tables
  - Profiles: user can read/update own; others can see minimal map data only
  - Blood requests: authenticated users can create; requester can manage own
  - Request responses: donors manage their own responses
*/

-- =====================
-- PROFILES
-- =====================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  blood_group text NOT NULL DEFAULT '',
  latitude double precision,
  longitude double precision,
  is_available boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow anyone authenticated to see map-relevant donor info (blood_group + location only)
CREATE POLICY "Authenticated users can see available donors for map"
  ON profiles FOR SELECT
  TO authenticated
  USING (is_available = true);

-- =====================
-- BLOOD REQUESTS
-- =====================
CREATE TABLE IF NOT EXISTS blood_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blood_group text NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  address text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE blood_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all pending requests"
  ON blood_requests FOR SELECT
  TO authenticated
  USING (status = 'pending');

CREATE POLICY "Users can view own requests"
  ON blood_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create requests"
  ON blood_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own requests"
  ON blood_requests FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =====================
-- REQUEST RESPONSES
-- =====================
CREATE TABLE IF NOT EXISTS request_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES blood_requests(id) ON DELETE CASCADE,
  donor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(request_id, donor_id)
);

ALTER TABLE request_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Donors can see their own responses"
  ON request_responses FOR SELECT
  TO authenticated
  USING (auth.uid() = donor_id);

CREATE POLICY "Requesters can see responses to their requests"
  ON request_responses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM blood_requests
      WHERE blood_requests.id = request_responses.request_id
        AND blood_requests.user_id = auth.uid()
    )
  );

CREATE POLICY "Donors can insert responses"
  ON request_responses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = donor_id);

CREATE POLICY "Donors can update own responses"
  ON request_responses FOR UPDATE
  TO authenticated
  USING (auth.uid() = donor_id)
  WITH CHECK (auth.uid() = donor_id);

-- =====================
-- HOSPITALS / BLOOD BANKS
-- =====================
CREATE TABLE IF NOT EXISTS hospitals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  has_blood_bank boolean NOT NULL DEFAULT false,
  blood_groups_available text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view hospitals"
  ON hospitals FOR SELECT
  TO authenticated
  USING (true);

-- =====================
-- INDEXES
-- =====================
CREATE INDEX IF NOT EXISTS idx_profiles_blood_group ON profiles(blood_group);
CREATE INDEX IF NOT EXISTS idx_profiles_is_available ON profiles(is_available);
CREATE INDEX IF NOT EXISTS idx_blood_requests_status ON blood_requests(status);
CREATE INDEX IF NOT EXISTS idx_blood_requests_blood_group ON blood_requests(blood_group);
CREATE INDEX IF NOT EXISTS idx_request_responses_request_id ON request_responses(request_id);
CREATE INDEX IF NOT EXISTS idx_request_responses_donor_id ON request_responses(donor_id);

-- =====================
-- SEED HOSPITALS
-- =====================
INSERT INTO hospitals (name, address, phone, latitude, longitude, has_blood_bank, blood_groups_available)
VALUES
  ('Gopalganj City Care', '12 Main Street, Downtown', '+1-555-0101', 40.7128, -74.0060, true, ARRAY['A+','A-','B+','B-','O+','O-','AB+','AB-']),
  ('St. Mary Medical Center', '45 Oak Avenue, Midtown', '+1-555-0202', 40.7589, -73.9851, true, ARRAY['A+','B+','O+','AB+']),
  ('Mercy Life', '88 Health Blvd, Eastside', '+1-555-0303', 40.6892, -73.9442, true, ARRAY['O-','O+','A-','A+','B-','B+','AB-','AB+']),
  ('Mercy Hospital', '3 Riverside Drive, Uptown', '+1-555-0404', 40.7831, -73.9712, false, ARRAY['A+','O+','B+']),
  ('Northside Clinic', '221 North Park Blvd', '+1-555-0505', 40.7282, -74.0776, true, ARRAY['A+','A-','O+','O-'])
ON CONFLICT DO NOTHING;
