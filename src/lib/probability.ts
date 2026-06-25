// Probability Engine for HowWasIHacked
// Based on PRD probability weights and adjustment rules

import type { WalletType, PathStep } from './types';

// All possible diagnosis types
export type DiagnosisType =
  | 'cloud_storage'
  | 'phone_storage'
  | 'digital_storage'
  | 'phishing_fake_site'
  | 'social_engineering_file'
  | 'malicious_transaction'
  | 'password_reuse'
  | 'clipboard_compromise'
  | 'purchased_wallet_scam'
  | 'compromised_setup'
  | 'compromised_hardware'
  | 'malicious_extension'
  | 'exposed_in_code'
  | 'phishing_email'
  | 'malicious_download'
  | 'fake_job_scam'
  | 'unknown';

// Base weights per PRD (in percentage points, sum to 100)
export const BASE_WEIGHTS: Record<DiagnosisType, number> = {
  cloud_storage: 20,
  phone_storage: 15,
  digital_storage: 15,
  phishing_fake_site: 12,
  social_engineering_file: 10,
  malicious_transaction: 8,
  password_reuse: 5,
  clipboard_compromise: 5,
  purchased_wallet_scam: 3,
  compromised_setup: 3,
  compromised_hardware: 1,
  malicious_extension: 1,
  exposed_in_code: 1,
  phishing_email: 0.5,
  malicious_download: 0.3,
  fake_job_scam: 0.2,
  unknown: 0, // Not in base weights, only used as fallback
};

// Wallet type multipliers per PRD examples
export const WALLET_TYPE_MULTIPLIERS: Record<WalletType, Partial<Record<DiagnosisType, number>>> = {
  hardware: {
    malicious_transaction: 2.0,
    cloud_storage: 0.7,
    phone_storage: 0.5,
    malicious_extension: 0.3,
    clipboard_compromise: 0.5,
    compromised_hardware: 3.0, // Hardware-specific risk
    purchased_wallet_scam: 2.5, // Common for hardware wallets
  },
  browser_extension: {
    malicious_extension: 2.5,
    clipboard_compromise: 1.5,
    phishing_fake_site: 1.3,
    malicious_transaction: 1.2,
  },
  mobile: {
    phone_storage: 2.0,
    malicious_extension: 0.3, // Not applicable to mobile
    clipboard_compromise: 1.3,
  },
  other: {
    // No specific adjustments for "other"
  },
};

// Answer-based multipliers: maps question_id -> answer -> diagnosis adjustments
export const ANSWER_MULTIPLIERS: Record<string, Record<string, Partial<Record<DiagnosisType, number>>>> = {
  timing: {
    active: {
      malicious_transaction: 5.0,
      cloud_storage: 0.3,
      phone_storage: 0.3,
      digital_storage: 0.3,
      compromised_setup: 0.3,
      purchased_wallet_scam: 0.3,
    },
    noticed_later: {
      malicious_transaction: 0.3,
      cloud_storage: 1.5,
      phone_storage: 1.5,
      digital_storage: 1.5,
    },
    not_sure: {
      // Slight boost to seed phrase paths (more common)
      cloud_storage: 1.2,
      phone_storage: 1.2,
      digital_storage: 1.2,
    },
  },
  seed_backup: {
    yes: {
      // Has backup, so storage-related risks are relevant
      cloud_storage: 1.2,
      phone_storage: 1.2,
      digital_storage: 1.2,
    },
    no: {
      // No backup means less likely storage-related
      cloud_storage: 0.3,
      phone_storage: 0.3,
      digital_storage: 0.3,
      password_reuse: 0.5,
    },
    not_sure: {
      // Uncertain, slight reduction
      cloud_storage: 0.8,
      phone_storage: 0.8,
      digital_storage: 0.8,
    },
  },
  storage_method: {
    physical_secure: {
      cloud_storage: 0.1,
      phone_storage: 0.1,
      digital_storage: 0.1,
    },
    screenshot: {
      phone_storage: 10.0,
      cloud_storage: 2.0, // Photos often sync to cloud
    },
    notes_app: {
      digital_storage: 10.0,
      cloud_storage: 2.0, // Notes often sync to cloud
    },
    cloud: {
      cloud_storage: 10.0,
    },
    password_manager: {
      password_reuse: 3.0,
      cloud_storage: 0.5,
      phone_storage: 0.5,
      digital_storage: 0.5,
    },
    multiple: {
      // Multiple storage means all storage risks elevated
      cloud_storage: 1.5,
      phone_storage: 1.5,
      digital_storage: 1.5,
    },
  },
  password_unique: {
    yes: {
      password_reuse: 0.1,
    },
    no: {
      password_reuse: 10.0,
    },
    not_sure: {
      password_reuse: 2.0,
    },
  },
  copy_paste: {
    yes: {
      clipboard_compromise: 3.0,
      phishing_fake_site: 2.0,
      exposed_in_code: 2.0,
    },
    no: {
      clipboard_compromise: 0.3,
      exposed_in_code: 0.3,
    },
    not_remember: {
      clipboard_compromise: 1.0,
    },
  },
  paste_location: {
    website: {
      phishing_fake_site: 10.0,
    },
    code_file: {
      exposed_in_code: 10.0,
    },
    between_wallets: {
      clipboard_compromise: 5.0,
    },
    other: {
      // No specific adjustment
    },
  },
  downloaded_files: {
    yes: {
      social_engineering_file: 2.0,
      malicious_download: 2.0,
      phishing_email: 1.5,
      fake_job_scam: 1.5,
      malicious_extension: 1.5,
    },
    no: {
      social_engineering_file: 0.3,
      malicious_download: 0.3,
      phishing_email: 0.5,
      fake_job_scam: 0.3,
      malicious_extension: 0.5,
    },
    not_remember: {
      // Slight reduction
      social_engineering_file: 0.7,
      malicious_download: 0.7,
    },
  },
  file_type: {
    executable: {
      social_engineering_file: 2.0,
      malicious_download: 2.0,
      fake_job_scam: 2.0,
    },
    document: {
      phishing_email: 2.0,
      fake_job_scam: 1.5,
    },
    extension: {
      malicious_extension: 10.0,
    },
    script: {
      exposed_in_code: 2.0,
      fake_job_scam: 2.0,
    },
    not_remember: {
      // No specific adjustment
    },
  },
  file_source: {
    discord_telegram: {
      social_engineering_file: 10.0,
    },
    email: {
      phishing_email: 10.0,
    },
    website: {
      malicious_download: 10.0,
    },
    job_application: {
      fake_job_scam: 10.0,
    },
    other: {
      // No specific adjustment
    },
  },
  wallet_setup: {
    someone_helped: {
      compromised_setup: 10.0,
    },
    bought_wallet: {
      purchased_wallet_scam: 10.0,
    },
    self_setup: {
      compromised_setup: 0.1,
      purchased_wallet_scam: 0.1,
    },
  },
  physical_access: {
    only_me: {
      compromised_hardware: 0.3,
    },
    family: {
      compromised_hardware: 2.0,
      compromised_setup: 2.0,
    },
    roommates_others: {
      compromised_hardware: 5.0,
    },
  },
  how_found_site: {
    social_media: {
      social_engineering_file: 3.0,
      malicious_transaction: 2.0,
    },
    google_search: {
      phishing_fake_site: 2.0,
      malicious_transaction: 1.5,
    },
    dm: {
      social_engineering_file: 5.0,
      malicious_transaction: 3.0,
    },
    email: {
      phishing_email: 3.0,
      malicious_transaction: 1.5,
    },
    typed_url: {
      phishing_fake_site: 2.0, // Typosquatting risk
    },
  },
  what_trying_to_do: {
    airdrop: {
      malicious_transaction: 2.0,
      phishing_fake_site: 1.5,
    },
    nft_mint: {
      malicious_transaction: 2.0,
    },
    new_dapp: {
      malicious_transaction: 2.0,
      phishing_fake_site: 1.5,
    },
    token_transaction: {
      malicious_transaction: 1.5,
    },
    other: {
      // No specific adjustment
    },
  },
  cloud_accounts_compromised: {
    yes: {
      cloud_storage: 5.0,
      digital_storage: 2.0,
    },
    no: {
      cloud_storage: 0.8,
    },
  },
  suspected_malware: {
    yes: {
      social_engineering_file: 2.0,
      malicious_download: 2.0,
      malicious_extension: 2.0,
      clipboard_compromise: 1.5,
    },
  },
  uncompromised_keys: {
    yes_same_seed: {
      // Some keys spared under same seed → suggests transaction-level or selective attack
      malicious_transaction: 2.0,
      phishing_fake_site: 2.0,
    },
    no_all_compromised: {
      // Full sweep → more consistent with seed phrase exposure
      cloud_storage: 1.3,
      phone_storage: 1.3,
      digital_storage: 1.3,
    },
  },
  seeds_compromised: {
    two_to_five: {
      // Multiple seeds → more likely systematic / shared storage vector
      cloud_storage: 1.5,
      digital_storage: 1.5,
      social_engineering_file: 1.3,
    },
    more_than_five: {
      cloud_storage: 2.0,
      digital_storage: 2.0,
    },
  },
};

// Probability weights state
export interface ProbabilityState {
  weights: Record<DiagnosisType, number>;
  rejectedDiagnoses: DiagnosisType[];
}

// Create initial probability state based on wallet type
export function createInitialProbabilities(walletType: WalletType | null): ProbabilityState {
  // Start with base weights
  const weights = { ...BASE_WEIGHTS };

  // Apply wallet type multipliers
  if (walletType && WALLET_TYPE_MULTIPLIERS[walletType]) {
    const multipliers = WALLET_TYPE_MULTIPLIERS[walletType];
    for (const [diagnosis, multiplier] of Object.entries(multipliers)) {
      const diagnosisKey = diagnosis as DiagnosisType;
      if (weights[diagnosisKey] !== undefined) {
        weights[diagnosisKey] *= multiplier;
      }
    }
  }

  return {
    weights,
    rejectedDiagnoses: [],
  };
}

// Apply a single answer's adjustments to probabilities
export function applyAnswerAdjustment(
  state: ProbabilityState,
  questionId: string,
  answer: string
): ProbabilityState {
  const newWeights = { ...state.weights };
  const questionMultipliers = ANSWER_MULTIPLIERS[questionId];
  if (!questionMultipliers) return state;

  // Handle JSON array strings from multi-select questions
  let answers: string[];
  if (answer.startsWith('[')) {
    try {
      const parsed: unknown = JSON.parse(answer);
      answers = Array.isArray(parsed) ? parsed.map(String) : [answer];
    } catch {
      answers = [answer];
    }
  } else {
    answers = [answer];
  }

  for (const a of answers) {
    const multipliers = questionMultipliers[a];
    if (!multipliers) continue;
    for (const [diagnosis, multiplier] of Object.entries(multipliers)) {
      const key = diagnosis as DiagnosisType;
      if (newWeights[key] !== undefined) {
        newWeights[key] *= multiplier;
      }
    }
  }

  return { ...state, weights: newWeights };
}

// Apply multiple path steps to probabilities
export function applyPathSteps(
  state: ProbabilityState,
  steps: PathStep[]
): ProbabilityState {
  let currentState = state;

  for (const step of steps) {
    currentState = applyAnswerAdjustment(
      currentState,
      step.question_id,
      step.answer_selected
    );
  }

  return currentState;
}

// Mark a diagnosis as rejected (applies 0.1x multiplier)
export function rejectDiagnosis(
  state: ProbabilityState,
  diagnosisType: DiagnosisType
): ProbabilityState {
  const newWeights = { ...state.weights };
  newWeights[diagnosisType] *= 0.1;

  return {
    weights: newWeights,
    rejectedDiagnoses: [...state.rejectedDiagnoses, diagnosisType],
  };
}

// Get normalized probabilities (sum to 100%)
export function getNormalizedProbabilities(
  state: ProbabilityState
): Record<DiagnosisType, number> {
  const total = Object.values(state.weights).reduce((sum, w) => sum + w, 0);

  if (total === 0) {
    // If all weights are 0, return equal distribution
    const count = Object.keys(state.weights).length;
    const equalWeight = 100 / count;
    const result: Partial<Record<DiagnosisType, number>> = {};
    for (const key of Object.keys(state.weights)) {
      result[key as DiagnosisType] = equalWeight;
    }
    return result as Record<DiagnosisType, number>;
  }

  const result: Partial<Record<DiagnosisType, number>> = {};
  for (const [key, weight] of Object.entries(state.weights)) {
    result[key as DiagnosisType] = (weight / total) * 100;
  }

  return result as Record<DiagnosisType, number>;
}

// Get the most likely diagnosis
export function getMostLikelyDiagnosis(state: ProbabilityState): DiagnosisType {
  let maxWeight = -1;
  let mostLikely: DiagnosisType = 'unknown';

  for (const [diagnosis, weight] of Object.entries(state.weights)) {
    if (weight > maxWeight) {
      maxWeight = weight;
      mostLikely = diagnosis as DiagnosisType;
    }
  }

  return mostLikely;
}

// Get top N diagnoses by probability
export function getTopDiagnoses(
  state: ProbabilityState,
  n: number = 3
): { diagnosis: DiagnosisType; probability: number }[] {
  const normalized = getNormalizedProbabilities(state);
  const sorted = Object.entries(normalized)
    .sort(([, a], [, b]) => b - a)
    .slice(0, n)
    .map(([diagnosis, probability]) => ({
      diagnosis: diagnosis as DiagnosisType,
      probability,
    }));

  return sorted;
}

// Determine which path branch to follow based on current probabilities
// Returns 'path-a' for seed phrase compromise, 'path-b' for malicious transaction
export function suggestPathBranch(state: ProbabilityState): 'path-a' | 'path-b' {
  const maliciousTxWeight = state.weights.malicious_transaction;

  // Sum of all seed-phrase related weights
  const seedPhraseRelated =
    state.weights.cloud_storage +
    state.weights.phone_storage +
    state.weights.digital_storage +
    state.weights.password_reuse +
    state.weights.clipboard_compromise +
    state.weights.social_engineering_file +
    state.weights.phishing_fake_site +
    state.weights.exposed_in_code +
    state.weights.compromised_setup +
    state.weights.purchased_wallet_scam;

  // If malicious transaction is more likely than seed phrase paths combined,
  // go to path B, otherwise path A
  return maliciousTxWeight > seedPhraseRelated / 3 ? 'path-b' : 'path-a';
}

// Get the last fork point question ID based on rejected diagnoses
// This helps determine where to restart after a rejection
export function getLastForkPoint(
  rejectedDiagnosis: DiagnosisType,
  steps: PathStep[]
): string | null {
  // Map diagnoses to their relevant fork points
  const diagnosisToForkMap: Partial<Record<DiagnosisType, string[]>> = {
    cloud_storage: ['storage_method', 'seed_backup'],
    phone_storage: ['storage_method', 'seed_backup'],
    digital_storage: ['storage_method', 'seed_backup'],
    password_reuse: ['password_unique', 'storage_method'],
    phishing_fake_site: ['paste_location', 'copy_paste'],
    exposed_in_code: ['paste_location', 'copy_paste'],
    clipboard_compromise: ['paste_location', 'copy_paste'],
    social_engineering_file: ['file_source', 'downloaded_files'],
    phishing_email: ['file_source', 'downloaded_files'],
    malicious_download: ['file_source', 'downloaded_files'],
    fake_job_scam: ['file_source', 'downloaded_files'],
    malicious_extension: ['file_type', 'downloaded_files'],
    compromised_setup: ['wallet_setup'],
    purchased_wallet_scam: ['wallet_setup'],
    compromised_hardware: ['physical_access', 'wallet_setup'],
    malicious_transaction: ['timing'],
  };

  const relevantForks = diagnosisToForkMap[rejectedDiagnosis] || [];

  // Find the latest fork point in the user's path that we can branch from
  for (const fork of relevantForks) {
    const stepIndex = steps.findIndex((s) => s.question_id === fork);
    if (stepIndex !== -1) {
      return fork;
    }
  }

  // Default to timing if no specific fork found
  return 'timing';
}
