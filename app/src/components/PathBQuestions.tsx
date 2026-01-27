'use client';

import { useState } from 'react';

// Question IDs for Path B (malicious transaction path)
export type PathBQuestionId =
  | 'b1_how_found_site'
  | 'b2_what_trying_to_do';

// Answer types for each question
export type B1Answer = 'social_media' | 'google_search' | 'dm' | 'email' | 'typed_url';
export type B2Answer = 'airdrop' | 'nft_mint' | 'new_dapp' | 'token_transaction' | 'other';

interface QuestionOption<T extends string> {
  id: T;
  label: string;
  description?: string;
}

// B1: How did you find the site/app?
const B1_OPTIONS: QuestionOption<B1Answer>[] = [
  { id: 'social_media', label: 'Social media', description: 'Twitter/X, Discord server, Telegram group, etc.' },
  { id: 'google_search', label: 'Google search', description: 'I searched for something and found it' },
  { id: 'dm', label: 'Direct message', description: 'Someone DM\'d me the link' },
  { id: 'email', label: 'Email', description: 'I received it in an email' },
  { id: 'typed_url', label: 'Typed the URL directly', description: 'I typed the address myself' },
];

// B2: What were you trying to do?
const B2_OPTIONS: QuestionOption<B2Answer>[] = [
  { id: 'airdrop', label: 'Claim an airdrop', description: 'Free tokens or NFTs' },
  { id: 'nft_mint', label: 'Mint an NFT', description: 'Buy or create a new NFT' },
  { id: 'new_dapp', label: 'Try a new dApp', description: 'A new decentralized app or protocol' },
  { id: 'token_transaction', label: 'Token swap or transaction', description: 'Exchange, bridge, or transfer tokens' },
  { id: 'other', label: 'Something else', description: 'Another type of activity' },
];

interface QuestionDisplayProps<T extends string> {
  title: string;
  subtitle?: string;
  options: QuestionOption<T>[];
  selectedAnswer: T | null;
  onSelect: (answer: T) => void;
  isSubmitting?: boolean;
}

function QuestionDisplay<T extends string>({
  title,
  subtitle,
  options,
  selectedAnswer,
  onSelect,
  isSubmitting,
}: QuestionDisplayProps<T>) {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-[var(--foreground)]">{title}</h1>
        {subtitle && <p className="mt-2 text-[var(--text-muted)]">{subtitle}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onSelect(option.id)}
            disabled={isSubmitting}
            className={`
              min-h-[72px] rounded-xl border-2 px-5 py-4 text-left
              transition-all duration-200
              ${
                selectedAnswer === option.id
                  ? 'border-[var(--primary)] bg-[var(--primary)]/10'
                  : 'border-[var(--border)] bg-[var(--card-bg)] hover:border-[var(--primary)]/50'
              }
              ${isSubmitting ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
            `}
          >
            <span className="block font-medium text-[var(--foreground)]">
              {option.label}
            </span>
            {option.description && (
              <span className="mt-1 block text-sm text-[var(--text-muted)]">
                {option.description}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// Step result from the component
export interface PathBStepResult {
  questionId: PathBQuestionId;
  answer: string;
  nextStep: PathBQuestionId | 'diagnosis';
  diagnosisType?: string;
  context?: Record<string, string>;
}

interface PathBQuestionsProps {
  onStepComplete: (result: PathBStepResult) => void;
  isSubmitting?: boolean;
}

export function PathBQuestions({ onStepComplete, isSubmitting }: PathBQuestionsProps) {
  const [currentQuestion, setCurrentQuestion] = useState<PathBQuestionId>('b1_how_found_site');
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  // Store B1 answer for context in the diagnosis
  const [howFoundSite, setHowFoundSite] = useState<B1Answer | null>(null);

  // Determine next step based on current question and answer
  const getNextStep = (questionId: PathBQuestionId, answer: string): { nextStep: PathBQuestionId | 'diagnosis'; diagnosisType?: string; context?: Record<string, string> } => {
    switch (questionId) {
      case 'b1_how_found_site':
        // Store the answer for context, then move to B2
        return { nextStep: 'b2_what_trying_to_do' };

      case 'b2_what_trying_to_do':
        // After B2, we go to malicious transaction diagnosis with context
        return {
          nextStep: 'diagnosis',
          diagnosisType: 'malicious_transaction',
          context: {
            how_found: howFoundSite || answer,
            what_doing: answer,
          }
        };

      default:
        return { nextStep: 'diagnosis', diagnosisType: 'malicious_transaction' };
    }
  };

  const handleSelect = (answer: string) => {
    setSelectedAnswer(answer);
  };

  const handleContinue = () => {
    if (!selectedAnswer) return;

    // If this is B1, store the answer for context
    if (currentQuestion === 'b1_how_found_site') {
      setHowFoundSite(selectedAnswer as B1Answer);
    }

    const { nextStep, diagnosisType, context } = getNextStep(currentQuestion, selectedAnswer);

    // Report the step completion
    onStepComplete({
      questionId: currentQuestion,
      answer: selectedAnswer,
      nextStep,
      diagnosisType,
      context,
    });

    if (nextStep !== 'diagnosis') {
      setCurrentQuestion(nextStep);
      setSelectedAnswer(null);
    }
  };

  // Render the appropriate question based on current step
  const renderQuestion = () => {
    switch (currentQuestion) {
      case 'b1_how_found_site':
        return (
          <QuestionDisplay
            title="How did you find the site or app?"
            subtitle="Think about how you first discovered it."
            options={B1_OPTIONS}
            selectedAnswer={selectedAnswer as B1Answer | null}
            onSelect={handleSelect}
            isSubmitting={isSubmitting}
          />
        );

      case 'b2_what_trying_to_do':
        return (
          <QuestionDisplay
            title="What were you trying to do?"
            subtitle="What action were you attempting when this happened?"
            options={B2_OPTIONS}
            selectedAnswer={selectedAnswer as B2Answer | null}
            onSelect={handleSelect}
            isSubmitting={isSubmitting}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      {renderQuestion()}

      {/* Continue Button */}
      {selectedAnswer && (
        <div className="animate-fadeIn pt-4">
          <button
            type="button"
            onClick={handleContinue}
            disabled={isSubmitting}
            className={`
              w-full rounded-xl bg-[var(--primary)] px-6 py-4
              text-lg font-medium text-white
              transition-colors duration-200
              ${isSubmitting ? 'cursor-not-allowed opacity-70' : 'hover:bg-[var(--primary-hover)]'}
            `}
          >
            {isSubmitting ? 'Saving...' : 'Continue'}
          </button>
        </div>
      )}
    </div>
  );
}
