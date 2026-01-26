'use client';

import { useState } from 'react';
import type { WalletType } from '@/lib/types';

interface WalletOption {
  id: string;
  label: string;
}

interface WalletCategory {
  type: WalletType;
  label: string;
  description: string;
  wallets: WalletOption[];
}

const WALLET_CATEGORIES: WalletCategory[] = [
  {
    type: 'browser_extension',
    label: 'Browser Extension',
    description: 'Wallet extension in your browser',
    wallets: [
      { id: 'metamask', label: 'MetaMask' },
      { id: 'rabby', label: 'Rabby' },
      { id: 'coinbase', label: 'Coinbase Wallet' },
      { id: 'phantom', label: 'Phantom' },
      { id: 'other_extension', label: 'Other extension' },
    ],
  },
  {
    type: 'mobile',
    label: 'Mobile',
    description: 'Wallet app on your phone',
    wallets: [
      { id: 'trust', label: 'Trust Wallet' },
      { id: 'rainbow', label: 'Rainbow' },
      { id: 'metamask_mobile', label: 'MetaMask Mobile' },
      { id: 'coinbase_mobile', label: 'Coinbase Wallet Mobile' },
      { id: 'other_mobile', label: 'Other mobile wallet' },
    ],
  },
  {
    type: 'hardware',
    label: 'Hardware',
    description: 'Physical device like Ledger or Trezor',
    wallets: [
      { id: 'ledger', label: 'Ledger' },
      { id: 'trezor', label: 'Trezor' },
      { id: 'gridplus', label: 'GridPlus' },
      { id: 'other_hardware', label: 'Other hardware wallet' },
    ],
  },
  {
    type: 'other',
    label: 'Other',
    description: 'Exchange, custodial, or other wallet type',
    wallets: [
      { id: 'exchange', label: 'Exchange wallet (Binance, Coinbase, etc.)' },
      { id: 'multisig', label: 'Multisig (Safe, etc.)' },
      { id: 'other_type', label: 'Something else' },
    ],
  },
];

interface WalletSelectionProps {
  onSelect: (walletType: WalletType, walletSpecific: string) => void;
  isSubmitting?: boolean;
}

export function WalletSelection({ onSelect, isSubmitting }: WalletSelectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<WalletType | null>(null);
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);

  const handleCategorySelect = (type: WalletType) => {
    setSelectedCategory(type);
    setSelectedWallet(null);
  };

  const handleWalletSelect = (walletId: string) => {
    setSelectedWallet(walletId);
  };

  const handleContinue = () => {
    if (selectedCategory && selectedWallet) {
      onSelect(selectedCategory, selectedWallet);
    }
  };

  const activeCategory = WALLET_CATEGORIES.find((c) => c.type === selectedCategory);

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-[var(--foreground)]">
          What type of wallet were you using?
        </h1>
        <p className="mt-2 text-[var(--text-muted)]">
          This helps us ask the most relevant questions for your situation.
        </p>
      </div>

      {/* Category Selection */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {WALLET_CATEGORIES.map((category) => (
          <button
            key={category.type}
            type="button"
            onClick={() => handleCategorySelect(category.type)}
            disabled={isSubmitting}
            className={`
              min-h-[72px] rounded-xl border-2 p-4 text-left
              transition-all duration-200
              ${
                selectedCategory === category.type
                  ? 'border-[var(--primary)] bg-[var(--primary)]/10'
                  : 'border-[var(--border)] bg-[var(--card-bg)] hover:border-[var(--primary)]/50'
              }
              ${isSubmitting ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
            `}
          >
            <div className="font-medium text-[var(--foreground)]">{category.label}</div>
            <div className="mt-1 text-sm text-[var(--text-muted)]">{category.description}</div>
          </button>
        ))}
      </div>

      {/* Specific Wallet Selection */}
      {activeCategory && (
        <div className="animate-fadeIn space-y-4">
          <h2 className="text-lg font-medium text-[var(--foreground)]">
            Which {activeCategory.label.toLowerCase()} wallet?
          </h2>
          <div className="grid grid-cols-1 gap-2">
            {activeCategory.wallets.map((wallet) => (
              <button
                key={wallet.id}
                type="button"
                onClick={() => handleWalletSelect(wallet.id)}
                disabled={isSubmitting}
                className={`
                  min-h-[52px] rounded-lg border-2 px-4 py-3 text-left
                  transition-all duration-200
                  ${
                    selectedWallet === wallet.id
                      ? 'border-[var(--primary)] bg-[var(--primary)]/10'
                      : 'border-[var(--border)] bg-[var(--card-bg)] hover:border-[var(--primary)]/50'
                  }
                  ${isSubmitting ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                `}
              >
                <span className="text-[var(--foreground)]">{wallet.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Continue Button */}
      {selectedWallet && (
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
