'use client';

import Link from 'next/link';
import type { DiagnosisType } from '@/lib/probability';
import { DIAGNOSES, MALICIOUS_TX_CONTEXT } from '@/content/diagnoses';

interface DiagnosisScreenProps {
  diagnosisType: DiagnosisType;
  context?: {
    howFound?: string;
    whatDoing?: string;
  };
  onReject: () => void;
  onAccept: () => void;
  onLearnClick: () => void;
  onHwrClick: () => void;
  isSubmitting?: boolean;
}

export function DiagnosisScreen({
  diagnosisType,
  context,
  onReject,
  onAccept,
  onLearnClick,
  onHwrClick,
  isSubmitting,
}: DiagnosisScreenProps) {
  const content = DIAGNOSES[diagnosisType];

  if (!content) {
    // Fallback to unknown if diagnosis type not found
    return (
      <DiagnosisScreen
        diagnosisType="unknown"
        onReject={onReject}
        onAccept={onAccept}
        onLearnClick={onLearnClick}
        onHwrClick={onHwrClick}
        isSubmitting={isSubmitting}
      />
    );
  }

  // Get context-specific copy for malicious transaction
  const contextCopy =
    diagnosisType === 'malicious_transaction' && context?.howFound
      ? MALICIOUS_TX_CONTEXT[context.howFound]
      : null;

  return (
    <div className="space-y-8">
      {/* Main diagnosis title */}
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-[var(--foreground)]">{content.title}</h1>
      </div>

      {/* Explanation copy */}
      <div className="space-y-4 text-[var(--text-muted)]">
        {content.mainCopy.map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}

        {/* Add context-specific copy for malicious transactions */}
        {contextCopy && <p className="mt-4">{contextCopy}</p>}
      </div>

      {/* Empathy message if present */}
      {content.empathy && (
        <p className="text-[var(--foreground)] font-medium">{content.empathy}</p>
      )}

      {/* Action items */}
      <div className="rounded-xl bg-[var(--card-bg)] border border-[var(--border)] p-6">
        <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">
          Protect yourself going forward:
        </h2>
        <ul className="space-y-3">
          {content.actionItems.map((item, i) => (
            <li key={i} className="flex gap-3 text-[var(--text-muted)]">
              <span className="text-[var(--primary)] flex-shrink-0">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>

        {/* External links if present */}
        {content.externalLinks && content.externalLinks.length > 0 && (
          <div className="mt-4 pt-4 border-t border-[var(--border)]">
            {content.externalLinks.map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={link.url.includes('haveibeenpwned') ? undefined : onHwrClick}
                className="text-[var(--primary)] hover:underline block"
              >
                {link.label} →
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Deep-dive link to the matching /how explainer page */}
      {content.page && (
        <Link
          href={`/how/${content.page.slug}`}
          className="block text-center text-[var(--primary)] hover:underline"
        >
          Read more about this attack →
        </Link>
      )}

      {/* Primary action buttons */}
      <div className="flex flex-col gap-3">
        <Link
          href="/learn"
          onClick={onLearnClick}
          className="w-full rounded-xl bg-[var(--primary)] px-6 py-4 text-lg font-medium text-white text-center transition-colors duration-200 hover:bg-[var(--primary-hover)]"
        >
          Learn Best Practices
        </Link>
        <a
          href="https://hackedwalletrecovery.com"
          target="_blank"
          rel="noopener noreferrer"
          onClick={onHwrClick}
          className="w-full rounded-xl border-2 border-[var(--primary)] px-6 py-4 text-lg font-medium text-[var(--primary)] text-center transition-colors duration-200 hover:bg-[var(--primary)]/10"
        >
          HackedWalletRecovery.com
        </a>
      </div>

      {/* Accept/Reject buttons */}
      <div className="pt-4 border-t border-[var(--border)]">
        <p className="text-sm text-[var(--text-muted)] text-center mb-4">
          Does this sound like what happened?
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onAccept}
            disabled={isSubmitting}
            className={`flex-1 rounded-xl border-2 border-[var(--border)] px-4 py-3 text-[var(--foreground)] transition-colors duration-200 hover:border-[var(--primary)] ${
              isSubmitting ? 'cursor-not-allowed opacity-50' : ''
            }`}
          >
            {isSubmitting ? 'Saving...' : 'Yes, this makes sense'}
          </button>
          <button
            type="button"
            onClick={onReject}
            disabled={isSubmitting}
            className={`flex-1 rounded-xl border-2 border-[var(--border)] px-4 py-3 text-[var(--text-muted)] transition-colors duration-200 hover:border-[var(--primary)] ${
              isSubmitting ? 'cursor-not-allowed opacity-50' : ''
            }`}
          >
            This doesn&apos;t seem right
          </button>
        </div>
      </div>
    </div>
  );
}
