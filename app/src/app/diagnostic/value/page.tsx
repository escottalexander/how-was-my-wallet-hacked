'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/components/SessionProvider';
import { ValueRangeSelection } from '@/components/ValueRangeSelection';
import type { ValueRange } from '@/lib/types';

export default function ValueRangePage() {
  const router = useRouter();
  const { sessionId, isLoading, error } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleValueSelect = async (valueRange: ValueRange) => {
    if (!sessionId) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          valueRange,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update session');
      }

      // Navigate to branching question (next step in diagnostic)
      router.push('/diagnostic/timing');
    } catch (err) {
      console.error('Error saving value range:', err);
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <div className="text-[var(--text-muted)]">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <p className="text-red-500">Something went wrong. Please refresh the page.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <ValueRangeSelection onSelect={handleValueSelect} isSubmitting={isSubmitting} />
    </div>
  );
}
