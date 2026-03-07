'use client'

import dynamic from 'next/dynamic'
import { Barcode } from 'lucide-react'

import ThemeToggle from '@/components/layout/ThemeToggle/theme-toggle'

const BarcodeScanner = dynamic(() => import('./barcode-scanner'), {
  ssr: false,
  loading: () => (
    <div className="w-full max-w-md mx-auto min-h-[300px] rounded-xl bg-muted animate-pulse" />
  ),
})

export default function BarcodePage() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-start pt-16 px-4 pb-8">
      <div className="absolute right-4 top-4 md:right-8 md:top-8">
        <ThemeToggle />
      </div>

      <div className="flex flex-col items-center gap-2 mb-8">
        <div className="p-3 rounded-full bg-primary/10">
          <Barcode className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">
          Leitor de Código de Barras
        </h1>
        <p className="text-muted-foreground text-sm text-center">
          Aponte a câmera para um código de barras e veja as informações do
          produto em JSON
        </p>
      </div>

      <BarcodeScanner />
    </div>
  )
}
