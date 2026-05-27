// app/opengraph-image.tsx
// Imagem OG (Open Graph) de 1200x630 — aparece quando alguém compartilha
// o link do site no WhatsApp, LinkedIn, Twitter, Slack, etc.

import { ImageResponse } from 'next/og'

export const alt = 'Fabiano Bispo · Desenvolvedor Full Stack'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OG() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        background: '#0a1611',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '72px 88px',
        fontFamily: 'ui-monospace, monospace',
        color: '#f4f1ea',
      }}
    >
      {/* topo: marca */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 24,
          fontWeight: 700,
          fontSize: 64,
          letterSpacing: '-0.04em',
        }}
      >
        <span style={{ color: '#10b981' }}>{'<'}</span>
        <span style={{ marginLeft: -10 }}>fb</span>
        <span style={{ color: '#10b981', opacity: 0.55, marginLeft: -10 }}>
          {'/'}
        </span>
        <span style={{ color: '#10b981', marginLeft: -10 }}>{'>'}</span>
      </div>

      {/* meio: tagline */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div
          style={{ fontSize: 24, letterSpacing: '0.22em', color: '#10b981' }}
        >
          ● FULL STACK ENGINEER
        </div>
        <div
          style={{
            fontSize: 88,
            fontWeight: 700,
            letterSpacing: '-0.03em',
            lineHeight: 1,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <span>Construindo software</span>
          <span>
            que <span style={{ color: '#10b981' }}>entrega</span>.
          </span>
        </div>
      </div>

      {/* base: stack + url */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          fontSize: 22,
          color: '#7a8a83',
        }}
      >
        <span>react · next.js · typescript · convex · node</span>
        <span style={{ color: '#10b981' }}>fabianoobispo.com.br</span>
      </div>
    </div>,
    { ...size },
  )
}
