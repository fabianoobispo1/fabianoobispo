'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import {
  Camera,
  CameraOff,
  Copy,
  Check,
  Barcode,
  FileJson,
  Loader2,
  PackageSearch,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const SCANNER_ID = 'barcode-reader'

interface ProductInfo {
  code: string
  status: number
  product?: {
    product_name?: string
    brands?: string
    categories?: string
    quantity?: string
    packaging?: string
    ingredients_text?: string
    nutriscore_grade?: string
    ecoscore_grade?: string
    countries?: string
    image_url?: string
    nutriments?: Record<string, number | string>
    allergens_tags?: string[]
    labels_tags?: string[]
    [key: string]: unknown
  }
  status_verbose?: string
}

const BARCODE_FORMATS = [
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.ITF,
  Html5QrcodeSupportedFormats.CODABAR,
]

const NUTRISCORE_COLORS: Record<string, string> = {
  a: 'bg-green-500',
  b: 'bg-lime-400',
  c: 'bg-yellow-400',
  d: 'bg-orange-400',
  e: 'bg-red-500',
}

function buildProductJson(info: ProductInfo) {
  const p = info.product
  if (!p) return { codigo: info.code, status: 'Produto não encontrado' }

  return {
    codigo: info.code,
    nome: p.product_name ?? null,
    marca: p.brands ?? null,
    quantidade: p.quantity ?? null,
    categorias: p.categories ?? null,
    embalagem: p.packaging ?? null,
    ingredientes: p.ingredients_text ?? null,
    nutriscore: p.nutriscore_grade?.toUpperCase() ?? null,
    ecoscore: p.ecoscore_grade?.toUpperCase() ?? null,
    paises: p.countries ?? null,
    alergenicos: p.allergens_tags?.map((t) => t.replace(/^[a-z]+:/, '')) ?? [],
    selos: p.labels_tags?.map((t) => t.replace(/^[a-z]+:/, '')) ?? [],
    nutrientes: p.nutriments
      ? Object.fromEntries(
          Object.entries(p.nutriments).filter(
            ([k]) => !k.endsWith('_unit') && !k.endsWith('_label'),
          ),
        )
      : null,
    imagem: p.image_url ?? null,
  }
}

export default function BarcodeScanner() {
  const [isScanning, setIsScanning] = useState(false)
  const [barcode, setBarcode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [copiedJson, setCopiedJson] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [productInfo, setProductInfo] = useState<ProductInfo | null>(null)
  const [isLoadingProduct, setIsLoadingProduct] = useState(false)
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
    setBarcode(null)
    setProductInfo(null)
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
      const html5QrCode = new Html5Qrcode(SCANNER_ID, {
        formatsToSupport: BARCODE_FORMATS,
        verbose: false,
      })
      scannerRef.current = html5QrCode

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 300, height: 120 },
        },
        (decodedText) => {
          if (hasScannedRef.current) return
          hasScannedRef.current = true

          setBarcode(decodedText)
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
        setError(`Erro ao iniciar câmera: ${message}`)
      }
      setIsScanning(false)
    }
  }, [])

  // Busca dados do produto no Open Food Facts quando detecta um código
  useEffect(() => {
    if (!barcode) return

    setIsLoadingProduct(true)
    setProductInfo(null)

    fetch(
      `https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(barcode)}.json`,
    )
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json() as Promise<ProductInfo>
      })
      .then((data) => setProductInfo(data))
      .catch(() =>
        setProductInfo({
          code: barcode,
          status: 0,
          status_verbose: 'Erro ao consultar base de dados de produtos.',
        }),
      )
      .finally(() => setIsLoadingProduct(false))
  }, [barcode])

  useEffect(() => {
    return () => {
      stopScanner()
    }
  }, [stopScanner])

  const productJson = productInfo ? buildProductJson(productInfo) : null
  const productFound = productInfo?.status === 1 && !!productInfo.product

  const handleCopyBarcode = async () => {
    if (!barcode) return
    await navigator.clipboard.writeText(barcode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCopyJson = async () => {
    if (!productJson) return
    await navigator.clipboard.writeText(JSON.stringify(productJson, null, 2))
    setCopiedJson(true)
    setTimeout(() => setCopiedJson(false), 2000)
  }

  const handleReset = () => {
    setBarcode(null)
    setError(null)
    setProductInfo(null)
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
        {!isScanning && !barcode && (
          <div className="absolute inset-0 rounded-xl bg-muted flex flex-col items-center justify-center gap-3 border-2 border-dashed border-border">
            <Barcode className="w-16 h-16 text-muted-foreground" />
            <p className="text-muted-foreground text-sm text-center px-6">
              Clique em <strong>Iniciar Scanner</strong> para acessar a câmera e
              ler um código de barras
            </p>
          </div>
        )}

        {/* Overlay de scanning ativo */}
        {isScanning && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center gap-4">
            {/* Moldura para código de barras (horizontal retangular) */}
            <div className="relative w-[310px] h-[130px]">
              <span className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
              <span className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
              <span className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
              <span className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />
              {/* Linha de scan animada */}
              <span className="absolute left-2 right-2 top-1/2 -translate-y-1/2 h-0.5 bg-primary/80 rounded-full animate-scan-line" />
            </div>
            <span className="text-xs text-white font-medium bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">
              Aponte para o código de barras
            </span>
          </div>
        )}
      </div>

      {/* Botão de controle */}
      {!barcode && (
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
          <CardContent className="pt-4 pb-4 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
            <p className="text-destructive text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Resultado */}
      {barcode && (
        <Card className="w-full">
          <CardContent className="pt-6 pb-6 flex flex-col gap-4">
            {/* Código lido */}
            <div className="flex items-center justify-between gap-2">
              <Badge variant="secondary" className="text-xs gap-1">
                <Barcode className="w-3 h-3" />
                Código detectado
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-xs"
                onClick={handleCopyBarcode}
              >
                {copied ? (
                  <Check className="w-3 h-3 text-green-500" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
                {copied ? 'Copiado!' : 'Copiar'}
              </Button>
            </div>

            <p className="text-sm break-all font-mono bg-muted rounded-lg p-3 text-center tracking-widest">
              {barcode}
            </p>

            {/* Loading produto */}
            {isLoadingProduct && (
              <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                Buscando informações do produto...
              </div>
            )}

            {/* Produto não encontrado */}
            {productInfo && !productFound && !isLoadingProduct && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted rounded-lg p-3">
                <PackageSearch className="w-4 h-4 shrink-0" />
                Produto não encontrado na base de dados do Open Food Facts. O
                código pode ser de um produto regional ou ainda não cadastrado.
              </div>
            )}

            {/* Informações do produto */}
            {productInfo && productFound && !isLoadingProduct && (
              <Card className="border bg-muted/30">
                <CardHeader className="pb-2 pt-4 px-4">
                  <div className="flex items-start gap-3">
                    {productInfo.product?.image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={productInfo.product.image_url}
                        alt={productInfo.product.product_name ?? 'Produto'}
                        className="w-16 h-16 object-contain rounded-lg border bg-white shrink-0"
                      />
                    )}
                    <div className="flex flex-col gap-1 min-w-0">
                      <CardTitle className="text-sm leading-tight">
                        {productInfo.product?.product_name ?? '(sem nome)'}
                      </CardTitle>
                      {productInfo.product?.brands && (
                        <p className="text-xs text-muted-foreground">
                          {productInfo.product.brands}
                        </p>
                      )}
                      {productInfo.product?.quantity && (
                        <p className="text-xs text-muted-foreground">
                          {productInfo.product.quantity}
                        </p>
                      )}
                      {productInfo.product?.nutriscore_grade && (
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-xs text-muted-foreground">
                            Nutri-Score:
                          </span>
                          <span
                            className={`text-white text-xs font-bold px-1.5 py-0.5 rounded uppercase ${NUTRISCORE_COLORS[productInfo.product.nutriscore_grade] ?? 'bg-muted-foreground'}`}
                          >
                            {productInfo.product.nutriscore_grade}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>

                {productJson && (
                  <CardContent className="px-4 pb-4 pt-0 flex flex-col gap-2">
                    {/* Ações JSON */}
                    <div className="flex gap-2 pt-2">
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
                      <pre className="text-xs bg-muted rounded-lg p-3 overflow-x-auto max-h-72 scrollbar-thin">
                        {JSON.stringify(productJson, null, 2)}
                      </pre>
                    )}
                  </CardContent>
                )}
              </Card>
            )}

            {/* Botão ler outro */}
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2"
              onClick={handleReset}
            >
              <RefreshCw className="w-4 h-4" />
              Ler outro código
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
