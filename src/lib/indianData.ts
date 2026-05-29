/**
 * Indian localization data for Praan-Setu
 * Seed hospitals, blood banks, and default map center
 */

import type { Hospital } from './database.types';

// Default map center — Malda, West Bengal (team's home)
export const DEFAULT_MAP_CENTER = { lat: 25.0108, lng: 88.1411 };
export const DEFAULT_MAP_ZOOM = 12;

// Major Indian city centers for fallback
export const INDIAN_CITIES = [
  { name: 'Malda', lat: 25.0108, lng: 88.1411 },
  { name: 'Kolkata', lat: 22.5726, lng: 88.3639 },
  { name: 'Delhi', lat: 28.6139, lng: 77.2090 },
  { name: 'Mumbai', lat: 19.0760, lng: 72.8777 },
  { name: 'Bengaluru', lat: 12.9716, lng: 77.5946 },
  { name: 'Chennai', lat: 13.0827, lng: 80.2707 },
];

// Seed hospitals & blood banks — real locations in and around Malda, WB
export const SEED_HOSPITALS: Omit<Hospital, 'id' | 'created_at'>[] = [
  {
    name: 'Malda Medical College & Hospital',
    address: 'NH-34, Malda, West Bengal 732101',
    phone: '+91-3512-266600',
    latitude: 25.0043,
    longitude: 88.1462,
    has_blood_bank: true,
    blood_groups_available: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'],
    city: 'Malda',
    is_open: true,
  },
  {
    name: 'Netaji Subhas Chandra Bose Cancer Hospital',
    address: 'Jhaljhalia, Malda, West Bengal 732102',
    phone: '+91-3512-250100',
    latitude: 25.0210,
    longitude: 88.1350,
    has_blood_bank: true,
    blood_groups_available: ['A+', 'B+', 'O+', 'AB+', 'O-'],
    city: 'Malda',
    is_open: true,
  },
  {
    name: 'Chanchal Sub-Divisional Hospital',
    address: 'Chanchal, Malda, West Bengal 732123',
    phone: '+91-3512-255200',
    latitude: 25.3800,
    longitude: 88.0200,
    has_blood_bank: true,
    blood_groups_available: ['A+', 'B+', 'O+', 'O-', 'AB+'],
    city: 'Malda',
    is_open: true,
  },
  {
    name: 'Red Cross Blood Bank Malda',
    address: 'English Bazaar, Malda, West Bengal 732101',
    phone: '+91-3512-252300',
    latitude: 25.0155,
    longitude: 88.1400,
    has_blood_bank: true,
    blood_groups_available: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'],
    city: 'Malda',
    is_open: true,
  },
  {
    name: 'Gayeshpur Rural Hospital',
    address: 'Gayeshpur, Malda, West Bengal 732124',
    phone: '+91-3512-258100',
    latitude: 25.1200,
    longitude: 88.2100,
    has_blood_bank: false,
    blood_groups_available: ['A+', 'O+', 'B+'],
    city: 'Malda',
    is_open: true,
  },
  {
    name: 'SSKM Hospital Blood Bank',
    address: '242, AJC Bose Rd, Kolkata 700020',
    phone: '+91-33-22041101',
    latitude: 22.5356,
    longitude: 88.3427,
    has_blood_bank: true,
    blood_groups_available: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'],
    city: 'Kolkata',
    is_open: true,
  },
  {
    name: 'Calcutta Medical College Blood Bank',
    address: '88, College Street, Kolkata 700073',
    phone: '+91-33-22413020',
    latitude: 22.5726,
    longitude: 88.3570,
    has_blood_bank: true,
    blood_groups_available: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'],
    city: 'Kolkata',
    is_open: true,
  },
];

// Mock available donors around Malda for demo purposes
export const MOCK_DONORS = [
  { id: 'd1', blood_group: 'B+', latitude: 25.0150, longitude: 88.1500, is_available: true },
  { id: 'd2', blood_group: 'O+', latitude: 25.0050, longitude: 88.1350, is_available: true },
  { id: 'd3', blood_group: 'A+', latitude: 25.0200, longitude: 88.1550, is_available: true },
  { id: 'd4', blood_group: 'AB-', latitude: 25.0080, longitude: 88.1250, is_available: true },
  { id: 'd5', blood_group: 'O-', latitude: 24.9950, longitude: 88.1600, is_available: true },
  { id: 'd6', blood_group: 'B+', latitude: 25.0300, longitude: 88.1300, is_available: true },
  { id: 'd7', blood_group: 'A-', latitude: 25.0100, longitude: 88.1700, is_available: true },
  { id: 'd8', blood_group: 'O+', latitude: 25.0250, longitude: 88.1200, is_available: true },
  { id: 'd9', blood_group: 'B-', latitude: 24.9900, longitude: 88.1450, is_available: true },
  { id: 'd10', blood_group: 'AB+', latitude: 25.0350, longitude: 88.1550, is_available: true },
  { id: 'd11', blood_group: 'O+', latitude: 25.0180, longitude: 88.1080, is_available: true },
  { id: 'd12', blood_group: 'B+', latitude: 25.0020, longitude: 88.1620, is_available: true },
];

// eRaktKosh-style blood stock data (simulated)
export interface BloodStockEntry {
  bloodGroup: string;
  units: number;
  lastUpdated: string;
}

export function getSimulatedBloodStock(hospitalName: string): BloodStockEntry[] {
  // Simulate varying stock levels for demo
  const groups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
  const seed = hospitalName.length;
  return groups.map((g, i) => ({
    bloodGroup: g,
    units: Math.max(0, Math.floor(Math.sin(seed + i) * 15 + 10)),
    lastUpdated: new Date(Date.now() - Math.random() * 3600000).toISOString(),
  }));
}
