// app/icon.tsx
// Favicon dinâmico do Next.js 15 App Router. Substitui o /favicon.ico padrão.
// Resolve para /icon em qualquer tamanho.

import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        background: '#10b981',
        borderRadius: 6,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'ui-monospace, monospace',
        fontWeight: 800,
        fontSize: 20,
        letterSpacing: '-0.06em',
        color: '#0a1611',
      }}
    >
      fb
    </div>,
    { ...size },
  )
}
