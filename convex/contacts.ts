import { v } from 'convex/values'
import {
  paginationOptsValidator,
  type GenericDatabaseReader,
  type GenericDataModel,
} from 'convex/server'

import {
  action,
  internalMutation,
  internalQuery,
  query,
  type QueryCtx,
} from './_generated/server'
import { internal } from './_generated/api'
import { requireAdmin, requireAdminAction } from './authz'

/**
 * Leitura da tabela `contacts` (importada de fora, ~69K docs, NAO declarada no
 * schema). Como ela nao existe no DataModel tipado, acessamos via um reader
 * generico. Tudo aqui e restrito a admin.
 *
 * As estatisticas sao caras (varrem a tabela inteira), entao ficam num
 * snapshot em `contactsStats`, recalculado sob demanda pelo botao
 * "Recalcular" da pagina /dashboard/admin/contatos.
 */

type RawContact = {
  _id: string
  _creationTime: number
  name?: unknown
  number?: unknown
  lastMessageAt?: unknown
  lastMessageText?: unknown
  createdAt?: unknown
  updatedAt?: unknown
}

export type ContactRow = {
  _id: string
  _creationTime: number
  name: string
  number: string
  lastMessageAt: number | null
  lastMessageText: string
  createdAt: number | null
}

function contactsQuery(ctx: QueryCtx) {
  const db = ctx.db as unknown as GenericDatabaseReader<GenericDataModel>
  return db.query('contacts')
}

const str = (x: unknown) =>
  typeof x === 'string' ? x : x == null ? '' : String(x)

/** "2025-11-01T20:35:32.000+0000" -> ms. Aceita tambem numero/ISO normal. */
function parseDate(x: unknown): number | null {
  if (typeof x === 'number' && Number.isFinite(x)) return x
  if (typeof x !== 'string' || !x) return null
  const iso = x.replace(/([+-]\d{2})(\d{2})$/, '$1:$2')
  const t = Date.parse(iso)
  return Number.isNaN(t) ? null : t
}

function toRow(doc: RawContact, textMax = 300): ContactRow {
  return {
    _id: doc._id,
    _creationTime: doc._creationTime,
    name: str(doc.name),
    number: str(doc.number),
    lastMessageAt: parseDate(doc.lastMessageAt),
    lastMessageText: str(doc.lastMessageText).slice(0, textMax),
    createdAt: parseDate(doc.createdAt),
  }
}

// ------------------------------------------------------------------ leitura

/** Navegacao paginada da tabela (mais recentes primeiro). */
export const listPage = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, { paginationOpts }) => {
    await requireAdmin(ctx)
    const res = await contactsQuery(ctx).order('desc').paginate(paginationOpts)
    return {
      ...res,
      page: res.page.map((d) => toRow(d as unknown as RawContact)),
    }
  },
})

/** Ultimo snapshot de estatisticas (ou null se nunca calculado). */
export const getStats = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx)
    return await ctx.db
      .query('contactsStats')
      .withIndex('by_computed_at')
      .order('desc')
      .first()
  },
})

// ------------------------------------------------------- recalculo (admin)

export const scanPage = internalQuery({
  args: { cursor: v.union(v.string(), v.null()), numItems: v.number() },
  handler: async (ctx, { cursor, numItems }) => {
    const res = await contactsQuery(ctx).paginate({ cursor, numItems })
    return {
      rows: res.page.map((d) => toRow(d as unknown as RawContact, 500)),
      continueCursor: res.continueCursor,
      isDone: res.isDone,
    }
  },
})

export const saveStats = internalMutation({
  args: { computedAt: v.number(), durationMs: v.number(), data: v.any() },
  handler: async (ctx, args) => {
    await ctx.db.insert('contactsStats', args)
    // Mantem so os 5 snapshots mais recentes.
    const old = await ctx.db
      .query('contactsStats')
      .withIndex('by_computed_at')
      .order('desc')
      .collect()
    for (const doc of old.slice(5)) await ctx.db.delete(doc._id)
  },
})

const DDD_UF: Record<string, string> = {}
const UF_DDDS: Record<string, number[]> = {
  SP: [11, 12, 13, 14, 15, 16, 17, 18, 19],
  RJ: [21, 22, 24],
  ES: [27, 28],
  MG: [31, 32, 33, 34, 35, 37, 38],
  PR: [41, 42, 43, 44, 45, 46],
  SC: [47, 48, 49],
  RS: [51, 53, 54, 55],
  DF: [61],
  GO: [62, 64],
  TO: [63],
  MT: [65, 66],
  MS: [67],
  AC: [68],
  RO: [69],
  BA: [71, 73, 74, 75, 77],
  SE: [79],
  PE: [81, 87],
  AL: [82],
  PB: [83],
  RN: [84],
  CE: [85, 88],
  PI: [86, 89],
  PA: [91, 93, 94],
  AM: [92, 97],
  RR: [95],
  AP: [96],
  MA: [98, 99],
}
for (const [uf, ddds] of Object.entries(UF_DDDS)) {
  for (const d of ddds) DDD_UF[String(d)] = uf
}

const STOPWORDS = new Set(
  (
    'a o e é de da do das dos que em um uma para pra por com não nao no na nos nas ' +
    'se eu me meu minha você voce vc te tu ele ela isso isto esse essa este esta ' +
    'mas mais como ou ao aos à às já ja tem ter sou foi ser está esta tá ta vai ' +
    'muito bem só so aqui lá la sim oi olá ola bom boa dia tarde noite obrigado ' +
    'obrigada https http www com br the to of and q tb tbm kkk kkkk'
  ).split(/\s+/),
)

const MOJIBAKE = /Ã.|â€|Â/

function bump(map: Record<string, number>, key: string, by = 1) {
  map[key] = (map[key] ?? 0) + by
}

const SP_OFFSET_MS = -3 * 3600 * 1000 // America/Sao_Paulo (sem horario de verao desde 2019)

export const refreshStats = action({
  args: {},
  handler: async (ctx) => {
    await requireAdminAction(ctx)
    const started = Date.now()
    const now = started

    let total = 0
    let withMessage = 0
    let withName = 0
    let emptyName = 0
    let mojibake = 0
    let invalidNumber = 0
    let foreign = 0
    let mobile = 0
    let landline = 0
    let withDate = 0
    let firstMsg: number | null = null
    let lastMsg: number | null = null
    const active = { d7: 0, d30: 0, d90: 0, d365: 0 }

    const byDDD: Record<string, number> = {}
    const byUF: Record<string, number> = {}
    const byMonth: Record<string, number> = {}
    const byDay: Record<string, number> = {}
    const byCreatedDay: Record<string, number> = {}
    const heat: number[][] = Array.from({ length: 7 }, () =>
      new Array<number>(24).fill(0),
    )
    const lenBuckets: Record<string, number> = {
      vazia: 0,
      '1-10': 0,
      '11-30': 0,
      '31-80': 0,
      '81-200': 0,
      '200+': 0,
    }
    const words: Record<string, number> = {}
    const seenNumbers = new Map<string, number>()

    let cursor: string | null = null
    for (;;) {
      const res: {
        rows: ContactRow[]
        continueCursor: string
        isDone: boolean
      } = await ctx.runQuery(internal.contacts.scanPage, {
        cursor,
        numItems: 4000,
      })

      for (const c of res.rows) {
        total++
        const name = c.name.trim()
        if (name) withName++
        else emptyName++
        if (MOJIBAKE.test(c.name) || MOJIBAKE.test(c.lastMessageText))
          mojibake++

        // ---- numero / DDD
        const digits = c.number.replace(/\D/g, '')
        seenNumbers.set(digits, (seenNumbers.get(digits) ?? 0) + 1)
        if (!digits.startsWith('55')) {
          foreign++
        } else if (digits.length !== 12 && digits.length !== 13) {
          invalidNumber++
        } else {
          const ddd = digits.slice(2, 4)
          bump(byDDD, ddd)
          bump(byUF, DDD_UF[ddd] ?? '??')
          const local = digits.slice(4)
          if (local.length === 9 || /^[6-9]/.test(local)) mobile++
          else landline++
        }

        // ---- mensagem
        const text = c.lastMessageText.trim()
        if (text) withMessage++
        const len = text.length
        if (len === 0) lenBuckets.vazia++
        else if (len <= 10) lenBuckets['1-10']++
        else if (len <= 30) lenBuckets['11-30']++
        else if (len <= 80) lenBuckets['31-80']++
        else if (len <= 200) lenBuckets['81-200']++
        else lenBuckets['200+']++

        if (text) {
          const seen = new Set<string>()
          for (const w of text
            .toLowerCase()
            .normalize('NFC')
            .split(/[^\p{L}\p{N}]+/u)) {
            if (w.length < 3 || STOPWORDS.has(w) || /^\d+$/.test(w)) continue
            if (MOJIBAKE.test(w)) continue
            if (seen.has(w)) continue
            seen.add(w)
            bump(words, w)
          }
        }

        // ---- datas
        const t = c.lastMessageAt
        if (t != null) {
          withDate++
          if (firstMsg == null || t < firstMsg) firstMsg = t
          if (lastMsg == null || t > lastMsg) lastMsg = t
          const age = now - t
          if (age <= 7 * 864e5) active.d7++
          if (age <= 30 * 864e5) active.d30++
          if (age <= 90 * 864e5) active.d90++
          if (age <= 365 * 864e5) active.d365++
          const local = new Date(t + SP_OFFSET_MS)
          const iso = local.toISOString()
          bump(byMonth, iso.slice(0, 7))
          bump(byDay, iso.slice(0, 10))
          heat[local.getUTCDay()][local.getUTCHours()]++
        }
        if (c.createdAt != null) {
          bump(
            byCreatedDay,
            new Date(c.createdAt + SP_OFFSET_MS).toISOString().slice(0, 10),
          )
        }
      }

      if (res.isDone) break
      cursor = res.continueCursor
    }

    let duplicateNumbers = 0
    let duplicateRows = 0
    for (const n of seenNumbers.values()) {
      if (n > 1) {
        duplicateNumbers++
        duplicateRows += n - 1
      }
    }

    const sortedEntries = (m: Record<string, number>) =>
      Object.entries(m).sort((a, b) => a[0].localeCompare(b[0]))

    const data = {
      total,
      withMessage,
      withName,
      emptyName,
      mojibake,
      invalidNumber,
      foreign,
      mobile,
      landline,
      withDate,
      duplicateNumbers,
      duplicateRows,
      firstMsg,
      lastMsg,
      active,
      byDDD: Object.entries(byDDD)
        .map(([ddd, count]) => ({ ddd, uf: DDD_UF[ddd] ?? '??', count }))
        .sort((a, b) => b.count - a.count),
      byUF: Object.entries(byUF)
        .map(([uf, count]) => ({ uf, count }))
        .sort((a, b) => b.count - a.count),
      byMonth: sortedEntries(byMonth).map(([month, count]) => ({
        month,
        count,
      })),
      byDay: sortedEntries(byDay).map(([day, count]) => ({ day, count })),
      byCreatedDay: sortedEntries(byCreatedDay).map(([day, count]) => ({
        day,
        count,
      })),
      heat,
      lenBuckets: Object.entries(lenBuckets).map(([bucket, count]) => ({
        bucket,
        count,
      })),
      topWords: Object.entries(words)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 40)
        .map(([word, count]) => ({ word, count })),
    }

    const durationMs = Date.now() - started
    await ctx.runMutation(internal.contacts.saveStats, {
      computedAt: now,
      durationMs,
      data,
    })
    return { total, durationMs }
  },
})
