import { ImageResponse } from 'next/og';

export const alt = 'Can you beat my wallet security score?';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
// Generated on demand per request (proven to work at runtime on Cloudflare).
export const dynamic = 'force-dynamic';

function band(score: number): { label: string; color: string } {
  // Colors tuned to read on the warm "field guide" paper background.
  if (score >= 76) return { label: 'strong', color: '#1f6a57' }; // evergreen
  if (score >= 56) return { label: 'good', color: '#3f8f6f' };
  if (score >= 31) return { label: 'fair', color: '#c4673a' }; // terracotta
  return { label: 'weak', color: '#b3402f' }; // deep rust-red
}

export default async function Image({ params }: { params: Promise<{ score: string }> }) {
  const { score: raw } = await params;
  const score = Math.max(0, Math.min(100, parseInt(raw, 10) || 0));
  const b = band(score);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 80px',
          background: 'linear-gradient(140deg, #f6f2e9 0%, #efe7d6 55%, #e8dfcc 100%)',
          color: '#221f19',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Main row: the score on the left, the personal claim on the right. */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 64, flex: 1 }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', color: b.color }}>
              <span style={{ fontSize: 220, fontWeight: 600, lineHeight: 1, letterSpacing: -6 }}>{score}</span>
              <span style={{ fontSize: 80, fontWeight: 400, opacity: 0.55, paddingBottom: 24 }}>/100</span>
            </div>
            <div style={{ display: 'flex', fontSize: 34, fontWeight: 500, color: b.color, letterSpacing: -0.5, textTransform: 'capitalize' }}>
              {b.label}
            </div>
          </div>

          {/* Kept a step smaller than the score so the eye lands left first. */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', fontSize: 52, fontWeight: 600, lineHeight: 1.1, letterSpacing: -1.2 }}>
              I scored {score}/100 on wallet security.
            </div>
          </div>
        </div>

        {/* Footer: the challenge CTA leads, the link sits quietly beneath it. */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: 52, fontWeight: 700, color: '#1f6a57', letterSpacing: -0.8 }}>
            Can you beat my score? →
          </div>
          <div style={{ display: 'flex', fontSize: 27, fontWeight: 400, marginTop: 14, color: '#6f6a5d' }}>
            howwasmywallethacked.com/how-secure-is-my-crypto
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      // The card is deterministic per score, so let crawlers/CDNs cache it —
      // fast, reliable link-preview unfurls (Telegram, Farcaster, Discord…).
      headers: {
        'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=604800',
      },
    },
  );
}
