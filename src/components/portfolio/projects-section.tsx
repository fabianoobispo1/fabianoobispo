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
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function ProjectsSection() {
  const projects = [
    {
      title: 'Sistema Financeiro Completo',
      description:
        'Plataforma de gestão financeira pessoal com controle de receitas, despesas, cartões de crédito e relatórios detalhados.',
      icon: TrendingUp,
      tags: ['Next.js', 'Convex', 'TypeScript', 'Chart.js'],
      link: '/dashboard/financas',
      color: 'text-green-500',
      external: false,
    },
    {
      title: 'Ficha de Treinos',
      description:
        'Sistema completo para gerenciamento de treinos, catálogo de exercícios e acompanhamento de evolução física.',
      icon: Dumbbell,
      tags: ['React', 'Convex', 'TypeScript', 'Drag & Drop'],
      link: '/dashboard/fichaexercicios',
      color: 'text-blue-500',
      external: false,
    },
    {
      title: 'DontPad Clone',
      description:
        'Editor de texto colaborativo em tempo real inspirado no DontPad, com auto-save e acesso público.',
      icon: FileText,
      tags: ['Next.js', 'Real-time', 'Convex', 'TypeScript'],
      link: '/dontpad/exemplo',
      color: 'text-purple-500',
      external: false,
    },
    {
      title: 'A dica Certa',
      description:
        'Recomendações Autênticas da Comunidade. Descubra filmes, séries, músicas, livros e mais, todos recomendados por pessoas reais. Sem algoritmos. Apenas descoberta genuína.',
      icon: Users,
      tags: ['React', 'Node.js', 'MySQL', 'Email'],
      link: 'https://www.adicacerta.com',
      color: 'text-orange-500',
      external: true,
    },
    {
      title: 'JF Imperadores',
      description:
        'Site para divulgação e gerenciamento do time de futebol americano JF Imperadores, com informações da equipe, jogadores e eventos.',
      icon: Medal,
      tags: ['React', 'Next.js', 'TypeScript', 'Gestão Esportiva'],
      link: 'https://www.jfimperadores.com.br/imperadores',
      color: 'text-red-500',
      external: true,
    },
    {
      title: 'Sistema Fisiosport',
      description:
        'Sistema completo de gestão para clínicas de fisioterapia e pilates, com controle de pacientes, agendamentos, prontuários e relatórios.',
      icon: Activity,
      tags: ['React', 'Node.js', 'PostgreSQL', 'Material-UI'],
      link: 'https://sistema.fisiosport.com.br/',
      color: 'text-cyan-500',
      external: true,
    },
  ]

  return (
    <section id="projetos" className="bg-muted/50 py-24 sm:py-32">
      <div className="container px-4 md:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            Projetos em Destaque
          </h2>
          <p className="mt-4 text-muted-foreground">
            Alguns dos projetos que demonstram minhas habilidades e experiência
            em desenvolvimento.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-6xl gap-6 sm:grid-cols-2">
          {projects.map((project, index) => (
            <Card key={index} className="flex flex-col border-2">
              <CardHeader>
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <project.icon className={`h-6 w-6 ${project.color}`} />
                </div>
                <CardTitle>{project.title}</CardTitle>
                <CardDescription>{project.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="flex flex-wrap gap-2">
                  {project.tags.map((tag, tagIndex) => (
                    <Badge key={tagIndex} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full">
                  <Link
                    href={project.link}
                    target={project.external ? '_blank' : undefined}
                    rel={project.external ? 'noopener noreferrer' : undefined}
                  >
                    Ver Projeto <ExternalLink className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
