import { Flowbite, ThemeModeScript } from "flowbite-react";
import type { Metadata } from "next";
import React from "react";
import { Toaster } from "react-hot-toast";
import "./globals.css";
/* import { Byline } from './components/byline'
import { GlobalNav } from './components/global-nav'
import Provider from './components/Provider' */
import { flowbiteTheme } from "./theme";

export const metadata: Metadata = {
  title: {
    default: "Fabiano Bispo",
    template: "teste",
  },
  description: "Meu site pessoal para testes de novas tecnologias.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
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

      <html lang="pt-BR">
        <head>
          <ThemeModeScript />
        </head>
        <body>
          <section className="">
            {/* <HeaderV2 /> */}
            <Flowbite theme={{ theme: flowbiteTheme }}>{children}</Flowbite>
            {/* <Analytics />
        <SpeedInsights /> */}
            <Toaster position="top-left" reverseOrder={false} />
          </section>
        </body>
      </html>
    </>
  );
}
