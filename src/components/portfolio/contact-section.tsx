'use client'

import { Mail, MapPin, Phone, MessageCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export function ContactSection() {
  const contactInfo = [
    {
      icon: Mail,
      title: 'Email',
      value: 'fbc623@gmail.com',
      href: 'mailto:fbc623@gmail.com',
    },
    {
      icon: MapPin,
      title: 'Localização',
      value: 'Brasil',
      href: null,
    },
    {
      icon: Phone,
      title: 'Disponibilidade',
      value: 'Aberto a propostas',
      href: null,
    },
  ]

  return (
    <section id="contato" className="bg-muted/50 py-24 sm:py-32">
      <div className="container px-4 md:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            Vamos Trabalhar Juntos?
          </h2>
          <p className="mt-4 text-muted-foreground">
            Estou disponível para novos projetos e oportunidades. Entre em
            contato e vamos criar algo incrível!
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-4xl gap-6 sm:grid-cols-3">
          {contactInfo.map((info, index) => (
            <Card key={index}>
              <CardContent className="flex flex-col items-center pt-6 text-center">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <info.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-1 font-semibold">{info.title}</h3>
                {info.href ? (
                  <a
                    href={info.href}
                    className="text-sm text-muted-foreground hover:text-foreground hover:underline"
                  >
                    {info.value}
                  </a>
                ) : (
                  <p className="text-sm text-muted-foreground">{info.value}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Button size="lg" asChild>
            <a
              href="https://wa.me/5532991678449"
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Enviar WhatsApp
            </a>
          </Button>
        </div>
      </div>
    </section>
  )
}
