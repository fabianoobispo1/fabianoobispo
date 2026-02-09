'use client'

import { useState } from 'react'
import Image from 'next/image'

interface PixData {
  id: string
  status: string
  qr_code: string
  qr_code_base64: string
  ticket_url: string
}

export function PixPayment({
  amount,
  description,
}: {
  amount: number
  description: string
}) {
  const [pixData, setPixData] = useState<PixData | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  async function handlePay() {
    setLoading(true)
    try {
      const res = await fetch('/api/pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          description,
          email: 'cliente@email.com', // Em producao, pegue do formulario
          name: 'Nome do Cliente',
        }),
      })

      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setPixData(data)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido'
      alert('Erro: ' + message)
    } finally {
      setLoading(false)
    }
  }

  async function copyCode() {
    if (pixData?.qr_code) {
      await navigator.clipboard.writeText(pixData.qr_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (!pixData) {
    return (
      <button
        onClick={handlePay}
        disabled={loading}
        className="bg-green-600 text-white px-6 py-3 rounded-lg
                   hover:bg-green-700 disabled:opacity-50"
      >
        {loading ? 'Gerando Pix...' : `Pagar R$${amount.toFixed(2)} com Pix`}
      </button>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4 p-6 border rounded-lg">
      <h3 className="text-lg font-bold">Escaneie o QR Code</h3>

      {pixData.qr_code_base64 && (
        <Image
          src={`data:image/png;base64,${pixData.qr_code_base64}`}
          alt="QR Code Pix"
          width={256}
          height={256}
          className="w-64 h-64"
        />
      )}

      <p className="text-sm text-gray-500">Ou copie o codigo:</p>

      <button
        onClick={copyCode}
        className="bg-gray-100 px-4 py-2 rounded text-sm
                   hover:bg-gray-200 transition"
      >
        {copied ? 'Copiado!' : 'Copiar codigo Pix'}
      </button>

      <p className="text-xs text-gray-400">O pagamento expira em 30 minutos.</p>
    </div>
  )
}
