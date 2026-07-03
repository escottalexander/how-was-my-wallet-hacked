import { ImageResponse } from 'next/og';

export const alt = 'How secure is my wallet? Get your crypto wallet security score';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Static branded card for the tool page. Shares the warm "field guide" look
// with the per-score /r/[score] card so the two read as one family.
export default function Image() {
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
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center' }}>
          <div style={{ display: 'flex', fontSize: 84, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2 }}>
            How secure is my wallet?
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', fontSize: 36, fontWeight: 400, marginTop: 24, color: '#6f6a5d', letterSpacing: -0.4 }}>
            Get your 0–100 crypto wallet security score and see exactly where you&apos;re exposed.
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: 34, fontWeight: 600, color: '#1f6a57', letterSpacing: -0.5 }}>
            No wallet connection. No balances shared.
          </div>
          <div style={{ display: 'flex', fontSize: 27, fontWeight: 400, marginTop: 12, color: '#6f6a5d' }}>
            howwasmywallethacked.com/how-secure-is-my-wallet
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
