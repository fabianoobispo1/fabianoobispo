'use client'

import Link from 'next/link'

import { Logo } from '@/components/brand/logo'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { label: 'Sobre', href: '#sobre' },
  { label: 'Projetos', href: '#projetos' },
  { label: 'Skills', href: '#skills' },
  { label: 'Contato', href: '#contato' },
]

const PROJECT_LINKS = [
  { label: 'Sistema Financeiro', href: '/dashboard/financas' },
  { label: 'Ficha de Treinos', href: '/dashboard/fichaexercicios' },
  { label: 'DontPad Clone', href: '/dontpad/exemplo' },
  { label: 'A Dica Certa', href: 'https://www.adicacerta.com' },
  {
    label: 'JF Imperadores',
    href: 'https://www.jfimperadores.com.br/imperadores',
  },
]

const SOCIAL_LINKS = [
  { label: 'GitHub', href: 'https://github.com/fabianoobispo' },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/fabiano-bispo-canedo-422738109/',
  },
  { label: 'Instagram', href: 'https://instagram.com/fabianoobispo' },
  { label: 'Email', href: 'mailto:fbc623@gmail.com' },
]

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-brand-forest border-t border-brand-forest-3 text-brand-cream/70">
      <div className="mx-auto max-w-6xl px-6 py-14 grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div className="space-y-4">
          <Logo variant="lockup" size={22} />
          <p className="text-sm leading-relaxed max-w-xs">
            Desenvolvedor Full Stack criando soluções modernas e escaláveis.
          </p>
          <p className="font-mono text-xs tracking-wider text-brand-emerald">
            ● DISPONÍVEL P/ PROJETOS
          </p>
        </div>

        <FooterCol title="Navegação" links={NAV_LINKS} />
        <FooterCol title="Projetos" links={PROJECT_LINKS} />
        <FooterCol title="Redes" links={SOCIAL_LINKS} />
      </div>

      <div className="border-t border-brand-forest-3">
        <div className="mx-auto max-w-6xl px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-2 text-xs font-mono text-brand-mute">
          <span>
            © {currentYear} fabianoobispo. Todos os direitos reservados.
          </span>
          <span>{'// feito com next.js'}</span>
        </div>
      </div>

      <div className="border-t border-brand-forest-3">
        <div
          className={cn(
            'mx-auto max-w-6xl px-6 py-4',
            'text-center text-[11px] leading-relaxed text-brand-mute/60 font-mono',
          )}
        >
          <span>
            FABIANOOBISPO DESENVOLVIMENTO E CONSULTORIA &nbsp;·&nbsp; CNPJ:
            66.797.389/0001-56
          </span>
          <br />
          <span>
            R. Coronel Vieira, 141 - Apto 403 - Centro - Cataguases/MG &nbsp;·&nbsp; CEP:
            36.770-028 &nbsp;·&nbsp; contato@fabianoobispo.com.br
          </span>
        </div>
      </div>
    </footer>
  )
}

function FooterCol({
  title,
  links,
}: {
  title: string
  links: { label: string; href: string }[]
}) {
  return (
    <div>
      <h4 className="font-mono text-xs tracking-wider text-brand-cream uppercase mb-4">
        {title}
      </h4>
      <ul className="space-y-2 text-sm">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="hover:text-brand-emerald transition-colors"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
