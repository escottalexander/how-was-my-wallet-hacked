'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/components/SessionProvider';
import { QuestionPipeline } from '@/components/QuestionPipeline';
import type { AnswerMap } from '@/lib/questions';
import {
  createInitialProbabilities,
  applyAnswerAdjustment,
  getMostLikelyDiagnosis,
} from '@/lib/probability';
import type { WalletType } from '@/lib/types';

export default function DiagnosticPage() {
  const router = useRouter();
  const { sessionId, isLoading, error } = useSession();
  const [pathAttemptId, setPathAttemptId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createdAttemptRef = useRef(false);

  // Create a path attempt once we have a session
  useEffect(() => {
    if (!sessionId || createdAttemptRef.current) return;
    createdAttemptRef.current = true;

    fetch('/api/path', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    })
      .then((r) => r.json())
      .then((data) => {
        const { pathAttempt } = data as { pathAttempt: { id: string } };
        setPathAttemptId(pathAttempt.id);
        sessionStorage.setItem('howwasihacked_path_attempt_id', pathAttempt.id);
      })
      .catch((err) => console.error('Error creating path attempt:', err));
  }, [sessionId]);

  // Called for each question answer — record it progressively
  const handleAnswer = async (questionId: string, answer: string | string[]) => {
    if (!pathAttemptId) return;
    const answerSelected = Array.isArray(answer) ? JSON.stringify(answer) : answer;

    // Update session-level fields for wallet_type, wallet_generated, and value_range
    if (questionId === 'wallet_type' && sessionId) {
      await fetch('/api/session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, walletType: answer as WalletType, walletSpecific: null }),
      }).catch(() => {});
    }
    if (questionId === 'wallet_generated' && sessionId) {
      // Record the specific wallet app used to generate the key into session.wallet_specific
      await fetch('/api/session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, walletSpecific: Array.isArray(answer) ? answer[0] : answer }),
      }).catch(() => {});
    }
    if (questionId === 'value_range' && sessionId) {
      await fetch('/api/session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, valueRange: answer }),
      }).catch(() => {});
    }

    await fetch('/api/path', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pathAttemptId, questionId, answerSelected }),
    }).catch(() => {});
  };

  // Called when all questions are answered
  const handleComplete = async (answers: AnswerMap) => {
    if (!pathAttemptId || isSubmitting) return;
    setIsSubmitting(true);

    // Compute diagnosis using probability engine
    const walletType = answers.wallet_type as WalletType | undefined;
    let probState = createInitialProbabilities(walletType ?? null);

    for (const [questionId, answer] of Object.entries(answers)) {
      const answerStr = Array.isArray(answer) ? JSON.stringify(answer) : answer;
      probState = applyAnswerAdjustment(probState, questionId, answerStr);
    }

    const diagnosisType = getMostLikelyDiagnosis(probState);

    // Context for malicious_transaction diagnosis display
    const context =
      answers.timing === 'active'
        ? {
            howFound: typeof answers.how_found_site === 'string' ? answers.how_found_site : undefined,
            whatDoing: typeof answers.what_trying_to_do === 'string' ? answers.what_trying_to_do : undefined,
          }
        : null;

    // Store answers and diagnosis for the diagnosis page
    sessionStorage.setItem('howwasihacked_diagnosis_type', diagnosisType);
    sessionStorage.setItem('howwasihacked_answers', JSON.stringify(answers));
    if (context) {
      sessionStorage.setItem('howwasihacked_diagnosis_context', JSON.stringify(context));
    } else {
      sessionStorage.removeItem('howwasihacked_diagnosis_context');
    }

    // Mark path attempt as completed
    await fetch('/api/path', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pathAttemptId, complete: true }),
    }).catch(() => {});

    router.push('/diagnostic/diagnosis');
  };

  if (isLoading || (!pathAttemptId && !error)) {
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
    <QuestionPipeline
      onAnswer={handleAnswer}
      onComplete={handleComplete}
    />
  );
}
