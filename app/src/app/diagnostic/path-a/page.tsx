'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/components/SessionProvider';
import { PathAQuestions, type PathAStepResult } from '@/components/PathAQuestions';

export default function PathAPage() {
  const router = useRouter();
  const { sessionId, isLoading, error } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pathAttemptId, setPathAttemptId] = useState<string | null>(null);
  const [walletType, setWalletType] = useState<string | null>(null);

  // Get the path attempt ID from sessionStorage
  useEffect(() => {
    const storedPathAttemptId = sessionStorage.getItem('howwasihacked_path_attempt_id');
    if (storedPathAttemptId) {
      setPathAttemptId(storedPathAttemptId);
    }

    // Fetch session to get wallet type
    if (sessionId) {
      fetch(`/api/session?id=${sessionId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.session?.wallet_type) {
            setWalletType(data.session.wallet_type);
          }
        })
        .catch(console.error);
    }
  }, [sessionId]);

  const handleStepComplete = async (result: PathAStepResult) => {
    if (!pathAttemptId) return;

    setIsSubmitting(true);
    try {
      // Record the step to the database
      const response = await fetch('/api/path', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pathAttemptId,
          questionId: result.questionId,
          answerSelected: result.answer,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save step');
      }

      // If this step leads to a diagnosis, navigate there
      if (result.nextStep === 'diagnosis' && result.diagnosisType) {
        // Store the diagnosis type in sessionStorage for the diagnosis page
        sessionStorage.setItem('howwasihacked_diagnosis_type', result.diagnosisType);
        router.push('/diagnostic/diagnosis');
      } else {
        // Continue to next question (component handles this internally)
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error('Error saving step:', err);
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

  if (!pathAttemptId) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <p className="text-[var(--text-muted)]">Loading your diagnostic session...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <PathAQuestions
        onStepComplete={handleStepComplete}
        isSubmitting={isSubmitting}
        walletType={walletType}
      />
    </div>
  );
}
