'use client'

import { Code2, Lightbulb, Zap } from 'lucide-react'

export function AboutSection() {
  const features = [
    {
      icon: Code2,
      title: 'Desenvolvimento Full Stack',
      description:
        'Experiência completa em frontend e backend, criando aplicações robustas e escaláveis.',
    },
    {
      icon: Zap,
      title: 'Performance & Otimização',
      description:
        'Foco em criar aplicações rápidas e eficientes com as melhores práticas.',
    },
    {
      icon: Lightbulb,
      title: 'Soluções Criativas',
      description:
        'Transformo ideias em produtos digitais funcionais e com ótima experiência do usuário.',
    },
  ]

  return (
    <section id="sobre" className="bg-brand-forest-2 py-24 sm:py-32">
      <div className="container px-4 md:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tighter text-brand-cream sm:text-4xl md:text-5xl">
            Sobre Mim
          </h2>
          <p className="mt-4 text-brand-mute">
            Desenvolvedor apaixonado por tecnologia e inovação, com foco em
            criar soluções que fazem a diferença.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <div
              key={index}
              className="rounded-lg border border-brand-forest-3 bg-brand-forest p-6"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-brand-emerald/10">
                <feature.icon className="h-6 w-6 text-brand-emerald" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-brand-cream">
                {feature.title}
              </h3>
              <p className="text-sm text-brand-mute">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
