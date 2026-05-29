import type { Profile, PrivacyMode, BadgeId, TrustScoreEvent } from './database.types';

// ── Score Deltas ──
export const SCORE_DELTAS = {
  CONFIRMED_DONATION: +5,
  FAST_RESPONSE: +2,       // accepted within 2 min
  AADHAAR_VERIFIED: +5,
  DECLINED_REQUEST: -3,
  UNCONFIRMED_CRITICAL: -10,
} as const;

// ── Trust Tier Thresholds ──
export function getTrustTier(score: number): 'low' | 'mid' | 'high' {
  if (score >= 85) return 'high';
  if (score >= 60) return 'mid';
  return 'low';
}

export function getAvailableModes(score: number, accountTier: Profile['account_tier']): PrivacyMode[] {
  // Hospital tier always gets all modes
  if (accountTier === 'hospital') return ['raksha', 'setu', 'praana'];
  // NGO tier gets raksha + setu
  if (accountTier === 'ngo') return ['raksha', 'setu'];

  const tier = getTrustTier(score);
  if (tier === 'high') return ['raksha', 'setu', 'praana'];
  if (tier === 'mid') return ['raksha', 'setu'];
  return ['raksha'];
}

export function getTierLabel(score: number): string {
  if (score >= 85) return 'Trusted';
  if (score >= 60) return 'Verified';
  if (score >= 20) return 'Standard';
  return 'Under Review';
}

export function getTierColor(score: number): string {
  if (score >= 85) return 'emerald';
  if (score >= 60) return 'blue';
  if (score >= 20) return 'gray';
  return 'red';
}

// ── Next Eligible Donation Date ──
export function getNextEligibleDate(lastDonationDate: string | null): Date | null {
  if (!lastDonationDate) return null;
  const d = new Date(lastDonationDate);
  d.setDate(d.getDate() + 90); // 90-day rule
  return d;
}

export function isEligibleToDonate(lastDonationDate: string | null): boolean {
  if (!lastDonationDate) return true;
  const next = getNextEligibleDate(lastDonationDate);
  if (!next) return true;
  return new Date() >= next;
}

// ── Badge Unlock Logic ──
export function getUnlockedBadges(profile: Profile): BadgeId[] {
  const badges: BadgeId[] = [];

  if (profile.total_donations >= 1) badges.push('first_drop');
  if (profile.total_donations >= 5) badges.push('life_saver');
  if (profile.current_streak >= 3) badges.push('on_a_streak');
  if (profile.aadhaar_verified) badges.push('id_verified');
  if (profile.trust_score >= 90) badges.push('trusted_hero');

  // first_responder is checked via events — for now we include it
  // if they have any fast response event
  return badges;
}

// ── Account Review Check ──
export function isAccountUnderReview(score: number): boolean {
  return score < 20;
}

export function shouldSuspend(unconfirmedCriticalCount: number): boolean {
  return unconfirmedCriticalCount >= 3; // 3 in 30 days
}

// ── Mock Score Events for Demo ──
export function generateMockScoreEvents(): TrustScoreEvent[] {
  const now = Date.now();
  const day = 86400000;

  return [
    { id: '1', user_id: 'demo', action: 'Aadhaar Verified', detail: 'Identity verified via UIDAI OTP', delta: 5, score_after: 55, created_at: new Date(now - 30 * day).toISOString() },
    { id: '2', user_id: 'demo', action: 'Donation Confirmed', detail: 'Donated B+ at Malda Medical College', delta: 5, score_after: 60, created_at: new Date(now - 25 * day).toISOString() },
    { id: '3', user_id: 'demo', action: 'Fast Response', detail: 'Accepted request in 1m 42s', delta: 2, score_after: 62, created_at: new Date(now - 25 * day).toISOString() },
    { id: '4', user_id: 'demo', action: 'Donation Confirmed', detail: 'Donated B+ at City Care Hospital', delta: 5, score_after: 67, created_at: new Date(now - 15 * day).toISOString() },
    { id: '5', user_id: 'demo', action: 'Request Declined', detail: 'Declined O+ request — unavailable', delta: -3, score_after: 64, created_at: new Date(now - 10 * day).toISOString() },
    { id: '6', user_id: 'demo', action: 'Donation Confirmed', detail: 'Donated B+ at Mercy Hospital', delta: 5, score_after: 69, created_at: new Date(now - 5 * day).toISOString() },
    { id: '7', user_id: 'demo', action: 'Fast Response', detail: 'Accepted request in 58s', delta: 2, score_after: 71, created_at: new Date(now - 5 * day).toISOString() },
  ];
}

// ── Log ID Generator ──
export function generateLogId(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const seq = String(Math.floor(Math.random() * 9999)).padStart(4, '0');
  return `PS-${y}${m}${d}-${seq}`;
}
