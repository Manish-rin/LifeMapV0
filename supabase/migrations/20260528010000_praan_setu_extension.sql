/*
  # Praan-Setu Schema Extension
  
  Adds trust scores, privacy modes, account tiers, abuse prevention,
  donation confirmations, and Indian localization to the Life Map schema.
  
  ## Changes to existing tables
  - profiles: add trust_score, account_tier, aadhaar_verified, city, total_donations, current_streak, last_donation_date
  - blood_requests: add urgency, notification_radius, privacy_mode, hospital_name, log_id
  - request_responses: add response_time_ms
  
  ## New tables
  - trust_score_events: chronological log of all trust score changes
  - donation_confirmations: post-event confirmation from both parties
  - abuse_logs: identity-logged critical request records
*/

-- =====================
-- EXTEND PROFILES
-- =====================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trust_score integer NOT NULL DEFAULT 50;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS account_tier text NOT NULL DEFAULT 'public';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS aadhaar_verified boolean NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city text NOT NULL DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_donations integer NOT NULL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_streak integer NOT NULL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_donation_date timestamptz;

-- =====================
-- EXTEND BLOOD REQUESTS
-- =====================
ALTER TABLE blood_requests ADD COLUMN IF NOT EXISTS urgency text NOT NULL DEFAULT 'urgent';
ALTER TABLE blood_requests ADD COLUMN IF NOT EXISTS notification_radius integer NOT NULL DEFAULT 5;
ALTER TABLE blood_requests ADD COLUMN IF NOT EXISTS privacy_mode text NOT NULL DEFAULT 'raksha';
ALTER TABLE blood_requests ADD COLUMN IF NOT EXISTS hospital_name text NOT NULL DEFAULT '';
ALTER TABLE blood_requests ADD COLUMN IF NOT EXISTS log_id text NOT NULL DEFAULT '';

-- =====================
-- EXTEND REQUEST RESPONSES
-- =====================
ALTER TABLE request_responses ADD COLUMN IF NOT EXISTS response_time_ms integer;

-- =====================
-- EXTEND HOSPITALS
-- =====================
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS city text NOT NULL DEFAULT '';
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS is_open boolean NOT NULL DEFAULT true;

-- =====================
-- TRUST SCORE EVENTS
-- =====================
CREATE TABLE IF NOT EXISTS trust_score_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  detail text NOT NULL DEFAULT '',
  delta integer NOT NULL DEFAULT 0,
  score_after integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE trust_score_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own score events"
  ON trust_score_events FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert score events"
  ON trust_score_events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- =====================
-- DONATION CONFIRMATIONS
-- =====================
CREATE TABLE IF NOT EXISTS donation_confirmations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES blood_requests(id) ON DELETE CASCADE,
  donor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requester_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  donor_confirmed boolean,
  requester_confirmed boolean,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(request_id, donor_id)
);

ALTER TABLE donation_confirmations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Donors can view own confirmations"
  ON donation_confirmations FOR SELECT
  TO authenticated
  USING (auth.uid() = donor_id OR auth.uid() = requester_id);

CREATE POLICY "Users can insert confirmations"
  ON donation_confirmations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = donor_id OR auth.uid() = requester_id);

CREATE POLICY "Users can update own confirmations"
  ON donation_confirmations FOR UPDATE
  TO authenticated
  USING (auth.uid() = donor_id OR auth.uid() = requester_id);

-- =====================
-- ABUSE LOGS
-- =====================
CREATE TABLE IF NOT EXISTS abuse_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  log_id text NOT NULL UNIQUE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_id uuid NOT NULL REFERENCES blood_requests(id) ON DELETE CASCADE,
  urgency text NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  hospital_name text NOT NULL DEFAULT '',
  gps_verified boolean NOT NULL DEFAULT false,
  flagged boolean NOT NULL DEFAULT false,
  flag_reason text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE abuse_logs ENABLE ROW LEVEL SECURITY;

-- Only admins should read abuse logs; for now allow authenticated users to insert
CREATE POLICY "Users can insert abuse logs"
  ON abuse_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- =====================
-- INDEXES
-- =====================
CREATE INDEX IF NOT EXISTS idx_profiles_trust_score ON profiles(trust_score);
CREATE INDEX IF NOT EXISTS idx_profiles_account_tier ON profiles(account_tier);
CREATE INDEX IF NOT EXISTS idx_blood_requests_urgency ON blood_requests(urgency);
CREATE INDEX IF NOT EXISTS idx_blood_requests_log_id ON blood_requests(log_id);
CREATE INDEX IF NOT EXISTS idx_trust_score_events_user ON trust_score_events(user_id);
CREATE INDEX IF NOT EXISTS idx_abuse_logs_user ON abuse_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_abuse_logs_log_id ON abuse_logs(log_id);

-- =====================
-- UPDATE HOSPITAL SEED DATA (Indian locations)
-- =====================
DELETE FROM hospitals;

INSERT INTO hospitals (name, address, phone, latitude, longitude, has_blood_bank, blood_groups_available, city, is_open)
VALUES
  ('Malda Medical College & Hospital', 'NH-34, Malda, West Bengal 732101', '+91-3512-266600', 25.0043, 88.1462, true, ARRAY['A+','A-','B+','B-','O+','O-','AB+','AB-'], 'Malda', true),
  ('Netaji Subhas Chandra Bose Cancer Hospital', 'Jhaljhalia, Malda, WB 732102', '+91-3512-250100', 25.0210, 88.1350, true, ARRAY['A+','B+','O+','AB+','O-'], 'Malda', true),
  ('Chanchal Sub-Divisional Hospital', 'Chanchal, Malda, WB 732123', '+91-3512-255200', 25.3800, 88.0200, true, ARRAY['A+','B+','O+','O-','AB+'], 'Malda', true),
  ('Red Cross Blood Bank Malda', 'English Bazaar, Malda, WB 732101', '+91-3512-252300', 25.0155, 88.1400, true, ARRAY['A+','A-','B+','B-','O+','O-','AB+','AB-'], 'Malda', true),
  ('Gayeshpur Rural Hospital', 'Gayeshpur, Malda, WB 732124', '+91-3512-258100', 25.1200, 88.2100, false, ARRAY['A+','O+','B+'], 'Malda', true),
  ('SSKM Hospital Blood Bank', '242, AJC Bose Rd, Kolkata 700020', '+91-33-22041101', 22.5356, 88.3427, true, ARRAY['A+','A-','B+','B-','O+','O-','AB+','AB-'], 'Kolkata', true),
  ('Calcutta Medical College Blood Bank', '88, College St, Kolkata 700073', '+91-33-22413020', 22.5726, 88.3570, true, ARRAY['A+','A-','B+','B-','O+','O-','AB+','AB-'], 'Kolkata', true)
ON CONFLICT DO NOTHING;
