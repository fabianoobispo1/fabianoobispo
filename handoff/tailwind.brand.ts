/** tailwind.config.ts — adições para a marca fabianoobispo
 *  Não substitua seu config existente; mescle estas chaves dentro do seu.
 */

import type { Config } from 'tailwindcss'

export const brandExtension = {
  theme: {
    extend: {
      colors: {
        brand: {
          forest: '#0a1611',
          'forest-2': '#0f1f17',
          'forest-3': '#132a20',
          emerald: '#10b981',
          'emerald-hi': '#34d399',
          cream: '#f4f1ea',
          mute: '#7a8a83',
        },
      },
      fontFamily: {
        // garanta que /app/layout.tsx exporte estas vars via next/font
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'brand-blink': {
          '0%, 49%': { opacity: '1' },
          '50%, 100%': { opacity: '0' },
        },
      },
      animation: {
        'brand-blink': 'brand-blink 1.05s steps(1) infinite',
      },
    },
  },
} satisfies Partial<Config>
