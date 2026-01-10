'use client'

import Link from 'next/link'
import { ArrowRight, Github, Linkedin, Instagram } from 'lucide-react'

import { Button } from '@/components/ui/button'

export function HeroSection() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-background to-muted/50">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center space-y-8 text-center">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
              Olá, sou{' '}
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Fabiano Bispo
              </span>
            </h1>
            <p className="mx-auto max-w-[700px] text-lg text-muted-foreground sm:text-xl">
              Desenvolvedor Full Stack especializado em criar soluções modernas
              e escaláveis com React, Next.js e TypeScript
            </p>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="#projetos">
                Ver Projetos <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="#contato">Entre em Contato</Link>
            </Button>
          </div>

          <div className="flex gap-4">
            <Link
              href="https://github.com/fabianoobispo"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <Github className="h-6 w-6" />
              <span className="sr-only">GitHub</span>
            </Link>
            <Link
              href="https://www.linkedin.com/in/fabiano-bispo-canedo-422738109/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <Linkedin className="h-6 w-6" />
              <span className="sr-only">LinkedIn</span>
            </Link>
            <Link
              href="https://instagram.com/fabianoobispo"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <Instagram className="h-6 w-6" />
              <span className="sr-only">Instagram</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Elementos decorativos */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-4 top-1/4 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -right-4 bottom-1/4 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      </div>
    </section>
  )
}
