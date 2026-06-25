'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/components/SessionProvider';
import { DiagnosisScreen } from '@/components/DiagnosisScreen';
import type { DiagnosisType } from '@/lib/probability';
import {
  createInitialProbabilities,
  applyAnswerAdjustment,
  rejectDiagnosis,
  getMostLikelyDiagnosis,
} from '@/lib/probability';
import type { AnswerMap } from '@/lib/questions';
import type { WalletType } from '@/lib/types';

interface StoredDiagnosisState {
  pathAttemptId: string;
  diagnosisType: DiagnosisType;
  context: { howFound?: string; whatDoing?: string } | null;
  answers: AnswerMap;
}

function useStoredDiagnosisState(): StoredDiagnosisState | null {
  const cacheRef = useRef<{ raw: string; value: StoredDiagnosisState | null } | null>(null);

  const subscribe = useCallback((onStoreChange: () => void) => {
    void onStoreChange;
    return () => {};
  }, []);

  const getSnapshot = useCallback((): StoredDiagnosisState | null => {
    if (typeof window === 'undefined') return null;

    const pathAttemptId = sessionStorage.getItem('howwasihacked_path_attempt_id');
    const diagnosisType = sessionStorage.getItem('howwasihacked_diagnosis_type');
    const context = sessionStorage.getItem('howwasihacked_diagnosis_context');
    const answersRaw = sessionStorage.getItem('howwasihacked_answers');

    const raw = `${pathAttemptId ?? ''}::${diagnosisType ?? ''}::${context ?? ''}::${answersRaw ?? ''}`;
    if (cacheRef.current?.raw === raw) return cacheRef.current.value;

    if (!pathAttemptId || !diagnosisType) {
      cacheRef.current = { raw, value: null };
      return null;
    }

    let parsedContext: StoredDiagnosisState['context'] = null;
    if (context) {
      try { parsedContext = JSON.parse(context); } catch { /* ignore */ }
    }

    let parsedAnswers: AnswerMap = {};
    if (answersRaw) {
      try { parsedAnswers = JSON.parse(answersRaw); } catch { /* ignore */ }
    }

    const value: StoredDiagnosisState = {
      pathAttemptId,
      diagnosisType: diagnosisType as DiagnosisType,
      context: parsedContext,
      answers: parsedAnswers,
    };

    cacheRef.current = { raw, value };
    return value;
  }, []);

  const getServerSnapshot = (): StoredDiagnosisState | null => null;
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export default function DiagnosisPage() {
  const router = useRouter();
  const { isLoading, error } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [diagnosisId, setDiagnosisId] = useState<string | null>(null);
  // Track rejected diagnoses for client-side re-scoring
  const [rejectedDiagnoses, setRejectedDiagnoses] = useState<DiagnosisType[]>([]);
  // Current displayed diagnosis (may change after rejection)
  const [currentDiagnosis, setCurrentDiagnosis] = useState<DiagnosisType | null>(null);
  const [currentContext, setCurrentContext] = useState<{ howFound?: string; whatDoing?: string } | null>(null);

  const diagnosisCreatedRef = useRef(false);
  const storedState = useStoredDiagnosisState();

  // Initialize from stored state
  useEffect(() => {
    if (!storedState || diagnosisCreatedRef.current) return;
    setCurrentDiagnosis(storedState.diagnosisType);
    setCurrentContext(storedState.context);
  }, [storedState]);

  // Create the initial diagnosis record
  useEffect(() => {
    if (!currentDiagnosis || !storedState || diagnosisCreatedRef.current) return;
    diagnosisCreatedRef.current = true;

    fetch('/api/diagnosis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pathAttemptId: storedState.pathAttemptId,
        diagnosisType: currentDiagnosis,
      }),
    })
      .then((r) => r.json() as Promise<{ diagnosis: { id: string } }>)
      .then((data) => setDiagnosisId(data.diagnosis.id))
      .catch((err) => console.error('Error creating diagnosis record:', err));
  }, [currentDiagnosis, storedState]);

  const handleAccept = async () => {
    if (!diagnosisId) return;
    setIsSubmitting(true);
    try {
      await fetch('/api/diagnosis', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ diagnosisId, accepted: true }),
      });
      // Clear session state
      ['howwasihacked_path_attempt_id', 'howwasihacked_diagnosis_type',
       'howwasihacked_diagnosis_context', 'howwasihacked_answers'].forEach((k) =>
        sessionStorage.removeItem(k)
      );
      router.push('/learn');
    } catch (err) {
      console.error('Error accepting diagnosis:', err);
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!diagnosisId || !storedState || !currentDiagnosis) return;
    setIsSubmitting(true);

    try {
      // Mark current diagnosis rejected
      await fetch('/api/diagnosis', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ diagnosisId, accepted: false }),
      });

      const newRejected = [...rejectedDiagnoses, currentDiagnosis];
      setRejectedDiagnoses(newRejected);

      // Re-score client-side with all rejected diagnoses penalized
      const walletType = storedState.answers.wallet_type as WalletType | undefined;
      let probState = createInitialProbabilities(walletType ?? null);

      for (const [questionId, answer] of Object.entries(storedState.answers)) {
        const answerStr = Array.isArray(answer) ? JSON.stringify(answer) : answer;
        probState = applyAnswerAdjustment(probState, questionId, answerStr);
      }
      for (const rejected of newRejected) {
        probState = rejectDiagnosis(probState, rejected);
      }

      const nextDiagnosis = getMostLikelyDiagnosis(probState);
      setCurrentDiagnosis(nextDiagnosis);

      const nextContext =
        storedState.answers.timing === 'active'
          ? {
              howFound: typeof storedState.answers.how_found_site === 'string' ? storedState.answers.how_found_site : undefined,
              whatDoing: typeof storedState.answers.what_trying_to_do === 'string' ? storedState.answers.what_trying_to_do : undefined,
            }
          : null;
      setCurrentContext(nextContext);

      // Create a new diagnosis record for the next suggestion
      diagnosisCreatedRef.current = false;
      setDiagnosisId(null);
    } catch (err) {
      console.error('Error rejecting diagnosis:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Re-create diagnosis record when currentDiagnosis changes after rejection
  useEffect(() => {
    if (!currentDiagnosis || !storedState || diagnosisCreatedRef.current) return;
    diagnosisCreatedRef.current = true;

    fetch('/api/diagnosis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pathAttemptId: storedState.pathAttemptId,
        diagnosisType: currentDiagnosis,
      }),
    })
      .then((r) => r.json() as Promise<{ diagnosis: { id: string } }>)
      .then((data) => setDiagnosisId(data.diagnosis.id))
      .catch((err) => console.error('Error creating diagnosis record:', err));
  }, [currentDiagnosis, storedState]);

  const handleLearnClick = async () => {
    if (!diagnosisId) return;
    await fetch('/api/diagnosis', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ diagnosisId, clickedLearn: true }),
    }).catch(() => {});
  };

  const handleHwrClick = async () => {
    if (!diagnosisId) return;
    await fetch('/api/diagnosis', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ diagnosisId, clickedHwr: true }),
    }).catch(() => {});
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

  if (!currentDiagnosis) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <p className="text-[var(--text-muted)]">Loading your diagnosis...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <DiagnosisScreen
        diagnosisType={currentDiagnosis}
        context={currentContext ?? undefined}
        onReject={handleReject}
        onAccept={handleAccept}
        onLearnClick={handleLearnClick}
        onHwrClick={handleHwrClick}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
