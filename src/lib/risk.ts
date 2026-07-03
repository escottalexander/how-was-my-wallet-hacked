// Risk-scoring model for the prevention flow ("am I at risk").
//
// Separate from the diagnostic probability engine. It produces a 0-100 *security
// score* per wallet (100 = airtight, 0 = wide open) plus a holdings-weighted
// overall. Internally we accumulate exposure points, then flip to a security
// score so a high number means good — it's the shareable, motivating direction.
// Per-wallet is the point: a hardened $250k multisig and a $50 burner shouldn't
// share one verdict.

import type { DiagnosisType } from './probability';
import type { AnswerMap } from './questions';
import {
  AMOUNT_WEIGHT,
  parseWallets,
  walletLabel,
  type WalletEntry,
  type PortfolioWalletType,
  type AmountBand,
} from './wallet-portfolio';

export type SecurityBand = 'strong' | 'good' | 'fair' | 'weak';

export interface WalletIssue {
  vector: DiagnosisType;
  reason: string;
  points: number;
  // Architecture advice (e.g. "consider a multisig"), not an attack vector — it
  // still dings the score, but is excluded from the "top weak spot" lead.
  recommendation?: boolean;
}

export interface WalletRisk {
  id: string;
  type: PortfolioWalletType;
  label: string;
  amount: AmountBand;
  shareOfTotal: number; // 0-1, fraction of total holdings in this wallet
  score: number; // 0-100 security score (higher is better)
  ceiling: number; // max score this wallet type allows (i.e. with zero issues)
  band: SecurityBand;
  issues: WalletIssue[]; // weakest spots first
}

export interface RiskAssessment {
  overallScore: number; // 0-100 security score (higher is better), holdings-weighted
  band: SecurityBand;
  wallets: WalletRisk[]; // weakest (most consequential) first
  strengths: string[];
  topVector: DiagnosisType; // representative weak spot, for analytics + lead copy
}

const wk = (i: number, key: string): string => `w${i}__${key}`;
const asArray = (v: string | string[] | undefined): string[] =>
  Array.isArray(v) ? v : typeof v === 'string' && v ? [v] : [];
const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);
const clamp = (n: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, n));

// Security score (higher is better) → band.
export function securityBand(score: number): SecurityBand {
  if (score >= 76) return 'strong';
  if (score >= 56) return 'good';
  if (score >= 31) return 'fair';
  return 'weak';
}

// Inherent risk floor from a wallet's type and configuration, before hygiene.
// Structurally sound types can reach 0 here (a perfect 100): a hardware wallet
// or a well-formed multisig has no baseline handicap — their score is decided by
// how you actually use them. Always-online types (browser, mobile), custodial
// exchanges, and unknown ("other") keep a floor, so a clean one tops out ~70-74.
function architectureRisk(w: WalletEntry, phoneOs?: string): number {
  switch (w.type) {
    case 'browser_extension':
      return 30;
    case 'mobile':
      // iOS's strong app sandboxing gives it a lower baseline (ceiling 84) than
      // Android or an unknown OS (ceiling 74).
      return phoneOs === 'ios' ? 16 : 26;
    case 'exchange':
      return 26;
    case 'hardware':
      return 0; // structurally sound; weak seed handling is penalized heavily below
    case 'multisig': {
      const m = w.msigThreshold ?? 2;
      const n = w.msigSigners ?? 2;
      const hw = w.msigHardwareCount ?? 0;
      if (m < 2) return 30; // 1-of-n is effectively a single key
      const softwareCount = n - hw;
      // If software keys alone can't reach threshold, an attacker needs a
      // hardware key — much harder.
      let b = softwareCount < m ? 10 : 16 + 24 * (softwareCount / n);
      const axes = (w.msigSeparation ?? []).filter((s) => s !== 'together').length;
      b -= axes * 5; // each independent separation axis lowers correlated-compromise risk
      if (axes === 0) b += 6;
      return clamp(b, 0, 30); // a well-separated multisig can reach a perfect score
    }
    default:
      return 30;
  }
}

// How much a wallet is used for on-chain signing (so signing/dApp habits apply).
function signFactor(type: PortfolioWalletType): number {
  if (type === 'exchange') return 0;
  if (type === 'hardware') return 0.5;
  return 1;
}

function scoreWallet(
  w: WalletEntry,
  i: number,
  answers: AnswerMap,
  strengths: Set<string>,
): WalletRisk {
  const L = cap(walletLabel(w));
  const phoneOsRaw = answers[wk(i, 'phone_os')];
  const phoneOs = typeof phoneOsRaw === 'string' ? phoneOsRaw : undefined;
  const arch = architectureRisk(w, phoneOs);
  let score = arch;
  const issues: WalletIssue[] = [];
  const add = (pts: number, vector: DiagnosisType, reason: string) => {
    if (pts <= 0) return;
    score += pts;
    issues.push({ vector, reason, points: pts });
  };

  const seed = asArray(answers[wk(i, 'seed_locations')]);
  const addSeed = (scale: number) => {
    if (seed.includes('cloud')) add(40 * scale, 'cloud_storage', `${L}: recovery phrase in cloud storage`);
    if (seed.includes('phone_photo')) add(32 * scale, 'phone_storage', `${L}: recovery phrase saved as a photo`);
    if (seed.includes('file')) add(20 * scale, 'digital_storage', `${L}: recovery phrase in a file or notes app`);
    if (seed.includes('in_code')) add(40 * scale, 'exposed_in_code', `${L}: recovery phrase has been in code or a .env file`);
    if (seed.includes('password_manager')) add(5 * scale, 'digital_storage', `${L}: recovery phrase in a password manager`);
    if (seed.includes('someone_has_copy')) add(28 * scale, 'compromised_setup', `${L}: someone else has a copy of the phrase`);
    if (seed.length > 0 && seed.every((s) => s === 'offline')) strengths.add('Your recovery phrases are kept offline only');
  };

  if (w.type === 'browser_extension') {
    addSeed(1);
    const habits = asArray(answers[wk(i, 'device_habits')]);
    if (habits.includes('use_cracked_software')) add(28, 'malicious_download', `${L}: cracked software on this computer`);
    if (habits.includes('download_crypto_apps')) add(10, 'malicious_download', `${L}: you download crypto apps on this computer`);
    if (habits.includes('run_code_or_dev')) add(10, 'fake_job_scam', `${L}: you run code or do dev work on this computer`);
    if (habits.includes('install_extensions')) add(10, 'malicious_extension', `${L}: you install other browser extensions here`);
    if (habits.includes('open_files_from_people')) add(10, 'social_engineering_file', `${L}: you open files people send you here`);
    if (habits.length === 1 && habits[0] === 'none') strengths.add('You keep your hot-wallet computer clear of risky activity');
  } else if (w.type === 'mobile') {
    addSeed(1);
    const src = answers[wk(i, 'app_source')];
    if (src === 'sideloaded') add(phoneOs === 'android' ? 22 : 18, 'malicious_download', `${L}: installed outside the official app store`);
    else if (src === 'not_sure') add(6, 'malicious_download', `${L}: unsure where the app came from`);
    else if (src === 'official_store') strengths.add('You install mobile wallets from official stores');
  } else if (w.type === 'hardware') {
    // A hardware wallet's entire value is the seed staying offline. Any digital
    // copy defeats the device, so it's penalized like a hot wallet — a single
    // big hit rather than the scaled, method-by-method model, since the specific
    // digital method matters far less than the fact that it's digital at all.
    if (seed.some((s) => s === 'cloud' || s === 'in_code' || s === 'phone_photo' || s === 'file')) {
      add(72, 'digital_storage', `${L}: recovery phrase stored digitally — this defeats the hardware wallet`);
    } else if (seed.includes('password_manager')) {
      add(34, 'digital_storage', `${L}: recovery phrase in a password manager, not offline`);
    }
    if (seed.includes('someone_has_copy')) add(28, 'compromised_setup', `${L}: someone else has a copy of the phrase`);
    if (seed.length > 0 && seed.every((s) => s === 'offline')) strengths.add('Your recovery phrases are kept offline only');
    const seen = answers[wk(i, 'seed_seen')];
    if (seen === 'helped_by_someone') add(10, 'compromised_setup', `${L}: someone helped set it up and saw the backup`);
    if (seen === 'professional_or_stranger') add(18, 'compromised_setup', `${L}: a stranger or "helper" saw the backup`);
    if (seen === 'no_only_me') strengths.add('Only you have seen your hardware-wallet backups');
    if (w.hwSource === 'thirdparty') add(8, 'compromised_hardware', `${L}: bought from a third-party seller`);
    if (w.hwSource === 'secondhand') add(16, 'compromised_hardware', `${L}: bought secondhand or received pre-set-up`);
  } else if (w.type === 'multisig') {
    const m = w.msigThreshold ?? 2;
    const n = w.msigSigners ?? 2;
    const hardwareRequired = n - (w.msigHardwareCount ?? 0) < m;
    const signerScale = hardwareRequired ? 0.3 : 1;
    const signer = answers[wk(i, 'signer_exposure')];
    if (signer === 'several') add(14 * signerScale, 'malicious_download', `${L}: several signer devices see everyday use`);
    else if (signer === 'one') add(5 * signerScale, 'malicious_download', `${L}: a signer device is used day-to-day`);
    else if (signer === 'none') strengths.add('Your multisig signers stay off everyday devices');
    addSeed(0.3); // one leaked signer backup stays below threshold — others still protect
    const sep = w.msigSeparation ?? [];
    if (hardwareRequired) strengths.add('Your multisig needs a hardware key to move funds');
    else if ((w.msigHardwareCount ?? 0) > 0) strengths.add('Hardware-backed multisig signers');
    if (sep.includes('people')) strengths.add('Your multisig includes a key held by another person');
    if (sep.includes('locations')) strengths.add('Your multisig keys are split across locations');
    if (sep.includes('devices') && !sep.includes('people') && !sep.includes('locations')) {
      strengths.add('Your multisig keys are on separate devices');
    }
  } else if (w.type === 'exchange') {
    const reuse = answers.password_reuse;
    if (reuse === 'lots_reuse') add(12, 'password_reuse', `${L}: you reuse login passwords`);
    else if (reuse === 'some_reuse') add(6, 'password_reuse', `${L}: some login passwords are reused`);
    const twofa = answers.twofa;
    if (twofa === 'none') add(10, 'password_reuse', `${L}: no second factor on login`);
    else if (twofa === 'sms') add(6, 'password_reuse', `${L}: SMS 2FA is SIM-swappable`);
    const wl = answers[wk(i, 'withdrawal_whitelist')];
    if (wl === 'no') add(10, 'password_reuse', `${L}: no withdrawal allowlist enabled`);
    else if (wl === 'not_sure') add(5, 'password_reuse', `${L}: withdrawal allowlist status unknown`);
    else if (wl === 'yes') strengths.add('Withdrawal allowlist on your exchange');
  } else {
    addSeed(1);
  }

  // ---- Per-wallet usage + signing care (asked for wallets you sign with) ----
  if (w.type !== 'exchange') {
    const usage = answers[wk(i, 'usage')];
    if (usage === 'mint_airdrops') {
      add(8, 'malicious_transaction', `${L}: used for minting and airdrops`);
      add(3, 'phishing_fake_site', `${L}: airdrop hunting draws fake sites`);
    } else if (usage === 'try_new_experimental') add(8, 'malicious_transaction', `${L}: used with new, unaudited dApps`);
    else if (usage === 'defi_yield') add(4, 'malicious_transaction', `${L}: frequent DeFi token approvals`);
    else if (usage === 'swap_transfer') add(2, 'malicious_transaction', `${L}: regular swaps and transfers`);

    const care = answers[wk(i, 'signing_care')];
    if (care === 'often_blind') add(12, 'malicious_transaction', `${L}: you often blind-sign with it`);
    else if (care === 'sometimes_confirm') add(7, 'malicious_transaction', `${L}: you sometimes approve without checking`);
    else if (care === 'always_verify') strengths.add('You carefully verify what you sign');

    // Browsing + approval hygiene remain person-level habits, applied to signing wallets.
    const sf = signFactor(w.type);
    const dapp = answers.dapp_discovery;
    if (dapp === 'links_or_ads') add(12 * sf, 'phishing_fake_site', `${L}: you reach dApps via links, ads, or DMs`);
    else if (dapp === 'search_then_check' || dapp === 'not_sure') add(4 * sf, 'phishing_fake_site', `${L}: you don't always verify the site`);
    const approvals = answers.approval_hygiene;
    if (approvals === 'never' || approvals === 'dont_know') add(6 * sf, 'malicious_transaction', `${L}: old token approvals are never revoked`);
  }

  // Flip accumulated exposure into a security score (higher = better).
  const security = 100 - clamp(Math.round(score), 0, 100);
  const ceiling = 100 - clamp(Math.round(arch), 0, 100); // best this wallet type/config allows
  issues.sort((a, b) => b.points - a.points);
  return { id: w.id, type: w.type, label: walletLabel(w), amount: w.amount, shareOfTotal: 0, score: security, ceiling, band: securityBand(security), issues };
}

export function assessRisk(answers: AnswerMap): RiskAssessment {
  const wallets = parseWallets(answers.wallet_portfolio);
  const strengths = new Set<string>();

  const walletRisks = wallets.map((w, i) => scoreWallet(w, i, answers, strengths));

  // Person-level good-habit strengths (absence of the matching penalties).
  if (answers.password_reuse === 'unique_all') strengths.add('You use unique passwords everywhere');
  if (answers.twofa === 'hardware_key' || answers.twofa === 'authenticator_app') strengths.add('Strong 2FA on your key accounts');
  if (answers.dapp_discovery === 'bookmarks_verified') strengths.add('You verify URLs and use trusted bookmarks');
  if (answers.approval_hygiene === 'regularly') strengths.add('You revoke old token approvals');
  // ('You carefully verify what you sign' is added per wallet in scoreWallet.)
  const activeWallets = wallets.map((w, i) => ({ w, i })).filter((x) => x.w.type !== 'exchange');
  if (activeWallets.length > 0 && activeWallets.every((x) => answers[wk(x.i, 'usage')] === 'hold')) {
    strengths.add('You mostly hold, so your transaction exposure is low');
  }

  const hasCold = wallets.some((w) => w.type === 'hardware' || w.type === 'multisig');
  const hasHot = wallets.some((w) => w.type === 'browser_extension' || w.type === 'mobile');
  if (hasCold) strengths.add('You keep funds in a hardware or multisig wallet');
  if (hasHot && hasCold) strengths.add('Your funds are split between hot and cold storage');

  // Share of total holdings per wallet — what really makes an exposure matter
  // to *you* ($1k exposed is a fifth of a $5k stack, a rounding error of $100k).
  const totalWeight = wallets.reduce((s, w) => s + (AMOUNT_WEIGHT[w.amount] ?? 0), 0);
  walletRisks.forEach((wr) => {
    wr.shareOfTotal = totalWeight > 0 ? (AMOUNT_WEIGHT[wr.amount] ?? 0) / totalWeight : walletRisks.length ? 1 / walletRisks.length : 0;
  });

  // Portfolio flag: most of your crypto sitting behind a single hardware key,
  // with no multisig anywhere, is a single point of failure — one leaked key and
  // it's all gone, where a multisig needs several. Nudge toward a multisig. Runs
  // before the overall so it counts, and is marked as advice (not a weak-spot).
  const hasMultisig = wallets.some((w) => w.type === 'multisig');
  if (!hasMultisig) {
    walletRisks.forEach((wr) => {
      const significant = (AMOUNT_WEIGHT[wr.amount] ?? 0) >= AMOUNT_WEIGHT['range_10000_50000']; // $10k+
      if (wr.type !== 'hardware' || !significant || wr.shareOfTotal <= 0.5) return;
      const penalty = 14;
      wr.issues.push({
        vector: 'compromised_setup',
        reason: `${cap(wr.label)}: most of your crypto behind one hardware key — a single leak loses it all; a multisig needs several keys to move funds, so it is the safer choice`,
        points: penalty,
        recommendation: true,
      });
      wr.issues.sort((a, b) => b.points - a.points);
      wr.score = clamp(wr.score - penalty, 0, 100);
      wr.band = securityBand(wr.score);
    });
  }

  // Overall: weight each wallet by how much of your crypto sits in it, with a
  // slight extra emphasis on the weaker wallets so a poorly-secured wallet
  // holding a big chunk of your holdings drags the score down harder.
  const eff = (wr: WalletRisk) => (AMOUNT_WEIGHT[wr.amount] ?? 0) * (1 + 0.6 * ((100 - wr.score) / 100));
  const totalEff = walletRisks.reduce((s, wr) => s + eff(wr), 0);
  const overallScore =
    totalEff > 0
      ? Math.round(walletRisks.reduce((s, wr) => s + wr.score * eff(wr), 0) / totalEff)
      : walletRisks.length
        ? Math.round(walletRisks.reduce((s, wr) => s + wr.score, 0) / walletRisks.length)
        : 0;

  // Representative weak spot: the issue with the most amount-weighted points.
  const vectorWeight = new Map<DiagnosisType, number>();
  walletRisks.forEach((wr) => {
    const w = wallets.find((x) => x.id === wr.id);
    const aw = w ? AMOUNT_WEIGHT[w.amount] ?? 1 : 1;
    wr.issues.forEach((iss) => {
      if (iss.recommendation) return; // advice, not a weak spot
      vectorWeight.set(iss.vector, (vectorWeight.get(iss.vector) ?? 0) + iss.points * aw);
    });
  });
  const topVector =
    Array.from(vectorWeight.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'unknown';

  // Weakest, most consequential wallet first (lowest security × biggest stake).
  const sorted = [...walletRisks].sort((a, b) => {
    const wa = AMOUNT_WEIGHT[a.amount] ?? 0;
    const wb = AMOUNT_WEIGHT[b.amount] ?? 0;
    return (100 - b.score) * wb - (100 - a.score) * wa;
  });

  return {
    overallScore,
    band: securityBand(overallScore),
    wallets: sorted,
    strengths: Array.from(strengths),
    topVector,
  };
}
