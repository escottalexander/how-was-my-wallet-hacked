'use client';

import { useEffect, useMemo, useState } from 'react';
import { QUESTIONS, getVisibleQuestions, type AnswerMap, type Question } from '@/lib/questions';
import { ProgressBar } from '@/components/ProgressBar';

interface QuestionPipelineProps {
  onAnswer?: (questionId: string, answer: string | string[]) => void;
  onComplete: (answers: AnswerMap) => void;
  initialAnswers?: AnswerMap;
}

interface OptionButtonProps {
  label: string;
  description?: string;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
}

function OptionButton({ label, description, selected, onClick, disabled }: OptionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        min-h-[72px] w-full rounded-xl border-2 px-5 py-4 text-left
        transition-all duration-200
        ${selected
          ? 'border-[var(--primary)] bg-[var(--primary)]/10'
          : 'border-[var(--border)] bg-[var(--card-bg)] hover:border-[var(--primary)]/50'}
        ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
      `}
    >
      <span className="block font-medium text-[var(--foreground)]">{label}</span>
      {description && (
        <span className="mt-1 block text-sm text-[var(--text-muted)]">{description}</span>
      )}
    </button>
  );
}

function QuestionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="text-center">
      <h1 className="text-2xl font-semibold text-[var(--foreground)]">{title}</h1>
      {subtitle && <p className="mt-2 text-[var(--text-muted)]">{subtitle}</p>}
    </div>
  );
}

// Renders a single-choice question; auto-advances on selection
function SingleQuestion({
  question,
  selected,
  onSelect,
  disabled,
}: {
  question: Question;
  selected: string | null;
  onSelect: (id: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-8">
      <QuestionHeader title={question.title} subtitle={question.subtitle} />
      <div className="grid grid-cols-1 gap-4">
        {(question.options ?? []).map((opt) => (
          <OptionButton
            key={opt.id}
            label={opt.label}
            description={opt.description}
            selected={selected === opt.id}
            onClick={() => onSelect(opt.id)}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  );
}

// Renders a multi-select question with a Continue button
function MultiQuestion({
  question,
  selected,
  onSelect,
  onContinue,
  disabled,
}: {
  question: Question;
  selected: string[];
  onSelect: (ids: string[]) => void;
  onContinue: () => void;
  disabled?: boolean;
}) {
  const toggle = (id: string) => {
    if (id === 'none') {
      onSelect(['none']);
      return;
    }
    const without = selected.filter((s) => s !== 'none');
    onSelect(
      without.includes(id) ? without.filter((s) => s !== id) : [...without, id]
    );
  };

  return (
    <div className="space-y-8">
      <QuestionHeader title={question.title} subtitle={question.subtitle} />
      <div className="grid grid-cols-1 gap-4">
        {(question.options ?? []).map((opt) => (
          <OptionButton
            key={opt.id}
            label={opt.label}
            description={opt.description}
            selected={selected.includes(opt.id)}
            onClick={() => toggle(opt.id)}
            disabled={disabled}
          />
        ))}
      </div>
      <button
        type="button"
        onClick={onContinue}
        disabled={disabled || selected.length === 0}
        className={`
          w-full rounded-xl bg-[var(--primary)] px-6 py-4 text-lg font-medium text-white
          transition-colors duration-200 hover:bg-[var(--primary-hover)]
          ${disabled || selected.length === 0 ? 'cursor-not-allowed opacity-50' : ''}
        `}
      >
        Continue
      </button>
    </div>
  );
}

const YEARS = Array.from({ length: 13 }, (_, i) => 2013 + i).reverse(); // 2025 down to 2013
const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'] as const;

// Renders year + quarter dropdowns
function DateQuestion({
  question,
  value,
  onContinue,
  disabled,
}: {
  question: Question;
  value: string;
  onContinue: (value: string) => void;
  disabled?: boolean;
}) {
  const [year, setYear] = useState('');
  const [quarter, setQuarter] = useState('');

  // Sync from external value (e.g., "2022-Q3")
  useEffect(() => {
    if (value && value !== 'unknown') {
      const [y, q] = value.split('-');
      setYear(y ?? '');
      setQuarter(q ?? '');
    }
  }, [value]);

  const handleContinue = () => {
    onContinue(year && quarter ? `${year}-${quarter}` : 'unknown');
  };

  return (
    <div className="space-y-8">
      <QuestionHeader title={question.title} subtitle={question.subtitle} />
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--text-muted)]">Year</label>
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            disabled={disabled}
            className="w-full rounded-xl border-2 border-[var(--border)] bg-[var(--card-bg)] px-4 py-3 text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
          >
            <option value="">Select year</option>
            {YEARS.map((y) => (
              <option key={y} value={String(y)}>{y}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--text-muted)]">Quarter</label>
          <select
            value={quarter}
            onChange={(e) => setQuarter(e.target.value)}
            disabled={disabled}
            className="w-full rounded-xl border-2 border-[var(--border)] bg-[var(--card-bg)] px-4 py-3 text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
          >
            <option value="">Select quarter</option>
            {QUARTERS.map((q) => <option key={q} value={q}>{q}</option>)}
          </select>
        </div>
      </div>
      <button
        type="button"
        onClick={handleContinue}
        disabled={disabled}
        className={`
          w-full rounded-xl bg-[var(--primary)] px-6 py-4 text-lg font-medium text-white
          transition-colors duration-200 hover:bg-[var(--primary-hover)]
          ${disabled ? 'cursor-not-allowed opacity-50' : ''}
        `}
      >
        {year && quarter ? 'Continue' : "I'm not sure — skip"}
      </button>
    </div>
  );
}

// Renders a free-text textarea
function TextQuestion({
  question,
  value,
  onChange,
  onContinue,
  disabled,
}: {
  question: Question;
  value: string;
  onChange: (v: string) => void;
  onContinue: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-8">
      <QuestionHeader title={question.title} subtitle={question.subtitle} />
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        rows={5}
        placeholder="Share anything you think is relevant..."
        className="w-full rounded-xl border-2 border-[var(--border)] bg-[var(--card-bg)] px-5 py-4 text-[var(--foreground)] placeholder:text-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none"
      />
      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={onContinue}
          disabled={disabled}
          className={`
            rounded-xl border-2 border-[var(--border)] px-6 py-4 text-lg font-medium text-[var(--foreground)]
            transition-colors duration-200 hover:border-[var(--primary)]
            ${disabled ? 'cursor-not-allowed opacity-50' : ''}
          `}
        >
          Skip
        </button>
        <button
          type="button"
          onClick={() => { onChange(value); onContinue(); }}
          disabled={disabled}
          className={`
            rounded-xl bg-[var(--primary)] px-6 py-4 text-lg font-medium text-white
            transition-colors duration-200 hover:bg-[var(--primary-hover)]
            ${disabled ? 'cursor-not-allowed opacity-50' : ''}
          `}
        >
          Submit
        </button>
      </div>
    </div>
  );
}

export function QuestionPipeline({ onAnswer, onComplete, initialAnswers }: QuestionPipelineProps) {
  const [answers, setAnswers] = useState<AnswerMap>(initialAnswers ?? {});
  // Stack of question IDs the user has visited, in order
  const [historyIds, setHistoryIds] = useState<string[]>([]);
  // Pending value for multi/date/text questions (not yet submitted)
  const [pendingMulti, setPendingMulti] = useState<string[]>([]);
  const [pendingText, setPendingText] = useState<string>('');

  const visibleQuestions = useMemo(() => getVisibleQuestions(answers), [answers]);

  // Initialize history with the first visible question on mount
  useEffect(() => {
    if (historyIds.length === 0 && visibleQuestions.length > 0) {
      setHistoryIds([visibleQuestions[0].id]);
    }
  }, [visibleQuestions, historyIds.length]);

  const currentId = historyIds[historyIds.length - 1] ?? null;
  const currentQuestion = currentId ? QUESTIONS.find((q) => q.id === currentId) ?? null : null;
  const currentVisibleIndex = visibleQuestions.findIndex((q) => q.id === currentId);
  const progress = visibleQuestions.length > 1
    ? currentVisibleIndex / (visibleQuestions.length - 1)
    : 0;

  // Reset pending state when question changes
  useEffect(() => {
    if (!currentQuestion) return;
    if (currentQuestion.type === 'multi') {
      const existing = answers[currentQuestion.id];
      if (Array.isArray(existing)) {
        setPendingMulti(existing);
      } else {
        setPendingMulti([]);
      }
    }
    if (currentQuestion.type === 'text') {
      const existing = answers[currentQuestion.id];
      setPendingText(typeof existing === 'string' ? existing : '');
    }
  }, [currentId]); // eslint-disable-line react-hooks/exhaustive-deps

  const advance = (newAnswers: AnswerMap, answeredId: string, answer: string | string[]) => {
    onAnswer?.(answeredId, answer);
    const newVisible = getVisibleQuestions(newAnswers);
    const idx = newVisible.findIndex((q) => q.id === answeredId);
    const nextQ = newVisible[idx + 1];
    if (nextQ) {
      setHistoryIds((prev) => [...prev, nextQ.id]);
    } else {
      onComplete(newAnswers);
    }
  };

  const handleSingleSelect = (answer: string) => {
    if (!currentId) return;
    const newAnswers = { ...answers, [currentId]: answer };
    setAnswers(newAnswers);
    advance(newAnswers, currentId, answer);
  };

  const handleMultiContinue = () => {
    if (!currentId) return;
    const answer = pendingMulti.length > 0 ? pendingMulti : ['none'];
    const newAnswers = { ...answers, [currentId]: answer };
    setAnswers(newAnswers);
    advance(newAnswers, currentId, answer);
  };

  const handleDateContinue = (value: string) => {
    if (!currentId) return;
    const newAnswers = { ...answers, [currentId]: value };
    setAnswers(newAnswers);
    advance(newAnswers, currentId, value);
  };

  const handleTextContinue = () => {
    if (!currentId) return;
    const value = pendingText.trim();
    const newAnswers = value ? { ...answers, [currentId]: value } : answers;
    setAnswers(newAnswers);
    onComplete(newAnswers);
  };

  const handleBack = () => {
    if (historyIds.length <= 1) return;
    const leavingId = historyIds[historyIds.length - 1];
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[leavingId];
      return next;
    });
    setHistoryIds((prev) => prev.slice(0, -1));
  };

  if (!currentQuestion) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="text-[var(--text-muted)]">Loading...</div>
      </div>
    );
  }

  const renderQuestion = () => {
    switch (currentQuestion.type) {
      case 'single':
        return (
          <SingleQuestion
            question={currentQuestion}
            selected={typeof answers[currentQuestion.id] === 'string' ? answers[currentQuestion.id] as string : null}
            onSelect={handleSingleSelect}
          />
        );
      case 'multi':
        return (
          <MultiQuestion
            question={currentQuestion}
            selected={pendingMulti}
            onSelect={setPendingMulti}
            onContinue={handleMultiContinue}
          />
        );
      case 'date':
        return (
          <DateQuestion
            question={currentQuestion}
            value={typeof answers[currentQuestion.id] === 'string' ? answers[currentQuestion.id] as string : ''}
            onContinue={handleDateContinue}
          />
        );
      case 'text':
        return (
          <TextQuestion
            question={currentQuestion}
            value={pendingText}
            onChange={setPendingText}
            onContinue={handleTextContinue}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div>
      <ProgressBar progress={progress} />
      <div className="mx-auto max-w-2xl space-y-8 px-4 py-8">
        {renderQuestion()}
        {currentQuestion.type !== 'text' && (
          <button
            type="button"
            onClick={handleBack}
            disabled={historyIds.length <= 1}
            className={`
              w-full rounded-xl border-2 border-[var(--border)] px-6 py-4
              text-lg font-medium text-[var(--foreground)]
              transition-colors duration-200 hover:border-[var(--primary)]
              ${historyIds.length <= 1 ? 'cursor-not-allowed opacity-50' : ''}
            `}
          >
            Back
          </button>
        )}
      </div>
    </div>
  );
}
