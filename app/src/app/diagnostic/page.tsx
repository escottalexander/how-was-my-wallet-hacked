'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/components/SessionProvider';
import { WalletSelection } from '@/components/WalletSelection';
import type { WalletType } from '@/lib/types';

export default function DiagnosticPage() {
  const router = useRouter();
  const { sessionId, isLoading, error } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleWalletSelect = async (walletType: WalletType, walletSpecific: string) => {
    if (!sessionId) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          walletType,
          walletSpecific,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update session');
      }

      // Navigate to value range question (next step in diagnostic)
      router.push('/diagnostic/value');
    } catch (err) {
      console.error('Error saving wallet selection:', err);
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
      <WalletSelection onSelect={handleWalletSelect} isSubmitting={isSubmitting} />
    </div>
  );
}
