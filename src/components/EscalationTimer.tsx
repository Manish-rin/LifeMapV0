import { useEffect, useState, useRef, useCallback } from 'react';
import { Shield, Zap, Heart, AlertTriangle } from 'lucide-react';
import { getEscalatedMode, formatTimeRemaining, ESCALATION_WINDOW_MS } from '../lib/privacyModes';
import type { Urgency, AccountTier, PrivacyMode } from '../lib/database.types';
import { PRIVACY_MODE_CONFIG } from '../lib/database.types';

interface EscalationTimerProps {
  urgency: Urgency;
  accountTier: AccountTier;
  isActive: boolean;
  onModeChange?: (mode: PrivacyMode) => void;
  onComplete?: () => void;
}

export default function EscalationTimer({ urgency, accountTier, isActive, onModeChange, onComplete }: EscalationTimerProps) {
  const [elapsedMs, setElapsedMs] = useState(0);
  const intervalRef = useRef<number | null>(null);
  const lastModeRef = useRef<PrivacyMode>('raksha');

  const state = getEscalatedMode(elapsedMs, urgency, accountTier);

  const startTimer = useCallback(() => {
    if (intervalRef.current) return;
    const startTime = Date.now() - elapsedMs;
    intervalRef.current = window.setInterval(() => {
      setElapsedMs(Date.now() - startTime);
    }, 100);
  }, [elapsedMs]);

  const stopTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isActive && urgency === 'critical') {
      startTimer();
    } else {
      stopTimer();
    }
    return stopTimer;
  }, [isActive, urgency, startTimer, stopTimer]);

  useEffect(() => {
    if (state.currentMode !== lastModeRef.current) {
      lastModeRef.current = state.currentMode;
      onModeChange?.(state.currentMode);
    }
    if (state.isComplete) {
      stopTimer();
      onComplete?.();
    }
  }, [state, onModeChange, onComplete, stopTimer]);

  if (urgency !== 'critical') return null;

  const totalTime = accountTier === 'ngo' ? ESCALATION_WINDOW_MS : 2 * ESCALATION_WINDOW_MS;

  // Stage 1: Raksha → Setu
  const stage1Progress = accountTier === 'hospital' ? 100 :
    accountTier === 'ngo' ? 100 :
    Math.min(100, (elapsedMs / ESCALATION_WINDOW_MS) * 100);

  // Stage 2: Setu → Praana
  const stage2Elapsed = Math.max(0, elapsedMs - (accountTier === 'ngo' ? 0 : ESCALATION_WINDOW_MS));
  const stage2Progress = accountTier === 'hospital' ? 100 :
    Math.min(100, (stage2Elapsed / ESCALATION_WINDOW_MS) * 100);

  const modeIcons: Record<PrivacyMode, typeof Shield> = {
    raksha: Shield,
    setu: Zap,
    praana: Heart,
  };

  const ModeIcon = modeIcons[state.currentMode];
  const modeConfig = PRIVACY_MODE_CONFIG[state.currentMode];
  const remaining = Math.max(0, totalTime - elapsedMs);

  return (
    <div className="bg-gray-900 rounded-2xl p-5 text-white animate-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} className="text-red-400" />
          <span className="text-sm font-semibold text-red-400">Critical Escalation Active</span>
        </div>
        <div className="text-sm font-mono text-gray-300">
          {formatTimeRemaining(remaining)}
        </div>
      </div>

      {/* Current Mode Badge */}
      <div className={`flex items-center gap-3 p-3 rounded-xl mb-4 bg-${modeConfig.color}-500/20 border border-${modeConfig.color}-500/30`}>
        <div className={`w-10 h-10 rounded-lg bg-${modeConfig.color}-500/30 flex items-center justify-center`}>
          <ModeIcon size={20} className={`text-${modeConfig.color}-400`} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm">{state.currentMode.toUpperCase()}</span>
            <span className="text-xs text-gray-400">{modeConfig.sanskrit}</span>
          </div>
          <span className="text-xs text-gray-400">{modeConfig.description}</span>
        </div>
      </div>

      {/* Progress Bars */}
      <div className="space-y-3">
        {/* Stage 1: Raksha → Setu */}
        <div>
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span className="flex items-center gap-1">
              <Shield size={11} />
              Raksha → Setu
            </span>
            <span>{stage1Progress >= 100 ? 'Done' : `${Math.round(stage1Progress)}%`}</span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 ease-linear"
              style={{
                width: `${stage1Progress}%`,
                background: stage1Progress >= 100
                  ? 'linear-gradient(90deg, #10b981, #34d399)'
                  : 'linear-gradient(90deg, #f59e0b, #fbbf24)',
              }}
            />
          </div>
        </div>

        {/* Stage 2: Setu → Praana */}
        <div>
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span className="flex items-center gap-1">
              <Zap size={11} />
              Setu → Praana
            </span>
            <span>{stage2Progress >= 100 ? 'Done' : `${Math.round(stage2Progress)}%`}</span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 ease-linear"
              style={{
                width: `${stage2Progress}%`,
                background: stage2Progress >= 100
                  ? 'linear-gradient(90deg, #ef4444, #f87171)'
                  : 'linear-gradient(90deg, #f59e0b, #fbbf24)',
              }}
            />
          </div>
        </div>
      </div>

      {/* Mode Steps */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-700">
        {(['raksha', 'setu', 'praana'] as PrivacyMode[]).map((m, i) => {
          const isActive = state.currentMode === m;
          const isPast = state.stage > i;
          return (
            <div key={m} className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                ${isActive ? 'bg-white text-gray-900 animate-pulse' : isPast ? 'bg-emerald-500 text-white' : 'bg-gray-700 text-gray-500'}
              `}>
                {isPast ? '✓' : i + 1}
              </div>
              <span className={`text-xs font-medium ${isActive ? 'text-white' : 'text-gray-500'}`}>
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </span>
              {i < 2 && <div className="w-4 h-px bg-gray-700 mx-1" />}
            </div>
          );
        })}
      </div>

      {/* Identity Log Notice */}
      <div className="mt-3 flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-lg p-2.5">
        <AlertTriangle size={12} className="text-red-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-red-300 leading-relaxed">
          All critical requests are identity-logged. Misuse is a traceable offence under Indian law.
        </p>
      </div>
    </div>
  );
}
