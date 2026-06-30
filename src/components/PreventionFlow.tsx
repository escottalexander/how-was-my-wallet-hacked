'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/components/SessionProvider';
import { QuestionPipeline } from '@/components/QuestionPipeline';
import { WalletBuilder } from '@/components/WalletBuilder';
import { ProgressBar } from '@/components/ProgressBar';
import { buildPreventionQuestions, PORTFOLIO_QUESTION } from '@/content/prevention-questions';
import { parseWallets } from '@/lib/wallet-portfolio';
import { assessRisk } from '@/lib/risk';
import type { AnswerMap } from '@/lib/questions';

const STORAGE_KEY = 'hwih_prevention';

/**
 * The "am I at risk" flow. Two phases: first the user builds their wallet
 * portfolio, then we generate a per-wallet, type-tailored question set from it
 * and run it through the shared pipeline. The portfolio drives both which
 * questions appear and how the risk is scored.
 */
export function PreventionFlow() {
  const router = useRouter();
  const { sessionId, isLoading, error } = useSession();
  const [pathAttemptId, setPathAttemptId] = useState<string | null>(null);
  const [portfolio, setPortfolio] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createdRef = useRef(false);

  useEffect(() => {
    if (!sessionId || createdRef.current) return;
    createdRef.current = true;
    fetch('/api/path', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, mode: 'prevention' }),
    })
      .then((r) => r.json() as Promise<{ pathAttempt: { id: string } }>)
      .then((data) => {
        setPathAttemptId(data.pathAttempt.id);
        sessionStorage.setItem(`${STORAGE_KEY}_path_attempt_id`, data.pathAttempt.id);
      })
      .catch((err) => console.error('Error creating path attempt:', err));
  }, [sessionId]);

  const recordAnswer = (questionId: string, answer: string | string[]) => {
    if (!pathAttemptId) return;
    const answerSelected = Array.isArray(answer) ? JSON.stringify(answer) : answer;
    fetch('/api/path', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pathAttemptId, questionId, answerSelected }),
    }).catch(() => {});
  };

  const questions = useMemo(
    () => (portfolio ? buildPreventionQuestions(parseWallets(portfolio)) : []),
    [portfolio],
  );

  const handlePortfolioContinue = (val: string) => {
    recordAnswer('wallet_portfolio', val);
    setPortfolio(val);
  };

  const handleComplete = async (answers: AnswerMap) => {
    if (!pathAttemptId || isSubmitting) return;
    setIsSubmitting(true);
    const top = assessRisk(answers).topVector;
    sessionStorage.setItem(`${STORAGE_KEY}_diagnosis_type`, top);
    sessionStorage.setItem(`${STORAGE_KEY}_answers`, JSON.stringify(answers));
    await fetch('/api/path', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pathAttemptId, complete: true }),
    }).catch(() => {});
    router.push('/how-hackable-are-you/result');
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

  // Phase one: build the portfolio.
  if (portfolio === null) {
    return (
      <div>
        <ProgressBar progress={0} />
        <div className="mx-auto max-w-2xl space-y-8 px-4 py-8">
          <WalletBuilder question={PORTFOLIO_QUESTION} value="" onContinue={handlePortfolioContinue} />
        </div>
      </div>
    );
  }

  // Phase two: the generated, per-wallet question path.
  return (
    <QuestionPipeline
      questions={questions}
      initialAnswers={{ wallet_portfolio: portfolio }}
      onAnswer={recordAnswer}
      onComplete={handleComplete}
    />
  );
}
