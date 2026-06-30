// Shared model for the prevention flow's wallet portfolio. Used by the
// WalletBuilder UI, the prevention questions, and the risk scorer so the three
// stay in sync. A "wallet" here is one place the user keeps crypto, plus how
// much sits in it and how it's protected — the core of an architecture-weighted
// risk read (amount alone says little; $1M in a distributed multisig is safer
// than $5k hot in a browser extension).

export type PortfolioWalletType =
  | 'browser_extension'
  | 'mobile'
  | 'hardware'
  | 'multisig'
  | 'exchange'
  | 'other';

export type AmountBand =
  | 'under_100'
  | 'range_100_1000'
  | 'range_1000_5000'
  | 'range_5000_10000'
  | 'range_10000_50000'
  | 'range_50000_100000'
  | 'over_100000';

// Independent ways multisig signer keys can be separated. These stack: a strong
// setup may be true on several axes at once (e.g. separate devices AND a key
// held by another person in another state), so this is multi-select.
export type MsigSeparation = 'devices' | 'locations' | 'people' | 'together';
export type HwSource = 'official' | 'thirdparty' | 'secondhand';

export interface WalletEntry {
  id: string; // local key for list rendering
  type: PortfolioWalletType;
  amount: AmountBand;
  // Multisig follow-ups
  msigThreshold?: number; // m in m-of-n
  msigSigners?: number; // n in m-of-n
  msigSeparation?: MsigSeparation[]; // ways the keys are separated (stacking axes)
  msigHardwareCount?: number; // how many of the n signers are hardware wallets
  // Hardware follow-up
  hwSource?: HwSource;
}

export const WALLET_TYPE_OPTIONS: { id: PortfolioWalletType; label: string; description: string }[] = [
  { id: 'browser_extension', label: 'Browser extension wallet', description: 'MetaMask, Rabby, Phantom, etc. — connected to the internet' },
  { id: 'mobile', label: 'Mobile wallet', description: 'Trust Wallet, Rainbow, Coinbase Wallet, etc. — on your phone' },
  { id: 'hardware', label: 'Hardware wallet', description: 'Ledger, Trezor, GridPlus — keys kept offline' },
  { id: 'multisig', label: 'Multisig wallet', description: 'Safe or similar — several keys needed to move funds' },
  { id: 'exchange', label: 'Exchange / custodial', description: 'Coinbase, Binance, Kraken — they hold the keys' },
  { id: 'other', label: 'Other', description: "Something that doesn't fit the above" },
];

export const AMOUNT_OPTIONS: { id: AmountBand; label: string }[] = [
  { id: 'under_100', label: 'Under $100' },
  { id: 'range_100_1000', label: '$100 – $1,000' },
  { id: 'range_1000_5000', label: '$1,000 – $5,000' },
  { id: 'range_5000_10000', label: '$5,000 – $10,000' },
  { id: 'range_10000_50000', label: '$10,000 – $50,000' },
  { id: 'range_50000_100000', label: '$50,000 – $100,000' },
  { id: 'over_100000', label: 'Over $100,000' },
];

// Rough representative dollar value per band, for relative amount-weighting.
export const AMOUNT_WEIGHT: Record<AmountBand, number> = {
  under_100: 50,
  range_100_1000: 500,
  range_1000_5000: 3000,
  range_5000_10000: 7500,
  range_10000_50000: 25000,
  range_50000_100000: 75000,
  over_100000: 250000,
};

// Short human label for a wallet, used in question and result copy.
export function walletLabel(w: WalletEntry): string {
  switch (w.type) {
    case 'browser_extension':
      return 'your browser-extension wallet';
    case 'mobile':
      return 'your mobile wallet';
    case 'hardware':
      return 'your hardware wallet';
    case 'multisig':
      return w.msigThreshold && w.msigSigners
        ? `your ${w.msigThreshold}-of-${w.msigSigners} multisig`
        : 'your multisig';
    case 'exchange':
      return 'your exchange account';
    default:
      return 'your other wallet';
  }
}

export const MSIG_SEPARATION_OPTIONS: { id: MsigSeparation; label: string; description: string }[] = [
  { id: 'devices', label: 'On separate devices', description: 'Not all on one machine' },
  { id: 'locations', label: 'In different locations', description: 'Home, office, a safe-deposit box' },
  { id: 'people', label: 'Held by different people', description: 'A family member or partner you trust' },
  { id: 'together', label: 'All kept together', description: 'Same device or same place' },
];

export const HW_SOURCE_OPTIONS: { id: HwSource; label: string; description: string }[] = [
  { id: 'official', label: 'Direct from the manufacturer', description: 'ledger.com, trezor.io, etc.' },
  { id: 'thirdparty', label: 'Third-party seller', description: 'Amazon, eBay, a reseller' },
  { id: 'secondhand', label: 'Secondhand / gifted', description: 'Used, or set up by someone else' },
];

// Parse the JSON answer the WalletBuilder stores. Returns [] on anything invalid.
export function parseWallets(value: string | string[] | undefined): WalletEntry[] {
  if (typeof value !== 'string' || !value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as WalletEntry[]) : [];
  } catch {
    return [];
  }
}

// True if any wallet is self-custodial (i.e. the user holds their own keys).
export function holdsSelfCustody(wallets: WalletEntry[]): boolean {
  return wallets.some((w) => w.type !== 'exchange');
}
