// app/apple-icon.tsx
// Apple Touch Icon 180x180. Renderiza o lockup completo em quadrado.

import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        background: '#0a1611',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'ui-monospace, monospace',
        fontWeight: 700,
        fontSize: 60,
        letterSpacing: '-0.04em',
      }}
    >
      <span style={{ color: '#10b981' }}>{'<'}</span>
      <span style={{ color: '#f4f1ea' }}>fb</span>
      <span style={{ color: '#10b981', opacity: 0.55 }}>{'/'}</span>
      <span style={{ color: '#10b981' }}>{'>'}</span>
    </div>,
    { ...size },
  )
}
