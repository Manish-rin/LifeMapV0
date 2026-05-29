import { BADGES } from '../lib/database.types';
import type { BadgeId } from '../lib/database.types';

interface BadgeGridProps {
  unlockedBadges: BadgeId[];
}

export default function BadgeGrid({ unlockedBadges }: BadgeGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {BADGES.map((badge) => {
        const isUnlocked = unlockedBadges.includes(badge.id);
        return (
          <div
            key={badge.id}
            className={`relative rounded-xl p-4 border transition-all duration-300 ${
              isUnlocked
                ? `bg-${badge.color}-50 border-${badge.color}-200 badge-unlocked`
                : 'bg-gray-50 border-gray-100 badge-locked'
            }`}
          >
            {/* Icon */}
            <div className={`text-3xl mb-2 ${isUnlocked ? '' : 'grayscale'}`}>
              {badge.icon}
            </div>

            {/* Name */}
            <h4 className={`font-semibold text-sm mb-0.5 ${
              isUnlocked ? 'text-gray-900' : 'text-gray-400'
            }`}>
              {badge.name}
            </h4>

            {/* Description */}
            <p className={`text-xs leading-relaxed ${
              isUnlocked ? 'text-gray-600' : 'text-gray-400'
            }`}>
              {isUnlocked ? badge.description : badge.unlockCondition}
            </p>

            {/* Lock/Unlock indicator */}
            {isUnlocked ? (
              <div className="absolute top-3 right-3">
                <div className={`w-5 h-5 rounded-full bg-${badge.color}-500 flex items-center justify-center`}>
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            ) : (
              <div className="absolute top-3 right-3 text-gray-300">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0110 0v4"/>
                </svg>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
