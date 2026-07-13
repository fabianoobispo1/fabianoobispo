#!/usr/bin/env node
// A API oficial da Caixa (servicebus2.caixa.gov.br) retorna 403 pra qualquer
// IP de datacenter/cloud (testado: Convex action e até uma VPS própria na
// Contabo levam 403; só funciona de IP residencial). Por isso usamos o
// espelho comunitário loteriascaixa-api, que replica o mesmo formato de
// premiação (campo `faixa`: 1 = 6 acertos, 2 = 5 acertos, 3 = 4 acertos) e o
// mesmo campo `valorAcumuladoProximoConcurso`.
//
// Uso:
//   NEXT_PUBLIC_CONVEX_URL=https://[deployment].convex.cloud node scripts/sync-megasena.mjs
//
// Cron sugerido (todo dia às 22h no fuso local do servidor — se for
// America/Sao_Paulo, roda depois do sorteio das ~20h):
//   0 22 * * * docker run --rm --env-file /opt/megasena-sync/.env -v /opt/megasena-sync:/app -w /app node:20-alpine node sync-megasena.mjs >> /var/log/megasena-sync.log 2>&1

import { ConvexHttpClient } from 'convex/browser'
import { anyApi } from 'convex/server'

// anyApi resolve `api.megaSena.bulkImport` dinamicamente (mesma coisa que o
// convex/_generated/api.js do projeto faz). Evita depender do restante do
// repo, então este script pode ser copiado sozinho pra VPS.
const api = anyApi

const MEGASENA_API_URL =
  'https://loteriascaixa-api.herokuapp.com/api/megasena/latest'

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
  const response = await fetch(MEGASENA_API_URL)
  if (!response.ok) {
    throw new Error(`Falha ao consultar loteriascaixa-api: ${response.status}`)
  }
  const data = await response.json()

  const dezenas = data.dezenas.map(Number).sort((a, b) => a - b)

  const premiacoes = data.premiacoes
  const faixa6 = premiacoes.find((f) => f.faixa === 1)
  const faixa5 = premiacoes.find((f) => f.faixa === 2)
  const faixa4 = premiacoes.find((f) => f.faixa === 3)

  const resultado = {
    concurso: data.concurso,
    data: parseDataBr(data.data),
    dezenas,
    ganhadores6: faixa6?.ganhadores ?? 0,
    rateio6: faixa6?.valorPremio ?? 0,
    ganhadores5: faixa5?.ganhadores ?? 0,
    rateio5: faixa5?.valorPremio ?? 0,
    ganhadores4: faixa4?.ganhadores ?? 0,
    rateio4: faixa4?.valorPremio ?? 0,
    acumulado6: data.valorAcumuladoProximoConcurso ?? 0,
    created_at: Date.now(),
  }

  const client = new ConvexHttpClient(convexUrl)
  const resultDoImport = await client.mutation(api.megaSena.bulkImport, {
    results: [resultado],
  })

  console.log(
    `Concurso ${resultado.concurso} (${data.data}): ${resultDoImport.inserted}/${resultDoImport.recebidos} inserido(s).`,
  )
}

main().catch((err) => {
  console.error('Erro ao sincronizar Mega-Sena:', err)
  process.exit(1)
})
