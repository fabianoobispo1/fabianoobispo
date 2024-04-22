import './globals.css'
import type { Metadata } from 'next'
import { Toaster } from 'react-hot-toast'
import { Roboto } from 'next/font/google'
import { Byline } from './components/byline'
import { GlobalNav } from './components/global-nav'

import Provider from './components/Provider'

const roboto = Roboto({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto',
})

export const metadata: Metadata = {
  title: {
    default: 'Fabiano Bispo',
    template: 'teste',
  },
  description: 'Meu site pessoal para testes de novas tecnologias.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {/* <html lang="en" className={`${roboto.variable}`}>
      <body className="overflow-y-scroll bg-[url('/grid.svg')] pb-36">
        <Provider>
          <GlobalNav />
          <div className="lg:pl-72">
            <div className="mx-auto max-w-7xl space-y-1 px-2 pt-20 lg:px-8 lg:py-8">
              <div className="bg-vc-border-gradient rounded-lg p-px shadow-lg shadow-black/20">
                <div className="rounded-lg bg-black"></div>
              </div>
              <div className="bg-vc-border-gradient rounded-lg p-px shadow-lg shadow-black/20">
                <div className="rounded-lg bg-black p-3.5 lg:p-6">
                  {children}
                </div>
              </div>
              <Byline className="fixed sm:hidden" />
            </div>
          </div>
        </Provider>
      </body>
    </html> */}

      <html lang="pt-BR" className={`${roboto.variable}`}>
        <body className="overflow-y-scroll bg-[url('/grid.svg')] pb-36">
          {/* <HeaderV2 /> */}
          {children}
          {/* <Analytics />
     <SpeedInsights /> */}
          <Toaster />
        </body>
      </html>
    </>
  )
}
