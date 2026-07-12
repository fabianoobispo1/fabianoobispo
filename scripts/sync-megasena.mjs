#!/usr/bin/env node
// Roda na VPS (IP não-datacenter) porque a API da Caixa retorna 403 quando a
// requisição parte de uma Convex action (IP de cloud). Este script busca o
// resultado mais recente direto na Caixa e importa via mutation pública do
// Convex (megaSena.bulkImport), replicando o mapeamento de campos de
// convex/megaSena.ts:fetchLatestFromCaixa.
//
// Uso:
//   NEXT_PUBLIC_CONVEX_URL=https://[deployment].convex.cloud node scripts/sync-megasena.mjs
//
// Cron sugerido (todo dia às 19h horário de Brasília / 22h UTC):
//   0 22 * * * cd /caminho/do/repo && /usr/bin/node scripts/sync-megasena.mjs >> /var/log/megasena-sync.log 2>&1

import { ConvexHttpClient } from 'convex/browser'

import { api } from '../convex/_generated/api.js'

const CAIXA_API_URL =
  'https://servicebus2.caixa.gov.br/portaldeloterias/api/megasena/'

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL
if (!convexUrl) {
  console.error(
    'Erro: variável de ambiente NEXT_PUBLIC_CONVEX_URL não definida.',
  )
  process.exit(1)
}

function parseDataBr(dataStr) {
  const [dia, mes, ano] = dataStr.split('/').map(Number)
  return new Date(ano, mes - 1, dia).getTime()
}

async function main() {
  const response = await fetch(CAIXA_API_URL, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      Accept: 'application/json, text/plain, */*',
      Referer: 'https://loterias.caixa.gov.br/',
    },
  })
  if (!response.ok) {
    throw new Error(`Falha ao consultar API da Caixa: ${response.status}`)
  }
  const data = await response.json()

  const dezenas = data.listaDezenas.map(Number).sort((a, b) => a - b)

  const listaRateio = data.listaRateioPremio
  const faixa6 = listaRateio.find((f) => f.faixa === 1)
  const faixa5 = listaRateio.find((f) => f.faixa === 2)
  const faixa4 = listaRateio.find((f) => f.faixa === 3)

  const resultado = {
    concurso: data.numero,
    data: parseDataBr(data.dataApuracao),
    dezenas,
    ganhadores6: faixa6?.numeroDeGanhadores ?? 0,
    rateio6: faixa6?.valorPremio ?? 0,
    ganhadores5: faixa5?.numeroDeGanhadores ?? 0,
    rateio5: faixa5?.valorPremio ?? 0,
    ganhadores4: faixa4?.numeroDeGanhadores ?? 0,
    rateio4: faixa4?.valorPremio ?? 0,
    acumulado6: data.valorAcumuladoProximoConcurso ?? 0,
    created_at: Date.now(),
  }

  const client = new ConvexHttpClient(convexUrl)
  const resultDoImport = await client.mutation(api.megaSena.bulkImport, {
    results: [resultado],
  })

  console.log(
    `Concurso ${resultado.concurso} (${data.dataApuracao}): ${resultDoImport.inserted}/${resultDoImport.recebidos} inserido(s).`,
  )
}

main().catch((err) => {
  console.error('Erro ao sincronizar Mega-Sena:', err)
  process.exit(1)
})
