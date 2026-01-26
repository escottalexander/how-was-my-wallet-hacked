'use client';

import { useState } from 'react';

export type TimingAnswer = 'active' | 'noticed_later' | 'not_sure';

interface TimingOption {
  id: TimingAnswer;
  label: string;
  description: string;
}

const TIMING_OPTIONS: TimingOption[] = [
  {
    id: 'active',
    label: 'I was using my wallet at the time',
    description: 'You were interacting with a website, app, or making a transaction when the funds disappeared',
  },
  {
    id: 'noticed_later',
    label: "I noticed it later / wasn't using it",
    description: 'You discovered the loss when checking your wallet balance later',
  },
  {
    id: 'not_sure',
    label: "I'm not sure",
    description: "You don't remember or aren't certain about the timing",
  },
];

interface TimingSelectionProps {
  onSelect: (timing: TimingAnswer) => void;
  isSubmitting?: boolean;
}

export function TimingSelection({ onSelect, isSubmitting }: TimingSelectionProps) {
  const [selectedTiming, setSelectedTiming] = useState<TimingAnswer | null>(null);

  const handleTimingSelect = (timing: TimingAnswer) => {
    setSelectedTiming(timing);
  };

  const handleContinue = () => {
    if (selectedTiming) {
      onSelect(selectedTiming);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-[var(--foreground)]">
          Were you actively using your wallet when the funds disappeared, or did you notice it later?
        </h1>
        <p className="mt-2 text-[var(--text-muted)]">
          This helps us understand what type of attack may have occurred.
        </p>
      </div>

      {/* Timing Options */}
      <div className="grid grid-cols-1 gap-4">
        {TIMING_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => handleTimingSelect(option.id)}
            disabled={isSubmitting}
            className={`
              min-h-[72px] rounded-xl border-2 px-5 py-4 text-left
              transition-all duration-200
              ${
                selectedTiming === option.id
                  ? 'border-[var(--primary)] bg-[var(--primary)]/10'
                  : 'border-[var(--border)] bg-[var(--card-bg)] hover:border-[var(--primary)]/50'
              }
              ${isSubmitting ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
            `}
          >
            <span className="block font-medium text-[var(--foreground)]">
              {option.label}
            </span>
            <span className="mt-1 block text-sm text-[var(--text-muted)]">
              {option.description}
            </span>
          </button>
        ))}
      </div>

      {/* Continue Button */}
      {selectedTiming && (
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
