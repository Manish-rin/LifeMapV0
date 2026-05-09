export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'O+' | 'O-' | 'AB+' | 'AB-';

export const BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

export interface Profile {
  id: string;
  full_name: string;
  phone: string;
  blood_group: string;
  latitude: number | null;
  longitude: number | null;
  is_available: boolean;
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
  status: 'pending' | 'fulfilled' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface RequestResponse {
  id: string;
  request_id: string;
  donor_id: string;
  status: 'pending' | 'accepted' | 'declined';
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
  created_at: string;
}

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
    };
  };
};
