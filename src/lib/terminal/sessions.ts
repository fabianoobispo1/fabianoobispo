/** Helpers de UI das sessões tmux (cores e metadados do Convex). */

export const SESSION_COLORS = [
  'slate',
  'red',
  'orange',
  'amber',
  'emerald',
  'teal',
  'sky',
  'blue',
  'violet',
  'pink',
] as const

export type SessionColor = (typeof SESSION_COLORS)[number]

// Classes literais para o Tailwind encontrar no build
const COLOR_CLASS: Record<SessionColor, string> = {
  slate: 'bg-slate-500',
  red: 'bg-red-500',
  orange: 'bg-orange-500',
  amber: 'bg-amber-500',
  emerald: 'bg-emerald-500',
  teal: 'bg-teal-500',
  sky: 'bg-sky-500',
  blue: 'bg-blue-500',
  violet: 'bg-violet-500',
  pink: 'bg-pink-500',
}

export function sessionColorClass(cor?: string | null) {
  return COLOR_CLASS[(cor as SessionColor) ?? 'slate'] ?? COLOR_CLASS.slate
}

export interface SessionMeta {
  name: string
  apelido?: string
  cor?: string
  pasta?: string
}

/** Chave da conexão no Convex: _id da conexão salva ou 'default'. */
export function connectionKeyOf(connection?: { _id: string } | null) {
  return connection?._id ?? 'default'
}
