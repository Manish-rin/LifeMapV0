import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { TrustScoreEvent } from '../lib/database.types';

interface ScoreHistoryProps {
  events: TrustScoreEvent[];
}

export default function ScoreHistory({ events }: ScoreHistoryProps) {
  if (events.length === 0) {
    return (
      <div className="text-center py-10 text-gray-400">
        <Minus size={32} className="mx-auto mb-2 opacity-30" />
        <div className="text-sm">No score events yet</div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
        Trust Score History
      </div>
      {[...events].reverse().map((event) => {
        const isPositive = event.delta > 0;
        return (
          <div key={event.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
            <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${isPositive ? 'bg-emerald-100' : 'bg-red-100'}`}>
              {isPositive ? <TrendingUp size={14} className="text-emerald-600" /> : <TrendingDown size={14} className="text-red-600" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm text-gray-900">{event.action}</h4>
                <span className={`text-sm font-bold ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                  {isPositive ? '+' : ''}{event.delta}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{event.detail}</p>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="text-xs text-gray-400">
                  {new Date(event.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
                <span className="text-xs text-gray-400">
                  Score: <strong className="text-gray-600">{event.score_after}</strong>
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
