import { Flowbite, ThemeModeScript } from 'flowbite-react'
import Provider from './components/Provider'
import { Byline } from './components/byline'
import { GlobalNav } from './components/global-nav'
import './globals.css'
import { flowbiteTheme } from './theme'

export const metadata = {
  title: 'Fabiano o Bispo',
  description: 'Meu site pessoal para testes de novas tecnologias.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <head>
        <ThemeModeScript />
      </head>
      
        <body className="overflow-y-scroll bg-[url('/grid.svg')] pb-36">
        <Flowbite theme={{ theme: flowbiteTheme }}>  <section className="">
            <Provider>
              <GlobalNav />
              <div className="lg:pl-72">
                <div className="mx-auto max-w-7xl space-y-1 px-2 pt-20 lg:p-8">
                  <div className="rounded-lg p-px shadow-lg shadow-black/20">
                    <div className="rounded-lg bg-black"></div>
                  </div>
                  <div className="rounded-lg p-px shadow-lg shadow-black/20">
                    <div className="rounded-lg bg-black p-3.5 lg:p-6">
                      {children}
                    </div>
                  </div>
                  <Byline className="fixed sm:hidden" />
                </div>
              </div>
            </Provider>
          </section> </Flowbite>
        </body>
     
    </html>
  )
}
