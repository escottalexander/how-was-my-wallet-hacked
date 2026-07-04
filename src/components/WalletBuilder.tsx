'use client';

import { useEffect, useRef, useState } from 'react';
import type { Question } from '@/lib/questions';
import {
  WALLET_TYPE_OPTIONS,
  AMOUNT_OPTIONS,
  MSIG_SEPARATION_OPTIONS,
  HW_SOURCE_OPTIONS,
  parseWallets,
  type WalletEntry,
  type PortfolioWalletType,
  type AmountBand,
  type MsigSeparation,
} from '@/lib/wallet-portfolio';

function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border-2 px-4 py-3 text-left text-sm transition-colors ${
        selected
          ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--foreground)]'
          : 'border-[var(--border)] bg-[var(--card-bg)] text-[var(--text-muted)] hover:border-[var(--primary)]/50'
      }`}
    >
      {children}
    </button>
  );
}

function summarize(w: WalletEntry): string {
  const type = WALLET_TYPE_OPTIONS.find((o) => o.id === w.type)?.label ?? w.type;
  const amount = AMOUNT_OPTIONS.find((o) => o.id === w.amount)?.label ?? w.amount;
  const parts = [`${type} · ${amount}`];
  if (w.type === 'multisig' && w.msigThreshold && w.msigSigners) {
    const hw = w.msigHardwareCount ?? 0;
    const sep = (w.msigSeparation ?? [])
      .map((s) => MSIG_SEPARATION_OPTIONS.find((o) => o.id === s)?.label?.toLowerCase())
      .filter(Boolean)
      .join(', ');
    parts.push(`${w.msigThreshold}-of-${w.msigSigners}, ${hw} hardware${sep ? `, ${sep}` : ''}`);
  }
  if (w.type === 'hardware' && w.hwSource) {
    parts.push(HW_SOURCE_OPTIONS.find((o) => o.id === w.hwSource)?.label ?? '');
  }
  return parts.filter(Boolean).join(' — ');
}

function stepsAfterType(type: PortfolioWalletType | undefined): string[] {
  const s = ['amount'];
  if (type === 'multisig') s.push('msig_config', 'msig_hardware', 'msig_separation');
  if (type === 'hardware') s.push('hw_source');
  return s;
}

interface WalletBuilderProps {
  question: Question;
  value: string;
  onContinue: (value: string) => void;
}

export function WalletBuilder({ question, value, onContinue }: WalletBuilderProps) {
  const [wallets, setWallets] = useState<WalletEntry[]>(() => parseWallets(value));
  // Once a wallet exists, we land on the portfolio review; `adding` is true only
  // while the user has chosen to add another (so the type picker is shown).
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<Partial<WalletEntry>>({});
  const [stepIndex, setStepIndex] = useState(0);
  const [dir, setDir] = useState<'fwd' | 'back'>('fwd');
  const [animKey, setAnimKey] = useState(0);
  // The content currently on screen, snapshotted so it can animate out.
  const [exiting, setExiting] = useState<{ node: React.ReactNode; dir: 'fwd' | 'back' } | null>(null);
  const bodyRef = useRef<React.ReactNode>(null);

  const sequence = ['type', ...stepsAfterType(draft.type)];
  const step = sequence[stepIndex] ?? 'type';
  const typeLabel = WALLET_TYPE_OPTIONS.find((o) => o.id === draft.type)?.label ?? '';

  const draftComplete = (d: Partial<WalletEntry>): d is WalletEntry => {
    if (!d.type || !d.amount) return false;
    if (d.type === 'multisig') return !!(d.msigThreshold && d.msigSigners && d.msigSeparation && d.msigSeparation.length > 0 && d.msigHardwareCount !== undefined);
    if (d.type === 'hardware') return !!d.hwSource;
    return true;
  };

  // Snapshot the visible content, then run the state mutation, so the old layer
  // can slide/blur out while the new one slides in.
  const go = (mutator: () => void, direction: 'fwd' | 'back') => {
    setExiting({ node: bodyRef.current, dir: direction });
    setDir(direction);
    setAnimKey((k) => k + 1);
    mutator();
    window.setTimeout(() => setExiting(null), 340);
  };

  const applyAdvance = (d: Partial<WalletEntry>) => {
    const seq = ['type', ...stepsAfterType(d.type)];
    if (stepIndex >= seq.length - 1) {
      if (draftComplete(d)) {
        setWallets((prev) => [...prev, { ...d, id: crypto.randomUUID() }]);
        setDraft({});
        setStepIndex(0);
        setAdding(false); // return to the portfolio review, now one wallet larger
      }
    } else {
      setStepIndex(stepIndex + 1);
    }
  };

  const selectType = (type: PortfolioWalletType) =>
    go(() => {
      setDraft(type === 'multisig' ? { type, amount: draft.amount, msigThreshold: 2, msigSigners: 3 } : { type, amount: draft.amount });
      setStepIndex(1);
    }, 'fwd');

  const pickAndAdvance = (patch: Partial<WalletEntry>) => {
    const nd = { ...draft, ...patch };
    go(() => { setDraft(nd); applyAdvance(nd); }, 'fwd');
  };

  const back = () => go(() => setStepIndex(stepIndex - 1), 'back');

  // ---- Build the current step's content ----
  const typePicker = (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {WALLET_TYPE_OPTIONS.map((o) => (
        <Chip key={o.id} selected={false} onClick={() => selectType(o.id)}>
          <span className="block font-medium text-[var(--foreground)]">{o.label}</span>
          <span className="mt-0.5 block text-xs text-[var(--text-muted)]">{o.description}</span>
        </Chip>
      ))}
    </div>
  );

  // First wallet: the original centered "what do you have?" picker.
  const firstAddScreen = (
    <div className="flex min-h-[40vh] flex-col justify-center space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-[var(--foreground)]">{question.title}</h2>
        {question.subtitle && (
          <p className="mx-auto mt-2 max-w-xl text-[var(--text-muted)]">{question.subtitle}</p>
        )}
      </div>
      {typePicker}
    </div>
  );

  // Adding another: type picker again, but clearly a deliberate detour with a
  // way back to the portfolio.
  const addScreen = (
    <div className="space-y-6 py-2">
      <button
        type="button"
        onClick={() => go(() => setAdding(false), 'back')}
        className="text-sm font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--primary)]"
      >
        ← Back to your wallets
      </button>
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-[var(--foreground)]">Add another wallet</h2>
        <p className="mt-2 text-[var(--text-muted)]">What kind is it?</p>
      </div>
      {typePicker}
    </div>
  );

  // Portfolio review (the hero once you have at least one wallet): the list is
  // the first thing you see, "add another" is clearly optional, finishing is the
  // prominent primary action.
  const reviewScreen = (
    <div className="space-y-6 py-2">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-[var(--foreground)]">
          Your wallets · {wallets.length}
        </h2>
        <p className="mx-auto mt-2 max-w-md text-[var(--text-muted)]">
          Add each place you keep crypto for a full picture. Next, a few quick questions about how you use them.
        </p>
      </div>
      <ul className="space-y-2">
        {wallets.map((w) => (
          <li
            key={w.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] px-4 py-3 animate-fadeIn"
          >
            <span className="text-sm text-[var(--foreground)]">{summarize(w)}</span>
            <button
              type="button"
              onClick={() => setWallets((prev) => prev.filter((x) => x.id !== w.id))}
              className="flex-shrink-0 text-sm text-[var(--text-muted)] hover:text-red-500"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
      <div className="space-y-3 pt-1">
        <button
          type="button"
          onClick={() => go(() => setAdding(true), 'fwd')}
          className="w-full rounded-xl border-2 border-dashed border-[var(--border)] px-6 py-3.5 font-medium text-[var(--foreground)] transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)]"
        >
          + Add another wallet
        </button>
        <button
          type="button"
          onClick={() => onContinue(JSON.stringify(wallets))}
          className="w-full rounded-xl bg-[var(--primary)] px-6 py-4 text-lg font-medium text-white transition-colors duration-200 hover:bg-[var(--primary-hover)]"
        >
          Continue →
        </button>
      </div>
    </div>
  );

  const startScreen = wallets.length === 0 ? firstAddScreen : adding ? addScreen : reviewScreen;

  const stepBody = () => {
    switch (step) {
      case 'amount':
        return (
          <StepShell heading="How much is in it?" context={typeLabel}>
            <div className="flex flex-wrap justify-center gap-2">
              {AMOUNT_OPTIONS.map((o) => (
                <Chip key={o.id} selected={draft.amount === o.id} onClick={() => pickAndAdvance({ amount: o.id as AmountBand })}>
                  {o.label}
                </Chip>
              ))}
            </div>
          </StepShell>
        );
      case 'hw_source':
        return (
          <StepShell heading="Where did this device come from?" context={typeLabel}>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {HW_SOURCE_OPTIONS.map((o) => (
                <Chip key={o.id} selected={draft.hwSource === o.id} onClick={() => pickAndAdvance({ hwSource: o.id })}>
                  <span className="block font-medium text-[var(--foreground)]">{o.label}</span>
                  <span className="mt-0.5 block text-xs text-[var(--text-muted)]">{o.description}</span>
                </Chip>
              ))}
            </div>
          </StepShell>
        );
      case 'msig_config':
        return (
          <StepShell heading="How many signers, and how many are needed?" context={typeLabel}>
            <div className="flex items-center justify-center gap-3">
              <select
                value={draft.msigThreshold ?? 2}
                onChange={(e) => setDraft((d) => ({ ...d, msigThreshold: Number(e.target.value) }))}
                className="rounded-xl border-2 border-[var(--border)] bg-[var(--background)] px-3 py-2 text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
              >
                {Array.from({ length: draft.msigSigners ?? 3 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <span className="text-sm text-[var(--text-muted)]">of</span>
              <select
                value={draft.msigSigners ?? 3}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  setDraft((d) => ({ ...d, msigSigners: n, msigThreshold: Math.min(d.msigThreshold ?? 2, n), msigHardwareCount: d.msigHardwareCount !== undefined ? Math.min(d.msigHardwareCount, n) : undefined }));
                }}
                className="rounded-xl border-2 border-[var(--border)] bg-[var(--background)] px-3 py-2 text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
              >
                {[2, 3, 4, 5, 6, 7].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <span className="text-sm text-[var(--text-muted)]">signers</span>
            </div>
            <NextButton onClick={() => go(() => applyAdvance(draft), 'fwd')} enabled={!!(draft.msigThreshold && draft.msigSigners)} />
          </StepShell>
        );
      case 'msig_hardware':
        return (
          <StepShell heading={`How many of those ${draft.msigSigners ?? ''} signers are hardware wallets?`} context={typeLabel}>
            <div className="flex justify-center">
              <select
                value={draft.msigHardwareCount ?? ''}
                onChange={(e) => setDraft((d) => ({ ...d, msigHardwareCount: Number(e.target.value) }))}
                className="rounded-xl border-2 border-[var(--border)] bg-[var(--background)] px-3 py-2 text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
              >
                <option value="">Select</option>
                {Array.from({ length: (draft.msigSigners ?? 0) + 1 }, (_, i) => i).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <NextButton onClick={() => go(() => applyAdvance(draft), 'fwd')} enabled={draft.msigHardwareCount !== undefined} />
          </StepShell>
        );
      case 'msig_separation':
        return (
          <StepShell heading="How are the keys separated?" subheading="Select all that apply." context={typeLabel}>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {MSIG_SEPARATION_OPTIONS.map((o) => (
                <Chip
                  key={o.id}
                  selected={(draft.msigSeparation ?? []).includes(o.id)}
                  onClick={() =>
                    setDraft((d) => {
                      const cur = d.msigSeparation ?? [];
                      if (o.id === 'together') return { ...d, msigSeparation: ['together'] };
                      const without = cur.filter((x) => x !== 'together');
                      const next = without.includes(o.id) ? without.filter((x) => x !== o.id) : ([...without, o.id] as MsigSeparation[]);
                      return { ...d, msigSeparation: next };
                    })
                  }
                >
                  <span className="block font-medium text-[var(--foreground)]">{o.label}</span>
                  <span className="mt-0.5 block text-xs text-[var(--text-muted)]">{o.description}</span>
                </Chip>
              ))}
            </div>
            <NextButton label="Add to portfolio" onClick={() => go(() => applyAdvance(draft), 'fwd')} enabled={(draft.msigSeparation ?? []).length > 0} />
          </StepShell>
        );
      default:
        return null;
    }
  };

  const subStep = (
    <div className="relative flex min-h-[60vh] flex-col justify-center">
      <button
        type="button"
        onClick={back}
        className="absolute left-0 top-0 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--primary)]"
      >
        ← Back
      </button>
      <div className="w-full">{stepBody()}</div>
    </div>
  );

  const content = step === 'type' ? startScreen : subStep;
  // Snapshot the current body after each render so `go()` can animate it out.
  // (go/back only fire from user events, after the effect has committed.)
  useEffect(() => {
    bodyRef.current = content;
  });

  const enterAnim = dir === 'back' ? 'animate-slideInLeft' : 'animate-slideInRight';
  const exitAnim = exiting?.dir === 'back' ? 'animate-slideOutRight' : 'animate-slideOutLeft';

  return (
    <div className="relative overflow-hidden">
      {exiting && <div className={`pointer-events-none absolute inset-0 ${exitAnim}`}>{exiting.node}</div>}
      <div key={animKey} className={enterAnim}>
        {content}
      </div>
    </div>
  );
}

function StepShell({
  heading,
  subheading,
  context,
  children,
}: {
  heading: string;
  subheading?: string;
  context?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6 text-center">
      {context && (
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--primary)]">Adding {context}</p>
      )}
      <div>
        <h2 className="text-2xl font-semibold text-[var(--foreground)]">{heading}</h2>
        {subheading && <p className="mt-2 text-[var(--text-muted)]">{subheading}</p>}
      </div>
      {children}
    </div>
  );
}

function NextButton({ onClick, enabled, label = 'Next' }: { onClick: () => void; enabled: boolean; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!enabled}
      className={`w-full rounded-xl bg-[var(--primary)] px-6 py-3.5 font-medium text-white transition-colors hover:bg-[var(--primary-hover)] ${
        enabled ? '' : 'cursor-not-allowed opacity-50'
      }`}
    >
      {label}
    </button>
  );
}
