import type { Metadata } from 'next'
import { JetBrains_Mono, Space_Grotesk } from 'next/font/google'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Analytics } from '@vercel/analytics/react'
import NextTopLoader from 'nextjs-toploader'

import '@uploadthing/react/styles.css'
import './globals.css'
import ConvexClientProvider from '@/providers/ConvexClientProvider'
import AuthProvider from '@/providers/AuthProvider'
import { Toaster } from '@/components/ui/toaster'
import ThemeProvider from '@/components/layout/ThemeToggle/theme-provider'
import Chatwoot from '@/components/chatwoot'

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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${fontMono.variable} ${fontSans.variable}`}
    >
      <body className="font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <NextTopLoader showSpinner={false} />
          <ConvexClientProvider>
            <AuthProvider>
              <Toaster />
              <main className="">
                {children}
                <Chatwoot />
                <Analytics />
                <SpeedInsights />
              </main>
            </AuthProvider>
          </ConvexClientProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
