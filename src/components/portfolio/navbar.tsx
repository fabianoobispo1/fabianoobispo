'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

import { Button } from '@/components/ui/button'

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon">
        <Sun className="h-5 w-5" />
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      {theme === 'dark' ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navItems = [
    { name: 'Sobre', href: '#sobre' },
    { name: 'Projetos', href: '#projetos' },
    { name: 'Skills', href: '#skills' },
    { name: 'Contato', href: '#contato' },
  ]

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => {
    e.preventDefault()
    const element = document.querySelector(href)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setIsMobileMenuOpen(false)
    }
  }

  return (
    <nav
      className={`fixed top-0 z-50 w-full transition-all duration-300 ${
        isScrolled
          ? 'border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'
          : 'bg-transparent'
      }`}
    >
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="text-xl font-bold">
          <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            FB
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-6 md:flex">
          {navItems.map((item) => (
            <a
              key={item.name}
              href={item.href}
              onClick={(e) => handleNavClick(e, item.href)}
              className="cursor-pointer text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.name}
            </a>
          ))}
          <ThemeToggle />
          <Button asChild>
            <Link href="/entrar">Dashboard</Link>
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="border-t bg-background md:hidden">
          <div className="container space-y-4 px-4 py-6">
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                onClick={(e) => handleNavClick(e, item.href)}
                className="block cursor-pointer text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.name}
              </a>
            ))}
            <Button asChild className="w-full">
              <Link href="/entrar">Dashboard</Link>
            </Button>
          </div>
        </div>
      )}
    </nav>
  )
}
