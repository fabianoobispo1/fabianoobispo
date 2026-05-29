// components/brand/tokens.ts
// Tokens da marca fabianoobispo. Importe daqui em vez de hardcodar cores.

export const brand = {
  // cores
  forestDeep: '#0a1611', // bg principal escuro
  forest: '#0f1f17', // bg secundário / cards
  forestSoft: '#132a20', // bordas, divisores
  emerald: '#10b981', // accent primário
  emeraldHi: '#34d399', // accent hover / brilho
  cream: '#f4f1ea', // ink sobre escuro / bg claro
  ink: '#0a1611', // ink sobre claro
  mute: '#7a8a83', // texto secundário

  // tipografia
  fontMono:
    '"JetBrains Mono", ui-monospace, "SF Mono", Menlo, Consolas, monospace',
  fontSans: '"Space Grotesk", system-ui, -apple-system, sans-serif',

  // identidade
  name: 'fabianoobispo',
  domain: 'fabianoobispo.com.br',
  tagline: 'Desenvolvedor Full Stack',
} as const

export type BrandTokens = typeof brand
