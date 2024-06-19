import { Flowbite, ThemeModeScript } from "flowbite-react";
import type { Metadata } from "next";
import React from "react";
import { Toaster } from "react-hot-toast";
import "./globals.css";
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
