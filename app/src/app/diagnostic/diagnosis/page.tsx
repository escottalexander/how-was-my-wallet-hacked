'use client';

import { useState, useEffect, useRef, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/components/SessionProvider';
import { DiagnosisScreen } from '@/components/DiagnosisScreen';
import type { DiagnosisType } from '@/lib/probability';

interface DiagnosisState {
  pathAttemptId: string;
  diagnosisType: DiagnosisType;
  context: { howFound?: string; whatDoing?: string } | null;
}

// Use useSyncExternalStore to read from sessionStorage without triggering the lint rule
function useSessionStorageState(): DiagnosisState | null {
  const subscribe = (callback: () => void) => {
    // sessionStorage doesn't have events, but we only need the initial value
    return () => {
      callback();
    };
  };

  const getSnapshot = (): DiagnosisState | null => {
    if (typeof window === 'undefined') return null;

    const storedPathAttemptId = sessionStorage.getItem('howwasihacked_path_attempt_id');
    const storedDiagnosisType = sessionStorage.getItem('howwasihacked_diagnosis_type');
    const storedContext = sessionStorage.getItem('howwasihacked_diagnosis_context');

    if (!storedPathAttemptId || !storedDiagnosisType) return null;

    let parsedContext = null;
    if (storedContext) {
      try {
        parsedContext = JSON.parse(storedContext);
      } catch {
        // Ignore parse errors
      }
    }

    return {
      pathAttemptId: storedPathAttemptId,
      diagnosisType: storedDiagnosisType as DiagnosisType,
      context: parsedContext,
    };
  };

  const getServerSnapshot = (): DiagnosisState | null => null;

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export default function DiagnosisPage() {
  const router = useRouter();
  const { sessionId, isLoading, error } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [diagnosisId, setDiagnosisId] = useState<string | null>(null);

  const diagnosisState = useSessionStorageState();

  // Track whether we've created the diagnosis to prevent duplicates
  const diagnosisCreatedRef = useRef(false);

  // Create the diagnosis record when we have the state
  useEffect(() => {
    if (!diagnosisState || diagnosisCreatedRef.current) return;

    diagnosisCreatedRef.current = true;

    const createDiagnosisRecord = async () => {
      try {
        const response = await fetch('/api/diagnosis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pathAttemptId: diagnosisState.pathAttemptId,
            diagnosisType: diagnosisState.diagnosisType,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setDiagnosisId(data.diagnosis.id);
        }
      } catch (err) {
        console.error('Error creating diagnosis record:', err);
      }
    };

    createDiagnosisRecord();
  }, [diagnosisState]);

  const handleAccept = async () => {
    if (!diagnosisId) return;

    setIsSubmitting(true);
    try {
      await fetch('/api/diagnosis', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          diagnosisId,
          accepted: true,
        }),
      });

      // Clear the stored diagnosis data
      sessionStorage.removeItem('howwasihacked_diagnosis_type');
      sessionStorage.removeItem('howwasihacked_diagnosis_context');

      // Redirect to thank you or learn page
      router.push('/learn');
    } catch (err) {
      console.error('Error accepting diagnosis:', err);
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!diagnosisId || !sessionId || !diagnosisState) return;

    setIsSubmitting(true);
    try {
      // Get the current path attempt ID before clearing
      const currentPathAttemptId = diagnosisState.pathAttemptId;
      const rejectedDiagnosisType = diagnosisState.diagnosisType;

      // Mark this diagnosis as rejected
      await fetch('/api/diagnosis', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          diagnosisId,
          accepted: false,
        }),
      });

      // Get probability guidance including fork point and suggested path
      const probResponse = await fetch(
        `/api/probability?sessionId=${sessionId}&pathAttemptId=${currentPathAttemptId}&rejectedDiagnosis=${rejectedDiagnosisType}`
      );

      if (!probResponse.ok) {
        throw new Error('Failed to get probability guidance');
      }

      const probData = await probResponse.json();
      const { suggestedPath, forkPoint, rejectedDiagnoses } = probData;

      // Clear the stored diagnosis data
      sessionStorage.removeItem('howwasihacked_diagnosis_type');
      sessionStorage.removeItem('howwasihacked_diagnosis_context');
      sessionStorage.removeItem('howwasihacked_path_attempt_id');

      // Store rejected diagnoses for the retry flow
      sessionStorage.setItem('howwasihacked_rejected_diagnoses', JSON.stringify(rejectedDiagnoses));

      // Create a new path attempt
      const response = await fetch('/api/path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        sessionStorage.setItem('howwasihacked_path_attempt_id', data.pathAttempt.id);

        // Store the fork point and retry info for the path pages
        sessionStorage.setItem('howwasihacked_fork_point', forkPoint || 'timing');
        sessionStorage.setItem('howwasihacked_is_retry', 'true');
        sessionStorage.setItem('howwasihacked_attempt_number', String(data.pathAttempt.attempt_number));

        // Route to the appropriate path based on fork point
        if (forkPoint === 'timing') {
          // Need to restart from beginning - use timing question
          router.push('/diagnostic/timing');
        } else if (suggestedPath === 'path-b') {
          // Route to Path B (malicious transaction)
          router.push('/diagnostic/path-b');
        } else {
          // Route to Path A with the fork point
          router.push('/diagnostic/path-a');
        }
      }
    } catch (err) {
      console.error('Error rejecting diagnosis:', err);
      setIsSubmitting(false);
    }
  };

  const handleLearnClick = async () => {
    if (!diagnosisId) return;

    try {
      await fetch('/api/diagnosis', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          diagnosisId,
          clickedLearn: true,
        }),
      });
    } catch (err) {
      console.error('Error tracking learn click:', err);
    }
  };

  const handleHwrClick = async () => {
    if (!diagnosisId) return;

    try {
      await fetch('/api/diagnosis', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          diagnosisId,
          clickedHwr: true,
        }),
      });
    } catch (err) {
      console.error('Error tracking HWR click:', err);
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

  if (!diagnosisState) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <p className="text-[var(--text-muted)]">Loading your diagnosis...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <DiagnosisScreen
        diagnosisType={diagnosisState.diagnosisType}
        context={diagnosisState.context || undefined}
        onReject={handleReject}
        onAccept={handleAccept}
        onLearnClick={handleLearnClick}
        onHwrClick={handleHwrClick}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
