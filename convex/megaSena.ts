import { v } from 'convex/values'

import {
  action,
  mutation,
  query,
  type DatabaseReader,
} from './_generated/server'
import { api } from './_generated/api'
import { megaSenaResultSchema } from './schema'
import type { Doc } from './_generated/dataModel'

// A API oficial da Caixa (servicebus2.caixa.gov.br) retorna 403 pra
// requisições vindas de IP de datacenter/cloud, incluindo as Convex actions.
// Usamos o espelho comunitário abaixo, que replica o mesmo formato de campos.
const MEGASENA_API_URL =
  'https://loteriascaixa-api.herokuapp.com/api/megasena/latest'

// Dispara um e-mail (via SendCloud) quando o valor estimado do próximo
// concurso passa desse limiar. Configurável via env var do deployment do Convex
// (`npx convex env set MEGASENA_LIMIAR_ALERTA <valor>`) pra ajustar sem
// precisar redeploy caso fique barulhento.
function limiarAlertaAcumulado(): number {
  const valor = Number(process.env.MEGASENA_LIMIAR_ALERTA)
  return Number.isFinite(valor) && valor > 0 ? valor : 100_000_000
}

function parseDataBr(dataStr: string): number {
  const [dia, mes, ano] = dataStr.split('/').map(Number)
  return new Date(ano, mes - 1, dia).getTime()
}

function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

async function buscarPorConcurso(
  db: DatabaseReader,
  concurso: number,
): Promise<Doc<'megaSenaResult'> | null> {
  return await db
    .query('megaSenaResult')
    .withIndex('by_concurso', (q) => q.eq('concurso', concurso))
    .unique()
}

export const bulkImport = mutation({
  args: {
    results: v.array(v.object(megaSenaResultSchema)),
  },
  handler: async ({ db }, { results }) => {
    let inserted = 0
    for (const result of results) {
      const existing = await buscarPorConcurso(db, result.concurso)
      if (existing) continue
      await db.insert('megaSenaResult', result)
      inserted++
    }
    return { inserted, recebidos: results.length }
  },
})

// Usada pela action de atualização: diferente de bulkImport (que ignora
// concurso já existente), aqui o registro do concurso mais recente é
// atualizado se já existir — é como o campo `proximoConcurso` (que descreve o
// sorteio seguinte) chega até ficar atualizado dia a dia. Preserva
// `created_at` (data da 1ª importação) e não deixa um campo proximo*
// ausente na resposta da API apagar um valor já salvo.
export const upsertLatest = mutation({
  args: megaSenaResultSchema,
  handler: async ({ db }, args) => {
    const existing = await buscarPorConcurso(db, args.concurso)
    if (existing) {
      await db.patch(existing._id, {
        ...args,
        created_at: existing.created_at,
        proximoConcurso: args.proximoConcurso ?? existing.proximoConcurso,
        dataProximoConcurso:
          args.dataProximoConcurso ?? existing.dataProximoConcurso,
        valorEstimadoProximoConcurso:
          args.valorEstimadoProximoConcurso ??
          existing.valorEstimadoProximoConcurso,
      })
      return {
        inserted: 0,
        recebidos: 1,
        estimativaAnterior: existing.valorEstimadoProximoConcurso ?? 0,
      }
    }
    await db.insert('megaSenaResult', args)
    return { inserted: 1, recebidos: 1, estimativaAnterior: 0 }
  },
})

export const create = mutation({
  args: megaSenaResultSchema,
  handler: async ({ db }, args) => {
    const existing = await buscarPorConcurso(db, args.concurso)
    if (existing) throw new Error(`Concurso ${args.concurso} já cadastrado`)
    return await db.insert('megaSenaResult', args)
  },
})

export const getAll = query({
  args: {},
  handler: async ({ db }) => {
    return await db.query('megaSenaResult').withIndex('by_concurso').collect()
  },
})

export const getLatest = query({
  args: { limit: v.optional(v.number()) },
  handler: async ({ db }, { limit }) => {
    return await db
      .query('megaSenaResult')
      .withIndex('by_concurso')
      .order('desc')
      .take(limit ?? 10)
  },
})

export const getStats = query({
  args: {},
  handler: async ({ db }) => {
    const resultados = await db
      .query('megaSenaResult')
      .withIndex('by_concurso')
      .collect()

    const frequenciaMap = new Map<number, number>()
    const ultimaAparicaoMap = new Map<number, number>()
    const paresMap = new Map<string, number>()
    const somaHistogramaMap = new Map<string, number>()
    const paridadeMap = new Map<number, number>()

    for (let dezena = 1; dezena <= 60; dezena++) {
      frequenciaMap.set(dezena, 0)
    }

    let maiorConcurso = 0

    for (const resultado of resultados) {
      maiorConcurso = Math.max(maiorConcurso, resultado.concurso)

      for (const dezena of resultado.dezenas) {
        frequenciaMap.set(dezena, (frequenciaMap.get(dezena) ?? 0) + 1)
        ultimaAparicaoMap.set(dezena, resultado.concurso)
      }

      for (let i = 0; i < resultado.dezenas.length; i++) {
        for (let j = i + 1; j < resultado.dezenas.length; j++) {
          const par = `${resultado.dezenas[i]}-${resultado.dezenas[j]}`
          paresMap.set(par, (paresMap.get(par) ?? 0) + 1)
        }
      }

      const soma = resultado.dezenas.reduce((acc, n) => acc + n, 0)
      const faixaInicio = Math.floor((soma - 21) / 20) * 20 + 21
      const faixa = `${faixaInicio}-${faixaInicio + 19}`
      somaHistogramaMap.set(faixa, (somaHistogramaMap.get(faixa) ?? 0) + 1)

      const pares = resultado.dezenas.filter((n) => n % 2 === 0).length
      paridadeMap.set(pares, (paridadeMap.get(pares) ?? 0) + 1)
    }

    const frequencia = Array.from(frequenciaMap.entries())
      .map(([dezena, quantidade]) => ({ dezena, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade)

    const atraso = Array.from(frequenciaMap.keys())
      .map((dezena) => ({
        dezena,
        concursosSemSair: maiorConcurso - (ultimaAparicaoMap.get(dezena) ?? 0),
      }))
      .sort((a, b) => b.concursosSemSair - a.concursosSemSair)

    const paresFrequentes = Array.from(paresMap.entries())
      .map(([par, quantidade]) => ({
        par: par.split('-').map(Number) as [number, number],
        quantidade,
      }))
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 15)

    const somaHistograma = Array.from(somaHistogramaMap.entries())
      .map(([faixa, quantidade]) => ({ faixa, quantidade }))
      .sort(
        (a, b) => Number(a.faixa.split('-')[0]) - Number(b.faixa.split('-')[0]),
      )

    const paridade = Array.from(paridadeMap.entries())
      .map(([pares, quantidade]) => ({ pares, quantidade }))
      .sort((a, b) => a.pares - b.pares)

    return {
      totalConcursos: resultados.length,
      frequencia,
      atraso,
      paresFrequentes,
      somaHistograma,
      paridade,
    }
  },
})

export const conferirAposta = query({
  args: { dezenas: v.array(v.number()) },
  handler: async ({ db }, { dezenas }) => {
    if (dezenas.length !== 6) {
      throw new Error('Informe exatamente 6 dezenas')
    }
    const apostaSet = new Set(dezenas)

    const resultados = await db
      .query('megaSenaResult')
      .withIndex('by_concurso')
      .collect()

    const distribuicaoMap = new Map<number, number>()
    for (let acertos = 0; acertos <= 6; acertos++) {
      distribuicaoMap.set(acertos, 0)
    }

    let maiorConcurso = 0
    let acertosUltimoConcurso = 0
    let melhorResultado: { concurso: number; acertos: number } | null = null

    for (const resultado of resultados) {
      const acertos = resultado.dezenas.filter((d) => apostaSet.has(d)).length
      distribuicaoMap.set(acertos, (distribuicaoMap.get(acertos) ?? 0) + 1)

      if (resultado.concurso > maiorConcurso) {
        maiorConcurso = resultado.concurso
        acertosUltimoConcurso = acertos
      }

      if (!melhorResultado || acertos > melhorResultado.acertos) {
        melhorResultado = { concurso: resultado.concurso, acertos }
      }
    }

    const distribuicaoHistorica = Array.from(distribuicaoMap.entries())
      .map(([acertos, quantidade]) => ({ acertos, quantidade }))
      .sort((a, b) => b.acertos - a.acertos)

    return {
      ultimoConcurso: maiorConcurso,
      acertosUltimoConcurso,
      distribuicaoHistorica,
      melhorResultado,
    }
  },
})

export const fetchLatestFromCaixa = action({
  args: {},
  handler: async (ctx): Promise<{ inserted: number; recebidos: number }> => {
    const response = await fetch(MEGASENA_API_URL)
    if (!response.ok) {
      throw new Error(
        `Falha ao consultar loteriascaixa-api: ${response.status}`,
      )
    }
    const data = await response.json()

    const dezenas = (data.dezenas as string[]).map(Number).sort((a, b) => a - b)

    type Faixa = {
      faixa: number
      ganhadores: number
      valorPremio: number
    }
    const premiacoes = data.premiacoes as Faixa[]
    const faixa6 = premiacoes.find((f) => f.faixa === 1)
    const faixa5 = premiacoes.find((f) => f.faixa === 2)
    const faixa4 = premiacoes.find((f) => f.faixa === 3)

    const valorEstimadoProximoConcurso =
      (data.valorEstimadoProximoConcurso as number) ?? 0

    const resultado = {
      concurso: data.concurso as number,
      data: parseDataBr(data.data as string),
      dezenas,
      ganhadores6: faixa6?.ganhadores ?? 0,
      rateio6: faixa6?.valorPremio ?? 0,
      ganhadores5: faixa5?.ganhadores ?? 0,
      rateio5: faixa5?.valorPremio ?? 0,
      ganhadores4: faixa4?.ganhadores ?? 0,
      rateio4: faixa4?.valorPremio ?? 0,
      acumulado6: (data.valorAcumuladoProximoConcurso as number) ?? 0,
      created_at: Date.now(),
      proximoConcurso: data.proximoConcurso as number | undefined,
      dataProximoConcurso: data.dataProximoConcurso
        ? parseDataBr(data.dataProximoConcurso as string)
        : undefined,
      valorEstimadoProximoConcurso,
    }

    const resultadoDoImport = await ctx.runMutation(
      api.megaSena.upsertLatest,
      resultado,
    )

    // Dispara o alerta só no momento em que a estimativa CRUZA o limiar (e não
    // a cada corrida do cron enquanto ela permanece acima) — funciona tanto
    // quando um concurso novo já nasce acima do limiar quanto quando a
    // estimativa de um concurso ainda em aberto sobe até ultrapassá-lo.
    const limiar = limiarAlertaAcumulado()
    const jaEstavaAcimaDoLimiar = resultadoDoImport.estimativaAnterior >= limiar
    const cruzouLimiar =
      valorEstimadoProximoConcurso >= limiar && !jaEstavaAcimaDoLimiar

    if (cruzouLimiar) {
      await enviarAlertaAcumulado(
        resultado.proximoConcurso,
        valorEstimadoProximoConcurso,
      )
    }

    return {
      inserted: resultadoDoImport.inserted,
      recebidos: resultadoDoImport.recebidos,
    }
  },
})

// Envia via SendCloud (plataforma própria de e-mail transacional,
// https://sendcloud.dev.br) em vez de Resend. `from` precisa ser um domínio
// verificado no workspace da API key usada.
async function enviarAlertaAcumulado(
  proximoConcurso: number | undefined,
  valorEstimado: number,
) {
  const apiKey = process.env.SENDCLOUD_API_KEY
  const destinatario = process.env.MEGASENA_ALERTA_EMAIL
  if (!apiKey || !destinatario) {
    console.warn(
      'Mega-Sena acumulou, mas SENDCLOUD_API_KEY ou MEGASENA_ALERTA_EMAIL não estão configurados no deployment do Convex — alerta não enviado.',
    )
    return
  }

  try {
    const response = await fetch(
      'https://api.sendcloud.dev.br/v1/emails/send',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Mega-Sena BI <noreply@sendcloud.dev.br>',
          to: destinatario,
          subject: `Mega-Sena acumulada: concurso ${proximoConcurso ?? '?'} estimado em ${formatBRL(valorEstimado)}`,
          html: `<p>O próximo concurso da Mega-Sena (nº ${proximoConcurso ?? '?'}) está estimado em <strong>${formatBRL(valorEstimado)}</strong>.</p>`,
        }),
      },
    )
    if (!response.ok) {
      console.error(
        `Falha ao enviar alerta de acumulado via SendCloud: ${response.status}`,
      )
    }
  } catch (error) {
    console.error('Erro ao enviar alerta de acumulado via SendCloud:', error)
  }
}
