'use client';

import { useState } from 'react';
import type { ValueRange } from '@/lib/types';

interface ValueRangeOption {
  id: ValueRange;
  label: string;
}

const VALUE_RANGE_OPTIONS: ValueRangeOption[] = [
  { id: 'under_100', label: 'Under $100' },
  { id: 'range_100_1000', label: '$100 - $1,000' },
  { id: 'range_1000_10000', label: '$1,000 - $10,000' },
  { id: 'range_10000_100000', label: '$10,000 - $100,000' },
  { id: 'over_100000', label: 'Over $100,000' },
  { id: 'prefer_not_to_say', label: 'Prefer not to say' },
];

interface ValueRangeSelectionProps {
  onSelect: (valueRange: ValueRange) => void;
  isSubmitting?: boolean;
}

export function ValueRangeSelection({ onSelect, isSubmitting }: ValueRangeSelectionProps) {
  const [selectedRange, setSelectedRange] = useState<ValueRange | null>(null);

  const handleRangeSelect = (range: ValueRange) => {
    setSelectedRange(range);
  };

  const handleContinue = () => {
    if (selectedRange) {
      onSelect(selectedRange);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-[var(--foreground)]">
          Approximately how much was taken?
        </h1>
        <p className="mt-2 text-[var(--text-muted)]">
          This is optional and helps us understand attack patterns. Your response is completely anonymous.
        </p>
      </div>

      {/* Value Range Options */}
      <div className="grid grid-cols-1 gap-3">
        {VALUE_RANGE_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => handleRangeSelect(option.id)}
            disabled={isSubmitting}
            className={`
              min-h-[56px] rounded-xl border-2 px-4 py-4 text-left
              transition-all duration-200
              ${
                selectedRange === option.id
                  ? 'border-[var(--primary)] bg-[var(--primary)]/10'
                  : 'border-[var(--border)] bg-[var(--card-bg)] hover:border-[var(--primary)]/50'
              }
              ${isSubmitting ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
            `}
          >
            <span className="text-[var(--foreground)]">{option.label}</span>
          </button>
        ))}
      </div>

      {/* Continue Button */}
      {selectedRange && (
        <div className="animate-fadeIn pt-4">
          <button
            type="button"
            onClick={handleContinue}
            disabled={isSubmitting}
            className={`
              w-full rounded-xl bg-[var(--primary)] px-6 py-4
              text-lg font-medium text-white
              transition-colors duration-200
              ${isSubmitting ? 'cursor-not-allowed opacity-70' : 'hover:bg-[var(--primary-hover)]'}
            `}
          >
            {isSubmitting ? 'Saving...' : 'Continue'}
          </button>
        </div>
      )}
    </div>
  );
}
