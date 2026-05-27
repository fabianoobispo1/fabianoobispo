'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'

import { Logo } from '@/components/brand/logo'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { name: 'Sobre', href: '#sobre' },
  { name: 'Projetos', href: '#projetos' },
  { name: 'Skills', href: '#skills' },
  { name: 'Contato', href: '#contato' },
]

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => {
    e.preventDefault()
    const el = document.querySelector(href)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setIsMobileMenuOpen(false)
    }
  }

  return (
    <nav
      className={cn(
        'fixed top-0 inset-x-0 z-50 transition-all duration-200',
        isScrolled
          ? 'bg-brand-forest/85 backdrop-blur border-b border-brand-forest-3'
          : 'bg-transparent',
      )}
    >
      <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
        <Link href="/" aria-label="fabianoobispo — home">
          <Logo variant="lockup" theme="dark" size={22} collapseOnMobile />
        </Link>

        {/* Desktop */}
        <div className="hidden items-center gap-7 md:flex">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.name}
              href={item.href}
              onClick={(e) => handleNavClick(e, item.href)}
              className="text-sm text-brand-cream/75 hover:text-brand-emerald transition-colors cursor-pointer"
            >
              {item.name}
            </a>
          ))}
          <Link
            href="/entrar"
            className="ml-2 px-3 py-1.5 rounded border border-brand-emerald/40 text-brand-emerald hover:bg-brand-emerald hover:text-brand-forest transition-colors font-mono text-xs tracking-wider uppercase"
          >
            Dashboard
          </Link>
        </div>

        {/* Mobile trigger */}
        <button
          className="flex items-center justify-center md:hidden text-brand-cream"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Menu"
        >
          {isMobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="border-t border-brand-forest-3 bg-brand-forest md:hidden">
          <div className="mx-auto max-w-6xl px-6 py-6 space-y-4">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.name}
                href={item.href}
                onClick={(e) => handleNavClick(e, item.href)}
                className="block text-sm text-brand-cream/75 hover:text-brand-emerald transition-colors cursor-pointer"
              >
                {item.name}
              </a>
            ))}
            <Link
              href="/entrar"
              className="inline-block px-3 py-1.5 rounded border border-brand-emerald/40 text-brand-emerald hover:bg-brand-emerald hover:text-brand-forest transition-colors font-mono text-xs tracking-wider uppercase"
            >
              Dashboard
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
