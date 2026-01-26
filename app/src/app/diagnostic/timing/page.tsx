'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/components/SessionProvider';
import { TimingSelection, type TimingAnswer } from '@/components/TimingSelection';

export default function TimingPage() {
  const router = useRouter();
  const { sessionId, isLoading, error } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTimingSelect = async (timing: TimingAnswer) => {
    if (!sessionId) return;

    setIsSubmitting(true);
    try {
      // Create a new path attempt with the first step (timing question)
      const response = await fetch('/api/path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          questionId: 'timing',
          answerSelected: timing,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create path attempt');
      }

      const { pathAttempt } = await response.json();

      // Store the path attempt ID in sessionStorage for the diagnostic flow
      sessionStorage.setItem('howwasihacked_path_attempt_id', pathAttempt.id);

      // Navigate based on timing answer:
      // - 'active' leads to malicious transaction path (Path B)
      // - 'noticed_later' and 'not_sure' lead to seed phrase compromise path (Path A)
      if (timing === 'active') {
        router.push('/diagnostic/path-b');
      } else {
        router.push('/diagnostic/path-a');
      }
    } catch (err) {
      console.error('Error saving timing selection:', err);
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
      <TimingSelection onSelect={handleTimingSelect} isSubmitting={isSubmitting} />
    </div>
  );
}
