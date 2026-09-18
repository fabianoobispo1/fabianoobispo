import type { Metadata } from 'next'
import { Droplets, Gauge, LineChart, Mail, Sun } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import { EfficiencyDemo } from './_components/EfficiencyDemo'

export const metadata: Metadata = {
  title: 'Gestão de Usinas Solares',
  description:
    'Acompanhe a geração de energia e a limpeza das suas placas solares, e evite perder eficiência por sujeira acumulada.',
}

const features = [
  {
    icon: Gauge,
    title: 'Eficiência em tempo real',
    description:
      'Veja o quanto cada usina está perdendo de eficiência agora, calculado a partir dos dias sem limpeza.',
  },
  {
    icon: Droplets,
    title: 'Controle de limpeza',
    description:
      'Registre quando cada limpeza foi feita e receba um retrato claro de quais usinas precisam de atenção.',
  },
  {
    icon: LineChart,
    title: 'Histórico de geração',
    description:
      'Acompanhe a geração de energia ao longo do tempo e compare com o esperado para cada usina.',
  },
]

export default function SolarLandingPage() {
  return (
    <div className="bg-background text-foreground">
      <section className="relative overflow-hidden border-b">
        <div className="container mx-auto max-w-5xl px-4 py-24 text-center md:px-6">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs uppercase tracking-wider text-muted-foreground">
            <Sun className="h-3.5 w-3.5 text-amber-500" />
            Gestão de usinas solares
          </div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
            Sujeira nas placas está{' '}
            <span className="text-amber-500">custando energia</span> — e você
            provavelmente nem sabe o quanto.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Uma ferramenta simples pra donos de usina solar acompanharem geração
            de energia e limpeza das placas, e entenderem exatamente quanto a
            eficiência cai com o tempo sem manutenção.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <a href="#demo">Simular minha usina</a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="#contato">
                <Mail className="mr-2 h-4 w-4" />
                Quero uma demonstração
              </a>
            </Button>
          </div>
        </div>
      </section>

      <section className="container mx-auto max-w-5xl px-4 py-16 md:px-6">
        <div className="grid gap-6 sm:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title}>
              <CardHeader>
                <feature.icon className="h-8 w-8 text-amber-500" />
                <CardTitle className="text-base">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="container mx-auto max-w-5xl px-4 py-16 md:px-6">
        <div className="mx-auto mb-8 max-w-2xl text-center">
          <h2 className="text-2xl font-semibold sm:text-3xl">
            Veja o efeito da sujeira na prática
          </h2>
          <p className="mt-2 text-muted-foreground">
            Ajuste os valores abaixo e veja como a eficiência e a geração caem
            com o tempo sem limpeza.
          </p>
        </div>
        <EfficiencyDemo />
      </section>

      <section id="contato" className="border-t bg-muted/30 py-16">
        <div className="container mx-auto max-w-2xl px-4 text-center md:px-6">
          <h2 className="text-2xl font-semibold sm:text-3xl">
            Quer acompanhar as usinas com essa ferramenta?
          </h2>
          <p className="mt-3 text-muted-foreground">
            Este é um projeto em fase inicial. Fale com a gente e conte quantas
            usinas você gerencia hoje pra entendermos o que faz sentido
            construir primeiro.
          </p>
          <Button asChild size="lg" className="mt-6">
            <a href="mailto:fbc623@gmail.com?subject=Gest%C3%A3o%20de%20usinas%20solares">
              <Mail className="mr-2 h-4 w-4" />
              Falar com a gente
            </a>
          </Button>
        </div>
      </section>
    </div>
  )
}
