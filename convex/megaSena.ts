import { v } from 'convex/values'

import { action, mutation, query } from './_generated/server'
import { api } from './_generated/api'
import { megaSenaResultSchema } from './schema'

const CAIXA_API_URL =
  'https://servicebus2.caixa.gov.br/portaldeloterias/api/megasena/'

function parseDataBr(dataStr: string): number {
  const [dia, mes, ano] = dataStr.split('/').map(Number)
  return new Date(ano, mes - 1, dia).getTime()
}

export const bulkImport = mutation({
  args: {
    results: v.array(v.object(megaSenaResultSchema)),
  },
  handler: async ({ db }, { results }) => {
    let inserted = 0
    for (const result of results) {
      const existing = await db
        .query('megaSenaResult')
        .withIndex('by_concurso', (q) => q.eq('concurso', result.concurso))
        .unique()
      if (existing) continue
      await db.insert('megaSenaResult', result)
      inserted++
    }
    return { inserted, recebidos: results.length }
  },
})

export const create = mutation({
  args: megaSenaResultSchema,
  handler: async ({ db }, args) => {
    const existing = await db
      .query('megaSenaResult')
      .withIndex('by_concurso', (q) => q.eq('concurso', args.concurso))
      .unique()
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

export const fetchLatestFromCaixa = action({
  args: {},
  handler: async (ctx): Promise<{ inserted: number; recebidos: number }> => {
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

    const dezenas = (data.listaDezenas as string[])
      .map(Number)
      .sort((a, b) => a - b)

    type Faixa = {
      faixa: number
      numeroDeGanhadores: number
      valorPremio: number
    }
    const listaRateio = data.listaRateioPremio as Faixa[]
    const faixa6 = listaRateio.find((f) => f.faixa === 1)
    const faixa5 = listaRateio.find((f) => f.faixa === 2)
    const faixa4 = listaRateio.find((f) => f.faixa === 3)

    const resultado = {
      concurso: data.numero as number,
      data: parseDataBr(data.dataApuracao as string),
      dezenas,
      ganhadores6: faixa6?.numeroDeGanhadores ?? 0,
      rateio6: faixa6?.valorPremio ?? 0,
      ganhadores5: faixa5?.numeroDeGanhadores ?? 0,
      rateio5: faixa5?.valorPremio ?? 0,
      ganhadores4: faixa4?.numeroDeGanhadores ?? 0,
      rateio4: faixa4?.valorPremio ?? 0,
      acumulado6: (data.valorAcumuladoProximoConcurso as number) ?? 0,
      created_at: Date.now(),
    }

    return await ctx.runMutation(api.megaSena.bulkImport, {
      results: [resultado],
    })
  },
})
