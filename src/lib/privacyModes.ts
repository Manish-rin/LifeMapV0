import type { PrivacyMode, Urgency, AccountTier } from './database.types';

// ── Escalation Timers ──
export const ESCALATION_WINDOW_MS = 90_000; // 90 seconds per stage

export interface EscalationState {
  currentMode: PrivacyMode;
  stage: 0 | 1 | 2;
  elapsedMs: number;
  isComplete: boolean;
}

/**
 * Determine the initial privacy mode based on account tier.
 * Hospital-tier starts at Praana immediately.
 * NGO-tier starts at Setu.
 * Public starts at Raksha.
 */
export function getInitialMode(accountTier: AccountTier): PrivacyMode {
  if (accountTier === 'hospital') return 'praana';
  if (accountTier === 'ngo') return 'setu';
  return 'raksha';
}

/**
 * For critical requests, determine the current mode based on elapsed time.
 * Stage 0 (0-90s): Raksha
 * Stage 1 (90-180s): Setu
 * Stage 2 (180s+): Praana
 */
export function getEscalatedMode(
  elapsedMs: number,
  urgency: Urgency,
  accountTier: AccountTier
): EscalationState {
  // Non-critical requests don't escalate
  if (urgency !== 'critical') {
    const mode = getInitialMode(accountTier);
    return { currentMode: mode, stage: 0, elapsedMs, isComplete: true };
  }

  // Hospital tier is always Praana for critical
  if (accountTier === 'hospital') {
    return { currentMode: 'praana', stage: 2, elapsedMs, isComplete: true };
  }

  // NGO tier starts at Setu, escalates to Praana
  if (accountTier === 'ngo') {
    if (elapsedMs >= ESCALATION_WINDOW_MS) {
      return { currentMode: 'praana', stage: 2, elapsedMs, isComplete: true };
    }
    return { currentMode: 'setu', stage: 1, elapsedMs, isComplete: false };
  }

  // Public tier: Raksha → Setu → Praana
  if (elapsedMs >= 2 * ESCALATION_WINDOW_MS) {
    return { currentMode: 'praana', stage: 2, elapsedMs, isComplete: true };
  }
  if (elapsedMs >= ESCALATION_WINDOW_MS) {
    return { currentMode: 'setu', stage: 1, elapsedMs, isComplete: false };
  }
  return { currentMode: 'raksha', stage: 0, elapsedMs, isComplete: false };
}

/**
 * Returns what contact info is revealed at each mode.
 */
export function getRevealBehavior(mode: PrivacyMode): {
  requesterSeeDonor: boolean;
  donorSeeRequester: boolean;
  requiresAccept: boolean;
} {
  switch (mode) {
    case 'raksha':
      return { requesterSeeDonor: false, donorSeeRequester: false, requiresAccept: true };
    case 'setu':
      return { requesterSeeDonor: false, donorSeeRequester: true, requiresAccept: false };
    case 'praana':
      return { requesterSeeDonor: true, donorSeeRequester: true, requiresAccept: false };
  }
}

/**
 * Get the total maximum escalation time based on account tier.
 */
export function getTotalEscalationTime(accountTier: AccountTier): number {
  if (accountTier === 'hospital') return 0;
  if (accountTier === 'ngo') return ESCALATION_WINDOW_MS;
  return 2 * ESCALATION_WINDOW_MS; // 3 minutes total
}

/**
 * Format remaining time in a human readable way
 */
export function formatTimeRemaining(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${String(sec).padStart(2, '0')}`;
}
