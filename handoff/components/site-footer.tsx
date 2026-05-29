// components/site-footer.tsx
// Footer com a marca, contato e copyright.

import Link from 'next/link'
import { Logo } from '@/components/brand/logo'

export function SiteFooter() {
  return (
    <footer className="bg-[#0a1611] border-t border-[#132a20] text-[#f4f1ea]/70">
      <div className="mx-auto max-w-6xl px-6 py-14 grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div className="space-y-4">
          <Logo variant="lockup" size={22} />
          <p className="text-sm leading-relaxed max-w-xs">
            Desenvolvedor Full Stack criando soluções modernas e escaláveis.
          </p>
          <p className="font-mono text-xs tracking-wider text-[#10b981]">
            ● DISPONÍVEL P/ PROJETOS
          </p>
        </div>

        <FooterCol
          title="Navegação"
          links={[
            { label: 'Sobre', href: '#sobre' },
            { label: 'Projetos', href: '#projetos' },
            { label: 'Skills', href: '#skills' },
            { label: 'Contato', href: '#contato' },
          ]}
        />

        <FooterCol
          title="Projetos"
          links={[
            { label: 'Sistema Financeiro', href: '/dashboard/financas' },
            { label: 'Ficha de Treinos', href: '/dashboard/fichaexercicios' },
            { label: 'DontPad', href: '/dontpad/exemplo' },
            { label: 'A dica Certa', href: 'https://www.adicacerta.com' },
          ]}
        />

        <FooterCol
          title="Redes"
          links={[
            { label: 'GitHub', href: 'https://github.com/fabianoobispo' },
            {
              label: 'LinkedIn',
              href: 'https://www.linkedin.com/in/fabiano-bispo-canedo-422738109/',
            },
            { label: 'Instagram', href: 'https://instagram.com/fabianoobispo' },
            { label: 'Email', href: 'mailto:fbc623@gmail.com' },
          ]}
        />
      </div>

      <div className="border-t border-[#132a20]">
        <div className="mx-auto max-w-6xl px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-2 text-xs font-mono text-[#7a8a83]">
          <span>© 2026 fabianoobispo. Todos os direitos reservados.</span>
          <span>{'// feito com next.js'}</span>
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
      <h4 className="font-mono text-xs tracking-wider text-[#f4f1ea] uppercase mb-4">
        {title}
      </h4>
      <ul className="space-y-2 text-sm">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="hover:text-[#10b981] transition-colors"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
