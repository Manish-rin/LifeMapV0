
import { useEffect, useState } from 'react';
import { getTierLabel, getTierColor } from '../lib/trustScore';

interface TrustScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
}

export default function TrustScoreRing({ score, size = 120, strokeWidth = 8, showLabel = true }: TrustScoreRingProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedScore / 100) * circumference;

  const tierLabel = getTierLabel(score);
  const tierColor = getTierColor(score);

  const strokeColors: Record<string, string> = {
    emerald: '#10b981',
    blue: '#3b82f6',
    gray: '#6b7280',
    red: '#ef4444',
  };

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScore(score), 100);
    return () => clearTimeout(timer);
  }, [score]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
        >
          <circle
            className="trust-ring-bg"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
          />
          <circle
            className="trust-ring-fill"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            stroke={strokeColors[tierColor] || '#6b7280'}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-gray-900">{animatedScore}</span>
          <span className="text-xs text-gray-500">/100</span>
        </div>
      </div>
      {showLabel && (
        <span
          className="text-xs font-semibold px-2.5 py-1 rounded-full"
          style={{
            background: tierColor === 'emerald' ? '#d1fae5' : tierColor === 'blue' ? '#dbeafe' : tierColor === 'red' ? '#fee2e2' : '#f3f4f6',
            color: tierColor === 'emerald' ? '#047857' : tierColor === 'blue' ? '#1d4ed8' : tierColor === 'red' ? '#b91c1c' : '#374151',
          }}
        >
          {tierLabel}
        </span>
      )}
    </div>
  );
}
