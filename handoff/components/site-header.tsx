// components/site-header.tsx
// Header de exemplo usando a marca <fb/>. Substitui o header atual.
// Próprio para o app router; adapte os <Link> para suas rotas reais.

'use client'

import * as React from 'react'
import Link from 'next/link'
import { Logo } from '@/components/brand/logo'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '#sobre', label: 'Sobre' },
  { href: '#projetos', label: 'Projetos' },
  { href: '#skills', label: 'Skills' },
  { href: '#contato', label: 'Contato' },
] as const

export function SiteHeader() {
  const [scrolled, setScrolled] = React.useState(false)

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'fixed top-0 inset-x-0 z-50 transition-all duration-200',
        scrolled
          ? 'bg-[#0a1611]/85 backdrop-blur border-b border-[#132a20]'
          : 'bg-transparent',
      )}
    >
      <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
        <Link href="/" aria-label="fabianoobispo — home" className="group">
          <Logo variant="lockup" theme="dark" size={22} collapseOnMobile />
        </Link>

        <nav className="hidden md:flex items-center gap-7 text-sm text-[#f4f1ea]/75">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="hover:text-[#10b981] transition-colors"
            >
              {item.label}
            </a>
          ))}
          <Link
            href="/entrar"
            className="ml-2 px-3 py-1.5 rounded border border-[#10b981]/40 text-[#10b981] hover:bg-[#10b981] hover:text-[#0a1611] transition-colors font-mono text-xs tracking-wider"
          >
            DASHBOARD
          </Link>
        </nav>
      </div>
    </header>
  )
}
