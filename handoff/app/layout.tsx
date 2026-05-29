// app/layout.tsx — trecho relevante para fontes da marca
// Substitua o bloco de fontes do seu layout atual por este.

import type { Metadata } from 'next'
import { JetBrains_Mono, Space_Grotesk } from 'next/font/google'
import './globals.css'

const fontMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-mono',
  display: 'swap',
})

const fontSans = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://www.fabianoobispo.com.br'),
  title: {
    default: 'Fabiano Bispo | Desenvolvedor Full Stack',
    template: '%s · fabianoobispo',
  },
  description:
    'Desenvolvedor Full Stack especializado em criar soluções modernas e escaláveis com React, Next.js e TypeScript.',
  keywords: [
    'desenvolvedor',
    'full stack',
    'react',
    'next.js',
    'typescript',
    'portfolio',
  ],
  authors: [{ name: 'Fabiano Bispo', url: 'https://www.fabianoobispo.com.br' }],
  themeColor: '#0a1611',
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: 'https://www.fabianoobispo.com.br',
    siteName: 'fabianoobispo',
    title: 'Fabiano Bispo | Desenvolvedor Full Stack',
    description: 'Construindo software que entrega.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fabiano Bispo | Desenvolvedor Full Stack',
    description: 'Construindo software que entrega.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className={`${fontMono.variable} ${fontSans.variable}`}>
      <body className="bg-brand-forest text-brand-cream font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
