'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// The header wordmark adapts to context: the prevention tool reads as its own
// thing ("How secure is my wallet?") rather than the post-incident brand.
export function BrandWordmark() {
  const pathname = usePathname();
  const isRisk = pathname?.startsWith('/how-secure-is-my-wallet') || pathname?.startsWith('/r/');
  const label = isRisk ? 'How secure is my wallet?' : 'How was my wallet hacked?';
  const href = isRisk ? '/how-secure-is-my-wallet' : '/';

  return (
    <Link
      href={href}
      style={{ fontFamily: 'var(--font-display)' }}
      className="text-lg font-semibold tracking-tight text-[var(--foreground)] hover:text-[var(--primary)] transition-colors"
    >
      {label}
    </Link>
  );
}
