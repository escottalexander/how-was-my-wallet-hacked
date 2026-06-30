// Database types for HowWasIHacked
// Based on PRD data model - no PII stored

export type WalletType = 'browser_extension' | 'mobile' | 'hardware' | 'other';

// Which flow a path attempt belongs to: the post-incident diagnostic ("how was
// I hacked") or the preventative risk check ("am I at risk").
export type FlowMode = 'diagnostic' | 'prevention';

export type ValueRange =
  | 'under_100'
  | 'range_100_1000'
  | 'range_1000_10000'
  | 'range_10000_100000'
  | 'over_100000'
  | 'prefer_not_to_say';

export interface Session {
  id: string;
  user_hash: string; // Hash(IP + User Agent) for repeat visitor identification
  created_at: string;
  wallet_type: WalletType | null;
  wallet_specific: string | null;
  value_range: ValueRange | null;
}

export interface PathAttempt {
  id: string;
  session_id: string;
  attempt_number: number;
  mode: FlowMode;
  created_at: string;
  completed_at: string | null;
}

export interface ClusterStat {
  wallet: string;
  generation_period: string;
  diagnosis: string;
  count: number;
  first_seen: string;
  last_seen: string;
}

export interface PathStep {
  id: string;
  path_attempt_id: string;
  step_order: number;
  question_id: string;
  answer_selected: string;
  created_at: string;
}

export interface Diagnosis {
  id: string;
  path_attempt_id: string;
  diagnosis_type: string;
  accepted: boolean;
  clicked_learn: boolean;
  clicked_hwr: boolean;
  created_at: string;
}
