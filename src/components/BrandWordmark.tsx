'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// The header wordmark adapts to context: the prevention tool reads as its own
// thing ("How secure is my crypto?") rather than the post-incident brand.
export function BrandWordmark() {
  const pathname = usePathname();
  const isRisk = pathname?.startsWith('/how-secure-is-my-crypto') || pathname?.startsWith('/r/');
  const label = isRisk ? 'How secure is my crypto?' : 'How was my wallet hacked?';
  const href = isRisk ? '/how-secure-is-my-crypto' : '/';

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
