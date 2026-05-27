'use client'

import Link from 'next/link'
import { Github, Linkedin, Instagram } from 'lucide-react'

import { Logo } from '@/components/brand/logo'

export function HeroSection() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-brand-forest">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center space-y-8 text-center">
          {/* Marca grande */}
          <Logo variant="lockup" theme="dark" size={56} className="mb-2" />

          {/* Tagline */}
          <div className="space-y-3">
            <p className="font-mono text-sm tracking-[0.22em] text-brand-emerald uppercase">
              ● Full Stack Engineer
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-brand-cream sm:text-4xl md:text-5xl font-sans">
              Construindo software que{' '}
              <span className="text-brand-emerald">entrega</span>
              <span
                className="inline-block w-[0.5ch] h-[0.85em] bg-brand-emerald animate-brand-blink align-middle ml-1"
                aria-hidden="true"
              />
            </h1>
            <p className="mx-auto max-w-[640px] text-base text-brand-mute sm:text-lg">
              Desenvolvedor Full Stack especializado em criar soluções modernas
              e escaláveis com React, Next.js e TypeScript.
            </p>
          </div>

          {/* CTAs */}
          <div className="flex flex-col gap-4 sm:flex-row">
            <a
              href="#projetos"
              onClick={(e) => {
                e.preventDefault()
                document
                  .querySelector('#projetos')
                  ?.scrollIntoView({ behavior: 'smooth' })
              }}
              className="px-6 py-2.5 rounded border border-brand-emerald/40 text-brand-emerald hover:bg-brand-emerald hover:text-brand-forest transition-colors font-mono text-xs tracking-wider uppercase cursor-pointer"
            >
              Ver Projetos
            </a>
            <a
              href="#contato"
              onClick={(e) => {
                e.preventDefault()
                document
                  .querySelector('#contato')
                  ?.scrollIntoView({ behavior: 'smooth' })
              }}
              className="px-6 py-2.5 rounded border border-brand-forest-3 text-brand-cream/75 hover:border-brand-emerald/40 hover:text-brand-cream transition-colors font-mono text-xs tracking-wider uppercase cursor-pointer"
            >
              Entre em Contato
            </a>
          </div>

          {/* Social links */}
          <div className="flex gap-5">
            <Link
              href="https://github.com/fabianoobispo"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-mute hover:text-brand-emerald transition-colors"
            >
              <Github className="h-5 w-5" />
              <span className="sr-only">GitHub</span>
            </Link>
            <Link
              href="https://www.linkedin.com/in/fabiano-bispo-canedo-422738109/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-mute hover:text-brand-emerald transition-colors"
            >
              <Linkedin className="h-5 w-5" />
              <span className="sr-only">LinkedIn</span>
            </Link>
            <Link
              href="https://instagram.com/fabianoobispo"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-mute hover:text-brand-emerald transition-colors"
            >
              <Instagram className="h-5 w-5" />
              <span className="sr-only">Instagram</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Glow decorativo */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute -left-16 top-1/3 h-80 w-80 rounded-full bg-brand-emerald/5 blur-3xl" />
        <div className="absolute -right-16 bottom-1/3 h-80 w-80 rounded-full bg-brand-emerald/5 blur-3xl" />
      </div>
    </section>
  )
}
