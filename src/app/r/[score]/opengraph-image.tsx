import { ImageResponse } from 'next/og';

export const alt = 'Find out how hackable you are';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
// Generated on demand per request (proven to work at runtime on Cloudflare).
export const dynamic = 'force-dynamic';

function band(score: number): { label: string; color: string } {
  if (score >= 76) return { label: 'Strong', color: '#34d399' };
  if (score >= 56) return { label: 'Good', color: '#6ee7b7' };
  if (score >= 31) return { label: 'Fair', color: '#fbbf24' };
  return { label: 'Weak', color: '#f87171' };
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
          background: 'linear-gradient(135deg, #143d30 0%, #1f6a57 100%)',
          color: '#f3efe5',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', fontSize: 30, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(243,239,229,0.7)' }}>
          Crypto wallet security check
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 64 }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', color: b.color }}>
              <span style={{ fontSize: 220, fontWeight: 800, lineHeight: 1 }}>{score}</span>
              <span style={{ fontSize: 80, fontWeight: 700, opacity: 0.6, paddingBottom: 24 }}>/100</span>
            </div>
            <div style={{ display: 'flex', fontSize: 40, fontWeight: 700, color: b.color }}>{b.label}</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div style={{ display: 'flex', fontSize: 68, fontWeight: 800, lineHeight: 1.05 }}>
              Find out how hackable you are
            </div>
            <div style={{ display: 'flex', fontSize: 32, marginTop: 16, color: 'rgba(243,239,229,0.8)' }}>
              A free 2-minute wallet security score.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', fontSize: 32, fontWeight: 600, color: 'rgba(243,239,229,0.85)' }}>
          howwasmywallethacked.com/how-hackable-are-you
        </div>
      </div>
    ),
    { ...size },
  );
}
