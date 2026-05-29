// components/brand/logo.tsx
// Marca <fb/> · fabianoobispo
//
// 3 variantes:
//   - "icon"     → só o <fb/> (use em headers, badges, contextos compactos)
//   - "wordmark" → só "fabianoobispo" (use quando o ícone já apareceu na página)
//   - "lockup"   → <fb/> + "fabianoobispo" lado a lado (use em hero, footer, login)
//
// 3 temas:
//   - "dark"  → para fundo escuro (default)
//   - "light" → para fundo claro
//   - "mono"  → herda currentColor (use em links, contextos coloridos)
//
// Uso:
//   <Logo />                            // lockup escuro padrão
//   <Logo variant="icon" size={32} />   // só o símbolo, 32px
//   <Logo theme="light" />              // sobre fundo claro
//   <Link href="/"><Logo /></Link>      // como home link no header

import * as React from 'react'
import { cn } from '@/lib/utils'

type LogoTheme = 'dark' | 'light' | 'mono'
type LogoVariant = 'icon' | 'wordmark' | 'lockup'

export interface LogoProps extends Omit<
  React.HTMLAttributes<HTMLSpanElement>,
  'color'
> {
  variant?: LogoVariant
  theme?: LogoTheme
  /** Tamanho em px da altura do glifo. Default 28. */
  size?: number
  /** Esconde a wordmark "fabianoobispo" em telas <sm quando true. Útil em headers responsivos. */
  collapseOnMobile?: boolean
}

const inkClass = (t: LogoTheme) =>
  t === 'dark'
    ? 'text-[#f4f1ea]'
    : t === 'light'
      ? 'text-[#0a1611]'
      : 'text-current'

const accClass = (t: LogoTheme) =>
  t === 'mono' ? 'text-current opacity-90' : 'text-[#10b981]'

export function Logo({
  variant = 'lockup',
  theme = 'dark',
  size = 28,
  collapseOnMobile = false,
  className,
  ...rest
}: LogoProps) {
  const ink = inkClass(theme)
  const acc = accClass(theme)

  const Icon = (
    <span
      aria-hidden="true"
      className="inline-flex items-baseline font-mono font-bold leading-none tracking-[-0.04em] whitespace-nowrap"
      style={{ fontSize: size }}
    >
      <span className={acc}>{'<'}</span>
      <span className={ink}>fb</span>
      <span className={cn(acc, 'opacity-60')}>{'/'}</span>
      <span className={acc}>{'>'}</span>
    </span>
  )

  const Word = (
    <span
      aria-hidden="true"
      className={cn(
        'font-sans font-medium tracking-[-0.025em] leading-none whitespace-nowrap',
        ink,
        collapseOnMobile && 'hidden sm:inline-block',
      )}
      style={{ fontSize: size * 0.88 }}
    >
      fabianoobispo
    </span>
  )

  return (
    <span
      aria-label="fabianoobispo"
      role="img"
      className={cn('inline-flex items-center align-middle', className)}
      style={{ gap: size * 0.5 }}
      {...rest}
    >
      {variant !== 'wordmark' && Icon}
      {variant !== 'icon' && Word}
    </span>
  )
}

// Convenience wrappers
export const LogoIcon = (p: Omit<LogoProps, 'variant'>) => (
  <Logo {...p} variant="icon" />
)
export const LogoWordmark = (p: Omit<LogoProps, 'variant'>) => (
  <Logo {...p} variant="wordmark" />
)
export const LogoLockup = (p: Omit<LogoProps, 'variant'>) => (
  <Logo {...p} variant="lockup" />
)
