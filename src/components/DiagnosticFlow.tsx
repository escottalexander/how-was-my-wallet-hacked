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

const STORAGE_KEY = 'howwasihacked';

/**
 * The diagnostic flow ("how was I hacked"): reconstructs a past incident with
 * the probability engine. The prevention flow is a separate component
 * (PreventionFlow) because it is structurally different (per-wallet, two-phase).
 */
export function DiagnosticFlow() {
  const router = useRouter();
  const { sessionId, isLoading } = useSession();
  const [pathAttemptId, setPathAttemptId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createdAttemptRef = useRef(false);

  useEffect(() => {
    if (!sessionId || createdAttemptRef.current) return;
    createdAttemptRef.current = true;
    fetch('/api/path', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, mode: 'diagnostic' }),
    })
      .then((r) => r.json() as Promise<{ pathAttempt: { id: string } }>)
      .then((data) => {
        setPathAttemptId(data.pathAttempt.id);
        sessionStorage.setItem(`${STORAGE_KEY}_path_attempt_id`, data.pathAttempt.id);
      })
      .catch((err) => console.error('Error creating path attempt:', err));
  }, [sessionId]);

  const handleAnswer = async (questionId: string, answer: string | string[]) => {
    if (!pathAttemptId) return;
    const answerSelected = Array.isArray(answer) ? JSON.stringify(answer) : answer;

    if (questionId === 'wallet_type' && sessionId) {
      await fetch('/api/session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, walletType: answer as WalletType, walletSpecific: null }),
      }).catch(() => {});
    }
    if (questionId === 'wallet_generated' && sessionId) {
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

  const handleComplete = async (answers: AnswerMap) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const walletType = answers.wallet_type as WalletType | undefined;
    let probState = createInitialProbabilities(walletType ?? null);
    for (const [questionId, answer] of Object.entries(answers)) {
      const answerStr = Array.isArray(answer) ? JSON.stringify(answer) : answer;
      probState = applyAnswerAdjustment(probState, questionId, answerStr);
    }
    const diagnosisType = getMostLikelyDiagnosis(probState);

    const context =
      answers.timing === 'active'
        ? {
            howFound: typeof answers.how_found_site === 'string' ? answers.how_found_site : undefined,
            whatDoing: typeof answers.what_trying_to_do === 'string' ? answers.what_trying_to_do : undefined,
          }
        : null;

    sessionStorage.setItem(`${STORAGE_KEY}_diagnosis_type`, diagnosisType);
    sessionStorage.setItem(`${STORAGE_KEY}_answers`, JSON.stringify(answers));
    if (context) {
      sessionStorage.setItem(`${STORAGE_KEY}_diagnosis_context`, JSON.stringify(context));
    } else {
      sessionStorage.removeItem(`${STORAGE_KEY}_diagnosis_context`);
    }

    // Analytics only — skip if we never got a path attempt (e.g. DB offline).
    if (pathAttemptId) {
      await fetch('/api/path', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pathAttemptId, complete: true }),
      }).catch(() => {});
    }

    router.push('/diagnostic/diagnosis');
  };

  // Only wait for the session provider to settle; the flow itself works even if
  // session/path tracking failed (analytics is best-effort, the diagnosis is
  // computed client-side). `error` is intentionally not treated as fatal.
  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <div className="text-[var(--text-muted)]">Loading...</div>
      </div>
    );
  }

  return <QuestionPipeline onAnswer={handleAnswer} onComplete={handleComplete} />;
}
