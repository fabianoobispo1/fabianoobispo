'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import {
  Camera,
  CameraOff,
  Copy,
  ExternalLink,
  Check,
  QrCode,
  ShoppingCart,
  FileJson,
  Loader2,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { NfceData } from '@/app/api/nfce/route'

const SCANNER_ID = 'qr-reader'

function isNfceUrl(text: string): boolean {
  try {
    const { hostname, pathname, searchParams } = new URL(text)
    return (
      hostname.endsWith('.gov.br') &&
      (pathname.includes('qrcode') || searchParams.has('p'))
    )
  } catch {
    return false
  }
}

export default function QrCodeScanner() {
  const [isScanning, setIsScanning] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [copiedJson, setCopiedJson] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nfceData, setNfceData] = useState<NfceData | null>(null)
  const [isLoadingNfce, setIsLoadingNfce] = useState(false)
  const [showJson, setShowJson] = useState(false)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const hasScannedRef = useRef(false)

  const stopScanner = useCallback(async () => {
    const scanner = scannerRef.current
    if (scanner) {
      try {
        if (scanner.isScanning) await scanner.stop()
        scanner.clear()
      } catch {}
      scannerRef.current = null
    }
    setIsScanning(false)
  }, [])

  const startScanner = useCallback(async () => {
    setError(null)
    setResult(null)
    setNfceData(null)
    setShowJson(false)
    hasScannedRef.current = false

    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      setError(
        'Este browser não suporta acesso à câmera. Use HTTPS ou tente no Chrome/Safari atualizado.',
      )
      return
    }

    try {
      const html5QrCode = new Html5Qrcode(SCANNER_ID)
      scannerRef.current = html5QrCode

      await html5QrCode.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          if (hasScannedRef.current) return
          hasScannedRef.current = true

          setResult(decodedText)
          setIsScanning(false)

          const scanner = scannerRef.current
          if (scanner) {
            scanner
              .stop()
              .then(() => scanner.clear())
              .catch(() => {})
              .finally(() => {
                scannerRef.current = null
              })
          }
        },
        () => {},
      )

      setIsScanning(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      if (/permission/i.test(message) || /denied/i.test(message)) {
        setError(
          'Permissão de câmera negada. Habilite o acesso e tente novamente.',
        )
      } else if (
        /notfound/i.test(message) ||
        /not found/i.test(message) ||
        /no camera/i.test(message)
      ) {
        setError('Nenhuma câmera encontrada neste dispositivo.')
      } else if (
        /streaming not supported/i.test(message) ||
        /not supported/i.test(message)
      ) {
        setError(
          'Câmera não suportada. Certifique-se de estar acessando via HTTPS e usando browser moderno.',
        )
      } else {
        setError(`Erro: ${message}`)
      }
      setIsScanning(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-busca dados da NFC-e quando detecta URL de nota fiscal
  useEffect(() => {
    if (!result || !isNfceUrl(result)) return

    setIsLoadingNfce(true)
    setNfceData(null)

    fetch(`/api/nfce?url=${encodeURIComponent(result)}`)
      .then((r) => r.json())
      .then((data: NfceData) => setNfceData(data))
      .catch((err) => setNfceData({ produtos: [], error: String(err) }))
      .finally(() => setIsLoadingNfce(false))
  }, [result])

  useEffect(() => {
    return () => {
      stopScanner()
    }
  }, [stopScanner])

  const isLink = result
    ? /^https?:\/\//i.test(result) || /^www\./i.test(result)
    : false

  const isNfce = result ? isNfceUrl(result) : false

  const handleCopy = async () => {
    if (!result) return
    await navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCopyJson = async () => {
    if (!nfceData) return
    await navigator.clipboard.writeText(JSON.stringify(nfceData, null, 2))
    setCopiedJson(true)
    setTimeout(() => setCopiedJson(false), 2000)
  }

  const handleReset = () => {
    setResult(null)
    setError(null)
    setNfceData(null)
    setShowJson(false)
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-md mx-auto">
      {/* Área da câmera */}
      <div className="w-full relative min-h-[300px]">
        <div
          id={SCANNER_ID}
          className="w-full rounded-xl overflow-hidden bg-muted min-h-[300px]"
        />
        {!isScanning && !result && (
          <div className="absolute inset-0 rounded-xl bg-muted flex flex-col items-center justify-center gap-3 border-2 border-dashed border-border">
            <QrCode className="w-16 h-16 text-muted-foreground" />
            <p className="text-muted-foreground text-sm text-center px-6">
              Clique em <strong>Iniciar Scanner</strong> para acessar a câmera e
              ler um QR Code
            </p>
          </div>
        )}

        {/* Overlay de scanning ativo */}
        {isScanning && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center gap-3">
            {/* Moldura animada */}
            <div className="relative w-[260px] h-[260px]">
              {/* Cantos */}
              <span className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
              <span className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
              <span className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
              <span className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />
              {/* Linha de scan animada */}
              <span className="absolute left-2 right-2 h-0.5 bg-primary/80 rounded-full animate-scan-line" />
            </div>
            <span className="text-xs text-white font-medium bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">
              Aponte para o QR Code
            </span>
          </div>
        )}
      </div>

      {/* Botão de controle */}
      {!result && (
        <Button
          onClick={isScanning ? stopScanner : startScanner}
          size="lg"
          variant={isScanning ? 'destructive' : 'default'}
          className="w-full max-w-xs gap-2"
        >
          {isScanning ? (
            <>
              <CameraOff className="w-5 h-5" />
              Parar Scanner
            </>
          ) : (
            <>
              <Camera className="w-5 h-5" />
              Iniciar Scanner
            </>
          )}
        </Button>
      )}

      {/* Erro */}
      {error && (
        <Card className="w-full border-destructive bg-destructive/10">
          <CardContent className="pt-4 pb-4">
            <p className="text-destructive text-sm text-center">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Resultado */}
      {result && (
        <Card className="w-full">
          <CardContent className="pt-6 pb-6 flex flex-col gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant={isNfce ? 'default' : 'secondary'}
                className="text-xs"
              >
                {isNfce
                  ? '🧾 NFC-e / Nota Fiscal'
                  : isLink
                    ? 'Link detectado'
                    : 'Texto detectado'}
              </Badge>
            </div>

            <p className="text-xs break-all font-mono bg-muted rounded-lg p-3 text-muted-foreground">
              {result}
            </p>

            {/* Lista de produtos NFC-e */}
            {isNfce && (
              <div className="flex flex-col gap-3">
                {isLoadingNfce && (
                  <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Buscando lista de compras...
                  </div>
                )}

                {nfceData?.error && !isLoadingNfce && (
                  <div className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">
                    {nfceData.error}
                    <div className="mt-2">
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="gap-1"
                      >
                        <a
                          href={result}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Abrir portal da nota
                        </a>
                      </Button>
                    </div>
                  </div>
                )}

                {nfceData && nfceData.produtos.length > 0 && !isLoadingNfce && (
                  <Card className="border">
                    <CardHeader className="pb-2 pt-4 px-4">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <ShoppingCart className="w-4 h-4" />
                        Lista de compras
                        {nfceData.emitente && (
                          <span className="font-normal text-muted-foreground truncate">
                            — {nfceData.emitente}
                          </span>
                        )}
                      </CardTitle>
                      {(nfceData.cnpj || nfceData.data) && (
                        <p className="text-xs text-muted-foreground">
                          {nfceData.cnpj && `CNPJ: ${nfceData.cnpj}`}
                          {nfceData.cnpj && nfceData.data && ' · '}
                          {nfceData.data && `Data: ${nfceData.data}`}
                        </p>
                      )}
                    </CardHeader>
                    <CardContent className="px-0 pb-4">
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b bg-muted/50">
                              <th className="text-left px-4 py-2 font-medium">
                                Produto
                              </th>
                              <th className="text-right px-2 py-2 font-medium whitespace-nowrap">
                                Qtd
                              </th>
                              <th className="text-right px-4 py-2 font-medium whitespace-nowrap">
                                Total
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {nfceData.produtos.map((p, i) => (
                              <tr key={i} className="border-b last:border-0">
                                <td className="px-4 py-2">{p.descricao}</td>
                                <td className="text-right px-2 py-2 text-muted-foreground whitespace-nowrap">
                                  {p.quantidade}
                                  {p.unidade ? ` ${p.unidade}` : ''}
                                </td>
                                <td className="text-right px-4 py-2 font-mono whitespace-nowrap">
                                  {p.valorTotal}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          {nfceData.valorTotal && (
                            <tfoot>
                              <tr className="bg-muted/50 font-semibold">
                                <td colSpan={2} className="px-4 py-2">
                                  Total
                                </td>
                                <td className="text-right px-4 py-2 font-mono">
                                  {nfceData.valorTotal}
                                </td>
                              </tr>
                            </tfoot>
                          )}
                        </table>
                      </div>

                      {/* Ações JSON */}
                      <div className="flex gap-2 px-4 pt-3">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 text-xs"
                          onClick={handleCopyJson}
                        >
                          {copiedJson ? (
                            <>
                              <Check className="w-3 h-3 text-green-500" />
                              Copiado!
                            </>
                          ) : (
                            <>
                              <FileJson className="w-3 h-3" />
                              Copiar JSON
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="gap-1 text-xs"
                          onClick={() => setShowJson((v) => !v)}
                        >
                          {showJson ? 'Ocultar JSON' : 'Ver JSON'}
                        </Button>
                      </div>

                      {showJson && (
                        <pre className="mx-4 mt-2 text-xs bg-muted rounded-lg p-3 overflow-x-auto max-h-60">
                          {JSON.stringify(nfceData, null, 2)}
                        </pre>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Ações gerais */}
            <div className="flex flex-col gap-2">
              {isLink && (
                <Button asChild variant="default" className="w-full gap-2">
                  <a
                    href={
                      result.startsWith('www') ? `https://${result}` : result
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="w-4 h-4" />
                    {isNfce ? 'Abrir portal da nota' : 'Abrir link'}
                  </a>
                </Button>
              )}

              <Button
                variant="outline"
                onClick={handleCopy}
                className="w-full gap-2"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-green-500" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copiar URL
                  </>
                )}
              </Button>

              <Button
                variant="ghost"
                onClick={handleReset}
                className="w-full gap-2"
              >
                <Camera className="w-4 h-4" />
                Ler outro QR Code
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
