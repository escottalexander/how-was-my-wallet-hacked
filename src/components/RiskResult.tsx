'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { AnswerMap } from '@/lib/questions';
import { assessRisk, type RiskAssessment, type SecurityBand } from '@/lib/risk';
import { AMOUNT_OPTIONS } from '@/lib/wallet-portfolio';
import { DIAGNOSES } from '@/content/diagnoses';
import { LEARN_TOPICS } from '@/content/learn-topics';
import { SITE_URL } from '@/lib/site';

const STORAGE_KEY = 'hwih_prevention';

const BAND: Record<SecurityBand, { label: string; color: string; bar: string }> = {
  strong: { label: 'Strong', color: 'text-green-600', bar: 'bg-green-500' },
  good: { label: 'Good', color: 'text-emerald-600', bar: 'bg-emerald-500' },
  fair: { label: 'Fair', color: 'text-amber-600', bar: 'bg-amber-500' },
  weak: { label: 'Weak', color: 'text-red-600', bar: 'bg-red-500' },
};

const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);
const amountLabel = (id: string): string => AMOUNT_OPTIONS.find((o) => o.id === id)?.label ?? '';
const issueText = (reason: string): string => {
  const idx = reason.indexOf(': ');
  return idx === -1 ? reason : reason.slice(idx + 2);
};

interface StoredRisk {
  pathAttemptId: string;
  assessment: RiskAssessment;
}

function readRisk(): StoredRisk | null {
  if (typeof window === 'undefined') return null;
  const pathAttemptId = sessionStorage.getItem(`${STORAGE_KEY}_path_attempt_id`);
  const answersRaw = sessionStorage.getItem(`${STORAGE_KEY}_answers`);
  if (!pathAttemptId || !answersRaw) return null;
  let answers: AnswerMap = {};
  try { answers = JSON.parse(answersRaw); } catch { return null; }
  return { pathAttemptId, assessment: assessRisk(answers) };
}

function ScoreBar({ score, band }: { score: number; band: SecurityBand }) {
  return (
    <div className="h-2 overflow-hidden rounded bg-[var(--background)]">
      <div className={`h-full rounded ${BAND[band].bar} transition-[width] duration-500`} style={{ width: `${score}%` }} />
    </div>
  );
}

export function RiskResult() {
  const [data, setData] = useState<StoredRisk | null>(null);
  const [ready, setReady] = useState(false);
  const [diagnosisId, setDiagnosisId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const recordedRef = useRef(false);

  // Read client-only sessionStorage after mount to stay hydration-safe; the
  // `ready` flag drives the loading state until then. This is a legitimate
  // external-store read, so the set-state-in-effect rule is a false positive.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setData(readRisk());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!data || recordedRef.current) return;
    recordedRef.current = true;
    fetch('/api/diagnosis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pathAttemptId: data.pathAttemptId, diagnosisType: data.assessment.topVector }),
    })
      .then((r) => r.json() as Promise<{ diagnosis: { id: string } }>)
      .then((d) => setDiagnosisId(d.diagnosis.id))
      .catch((err) => console.error('Error recording risk result:', err));
  }, [data]);

  const trackClick = (field: 'clickedLearn' | 'clickedHwr') => {
    if (!diagnosisId) return;
    fetch('/api/diagnosis', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ diagnosisId, [field]: true }),
    }).catch(() => {});
  };

  if (!ready) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <div className="text-[var(--text-muted)]">Scoring your wallets...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <p className="text-[var(--text-muted)]">We couldn&apos;t find your answers. Start the check to see your security score.</p>
        <Link
          href="/how-hackable-are-you"
          className="inline-flex h-11 items-center justify-center rounded-full bg-[var(--primary)] px-6 text-white font-medium hover:bg-[var(--primary-hover)] transition-colors"
        >
          Start the security check
        </Link>
      </div>
    );
  }

  const { overallScore, band, wallets, strengths, topVector } = data.assessment;
  const lead = topVector !== 'unknown' ? DIAGNOSES[topVector] : null;
  const hasWeakSpots = wallets.some((w) => w.issues.length > 0);

  // The shared link is the per-score OG route — its preview image carries the
  // score and "can you beat my score?", with no balances or wallet data.
  const shareUrl = `${SITE_URL}/r/${overallScore}`;
  const shareText = `My crypto wallet security score: ${overallScore}/100 🔐 Can you beat it?`;
  const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
  const fcUrl = `https://farcaster.xyz/~/compose?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;
  const tgUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };
  const nativeShare = () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({ title: 'My wallet security score', text: shareText, url: shareUrl }).catch(() => {});
    }
    setShareOpen(false);
  };
  const menuItem = 'block w-full rounded-lg px-3 py-2 text-left text-sm text-[var(--foreground)] transition-colors hover:bg-[var(--primary)]/10';

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Overall security score */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6 text-center">
        <p className="text-sm font-medium uppercase tracking-wide text-[var(--text-muted)]">Your security score</p>
        <p className={`mt-1 text-5xl font-semibold ${BAND[band].color}`}>
          {overallScore}
          <span className="text-2xl text-[var(--text-muted)]">/100</span>
        </p>
        <p className={`text-sm font-medium ${BAND[band].color}`}>{BAND[band].label}</p>
        <div className="mx-auto mt-4 max-w-sm">
          <ScoreBar score={overallScore} band={band} />
        </div>
        <p className="mt-3 text-sm text-[var(--text-muted)]">
          Higher is better, weighted across {wallets.length} wallet{wallets.length === 1 ? '' : 's'} — bigger balances count for more.
        </p>

        {/* Share — small button with a popover of options */}
        <div className="relative mt-5 flex justify-center">
          <button
            type="button"
            onClick={() => setShareOpen((o) => !o)}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:border-[var(--primary)]"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.6" y1="13.5" x2="15.4" y2="17.5" />
              <line x1="15.4" y1="6.5" x2="8.6" y2="10.5" />
            </svg>
            Share my score
          </button>
          {shareOpen && (
            <>
              <button type="button" aria-label="Close" onClick={() => setShareOpen(false)} className="fixed inset-0 z-10 cursor-default" />
              <div className="absolute top-full left-1/2 z-20 mt-2 w-52 -translate-x-1/2 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-1.5 text-left shadow-lg">
                <a href={xUrl} target="_blank" rel="noopener noreferrer" onClick={() => { trackClick('clickedLearn'); setShareOpen(false); }} className={menuItem}>
                  Share on X
                </a>
                <button type="button" onClick={copyLink} className={menuItem}>
                  {copied ? 'Link copied!' : 'Copy link'}
                </button>
                <a href={fcUrl} target="_blank" rel="noopener noreferrer" onClick={() => setShareOpen(false)} className={menuItem}>
                  Farcaster
                </a>
                <a href={tgUrl} target="_blank" rel="noopener noreferrer" onClick={() => setShareOpen(false)} className={menuItem}>
                  Telegram
                </a>
                <button type="button" onClick={nativeShare} className={`${menuItem} sm:hidden`}>
                  More options…
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Per-wallet scores */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">By wallet</h2>
        <div className="space-y-3">
          {wallets.map((wr) => (
            <div key={wr.id} className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-[var(--foreground)]">{cap(wr.label)}</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {amountLabel(wr.amount)}
                    {wallets.length > 1 && Number.isFinite(wr.shareOfTotal) && ` · ≈${Math.round(wr.shareOfTotal * 100)}% of your crypto`}
                  </p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className={`text-2xl font-semibold ${BAND[wr.band].color}`}>{wr.score}</p>
                  <p className={`text-xs font-medium ${BAND[wr.band].color}`}>{BAND[wr.band].label}</p>
                </div>
              </div>
              <div className="mt-3">
                <ScoreBar score={wr.score} band={wr.band} />
              </div>
              {wr.issues.length > 0 ? (
                <ul className="mt-4 space-y-2">
                  {wr.issues.slice(0, 3).map((iss, k) => {
                    const page = DIAGNOSES[iss.vector].page;
                    return (
                      <li key={k} className="flex flex-wrap items-center gap-x-2 text-sm text-[var(--text-muted)]">
                        <span className="text-[var(--primary)]">•</span>
                        <span>{issueText(iss.reason)}</span>
                        {page && (
                          <Link href={`/how/${page.slug}`} className="text-[var(--primary)] hover:underline">
                            fix →
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-green-500">Nothing to flag here.</p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Top improvement */}
      {lead && lead.prevention && hasWeakSpots && (
        <section className="space-y-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-[var(--text-muted)]">Where to improve most</p>
            <h2 className="mt-1 text-xl font-semibold text-[var(--foreground)]">{lead.prevention.title}</h2>
          </div>
          <div className="space-y-3 text-[var(--text-muted)]">
            {lead.prevention.mainCopy.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          <div className="rounded-xl bg-[var(--card-bg)] border border-[var(--border)] p-6">
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">How to fix it</h3>
            <ul className="space-y-3">
              {lead.actionItems.map((item, i) => (
                <li key={i} className="flex gap-3 text-[var(--text-muted)]">
                  <span className="text-[var(--primary)] flex-shrink-0">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            {lead.externalLinks && lead.externalLinks.length > 0 && (
              <div className="mt-4 pt-4 border-t border-[var(--border)]">
                {lead.externalLinks.map((link, i) => (
                  <a
                    key={i}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={link.url.includes('haveibeenpwned') ? undefined : () => trackClick('clickedHwr')}
                    className="text-[var(--primary)] hover:underline block"
                  >
                    {link.label} →
                  </a>
                ))}
              </div>
            )}
          </div>
          {lead.page && (
            <Link href={`/how/${lead.page.slug}`} className="block text-center text-[var(--primary)] hover:underline">
              Read more about this risk →
            </Link>
          )}
        </section>
      )}

      {/* Strengths */}
      {strengths.length > 0 && (
        <section className="rounded-xl bg-[var(--primary)]/10 p-6">
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-3">What you&apos;re doing well</h2>
          <ul className="space-y-2">
            {strengths.map((s, i) => (
              <li key={i} className="flex gap-3 text-[var(--foreground)]">
                <span className="flex-shrink-0 text-green-500">✓</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Related learn topics for the top improvement */}
      {lead?.page && lead.page.relatedLearn.length > 0 && hasWeakSpots && (
        <section className="space-y-3 border-t border-[var(--border)] pt-6">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Build better habits</h2>
          <ul className="space-y-2">
            {lead.page.relatedLearn.map((id) => {
              const t = LEARN_TOPICS.find((x) => x.id === id);
              return t ? (
                <li key={id}>
                  <Link href={`/learn/${t.slug}`} onClick={() => trackClick('clickedLearn')} className="text-[var(--primary)] hover:underline">
                    {t.title} →
                  </Link>
                </li>
              ) : null;
            })}
          </ul>
        </section>
      )}

      <Link
        href="/learn"
        onClick={() => trackClick('clickedLearn')}
        className="block w-full rounded-xl bg-[var(--primary)] px-6 py-4 text-center text-lg font-medium text-white transition-colors duration-200 hover:bg-[var(--primary-hover)]"
      >
        See all best practices
      </Link>

      <p className="text-center text-sm text-[var(--text-muted)]">
        Think you&apos;ve already been hacked?{' '}
        <Link href="/diagnostic" className="text-[var(--primary)] hover:underline">
          Run the diagnostic →
        </Link>
      </p>
    </div>
  );
}
