'use client'

import Link from 'next/link'
import {
  TrendingUp,
  Dumbbell,
  FileText,
  Users,
  Medal,
  Activity,
  ExternalLink,
  MessageSquare,
  Mail,
} from 'lucide-react'

export function ProjectsSection() {
  const projects = [
    {
      title: 'Sistema Financeiro Completo',
      description:
        'Plataforma de gestão financeira pessoal com controle de receitas, despesas, cartões de crédito e relatórios detalhados.',
      icon: TrendingUp,
      tags: ['Next.js', 'Convex', 'TypeScript', 'Chart.js'],
      link: '/dashboard/financas',
      external: false,
    },
    {
      title: 'Ficha de Treinos',
      description:
        'Sistema completo para gerenciamento de treinos, catálogo de exercícios e acompanhamento de evolução física.',
      icon: Dumbbell,
      tags: ['React', 'Convex', 'TypeScript', 'Drag & Drop'],
      link: '/dashboard/fichaexercicios',
      external: false,
    },
    {
      title: 'DontPad Clone',
      description:
        'Editor de texto colaborativo em tempo real inspirado no DontPad, com auto-save e acesso público.',
      icon: FileText,
      tags: ['Next.js', 'Real-time', 'Convex', 'TypeScript'],
      link: '/dontpad/exemplo',
      external: false,
    },
    {
      title: 'A Dica Certa',
      description:
        'Plataforma colaborativa de recomendações culturais validadas pela comunidade. Filmes, séries, livros, músicas e mais — sem algoritmos, apenas descobertas genuínas de pessoas reais.',
      icon: Users,
      tags: ['Next.js', 'Convex', 'TypeScript', 'Comunidade'],
      link: 'https://www.adicacerta.com',
      external: true,
    },
    {
      title: 'JF Imperadores',
      description:
        'Site para divulgação e gerenciamento do time de futebol americano JF Imperadores, com informações da equipe, jogadores e eventos.',
      icon: Medal,
      tags: ['React', 'Next.js', 'TypeScript', 'Gestão Esportiva'],
      link: 'https://www.jfimperadores.com.br/imperadores',
      external: true,
    },
    {
      title: 'Sistema Fisiosport',
      description:
        'Sistema completo de gestão para clínicas de fisioterapia e pilates, com controle de pacientes, agendamentos, prontuários e relatórios.',
      icon: Activity,
      tags: ['React', 'Node.js', 'PostgreSQL', 'Material-UI'],
      link: 'https://sistema.fisiosport.com.br/',
      external: true,
    },
    {
      title: 'Zapeio',
      description:
        'SaaS multi-tenant de atendimento via WhatsApp com IA para pequenas e médias empresas. Agentes inteligentes, múltiplos atendentes e integração com Evolution API.',
      icon: MessageSquare,
      tags: ['Next.js', 'Convex', 'TypeScript', 'WhatsApp', 'IA'],
      link: 'https://zapeio.com.br',
      external: true,
    },
    {
      title: 'SendCloud',
      description:
        'Plataforma self-hosted de envio de e-mails transacionais, alternativa ao Resend e SendGrid. Suporte a domínios customizados, filas, webhooks e painel de analytics.',
      icon: Mail,
      tags: ['Fastify', 'PostgreSQL', 'Redis', 'Docker', 'Node.js'],
      link: 'https://sendcloud.dev.br',
      external: true,
    },
  ]

  return (
    <section id="projetos" className="bg-brand-forest py-24 sm:py-32">
      <div className="container px-4 md:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tighter text-brand-cream sm:text-4xl md:text-5xl">
            Projetos em Destaque
          </h2>
          <p className="mt-4 text-brand-mute">
            Alguns dos projetos que demonstram minhas habilidades e experiência
            em desenvolvimento.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-6xl gap-6 sm:grid-cols-2">
          {projects.map((project, index) => (
            <div
              key={index}
              className="flex flex-col rounded-lg border border-brand-forest-3 bg-brand-forest-2 p-6"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-brand-emerald/10">
                <project.icon className="h-6 w-6 text-brand-emerald" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-brand-cream">
                {project.title}
              </h3>
              <p className="mb-4 flex-1 text-sm text-brand-mute">
                {project.description}
              </p>
              <div className="mb-5 flex flex-wrap gap-2">
                {project.tags.map((tag, tagIndex) => (
                  <span
                    key={tagIndex}
                    className="rounded border border-brand-forest-3 px-2 py-0.5 font-mono text-xs text-brand-cream/80"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <Link
                href={project.link}
                target={project.external ? '_blank' : undefined}
                rel={project.external ? 'noopener noreferrer' : undefined}
                className="inline-flex w-full items-center justify-center gap-2 rounded border border-brand-emerald/40 px-4 py-2 font-mono text-xs tracking-wider uppercase text-brand-emerald transition-colors hover:bg-brand-emerald hover:text-brand-forest"
              >
                Ver Projeto <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
