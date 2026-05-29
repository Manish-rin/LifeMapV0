export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'O+' | 'O-' | 'AB+' | 'AB-';

export const BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

export type AccountTier = 'public' | 'ngo' | 'hospital';
export type Urgency = 'critical' | 'urgent' | 'planned';
export type PrivacyMode = 'raksha' | 'setu' | 'praana';

export const URGENCY_CONFIG: Record<Urgency, { label: string; color: string; description: string }> = {
  critical: { label: 'Critical', color: 'red', description: 'Life-threatening — immediate need' },
  urgent: { label: 'Urgent', color: 'amber', description: 'Needed within hours' },
  planned: { label: 'Planned', color: 'blue', description: 'Scheduled transfusion' },
};

export const PRIVACY_MODE_CONFIG: Record<PrivacyMode, { label: string; sanskrit: string; description: string; color: string }> = {
  raksha: {
    label: 'Protection',
    sanskrit: 'रक्षा',
    description: 'Donor must accept before any contact is shared',
    color: 'emerald',
  },
  setu: {
    label: 'Bridge',
    sanskrit: 'सेतु',
    description: "Patient's number pushed to donor immediately",
    color: 'amber',
  },
  praana: {
    label: 'Life Force',
    sanskrit: 'प्राण',
    description: 'Full mutual contact reveal — both see each other instantly',
    color: 'red',
  },
};

export const RADIUS_OPTIONS = [
  { value: 2, label: '2 km', description: 'Immediate area' },
  { value: 5, label: '5 km', description: 'City-wide' },
  { value: 10, label: '10 km', description: 'Extended area' },
];

export interface Profile {
  id: string;
  full_name: string;
  phone: string;
  blood_group: string;
  latitude: number | null;
  longitude: number | null;
  is_available: boolean;
  trust_score: number;
  account_tier: AccountTier;
  aadhaar_verified: boolean;
  city: string;
  total_donations: number;
  current_streak: number;
  last_donation_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface BloodRequest {
  id: string;
  user_id: string;
  blood_group: string;
  latitude: number;
  longitude: number;
  address: string;
  notes: string;
  hospital_name: string;
  urgency: Urgency;
  notification_radius: number;
  privacy_mode: PrivacyMode;
  log_id: string;
  status: 'pending' | 'fulfilled' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface RequestResponse {
  id: string;
  request_id: string;
  donor_id: string;
  status: 'pending' | 'accepted' | 'declined';
  response_time_ms: number | null;
  created_at: string;
  updated_at: string;
}

export interface Hospital {
  id: string;
  name: string;
  address: string;
  phone: string;
  latitude: number;
  longitude: number;
  has_blood_bank: boolean;
  blood_groups_available: string[];
  city: string;
  is_open: boolean;
  created_at: string;
}

export interface TrustScoreEvent {
  id: string;
  user_id: string;
  action: string;
  detail: string;
  delta: number;
  score_after: number;
  created_at: string;
}

export interface DonationConfirmation {
  id: string;
  request_id: string;
  donor_id: string;
  requester_id: string;
  donor_confirmed: boolean | null;
  requester_confirmed: boolean | null;
  created_at: string;
}

export interface AbuseLog {
  id: string;
  log_id: string; // PS-YYYYMMDD-XXXX
  user_id: string;
  request_id: string;
  urgency: Urgency;
  latitude: number;
  longitude: number;
  hospital_name: string;
  gps_verified: boolean;
  flagged: boolean;
  flag_reason: string;
  created_at: string;
}

export type BadgeId = 'first_drop' | 'first_responder' | 'on_a_streak' | 'id_verified' | 'life_saver' | 'trusted_hero';

export interface Badge {
  id: BadgeId;
  name: string;
  description: string;
  icon: string;
  unlockCondition: string;
  color: string;
}

export const BADGES: Badge[] = [
  { id: 'first_drop', name: 'First Drop', description: 'Completed your first donation', icon: '💧', unlockCondition: '1 confirmed donation', color: 'blue' },
  { id: 'first_responder', name: 'First Responder', description: 'Accepted a request within 2 minutes', icon: '⚡', unlockCondition: 'Response under 2 min', color: 'amber' },
  { id: 'on_a_streak', name: 'On a Streak', description: '3 consecutive months of activity', icon: '🔥', unlockCondition: '3-month streak', color: 'orange' },
  { id: 'id_verified', name: 'ID Verified', description: 'Aadhaar identity verified', icon: '🛡️', unlockCondition: 'Aadhaar linked', color: 'emerald' },
  { id: 'life_saver', name: 'Life Saver', description: 'Completed 5 confirmed donations', icon: '❤️', unlockCondition: '5 donations', color: 'red' },
  { id: 'trusted_hero', name: 'Trusted Hero', description: 'Achieved trust score of 90+', icon: '🏆', unlockCondition: 'Score ≥ 90', color: 'purple' },
];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string };
        Update: Partial<Profile>;
      };
      blood_requests: {
        Row: BloodRequest;
        Insert: Omit<BloodRequest, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<BloodRequest>;
      };
      request_responses: {
        Row: RequestResponse;
        Insert: Omit<RequestResponse, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<RequestResponse>;
      };
      hospitals: {
        Row: Hospital;
        Insert: Omit<Hospital, 'id' | 'created_at'>;
        Update: Partial<Hospital>;
      };
      trust_score_events: {
        Row: TrustScoreEvent;
        Insert: Omit<TrustScoreEvent, 'id' | 'created_at'>;
        Update: Partial<TrustScoreEvent>;
      };
      donation_confirmations: {
        Row: DonationConfirmation;
        Insert: Omit<DonationConfirmation, 'id' | 'created_at'>;
        Update: Partial<DonationConfirmation>;
      };
      abuse_logs: {
        Row: AbuseLog;
        Insert: Omit<AbuseLog, 'id' | 'created_at'>;
        Update: Partial<AbuseLog>;
      };
    };
  };
};
