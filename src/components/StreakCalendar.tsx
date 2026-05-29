import { useMemo } from 'react';
import { getNextEligibleDate } from '../lib/trustScore';
import { Calendar, Droplets } from 'lucide-react';

interface StreakCalendarProps {
  donationDates: string[];   // ISO date strings
  lastDonationDate: string | null;
  currentStreak: number;
}

export default function StreakCalendar({ donationDates, lastDonationDate, currentStreak }: StreakCalendarProps) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  const nextEligible = getNextEligibleDate(lastDonationDate);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const donationSet = useMemo(() => {
    const set = new Set<string>();
    donationDates.forEach(d => {
      const date = new Date(d);
      set.add(`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`);
    });
    return set;
  }, [donationDates]);

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthName = today.toLocaleString('default', { month: 'long' });

  return (
    <div className="space-y-4">
      {/* Month Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Calendar size={16} className="text-red-600" />
          {monthName} {year}
        </h3>
        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-emerald-200 inline-block" />
            Donated
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded border-2 border-red-500 inline-block" />
            Today
          </span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Day names */}
        {dayNames.map(d => (
          <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">
            {d}
          </div>
        ))}

        {/* Empty cells before first day */}
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {/* Days */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateKey = `${year}-${month}-${day}`;
          const isDonated = donationSet.has(dateKey);
          const isToday = day === today.getDate();
          const isFuture = day > today.getDate();
          const isEligible = nextEligible && !isFuture && new Date(year, month, day) >= nextEligible;

          let className = 'text-center py-1.5 rounded-lg text-sm font-medium transition-all ';
          if (isDonated) className += 'cal-donated ';
          if (isToday) className += 'cal-today ';
          if (!isDonated && !isToday && isEligible) className += 'cal-eligible ';
          if (isFuture && !isDonated) className += 'cal-future ';
          if (!isDonated && !isFuture && !isToday && !isEligible) className += 'text-gray-700 ';

          return (
            <div key={day} className={className}>
              {day}
            </div>
          );
        })}
      </div>

      {/* Streak Info */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-orange-50 rounded-xl p-3 border border-orange-100">
          <div className="text-2xl font-bold text-orange-700">{currentStreak}</div>
          <div className="text-xs text-orange-600">Month Streak 🔥</div>
        </div>
        <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
          <div className="text-sm font-bold text-blue-700">
            {nextEligible
              ? (nextEligible > today
                ? nextEligible.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                : 'Now eligible ✓')
              : 'Anytime'}
          </div>
          <div className="text-xs text-blue-600 flex items-center gap-1">
            <Droplets size={11} />
            Next eligible date
          </div>
        </div>
      </div>

      {/* 90-day rule info */}
      <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
        <p className="text-xs text-gray-600 leading-relaxed">
          <strong>90-Day Rule:</strong> After donating blood, you must wait at least 90 days before your next donation.
          This ensures your body fully replenishes its blood supply.
        </p>
      </div>
    </div>
  );
}
