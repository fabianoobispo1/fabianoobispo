'use client'

import Link from 'next/link'
import { Github, Linkedin, Instagram, Heart } from 'lucide-react'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t">
      <div className="container px-4 py-12 md:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <h3 className="text-lg font-bold">Fabiano Bispo</h3>
            <p className="text-sm text-muted-foreground">
              Desenvolvedor Full Stack criando soluções inovadoras e escaláveis.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Navegação</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="#sobre"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Sobre
                </Link>
              </li>
              <li>
                <Link
                  href="#projetos"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Projetos
                </Link>
              </li>
              <li>
                <Link
                  href="#skills"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Skills
                </Link>
              </li>
              <li>
                <Link
                  href="#contato"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Contato
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Projetos</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/dashboard/financas"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Sistema Financeiro
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/fichaexercicios"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Ficha de Treinos
                </Link>
              </li>
              <li>
                <Link
                  href="https://www.adicacerta.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  A dica Certa
                </Link>
              </li>
              <li>
                <Link
                  href="https://www.jfimperadores.com.br/imperadores"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  JF Imperadores
                </Link>
              </li>
              <li>
                <Link
                  href="/dontpad/exemplo"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  DontPad Clone
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Redes Sociais</h4>
            <div className="flex gap-4">
              <Link
                href="https://github.com/fabianoobispo"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <Github className="h-5 w-5" />
                <span className="sr-only">GitHub</span>
              </Link>
              <Link
                href="https://www.linkedin.com/in/fabiano-bispo-canedo-422738109/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <Linkedin className="h-5 w-5" />
                <span className="sr-only">LinkedIn</span>
              </Link>
              <Link
                href="https://instagram.com/fabianoobispo"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <Instagram className="h-5 w-5" />
                <span className="sr-only">Instagram</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t pt-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-center text-sm text-muted-foreground">
              © {currentYear} Fabiano Bispo. Todos os direitos reservados.
            </p>
            <p className="flex items-center gap-1 text-sm text-muted-foreground">
              Feito com <Heart className="h-4 w-4 fill-red-500 text-red-500" />{' '}
              usando Next.js
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
