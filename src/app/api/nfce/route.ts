import { NextRequest, NextResponse } from 'next/server'

export type Produto = {
  descricao: string
  quantidade: string
  unidade: string
  valorUnitario: string
  valorTotal: string
}

export type NfceData = {
  emitente?: string
  cnpj?: string
  chave?: string
  data?: string
  produtos: Produto[]
  valorTotal?: string
  error?: string
}

// SSRF protection: só permite domínios .gov.br via HTTPS
function isDomainAllowed(url: string): boolean {
  try {
    const { hostname, protocol } = new URL(url)
    return protocol === 'https:' && hostname.endsWith('.gov.br')
  } catch {
    return false
  }
}

function stripTags(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function isCurrency(s: string): boolean {
  return /\d[.,]\d{2}/.test(s)
}

function isNumeric(s: string): boolean {
  return /^\d+([.,]\d+)?$/.test(s.trim())
}

// Estratégia 1: IDs JSF com nomes dos campos NF-e (xProd, qCom, etc.)
// JSF usa IDs como "j_idt32:0:xProd" para componentes repetidos
function parseByJsfFields(html: string): Produto[] {
  const produtos: Produto[] = []
  const maxItems = 200

  for (let i = 0; i < maxItems; i++) {
    // Procura qualquer campo xProd para o índice i
    const xProdMatch = html.match(
      new RegExp(
        `id="[^"]*[^\\d]${i}[^\\d][^"]*xProd[^"]*"[^>]*>\\s*([^<]+)`,
        'i',
      ),
    )
    if (!xProdMatch) break

    const getField = (field: string) => {
      const m = html.match(
        new RegExp(
          `id="[^"]*[^\\d]${i}[^\\d][^"]*${field}[^"]*"[^>]*>\\s*([^<]+)`,
          'i',
        ),
      )
      return m ? m[1].trim() : ''
    }

    const descricao = xProdMatch[1].trim()
    if (!descricao) break

    produtos.push({
      descricao,
      quantidade: getField('qCom'),
      unidade: getField('uCom'),
      valorUnitario: getField('vUnCom'),
      valorTotal: getField('vProd'),
    })
  }

  return produtos
}

// Estratégia 2: parsing de tabelas HTML
function parseByTable(html: string): Produto[] {
  const clean = html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')

  const tables = [...clean.matchAll(/<table[\s\S]*?<\/table>/gi)]
  let best: Produto[] = []

  for (const [table] of tables) {
    // Pega apenas linhas com <td> (não thead)
    const rows = [...table.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)].filter(
      ([, r]) => /<td/i.test(r),
    )

    if (rows.length <= best.length) continue

    const parsed = rows.map(([, rowHtml]) => {
      const cells = [...rowHtml.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)]
        .map(([, c]) => stripTags(c))
        .filter(Boolean)
      return cells
    })

    // Heurística: a tabela de produtos tem pelo menos 3 colunas
    // e alguma célula com valor monetário
    const productRows = parsed.filter(
      (cells) => cells.length >= 3 && cells.some(isCurrency),
    )

    if (productRows.length === 0) continue

    const produtos = productRows.map((cells) => {
      // Determina colunas por conteúdo
      const currencyIdxs = cells
        .map((c, i) => (isCurrency(c) ? i : -1))
        .filter((i) => i >= 0)
      const numericIdxs = cells
        .map((c, i) => (isNumeric(c) && !isCurrency(c) ? i : -1))
        .filter((i) => i >= 0)

      // Descrição: célula de texto mais longa, antes dos valores
      const firstCurrency = currencyIdxs[0] ?? cells.length
      const descricaoIdx = cells
        .slice(0, firstCurrency)
        .reduce(
          (best, c, i) =>
            !isNumeric(c) && c.length > (cells[best]?.length ?? 0) ? i : best,
          0,
        )

      return {
        descricao: cells[descricaoIdx] || cells[0],
        quantidade: numericIdxs.length > 0 ? cells[numericIdxs[0]] : '',
        unidade: '',
        valorUnitario:
          currencyIdxs.length > 1
            ? cells[currencyIdxs[currencyIdxs.length - 2]]
            : '',
        valorTotal:
          currencyIdxs.length > 0
            ? cells[currencyIdxs[currencyIdxs.length - 1]]
            : '',
      }
    })

    if (produtos.length > best.length) best = produtos
  }

  return best
}

// Extrai metadados gerais da nota
function extractMeta(
  html: string,
  url: string,
): Pick<NfceData, 'chave' | 'emitente' | 'cnpj' | 'data' | 'valorTotal'> {
  const chaveMatch = url.match(/p=(\d{44})/) || html.match(/\b(\d{44})\b/)
  const chave = chaveMatch?.[1]

  const clean = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')

  // CNPJ no formato XX.XXX.XXX/XXXX-XX
  const cnpjMatch = clean.match(/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/)
  const cnpj = cnpjMatch?.[0]

  // Data no formato DD/MM/YYYY
  const dataMatch = clean.match(/\d{2}\/\d{2}\/\d{4}/)
  const data = dataMatch?.[0]

  // Valor total da nota — pega a ÚLTIMA ocorrência de "Valor total R$: R$ XX,XX"
  // para não capturar valores de produtos individuais que aparecem antes
  const totalMatches = [
    ...clean.matchAll(/[Vv]alor\s+total\s+R?\$?[:\s]*R?\$\s*([\d.,]+)/g),
  ]
  const totalMatch = totalMatches.at(-1)
  const valorTotal = totalMatch ? `R$ ${totalMatch[1]}` : undefined

  return { chave, cnpj, data, valorTotal }
}

// Limpa os campos de cada produto após o parse genérico
function normalizeProdutos(produtos: Produto[]): Produto[] {
  return produtos.map((p) => {
    // Remove " (Código: XXXXX)" do final da descrição
    const descricao = p.descricao
      .replace(/\s*\(Código:\s*\d+\)\s*$/i, '')
      .trim()

    // Extrai quantidade de "Qtde total de ítens: X.XXXX"
    const qtdMatch =
      p.valorUnitario.match(/[íi]tens?:\s*([\d.,]+)/i) ||
      p.quantidade.match(/^([\d.,]+)$/)
    const qtdRaw = qtdMatch ? qtdMatch[1] : p.quantidade
    // Remove zeros desnecessários: "1.0000" → "1", "0.2800" → "0,280"
    const quantidade = qtdRaw
      ? String(parseFloat(qtdRaw.replace(',', '.'))).replace('.', ',')
      : qtdRaw

    // Extrai valor monetário limpo de "Valor total R$: R$ XX,XX"
    const valorTotalMatch = p.valorTotal.match(/R\$\s*([\d.,]+)\s*$/)
    const valorTotal = valorTotalMatch
      ? `R$ ${valorTotalMatch[1]}`
      : p.valorTotal

    // valorUnitario: se era o campo de quantidade, zera
    const valorUnitario = /[íi]tens?:/i.test(p.valorUnitario)
      ? ''
      : p.valorUnitario

    return {
      descricao,
      quantidade,
      unidade: p.unidade,
      valorUnitario,
      valorTotal,
    }
  })
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')

  if (!url) {
    return NextResponse.json(
      { error: 'Parâmetro url não fornecido' },
      { status: 400 },
    )
  }

  if (!isDomainAllowed(url)) {
    return NextResponse.json(
      { error: 'Domínio não permitido. Apenas portais .gov.br são aceitos.' },
      { status: 400 },
    )
  }

  try {
    const resp = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'pt-BR,pt;q=0.9',
      },
      signal: AbortSignal.timeout(12000),
    })

    if (!resp.ok) {
      return NextResponse.json(
        { error: `Portal retornou status ${resp.status}` },
        { status: 502 },
      )
    }

    const html = await resp.text()

    // Tenta estratégia 1: campos JSF com nomes NF-e
    let produtos = parseByJsfFields(html)

    // Tenta estratégia 2: tabela HTML genérica
    if (produtos.length === 0) {
      produtos = parseByTable(html)
    }

    const meta = extractMeta(html, url)

    if (produtos.length === 0) {
      return NextResponse.json(
        {
          error:
            'Não foi possível extrair os produtos. O portal pode usar carregamento dinâmico.',
          debug: html.substring(0, 3000),
        },
        { status: 422 },
      )
    }

    const data: NfceData = { ...meta, produtos: normalizeProdutos(produtos) }
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json(
      {
        error: `Erro ao acessar portal: ${err instanceof Error ? err.message : String(err)}`,
      },
      { status: 500 },
    )
  }
}
