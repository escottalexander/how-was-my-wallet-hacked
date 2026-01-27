'use client';

import { useState } from 'react';

// Question IDs for Path A (seed phrase compromise path)
export type PathAQuestionId =
  | 'a1_seed_backup'
  | 'a2_storage_method'
  | 'a3_password_manager'
  | 'a4_copy_paste'
  | 'a4a_where_pasted'
  | 'a5_downloaded_files'
  | 'a5a_file_type'
  | 'a5b_file_source'
  | 'a6_wallet_setup'
  | 'a7_physical_access';

// Answer types for each question
export type A1Answer = 'yes' | 'no' | 'not_sure';
export type A2Answer =
  | 'physical_secure'
  | 'screenshot'
  | 'notes_app'
  | 'cloud_storage'
  | 'password_manager'
  | 'multiple';
export type A3Answer = 'yes' | 'no' | 'not_sure';
export type A4Answer = 'yes' | 'no' | 'not_sure';
export type A4aAnswer = 'website' | 'code_file' | 'between_wallets' | 'other';
export type A5Answer = 'yes' | 'no' | 'not_sure';
export type A5aAnswer = 'executable' | 'document' | 'other';
export type A5bAnswer = 'discord_telegram' | 'email' | 'website' | 'job_application' | 'other';
export type A6Answer = 'someone_helped' | 'bought_wallet' | 'self_setup';
export type A7Answer = 'yes' | 'no' | 'not_sure';

interface QuestionOption<T extends string> {
  id: T;
  label: string;
  description?: string;
}

// A1: Seed phrase backup question
const A1_OPTIONS: QuestionOption<A1Answer>[] = [
  { id: 'yes', label: 'Yes, I backed it up', description: 'I wrote it down or stored it somewhere' },
  { id: 'no', label: "No, I didn't back it up", description: 'I never saved the seed phrase' },
  { id: 'not_sure', label: "I'm not sure", description: "I don't remember or don't know what this means" },
];

// A2: Storage method question
const A2_OPTIONS: QuestionOption<A2Answer>[] = [
  { id: 'physical_secure', label: 'Physical location (paper, metal, safe)', description: 'Written down and stored securely' },
  { id: 'screenshot', label: 'Screenshot on my phone', description: 'Saved as an image in my photos' },
  { id: 'notes_app', label: 'Notes app or text file', description: 'Digital notes on my device' },
  { id: 'cloud_storage', label: 'Cloud storage (Google Drive, iCloud, Dropbox)', description: 'Saved online where I can access from anywhere' },
  { id: 'password_manager', label: 'Password manager', description: '1Password, LastPass, Bitwarden, etc.' },
  { id: 'multiple', label: 'Multiple locations', description: 'I stored it in more than one place' },
];

// A3: Password manager unique password question
const A3_OPTIONS: QuestionOption<A3Answer>[] = [
  { id: 'yes', label: 'Yes, unique password', description: 'I use a unique, strong master password' },
  { id: 'no', label: 'No, I reuse passwords', description: 'I use similar passwords across services' },
  { id: 'not_sure', label: "I'm not sure", description: "I don't remember" },
];

// A4: Copy/paste habits question
const A4_OPTIONS: QuestionOption<A4Answer>[] = [
  { id: 'yes', label: 'Yes, I have', description: 'I\'ve copied my seed phrase to paste somewhere' },
  { id: 'no', label: 'No, never', description: 'I\'ve never copied my seed phrase' },
  { id: 'not_sure', label: "I'm not sure", description: "I don't remember" },
];

// A4a: Where pasted question
const A4A_OPTIONS: QuestionOption<A4aAnswer>[] = [
  { id: 'website', label: 'A website', description: 'To recover a wallet or claim something' },
  { id: 'code_file', label: 'A code file or script', description: 'For a project or automation' },
  { id: 'between_wallets', label: 'Between wallet apps', description: 'To import into another wallet' },
  { id: 'other', label: 'Somewhere else', description: 'Another application or purpose' },
];

// A5: Downloaded files question
const A5_OPTIONS: QuestionOption<A5Answer>[] = [
  { id: 'yes', label: 'Yes, I have', description: 'I downloaded files or apps recently' },
  { id: 'no', label: 'No, not recently', description: 'I haven\'t downloaded anything unusual' },
  { id: 'not_sure', label: "I'm not sure", description: "I don't remember" },
];

// A5a: File type question
const A5A_OPTIONS: QuestionOption<A5aAnswer>[] = [
  { id: 'executable', label: 'An app or executable file', description: '.exe, .app, .dmg, or similar' },
  { id: 'document', label: 'A document or PDF', description: '.pdf, .doc, .xls, or similar' },
  { id: 'other', label: 'Something else', description: 'Another type of file' },
];

// A5b: File source question
const A5B_OPTIONS: QuestionOption<A5bAnswer>[] = [
  { id: 'discord_telegram', label: 'Discord or Telegram', description: 'Someone sent it in a DM or channel' },
  { id: 'email', label: 'Email', description: 'It came as an attachment or link' },
  { id: 'website', label: 'A website', description: 'I downloaded it from a site' },
  { id: 'job_application', label: 'Job application / interview', description: 'As part of a job or hiring process' },
  { id: 'other', label: 'Somewhere else', description: 'Another source' },
];

// A6: Wallet setup question
const A6_OPTIONS: QuestionOption<A6Answer>[] = [
  { id: 'someone_helped', label: 'Someone helped me set it up', description: 'A friend, family member, or stranger helped' },
  { id: 'bought_wallet', label: 'I bought the wallet secondhand or pre-configured', description: 'The wallet came already set up' },
  { id: 'self_setup', label: 'I set it up myself', description: 'I created the wallet on my own' },
];

// A7: Physical access question
const A7_OPTIONS: QuestionOption<A7Answer>[] = [
  { id: 'yes', label: 'Yes, possibly', description: 'Someone else could have accessed where I stored it' },
  { id: 'no', label: 'No, only me', description: 'No one else has access to my storage' },
  { id: 'not_sure', label: "I'm not sure", description: 'I haven\'t thought about this' },
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
export interface PathAStepResult {
  questionId: PathAQuestionId;
  answer: string;
  nextStep: PathAQuestionId | 'diagnosis';
  diagnosisType?: string;
}

interface PathAQuestionsProps {
  onStepComplete: (result: PathAStepResult) => void;
  isSubmitting?: boolean;
  walletType?: string | null;
}

export function PathAQuestions({ onStepComplete, isSubmitting, walletType }: PathAQuestionsProps) {
  const [currentQuestion, setCurrentQuestion] = useState<PathAQuestionId>('a1_seed_backup');
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  // Determine next step based on current question and answer
  const getNextStep = (questionId: PathAQuestionId, answer: string): { nextStep: PathAQuestionId | 'diagnosis'; diagnosisType?: string } => {
    switch (questionId) {
      case 'a1_seed_backup':
        if (answer === 'yes') return { nextStep: 'a2_storage_method' };
        if (answer === 'no') return { nextStep: 'a5_downloaded_files' }; // Skip storage questions
        return { nextStep: 'a2_storage_method' }; // not_sure - ask about storage

      case 'a2_storage_method':
        if (answer === 'cloud_storage') return { nextStep: 'diagnosis', diagnosisType: 'cloud_storage' };
        if (answer === 'screenshot') return { nextStep: 'diagnosis', diagnosisType: 'phone_storage' };
        if (answer === 'notes_app') return { nextStep: 'diagnosis', diagnosisType: 'digital_storage' };
        if (answer === 'password_manager') return { nextStep: 'a3_password_manager' };
        if (answer === 'multiple') return { nextStep: 'a4_copy_paste' };
        return { nextStep: 'a4_copy_paste' }; // physical_secure - continue to other questions

      case 'a3_password_manager':
        if (answer === 'no') return { nextStep: 'diagnosis', diagnosisType: 'password_reuse' };
        return { nextStep: 'a4_copy_paste' };

      case 'a4_copy_paste':
        if (answer === 'yes') return { nextStep: 'a4a_where_pasted' };
        return { nextStep: 'a5_downloaded_files' };

      case 'a4a_where_pasted':
        if (answer === 'website') return { nextStep: 'diagnosis', diagnosisType: 'phishing_fake_site' };
        if (answer === 'code_file') return { nextStep: 'diagnosis', diagnosisType: 'exposed_in_code' };
        return { nextStep: 'a5_downloaded_files' };

      case 'a5_downloaded_files':
        if (answer === 'yes') return { nextStep: 'a5a_file_type' };
        return { nextStep: 'a6_wallet_setup' };

      case 'a5a_file_type':
        return { nextStep: 'a5b_file_source' };

      case 'a5b_file_source':
        if (answer === 'discord_telegram') return { nextStep: 'diagnosis', diagnosisType: 'social_engineering_file' };
        if (answer === 'email') return { nextStep: 'diagnosis', diagnosisType: 'phishing_email' };
        if (answer === 'website') return { nextStep: 'diagnosis', diagnosisType: 'malicious_download' };
        if (answer === 'job_application') return { nextStep: 'diagnosis', diagnosisType: 'fake_job_scam' };
        return { nextStep: 'a6_wallet_setup' };

      case 'a6_wallet_setup':
        if (answer === 'someone_helped') return { nextStep: 'diagnosis', diagnosisType: 'compromised_setup' };
        if (answer === 'bought_wallet') return { nextStep: 'diagnosis', diagnosisType: 'purchased_wallet_scam' };
        // Hardware wallet specific
        if (walletType === 'hardware') {
          return { nextStep: 'a7_physical_access' };
        }
        return { nextStep: 'a7_physical_access' };

      case 'a7_physical_access':
        if (answer === 'yes') return { nextStep: 'diagnosis', diagnosisType: 'compromised_hardware' };
        return { nextStep: 'diagnosis', diagnosisType: 'unknown' }; // Fallback

      default:
        return { nextStep: 'diagnosis', diagnosisType: 'unknown' };
    }
  };

  const handleSelect = (answer: string) => {
    setSelectedAnswer(answer);
  };

  const handleContinue = () => {
    if (!selectedAnswer) return;

    const { nextStep, diagnosisType } = getNextStep(currentQuestion, selectedAnswer);

    // Report the step completion
    onStepComplete({
      questionId: currentQuestion,
      answer: selectedAnswer,
      nextStep,
      diagnosisType,
    });

    if (nextStep !== 'diagnosis') {
      setCurrentQuestion(nextStep);
      setSelectedAnswer(null);
    }
  };

  // Render the appropriate question based on current step
  const renderQuestion = () => {
    switch (currentQuestion) {
      case 'a1_seed_backup':
        return (
          <QuestionDisplay
            title="Did you back up your seed phrase (recovery phrase)?"
            subtitle="This is the 12 or 24 word phrase given when you created your wallet."
            options={A1_OPTIONS}
            selectedAnswer={selectedAnswer as A1Answer | null}
            onSelect={handleSelect}
            isSubmitting={isSubmitting}
          />
        );

      case 'a2_storage_method':
        return (
          <QuestionDisplay
            title="How did you store your seed phrase?"
            subtitle="Select the option that best describes where you kept it."
            options={A2_OPTIONS}
            selectedAnswer={selectedAnswer as A2Answer | null}
            onSelect={handleSelect}
            isSubmitting={isSubmitting}
          />
        );

      case 'a3_password_manager':
        return (
          <QuestionDisplay
            title="Do you use a unique, strong master password for your password manager?"
            subtitle="And is it different from passwords you use elsewhere?"
            options={A3_OPTIONS}
            selectedAnswer={selectedAnswer as A3Answer | null}
            onSelect={handleSelect}
            isSubmitting={isSubmitting}
          />
        );

      case 'a4_copy_paste':
        return (
          <QuestionDisplay
            title="Have you ever copied and pasted your seed phrase?"
            subtitle="Think about whether you've ever used copy/paste with your recovery words."
            options={A4_OPTIONS}
            selectedAnswer={selectedAnswer as A4Answer | null}
            onSelect={handleSelect}
            isSubmitting={isSubmitting}
          />
        );

      case 'a4a_where_pasted':
        return (
          <QuestionDisplay
            title="Where did you paste your seed phrase?"
            subtitle="What was the purpose when you copied it?"
            options={A4A_OPTIONS}
            selectedAnswer={selectedAnswer as A4aAnswer | null}
            onSelect={handleSelect}
            isSubmitting={isSubmitting}
          />
        );

      case 'a5_downloaded_files':
        return (
          <QuestionDisplay
            title="Have you downloaded any files or apps recently?"
            subtitle="Especially anything related to crypto, NFTs, or from someone you met online."
            options={A5_OPTIONS}
            selectedAnswer={selectedAnswer as A5Answer | null}
            onSelect={handleSelect}
            isSubmitting={isSubmitting}
          />
        );

      case 'a5a_file_type':
        return (
          <QuestionDisplay
            title="What type of file did you download?"
            subtitle="Select the type that best matches."
            options={A5A_OPTIONS}
            selectedAnswer={selectedAnswer as A5aAnswer | null}
            onSelect={handleSelect}
            isSubmitting={isSubmitting}
          />
        );

      case 'a5b_file_source':
        return (
          <QuestionDisplay
            title="Where did this file come from?"
            subtitle="How did you find or receive this file?"
            options={A5B_OPTIONS}
            selectedAnswer={selectedAnswer as A5bAnswer | null}
            onSelect={handleSelect}
            isSubmitting={isSubmitting}
          />
        );

      case 'a6_wallet_setup':
        return (
          <QuestionDisplay
            title="How was your wallet originally set up?"
            subtitle="Think back to when you first created this wallet."
            options={A6_OPTIONS}
            selectedAnswer={selectedAnswer as A6Answer | null}
            onSelect={handleSelect}
            isSubmitting={isSubmitting}
          />
        );

      case 'a7_physical_access':
        return (
          <QuestionDisplay
            title="Could someone else have had physical access to where you stored your seed phrase?"
            subtitle="Consider roommates, family members, visitors, or anyone who could have seen it."
            options={A7_OPTIONS}
            selectedAnswer={selectedAnswer as A7Answer | null}
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
