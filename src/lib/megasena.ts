// parseDataBr (convex/megaSena.ts) monta o timestamp em contexto UTC (a
// action roda na nuvem da Convex, não no fuso do navegador), então a exibição
// precisa fixar timeZone: 'UTC' pra não mostrar um dia a menos pra quem está
// atrás de UTC (ex: Brasília).
export function formatDataBR(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
}

export function parseDezenas(value: string): number[] | null {
  const numeros = value
    .split(/[,\s]+/)
    .filter(Boolean)
    .map(Number)

  if (numeros.length !== 6) return null
  if (numeros.some((n) => !Number.isInteger(n) || n < 1 || n > 60)) return null
  if (new Set(numeros).size !== 6) return null

  return numeros.sort((a, b) => a - b)
}
