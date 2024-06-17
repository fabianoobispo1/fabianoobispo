import './globals.css'
import type { Metadata } from 'next'
import { Flowbite, ThemeModeScript } from "flowbite-react";
import { Byline } from './components/byline'
import { GlobalNav } from './components/global-nav'
import { flowbiteTheme } from "./theme";
import Provider from './components/Provider'


export const metadata = {
  title:'Fabiano o Bispo',
  description: 'Meu site pessoal para testes de novas tecnologias.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    
    <html lang="pt-BR" className={``}>
      <head>
      <ThemeModeScript />
      </head>
      <Flowbite theme={{ theme: flowbiteTheme }}>
      <body className="overflow-y-scroll bg-[url('/grid.svg')] pb-36">
      <section className="">
      
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
     
        </section>
      </body>   </Flowbite>
    </html>
  )
}
